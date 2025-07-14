
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PeakHoursData {
  hour: number;
  count: number;
  day: string;
}

export interface MemberEngagement {
  memberId: string;
  memberName: string;
  attendanceCount: number;
  score: number;
  lastVisit: string;
}

export interface AttendanceTrend {
  date: string;
  count: number;
  month: string;
}

export interface RevenueForecast {
  month: string;
  actualRevenue: number;
  forecastRevenue: number;
}

export interface RetentionAnalysis {
  period: string;
  activeMembers: number;
  newMembers: number;
  churnedMembers: number;
  retentionRate: number;
}

export interface AdvancedAnalytics {
  peakHours: PeakHoursData[];
  memberEngagement: MemberEngagement[];
  attendanceTrends: AttendanceTrend[];
  revenueForecast: RevenueForecast[];
  retentionAnalysis: RetentionAnalysis[];
}

export const useAdvancedAnalytics = () => {
  const [analytics, setAnalytics] = useState<AdvancedAnalytics>({
    peakHours: [],
    memberEngagement: [],
    attendanceTrends: [],
    revenueForecast: [],
    retentionAnalysis: [],
  });
  const [loading, setLoading] = useState(true);
  const { gym } = useAuth();

  const fetchAdvancedAnalytics = async () => {
    if (!gym?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch attendance data for the last 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('timestamp, member_id')
        .eq('gym_id', gym.id)
        .gte('timestamp', threeMonthsAgo.toISOString());

      // Fetch members data
      const { data: membersData } = await supabase
        .from('members')
        .select('id, name, user_id, join_date, status')
        .eq('gym_id', gym.id);

      // Fetch membership plans for revenue calculation
      const { data: plansData } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('gym_id', gym.id)
        .eq('is_active', true);

      if (attendanceData && membersData && plansData) {
        const peakHours = calculatePeakHours(attendanceData);
        const memberEngagement = calculateMemberEngagement(attendanceData, membersData);
        const attendanceTrends = calculateAttendanceTrends(attendanceData);
        const revenueForecast = calculateRevenueForecast(membersData, plansData);
        const retentionAnalysis = calculateRetentionAnalysis(membersData);

        setAnalytics({
          peakHours,
          memberEngagement,
          attendanceTrends,
          revenueForecast,
          retentionAnalysis,
        });
      }
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePeakHours = (attendanceData: any[]): PeakHoursData[] => {
    const hourCounts: { [key: string]: number } = {};
    
    attendanceData.forEach(record => {
      const date = new Date(record.timestamp);
      const hour = date.getHours();
      const day = date.toLocaleDateString('en', { weekday: 'short' });
      const key = `${day}-${hour}`;
      hourCounts[key] = (hourCounts[key] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .map(([key, count]) => {
        const [day, hourStr] = key.split('-');
        return {
          hour: parseInt(hourStr),
          count,
          day,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 24); // Top 24 peak hours
  };

  const calculateMemberEngagement = (attendanceData: any[], membersData: any[]): MemberEngagement[] => {
    const memberAttendance: { [key: string]: { count: number; lastVisit: string; name: string } } = {};

    // Count attendance per member
    attendanceData.forEach(record => {
      const member = membersData.find(m => m.id === record.member_id);
      if (member) {
        const key = member.user_id;
        if (!memberAttendance[key]) {
          memberAttendance[key] = { count: 0, lastVisit: record.timestamp, name: member.name };
        }
        memberAttendance[key].count++;
        if (new Date(record.timestamp) > new Date(memberAttendance[key].lastVisit)) {
          memberAttendance[key].lastVisit = record.timestamp;
        }
      }
    });

    return Object.entries(memberAttendance)
      .map(([memberId, data]) => ({
        memberId,
        memberName: data.name,
        attendanceCount: data.count,
        score: Math.min(100, (data.count / 30) * 100), // Score out of 100 based on visits
        lastVisit: data.lastVisit,
      }))
      .sort((a, b) => b.score - a.score);
  };

  const calculateAttendanceTrends = (attendanceData: any[]): AttendanceTrend[] => {
    const dailyCounts: { [key: string]: number } = {};

    attendanceData.forEach(record => {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return Object.entries(dailyCounts)
      .map(([date, count]) => ({
        date,
        count,
        month: new Date(date).toLocaleDateString('en', { month: 'short' }),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const calculateRevenueForecast = (membersData: any[], plansData: any[]): RevenueForecast[] => {
    const monthlyRevenue: { [key: string]: number } = {};
    const planPrices: { [key: string]: number } = {};

    // Create plan price map
    plansData.forEach(plan => {
      planPrices[plan.name] = Number(plan.price) / plan.duration_months;
    });

    // Calculate historical revenue
    membersData.forEach(member => {
      if (member.status === 'active') {
        const joinDate = new Date(member.join_date);
        const monthKey = joinDate.toLocaleDateString('en', { year: 'numeric', month: 'short' });
        const monthlyPrice = planPrices[member.plan] || 0;
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + monthlyPrice;
      }
    });

    // Create forecast for next 6 months
    const forecast: RevenueForecast[] = [];
    const currentDate = new Date();
    
    for (let i = -3; i < 6; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() + i);
      const monthKey = date.toLocaleDateString('en', { year: 'numeric', month: 'short' });
      
      const actualRevenue = monthlyRevenue[monthKey] || 0;
      const avgRevenue = Object.values(monthlyRevenue).reduce((a, b) => a + b, 0) / Object.keys(monthlyRevenue).length || 0;
      const forecastRevenue = i >= 0 ? avgRevenue * 1.05 : 0; // 5% growth forecast

      forecast.push({
        month: monthKey,
        actualRevenue,
        forecastRevenue,
      });
    }

    return forecast;
  };

  const calculateRetentionAnalysis = (membersData: any[]): RetentionAnalysis[] => {
    const periods = ['Last 30 days', 'Last 60 days', 'Last 90 days'];
    const analysis: RetentionAnalysis[] = [];

    periods.forEach((period, index) => {
      const days = (index + 1) * 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const newMembers = membersData.filter(m => 
        new Date(m.join_date) >= cutoffDate
      ).length;

      const activeMembers = membersData.filter(m => 
        m.status === 'active' && new Date(m.join_date) >= cutoffDate
      ).length;

      const churnedMembers = membersData.filter(m => 
        m.status !== 'active' && new Date(m.join_date) >= cutoffDate
      ).length;

      const retentionRate = newMembers > 0 ? (activeMembers / newMembers) * 100 : 0;

      analysis.push({
        period,
        activeMembers,
        newMembers,
        churnedMembers,
        retentionRate,
      });
    });

    return analysis;
  };

  useEffect(() => {
    fetchAdvancedAnalytics();
  }, [gym?.id]);

  return {
    analytics,
    loading,
    fetchAdvancedAnalytics,
  };
};
