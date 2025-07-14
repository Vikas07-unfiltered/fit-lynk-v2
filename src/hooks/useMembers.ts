import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Member, NewMember } from '@/types/member';
import { useAuth } from '@/hooks/useAuth';

export const useMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { gym } = useAuth();

  const fetchMembers = async () => {
    if (!gym?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, user_id, name, phone, plan, status, join_date, last_payment, plan_expiry_date, photo_url')
        .eq('gym_id', gym.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched members from Supabase:', data);
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (newMemberData: NewMember) => {
    if (!gym?.id) {
      toast({
        title: "Error",
        description: "No gym selected",
        variant: "destructive",
      });
      return false;
    }

    if (!newMemberData.name || !newMemberData.phone || !newMemberData.plan) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }

    try {
      const insertData = {
        gym_id: gym.id,
        user_id: '', // This will be overridden by the database trigger
        name: newMemberData.name,
        phone: newMemberData.phone,
        plan: newMemberData.plan,
        status: 'active',
        join_date: newMemberData.join_date || new Date().toISOString().split('T')[0],
        last_payment: newMemberData.first_payment_date || new Date().toISOString().split('T')[0]
      };

      console.log('Inserting member data:', insertData);

      const { data, error } = await supabase
        .from('members')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Member inserted successfully:', data);

      // Update local state immediately
      setMembers([data as Member, ...members]);
      
      toast({
        title: "Success",
        description: `Member added successfully with ID: ${data.user_id}`,
      });
      
      // Return the new member data for SMS sending
      return data;
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "Failed to add member",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;
      setMembers(members.filter((m) => m.id !== memberId));
      toast({
        title: 'Deleted',
        description: 'Member deleted successfully',
      });
      return true;
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete member',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateMember = async (memberId: string, updatedFields: Partial<Member>) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .update(updatedFields)
        .eq('id', memberId)
        .select()
        .single();
      if (error) throw error;
      setMembers(members.map((m) => (m.id === memberId ? { ...m, ...updatedFields } : m)));
      toast({
        title: 'Updated',
        description: 'Member updated successfully',
      });
      return data;
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Initial fetch & realtime subscription
  useEffect(() => {
    fetchMembers();

    if (!gym?.id) return;
    // Subscribe to real-time changes for this gym's members
    const channel = supabase
      .channel(`members:gym_${gym.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members', filter: `gym_id=eq.${gym.id}` },
        (payload) => {
          const newMember = payload.new as Member | null;
          const oldMember = payload.old as Member | null;
          if (payload.eventType === 'INSERT' && newMember) {
            setMembers((prev) => [newMember, ...prev]);
          } else if (payload.eventType === 'UPDATE' && newMember) {
            setMembers((prev) => prev.map((m) => (m.id === newMember.id ? { ...m, ...newMember } : m)));
          } else if (payload.eventType === 'DELETE' && oldMember) {
            setMembers((prev) => prev.filter((m) => m.id !== oldMember.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gym?.id]);

  return {
    members,
    loading,
    addMember,
    fetchMembers,
    deleteMember,
    updateMember,
  };
};