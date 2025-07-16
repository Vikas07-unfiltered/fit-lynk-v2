-- Manually update the member's expiry date based on the trigger calculation
-- The trigger said it should be 2026-05-16, so let's update it directly

UPDATE members 
SET plan_expiry_date = '2026-05-16',
    updated_at = now()
WHERE user_id = 'FI0003';

-- Also verify the trigger is working by inserting a test payment
-- First, let's check if there are issues with the trigger permissions or RLS policies