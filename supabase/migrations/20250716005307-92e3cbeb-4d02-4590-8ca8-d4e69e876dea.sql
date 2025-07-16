
-- First, let's check if the trigger exists and is working properly
-- Drop and recreate the trigger with better error handling and logging

DROP TRIGGER IF EXISTS trigger_update_member_on_payment ON payments;

-- Update the function with better error handling and debugging
CREATE OR REPLACE FUNCTION public.update_member_last_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  plan_price NUMERIC;
  plan_duration INTEGER;
  current_expiry DATE;
  new_expiry DATE;
  extension_months INTEGER;
  member_record RECORD;
BEGIN
  -- Log the payment being processed
  RAISE LOG 'Processing payment: Member ID %, Amount %, Plan %', NEW.member_id, NEW.amount, NEW.plan_name;

  -- Get member record to verify it exists
  SELECT * INTO member_record FROM members WHERE id = NEW.member_id;
  
  IF NOT FOUND THEN
    RAISE LOG 'Member not found with ID: %', NEW.member_id;
    RETURN NEW;
  END IF;

  RAISE LOG 'Found member: % (%), Current expiry: %', member_record.name, member_record.user_id, member_record.plan_expiry_date;

  -- Get the plan price and duration from membership_plans table
  SELECT price, duration_months INTO plan_price, plan_duration
  FROM membership_plans
  WHERE name = NEW.plan_name AND gym_id = NEW.gym_id AND is_active = true
  LIMIT 1;

  -- If plan not found, use defaults based on common plan names
  IF plan_price IS NULL THEN
    CASE 
      WHEN LOWER(NEW.plan_name) LIKE '%basic%' THEN
        plan_price := 1000.00;
        plan_duration := 1;
      WHEN LOWER(NEW.plan_name) LIKE '%premium%' THEN
        plan_price := 2000.00;
        plan_duration := 1;
      WHEN LOWER(NEW.plan_name) LIKE '%annual%' OR LOWER(NEW.plan_name) LIKE '%yearly%' THEN
        plan_price := 10000.00;
        plan_duration := 12;
      ELSE
        plan_price := NEW.amount; -- Use payment amount as fallback
        plan_duration := 1;
    END CASE;
    RAISE LOG 'Plan not found for %, using default price % for % months', NEW.plan_name, plan_price, plan_duration;
  ELSE
    RAISE LOG 'Found plan: % price, % months duration', plan_price, plan_duration;
  END IF;

  -- Calculate extension months: (payment amount / plan price) * plan duration
  -- This ensures we get the correct extension based on how much was paid
  extension_months := GREATEST(1, FLOOR((NEW.amount / plan_price) * plan_duration));

  RAISE LOG 'Calculated extension: % months (Payment: %, Plan Price: %, Plan Duration: %)', 
    extension_months, NEW.amount, plan_price, plan_duration;

  -- Get current expiry date
  SELECT plan_expiry_date INTO current_expiry FROM members WHERE id = NEW.member_id;

  -- Calculate new expiry date
  -- If current expiry is in the future, extend from that date
  -- Otherwise, extend from today
  IF current_expiry IS NOT NULL AND current_expiry > CURRENT_DATE THEN
    new_expiry := current_expiry + (extension_months || ' months')::INTERVAL;
    RAISE LOG 'Extending from current expiry % by % months to %', current_expiry, extension_months, new_expiry;
  ELSE
    new_expiry := CURRENT_DATE + (extension_months || ' months')::INTERVAL;
    RAISE LOG 'Extending from today % by % months to %', CURRENT_DATE, extension_months, new_expiry;
  END IF;

  -- Update member record
  UPDATE members
  SET 
    last_payment = NEW.payment_date,
    plan_expiry_date = new_expiry,
    status = 'active',
    expiry_notification_sent = false,
    notification_sent_at = NULL,
    updated_at = now()
  WHERE id = NEW.member_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE LOG 'Failed to update member with ID: %', NEW.member_id;
  ELSE
    RAISE LOG 'Successfully extended membership for member % (%) by % months. Payment: %, Plan Price: %, New Expiry: %', 
      NEW.member_id, member_record.user_id, extension_months, NEW.amount, plan_price, new_expiry;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER trigger_update_member_on_payment
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_member_last_payment();

-- Also let's check if there are any existing payments that didn't trigger properly
-- and manually update those members
DO $$
DECLARE
  payment_record RECORD;
BEGIN
  -- Process recent payments that may not have triggered properly
  FOR payment_record IN 
    SELECT p.*, m.plan_expiry_date, m.user_id as member_user_id
    FROM payments p
    JOIN members m ON p.member_id = m.id
    WHERE p.created_at > NOW() - INTERVAL '1 hour'
    ORDER BY p.created_at DESC
  LOOP
    RAISE LOG 'Manually processing payment for member % (%), current expiry: %', 
      payment_record.member_name, payment_record.member_user_id, payment_record.plan_expiry_date;
    
    -- Trigger the function manually for recent payments
    PERFORM update_member_last_payment() FROM (
      SELECT payment_record.gym_id as gym_id,
             payment_record.member_id as member_id,
             payment_record.member_user_id as member_user_id,
             payment_record.member_name as member_name,
             payment_record.amount as amount,
             payment_record.payment_date as payment_date,
             payment_record.payment_method as payment_method,
             payment_record.plan_name as plan_name,
             payment_record.notes as notes,
             payment_record.status as status
    ) as NEW;
  END LOOP;
END $$;
