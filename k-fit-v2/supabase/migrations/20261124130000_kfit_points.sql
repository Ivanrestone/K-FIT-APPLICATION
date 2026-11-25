CREATE TABLE IF NOT EXISTS public.member_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL UNIQUE
    REFERENCES public.members(id) ON DELETE CASCADE,
  balance bigint NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL
    REFERENCES public.members(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount <> 0),
  transaction_type text NOT NULL CHECK (
    transaction_type IN ('earn', 'deduction', 'adjustment', 'challenge_reward')
  ),
  source text NOT NULL,
  reference_id uuid,
  description text NOT NULL CHECK (length(trim(description)) > 0),
  idempotency_key text NOT NULL UNIQUE
    CHECK (length(trim(idempotency_key)) > 0),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (transaction_type IN ('earn', 'challenge_reward') AND amount > 0)
    OR (transaction_type = 'deduction' AND amount < 0)
    OR transaction_type = 'adjustment'
  )
);

CREATE INDEX IF NOT EXISTS points_transactions_member_created_idx
  ON public.points_transactions (member_id, created_at DESC);

ALTER TABLE public.member_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS member_points_read_own_or_admin
  ON public.member_points;
CREATE POLICY member_points_read_own_or_admin
  ON public.member_points
  FOR SELECT
  TO authenticated
  USING (member_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS points_transactions_read_own_or_admin
  ON public.points_transactions;
CREATE POLICY points_transactions_read_own_or_admin
  ON public.points_transactions
  FOR SELECT
  TO authenticated
  USING (member_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

REVOKE ALL ON public.member_points, public.points_transactions
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.member_points, public.points_transactions
  TO authenticated;

INSERT INTO public.member_points (member_id)
SELECT id FROM public.members
ON CONFLICT (member_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.ensure_member_points_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.member_points (member_id)
  VALUES (NEW.id)
  ON CONFLICT (member_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_member_points_account_after_insert
  ON public.members;
CREATE TRIGGER ensure_member_points_account_after_insert
  AFTER INSERT ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_member_points_account();

REVOKE ALL ON FUNCTION public.ensure_member_points_account()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.apply_member_points_transaction(
  p_member_id uuid,
  p_amount integer,
  p_transaction_type text,
  p_source text,
  p_reference_id uuid,
  p_description text,
  p_idempotency_key text,
  p_created_by uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_balance bigint;
  v_transaction_id uuid;
  v_existing public.points_transactions%ROWTYPE;
BEGIN
  IF p_member_id IS NULL
    OR p_amount IS NULL
    OR p_amount = 0
    OR p_transaction_type IS NULL
    OR p_transaction_type NOT IN (
      'earn', 'deduction', 'adjustment', 'challenge_reward'
    )
    OR length(trim(coalesce(p_source, ''))) = 0
    OR length(trim(coalesce(p_description, ''))) = 0
    OR length(trim(coalesce(p_idempotency_key, ''))) = 0 THEN
    RAISE EXCEPTION 'Invalid points transaction'
      USING ERRCODE = '22023';
  END IF;

  IF (p_transaction_type IN ('earn', 'challenge_reward') AND p_amount < 0)
    OR (p_transaction_type = 'deduction' AND p_amount > 0) THEN
    RAISE EXCEPTION 'Transaction amount does not match its type'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.members WHERE id = p_member_id
  ) THEN
    RAISE EXCEPTION 'Member does not exist'
      USING ERRCODE = '23503';
  END IF;

  INSERT INTO public.member_points (member_id)
  VALUES (p_member_id)
  ON CONFLICT (member_id) DO NOTHING;

  SELECT balance
  INTO v_balance
  FROM public.member_points
  WHERE member_id = p_member_id
  FOR UPDATE;

  SELECT *
  INTO v_existing
  FROM public.points_transactions
  WHERE idempotency_key = trim(p_idempotency_key);

  IF FOUND THEN
    IF v_existing.member_id <> p_member_id
      OR v_existing.amount <> p_amount
      OR v_existing.transaction_type <> p_transaction_type
      OR v_existing.source <> trim(p_source)
      OR v_existing.reference_id IS DISTINCT FROM p_reference_id
      OR v_existing.description <> trim(p_description) THEN
      RAISE EXCEPTION 'Idempotency key was already used for a different transaction'
        USING ERRCODE = '23505';
    END IF;
    RETURN v_existing.id;
  END IF;

  IF v_balance + p_amount < 0 THEN
    RAISE EXCEPTION 'Points balance cannot be negative'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.points_transactions (
    member_id,
    amount,
    transaction_type,
    source,
    reference_id,
    description,
    idempotency_key,
    created_by
  )
  VALUES (
    p_member_id,
    p_amount,
    p_transaction_type,
    trim(p_source),
    p_reference_id,
    trim(p_description),
    trim(p_idempotency_key),
    p_created_by
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_transaction_id;

  IF v_transaction_id IS NULL THEN
    SELECT *
    INTO v_existing
    FROM public.points_transactions
    WHERE idempotency_key = trim(p_idempotency_key);

    IF v_existing.member_id <> p_member_id
      OR v_existing.amount <> p_amount
      OR v_existing.transaction_type <> p_transaction_type
      OR v_existing.source <> trim(p_source)
      OR v_existing.reference_id IS DISTINCT FROM p_reference_id
      OR v_existing.description <> trim(p_description) THEN
      RAISE EXCEPTION 'Idempotency key was already used for a different transaction'
        USING ERRCODE = '23505';
    END IF;

    RETURN v_existing.id;
  END IF;

  UPDATE public.member_points
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE member_id = p_member_id;

  RETURN v_transaction_id;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_member_points_transaction(
  uuid, integer, text, text, uuid, text, text, uuid
) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_adjust_member_points(
  p_member_id uuid,
  p_amount integer,
  p_reason text,
  p_idempotency_key text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'Admin permission required'
      USING ERRCODE = '42501';
  END IF;

  IF p_amount IS NULL OR p_amount = 0
    OR length(trim(coalesce(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION 'A non-zero adjustment and a reason are required'
      USING ERRCODE = '22023';
  END IF;

  RETURN public.apply_member_points_transaction(
    p_member_id,
    p_amount,
    'adjustment',
    'admin_adjustment',
    NULL,
    trim(p_reason),
    p_idempotency_key,
    (SELECT auth.uid())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_adjust_member_points(
  uuid, integer, text, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_member_points(
  uuid, integer, text, text
) TO authenticated;

NOTIFY pgrst, 'reload schema';
