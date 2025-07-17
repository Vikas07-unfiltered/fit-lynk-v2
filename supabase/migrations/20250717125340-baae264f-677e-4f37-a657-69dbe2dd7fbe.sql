-- Update the get_expired_members function to use the new table
CREATE OR REPLACE FUNCTION public.get_expired_members(target_gym_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(member_id uuid, member_user_id text, member_name text, member_phone text, gym_id uuid, gym_name text, plan_name text, expiry_date date, days_expired integer, last_payment_date date, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as member_id,
    m.user_id as member_user_id,
    m.name as member_name,
    m.phone as member_phone,
    m.gym_id,
    g.name as gym_name,
    m.plan as plan_name,
    ed.expiry_date,
    (CURRENT_DATE - ed.expiry_date)::INTEGER as days_expired,
    m.last_payment::DATE as last_payment_date,
    m.status
  FROM members m
  JOIN gyms g ON m.gym_id = g.id
  JOIN member_expiry_dates ed ON m.id = ed.member_id AND m.gym_id = ed.gym_id
  WHERE 
    ed.expiry_date < CURRENT_DATE
    AND (target_gym_id IS NULL OR m.gym_id = target_gym_id)
  ORDER BY ed.expiry_date ASC;
END;
$function$;

-- Update the extend_membership function to work with the new table
CREATE OR REPLACE FUNCTION public.extend_membership(p_member_id uuid, p_months integer DEFAULT 1)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_expiry DATE;
  new_expiry DATE;
  member_gym_id UUID;
BEGIN
  -- Get current expiry date and gym_id
  SELECT ed.expiry_date, m.gym_id INTO current_expiry, member_gym_id
  FROM member_expiry_dates ed
  JOIN members m ON ed.member_id = m.id
  WHERE ed.member_id = p_member_id;

  -- Calculate new expiry date
  IF current_expiry IS NOT NULL AND current_expiry > CURRENT_DATE THEN
    new_expiry := current_expiry + (p_months || ' months')::INTERVAL;
  ELSE
    new_expiry := CURRENT_DATE + (p_months || ' months')::INTERVAL;
  END IF;

  -- Update expiry date in the new table
  UPDATE member_expiry_dates
  SET 
    expiry_date = new_expiry,
    updated_at = now()
  WHERE member_id = p_member_id;

  -- Update member record
  UPDATE members
  SET 
    status = 'active',
    expiry_notification_sent = false,
    notification_sent_at = NULL,
    updated_at = now()
  WHERE id = p_member_id;

  RETURN FOUND;
END;
$function$;

-- Update the get_expiring_members function to use the new table
CREATE OR REPLACE FUNCTION public.get_expiring_members(days_before integer DEFAULT 5)
 RETURNS TABLE(member_id uuid, member_name text, member_phone text, gym_id uuid, plan_name text, expiry_date date)
 LANGUAGE sql
AS $function$
  SELECT 
    m.id,
    m.name,
    m.phone,
    m.gym_id,
    m.plan,
    ed.expiry_date
  FROM public.members m
  JOIN public.member_expiry_dates ed ON m.id = ed.member_id
  WHERE ed.expiry_date = CURRENT_DATE + INTERVAL '1 day' * days_before
    AND m.status = 'active'
    AND (m.expiry_notification_sent = FALSE OR m.expiry_notification_sent IS NULL);
$function$;