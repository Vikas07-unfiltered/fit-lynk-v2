
-- Create gyms table for gym owners
CREATE TABLE public.gyms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_email TEXT NOT NULL UNIQUE,
  owner_phone TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gym_owners table for authentication
CREATE TABLE public.gym_owners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, gym_id)
);

-- Add gym_id to members table to associate members with specific gyms
ALTER TABLE public.members 
ADD COLUMN gym_id uuid REFERENCES public.gyms(id) ON DELETE CASCADE;

-- Update the member user_id generation to be gym-specific
CREATE SEQUENCE IF NOT EXISTS gym_member_counter_seq;

CREATE OR REPLACE FUNCTION public.generate_gym_member_id(p_gym_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_id TEXT;
  gym_prefix TEXT;
  counter INTEGER;
BEGIN
  -- Get a simple 2-character prefix from gym name or use 'GM'
  SELECT COALESCE(UPPER(LEFT(name, 2)), 'GM') INTO gym_prefix FROM public.gyms WHERE id = p_gym_id;
  
  -- Get next counter value for this gym
  SELECT COALESCE(MAX(CAST(SUBSTRING(user_id FROM '[0-9]+$') AS INTEGER)), 0) + 1 
  INTO counter
  FROM public.members 
  WHERE gym_id = p_gym_id AND user_id ~ '^[A-Z]{2}[0-9]+$';
  
  -- Generate new ID: GymPrefix + 4-digit number
  new_id := gym_prefix || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_id;
END;
$$;

-- Update the trigger function to use gym-specific ID generation
CREATE OR REPLACE FUNCTION public.set_member_user_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS NULL OR NEW.user_id = '' THEN
    NEW.user_id := generate_gym_member_id(NEW.gym_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Enable RLS on all tables
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- RLS policies for gyms table
CREATE POLICY "Gym owners can view their own gym" 
  ON public.gyms 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_owners 
      WHERE gym_owners.gym_id = gyms.id 
      AND gym_owners.user_id = auth.uid()
    )
  );

CREATE POLICY "Gym owners can update their own gym" 
  ON public.gyms 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_owners 
      WHERE gym_owners.gym_id = gyms.id 
      AND gym_owners.user_id = auth.uid()
    )
  );

-- RLS policies for gym_owners table
CREATE POLICY "Users can view their own gym ownership" 
  ON public.gym_owners 
  FOR SELECT 
  USING (user_id = auth.uid());

-- RLS policies for members table (gym-specific)
CREATE POLICY "Gym owners can view their gym members" 
  ON public.members 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_owners 
      WHERE gym_owners.gym_id = members.gym_id 
      AND gym_owners.user_id = auth.uid()
    )
  );

CREATE POLICY "Gym owners can insert members for their gym" 
  ON public.members 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gym_owners 
      WHERE gym_owners.gym_id = members.gym_id 
      AND gym_owners.user_id = auth.uid()
    )
  );

CREATE POLICY "Gym owners can update their gym members" 
  ON public.members 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_owners 
      WHERE gym_owners.gym_id = members.gym_id 
      AND gym_owners.user_id = auth.uid()
    )
  );

CREATE POLICY "Gym owners can delete their gym members" 
  ON public.members 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_owners 
      WHERE gym_owners.gym_id = members.gym_id 
      AND gym_owners.user_id = auth.uid()
    )
  );

-- Function to handle new gym owner registration
CREATE OR REPLACE FUNCTION public.handle_new_gym_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_gym_id uuid;
BEGIN
  -- Create gym first
  INSERT INTO public.gyms (name, owner_email, owner_phone)
  VALUES (
    COALESCE(NEW.raw_user_meta_data ->> 'gym_name', 'My Gym'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  )
  RETURNING id INTO new_gym_id;
  
  -- Create gym owner record
  INSERT INTO public.gym_owners (user_id, gym_id, email, phone)
  VALUES (
    NEW.id,
    new_gym_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to create gym and gym_owner when user signs up
CREATE TRIGGER on_auth_user_created_gym_owner
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_gym_owner();
