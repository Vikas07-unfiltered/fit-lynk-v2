import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { DollarSign, Users, Calendar, TrendingUp } from 'lucide-react';
import StatCard from './StatCard';

interface ReportsTabProps {
  currentMonthRevenue: number;
  lastMonthRevenue: number;
  revenueChange: number;
  memberChange: number;
  attendanceChange: number;
  retentionChange: number;
  weeklyData: any;
  dashboardData: any;
  payments: any[];
}

const ReportsTab = ({
  currentMonthRevenue,
  lastMonthRevenue,
  weeklyData,
  dashboardData,
  payments
}: ReportsTabProps) => {
  return (
    <TabsContent value="reports" className="space-y-6 animate-fade-in">
      {/* Basic Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₹${weeklyData.revenue.toLocaleString()}`}
          change={weeklyData.revenueChange}
          icon={DollarSign}
          color="text-green-600"
        />
        <StatCard
          title="Active Members"
          value={weeklyData.members}
          change={weeklyData.memberChange}
          icon={Users}
          color="text-blue-600"
        />
        <StatCard
          title="Attendance"
          value={weeklyData.attendance}
          change={weeklyData.attendanceChange}
          icon={Calendar}
          color="text-purple-600"
        />
        <StatCard
          title="Retention Rate"
          value={`${weeklyData.retention}%`}
          change={weeklyData.retentionChange}
          icon={TrendingUp}
          color="text-emerald-600"
        />
      </div>

      {/* Reports Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>Monthly Revenue Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">This Month</span>
              <span className="text-lg font-bold text-green-600">₹{currentMonthRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Last Month</span>
              <span className="text-lg font-bold">₹{lastMonthRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Year to Date</span>
              <span className="text-lg font-bold">₹{payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>Membership Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">New Members</span>
              <span className="text-lg font-bold text-blue-600">{dashboardData.newMembersThisMonth}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Active Members</span>
              <span className="text-lg font-bold">{dashboardData.activeMembers}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Total Members</span>
              <span className="text-lg font-bold">{dashboardData.totalMembers}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
};

export default ReportsTab;