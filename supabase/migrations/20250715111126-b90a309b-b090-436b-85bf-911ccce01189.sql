-- Update members by their specific IDs with correct calculations
-- FI0001 (ID: 37127878-9907-4026-86b4-c532e5a30094): 11 months from July 2025 = June 2026
UPDATE members 
SET plan_expiry_date = '2026-06-01',
    status = 'active',
    updated_at = NOW()
WHERE id = '37127878-9907-4026-86b4-c532e5a30094';

-- FI0002 (ID: 8584afac-81cf-47a8-83d9-abe5550363e5): 22 months from May 2025 = March 2027
UPDATE members 
SET plan_expiry_date = '2027-03-01',
    status = 'active',
    updated_at = NOW()
WHERE id = '8584afac-81cf-47a8-83d9-abe5550363e5';

-- FI0003 (ID: 41af7952-41b1-4240-b4e4-e00fd3db45b5): 271 months from March 2025 = October 2047
UPDATE members 
SET plan_expiry_date = '2047-10-01',
    status = 'active',
    updated_at = NOW()
WHERE id = '41af7952-41b1-4240-b4e4-e00fd3db45b5';