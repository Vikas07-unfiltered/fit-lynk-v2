-- Create member_expiry_dates table
CREATE TABLE public.member_expiry_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL,
  gym_id UUID NOT NULL,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(member_id, gym_id)
);

-- Enable RLS
ALTER TABLE public.member_expiry_dates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Gym owners can view their gym member expiry dates" 
ON public.member_expiry_dates 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM gym_owners 
  WHERE gym_owners.gym_id = member_expiry_dates.gym_id 
  AND gym_owners.user_id = auth.uid()
));

CREATE POLICY "Gym owners can insert member expiry dates for their gym" 
ON public.member_expiry_dates 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM gym_owners 
  WHERE gym_owners.gym_id = member_expiry_dates.gym_id 
  AND gym_owners.user_id = auth.uid()
));

CREATE POLICY "Gym owners can update their gym member expiry dates" 
ON public.member_expiry_dates 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM gym_owners 
  WHERE gym_owners.gym_id = member_expiry_dates.gym_id 
  AND gym_owners.user_id = auth.uid()
));

CREATE POLICY "Gym owners can delete their gym member expiry dates" 
ON public.member_expiry_dates 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM gym_owners 
  WHERE gym_owners.gym_id = member_expiry_dates.gym_id 
  AND gym_owners.user_id = auth.uid()
));

-- Add updated_at trigger
CREATE TRIGGER update_member_expiry_dates_updated_at
BEFORE UPDATE ON public.member_expiry_dates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing expiry dates from members table
INSERT INTO public.member_expiry_dates (member_id, gym_id, expiry_date)
SELECT id, gym_id, COALESCE(plan_expiry_date, join_date + INTERVAL '1 month')
FROM public.members
WHERE gym_id IS NOT NULL
ON CONFLICT (member_id, gym_id) DO NOTHING;

-- Update the payment trigger to work with the new table
CREATE OR REPLACE FUNCTION public.update_member_expiry_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
        plan_price := NEW.amount;
        plan_duration := 1;
    END CASE;
  END IF;

  -- Calculate extension months
  extension_months := GREATEST(1, FLOOR((NEW.amount / plan_price) * plan_duration));

  -- Get current expiry date from the new table
  SELECT expiry_date INTO current_expiry
  FROM member_expiry_dates
  WHERE member_id = NEW.member_id AND gym_id = NEW.gym_id;

  -- Calculate new expiry date
  IF current_expiry IS NOT NULL AND current_expiry > CURRENT_DATE THEN
    new_expiry := current_expiry + (extension_months || ' months')::INTERVAL;
  ELSE
    new_expiry := CURRENT_DATE + (extension_months || ' months')::INTERVAL;
  END IF;

  -- Update or insert expiry date in the new table
  INSERT INTO member_expiry_dates (member_id, gym_id, expiry_date)
  VALUES (NEW.member_id, NEW.gym_id, new_expiry)
  ON CONFLICT (member_id, gym_id) 
  DO UPDATE SET 
    expiry_date = new_expiry,
    updated_at = now();

  -- Update member's last payment date and status
  UPDATE members
  SET 
    last_payment = NEW.payment_date,
    status = 'active',
    expiry_notification_sent = false,
    notification_sent_at = NULL,
    updated_at = now()
  WHERE id = NEW.member_id;

  RAISE LOG 'Extended membership for member % by % months. New expiry: %', 
    NEW.member_id, extension_months, new_expiry;

  RETURN NEW;
END;
$function$;

-- Drop the old trigger and create new one
DROP TRIGGER IF EXISTS update_member_payment_trigger ON payments;
CREATE TRIGGER update_member_expiry_payment_trigger
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION update_member_expiry_on_payment();