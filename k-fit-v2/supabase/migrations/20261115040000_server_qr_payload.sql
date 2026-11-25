-- Server-issued rotating QR payload.
-- The member app fetches this every ~15s; the window is computed from the
-- DATABASE clock, so member device clock skew can never cause false expiries.

CREATE OR REPLACE FUNCTION public.get_my_qr_payload()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  token text;
BEGIN
  SELECT qr_token INTO token
  FROM public.members
  WHERE id = (SELECT auth.uid());

  IF token IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN token || ':' || floor(extract(epoch from now()) / 15)::bigint::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_qr_payload() TO authenticated;
