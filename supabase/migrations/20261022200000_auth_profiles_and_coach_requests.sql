alter table public.users
  add column email text,
  add column first_name text,
  add column last_name text;

revoke update on table public.users from authenticated;
grant update (email, first_name, last_name)
  on table public.users
  to authenticated;

create policy users_update_own_profile
  on public.users
  for update
  to authenticated
  using (id = (select auth.jwt() ->> 'sub'))
  with check (id = (select auth.jwt() ->> 'sub'));

create table public.coach_requests (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users (id) on delete restrict,
  status text not null default 'pending'
    constraint coach_requests_status_check
      check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index coach_requests_user_created_at_idx
  on public.coach_requests (user_id, created_at desc);

create unique index coach_requests_one_pending_per_user_idx
  on public.coach_requests (user_id)
  where status = 'pending';

alter table public.coach_requests enable row level security;

revoke all on table public.coach_requests from anon, authenticated;
grant select on table public.coach_requests to authenticated;
grant insert (user_id) on table public.coach_requests to authenticated;
grant all on table public.coach_requests to service_role;

create policy coach_requests_select_own
  on public.coach_requests
  for select
  to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));

create policy coach_requests_insert_own_member
  on public.coach_requests
  for insert
  to authenticated
  with check (
    user_id = (select auth.jwt() ->> 'sub')
    and exists (
      select 1
      from public.users
      where id = (select auth.jwt() ->> 'sub')
        and role = 'member'
    )
  );

create or replace function public.provision_user_profile(
  p_user_id text,
  p_email text,
  p_first_name text,
  p_last_name text
)
returns text
language sql
security definer
set search_path = ''
as $$
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
  returning existing_profile.role;
$$;

revoke all on function public.provision_user_profile(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.provision_user_profile(text, text, text, text)
  to service_role;
