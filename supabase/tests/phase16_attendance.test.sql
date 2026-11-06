begin;

select plan(14);

insert into public.users (id, role)
values
  ('phase16-test-active', 'member'),
  ('phase16-test-no-app', 'member'),
  ('phase16-test-no-gym', 'member'),
  ('phase16-test-other', 'member');

update public.subscriptions_app
set active = true, expires_at = now() + interval '1 day'
where user_id = 'phase16-test-active';
update public.subscriptions_gym
set active = true, expires_at = now() + interval '1 day'
where user_id in ('phase16-test-active', 'phase16-test-no-app');
update public.subscriptions_app
set active = true, expires_at = now() + interval '1 day'
where user_id = 'phase16-test-no-gym';

set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

insert into public.member_totp_secrets (user_id, encrypted_secret, last_used_step)
values
  ('phase16-test-active', 'test-encrypted-secret-active', -1),
  ('phase16-test-no-app', 'test-encrypted-secret-no-app', -1),
  ('phase16-test-no-gym', 'test-encrypted-secret-no-gym', -1),
  ('phase16-test-other', 'test-encrypted-secret-other', -1);
insert into public.attendance_logs (member_id, scan_timestamp)
values ('phase16-test-other', now());

select set_config(
  'test.phase16_time_step',
  floor(extract(epoch from clock_timestamp()) / 30)::bigint::text,
  true
);

select is(
  public.record_attendance_scan(
    'phase16-test-active', current_setting('test.phase16_time_step')::bigint
  )->>'outcome',
  'check_in',
  'active member scan records a check-in'
);
select is(
  (select count(*)::integer from public.attendance_logs
   where member_id = 'phase16-test-active' and checkout_timestamp is null),
  1,
  'check-in creates exactly one open attendance row'
);
select is(
  public.record_attendance_scan(
    'phase16-test-active', current_setting('test.phase16_time_step')::bigint
  )->>'outcome',
  'replay',
  'a consumed time-step is rejected as a replay'
);
select is(
  (select count(*)::integer from public.attendance_logs
   where member_id = 'phase16-test-active'),
  1,
  'replayed scans do not create another attendance row'
);
select is(
  public.record_attendance_scan(
    'phase16-test-active', current_setting('test.phase16_time_step')::bigint + 1
  )->>'outcome',
  'check_out',
  'a fresh time-step closes the active attendance session'
);
select ok(
  (select checkout_timestamp >= scan_timestamp
   from public.attendance_logs
   where member_id = 'phase16-test-active'),
  'checkout timestamp is persisted and not earlier than check-in'
);
select is(
  public.record_attendance_scan(
    'phase16-test-no-app', floor(extract(epoch from clock_timestamp()) / 30)::bigint
  )->>'outcome',
  'subscription_denied',
  'inactive app subscription denies check-in even when gym access is active'
);
select is(
  public.record_attendance_scan(
    'phase16-test-no-gym', floor(extract(epoch from clock_timestamp()) / 30)::bigint
  )->>'outcome',
  'subscription_denied',
  'inactive gym subscription denies check-in even when app access is active'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"phase16-test-active"}',
  true
);

select is(
  (select count(*)::integer from public.attendance_logs),
  1,
  'member history RLS returns only the signed-in member attendance rows'
);
select is(
  (select count(*)::integer from public.attendance_logs
   where member_id = 'phase16-test-other'),
  0,
  'member cannot read another member attendance history'
);
select ok(
  not has_table_privilege('authenticated', 'public.member_totp_secrets', 'SELECT'),
  'members cannot directly read encrypted TOTP secrets'
);
select ok(
  not has_table_privilege('authenticated', 'public.attendance_logs', 'INSERT'),
  'members cannot directly insert attendance rows'
);
select ok(
  not has_table_privilege(
    'authenticated',
    'public.record_attendance_scan(text,bigint)',
    'EXECUTE'
  ),
  'members cannot execute the trusted attendance write function'
);
select throws_ok(
  $$select public.record_attendance_scan('phase16-test-other', 0)$$,
  '42501',
  null,
  'unauthorized member attendance write is denied'
);

select * from finish();
rollback;
