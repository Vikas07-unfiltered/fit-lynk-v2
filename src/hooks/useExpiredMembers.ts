import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface ExpiredMember {
  member_id: string;
  member_user_id: string;
  member_name: string;
  member_phone: string;
  gym_id: string;
  gym_name: string;
  plan_name: string;
  expiry_date: string;
  days_expired: number;
  last_payment_date: string | null;
  status: string;
}

export const useExpiredMembers = () => {
  const [expiredMembers, setExpiredMembers] = useState<ExpiredMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { gym } = useAuth();

  const fetchExpiredMembers = async () => {
    if (!gym?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_expired_members', {
        target_gym_id: gym.id
      });

      if (error) throw error;
      setExpiredMembers(data || []);
    } catch (error) {
      console.error('Error fetching expired members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch expired members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const extendMembership = async (memberId: string, months: number = 1) => {
    try {
      const { data, error } = await supabase.rpc('extend_membership', {
        p_member_id: memberId,
        p_months: months
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: `Membership extended by ${months} month${months > 1 ? 's' : ''}`,
        });
        
        // Refresh the expired members list
        fetchExpiredMembers();
        return true;
      } else {
        throw new Error('Failed to extend membership');
      }
    } catch (error) {
      console.error('Error extending membership:', error);
      toast({
        title: "Error",
        description: "Failed to extend membership",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchExpiredMembers();
  }, [gym?.id]);

  return {
    expiredMembers,
    loading,
    fetchExpiredMembers,
    extendMembership,
  };
};