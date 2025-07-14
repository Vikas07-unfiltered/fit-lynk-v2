
export interface Gym {
  id: string;
  name: string;
  owner_email: string;
  owner_phone: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface GymOwner {
  id: string;
  user_id: string;
  gym_id: string;
  email: string;
  phone: string;
  created_at: string;
}
