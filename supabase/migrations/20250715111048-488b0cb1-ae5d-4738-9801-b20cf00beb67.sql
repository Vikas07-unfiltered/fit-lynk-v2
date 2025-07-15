-- Fix expiry dates individually with correct calculations
-- FI0001: July 2025 + 11 months = June 2026
UPDATE members 
SET plan_expiry_date = DATE '2025-07-01' + INTERVAL '11 months',
    status = 'active',
    updated_at = NOW()
WHERE user_id = 'FI0001' AND EXISTS (SELECT 1 FROM members WHERE user_id = 'FI0001');

-- FI0002: May 2025 + 22 months = March 2027  
UPDATE members 
SET plan_expiry_date = DATE '2025-05-01' + INTERVAL '22 months',
    status = 'active',
    updated_at = NOW()
WHERE user_id = 'FI0002' AND EXISTS (SELECT 1 FROM members WHERE user_id = 'FI0002');

-- FI0003: March 2025 + 271 months = October 2047
UPDATE members 
SET plan_expiry_date = DATE '2025-03-01' + INTERVAL '271 months',
    status = 'active',
    updated_at = NOW()
WHERE user_id = 'FI0003' AND EXISTS (SELECT 1 FROM members WHERE user_id = 'FI0003');