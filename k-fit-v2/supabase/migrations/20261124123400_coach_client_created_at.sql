ALTER TABLE public.coach_clients
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

ALTER TABLE public.coach_clients
  ALTER COLUMN created_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS coach_clients_coach_created_at_idx
  ON public.coach_clients (coach_id, created_at DESC);
