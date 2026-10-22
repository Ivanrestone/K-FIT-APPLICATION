create table public.users (
  id text primary key,
  role text not null default 'member'
    constraint users_role_check check (role in ('member', 'coach', 'admin')),
  created_at timestamptz not null default now()
);

create table public.subscriptions_app (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique
    references public.users (id) on delete restrict,
  active boolean not null default false,
  expires_at timestamptz,
  cancelled_at timestamptz
);

create table public.subscriptions_gym (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique
    references public.users (id) on delete restrict,
  active boolean not null default false,
  expires_at timestamptz,
  cancelled_at timestamptz
);

create table public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  member_id text not null
    references public.users (id) on delete restrict,
  scan_timestamp timestamptz not null default now()
);

create index attendance_logs_member_scan_timestamp_idx
  on public.attendance_logs (member_id, scan_timestamp desc);

alter table public.users enable row level security;
alter table public.subscriptions_app enable row level security;
alter table public.subscriptions_gym enable row level security;
alter table public.attendance_logs enable row level security;

revoke all on table public.users from anon, authenticated;
revoke all on table public.subscriptions_app from anon, authenticated;
revoke all on table public.subscriptions_gym from anon, authenticated;
revoke all on table public.attendance_logs from anon, authenticated;

grant select on table public.users to authenticated;
grant select on table public.subscriptions_app to authenticated;
grant select on table public.subscriptions_gym to authenticated;
grant select on table public.attendance_logs to authenticated;
grant all on table public.users to service_role;
grant all on table public.subscriptions_app to service_role;
grant all on table public.subscriptions_gym to service_role;
grant all on table public.attendance_logs to service_role;

create policy users_select_own
  on public.users
  for select
  to authenticated
  using (id = (select auth.jwt() ->> 'sub'));

create policy subscriptions_app_select_own
  on public.subscriptions_app
  for select
  to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));

create policy subscriptions_gym_select_own
  on public.subscriptions_gym
  for select
  to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));

create policy attendance_logs_select_own
  on public.attendance_logs
  for select
  to authenticated
  using (member_id = (select auth.jwt() ->> 'sub'));
