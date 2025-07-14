-- Fix expiry dates based on recent payments
-- For FI0003 (vikas): Multiple payments totaling ₹150,000 for ₹1000 basic plan = 150 months from today
UPDATE members 
SET plan_expiry_date = CURRENT_DATE + INTERVAL '150 months',
    status = 'active',
    updated_at = NOW()
WHERE user_id = 'FI0003';

-- For FI0002 (RAVI): ₹10,000 payment for ₹1000 basic plan = 10 months from today  
UPDATE members 
SET plan_expiry_date = CURRENT_DATE + INTERVAL '10 months',
    status = 'active',
    updated_at = NOW()
WHERE user_id = 'FI0002';

-- For FI0001 (RAVI): Already has future expiry, but let's make sure it's correct
UPDATE members 
SET plan_expiry_date = CURRENT_DATE + INTERVAL '2 months',
    status = 'active',
    updated_at = NOW()
WHERE user_id = 'FI0001';