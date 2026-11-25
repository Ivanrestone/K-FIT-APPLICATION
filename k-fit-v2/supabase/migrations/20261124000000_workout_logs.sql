CREATE TABLE IF NOT EXISTS public.workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  sets integer NOT NULL CHECK (sets > 0),
  reps integer NOT NULL CHECK (reps > 0),
  weight_kg numeric(10, 2) NOT NULL DEFAULT 0 CHECK (weight_kg >= 0),
  total_volume numeric(12, 2) NOT NULL CHECK (total_volume >= 0),
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workout_logs_member_logged_at_idx
  ON public.workout_logs (member_id, logged_at DESC);

CREATE OR REPLACE FUNCTION public.coach_can_view_member_workout_logs(
  target_member_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users AS coach
    JOIN public.coach_clients AS assignment
      ON assignment.coach_id = coach.id
    WHERE coach.id = (SELECT auth.uid())
      AND coach.role = 'coach'
      AND assignment.member_id = target_member_id
      AND assignment.status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.coach_can_view_member_workout_logs(uuid)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.coach_can_view_member_workout_logs(uuid)
  TO authenticated;

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workout_logs_select_self
  ON public.workout_logs;
CREATE POLICY workout_logs_select_self
  ON public.workout_logs
  FOR SELECT
  TO authenticated
  USING (member_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS workout_logs_select_assigned_coach
  ON public.workout_logs;
CREATE POLICY workout_logs_select_assigned_coach
  ON public.workout_logs
  FOR SELECT
  TO authenticated
  USING (public.coach_can_view_member_workout_logs(member_id));

DROP POLICY IF EXISTS workout_logs_insert_self
  ON public.workout_logs;
CREATE POLICY workout_logs_insert_self
  ON public.workout_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (member_id = (SELECT auth.uid()));

GRANT SELECT, INSERT ON public.workout_logs TO authenticated;
