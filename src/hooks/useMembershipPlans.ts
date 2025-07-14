
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MembershipPlan, NewMembershipPlan } from '@/types/plan';
import { useAuth } from '@/hooks/useAuth';

export const useMembershipPlans = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { gym } = useAuth();

  const fetchPlans = async () => {
    if (!gym?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('gym_id', gym.id)
        .eq('is_active', true)
        .order('duration_months', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch membership plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPlan = async (newPlanData: NewMembershipPlan) => {
    if (!gym?.id) {
      toast({
        title: "Error",
        description: "No gym selected",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .insert({
          gym_id: gym.id,
          ...newPlanData,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setPlans([...plans, data as MembershipPlan]);
      
      toast({
        title: "Success",
        description: "Membership plan added successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Error adding plan:', error);
      toast({
        title: "Error",
        description: "Failed to add membership plan",
        variant: "destructive",
      });
      return false;
    }
  };

  const updatePlan = async (planId: string, updates: Partial<NewMembershipPlan>) => {
    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;

      setPlans(plans.map(plan => 
        plan.id === planId ? { ...plan, ...data } : plan
      ));
      
      toast({
        title: "Success",
        description: "Membership plan updated successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Error",
        description: "Failed to update membership plan",
        variant: "destructive",
      });
      return false;
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('membership_plans')
        .update({ is_active: false })
        .eq('id', planId);

      if (error) throw error;

      setPlans(plans.filter(plan => plan.id !== planId));
      
      toast({
        title: "Success",
        description: "Membership plan deleted successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete membership plan",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [gym?.id]);

  return {
    plans,
    loading,
    addPlan,
    updatePlan,
    deletePlan,
    fetchPlans,
  };
};
