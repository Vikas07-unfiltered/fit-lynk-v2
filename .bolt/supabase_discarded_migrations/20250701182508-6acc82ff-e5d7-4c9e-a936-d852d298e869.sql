
-- Add check_out_time column to attendance table
ALTER TABLE public.attendance ADD COLUMN check_out_time timestamp with time zone;

-- Add status column to track if user is checked in or out
ALTER TABLE public.attendance ADD COLUMN status text DEFAULT 'checked_in';

-- Add constraint to ensure status is either 'checked_in' or 'checked_out'
ALTER TABLE public.attendance ADD CONSTRAINT attendance_status_check 
  CHECK (status IN ('checked_in', 'checked_out'));

-- Create index for better query performance
CREATE INDEX idx_attendance_member_status ON public.attendance(member_id, status);
CREATE INDEX idx_attendance_gym_status ON public.attendance(gym_id, status);
