-- Update expiry dates to reflect the correct calculations based on all payments made
-- FI0003 (vikas): Has multiple payments totaling ₹150,000 for ₹1000 basic plan = 150 months from join date (2025-03-01)
UPDATE members 
SET plan_expiry_date = '2025-03-01'::date + INTERVAL '150 months',
    status = 'active',
    updated_at = NOW()
WHERE user_id = 'FI0003';

-- FI0002 (RAVI): Has ₹10,000 payment for ₹1000 basic plan = 10 months from join date (2025-05-01)
UPDATE members 
SET plan_expiry_date = '2025-05-01'::date + INTERVAL '10 months',
    status = 'active',
    updated_at = NOW()
WHERE user_id = 'FI0002';

-- FI0001 (RAVI): Has ₹2,000 payment for ₹1000 basic plan = 2 months from join date (2025-07-01)
UPDATE members 
SET plan_expiry_date = '2025-07-01'::date + INTERVAL '2 months',
    status = 'active',
    updated_at = NOW()
WHERE user_id = 'FI0001';