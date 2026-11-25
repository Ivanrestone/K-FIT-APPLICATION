-- Xendit payment gateway integration columns for public.payments
-- Preserves all existing manual payment records; new columns are nullable.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS gateway text,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS gateway_invoice_id text,
  ADD COLUMN IF NOT EXISTS checkout_url text,
  ADD COLUMN IF NOT EXISTS gateway_status text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Prevent duplicate gateway invoice references
CREATE UNIQUE INDEX IF NOT EXISTS payments_external_id_key
  ON public.payments (external_id)
  WHERE external_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payments_gateway_invoice_id_key
  ON public.payments (gateway_invoice_id)
  WHERE gateway_invoice_id IS NOT NULL;

-- Keep updated_at fresh on row updates
CREATE OR REPLACE FUNCTION public.set_payments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_set_updated_at ON public.payments;
CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_payments_updated_at();
