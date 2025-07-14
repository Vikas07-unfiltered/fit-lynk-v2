
export interface Member {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  plan: string;
  status: string;
  gym_id?: string;
  join_date: string;
  last_payment: string | null;
  plan_expiry_date?: string;
  photo_url?: string;
}

export interface NewMember {
  name: string;
  phone: string;
  plan: string;
  join_date?: string;
  first_payment_date?: string;
  plan_expiry_date?: string;
}
