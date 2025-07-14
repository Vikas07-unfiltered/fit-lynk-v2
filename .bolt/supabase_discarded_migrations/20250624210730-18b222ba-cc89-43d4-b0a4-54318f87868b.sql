
-- Add expiry tracking columns to members table
ALTER TABLE public.members 
ADD COLUMN plan_expiry_date DATE,
ADD COLUMN expiry_notification_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN notification_sent_at TIMESTAMP WITH TIME ZONE;

-- Create a function to calculate plan expiry date based on join date and plan duration
CREATE OR REPLACE FUNCTION calculate_plan_expiry(p_join_date DATE, p_plan_name TEXT, p_gym_id UUID)
RETURNS DATE
LANGUAGE plpgsql
AS $$
DECLARE
  plan_duration INTEGER;
BEGIN
  -- Get the duration of the plan from membership_plans table
  SELECT duration_months INTO plan_duration
  FROM public.membership_plans
  WHERE name = p_plan_name AND gym_id = p_gym_id AND is_active = true
  LIMIT 1;
  
  -- If plan not found, default to 1 month
  IF plan_duration IS NULL THEN
    plan_duration := 1;
  END IF;
  
  -- Calculate expiry date by adding duration to join date
  RETURN p_join_date + INTERVAL '1 month' * plan_duration;
END;
$$;

-- Update existing members with calculated expiry dates
UPDATE public.members 
SET plan_expiry_date = calculate_plan_expiry(join_date::DATE, plan, gym_id)
WHERE plan_expiry_date IS NULL;

-- Create trigger to automatically set expiry date for new members
CREATE OR REPLACE FUNCTION set_member_expiry_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.plan_expiry_date := calculate_plan_expiry(NEW.join_date::DATE, NEW.plan, NEW.gym_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_member_expiry_date
  BEFORE INSERT OR UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION set_member_expiry_date();

-- Create function to get members whose plans expire in 5 days and haven't been notified
CREATE OR REPLACE FUNCTION get_expiring_members(days_before INTEGER DEFAULT 5)
RETURNS TABLE(
  member_id UUID,
  member_name TEXT,
  member_phone TEXT,
  gym_id UUID,
  plan_name TEXT,
  expiry_date DATE
)
LANGUAGE sql
AS $$
  SELECT 
    m.id,
    m.name,
    m.phone,
    m.gym_id,
    m.plan,
    m.plan_expiry_date
  FROM public.members m
  WHERE m.plan_expiry_date = CURRENT_DATE + INTERVAL '1 day' * days_before
    AND m.status = 'active'
    AND (m.expiry_notification_sent = FALSE OR m.expiry_notification_sent IS NULL);
$$;

-- Create function to mark notification as sent
CREATE OR REPLACE FUNCTION mark_notification_sent(member_id UUID)
RETURNS VOID
LANGUAGE sql
AS $$
  UPDATE public.members 
  SET expiry_notification_sent = TRUE, notification_sent_at = NOW()
  WHERE id = member_id;
$$;
