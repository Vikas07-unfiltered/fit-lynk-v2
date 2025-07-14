/*
  # Payment and Member Integration Update

  1. Database Functions
    - `update_member_last_payment()` - Updates member's last payment when payment is recorded
    - `get_expired_members()` - Gets all members with expired memberships
    - `extend_membership()` - Extends member's plan expiry date based on payment

  2. Triggers
    - Automatically update member's last_payment and plan_expiry_date when payment is inserted
    - Update member status based on payment

  3. Security
    - Maintain existing RLS policies
*/

-- Function to update member's last payment and extend membership
CREATE OR REPLACE FUNCTION update_member_last_payment()
RETURNS TRIGGER AS $$
DECLARE
  plan_duration INTEGER;
  current_expiry DATE;
  new_expiry DATE;
BEGIN
  -- Get the plan duration from membership_plans table
  SELECT duration_months INTO plan_duration
  FROM membership_plans
  WHERE name = NEW.plan_name AND gym_id = NEW.gym_id AND is_active = true
  LIMIT 1;

  -- If plan not found, default to 1 month
  IF plan_duration IS NULL THEN
    plan_duration := 1;
  END IF;

  -- Get current expiry date
  SELECT plan_expiry_date INTO current_expiry
  FROM members
  WHERE id = NEW.member_id;

  -- Calculate new expiry date
  -- If current expiry is in the future, extend from that date
  -- Otherwise, extend from today
  IF current_expiry IS NOT NULL AND current_expiry > CURRENT_DATE THEN
    new_expiry := current_expiry + (plan_duration || ' months')::INTERVAL;
  ELSE
    new_expiry := CURRENT_DATE + (plan_duration || ' months')::INTERVAL;
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update member when payment is inserted
DROP TRIGGER IF EXISTS trigger_update_member_payment ON payments;
CREATE TRIGGER trigger_update_member_payment
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_member_last_payment();

-- Function to get expired members
CREATE OR REPLACE FUNCTION get_expired_members(target_gym_id UUID DEFAULT NULL)
RETURNS TABLE (
  member_id UUID,
  member_user_id TEXT,
  member_name TEXT,
  member_phone TEXT,
  gym_id UUID,
  gym_name TEXT,
  plan_name TEXT,
  expiry_date DATE,
  days_expired INTEGER,
  last_payment_date DATE,
  status TEXT
) AS $$
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
    m.plan_expiry_date as expiry_date,
    (CURRENT_DATE - m.plan_expiry_date)::INTEGER as days_expired,
    m.last_payment::DATE as last_payment_date,
    m.status
  FROM members m
  JOIN gyms g ON m.gym_id = g.id
  WHERE 
    m.plan_expiry_date < CURRENT_DATE
    AND (target_gym_id IS NULL OR m.gym_id = target_gym_id)
  ORDER BY m.plan_expiry_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually extend membership (for admin use)
CREATE OR REPLACE FUNCTION extend_membership(
  p_member_id UUID,
  p_months INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  current_expiry DATE;
  new_expiry DATE;
BEGIN
  -- Get current expiry date
  SELECT plan_expiry_date INTO current_expiry
  FROM members
  WHERE id = p_member_id;

  -- Calculate new expiry date
  IF current_expiry IS NOT NULL AND current_expiry > CURRENT_DATE THEN
    new_expiry := current_expiry + (p_months || ' months')::INTERVAL;
  ELSE
    new_expiry := CURRENT_DATE + (p_months || ' months')::INTERVAL;
  END IF;

  -- Update member record
  UPDATE members
  SET 
    plan_expiry_date = new_expiry,
    status = 'active',
    expiry_notification_sent = false,
    notification_sent_at = NULL,
    updated_at = now()
  WHERE id = p_member_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing members to have proper expiry dates if they don't have them
UPDATE members 
SET plan_expiry_date = CASE 
  WHEN plan_expiry_date IS NULL THEN 
    COALESCE(last_payment::DATE, join_date::DATE, CURRENT_DATE) + INTERVAL '1 month'
  ELSE plan_expiry_date
END
WHERE plan_expiry_date IS NULL;

-- Update member status based on expiry date
UPDATE members 
SET status = CASE 
  WHEN plan_expiry_date < CURRENT_DATE THEN 'inactive'
  ELSE 'active'
END
WHERE plan_expiry_date IS NOT NULL;