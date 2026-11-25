-- Announcements/memos created by admins, visible to members and coaches.

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all', 'members', 'coaches')),
  pinned boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS announcements_created_at_idx
  ON public.announcements (created_at DESC);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can read announcements; writes go through
-- the service role key used by admin screens.
DROP POLICY IF EXISTS announcements_select_all ON public.announcements;
CREATE POLICY announcements_select_all
  ON public.announcements
  FOR SELECT
  TO anon, authenticated
  USING (true);
