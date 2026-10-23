-- Phase 11: Gym Membership pricing update (USD 25.00 / PHP 1585.00)
-- and auto-provisioning default subscriptions for new and existing users.

-- 1. Update Gym Membership Pricing Plan
update public.pricing_plans
  set is_active = false
  where plan_type = 'gym'
    and is_active;

insert into public.pricing_plans (
  plan_type,
  display_amount,
  display_currency,
  billing_amount_php,
  is_active
)
values ('gym', 25.00, 'USD', 1585.00, true);

-- 2. Trigger function to auto-provision default subscription rows on user creation
create or replace function public.handle_new_user_subscriptions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.subscriptions_app (user_id, active, expires_at, cancelled_at)
  values (new.id, false, null, null)
  on conflict (user_id) do nothing;

  insert into public.subscriptions_gym (user_id, active, expires_at, cancelled_at)
  values (new.id, false, null, null)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user_subscriptions()
  from public, anon, authenticated;
grant execute on function public.handle_new_user_subscriptions()
  to service_role;

drop trigger if exists on_user_created_subscriptions on public.users;

create trigger on_user_created_subscriptions
  after insert on public.users
  for each row execute function public.handle_new_user_subscriptions();

-- 3. Update provision_user_profile to defensively ensure subscription rows exist
create or replace function public.provision_user_profile(
  p_user_id text,
  p_email text,
  p_first_name text,
  p_last_name text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  insert into public.users as existing_profile (
    id,
    role,
    email,
    first_name,
    last_name
  )
  values (
    p_user_id,
    'member',
    nullif(p_email, ''),
    nullif(p_first_name, ''),
    nullif(p_last_name, '')
  )
  on conflict (id) do update
  set
    email = coalesce(nullif(existing_profile.email, ''), excluded.email),
    first_name = coalesce(
      nullif(existing_profile.first_name, ''),
      excluded.first_name
    ),
    last_name = coalesce(
      nullif(existing_profile.last_name, ''),
      excluded.last_name
    )
  returning existing_profile.role into v_role;

  insert into public.subscriptions_app (user_id, active, expires_at, cancelled_at)
  values (p_user_id, false, null, null)
  on conflict (user_id) do nothing;

  insert into public.subscriptions_gym (user_id, active, expires_at, cancelled_at)
  values (p_user_id, false, null, null)
  on conflict (user_id) do nothing;

  return v_role;
end;
$$;

revoke all on function public.provision_user_profile(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.provision_user_profile(text, text, text, text)
  to service_role;

-- 4. Backfill existing users who may not have subscription rows yet
insert into public.subscriptions_app (user_id, active, expires_at, cancelled_at)
select id, false, null, null
from public.users
on conflict (user_id) do nothing;

insert into public.subscriptions_gym (user_id, active, expires_at, cancelled_at)
select id, false, null, null
from public.users
on conflict (user_id) do nothing;
