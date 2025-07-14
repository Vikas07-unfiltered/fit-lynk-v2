import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Payment, NewPayment } from '@/types/payment';
import { useAuth } from '@/hooks/useAuth';

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { gym } = useAuth();

  const fetchPayments = async () => {
    if (!gym?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('gym_id', gym.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments((data as Payment[]) || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async (newPaymentData: NewPayment) => {
    if (!gym?.id) {
      toast({
        title: "Error",
        description: "No gym selected",
        variant: "destructive",
      });
      return false;
    }

    try {
      const insertData = {
        gym_id: gym.id,
        member_id: newPaymentData.member_id,
        member_user_id: newPaymentData.member_user_id,
        member_name: newPaymentData.member_name,
        amount: newPaymentData.amount,
        payment_date: newPaymentData.payment_date,
        payment_method: newPaymentData.payment_method,
        plan_name: newPaymentData.plan_name,
        notes: newPaymentData.notes,
        status: 'completed'
      };

      const { data, error } = await supabase
        .from('payments')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setPayments([data as Payment, ...payments]);
      
      toast({
        title: "Success",
        description: "Payment recorded and membership updated successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [gym?.id]);

  return {
    payments,
    loading,
    addPayment,
    fetchPayments,
  };
};