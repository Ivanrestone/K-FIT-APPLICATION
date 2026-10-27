-- Add full_name and password columns
alter table public.users
  add column full_name text,
  add column password text;

-- Update grant for new columns
grant update (full_name, password) on table public.users to authenticated;

-- Update policy to include new columns
drop policy if exists users_update_own_profile on public.users;

create policy users_update_own_profile
  on public.users
  for update
  to authenticated
  using (id = (select auth.jwt() ->> 'sub'))
  with check (id = (select auth.jwt() ->> 'sub'));

-- Update provision_user_profile function to use full_name
create or replace function public.provision_user_profile(
  p_user_id text,
  p_email text,
  p_full_name text,
  p_password text
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
    full_name,
    password
  )
  values (
    p_user_id,
    'member',
    nullif(p_email, ''),
    nullif(p_full_name, ''),
    nullif(p_password, '')
  )
  on conflict (id) do update
  set
    email = coalesce(nullif(existing_profile.email, ''), excluded.email),
    full_name = coalesce(
      nullif(existing_profile.full_name, ''),
      excluded.full_name
    ),
    password = coalesce(
      nullif(existing_profile.password, ''),
      excluded.password
    )
  returning existing_profile.role;
$$;

-- Re-grant permissions
revoke all on function public.provision_user_profile(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.provision_user_profile(text, text, text, text)
  to service_role, anon, authenticated;
