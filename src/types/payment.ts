export interface Payment {
  id: string;
  gym_id: string;
  member_id: string;
  member_user_id: string;
  member_name: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  plan_name: string;
  notes?: string;
  status: 'completed' | 'pending' | 'overdue';
  created_at: string;
  updated_at: string;
}

export interface NewPayment {
  member_id: string;
  member_user_id: string;
  member_name: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  plan_name: string;
  notes?: string;
}