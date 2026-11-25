-- Birthday feature: members can store their birthdate and choose to share it.
-- Shared birthdays appear as announcements on the member's birthday.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS birthdate date,
  ADD COLUMN IF NOT EXISTS birthday_shared boolean NOT NULL DEFAULT false;

-- Returns users whose birthday is TODAY and who chose to share it.
-- SECURITY DEFINER so members can see each other's shared birthdays
-- without needing SELECT on other users' rows.
CREATE OR REPLACE FUNCTION public.get_todays_birthdays()
RETURNS TABLE(id uuid, first_name text, last_name text, birthdate date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT u.id, u.first_name, u.last_name, u.birthdate
  FROM public.users u
  WHERE u.birthday_shared = true
    AND u.birthdate IS NOT NULL
    AND EXTRACT(MONTH FROM u.birthdate) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY FROM u.birthdate) = EXTRACT(DAY FROM CURRENT_DATE);
$$;

GRANT EXECUTE ON FUNCTION public.get_todays_birthdays() TO authenticated;
