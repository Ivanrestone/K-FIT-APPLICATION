create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.users (
  id text primary key,
  role text not null default 'member'
    constraint users_role_check check (role in ('member', 'coach', 'admin')),
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique
    references public.users (id) on delete restrict,
  app_fee_active boolean not null default false,
  gym_membership_active boolean not null default false
);

create table public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  member_id text not null
    references public.users (id) on delete restrict,
  scan_timestamp timestamptz not null default now()
);

create index attendance_logs_member_scan_timestamp_idx
  on public.attendance_logs (member_id, scan_timestamp desc);

create or replace function private.member_has_active_subscriptions(p_user_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    lower(coalesce((select auth.jwt() ->> 'email'), '')) = lower('Scanner@gmail.com')
    and coalesce((select auth.jwt() ->> 'iss'), '') ~ '^https?://[^/]+/auth/v1$'
    and exists (
      select 1
      from public.subscriptions as s
      where s.user_id = p_user_id
        and s.app_fee_active
        and s.gym_membership_active
    );
$function$;

revoke all on function private.member_has_active_subscriptions(text) from public, anon;
grant execute on function private.member_has_active_subscriptions(text) to authenticated;

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.attendance_logs enable row level security;

revoke all on table public.users from anon, authenticated;
revoke all on table public.subscriptions from anon, authenticated;
revoke all on table public.attendance_logs from anon, authenticated;

grant select on table public.users to authenticated;
grant select on table public.subscriptions to authenticated;
grant select on table public.attendance_logs to authenticated;
grant insert (member_id) on table public.attendance_logs to authenticated;
grant all on table public.users to service_role;
grant all on table public.subscriptions to service_role;
grant all on table public.attendance_logs to service_role;

create policy users_select_own
  on public.users
  for select
  to authenticated
  using (id = (select auth.jwt() ->> 'sub'));

create policy subscriptions_select_own
  on public.subscriptions
  for select
  to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));

create policy attendance_logs_select_own
  on public.attendance_logs
  for select
  to authenticated
  using (member_id = (select auth.jwt() ->> 'sub'));

create policy attendance_logs_development_scanner_insert
  on public.attendance_logs
  for insert
  to authenticated
  with check (
    lower(coalesce((select auth.jwt() ->> 'email'), '')) = lower('Scanner@gmail.com')
    and coalesce((select auth.jwt() ->> 'iss'), '') ~ '^https?://[^/]+/auth/v1$'
    and (select private.member_has_active_subscriptions(member_id))
  );
