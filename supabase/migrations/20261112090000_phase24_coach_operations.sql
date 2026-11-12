-- Phase 24: Admin Coach Onboarding, Coaching Operations & Reminders
--
-- Adds the coaching domain the Coach Workspace and Admin Coaching Team screens
-- read from: coach profiles, weekly availability, 1:1 training sessions, group
-- fitness classes with reservations, per-member workout routines, and stored
-- notifications. Everything is additive; no existing table or row is changed
-- except new staff read access on `users`.

/* ───────────────────────── Staff helpers ───────────────────────── */

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.users where id = (select auth.jwt() ->> 'sub');
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role in ('coach', 'admin') from public.users where id = (select auth.jwt() ->> 'sub')),
    false
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role = 'admin' from public.users where id = (select auth.jwt() ->> 'sub')),
    false
  );
$$;

revoke all on function public.current_app_role() from public, anon;
revoke all on function public.is_staff() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;

/* Staff (coaches and admins) need to read member profiles for the roster,
   session requests, class check-in and reminders. Members keep their own row
   through the existing users_select_own policy. */
create policy users_select_staff
  on public.users
  for select
  to authenticated
  using (public.is_staff());

/* ───────────────────────── Coach profiles ───────────────────────── */

create table public.coach_profiles (
  user_id text primary key references public.users (id) on delete cascade,
  specialty text not null default '',
  bio text not null default '',
  hourly_rate numeric(10, 2) not null default 0
    constraint coach_profiles_hourly_rate_check check (hourly_rate >= 0),
  duty_status text not null default 'on_floor'
    constraint coach_profiles_duty_status_check
      check (duty_status in ('on_floor', 'in_session', 'on_break', 'off_duty')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index coach_profiles_duty_status_idx on public.coach_profiles (duty_status);

alter table public.coach_profiles enable row level security;

revoke all on table public.coach_profiles from anon, authenticated;
grant select, insert, update on table public.coach_profiles to authenticated;
grant all on table public.coach_profiles to service_role;

create policy coach_profiles_select
  on public.coach_profiles
  for select
  to authenticated
  using (public.is_staff() or user_id = (select auth.jwt() ->> 'sub'));

create policy coach_profiles_insert_staff
  on public.coach_profiles
  for insert
  to authenticated
  with check (public.is_staff());

create policy coach_profiles_update
  on public.coach_profiles
  for update
  to authenticated
  using (public.is_staff() or user_id = (select auth.jwt() ->> 'sub'))
  with check (public.is_staff() or user_id = (select auth.jwt() ->> 'sub'));

/* ───────────────────────── Weekly availability ───────────────────────── */

create table public.coach_availability (
  id uuid primary key default gen_random_uuid(),
  coach_id text not null references public.users (id) on delete cascade,
  weekday integer not null
    constraint coach_availability_weekday_check check (weekday between 0 and 6),
  start_minutes integer not null
    constraint coach_availability_start_check check (start_minutes between 0 and 1439),
  end_minutes integer not null
    constraint coach_availability_end_check check (end_minutes between 1 and 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coach_availability_window_check check (end_minutes > start_minutes)
);

create unique index coach_availability_coach_weekday_idx
  on public.coach_availability (coach_id, weekday);

alter table public.coach_availability enable row level security;

revoke all on table public.coach_availability from anon, authenticated;
grant select, insert, update, delete on table public.coach_availability to authenticated;
grant all on table public.coach_availability to service_role;

create policy coach_availability_select
  on public.coach_availability
  for select
  to authenticated
  using (true);

create policy coach_availability_write
  on public.coach_availability
  for all
  to authenticated
  using (public.is_staff() and coach_id = (select auth.jwt() ->> 'sub') or public.is_admin())
  with check (public.is_staff() and coach_id = (select auth.jwt() ->> 'sub') or public.is_admin());

/* ───────────────────────── 1:1 training sessions ───────────────────────── */

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  coach_id text not null references public.users (id) on delete restrict,
  member_id text not null references public.users (id) on delete restrict,
  focus text not null default 'Coaching session',
  location text not null default 'Floor 1',
  starts_at timestamptz not null,
  duration_minutes integer not null default 60
    constraint training_sessions_duration_check check (duration_minutes between 15 and 240),
  status text not null default 'pending'
    constraint training_sessions_status_check
      check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index training_sessions_coach_starts_idx
  on public.training_sessions (coach_id, starts_at desc);
create index training_sessions_member_starts_idx
  on public.training_sessions (member_id, starts_at desc);

alter table public.training_sessions enable row level security;

revoke all on table public.training_sessions from anon, authenticated;
grant select, insert, update on table public.training_sessions to authenticated;
grant all on table public.training_sessions to service_role;

create policy training_sessions_select
  on public.training_sessions
  for select
  to authenticated
  using (
    public.is_staff()
    or member_id = (select auth.jwt() ->> 'sub')
    or coach_id = (select auth.jwt() ->> 'sub')
  );

create policy training_sessions_insert_staff
  on public.training_sessions
  for insert
  to authenticated
  with check (public.is_staff());

create policy training_sessions_update
  on public.training_sessions
  for update
  to authenticated
  using (public.is_staff() or member_id = (select auth.jwt() ->> 'sub'))
  with check (public.is_staff() or member_id = (select auth.jwt() ->> 'sub'));

/* ───────────────────────── Group fitness classes ───────────────────────── */

create table public.fitness_classes (
  id uuid primary key default gen_random_uuid(),
  coach_id text not null references public.users (id) on delete restrict,
  title text not null,
  category text not null default 'Strength',
  room text not null default 'Studio A',
  starts_at timestamptz not null,
  duration_minutes integer not null default 45
    constraint fitness_classes_duration_check check (duration_minutes between 15 and 240),
  capacity integer not null default 12
    constraint fitness_classes_capacity_check check (capacity between 1 and 200),
  status text not null default 'scheduled'
    constraint fitness_classes_status_check check (status in ('scheduled', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fitness_classes_starts_idx on public.fitness_classes (starts_at);

alter table public.fitness_classes enable row level security;

revoke all on table public.fitness_classes from anon, authenticated;
grant select, insert, update on table public.fitness_classes to authenticated;
grant all on table public.fitness_classes to service_role;

create policy fitness_classes_select
  on public.fitness_classes
  for select
  to authenticated
  using (true);

create policy fitness_classes_insert_staff
  on public.fitness_classes
  for insert
  to authenticated
  with check (public.is_staff());

create policy fitness_classes_update_staff
  on public.fitness_classes
  for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create table public.class_reservations (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.fitness_classes (id) on delete cascade,
  member_id text not null references public.users (id) on delete cascade,
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  constraint class_reservations_unique_member unique (class_id, member_id)
);

create index class_reservations_member_idx on public.class_reservations (member_id);

alter table public.class_reservations enable row level security;

revoke all on table public.class_reservations from anon, authenticated;
grant select, insert, update, delete on table public.class_reservations to authenticated;
grant all on table public.class_reservations to service_role;

create policy class_reservations_select
  on public.class_reservations
  for select
  to authenticated
  using (public.is_staff() or member_id = (select auth.jwt() ->> 'sub'));

create policy class_reservations_insert
  on public.class_reservations
  for insert
  to authenticated
  with check (public.is_staff() or member_id = (select auth.jwt() ->> 'sub'));

create policy class_reservations_update_staff
  on public.class_reservations
  for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy class_reservations_delete
  on public.class_reservations
  for delete
  to authenticated
  using (public.is_staff() or member_id = (select auth.jwt() ->> 'sub'));

/* ───────────────────────── Workout routines ───────────────────────── */

create table public.workout_routines (
  id uuid primary key default gen_random_uuid(),
  coach_id text not null references public.users (id) on delete restrict,
  member_id text not null references public.users (id) on delete cascade,
  name text not null default 'Weekly routine',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_routines_member_idx on public.workout_routines (member_id);

alter table public.workout_routines enable row level security;

revoke all on table public.workout_routines from anon, authenticated;
grant select, insert, update, delete on table public.workout_routines to authenticated;
grant all on table public.workout_routines to service_role;

create policy workout_routines_select
  on public.workout_routines
  for select
  to authenticated
  using (public.is_staff() or member_id = (select auth.jwt() ->> 'sub'));

create policy workout_routines_write_staff
  on public.workout_routines
  for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.workout_routines (id) on delete cascade,
  day_of_week integer not null default 1
    constraint workout_exercises_day_check check (day_of_week between 0 and 6),
  name text not null,
  sets integer not null default 3
    constraint workout_exercises_sets_check check (sets between 1 and 20),
  reps text not null default '8-12',
  rest_seconds integer not null default 60
    constraint workout_exercises_rest_check check (rest_seconds between 0 and 900),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index workout_exercises_routine_idx
  on public.workout_exercises (routine_id, day_of_week, position);

alter table public.workout_exercises enable row level security;

revoke all on table public.workout_exercises from anon, authenticated;
grant select, insert, update, delete on table public.workout_exercises to authenticated;
grant all on table public.workout_exercises to service_role;

create policy workout_exercises_select
  on public.workout_exercises
  for select
  to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.workout_routines r
      where r.id = workout_exercises.routine_id
        and r.member_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy workout_exercises_write_staff
  on public.workout_exercises
  for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

/* ───────────────────────── Notifications ───────────────────────── */

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users (id) on delete cascade,
  title text not null,
  body text not null default '',
  kind text not null default 'reminder',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

revoke all on table public.notifications from anon, authenticated;
grant select, update on table public.notifications to authenticated;
grant all on table public.notifications to service_role;

create policy notifications_select
  on public.notifications
  for select
  to authenticated
  using (public.is_staff() or user_id = (select auth.jwt() ->> 'sub'));

create policy notifications_update_own
  on public.notifications
  for update
  to authenticated
  using (public.is_staff() or user_id = (select auth.jwt() ->> 'sub'))
  with check (public.is_staff() or user_id = (select auth.jwt() ->> 'sub'));

/* ───────────────────────── RPCs ───────────────────────── */

/* Promote a member to coach from the Admin Coaching Team screen. Creates or
   updates the coach profile in the same transaction so the Directory has
   something to render immediately. */
create or replace function public.promote_member_to_coach(
  p_user_id text,
  p_specialty text default '',
  p_bio text default '',
  p_hourly_rate numeric default 0
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if not public.is_staff() then
    raise exception 'not_staff' using errcode = '42501';
  end if;

  update public.users
  set role = 'coach'
  where id = p_user_id and role = 'member';

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise exception 'member_not_found' using errcode = 'P0002';
  end if;

  insert into public.coach_profiles (user_id, specialty, bio, hourly_rate, duty_status)
  values (p_user_id, coalesce(p_specialty, ''), coalesce(p_bio, ''), coalesce(p_hourly_rate, 0), 'on_floor')
  on conflict (user_id) do update
  set specialty = excluded.specialty,
      bio = excluded.bio,
      hourly_rate = excluded.hourly_rate,
      duty_status = 'on_floor',
      updated_at = now();

  return json_build_object('user_id', p_user_id, 'role', 'coach');
end;
$$;

revoke all on function public.promote_member_to_coach(text, text, text, numeric)
  from public, anon;
grant execute on function public.promote_member_to_coach(text, text, text, numeric)
  to authenticated;

/* Coaches set their own floor status from the Coach Workspace switcher. */
create or replace function public.set_coach_duty_status(p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id text := (select auth.jwt() ->> 'sub');
begin
  if v_user_id is null or not public.is_staff() then
    raise exception 'not_staff' using errcode = '42501';
  end if;

  if p_status not in ('on_floor', 'in_session', 'on_break', 'off_duty') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  insert into public.coach_profiles (user_id, duty_status)
  values (v_user_id, p_status)
  on conflict (user_id) do update
  set duty_status = excluded.duty_status,
      updated_at = now();
end;
$$;

revoke all on function public.set_coach_duty_status(text) from public, anon;
grant execute on function public.set_coach_duty_status(text) to authenticated;
