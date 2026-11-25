-- Widen rotating QR grace window from +/-1 to +/-2 windows (~75s validity)
-- to tolerate device clock skew and scan delays.

CREATE OR REPLACE FUNCTION public.parse_qr_token(qr_value text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  parts text[];
  token text;
  window_num bigint;
  current_window bigint;
BEGIN
  parts := string_to_array(qr_value, ':');

  -- Bare token (manual entry or old app version) — accept as-is
  IF parts IS NULL OR array_length(parts, 1) IS NULL OR array_length(parts, 1) = 1 THEN
    RETURN qr_value;
  END IF;

  -- Rotating format must be exactly "token:window"
  IF array_length(parts, 1) <> 2 THEN
    RETURN NULL;
  END IF;

  token := parts[1];

  BEGIN
    window_num := parts[2]::bigint;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;

  current_window := floor(extract(epoch from now()) / 15)::bigint;

  -- Accept current window plus two windows of grace on either side
  IF abs(current_window - window_num) > 2 THEN
    RETURN NULL;
  END IF;

  RETURN token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.parse_qr_token(text) TO authenticated;
