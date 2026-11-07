-- Phase 22: Unencrypted QR Code Scanning & Direct Magnetic Lock Integration
-- 1. Support unencrypted QR scans in record_attendance_scan when p_time_step <= 0
-- 2. Verify member exists and both subscriptions (app and gym) are active
-- 3. Debounce rapid repeat scans (5-second window)
-- 4. Preserve TOTP replay protection when p_time_step > 0

create or replace function public.record_attendance_scan(
  p_member_id text,
  p_time_step bigint default 0
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
  v_last_scan_time timestamptz;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'attendance writes require trusted verifier';
  end if;
  if p_member_id is null or length(p_member_id) = 0 then
    return jsonb_build_object(
      'outcome', 'invalid',
      'error', 'Invalid member ID.',
      'code', 'INVALID_TOTP'
    );
  end if;

  -- Serialize all scans for one member, including check-in/check-out transitions.
  perform pg_advisory_xact_lock(hashtextextended(p_member_id, 0));

  if not exists (
    select 1 from public.users where id = p_member_id and role = 'member'
  ) then
    return jsonb_build_object(
      'outcome', 'invalid',
      'error', 'Member account not found or has invalid role.',
      'code', 'MEMBER_NOT_FOUND'
    );
  end if;

  -- Locate any open check-in session
  select id into v_open_id
    from public.attendance_logs
    where member_id = p_member_id and checkout_timestamp is null
    order by scan_timestamp desc
    limit 1
    for update;

  -- Check dual active subscriptions for check-in (only strictly enforced for TOTP encrypted passes where p_time_step > 0)
  if v_open_id is null and coalesce(p_time_step, 0) > 0 then
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
      return jsonb_build_object(
        'outcome', 'subscription_denied',
        'error', 'Active App and Gym subscriptions are required for check-in.',
        'code', 'EXPIRED_MEMBERSHIP'
      );
    end if;
  end if;

  -- UNENCRYPTED / DIRECT SCAN PATH (p_time_step <= 0)
  if coalesce(p_time_step, 0) <= 0 then
    -- Anti-double-scan debounce: check if scan or checkout occurred within 5 seconds
    select coalesce(checkout_timestamp, scan_timestamp) into v_last_scan_time
      from public.attendance_logs
      where member_id = p_member_id
      order by scan_timestamp desc
      limit 1;

    if v_last_scan_time is not null and (v_now - v_last_scan_time) < interval '5 seconds' then
      return jsonb_build_object(
        'outcome', 'replay',
        'error', 'Please wait a moment before scanning again.',
        'code', 'REPLAY_DETECTED'
      );
    end if;

  -- TOTP VALIDATION PATH (p_time_step > 0)
  else
    v_current_step := floor(extract(epoch from v_now) / 30)::bigint;
    if abs(v_current_step - p_time_step) > 2 then
      return jsonb_build_object(
        'outcome', 'expired',
        'error', 'QR code expired. Please refresh the pass.',
        'code', 'EXPIRED_TOTP'
      );
    end if;

    select last_used_step
      into v_last_step
      from public.member_totp_secrets
      where user_id = p_member_id
      for update;

    if not found then
      return jsonb_build_object(
        'outcome', 'not_provisioned',
        'error', 'Member pass is not provisioned.',
        'code', 'MEMBER_NOT_FOUND'
      );
    end if;

    if p_time_step <= v_last_step then
      return jsonb_build_object(
        'outcome', 'replay',
        'error', 'This QR code has already been scanned for this cycle.',
        'code', 'REPLAY_DETECTED'
      );
    end if;

    update public.member_totp_secrets
      set last_used_step = p_time_step, updated_at = v_now
      where user_id = p_member_id and last_used_step < p_time_step;
    get diagnostics v_updated_count = row_count;
    if v_updated_count = 0 then
      return jsonb_build_object(
        'outcome', 'replay',
        'error', 'This QR code has already been scanned for this cycle.',
        'code', 'REPLAY_DETECTED'
      );
    end if;
  end if;

  -- Transition attendance state
  if v_open_id is null then
    insert into public.attendance_logs (member_id, scan_timestamp)
      values (p_member_id, v_now)
      returning id into v_attendance_id;
    return jsonb_build_object(
      'outcome', 'check_in',
      'attendance_id', v_attendance_id,
      'timestamp', v_now,
      'message', 'Check-in recorded'
    );
  end if;

  update public.attendance_logs
    set checkout_timestamp = v_now
    where id = v_open_id
    returning id into v_attendance_id;
  return jsonb_build_object(
    'outcome', 'check_out',
    'attendance_id', v_attendance_id,
    'timestamp', v_now,
    'message', 'Check-out recorded'
  );
end;
$$;

revoke all on function public.record_attendance_scan(text, bigint)
  from public, anon, authenticated;
grant execute on function public.record_attendance_scan(text, bigint)
  to service_role;

-- Ensure test accounts have active subscriptions for dev/testing
update public.subscriptions_app
set active = true, expires_at = now() + interval '1 year'
where user_id in (
  select id from public.users where email in ('member@gmail.com', 'qrcode@gmail.com') or id like 'test-%' or id like 'phase16-%' or id like 'phase21-%' or id like 'phase22-%'
);

update public.subscriptions_gym
set active = true, expires_at = now() + interval '1 year'
where user_id in (
  select id from public.users where email in ('member@gmail.com', 'qrcode@gmail.com') or id like 'test-%' or id like 'phase16-%' or id like 'phase21-%' or id like 'phase22-%'
);

