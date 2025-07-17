import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface MemberExpiryDate {
  id: string;
  member_id: string;
  gym_id: string;
  expiry_date: string;
  created_at: string;
  updated_at: string;
}

export const useMemberExpiryDates = () => {
  const [expiryDates, setExpiryDates] = useState<MemberExpiryDate[]>([]);
  const [loading, setLoading] = useState(true);
  const { gym } = useAuth();

  const fetchExpiryDates = async () => {
    if (!gym?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('member_expiry_dates')
        .select('*')
        .eq('gym_id', gym.id);

      if (error) throw error;
      setExpiryDates(data || []);
    } catch (error) {
      console.error('Error fetching expiry dates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch expiry dates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateExpiryDate = async (memberId: string, newExpiryDate: string) => {
    if (!gym?.id) return false;

    try {
      const { error } = await supabase
        .from('member_expiry_dates')
        .upsert({
          member_id: memberId,
          gym_id: gym.id,
          expiry_date: newExpiryDate,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expiry date updated successfully",
      });

      fetchExpiryDates();
      return true;
    } catch (error) {
      console.error('Error updating expiry date:', error);
      toast({
        title: "Error",
        description: "Failed to update expiry date",
        variant: "destructive",
      });
      return false;
    }
  };

  const getExpiryDateForMember = (memberId: string): string | null => {
    const expiryRecord = expiryDates.find(ed => ed.member_id === memberId);
    return expiryRecord?.expiry_date || null;
  };

  useEffect(() => {
    fetchExpiryDates();

    if (!gym?.id) return;

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`member_expiry_dates:gym_${gym.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'member_expiry_dates', filter: `gym_id=eq.${gym.id}` },
        (payload) => {
          fetchExpiryDates(); // Refresh data on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gym?.id]);

  return {
    expiryDates,
    loading,
    fetchExpiryDates,
    updateExpiryDate,
    getExpiryDateForMember,
  };
};