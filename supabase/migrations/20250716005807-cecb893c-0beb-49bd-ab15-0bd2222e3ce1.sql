-- Check and fix the trigger function to bypass RLS issues
-- The problem is that even though the function runs, the UPDATE fails due to RLS

-- First, let's modify the trigger function to bypass RLS by using a security definer approach
DROP TRIGGER IF EXISTS trigger_update_member_on_payment ON payments;

-- Create a more secure version that bypasses RLS
CREATE OR REPLACE FUNCTION public.update_member_last_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  plan_price NUMERIC;
  plan_duration INTEGER;
  current_expiry DATE;
  new_expiry DATE;
  extension_months INTEGER;
  member_record RECORD;
  update_count INTEGER;
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
  extension_months := GREATEST(1, FLOOR((NEW.amount / plan_price) * plan_duration));

  RAISE LOG 'Calculated extension: % months (Payment: %, Plan Price: %, Plan Duration: %)', 
    extension_months, NEW.amount, plan_price, plan_duration;

  -- Get current expiry date
  current_expiry := member_record.plan_expiry_date;

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

  -- Update member record with explicit security definer privileges
  -- This bypasses RLS policies
  UPDATE members
  SET 
    last_payment = NEW.payment_date,
    plan_expiry_date = new_expiry,
    status = 'active',
    expiry_notification_sent = false,
    notification_sent_at = NULL,
    updated_at = now()
  WHERE id = NEW.member_id;

  -- Get the number of updated rows
  GET DIAGNOSTICS update_count = ROW_COUNT;

  -- Check if update was successful
  IF update_count = 0 THEN
    RAISE LOG 'Failed to update member with ID: % (no rows affected)', NEW.member_id;
  ELSE
    RAISE LOG 'Successfully extended membership for member % (%) by % months. Payment: %, Plan Price: %, New Expiry: %, Rows Updated: %', 
      NEW.member_id, member_record.user_id, extension_months, NEW.amount, plan_price, new_expiry, update_count;
  END IF;

  RETURN NEW;
END;
$function$;

-- Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION public.update_member_last_payment() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_member_last_payment() TO anon;

-- Create the trigger
CREATE TRIGGER trigger_update_member_on_payment
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_member_last_payment();

-- Test the trigger by updating a recent payment to verify it works
-- We'll use the most recent payment for member FI0003
DO $$
DECLARE
  test_payment_id UUID;
  member_id_var UUID;
BEGIN
  -- Get the most recent payment for member FI0003
  SELECT p.id, p.member_id INTO test_payment_id, member_id_var
  FROM payments p
  JOIN members m ON p.member_id = m.id
  WHERE m.user_id = 'FI0003'
  ORDER BY p.created_at DESC
  LIMIT 1;

  IF test_payment_id IS NOT NULL THEN
    RAISE LOG 'Testing trigger with payment ID: %, member ID: %', test_payment_id, member_id_var;
    
    -- Manually trigger the function to test
    PERFORM update_member_last_payment() FROM (
      SELECT p.gym_id, p.member_id, p.member_user_id, p.member_name, 
             p.amount, p.payment_date, p.payment_method, p.plan_name, 
             p.notes, p.status
      FROM payments p
      WHERE p.id = test_payment_id
    ) as NEW;
  END IF;
END $$;