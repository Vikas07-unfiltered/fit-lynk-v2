
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DashboardAnalytics {
  totalMembers: number;
  activeMembers: number;
  totalPlans: number;
  monthlyRevenue: number;
  newMembersThisMonth: number;
  memberGrowthRate: number;
  averagePlanPrice: number;
  mostPopularPlan: string;
}

export const useDashboardAnalytics = () => {
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalMembers: 0,
    activeMembers: 0,
    totalPlans: 0,
    monthlyRevenue: 0,
    newMembersThisMonth: 0,
    memberGrowthRate: 0,
    averagePlanPrice: 0,
    mostPopularPlan: '',
  });
  const [loading, setLoading] = useState(true);
  const { gym } = useAuth();

  const fetchAnalytics = async () => {
    if (!gym?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch members data
      const { data: members } = await supabase
        .from('members')
        .select('id, user_id, name, phone, plan, status, join_date, plan_expiry_date')
        .eq('gym_id', gym.id);

      // Fetch membership plans
      const { data: plans } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('gym_id', gym.id)
        .eq('is_active', true);

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Calculate analytics
      const totalMembers = members?.length || 0;
      // Determine active members based on status and plan_expiry_date
      const today = new Date();
      today.setHours(0,0,0,0);
      const activeMembersList = members?.filter(m => {
        const expiry = m.plan_expiry_date ? new Date(m.plan_expiry_date) : null;
        const isExpired = expiry ? expiry.getTime() < today.getTime() : false;
        return m.status === 'active' && !isExpired;
      }) || [];
      const activeMembers = activeMembersList.length;
      const totalPlans = plans?.length || 0;

      // New members this month
      const newMembersThisMonth = members?.filter(m => {
        const joinDate = new Date(m.join_date);
        return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
      }).length || 0;

      // New members last month for growth rate
      const newMembersLastMonth = members?.filter(m => {
        const joinDate = new Date(m.join_date);
        return joinDate.getMonth() === lastMonth && joinDate.getFullYear() === lastMonthYear;
      }).length || 0;

      // Calculate growth rate
      const memberGrowthRate = newMembersLastMonth > 0 
        ? ((newMembersThisMonth - newMembersLastMonth) / newMembersLastMonth) * 100 
        : newMembersThisMonth > 0 ? 100 : 0;

      // Calculate average plan price
      const averagePlanPrice = plans && plans.length > 0
        ? plans.reduce((sum, plan) => sum + Number(plan.price), 0) / plans.length
        : 0;

      // Calculate actual monthly revenue based on completed payments this month
      let monthlyRevenue = 0;
      const { data: monthPayments } = await supabase
        .from('payments')
        .select('amount, payment_date, status')
        .eq('gym_id', gym.id)
        .eq('status', 'completed');

      if (monthPayments) {
        const current = new Date();
        const cm = current.getMonth();
        const cy = current.getFullYear();
        monthlyRevenue = monthPayments.reduce((sum, p: any) => {
          const d = new Date(p.payment_date);
          if (d.getMonth() === cm && d.getFullYear() === cy) {
            return sum + Number(p.amount);
          }
          return sum;
        }, 0);
      }

      // Find most popular plan
      const planCounts = members?.reduce((acc, member) => {
        acc[member.plan] = (acc[member.plan] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const mostPopularPlan = Object.keys(planCounts).length > 0
        ? Object.entries(planCounts).reduce((a, b) => planCounts[a[0]] > planCounts[b[0]] ? a : b)[0]
        : '';

      setAnalytics({
        totalMembers,
        activeMembers,
        totalPlans,
        monthlyRevenue,
        newMembersThisMonth,
        memberGrowthRate,
        averagePlanPrice,
        mostPopularPlan,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [gym?.id]);

  return {
    analytics,
    loading,
    fetchAnalytics,
  };
};
