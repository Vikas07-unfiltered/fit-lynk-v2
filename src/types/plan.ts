
export interface MembershipPlan {
  id: string;
  gym_id: string;
  name: string;
  price: number;
  duration_months: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewMembershipPlan {
  name: string;
  price: number;
  duration_months: number;
  description?: string;
}
