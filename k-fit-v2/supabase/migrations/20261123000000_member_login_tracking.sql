-- Automatically register every auth account and track successful app logins.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_role text;
  first_name text;
  last_name text;
BEGIN
  account_role := COALESCE(NEW.raw_user_meta_data->>'role', 'member');
  first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'given_name'
  );
  last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'family_name'
  );

  INSERT INTO public.users (
    id,
    email,
    role,
    first_name,
    last_name,
    approved,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    account_role,
    NULLIF(first_name, ''),
    NULLIF(last_name, ''),
    CASE
      WHEN account_role = 'member'
        AND EXISTS (
          SELECT 1
          FROM public.access_grants
          WHERE lower(email) = lower(NEW.email)
        )
      THEN true
      ELSE false
    END,
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = COALESCE(public.users.role, EXCLUDED.role),
    first_name = COALESCE(public.users.first_name, EXCLUDED.first_name),
    last_name = COALESCE(public.users.last_name, EXCLUDED.last_name);

  IF account_role NOT IN ('admin', 'coach') THEN
    INSERT INTO public.members (id, created_at)
    VALUES (NEW.id, COALESCE(NEW.created_at, now()))
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
