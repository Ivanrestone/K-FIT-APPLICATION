-- Log the raw scanned QR value on expiry rejections for debugging

CREATE OR REPLACE FUNCTION public.scan_member_checkin(qr_value text)
 RETURNS TABLE(success boolean, attendance_id uuid, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    target_member UUID;
    new_attendance UUID;
    base_token text;
BEGIN

    -- ADMIN ONLY
    IF NOT (SELECT public.is_admin()) THEN
        RAISE EXCEPTION 'Admin permission required';
    END IF;

    base_token := public.parse_qr_token(qr_value);

    IF base_token IS NULL THEN
        INSERT INTO public.scanner_logs(
            scanned_by, scan_type, result, message
        )
        VALUES (
            (SELECT auth.uid()), 'check_in',
            'rejected', 'QR code expired | raw: ' || left(qr_value, 80)
        );

        RETURN QUERY
        SELECT false, NULL::UUID, 'QR code expired — ask member to refresh';
        RETURN;
    END IF;

    SELECT id INTO target_member
    FROM public.members
    WHERE qr_token = base_token;

    IF target_member IS NULL THEN
        INSERT INTO public.scanner_logs(
            scanned_by, scan_type, result, message
        )
        VALUES (
            (SELECT auth.uid()), 'check_in',
            'rejected', 'Invalid QR code'
        );

        RETURN QUERY
        SELECT false, NULL::UUID, 'Invalid QR code';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.memberships
        WHERE member_id = target_member
        AND status = 'active'
        AND CURRENT_DATE BETWEEN start_date AND end_date
    ) THEN

        INSERT INTO public.scanner_logs(
            member_id, scanned_by, scan_type, result, message
        )
        VALUES (
            target_member, (SELECT auth.uid()),
            'check_in', 'rejected',
            'No active membership'
        );

        RETURN QUERY
        SELECT false, NULL::UUID, 'No active membership';
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.attendance
        WHERE member_id = target_member
        AND check_out IS NULL
    ) THEN

        INSERT INTO public.scanner_logs(
            member_id, scanned_by, scan_type, result, message
        )
        VALUES (
            target_member, (SELECT auth.uid()),
            'check_in', 'rejected',
            'Already checked in'
        );

        RETURN QUERY
        SELECT false, NULL::UUID, 'Member already checked in';
        RETURN;
    END IF;

    INSERT INTO public.attendance(member_id)
    VALUES (target_member)
    RETURNING id INTO new_attendance;

    INSERT INTO public.scanner_logs(
        member_id, scanned_by, scan_type, result, message
    )
    VALUES (
        target_member, (SELECT auth.uid()),
        'check_in', 'success',
        'Check-in successful'
    );

    RETURN QUERY
    SELECT true, new_attendance, 'Check-in successful';

END;
$function$;

CREATE OR REPLACE FUNCTION public.scan_member_checkout(qr_value text)
 RETURNS TABLE(success boolean, attendance_id uuid, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    target_member UUID;
    target_attendance UUID;
    base_token text;
BEGIN

    -- ADMIN ONLY
    IF NOT (SELECT public.is_admin()) THEN
        RAISE EXCEPTION 'Admin permission required';
    END IF;

    base_token := public.parse_qr_token(qr_value);

    IF base_token IS NULL THEN
        INSERT INTO public.scanner_logs(
            scanned_by, scan_type, result, message
        )
        VALUES (
            (SELECT auth.uid()), 'check_out',
            'rejected', 'QR code expired | raw: ' || left(qr_value, 80)
        );

        RETURN QUERY
        SELECT false, NULL::UUID, 'QR code expired — ask member to refresh';
        RETURN;
    END IF;

    SELECT id INTO target_member
    FROM public.members
    WHERE qr_token = base_token;

    IF target_member IS NULL THEN
        INSERT INTO public.scanner_logs(
            scanned_by, scan_type, result, message
        )
        VALUES (
            (SELECT auth.uid()), 'check_out',
            'rejected', 'Invalid QR code'
        );

        RETURN QUERY
        SELECT false, NULL::UUID, 'Invalid QR code';
        RETURN;
    END IF;

    UPDATE public.attendance
    SET check_out = NOW()
    WHERE member_id = target_member
    AND check_out IS NULL
    RETURNING id INTO target_attendance;

    IF target_attendance IS NULL THEN
        INSERT INTO public.scanner_logs(
            member_id, scanned_by, scan_type, result, message
        )
        VALUES (
            target_member, (SELECT auth.uid()),
            'check_out', 'rejected',
            'No open attendance session'
        );

        RETURN QUERY
        SELECT false, NULL::UUID, 'No active check-in found';
        RETURN;
    END IF;

    INSERT INTO public.scanner_logs(
        member_id, scanned_by, scan_type, result, message
    )
    VALUES (
        target_member, (SELECT auth.uid()),
        'check_out', 'success',
        'Check-out successful'
    );

    RETURN QUERY
    SELECT true, target_attendance, 'Check-out successful';

END;
$function$;
