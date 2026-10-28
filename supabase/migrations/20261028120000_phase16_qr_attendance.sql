-- Phase 16: retain existing check-in timestamps and add nullable check-out times.
alter table public.attendance_logs
  add column if not exists checkout_timestamp timestamptz;

create index if not exists attendance_logs_member_checkout_idx
  on public.attendance_logs (member_id, checkout_timestamp, scan_timestamp desc);

-- TOTP secrets are encrypted by the trusted Edge Function before persistence.
-- Clients have no direct access to this table or the attendance write RPC.
create table if not exists public.member_totp_secrets (
  user_id text primary key
    references public.users (id) on delete restrict,
  encrypted_secret text not null,
  last_used_step bigint not null default -1 check (last_used_step >= -1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.member_totp_secrets enable row level security;
revoke all on table public.member_totp_secrets from anon, authenticated;
grant all on table public.member_totp_secrets to service_role;

create or replace function public.provision_attendance_secret(
  p_member_id text,
  p_encrypted_secret text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'attendance provisioning requires trusted verifier';
  end if;
  if p_member_id is null or p_encrypted_secret is null or length(p_encrypted_secret) > 2048 then
    raise exception 'invalid attendance secret';
  end if;
  if not exists (select 1 from public.users where id = p_member_id and role = 'member') then
    raise exception 'member account not found';
  end if;
  if exists (
    select 1 from public.member_totp_secrets
    where user_id = p_member_id and encrypted_secret = p_encrypted_secret
  ) then
    return 'unchanged';
  end if;
  insert into public.member_totp_secrets (user_id, encrypted_secret, last_used_step)
    values (p_member_id, p_encrypted_secret, -1)
    on conflict (user_id) do update
      set encrypted_secret = excluded.encrypted_secret,
          last_used_step = -1,
          updated_at = clock_timestamp();
  return 'provisioned';
end;
$$;

revoke all on function public.provision_attendance_secret(text, text)
  from public, anon, authenticated;
grant execute on function public.provision_attendance_secret(text, text)
  to service_role;

create or replace function public.record_attendance_scan(
  p_member_id text,
  p_time_step bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_current_step bigint;
  v_last_step bigint;
  v_open_id uuid;
  v_attendance_id uuid;
  v_updated_count integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'attendance writes require trusted verifier';
  end if;
  if p_member_id is null or length(p_member_id) = 0 or p_time_step < 0 then
    return jsonb_build_object('outcome', 'invalid');
  end if;

  -- Serialize all scans for one member, including check-in/check-out transitions.
  perform pg_advisory_xact_lock(hashtextextended(p_member_id, 0));
  v_current_step := floor(extract(epoch from v_now) / 30)::bigint;
  if abs(v_current_step - p_time_step) > 1 then
    return jsonb_build_object('outcome', 'expired');
  end if;

  select last_used_step
    into v_last_step
    from public.member_totp_secrets
    where user_id = p_member_id
    for update;
  if not found then
    return jsonb_build_object('outcome', 'not_provisioned');
  end if;
  if not exists (
    select 1 from public.users where id = p_member_id and role = 'member'
  ) then
    return jsonb_build_object('outcome', 'invalid');
  end if;
  if p_time_step <= v_last_step then
    return jsonb_build_object('outcome', 'replay');
  end if;
  -- The authenticated Edge Function has verified the signed session and TOTP.
  -- This transaction serializes consumption and the attendance state transition.
  select id into v_open_id
    from public.attendance_logs
    where member_id = p_member_id and checkout_timestamp is null
    order by scan_timestamp desc
    limit 1
    for update;

  if v_open_id is null then
    if not exists (
      select 1
        from public.users u
        join public.subscriptions_app app on app.user_id = u.id
        join public.subscriptions_gym gym on gym.user_id = u.id
        where u.id = p_member_id
          and u.role = 'member'
          and app.active and app.expires_at > v_now
          and gym.active and gym.expires_at > v_now
    ) then
      return jsonb_build_object('outcome', 'subscription_denied');
    end if;
  end if;

  -- Claim the QR step only if it is still unused; concurrent requests cannot
  -- consume the same code or toggle the session twice.
  update public.member_totp_secrets
    set last_used_step = p_time_step, updated_at = v_now
    where user_id = p_member_id and last_used_step < p_time_step;
  get diagnostics v_updated_count = row_count;
  if v_updated_count = 0 then
    return jsonb_build_object('outcome', 'replay');
  end if;

  if v_open_id is null then
    insert into public.attendance_logs (member_id, scan_timestamp)
      values (p_member_id, v_now)
      returning id into v_attendance_id;
    return jsonb_build_object(
      'outcome', 'check_in', 'attendance_id', v_attendance_id, 'timestamp', v_now
    );
  end if;

  update public.attendance_logs
    set checkout_timestamp = v_now
    where id = v_open_id
    returning id into v_attendance_id;
  return jsonb_build_object(
    'outcome', 'check_out', 'attendance_id', v_attendance_id, 'timestamp', v_now
  );
end;
$$;

revoke all on function public.record_attendance_scan(text, bigint)
  from public, anon, authenticated;
grant execute on function public.record_attendance_scan(text, bigint)
  to service_role;
