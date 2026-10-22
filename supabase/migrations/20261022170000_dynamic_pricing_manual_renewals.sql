create table public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  plan_type text not null
    constraint pricing_plans_type_check check (plan_type in ('app', 'gym')),
  display_amount numeric(10, 2) not null
    constraint pricing_plans_display_amount_positive check (display_amount > 0),
  display_currency text not null
    constraint pricing_plans_display_currency_check
      check (display_currency ~ '^[A-Z]{3}$'),
  billing_amount_php numeric(10, 2) not null
    constraint pricing_plans_billing_amount_positive
      check (billing_amount_php > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index pricing_plans_one_active_per_type_idx
  on public.pricing_plans (plan_type)
  where is_active;

create table public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  checkout_session_id text not null unique,
  user_id text not null references public.users (id) on delete restrict,
  pricing_plan_id uuid not null
    references public.pricing_plans (id) on delete restrict,
  plan_type text not null
    constraint subscription_payments_type_check
      check (plan_type in ('app', 'gym')),
  paid_amount_centavos bigint not null
    constraint subscription_payments_amount_positive
      check (paid_amount_centavos > 0),
  paid_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.pricing_plans enable row level security;
alter table public.subscription_payments enable row level security;

revoke all on table public.pricing_plans from public, anon, authenticated;
revoke all on table public.subscription_payments
  from public, anon, authenticated;

grant select on table public.pricing_plans to authenticated;
grant all on table public.pricing_plans to service_role;
grant all on table public.subscription_payments to service_role;

create policy pricing_plans_select_active
  on public.pricing_plans
  for select
  to authenticated
  using (is_active);

insert into public.pricing_plans (
  plan_type,
  display_amount,
  display_currency,
  billing_amount_php,
  is_active
)
values
  ('app', 3.00, 'USD', 170.00, true),
  ('gym', 3.00, 'USD', 170.00, true);

create or replace function public.apply_paid_subscription_checkout(
  p_checkout_session_id text,
  p_user_id text,
  p_pricing_plan_id uuid,
  p_plan_type text,
  p_paid_amount_centavos bigint,
  p_paid_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_role text;
  v_plan_type text;
  v_billing_amount_php numeric(10, 2);
  v_rows_inserted integer;
  v_existing_user_id text;
  v_existing_plan_id uuid;
  v_existing_plan_type text;
  v_existing_amount bigint;
  v_existing_paid_at timestamptz;
begin
  if p_checkout_session_id is null or btrim(p_checkout_session_id) = ''
    or p_user_id is null or btrim(p_user_id) = ''
    or p_plan_type is null or p_plan_type not in ('app', 'gym')
    or p_paid_amount_centavos is null or p_paid_amount_centavos <= 0
    or p_paid_at is null or p_paid_at > statement_timestamp()
  then
    raise exception using errcode = '22023', message = 'invalid_payment';
  end if;

  select u.role
    into v_role
    from public.users as u
    where u.id = p_user_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'user_not_found';
  end if;

  if (p_plan_type = 'gym' and v_role <> 'member')
    or (p_plan_type = 'app' and v_role not in ('member', 'coach'))
  then
    raise exception using errcode = '42501', message = 'role_not_allowed';
  end if;

  select p.plan_type, p.billing_amount_php
    into v_plan_type, v_billing_amount_php
    from public.pricing_plans as p
    where p.id = p_pricing_plan_id;

  if not found
    or v_plan_type <> p_plan_type
    or v_billing_amount_php * 100 <> p_paid_amount_centavos
  then
    raise exception using errcode = '22023', message = 'plan_amount_mismatch';
  end if;

  insert into public.subscription_payments (
    checkout_session_id,
    user_id,
    pricing_plan_id,
    plan_type,
    paid_amount_centavos,
    paid_at
  )
  values (
    p_checkout_session_id,
    p_user_id,
    p_pricing_plan_id,
    p_plan_type,
    p_paid_amount_centavos,
    p_paid_at
  )
  on conflict (checkout_session_id) do nothing;

  get diagnostics v_rows_inserted = row_count;

  if v_rows_inserted = 0 then
    select
      payment.user_id,
      payment.pricing_plan_id,
      payment.plan_type,
      payment.paid_amount_centavos,
      payment.paid_at
    into
      v_existing_user_id,
      v_existing_plan_id,
      v_existing_plan_type,
      v_existing_amount,
      v_existing_paid_at
    from public.subscription_payments as payment
    where payment.checkout_session_id = p_checkout_session_id;

    if v_existing_user_id is distinct from p_user_id
      or v_existing_plan_id is distinct from p_pricing_plan_id
      or v_existing_plan_type is distinct from p_plan_type
      or v_existing_amount is distinct from p_paid_amount_centavos
      or v_existing_paid_at is distinct from p_paid_at
    then
      raise exception using errcode = '23505',
        message = 'checkout_session_conflict';
    end if;

    return false;
  end if;

  if p_plan_type = 'app' then
    update public.subscriptions_app as subscription
      set
        active = true,
        expires_at = (
          greatest(
            coalesce(subscription.expires_at, p_paid_at),
            p_paid_at
          ) + interval '1 month'
        ),
        cancelled_at = null
      where subscription.user_id = p_user_id;
  else
    update public.subscriptions_gym as subscription
      set
        active = true,
        expires_at = (
          greatest(
            coalesce(subscription.expires_at, p_paid_at),
            p_paid_at
          ) + interval '1 month'
        ),
        cancelled_at = null
      where subscription.user_id = p_user_id;
  end if;

  if not found then
    raise exception using errcode = 'P0002',
      message = 'subscription_not_provisioned';
  end if;

  return true;
end;
$function$;

revoke all on function public.apply_paid_subscription_checkout(
  text,
  text,
  uuid,
  text,
  bigint,
  timestamptz
) from public, anon, authenticated;
grant execute on function public.apply_paid_subscription_checkout(
  text,
  text,
  uuid,
  text,
  bigint,
  timestamptz
) to service_role;

create or replace function public.cancel_subscription_period(
  p_user_id text,
  p_plan_type text
)
returns table(cancelled_at timestamptz, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_role text;
  v_cancelled_at timestamptz;
  v_expires_at timestamptz;
begin
  if p_user_id is null or btrim(p_user_id) = ''
    or p_plan_type is null or p_plan_type not in ('app', 'gym')
  then
    raise exception using errcode = '22023', message = 'invalid_cancellation';
  end if;

  select u.role
    into v_role
    from public.users as u
    where u.id = p_user_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'user_not_found';
  end if;

  if (p_plan_type = 'gym' and v_role <> 'member')
    or (p_plan_type = 'app' and v_role not in ('member', 'coach'))
  then
    raise exception using errcode = '42501', message = 'role_not_allowed';
  end if;

  if p_plan_type = 'app' then
    update public.subscriptions_app as subscription
      set cancelled_at = coalesce(
        subscription.cancelled_at,
        statement_timestamp()
      )
      where subscription.user_id = p_user_id
        and subscription.active
        and subscription.expires_at > statement_timestamp()
      returning subscription.cancelled_at, subscription.expires_at
      into v_cancelled_at, v_expires_at;
  else
    update public.subscriptions_gym as subscription
      set cancelled_at = coalesce(
        subscription.cancelled_at,
        statement_timestamp()
      )
      where subscription.user_id = p_user_id
        and subscription.active
        and subscription.expires_at > statement_timestamp()
      returning subscription.cancelled_at, subscription.expires_at
      into v_cancelled_at, v_expires_at;
  end if;

  if not found then
    raise exception using errcode = 'P0002',
      message = 'subscription_not_active';
  end if;

  return query select v_cancelled_at, v_expires_at;
end;
$function$;

revoke all on function public.cancel_subscription_period(text, text)
  from public, anon, authenticated;
grant execute on function public.cancel_subscription_period(text, text)
  to service_role;
