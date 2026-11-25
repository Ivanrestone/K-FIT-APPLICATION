-- Member verification / access control
-- New signups start as pending (approved = false) unless their email is in
-- public.access_grants, in which case a trigger auto-approves them.
-- Existing users are backfilled as approved so nobody is locked out.

-- 1) Approval columns on public.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill: everyone who already has an account stays approved.
UPDATE public.users SET approved = true WHERE approved = false;

-- 2) Access grant list — emails allowed to sign up without manual review
CREATE TABLE IF NOT EXISTS public.access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS access_grants_email_idx
  ON public.access_grants (lower(email));

ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;

-- Authenticated users may read the list (used by the approval check).
-- Writes are done through the service role from the admin screen.
DROP POLICY IF EXISTS access_grants_select_auth ON public.access_grants;
CREATE POLICY access_grants_select_auth
  ON public.access_grants
  FOR SELECT
  TO authenticated
  USING (true);

-- 3) Auto-approve trigger: when a users row is inserted, check access_grants
CREATE OR REPLACE FUNCTION public.auto_approve_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.access_grants
    WHERE lower(email) = lower(NEW.email)
  ) THEN
    NEW.approved := true;
    NEW.approved_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_approve_on_signup ON public.users;
CREATE TRIGGER trg_auto_approve_on_signup
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_on_signup();
