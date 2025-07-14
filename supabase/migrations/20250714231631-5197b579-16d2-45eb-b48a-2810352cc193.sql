-- Drop existing trigger if it exists to recreate it properly
DROP TRIGGER IF EXISTS trigger_update_member_on_payment ON payments;

-- Update the function to calculate extension months based on payment amount vs plan price
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
BEGIN
  -- Get the plan price and duration from membership_plans table
  SELECT price, duration_months INTO plan_price, plan_duration
  FROM membership_plans
  WHERE name = NEW.plan_name AND gym_id = NEW.gym_id AND is_active = true
  LIMIT 1;

  -- If plan not found, use defaults
  IF plan_price IS NULL THEN
    plan_price := NEW.amount; -- Use payment amount as fallback
    plan_duration := 1;
  END IF;

  -- Calculate extension months: (total payment / plan price) = extended months
  -- If payment amount is greater than plan price, extend by multiple months
  extension_months := GREATEST(1, FLOOR(NEW.amount / plan_price));

  -- Get current expiry date
  SELECT plan_expiry_date INTO current_expiry
  FROM members
  WHERE id = NEW.member_id;

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

  -- Log the extension for debugging
  RAISE LOG 'Extended membership for member % by % months. Payment: %, Plan Price: %, New Expiry: %', 
    NEW.member_id, extension_months, NEW.amount, plan_price, new_expiry;

  RETURN NEW;
END;
$function$;

-- Create trigger to automatically update member when payment is inserted
CREATE TRIGGER trigger_update_member_on_payment
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_member_last_payment();