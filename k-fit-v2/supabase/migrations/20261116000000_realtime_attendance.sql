-- Enable Supabase Realtime on the attendance table so the Pi kiosk
-- receives instant push notifications on every check-in/check-out.

-- 1. Add attendance to the realtime publication (ignore if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'attendance'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
  END IF;
END $$;

-- 2. Allow the anon role to SELECT attendance rows.
--    Realtime postgres_changes respects RLS, so the kiosk browser
--    (which connects with the public anon key) needs this policy.
--    NOTE: this makes attendance readable by anyone holding the anon key
--    (the same key already shipped inside the mobile app).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'attendance'
      AND policyname = 'kiosk_attendance_read'
  ) THEN
    CREATE POLICY kiosk_attendance_read
      ON public.attendance
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;
