-- First, let's check and fix the trigger function to ensure it works properly
DROP TRIGGER IF EXISTS trigger_update_member_on_payment ON payments;

-- Update the trigger function to be more robust
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
  -- Get member record to verify it exists
  SELECT * INTO member_record FROM members WHERE id = NEW.member_id;
  
  IF NOT FOUND THEN
    RAISE LOG 'Member not found with ID: %', NEW.member_id;
    RETURN NEW;
  END IF;

  -- Get the plan price and duration from membership_plans table
  SELECT price, duration_months INTO plan_price, plan_duration
  FROM membership_plans
  WHERE name = NEW.plan_name AND gym_id = NEW.gym_id AND is_active = true
  LIMIT 1;

  -- If plan not found, use defaults (basic plan is ₹1000 for 1 month)
  IF plan_price IS NULL THEN
    plan_price := 1000.00; -- Default basic plan price
    plan_duration := 1;
    RAISE LOG 'Plan not found for %, using default basic plan price of 1000', NEW.plan_name;
  END IF;

  -- Calculate extension months: (payment amount / plan price) = extended months
  extension_months := GREATEST(1, FLOOR(NEW.amount / plan_price));

  -- Get current expiry date
  SELECT plan_expiry_date INTO current_expiry FROM members WHERE id = NEW.member_id;

  -- Calculate new expiry date
  -- If current expiry is in the future, extend from that date
  -- Otherwise, extend from today
  IF current_expiry IS NOT NULL AND current_expiry > CURRENT_DATE THEN
    new_expiry := current_expiry + (extension_months || ' months')::INTERVAL;
  ELSE
    new_expiry := CURRENT_DATE + (extension_months || ' months')::INTERVAL;
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

-- Create trigger to automatically update member when payment is inserted
CREATE TRIGGER trigger_update_member_on_payment
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_member_last_payment();

-- Now update the members with correct expiry dates based on their total payments
-- For FI0001: Total ₹11,000 = 11 months from join date (2025-07-01)
UPDATE members 
SET plan_expiry_date = '2025-07-01'::date + INTERVAL '11 months',
    status = 'active',
    updated_at = NOW()
WHERE user_id = 'FI0001';

-- For FI0002: Total ₹22,000 = 22 months from join date (2025-05-01)  
UPDATE members 
SET plan_expiry_date = '2025-05-01'::date + INTERVAL '22 months',
    status = 'active',
    updated_at = NOW()
WHERE user_id = 'FI0002';

-- For FI0003: Total ₹271,000 = 271 months from join date (2025-03-01)
UPDATE members 
SET plan_expiry_date = '2025-03-01'::date + INTERVAL '271 months',
    status = 'active',
    updated_at = NOW()
WHERE user_id = 'FI0003';