CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text NOT NULL CHECK (length(trim(description)) > 0),
  image_url text,
  category text NOT NULL DEFAULT 'General Fitness',
  challenge_type text NOT NULL CHECK (
    challenge_type IN ('individual', 'competitive')
  ),
  target_visits integer NOT NULL CHECK (target_visits > 0),
  completion_reward_kp integer NOT NULL DEFAULT 0
    CHECK (completion_reward_kp >= 0),
  start_at timestamptz,
  end_at timestamptz,
  enrollment_open_at timestamptz,
  enrollment_deadline timestamptz,
  max_participants integer CHECK (
    max_participants IS NULL OR max_participants > 0
  ),
  minimum_session_minutes integer NOT NULL DEFAULT 15
    CHECK (minimum_session_minutes > 0),
  max_daily_visits integer NOT NULL DEFAULT 1
    CHECK (max_daily_visits > 0),
  timezone text NOT NULL DEFAULT 'Asia/Manila',
  visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'restricted')),
  rules text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'published', 'paused', 'finalizing',
      'completed', 'cancelled', 'archived'
    )),
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_at IS NULL OR end_at IS NULL OR end_at > start_at),
  CHECK (
    enrollment_open_at IS NULL
    OR enrollment_deadline IS NULL
    OR enrollment_deadline >= enrollment_open_at
  )
);

CREATE INDEX IF NOT EXISTS challenges_status_schedule_idx
  ON public.challenges (status, start_at, end_at);

CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL
    REFERENCES public.challenges(id) ON DELETE CASCADE,
  member_id uuid NOT NULL
    REFERENCES public.members(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  total_visits integer NOT NULL DEFAULT 0 CHECK (total_visits >= 0),
  progress_percentage numeric(5, 2) NOT NULL DEFAULT 0
    CHECK (progress_percentage >= 0),
  completion_status text NOT NULL DEFAULT 'in_progress'
    CHECK (completion_status IN ('in_progress', 'completed', 'withdrawn')),
  completed_at timestamptz,
  last_visit_at timestamptz,
  final_rank integer CHECK (final_rank IS NULL OR final_rank > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, member_id)
);

CREATE INDEX IF NOT EXISTS challenge_participants_member_idx
  ON public.challenge_participants (member_id, joined_at DESC);
CREATE INDEX IF NOT EXISTS challenge_participants_leaderboard_idx
  ON public.challenge_participants
    (challenge_id, total_visits DESC, last_visit_at ASC);

CREATE TABLE IF NOT EXISTS public.challenge_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL
    REFERENCES public.challenges(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL
    REFERENCES public.challenge_participants(id) ON DELETE CASCADE,
  member_id uuid NOT NULL
    REFERENCES public.members(id) ON DELETE CASCADE,
  gym_session_id uuid NOT NULL
    REFERENCES public.attendance(id) ON DELETE RESTRICT,
  attendance_date date NOT NULL,
  eligible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, gym_session_id)
);

CREATE INDEX IF NOT EXISTS challenge_activities_member_day_idx
  ON public.challenge_activities
    (challenge_id, member_id, attendance_date)
  WHERE eligible;

CREATE TABLE IF NOT EXISTS public.challenge_reward_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL
    REFERENCES public.challenges(id) ON DELETE CASCADE,
  rank_position integer NOT NULL CHECK (rank_position BETWEEN 1 AND 3),
  kp_amount integer NOT NULL CHECK (kp_amount >= 0),
  UNIQUE (challenge_id, rank_position)
);

CREATE TABLE IF NOT EXISTS public.challenge_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL
    REFERENCES public.challenges(id) ON DELETE RESTRICT,
  member_id uuid NOT NULL
    REFERENCES public.members(id) ON DELETE RESTRICT,
  reward_type text NOT NULL
    CHECK (reward_type IN ('completion', 'placement_1', 'placement_2', 'placement_3')),
  kp_amount integer NOT NULL CHECK (kp_amount > 0),
  status text NOT NULL DEFAULT 'awarded'
    CHECK (status IN ('awarded', 'reversed')),
  awarded_at timestamptz NOT NULL DEFAULT now(),
  points_transaction_id uuid NOT NULL
    REFERENCES public.points_transactions(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, member_id, reward_type)
);

