-- Create payments table for storing payment records
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL,
  member_id UUID NOT NULL,
  member_user_id TEXT NOT NULL,
  member_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Gym owners can view their gym payments" 
ON public.payments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM gym_owners 
  WHERE gym_owners.gym_id = payments.gym_id 
  AND gym_owners.user_id = auth.uid()
));

CREATE POLICY "Gym owners can insert payments for their gym" 
ON public.payments 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM gym_owners 
  WHERE gym_owners.gym_id = payments.gym_id 
  AND gym_owners.user_id = auth.uid()
));

CREATE POLICY "Gym owners can update their gym payments" 
ON public.payments 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM gym_owners 
  WHERE gym_owners.gym_id = payments.gym_id 
  AND gym_owners.user_id = auth.uid()
));

CREATE POLICY "Gym owners can delete their gym payments" 
ON public.payments 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM gym_owners 
  WHERE gym_owners.gym_id = payments.gym_id 
  AND gym_owners.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();