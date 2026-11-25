CREATE TABLE IF NOT EXISTS public.coach_profiles (
  coach_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  biography text NOT NULL DEFAULT '',
  contact_phone text,
  specialties text[] NOT NULL DEFAULT ARRAY[]::text[],
  certifications text[] NOT NULL DEFAULT ARRAY[]::text[],
  experience_years integer CHECK (experience_years IS NULL OR experience_years >= 0),
  preferred_session_types text[] NOT NULL DEFAULT ARRAY[]::text[],
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coach_profiles_select_self ON public.coach_profiles;
CREATE POLICY coach_profiles_select_self
  ON public.coach_profiles
  FOR SELECT
  TO authenticated
  USING (coach_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS coach_profiles_insert_self ON public.coach_profiles;
CREATE POLICY coach_profiles_insert_self
  ON public.coach_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    coach_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.users AS coach
      WHERE coach.id = (SELECT auth.uid())
        AND coach.role = 'coach'
    )
  );

DROP POLICY IF EXISTS coach_profiles_update_self ON public.coach_profiles;
CREATE POLICY coach_profiles_update_self
  ON public.coach_profiles
  FOR UPDATE
  TO authenticated
  USING (coach_id = (SELECT auth.uid()))
  WITH CHECK (
    coach_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.users AS coach
      WHERE coach.id = (SELECT auth.uid())
        AND coach.role = 'coach'
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.coach_profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.save_coach_profile(
  p_first_name text,
  p_last_name text,
  p_biography text,
  p_contact_phone text,
  p_specialties text[],
  p_certifications text[],
  p_experience_years integer,
  p_preferred_session_types text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_coach_id uuid := (SELECT auth.uid());
BEGIN
  IF v_coach_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.users AS coach
    WHERE coach.id = v_coach_id
      AND coach.role = 'coach'
  ) THEN
    RAISE EXCEPTION 'Only coaches can manage their coaching profile'
      USING ERRCODE = '42501';
  END IF;

  IF length(trim(coalesce(p_first_name, ''))) = 0
    OR length(trim(coalesce(p_last_name, ''))) = 0 THEN
    RAISE EXCEPTION 'First and last name are required'
      USING ERRCODE = '22023';
  END IF;

  IF p_experience_years IS NOT NULL AND p_experience_years < 0 THEN
    RAISE EXCEPTION 'Experience years cannot be negative'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.users
  SET
    first_name = trim(p_first_name),
    last_name = trim(p_last_name)
  WHERE id = v_coach_id
    AND role = 'coach';

  INSERT INTO public.coach_profiles (
    coach_id,
    biography,
    contact_phone,
    specialties,
    certifications,
    experience_years,
    preferred_session_types,
    updated_at
  )
  VALUES (
    v_coach_id,
    coalesce(p_biography, ''),
    nullif(trim(coalesce(p_contact_phone, '')), ''),
    coalesce(p_specialties, ARRAY[]::text[]),
    coalesce(p_certifications, ARRAY[]::text[]),
    p_experience_years,
    coalesce(p_preferred_session_types, ARRAY[]::text[]),
    now()
  )
  ON CONFLICT (coach_id) DO UPDATE
  SET
    biography = EXCLUDED.biography,
    contact_phone = EXCLUDED.contact_phone,
    specialties = EXCLUDED.specialties,
    certifications = EXCLUDED.certifications,
    experience_years = EXCLUDED.experience_years,
    preferred_session_types = EXCLUDED.preferred_session_types,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.save_coach_profile(
  text, text, text, text, text[], text[], integer, text[]
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_coach_profile(
  text, text, text, text, text[], text[], integer, text[]
) TO authenticated;

CREATE TABLE IF NOT EXISTS public.coach_training_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  description text NOT NULL DEFAULT '',
  category text NOT NULL CHECK (
    category IN (
      'Strength Training',
      'Hypertrophy',
      'Weight Loss',
      'Endurance',
      'Cardio',
      'Flexibility',
      'General Fitness'
    )
  ),
  target_muscle_groups text[] NOT NULL DEFAULT ARRAY[]::text[],
  scheduled_for date,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coach_training_plans_member_status_idx
  ON public.coach_training_plans (member_id, status, scheduled_for);

CREATE INDEX IF NOT EXISTS coach_training_plans_coach_created_idx
  ON public.coach_training_plans (coach_id, created_at DESC);

ALTER TABLE public.coach_training_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coach_training_plans_select_owner
  ON public.coach_training_plans;
CREATE POLICY coach_training_plans_select_owner
  ON public.coach_training_plans
  FOR SELECT
  TO authenticated
  USING (
    coach_id = (SELECT auth.uid())
    OR member_id = (SELECT auth.uid())
  );

GRANT SELECT ON public.coach_training_plans TO authenticated;

CREATE TABLE IF NOT EXISTS public.coach_training_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL
    REFERENCES public.coach_training_plans(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position >= 0),
  exercise_name text NOT NULL CHECK (length(trim(exercise_name)) > 0),
  target_muscle_group text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  sets integer NOT NULL CHECK (sets > 0),
  repetitions text NOT NULL CHECK (length(trim(repetitions)) > 0),
  rest_seconds integer NOT NULL DEFAULT 0 CHECK (rest_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, position)
);

CREATE INDEX IF NOT EXISTS coach_training_exercises_plan_position_idx
  ON public.coach_training_exercises (plan_id, position);

ALTER TABLE public.coach_training_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coach_training_exercises_select_plan_owner
  ON public.coach_training_exercises;
CREATE POLICY coach_training_exercises_select_plan_owner
  ON public.coach_training_exercises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.coach_training_plans AS plan
      WHERE plan.id = plan_id
        AND (
          plan.coach_id = (SELECT auth.uid())
          OR plan.member_id = (SELECT auth.uid())
        )
    )
  );