CREATE TABLE IF NOT EXISTS public.challenge_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text NOT NULL CHECK (length(trim(description)) > 0),
  challenge_type text NOT NULL CHECK (
    challenge_type IN ('individual', 'competitive')
  ),
  target_visits integer NOT NULL CHECK (target_visits > 0),
  proposed_reward_kp integer NOT NULL DEFAULT 0
    CHECK (proposed_reward_kp >= 0),
  suggested_duration_days integer NOT NULL
    CHECK (suggested_duration_days > 0),
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  challenge_id uuid REFERENCES public.challenges(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS challenge_suggestions_status_created_idx
  ON public.challenge_suggestions (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.challenge_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL
    REFERENCES public.members(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL
    REFERENCES public.challenges(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, challenge_id, notification_type)
);

CREATE INDEX IF NOT EXISTS challenge_notifications_member_created_idx
  ON public.challenge_notifications (member_id, created_at DESC);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_reward_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_challenge_participant(p_challenge_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.challenge_participants AS participant
    WHERE participant.challenge_id = p_challenge_id
      AND participant.member_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_challenge_visible_to_assigned_coach(
  p_challenge_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.challenge_participants AS participant
    WHERE participant.challenge_id = p_challenge_id
      AND (SELECT public.is_assigned_coach(participant.member_id))
  );
$$;

REVOKE ALL ON FUNCTION public.is_challenge_participant(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_challenge_participant(uuid)
  TO authenticated;
REVOKE ALL ON FUNCTION public.is_challenge_visible_to_assigned_coach(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_challenge_visible_to_assigned_coach(uuid)
  TO authenticated;

DROP POLICY IF EXISTS challenges_read_visible
  ON public.challenges;
CREATE POLICY challenges_read_visible
  ON public.challenges
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_coach())
      AND (
        status = 'published'
        OR (SELECT public.is_challenge_visible_to_assigned_coach(id))
      )
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.members AS member
        WHERE member.id = (SELECT auth.uid())
      )
      AND (
        (SELECT public.is_challenge_participant(id))
        OR (
          status = 'published'
          AND (
            visibility = 'public'
            OR EXISTS (
              SELECT 1
              FROM public.memberships AS membership
              WHERE membership.member_id = (SELECT auth.uid())
                AND membership.status = 'active'
                AND (now() AT TIME ZONE 'Asia/Manila')::date
                  BETWEEN membership.start_date AND membership.end_date
            )
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS challenge_participants_read_permitted
  ON public.challenge_participants;
CREATE POLICY challenge_participants_read_permitted
  ON public.challenge_participants
  FOR SELECT
  TO authenticated
  USING (
    member_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
    OR (
      (SELECT public.is_coach())
      AND (SELECT public.is_assigned_coach(member_id))
    )
    OR EXISTS (
      SELECT 1 FROM public.challenges AS challenge
      WHERE challenge.id = challenge_id
        AND challenge.status = 'published'
        AND EXISTS (
          SELECT 1 FROM public.members AS member
          WHERE member.id = (SELECT auth.uid())
        )
        AND (
          challenge.visibility = 'public'
          OR EXISTS (
            SELECT 1
            FROM public.memberships AS membership
            WHERE membership.member_id = (SELECT auth.uid())
              AND membership.status = 'active'
              AND (now() AT TIME ZONE 'Asia/Manila')::date
                BETWEEN membership.start_date AND membership.end_date
          )
        )
    )
  );

DROP POLICY IF EXISTS challenge_activities_read_permitted
  ON public.challenge_activities;
CREATE POLICY challenge_activities_read_permitted
  ON public.challenge_activities
  FOR SELECT
  TO authenticated
  USING (
    member_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
    OR (
      (SELECT public.is_coach())
      AND (SELECT public.is_assigned_coach(member_id))
    )
  );

DROP POLICY IF EXISTS challenge_rewards_read_own_or_admin
  ON public.challenge_rewards;
CREATE POLICY challenge_rewards_read_own_or_admin
  ON public.challenge_rewards
  FOR SELECT
  TO authenticated
  USING (
    member_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS challenge_reward_configurations_read_visible
  ON public.challenge_reward_configurations;
CREATE POLICY challenge_reward_configurations_read_visible
  ON public.challenge_reward_configurations
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_admin())
    OR (
      (SELECT public.is_coach())
      AND EXISTS (
        SELECT 1 FROM public.challenges AS challenge
        WHERE challenge.id = challenge_id
          AND (
            challenge.status = 'published'
            OR (SELECT public.is_challenge_visible_to_assigned_coach(challenge.id))
          )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.challenges AS challenge
      WHERE challenge.id = challenge_id
        AND challenge.status = 'published'
        AND EXISTS (
          SELECT 1 FROM public.members AS member
          WHERE member.id = (SELECT auth.uid())
        )
        AND (
          challenge.visibility = 'public'
          OR EXISTS (
            SELECT 1
            FROM public.memberships AS membership
            WHERE membership.member_id = (SELECT auth.uid())
              AND membership.status = 'active'
              AND (now() AT TIME ZONE 'Asia/Manila')::date
                BETWEEN membership.start_date AND membership.end_date
          )
        )
    )
    OR (SELECT public.is_challenge_participant(challenge_id))
  );

DROP POLICY IF EXISTS challenge_suggestions_read_own_or_admin
  ON public.challenge_suggestions;
CREATE POLICY challenge_suggestions_read_own_or_admin
  ON public.challenge_suggestions
  FOR SELECT
  TO authenticated
  USING (
    coach_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS challenge_notifications_read_own_or_admin
  ON public.challenge_notifications;
CREATE POLICY challenge_notifications_read_own_or_admin
  ON public.challenge_notifications
  FOR SELECT
  TO authenticated
  USING (
    member_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

REVOKE ALL ON public.challenges,
  public.challenge_participants,
  public.challenge_activities,
  public.challenge_reward_configurations,
  public.challenge_rewards,
  public.challenge_suggestions,
  public.challenge_notifications
FROM anon, authenticated;
REVOKE ALL ON public.challenges,
  public.challenge_participants,
  public.challenge_activities,
  public.challenge_reward_configurations,
  public.challenge_rewards,
  public.challenge_suggestions,
  public.challenge_notifications
FROM PUBLIC;

GRANT SELECT ON public.challenges,
  public.challenge_participants,
  public.challenge_activities,
  public.challenge_reward_configurations,
  public.challenge_rewards,
  public.challenge_suggestions,
  public.challenge_notifications
TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_save_challenge(
  p_challenge_id uuid,
  p_title text,
  p_description text,
  p_image_url text,
  p_category text,
  p_challenge_type text,
  p_target_visits integer,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_enrollment_open_at timestamptz,
  p_enrollment_deadline timestamptz,
  p_max_participants integer,
  p_minimum_session_minutes integer,
  p_max_daily_visits integer,
  p_completion_reward_kp integer,
  p_first_place_reward_kp integer,
  p_second_place_reward_kp integer,
  p_third_place_reward_kp integer,
  p_visibility text,
  p_rules text,
  p_instructions text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
  v_status text;
BEGIN
  IF NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'Admin permission required'
      USING ERRCODE = '42501';
  END IF;

  IF length(trim(coalesce(p_title, ''))) = 0
    OR length(trim(coalesce(p_description, ''))) = 0
    OR length(trim(coalesce(p_category, ''))) = 0
    OR p_challenge_type IS NULL
    OR p_challenge_type NOT IN ('individual', 'competitive')
    OR p_target_visits IS NULL OR p_target_visits <= 0
    OR coalesce(p_minimum_session_minutes, 0) <= 0
    OR coalesce(p_max_daily_visits, 0) <= 0
    OR coalesce(p_completion_reward_kp, -1) < 0
    OR coalesce(p_first_place_reward_kp, -1) < 0
    OR coalesce(p_second_place_reward_kp, -1) < 0
    OR coalesce(p_third_place_reward_kp, -1) < 0
    OR (p_max_participants IS NOT NULL AND p_max_participants <= 0)
    OR p_visibility IS NULL
    OR p_visibility NOT IN ('public', 'restricted') THEN
    RAISE EXCEPTION 'Challenge details are invalid'
      USING ERRCODE = '22023';
  END IF;

  IF p_start_at IS NOT NULL AND p_end_at IS NOT NULL
    AND p_end_at <= p_start_at THEN
    RAISE EXCEPTION 'Challenge end must be after its start'
      USING ERRCODE = '22023';
  END IF;

  IF p_enrollment_open_at IS NOT NULL
    AND p_enrollment_deadline IS NOT NULL
    AND p_enrollment_deadline < p_enrollment_open_at THEN
    RAISE EXCEPTION 'Enrollment deadline must not precede enrollment opening'
      USING ERRCODE = '22023';
  END IF;

  IF p_enrollment_deadline IS NOT NULL AND p_start_at IS NOT NULL
    AND p_enrollment_deadline > p_start_at THEN
    RAISE EXCEPTION 'Enrollment must close before the challenge starts'
      USING ERRCODE = '22023';
  END IF;

  IF p_challenge_id IS NULL THEN
    INSERT INTO public.challenges (
      title, description, image_url, category, challenge_type, target_visits,
      completion_reward_kp, start_at, end_at, enrollment_open_at,
      enrollment_deadline, max_participants, minimum_session_minutes,
      max_daily_visits, visibility, rules, instructions, created_by
    )
    VALUES (
      trim(p_title), trim(p_description), nullif(trim(coalesce(p_image_url, '')), ''),
      trim(p_category), p_challenge_type, p_target_visits,
      p_completion_reward_kp, p_start_at, p_end_at, p_enrollment_open_at,
      p_enrollment_deadline, p_max_participants, p_minimum_session_minutes,
      p_max_daily_visits, p_visibility, coalesce(p_rules, ''),
      coalesce(p_instructions, ''), (SELECT auth.uid())
    )
    RETURNING id INTO v_id;
  ELSE
    SELECT status INTO v_status
    FROM public.challenges
    WHERE id = p_challenge_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Challenge not found'
        USING ERRCODE = 'P0002';
    END IF;
    IF v_status NOT IN ('draft', 'published', 'paused') THEN
      RAISE EXCEPTION 'This challenge can no longer be edited'
        USING ERRCODE = '22023';
    END IF;
    IF v_status <> 'draft' AND EXISTS (
      SELECT 1
      FROM public.challenge_participants
      WHERE challenge_id = p_challenge_id
    ) THEN
      RAISE EXCEPTION 'A challenge with participants cannot be reconfigured'
        USING ERRCODE = '22023';
    END IF;

    UPDATE public.challenges
    SET title = trim(p_title),
        description = trim(p_description),
        image_url = nullif(trim(coalesce(p_image_url, '')), ''),
        category = trim(p_category),
        challenge_type = p_challenge_type,
        target_visits = p_target_visits,
        completion_reward_kp = p_completion_reward_kp,
        start_at = p_start_at,
        end_at = p_end_at,
        enrollment_open_at = p_enrollment_open_at,
        enrollment_deadline = p_enrollment_deadline,
        max_participants = p_max_participants,
        minimum_session_minutes = p_minimum_session_minutes,
        max_daily_visits = p_max_daily_visits,
        visibility = p_visibility,
        rules = coalesce(p_rules, ''),
        instructions = coalesce(p_instructions, ''),
        updated_at = now()
    WHERE id = p_challenge_id
    RETURNING id INTO v_id;
  END IF;

  DELETE FROM public.challenge_reward_configurations
  WHERE challenge_id = v_id;

  IF p_challenge_type = 'competitive' THEN
    INSERT INTO public.challenge_reward_configurations (
      challenge_id, rank_position, kp_amount
    )
    SELECT v_id, reward.rank_position, reward.kp_amount
    FROM (
      VALUES
        (1, p_first_place_reward_kp),
        (2, p_second_place_reward_kp),
        (3, p_third_place_reward_kp)
    ) AS reward(rank_position, kp_amount)
    WHERE reward.kp_amount > 0;
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_publish_challenge(p_challenge_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_challenge public.challenges%ROWTYPE;
BEGIN
  IF NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'Admin permission required'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_challenge
  FROM public.challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found'
      USING ERRCODE = 'P0002';
  END IF;
  IF v_challenge.status NOT IN ('draft', 'paused') THEN
    RAISE EXCEPTION 'Only draft or paused challenges can be published'
      USING ERRCODE = '22023';
  END IF;
  IF v_challenge.start_at IS NULL
    OR v_challenge.end_at IS NULL
    OR v_challenge.enrollment_open_at IS NULL
    OR v_challenge.enrollment_deadline IS NULL
    OR v_challenge.end_at <= v_challenge.start_at
    OR v_challenge.enrollment_open_at > v_challenge.enrollment_deadline
    OR v_challenge.enrollment_deadline > v_challenge.start_at
    OR v_challenge.end_at <= now()
    OR v_challenge.enrollment_deadline <= now() THEN
    RAISE EXCEPTION 'Valid future enrollment and challenge dates are required'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.challenges
  SET status = 'published', updated_at = now()
  WHERE id = p_challenge_id;

  INSERT INTO public.challenge_notifications (
    member_id, challenge_id, notification_type, title, message
  )
  SELECT membership.member_id, p_challenge_id, 'challenge_published',
         'New challenge available', v_challenge.title
  FROM public.memberships AS membership
  WHERE membership.status = 'active'
    AND (now() AT TIME ZONE 'Asia/Manila')::date
      BETWEEN membership.start_date AND membership.end_date
  ON CONFLICT (member_id, challenge_id, notification_type) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_change_challenge_status(
  p_challenge_id uuid,
  p_action text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status text;
  v_end_at timestamptz;
BEGIN
  IF NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'Admin permission required'
      USING ERRCODE = '42501';
  END IF;

  SELECT status, end_at INTO v_status, v_end_at
  FROM public.challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF (p_action = 'pause' AND v_status = 'published') THEN
    UPDATE public.challenges SET status = 'paused', updated_at = now()
    WHERE id = p_challenge_id;
  ELSIF (p_action = 'resume' AND v_status = 'paused') THEN
    IF v_end_at IS NULL OR v_end_at <= now() THEN
      RAISE EXCEPTION 'An ended challenge cannot be resumed'
        USING ERRCODE = '22023';
    END IF;
    UPDATE public.challenges SET status = 'published', updated_at = now()
    WHERE id = p_challenge_id;
  ELSIF (p_action = 'cancel' AND v_status IN ('draft', 'published', 'paused')) THEN
    UPDATE public.challenges SET status = 'cancelled', updated_at = now()
    WHERE id = p_challenge_id;
  ELSIF (p_action = 'archive' AND v_status IN ('completed', 'cancelled')) THEN
    UPDATE public.challenges SET status = 'archived', updated_at = now()
    WHERE id = p_challenge_id;
  ELSE
    RAISE EXCEPTION 'Invalid challenge status action'
      USING ERRCODE = '22023';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_challenge(p_challenge_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_challenge public.challenges%ROWTYPE;
  v_participant_id uuid;
  v_participant_count integer;
  v_today date := (now() AT TIME ZONE 'Asia/Manila')::date;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.members WHERE id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'Member account required'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE member_id = (SELECT auth.uid())
      AND status = 'active'
      AND v_today BETWEEN start_date AND end_date
  ) THEN
    RAISE EXCEPTION 'An active membership is required to join'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_challenge
  FROM public.challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF NOT FOUND OR v_challenge.status <> 'published' THEN
    RAISE EXCEPTION 'Challenge is not open for enrollment'
      USING ERRCODE = '22023';
  END IF;
  IF now() < v_challenge.enrollment_open_at
    OR now() > v_challenge.enrollment_deadline
    OR now() >= v_challenge.start_at THEN
    RAISE EXCEPTION 'Enrollment is closed'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.challenge_participants
    WHERE challenge_id = p_challenge_id
      AND member_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'You have already joined this challenge'
      USING ERRCODE = '23505';
  END IF;

  SELECT count(*) INTO v_participant_count
  FROM public.challenge_participants
  WHERE challenge_id = p_challenge_id
    AND completion_status <> 'withdrawn';
  IF v_challenge.max_participants IS NOT NULL
    AND v_participant_count >= v_challenge.max_participants THEN
    RAISE EXCEPTION 'Challenge participant limit reached'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.challenge_participants (challenge_id, member_id)
  VALUES (p_challenge_id, (SELECT auth.uid()))
  RETURNING id INTO v_participant_id;

  INSERT INTO public.challenge_notifications (
    member_id, challenge_id, notification_type, title, message
  )
  VALUES (
    (SELECT auth.uid()), p_challenge_id, 'enrollment_confirmed',
    'Challenge joined', v_challenge.title
  )
  ON CONFLICT (member_id, challenge_id, notification_type) DO NOTHING;

  RETURN v_participant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_challenge(p_challenge_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.challenge_participants AS participant
  USING public.challenges AS challenge
  WHERE participant.challenge_id = challenge.id
    AND participant.challenge_id = p_challenge_id
    AND participant.member_id = (SELECT auth.uid())
    AND challenge.status = 'published'
    AND challenge.start_at > now()
    AND NOT EXISTS (
      SELECT 1 FROM public.challenge_activities AS activity
      WHERE activity.participant_id = participant.id
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge cannot be left after it starts or records activity'
      USING ERRCODE = '22023';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_challenge_suggestion(
  p_title text,
  p_description text,
  p_challenge_type text,
  p_target_visits integer,
  p_suggested_duration_days integer,
  p_proposed_reward_kp integer,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT (SELECT public.is_coach()) THEN
    RAISE EXCEPTION 'Coach permission required'
      USING ERRCODE = '42501';
  END IF;
  IF length(trim(coalesce(p_title, ''))) = 0
    OR length(trim(coalesce(p_description, ''))) = 0
    OR length(trim(coalesce(p_reason, ''))) = 0
    OR p_challenge_type IS NULL
    OR p_challenge_type NOT IN ('individual', 'competitive')
    OR p_target_visits IS NULL
    OR p_target_visits <= 0
    OR p_suggested_duration_days IS NULL
    OR p_suggested_duration_days <= 0
    OR p_proposed_reward_kp IS NULL
    OR p_proposed_reward_kp < 0 THEN
    RAISE EXCEPTION 'Suggestion details are invalid'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.challenge_suggestions (
    coach_id, title, description, challenge_type, target_visits,
    proposed_reward_kp, suggested_duration_days, reason
  )
  VALUES (
    (SELECT auth.uid()), trim(p_title), trim(p_description),
    p_challenge_type, p_target_visits, p_proposed_reward_kp,
    p_suggested_duration_days, trim(p_reason)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_review_challenge_suggestion(
  p_suggestion_id uuid,
  p_decision text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_suggestion public.challenge_suggestions%ROWTYPE;
  v_challenge_id uuid;
BEGIN
  IF NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'Admin permission required'
      USING ERRCODE = '42501';
  END IF;
  IF p_decision NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Decision must be approve or reject'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_suggestion
  FROM public.challenge_suggestions
  WHERE id = p_suggestion_id
  FOR UPDATE;
  IF NOT FOUND OR v_suggestion.status <> 'pending' THEN
    RAISE EXCEPTION 'Pending suggestion not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF p_decision = 'approve' THEN
    INSERT INTO public.challenges (
      title, description, category, challenge_type, target_visits,
      completion_reward_kp, created_by
    )
    VALUES (
      v_suggestion.title, v_suggestion.description, 'Coach suggestion',
      v_suggestion.challenge_type, v_suggestion.target_visits,
      CASE WHEN v_suggestion.challenge_type = 'individual'
        THEN v_suggestion.proposed_reward_kp ELSE 0 END,
      (SELECT auth.uid())
    )
    RETURNING id INTO v_challenge_id;

    IF v_suggestion.challenge_type = 'competitive'
      AND v_suggestion.proposed_reward_kp > 0 THEN
      INSERT INTO public.challenge_reward_configurations (
        challenge_id, rank_position, kp_amount
      )
      VALUES (v_challenge_id, 1, v_suggestion.proposed_reward_kp);
    END IF;
  END IF;

  UPDATE public.challenge_suggestions
  SET status = CASE WHEN p_decision = 'approve' THEN 'approved' ELSE 'rejected' END,
      reviewed_by = (SELECT auth.uid()),
      reviewed_at = now(),
      challenge_id = v_challenge_id
  WHERE id = p_suggestion_id;

  RETURN v_challenge_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_challenge_leaderboard(
  p_challenge_id uuid
)
RETURNS TABLE (
  participant_id uuid,
  member_id uuid,
  first_name text,
  last_name text,
  total_visits integer,
  target_visits integer,
  progress_percentage numeric,
  completion_status text,
  joined_at timestamptz,
  last_visit_at timestamptz,
  final_rank integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_visibility text;
  v_status text;
BEGIN
  SELECT visibility, status
  INTO v_visibility, v_status
  FROM public.challenges
  WHERE id = p_challenge_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found'
      USING ERRCODE = 'P0002';
  END IF;
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = '42501';
  END IF;
  IF NOT (SELECT public.is_admin()) THEN
    IF (SELECT public.is_coach()) THEN
      IF NOT EXISTS (
        SELECT 1
        FROM public.challenge_participants AS participant
        WHERE participant.challenge_id = p_challenge_id
          AND public.is_assigned_coach(participant.member_id)
      ) THEN
        RAISE EXCEPTION 'No assigned members are participating in this challenge'
          USING ERRCODE = '42501';
      END IF;
    ELSIF NOT EXISTS (
      SELECT 1
      FROM public.members AS member
      WHERE member.id = (SELECT auth.uid())
    ) OR (
      NOT EXISTS (
        SELECT 1 FROM public.challenge_participants AS own_participant
        WHERE own_participant.challenge_id = p_challenge_id
          AND own_participant.member_id = (SELECT auth.uid())
      )
      AND NOT (v_status = 'published' AND v_visibility = 'public')
    ) THEN
      RAISE EXCEPTION 'Member account required or challenge leaderboard is private'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN QUERY
  WITH scored AS (
    SELECT participant.id,
           participant.member_id,
           account.first_name,
           account.last_name,
           participant.total_visits,
           challenge.target_visits,
           participant.progress_percentage,
           participant.completion_status,
           participant.joined_at,
           participant.last_visit_at,
           participant.final_rank,
           rank() OVER (
             ORDER BY participant.total_visits DESC,
                      participant.last_visit_at ASC NULLS LAST
           )::integer AS current_rank
    FROM public.challenge_participants AS participant
    JOIN public.challenges AS challenge
      ON challenge.id = participant.challenge_id
    JOIN public.users AS account
      ON account.id = participant.member_id
    WHERE participant.challenge_id = p_challenge_id
      AND (
        (SELECT public.is_admin())
        OR (
          (SELECT public.is_coach())
          AND (SELECT public.is_assigned_coach(participant.member_id))
        )
        OR (
          NOT (SELECT public.is_coach())
          AND (
            participant.member_id = (SELECT auth.uid())
            OR (v_status = 'published' AND v_visibility = 'public')
          )
        )
      )
  )
  SELECT scored.id,
         scored.member_id,
         scored.first_name,
         scored.last_name,
         scored.total_visits,
         scored.target_visits,
         scored.progress_percentage,
         scored.completion_status,
         scored.joined_at,
         scored.last_visit_at,
         coalesce(scored.final_rank, scored.current_rank)
  FROM scored
  ORDER BY coalesce(scored.final_rank, scored.current_rank),
           scored.joined_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_challenge_notification_read(
  p_notification_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.challenge_notifications
  SET is_read = true
  WHERE id = p_notification_id
    AND member_id = (SELECT auth.uid());
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Notification not found'
      USING ERRCODE = 'P0002';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_finalize_challenge(
  p_challenge_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_challenge public.challenges%ROWTYPE;
  v_reward record;
  v_reward_id uuid;
  v_points_transaction_id uuid;
  v_rank integer;
  v_reward_type text;
BEGIN
  IF NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'Admin permission required'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_challenge
  FROM public.challenges
  WHERE id = p_challenge_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found'
      USING ERRCODE = 'P0002';
  END IF;
  IF v_challenge.status NOT IN ('published', 'paused')
    OR v_challenge.end_at IS NULL
    OR v_challenge.end_at > now() THEN
    RAISE EXCEPTION 'Only ended challenges can be finalized'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.challenges
  SET status = 'finalizing', updated_at = now()
  WHERE id = p_challenge_id;

  IF v_challenge.challenge_type = 'competitive' THEN
    WITH ranked AS (
      SELECT id,
             rank() OVER (
               ORDER BY total_visits DESC, last_visit_at ASC NULLS LAST
             )::integer AS rank_position
      FROM public.challenge_participants
      WHERE challenge_id = p_challenge_id
        AND completion_status <> 'withdrawn'
        AND total_visits > 0
    )
    UPDATE public.challenge_participants AS participant
    SET final_rank = ranked.rank_position,
        updated_at = now()
    FROM ranked
    WHERE participant.id = ranked.id;

    FOR v_reward IN
      SELECT participant.id AS participant_id,
             participant.member_id,
             participant.final_rank,
             configuration.kp_amount
      FROM public.challenge_participants AS participant
      JOIN public.challenge_reward_configurations AS configuration
        ON configuration.challenge_id = participant.challenge_id
       AND configuration.rank_position = participant.final_rank
      WHERE participant.challenge_id = p_challenge_id
        AND participant.completion_status <> 'withdrawn'
        AND participant.total_visits > 0
        AND configuration.kp_amount > 0
    LOOP
      v_rank := v_reward.final_rank;
      v_reward_type := 'placement_' || v_rank::text;

      INSERT INTO public.challenge_rewards (
        challenge_id, member_id, reward_type, kp_amount, status,
        points_transaction_id
      )
      VALUES (
        p_challenge_id, v_reward.member_id, v_reward_type,
        v_reward.kp_amount, 'awarded',
        public.apply_member_points_transaction(
          v_reward.member_id,
          v_reward.kp_amount,
          'challenge_reward',
          'competitive_challenge',
          p_challenge_id,
          'Placement reward for ' || v_challenge.title,
          'challenge:' || p_challenge_id::text || ':member:' ||
            v_reward.member_id::text || ':' || v_reward_type,
          (SELECT auth.uid())
        )
      )
      ON CONFLICT (challenge_id, member_id, reward_type) DO NOTHING
      RETURNING id INTO v_reward_id;

      IF v_reward_id IS NOT NULL THEN
        INSERT INTO public.challenge_notifications (
          member_id, challenge_id, notification_type, title, message
        )
        VALUES (
          v_reward.member_id, p_challenge_id,
          'competition_reward_' || v_rank::text,
          'Competition results finalized',
          'You received ' || v_reward.kp_amount::text || ' KP for ' ||
            v_challenge.title
        )
        ON CONFLICT (member_id, challenge_id, notification_type) DO NOTHING;
      END IF;
      v_reward_id := NULL;
    END LOOP;
  END IF;

  UPDATE public.challenges
  SET status = 'completed', updated_at = now()
  WHERE id = p_challenge_id;

  INSERT INTO public.challenge_notifications (
    member_id, challenge_id, notification_type, title, message
  )
  SELECT participant.member_id, p_challenge_id, 'challenge_completed',
         'Challenge completed', v_challenge.title
  FROM public.challenge_participants AS participant
  WHERE participant.challenge_id = p_challenge_id
  ON CONFLICT (member_id, challenge_id, notification_type) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_challenge_attendance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_attendance_date date;
  v_duration_minutes numeric;
  v_challenge record;
  v_before numeric;
  v_after numeric;
  v_reward_id uuid;
  v_points_transaction_id uuid;
BEGIN
  IF OLD.check_out IS NOT NULL
    OR NEW.check_out IS NULL
    OR NEW.member_id IS NULL
    OR NEW.check_out <= NEW.check_in THEN
    RETURN NEW;
  END IF;

  v_attendance_date :=
    (NEW.check_in AT TIME ZONE 'Asia/Manila')::date;
  v_duration_minutes :=
    extract(epoch FROM (NEW.check_out - NEW.check_in)) / 60.0;

  IF NOT EXISTS (
    SELECT 1
    FROM public.memberships AS membership
    WHERE membership.member_id = NEW.member_id
      AND membership.status = 'active'
      AND v_attendance_date BETWEEN membership.start_date AND membership.end_date
  ) THEN
    RETURN NEW;
  END IF;

  FOR v_challenge IN
    SELECT challenge.id,
           challenge.title,
           challenge.challenge_type,
           challenge.target_visits,
           challenge.completion_reward_kp,
           challenge.minimum_session_minutes,
           challenge.max_daily_visits,
           participant.id AS participant_id,
           participant.total_visits,
           participant.progress_percentage
    FROM public.challenges AS challenge
    JOIN public.challenge_participants AS participant
      ON participant.challenge_id = challenge.id
     AND participant.member_id = NEW.member_id
    WHERE challenge.status = 'published'
      AND challenge.start_at <= NEW.check_in
      AND challenge.end_at >= NEW.check_out
      AND v_duration_minutes >= challenge.minimum_session_minutes
      AND participant.joined_at <= NEW.check_in
      AND participant.completion_status <> 'withdrawn'
    FOR SHARE OF challenge
  LOOP
    PERFORM pg_advisory_xact_lock(
      hashtextextended(
        v_challenge.id::text || ':' || NEW.member_id::text || ':' ||
          v_attendance_date::text,
        0
      )
    );

    IF (
      SELECT count(*)
      FROM public.challenge_activities AS activity
      WHERE activity.challenge_id = v_challenge.id
        AND activity.member_id = NEW.member_id
        AND activity.attendance_date = v_attendance_date
        AND activity.eligible
    ) >= v_challenge.max_daily_visits THEN
      CONTINUE;
    END IF;

    INSERT INTO public.challenge_activities (
      challenge_id, participant_id, member_id, gym_session_id, attendance_date
    )
    VALUES (
      v_challenge.id, v_challenge.participant_id, NEW.member_id,
      NEW.id, v_attendance_date
    )
    ON CONFLICT (challenge_id, gym_session_id) DO NOTHING;
    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    v_before := v_challenge.progress_percentage;
    UPDATE public.challenge_participants
    SET total_visits = total_visits + 1,
        progress_percentage = least(
          100,
          round(((total_visits + 1)::numeric / v_challenge.target_visits) * 100, 2)
        ),
        completion_status = CASE
          WHEN v_challenge.challenge_type = 'individual'
            AND total_visits + 1 >= v_challenge.target_visits
            THEN 'completed'
          ELSE completion_status
        END,
        completed_at = CASE
          WHEN v_challenge.challenge_type = 'individual'
            AND total_visits + 1 >= v_challenge.target_visits
            THEN coalesce(completed_at, NEW.check_out)
          ELSE completed_at
        END,
        last_visit_at = NEW.check_out,
        updated_at = now()
    WHERE id = v_challenge.participant_id
    RETURNING progress_percentage INTO v_after;

    IF v_before < 50 AND v_after >= 50 THEN
      INSERT INTO public.challenge_notifications (
        member_id, challenge_id, notification_type, title, message
      )
      VALUES (
        NEW.member_id, v_challenge.id, 'progress_50',
        'Halfway there', v_challenge.title
      )
      ON CONFLICT (member_id, challenge_id, notification_type) DO NOTHING;
    END IF;
    IF v_before < 75 AND v_after >= 75 THEN
      INSERT INTO public.challenge_notifications (
        member_id, challenge_id, notification_type, title, message
      )
      VALUES (
        NEW.member_id, v_challenge.id, 'progress_75',
        'Challenge progress update', v_challenge.title
      )
      ON CONFLICT (member_id, challenge_id, notification_type) DO NOTHING;
    END IF;

    IF v_challenge.challenge_type = 'individual'
      AND v_before < 100
      AND v_after >= 100 THEN
      INSERT INTO public.challenge_notifications (
        member_id, challenge_id, notification_type, title, message
      )
      VALUES (
        NEW.member_id, v_challenge.id, 'challenge_completed',
        'Challenge completed', v_challenge.title
      )
      ON CONFLICT (member_id, challenge_id, notification_type) DO NOTHING;
    END IF;

    IF v_challenge.challenge_type = 'individual'
      AND v_after >= 100
      AND v_challenge.completion_reward_kp > 0 THEN
      INSERT INTO public.challenge_rewards (
        challenge_id, member_id, reward_type, kp_amount,
        points_transaction_id
      )
      VALUES (
        v_challenge.id, NEW.member_id, 'completion',
        v_challenge.completion_reward_kp,
        public.apply_member_points_transaction(
          NEW.member_id,
          v_challenge.completion_reward_kp,
          'challenge_reward',
          'individual_challenge',
          v_challenge.id,
          'Completion reward for ' || v_challenge.title,
          'challenge:' || v_challenge.id::text || ':member:' ||
            NEW.member_id::text || ':completion',
          NULL
        )
      )
      ON CONFLICT (challenge_id, member_id, reward_type) DO NOTHING
      RETURNING id INTO v_reward_id;

      IF v_reward_id IS NOT NULL THEN
        INSERT INTO public.challenge_notifications (
          member_id, challenge_id, notification_type, title, message
        )
        VALUES (
          NEW.member_id, v_challenge.id, 'completion_reward',
          'Challenge completed',
          'You earned ' || v_challenge.completion_reward_kp::text ||
            ' KP for ' || v_challenge.title
        )
        ON CONFLICT (member_id, challenge_id, notification_type) DO NOTHING;
      END IF;
      v_reward_id := NULL;
      v_points_transaction_id := NULL;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS process_challenge_attendance_after_checkout
  ON public.attendance;
CREATE TRIGGER process_challenge_attendance_after_checkout
  AFTER UPDATE OF check_out ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.process_challenge_attendance();

REVOKE ALL ON FUNCTION public.admin_save_challenge(
  uuid, text, text, text, text, text, integer, timestamptz, timestamptz,
  timestamptz, timestamptz, integer, integer, integer, integer, integer,
  integer, integer, text, text, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_challenge(
  uuid, text, text, text, text, text, integer, timestamptz, timestamptz,
  timestamptz, timestamptz, integer, integer, integer, integer, integer,
  integer, integer, text, text, text
) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_publish_challenge(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_publish_challenge(uuid)
  TO authenticated;

REVOKE ALL ON FUNCTION public.admin_change_challenge_status(uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_change_challenge_status(uuid, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.join_challenge(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_challenge(uuid)
  TO authenticated;

REVOKE ALL ON FUNCTION public.leave_challenge(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leave_challenge(uuid)
  TO authenticated;

REVOKE ALL ON FUNCTION public.submit_challenge_suggestion(
  text, text, text, integer, integer, integer, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_challenge_suggestion(
  text, text, text, integer, integer, integer, text
) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_review_challenge_suggestion(uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_challenge_suggestion(uuid, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.get_challenge_leaderboard(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_challenge_leaderboard(uuid)
  TO authenticated;

REVOKE ALL ON FUNCTION public.mark_challenge_notification_read(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_challenge_notification_read(uuid)
  TO authenticated;

REVOKE ALL ON FUNCTION public.admin_finalize_challenge(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_finalize_challenge(uuid)
  TO authenticated;

REVOKE ALL ON FUNCTION public.process_challenge_attendance()
  FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