GRANT SELECT ON public.coach_training_exercises TO authenticated;

CREATE TABLE IF NOT EXISTS public.coach_training_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL
    REFERENCES public.coach_training_plans(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  notes text NOT NULL DEFAULT '',
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coach_training_completions_member_completed_idx
  ON public.coach_training_completions (member_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS coach_training_completions_coach_completed_idx
  ON public.coach_training_completions (coach_id, completed_at DESC);

ALTER TABLE public.coach_training_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coach_training_completions_select_participant
  ON public.coach_training_completions;
CREATE POLICY coach_training_completions_select_participant
  ON public.coach_training_completions
  FOR SELECT
  TO authenticated
  USING (
    member_id = (SELECT auth.uid())
    OR coach_id = (SELECT auth.uid())
  );

GRANT SELECT ON public.coach_training_completions TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_coach_training_plan(
  p_plan_id uuid,
  p_notes text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_member_id uuid := (SELECT auth.uid());
  v_coach_id uuid;
  v_completion_id uuid;
BEGIN
  IF v_member_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.users AS member
    WHERE member.id = v_member_id
      AND member.role = 'member'
  ) THEN
    RAISE EXCEPTION 'Only members can record training plan completions'
      USING ERRCODE = '42501';
  END IF;

  SELECT plan.coach_id
  INTO v_coach_id
  FROM public.coach_training_plans AS plan
  JOIN public.coach_clients AS assignment
    ON assignment.coach_id = plan.coach_id
   AND assignment.member_id = plan.member_id
  WHERE plan.id = p_plan_id
    AND plan.member_id = v_member_id
    AND plan.status = 'active'
    AND assignment.status = 'active'
  FOR SHARE OF assignment;

  IF v_coach_id IS NULL THEN
    RAISE EXCEPTION 'This training plan is no longer available'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.coach_training_completions (
    plan_id,
    coach_id,
    member_id,
    notes
  )
  VALUES (
    p_plan_id,
    v_coach_id,
    v_member_id,
    coalesce(p_notes, '')
  )
  RETURNING id INTO v_completion_id;

  RETURN v_completion_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_coach_training_plan(uuid, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_coach_training_plan(uuid, text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.save_coach_training_plan(
  p_plan_id uuid,
  p_member_id uuid,
  p_name text,
  p_description text,
  p_category text,
  p_target_muscle_groups text[],
  p_scheduled_for date,
  p_exercises jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_coach_id uuid := (SELECT auth.uid());
  v_plan_id uuid;
  v_exercise jsonb;
  v_position integer := 0;
BEGIN
  IF v_coach_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.users AS coach
    WHERE coach.id = v_coach_id
      AND coach.role = 'coach'
  ) THEN
    RAISE EXCEPTION 'Only coaches can manage training plans'
      USING ERRCODE = '42501';
  END IF;

  PERFORM 1
  FROM public.coach_clients AS assignment
  WHERE assignment.coach_id = v_coach_id
    AND assignment.member_id = p_member_id
    AND assignment.status = 'active'
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Training plans can only be assigned to active clients'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.users AS member
    WHERE member.id = p_member_id
      AND member.role = 'member'
  ) THEN
    RAISE EXCEPTION 'Training plans must be assigned to a member account'
      USING ERRCODE = '42501';
  END IF;

  IF length(trim(coalesce(p_name, ''))) = 0 THEN
    RAISE EXCEPTION 'A plan name is required'
      USING ERRCODE = '22023';
  END IF;

  IF p_category IS NULL OR p_category NOT IN (
    'Strength Training',
    'Hypertrophy',
    'Weight Loss',
    'Endurance',
    'Cardio',
    'Flexibility',
    'General Fitness'
  ) THEN
    RAISE EXCEPTION 'Invalid training plan category'
      USING ERRCODE = '22023';
  END IF;

  IF p_exercises IS NULL
    OR pg_catalog.jsonb_typeof(p_exercises) IS DISTINCT FROM 'array'
    OR pg_catalog.jsonb_array_length(p_exercises) < 1
    OR pg_catalog.jsonb_array_length(p_exercises) > 40 THEN
    RAISE EXCEPTION 'A plan must contain between 1 and 40 exercises'
      USING ERRCODE = '22023';
  END IF;

  IF p_plan_id IS NULL THEN
    INSERT INTO public.coach_training_plans (
      coach_id,
      member_id,
      name,
      description,
      category,
      target_muscle_groups,
      scheduled_for
    )
    VALUES (
      v_coach_id,
      p_member_id,
      trim(p_name),
      coalesce(p_description, ''),
      p_category,
      coalesce(p_target_muscle_groups, ARRAY[]::text[]),
      p_scheduled_for
    )
    RETURNING id INTO v_plan_id;
  ELSE
    UPDATE public.coach_training_plans
    SET
      member_id = p_member_id,
      name = trim(p_name),
      description = coalesce(p_description, ''),
      category = p_category,
      target_muscle_groups = coalesce(p_target_muscle_groups, ARRAY[]::text[]),
      scheduled_for = p_scheduled_for,
      updated_at = now()
    WHERE id = p_plan_id
      AND coach_id = v_coach_id
    RETURNING id INTO v_plan_id;

    IF v_plan_id IS NULL THEN
      RAISE EXCEPTION 'Training plan not found or not owned by this coach'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  DELETE FROM public.coach_training_exercises
  WHERE plan_id = v_plan_id;

  FOR v_exercise IN
    SELECT value
    FROM pg_catalog.jsonb_array_elements(p_exercises)
  LOOP
    INSERT INTO public.coach_training_exercises (
      plan_id,
      position,
      exercise_name,
      target_muscle_group,
      instructions,
      sets,
      repetitions,
      rest_seconds
    )
    VALUES (
      v_plan_id,
      v_position,
      trim(coalesce(v_exercise ->> 'exercise_name', '')),
      coalesce(v_exercise ->> 'target_muscle_group', ''),
      coalesce(v_exercise ->> 'instructions', ''),
      (v_exercise ->> 'sets')::integer,
      trim(coalesce(v_exercise ->> 'repetitions', '')),
      coalesce((v_exercise ->> 'rest_seconds')::integer, 0)
    );
    v_position := v_position + 1;
  END LOOP;

  RETURN v_plan_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_coach_training_plan(
  uuid, uuid, text, text, text, text[], date, jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_coach_training_plan(
  uuid, uuid, text, text, text, text[], date, jsonb
) TO authenticated;

CREATE OR REPLACE FUNCTION public.archive_coach_training_plan(
  p_plan_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_coach_id uuid := (SELECT auth.uid());
BEGIN
  IF v_coach_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.users AS coach
    WHERE coach.id = v_coach_id
      AND coach.role = 'coach'
  ) THEN
    RAISE EXCEPTION 'Only coaches can archive training plans'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.coach_training_plans
  SET status = 'archived', updated_at = now()
  WHERE id = p_plan_id
    AND coach_id = v_coach_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Training plan not found or not owned by this coach'
      USING ERRCODE = '42501';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_coach_training_plan(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_coach_training_plan(uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.create_coach_appointment(
  p_member_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_notes text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_coach_id uuid := (SELECT auth.uid());
  v_appointment_id uuid;
BEGIN
  IF v_coach_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.users AS coach
    WHERE coach.id = v_coach_id
      AND coach.role = 'coach'
  ) THEN
    RAISE EXCEPTION 'Only coaches can schedule appointments'
      USING ERRCODE = '42501';
  END IF;

  IF p_starts_at IS NULL
    OR p_ends_at IS NULL
    OR p_starts_at <= now()
    OR p_ends_at <= p_starts_at THEN
    RAISE EXCEPTION 'Choose a future start and an end time after the start'
      USING ERRCODE = '22023';
  END IF;

  PERFORM 1
  FROM public.coach_clients AS assignment
  WHERE assignment.coach_id = v_coach_id
    AND assignment.member_id = p_member_id
    AND assignment.status = 'active'
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointments can only be scheduled with active clients'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.users AS member
    WHERE member.id = p_member_id
      AND member.role = 'member'
  ) THEN
    RAISE EXCEPTION 'Appointments must be scheduled with a member account'
      USING ERRCODE = '42501';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    74101,
    pg_catalog.hashtext(v_coach_id::text)
  );
  PERFORM pg_catalog.pg_advisory_xact_lock(
    74102,
    pg_catalog.hashtext(p_member_id::text)
  );

  IF EXISTS (
    SELECT 1
    FROM public.appointments AS appointment
    WHERE appointment.status = 'scheduled'
      AND appointment.appointment_date < p_ends_at
      AND appointment.end_time > p_starts_at
      AND (
        appointment.coach_id = v_coach_id
        OR appointment.member_id = p_member_id
      )
  ) THEN
    RAISE EXCEPTION 'The coach or member already has a session at that time'
      USING ERRCODE = '23P01';
  END IF;

  INSERT INTO public.appointments (
    coach_id,
    member_id,
    appointment_date,
    end_time,
    notes,
    status
  )
  VALUES (
    v_coach_id,
    p_member_id,
    p_starts_at,
    p_ends_at,
    coalesce(p_notes, ''),
    'scheduled'
  )
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_coach_appointment(
  uuid, timestamptz, timestamptz, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_coach_appointment(
  uuid, timestamptz, timestamptz, text
) TO authenticated;

CREATE OR REPLACE FUNCTION public.manage_coach_appointment(
  p_appointment_id uuid,
  p_action text,
  p_starts_at timestamptz DEFAULT NULL,
  p_ends_at timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_coach_id uuid := (SELECT auth.uid());
  v_appointment public.appointments%ROWTYPE;
BEGIN
  IF v_coach_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.users AS coach
    WHERE coach.id = v_coach_id
      AND coach.role = 'coach'
  ) THEN
    RAISE EXCEPTION 'Only coaches can manage appointments'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_appointment
  FROM public.appointments
  WHERE id = p_appointment_id
    AND coach_id = v_coach_id
  FOR UPDATE;

  IF NOT FOUND OR v_appointment.status <> 'scheduled' THEN
    RAISE EXCEPTION 'Scheduled appointment not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF p_action = 'cancel' THEN
    UPDATE public.appointments
    SET status = 'cancelled'
    WHERE id = p_appointment_id
      AND coach_id = v_coach_id;
  ELSIF p_action = 'complete' THEN
    IF v_appointment.appointment_date > now() THEN
      RAISE EXCEPTION 'An upcoming appointment cannot be marked complete'
        USING ERRCODE = '22023';
    END IF;
    UPDATE public.appointments
    SET status = 'completed'
    WHERE id = p_appointment_id
      AND coach_id = v_coach_id;
  ELSIF p_action = 'reschedule' THEN
    IF p_starts_at IS NULL
      OR p_ends_at IS NULL
      OR p_starts_at <= now()
      OR p_ends_at <= p_starts_at THEN
      RAISE EXCEPTION 'Choose a valid future start and end time'
        USING ERRCODE = '22023';
    END IF;

    PERFORM pg_catalog.pg_advisory_xact_lock(
      74101,
      pg_catalog.hashtext(v_coach_id::text)
    );
    PERFORM pg_catalog.pg_advisory_xact_lock(
      74102,
      pg_catalog.hashtext(v_appointment.member_id::text)
    );

    UPDATE public.appointments
    SET
      appointment_date = p_starts_at,
      end_time = p_ends_at,
      notes = coalesce(p_notes, notes)
    WHERE id = p_appointment_id
      AND coach_id = v_coach_id;
  ELSE
    RAISE EXCEPTION 'Unsupported appointment action'
      USING ERRCODE = '22023';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.manage_coach_appointment(
  uuid, text, timestamptz, timestamptz, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_coach_appointment(
  uuid, text, timestamptz, timestamptz, text
) TO authenticated;

CREATE OR REPLACE FUNCTION public.prevent_appointment_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status <> 'scheduled' THEN
    RETURN NEW;
  END IF;

  IF NEW.appointment_date IS NULL
    OR NEW.end_time IS NULL
    OR NEW.end_time <= NEW.appointment_date THEN
    RAISE EXCEPTION 'Appointment end time must be after its start time'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    74101,
    pg_catalog.hashtext(NEW.coach_id::text)
  );
  PERFORM pg_catalog.pg_advisory_xact_lock(
    74102,
    pg_catalog.hashtext(NEW.member_id::text)
  );

  IF EXISTS (
    SELECT 1
    FROM public.appointments AS appointment
    WHERE appointment.id IS DISTINCT FROM NEW.id
      AND appointment.status = 'scheduled'
      AND appointment.appointment_date < NEW.end_time
      AND appointment.end_time > NEW.appointment_date
      AND (
        appointment.coach_id = NEW.coach_id
        OR appointment.member_id = NEW.member_id
      )
  ) THEN
    RAISE EXCEPTION 'The coach or member already has a session at that time'
      USING ERRCODE = '23P01';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_prevent_overlap
  ON public.appointments;
CREATE TRIGGER appointments_prevent_overlap
  BEFORE INSERT OR UPDATE OF
    coach_id, member_id, appointment_date, end_time, status
  ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_appointment_overlap();

REVOKE ALL ON FUNCTION public.prevent_appointment_overlap() FROM PUBLIC;
