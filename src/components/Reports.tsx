import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Download, FileText, BarChart3, Users, TrendingUp, TrendingDown, DollarSign, Calendar, Clock, UserCheck } from 'lucide-react';
import { formatDate, parseDate } from '@/utils/date';
import { useState } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ResponsiveContainer, BarChart, LineChart, XAxis, YAxis, Bar, Line } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';
import { usePayments } from '@/hooks/usePayments';
import { useMembers } from '@/hooks/useMembers';
import { exportToPDF, exportToExcel } from './reports/ExportUtils';
import StatCard from './reports/StatCard';
import ExpiredMembersReport from '@/components/ExpiredMembersReport';

const Reports = () => {
  const [reportPeriod, setReportPeriod] = useState('weekly');
  const isMobile = useIsMobile();
  const { analytics, loading } = useAdvancedAnalytics();
  const { analytics: dashboardData, loading: dashboardLoading } = useDashboardAnalytics();
  const { members, fetchMembers } = useMembers();

  // Force refresh members data when component mounts or tab changes
  const handleRefreshData = async () => {
    console.log('Refreshing member data for reports...');
    await fetchMembers();
  };

  const [activeTab, setActiveTab] = useState('reports');

  // Year baseline for calculations
  const nowYear = new Date().getFullYear();
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const passesDateRange = (dateStr: string | Date | null | undefined) => {
    const d = parseDate(dateStr as any);
    if (!d) return true;
    if (fromDate && d.getTime() < fromDate.getTime()) return false;
    if (toDate && d.getTime() > toDate.getTime()) return false;
    return true;
  };

  const { payments } = usePayments();

// Only consider members whose join_date falls within the selected range
const filteredMembers = members.filter(m => passesDateRange(m.join_date));

// Also filter payments by payment_date so revenue cards respect the same period
const filteredPayments = payments.filter(p => passesDateRange(p.payment_date));

  // Determine expiry-aware status
  const today = new Date();
  today.setHours(0,0,0,0);
  const isExpired = (m: any) => {
    const exp = parseDate(m.plan_expiry_date);
    return exp ? exp.getTime() < today.getTime() : false;
  };
  const activeMembersList = filteredMembers.filter(m => {
  const expiry = m.plan_expiry_date ? new Date(m.plan_expiry_date) : null;
  return expiry && expiry >= today;
});
const inactiveMembersList = filteredMembers.filter(m => {
  const expiry = m.plan_expiry_date ? new Date(m.plan_expiry_date) : null;
  return !expiry || expiry < today;
});
const activeMembers = activeMembersList.length;
const inactiveMembers = inactiveMembersList.length;
  
  // ---------------- Revenue & Payments ----------------
// Helper to know if the user has set a custom date window
const rangeActive = !!fromDate || !!toDate;

// Payments for the main ("current") period and for the comparison period
let currentPeriodPayments: typeof payments = [];
let comparisonPeriodPayments: typeof payments = [];

if (rangeActive) {
  // Custom window selected → simply use the filtered list
  currentPeriodPayments = filteredPayments;

  // Derive a previous window of equal length for comparison (only if both ends are set)
  if (fromDate && toDate) {
    const windowMs = toDate.getTime() - fromDate.getTime();
    const prevStart = new Date(fromDate.getTime() - windowMs - 86_400_000); // gap of 1 day
    const prevEnd = new Date(fromDate.getTime() - 86_400_000);
    comparisonPeriodPayments = payments.filter(p => {
      const d = parseDate(p.payment_date);
      return d && d >= prevStart && d <= prevEnd && p.status === 'completed';
    });
  }
} else {
  // No custom window → compare this calendar month vs previous calendar month
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  currentPeriodPayments = payments.filter(p => {
    const d = parseDate(p.payment_date);
    return d && d.getMonth() === thisMonth && d.getFullYear() === thisYear && p.status === 'completed';
  });
  comparisonPeriodPayments = payments.filter(p => {
    const d = parseDate(p.payment_date);
    return d && d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && p.status === 'completed';
  });
}

// Revenues
const currentMonthPayments = currentPeriodPayments; // kept for UI that shows counts / avg
const lastMonthPayments = comparisonPeriodPayments;

const currentMonthRevenue = currentPeriodPayments.reduce((sum, p) => sum + Number(p.amount), 0);
const lastMonthRevenue = comparisonPeriodPayments.reduce((sum, p) => sum + Number(p.amount), 0);

// Year-to-date revenue respects the filtered payments list so that it honours the custom range
const yearToDateRevenue = filteredPayments
  .filter(p => {
    const d = parseDate(p.payment_date);
    return d && d.getFullYear() === nowYear && p.status === 'completed';
  })
  .reduce((sum, p) => sum + Number(p.amount), 0);

// Revenue percentage change helper (avoid /0)
const revenueChange = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : currentMonthRevenue > 0 ? 100 : 0;

/* DUPLICATE BLOCK START
// ---------------- Member Statistics ----------------
const rangeActive = !!fromDate || !!toDate;

// --- Revenue calculations ---
let currentMonthRevenue = 0;
let lastMonthRevenue = 0;

if (rangeActive) {
  // When the user has selected a custom range we simply use that range
  currentMonthRevenue = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // For comparison, compute the revenue of an immediately-preceding window of equal length
  if (fromDate && toDate) {
    const windowMs = toDate.getTime() - fromDate.getTime();
    const prevStart = new Date(fromDate.getTime() - windowMs - 86_400_000); // subtract 1 day gap
    const prevEnd = new Date(fromDate.getTime() - 86_400_000);

    const prevPayments = payments.filter(p => {
      const d = parseDate(p.payment_date);
      return d && d >= prevStart && d <= prevEnd && p.status === 'completed';
    });
    lastMonthRevenue = prevPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  }
} else {
  // Default behaviour: compare this calendar month vs. last calendar month
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  currentMonthRevenue = filteredPayments.filter(p => {
    const d = parseDate(p.payment_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && p.status === 'completed';
  }).reduce((sum, p) => sum + Number(p.amount), 0);
    // Derive last-period payments (same length window immediately before)
    if (fromDate && toDate) {
      const msWindow = toDate.getTime() - fromDate.getTime();
      const prevStart = new Date(fromDate.getTime() - msWindow - 24*60*60*1000); // subtract a day to avoid overlap
      const prevEnd = new Date(fromDate.getTime() - 24*60*60*1000);
      lastMonthPayments = payments.filter(p => {
        const d = parseDate(p.payment_date);
        return d >= prevStart && d <= prevEnd;
      });
      lastMonthRevenue = lastMonthPayments.reduce((sum,p)=> sum + Number(p.amount), 0);
    }
  } else {
    // Fallback to original month-based logic using calendar months
    currentMonthPayments = filteredPayments.filter(p => {
      const d = parseDate(p.payment_date);
      return d.getMonth() === currentMonth && d.getFullYear() === nowYear && p.status === 'completed';
    });
    currentMonthRevenue = currentMonthPayments.reduce((sum,p)=> sum + Number(p.amount), 0);

    lastMonthPayments = filteredPayments.filter(p => {
      const d = parseDate(p.payment_date);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? nowYear - 1 : nowYear;
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && p.status === 'completed';
    });
    lastMonthRevenue = lastMonthPayments.reduce((sum,p)=> sum + Number(p.amount), 0);
  }

  const lastMonthPaymentsCalc = rangeActive ? lastMonthPayments : lastMonthPayments;

    const paymentDate = parseDate(payment.payment_date);
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? nowYear - 1 : nowYear;
    return paymentDate.getMonth() === lastMonth && 
           paymentDate.getFullYear() === lastMonthYear &&
           payment.status === 'completed';
  });

  const currentMonthRevenue = currentMonthRevenue || currentMonthPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const lastMonthRevenue = lastMonthRevenue || lastMonthPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const yearToDateRevenue = filteredPayments
    .filter(payment => {
      const paymentDate = parseDate(payment.payment_date);
      return paymentDate.getFullYear() === nowYear && payment.status === 'completed';
    })
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  // Calculate revenue change percentage
  const revenueChange = lastMonthRevenue > 0 
    ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : currentMonthRevenue > 0 ? 100 : 0;

  // Calculate member statistics
  const newMembersThisMonth = members.filter(member => {
    const joinDate = new Date(member.join_date);
    return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === nowYear;
  }).length;

  const newMembersLastMonth = members.filter(member => {
    const joinDate = new Date(member.join_date);
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? nowYear - 1 : nowYear;
    return joinDate.getMonth() === lastMonth && joinDate.getFullYear() === lastMonthYear;
  }).length;

  const memberChange = newMembersLastMonth > 0 
    ? ((newMembersThisMonth - newMembersLastMonth) / newMembersLastMonth) * 100 
    : newMembersThisMonth > 0 ? 100 : 0;

  const activeMembers = activeMembersList.length;
  const totalMembers = members.length;

  // Calculate attendance data (mock for now since we don't have attendance analytics)
  const attendanceChange = 0; // This would come from attendance analytics
  const retentionRate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;
  const retentionChange = 0; // This would be calculated from historical data

  const weeklyData = {
    revenue: currentMonthRevenue,
    revenueChange: revenueChange,
    members: activeMembers,
    memberChange: memberChange,
    attendance: 0, // Would come from attendance data
    attendanceChange: attendanceChange,
    retention: retentionRate,
    retentionChange: retentionChange,
  };

  */

// ---------------- Member & Attendance Statistics ----------------
const currentDate = new Date();
const currentMonthIdx = currentDate.getMonth();

const newMembersThisMonth = members.filter(member => {
  const join = parseDate(member.join_date);
  return join && join.getMonth() === currentMonthIdx && join.getFullYear() === nowYear;
}).length;

const lastMonthIdx = currentMonthIdx === 0 ? 11 : currentMonthIdx - 1;
const lastMonthYear = currentMonthIdx === 0 ? nowYear - 1 : nowYear;

const newMembersLastMonth = members.filter(member => {
  const join = parseDate(member.join_date);
  return join && join.getMonth() === lastMonthIdx && join.getFullYear() === lastMonthYear;
}).length;

const memberChange = newMembersLastMonth > 0
  ? ((newMembersThisMonth - newMembersLastMonth) / newMembersLastMonth) * 100
  : newMembersThisMonth > 0 ? 100 : 0;

const totalMembers = members.length;

const attendanceChange = 0; // Placeholder until attendance analytics added
const retentionRate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;
const retentionChange = 0;

const weeklyData = {
  revenue: currentMonthRevenue,
  revenueChange,
  members: activeMembers,
  memberChange,
  attendance: 0,
  attendanceChange,
  retention: retentionRate,
  retentionChange,
};

// ----- Charts -----
const chartConfig = {
    count: {
      label: "Count",
      color: "#10b981",
    },
    revenue: {
      label: "Revenue",
      color: "#3b82f6",
    },
    forecast: {
      label: "Forecast",
      color: "#f59e0b",
    },
  };

  const topPeakHours = analytics.peakHours.slice(0, 8);
  const topEngagedMembers = analytics.memberEngagement.slice(0, 5);
  const recentTrends = analytics.attendanceTrends.slice(-30);

  // Wrap export functions for use as button click handlers
  const handleExportPDFClick = () => {
    exportToPDF(
      'reports',
      filteredMembers,
      currentMonthRevenue,
      lastMonthRevenue,
      dashboardData
    );
  };
  
  const handleExportExcelClick = () => {
    exportToExcel(
      'reports',
      filteredMembers,
      currentMonthRevenue,
      lastMonthRevenue,
      dashboardData
    );
  };

  if (loading || dashboardLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-${isMobile ? '4' : '6'} animate-fade-in`}>
      {/* Header */}
      <div className={`flex flex-col ${isMobile ? 'gap-3' : 'sm:flex-row gap-4'} items-start sm:items-center justify-between`}>
        <div>
          <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>
            {isMobile ? 'Reports' : 'Reports & Analytics'}
          </h2>
          <p className={`text-gray-600 ${isMobile ? 'text-xs' : ''}`}>
            {isMobile ? 'Insights and performance' : 'Comprehensive insights and performance tracking'}
          </p>
        </div>
        
        <div className={`flex ${isMobile ? 'flex-col w-full gap-2' : 'gap-2 w-full sm:w-auto'}`}>
          {/* Date Range Inputs - Mobile Layout */}
          <div className={`flex ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
            <Input 
              type="date" 
              className={`${isMobile ? 'w-full text-xs h-8' : 'w-36'}`} 
              value={fromDate ? fromDate.toISOString().substring(0,10) : ''} 
              onChange={(e) => setFromDate(e.target.value ? new Date(e.target.value) : null)} 
              placeholder="From"
            />
            <Input 
              type="date" 
              className={`${isMobile ? 'w-full text-xs h-8' : 'w-36'}`} 
              value={toDate ? toDate.toISOString().substring(0,10) : ''} 
              onChange={(e) => setToDate(e.target.value ? new Date(e.target.value) : null)} 
              placeholder="To"
            />
          </div>
          
          {/* Export Buttons */}
          <div className={`flex ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
            <Button 
              variant="outline" 
              onClick={handleExportPDFClick} 
              className={`hover-scale ${isMobile ? 'flex-1 h-8 text-xs px-2' : ''}`}
            >
              <Download className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'}`} />
              PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportExcelClick} 
              className={`hover-scale ${isMobile ? 'flex-1 h-8 text-xs px-2' : ''}`}
            >
              <Download className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'}`} />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className={`space-y-${isMobile ? '4' : '6'}`}>
        <div className={`w-full ${isMobile ? 'overflow-x-auto pb-1' : ''}`}>
          <TabsList className={`${isMobile ? 'flex w-max min-w-full gap-0.5 p-1 bg-muted/50' : 'grid w-full grid-cols-4'}`}>
            <TabsTrigger 
              value="reports" 
              className={`flex items-center gap-${isMobile ? '1' : '2'} ${isMobile ? 'min-w-[80px] py-2 px-3 text-xs' : ''}`}
            >
              <FileText className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              {isMobile ? 'Reports' : 'Reports'}
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className={`flex items-center gap-${isMobile ? '1' : '2'} ${isMobile ? 'min-w-[80px] py-2 px-3 text-xs' : ''}`}
            >
              <BarChart3 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              {isMobile ? 'Analytics' : 'Analytics'}
            </TabsTrigger>
            <TabsTrigger 
              value="members" 
              className={`flex items-center gap-${isMobile ? '1' : '2'} ${isMobile ? 'min-w-[80px] py-2 px-3 text-xs' : ''}`}
            >
              <Users className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              {isMobile ? 'Members' : 'Members'}
            </TabsTrigger>
            <TabsTrigger 
              value="expired" 
              className={`flex items-center gap-${isMobile ? '1' : '2'} ${isMobile ? 'min-w-[80px] py-2 px-3 text-xs' : ''}`}
            >
              <Clock className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              {isMobile ? 'Expired' : 'Expired'}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Reports Tab */}
        <TabsContent value="reports" className={`space-y-${isMobile ? '4' : '6'}`}>
          {/* Basic Stats Cards */}
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'}`}>
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
              value={`${Math.round(weeklyData.retention)}%`}
              change={weeklyData.retentionChange}
              icon={TrendingUp}
              color="text-emerald-600"
            />
          </div>

          {/* Reports Summary */}
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'lg:grid-cols-2 gap-6'}`}>
            <Card className="animate-scale-in">
              <CardHeader className={isMobile ? 'pb-2 px-3 pt-3' : ''}>
                <CardTitle className={isMobile ? 'text-base' : ''}>
                  {isMobile ? 'Revenue' : 'Monthly Revenue Summary'}
                </CardTitle>
              </CardHeader>
              <CardContent className={`space-y-${isMobile ? '2' : '4'} ${isMobile ? 'px-3 pb-3' : ''}`}>
                <div className={`flex justify-between items-center ${isMobile ? 'p-2' : 'p-4'} bg-gray-50 rounded-lg`}>
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>This Month</span>
                  <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-green-600`}>₹{currentMonthRevenue.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between items-center ${isMobile ? 'p-2' : 'p-4'} bg-gray-50 rounded-lg`}>
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Last Month</span>
                  <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold`}>₹{lastMonthRevenue.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between items-center ${isMobile ? 'p-2' : 'p-4'} bg-gray-50 rounded-lg`}>
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Year to Date</span>
                  <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold`}>₹{yearToDateRevenue.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-scale-in">
              <CardHeader className={isMobile ? 'pb-2 px-3 pt-3' : ''}>
                <CardTitle className={isMobile ? 'text-base' : ''}>
                  {isMobile ? 'Members' : 'Membership Overview'}
                </CardTitle>
              </CardHeader>
              <CardContent className={`space-y-${isMobile ? '2' : '4'} ${isMobile ? 'px-3 pb-3' : ''}`}>
                <div className={`flex justify-between items-center ${isMobile ? 'p-2' : 'p-4'} bg-gray-50 rounded-lg`}>
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>New Members</span>
                  <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-blue-600`}>{newMembersThisMonth}</span>
                </div>
                <div className={`flex justify-between items-center ${isMobile ? 'p-2' : 'p-4'} bg-gray-50 rounded-lg`}>
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Active Members</span>
                  <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold`}>{activeMembers}</span>
                </div>
                <div className={`flex justify-between items-center ${isMobile ? 'p-2' : 'p-4'} bg-gray-50 rounded-lg`}>
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Total Members</span>
                  <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold`}>{totalMembers}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Reports */}
          <Card>
            <CardHeader className={isMobile ? 'pb-2 px-3 pt-3' : ''}>
              <CardTitle className={isMobile ? 'text-base' : ''}>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? 'px-3 pb-3' : ''}>
              {payments.length > 0 ? (
                <div className={`space-y-${isMobile ? '3' : '4'}`}>
                  <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-3 gap-4'}`}>
                    <div className={`text-center ${isMobile ? 'p-2' : 'p-4'} bg-green-50 rounded-lg`}>
                      <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-600`}>₹{currentMonthRevenue.toLocaleString()}</div>
                      <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-green-700`}>This Month</div>
                    </div>
                    <div className={`text-center ${isMobile ? 'p-2' : 'p-4'} bg-blue-50 rounded-lg`}>
                      <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-blue-600`}>{currentMonthPayments.length}</div>
                      <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-700`}>
                        {isMobile ? 'Payments' : 'Payments This Month'}
                      </div>
                    </div>
                    <div className={`text-center ${isMobile ? 'p-2' : 'p-4'} bg-purple-50 rounded-lg`}>
                      <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-purple-600`}>
                        ₹{currentMonthPayments.length > 0 ? Math.round(currentMonthRevenue / currentMonthPayments.length).toLocaleString() : 0}
                      </div>
                      <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-700`}>
                        {isMobile ? 'Avg' : 'Avg Payment'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`text-center ${isMobile ? 'py-4' : 'py-8'}`}>
                  <DollarSign className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} mx-auto text-gray-400 mb-2`} />
                  <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
                    {isMobile ? 'No payment data' : 'No payment data available'}
                  </p>
                  {!isMobile && <p className="text-gray-500 text-sm">Start recording payments to see financial reports</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired" className={`space-y-${isMobile ? '4' : '6'}`}>
          <ExpiredMembersReport />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className={`space-y-${isMobile ? '4' : '6'}`}>
          {/* Analytics Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Peak Hour"
              value={topPeakHours[0] ? `${topPeakHours[0].hour}:00` : 'N/A'}
              change={0}
              icon={Clock}
              color="text-green-600"
            />
            <StatCard
              title="Top Member"
              value={topEngagedMembers[0] ? topEngagedMembers[0].memberName.split(' ')[0] : 'N/A'}
              change={0}
              icon={UserCheck}
              color="text-blue-600"
            />
            <StatCard
              title="Avg Daily Visits"
              value={recentTrends.length > 0 ? Math.round(recentTrends.reduce((sum, t) => sum + t.count, 0) / recentTrends.length) : 0}
              change={weeklyData.attendanceChange}
              icon={Calendar}
              color="text-purple-600"
            />
            <StatCard
              title="Retention Rate"
              value={analytics.retentionAnalysis[0] ? `${Math.round(analytics.retentionAnalysis[0].retentionRate)}%` : `${Math.round(retentionRate)}%`}
              change={weeklyData.retentionChange}
              icon={TrendingUp}
              color="text-emerald-600"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Hours Chart */}
            <Card className="h-full animate-scale-in">
              <CardHeader>
                <CardTitle>Peak Hours Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {topPeakHours.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topPeakHours} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <XAxis 
                            dataKey="hour" 
                            tickFormatter={(value) => `${value}:00`}
                            fontSize={12}
                          />
                          <YAxis fontSize={12} />
                          <ChartTooltip 
                            content={<ChartTooltipContent />}
                            formatter={(value, name) => [`${value} visits`, `${name}:00`]}
                          />
                          <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Clock className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-gray-600">No peak hours data available</p>
                      <p className="text-gray-500 text-sm">Data will appear here once you have attendance records</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Attendance Trends */}
            <Card className="h-full animate-scale-in">
              <CardHeader>
                <CardTitle>30-Day Attendance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {recentTrends.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={recentTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => new Date(value).getDate().toString()}
                            fontSize={12}
                          />
                          <YAxis fontSize={12} />
                          <ChartTooltip 
                            content={<ChartTooltipContent />}
                            formatter={(value) => [`${value} visits`, 'Attendance']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="var(--color-count)" 
                            strokeWidth={2}
                            dot={{ fill: 'var(--color-count)', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Calendar className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-gray-600">No attendance trends available</p>
                      <p className="text-gray-500 text-sm">Trends will appear here once you start tracking attendance</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Forecast */}
            <Card className="h-full animate-scale-in">
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {analytics.revenueForecast.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.revenueForecast} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <XAxis dataKey="month" fontSize={12} />
                          <YAxis fontSize={12} />
                          <ChartTooltip 
                            content={<ChartTooltipContent />}
                            formatter={(value, name) => [`₹${Math.round(Number(value))}`, name === 'actualRevenue' ? 'Actual' : 'Forecast']}
                          />
                          <Bar dataKey="actualRevenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="forecastRevenue" fill="var(--color-forecast)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <TrendingUp className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-gray-600">No revenue data available</p>
                      <p className="text-gray-500 text-sm">Revenue trends will appear here once you have payment data</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Member Engagement */}
            <Card className="h-full animate-scale-in">
              <CardHeader>
                <CardTitle>Top Member Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {topEngagedMembers.length > 0 ? (
                    <div className="space-y-4 pt-4">
                      {topEngagedMembers.slice(0, 5).map((member, index) => {
                        const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
                        return (
                          <div key={member.memberId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover-scale">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                              <div>
                                <span className="text-sm font-medium">{member.memberName}</span>
                                <p className="text-xs text-gray-500">{member.attendanceCount} visits</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${member.score}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600">{Math.round(member.score)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Users className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-gray-600">No member engagement data</p>
                      <p className="text-gray-500 text-sm">Top performing members will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Retention Analysis Table */}
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle>Member Retention Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.retentionAnalysis.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left text-sm font-medium text-gray-500 pb-3">Period</th>
                        <th className="text-left text-sm font-medium text-gray-500 pb-3">New Members</th>
                        <th className="text-left text-sm font-medium text-gray-500 pb-3">Active</th>
                        <th className="text-left text-sm font-medium text-gray-500 pb-3">Churned</th>
                        <th className="text-left text-sm font-medium text-gray-500 pb-3">Retention Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.retentionAnalysis.map((period, index) => (
                        <tr key={index} className="border-b last:border-b-0 hover-scale">
                          <td className="py-3 text-sm font-medium">{period.period}</td>
                          <td className="py-3 text-sm">{period.newMembers}</td>
                          <td className="py-3 text-sm">{period.activeMembers}</td>
                          <td className="py-3 text-sm">{period.churnedMembers}</td>
                          <td className="py-3 text-sm">
                            <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                              period.retentionRate > 80 
                                ? 'bg-green-100 text-green-700' 
                                : period.retentionRate > 60 
                                ? 'bg-yellow-100 text-yellow-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {Math.round(period.retentionRate)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">No retention data available</p>
                  <p className="text-gray-500 text-sm">Retention analysis will appear here once you have member data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          {/* Member Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Members"
              value={filteredMembers.length}
              change={0}
              icon={Users}
              color="text-blue-600"
            />
            <StatCard
              title="Active Members"
              value={activeMembers}
              change={0}
              icon={UserCheck}
              color="text-green-600"
            />
            <StatCard
              title="Inactive Members"
              value={inactiveMembers}
              change={0}
              icon={Users}
              color="text-red-600"
            />
            <StatCard
              title="New This Month"
              value={newMembersThisMonth}
              change={0}
              icon={TrendingUp}
              color="text-emerald-600"
            />
          </div>

          {/* Member List Table */}
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle>Complete Member List</CardTitle>
              <p className="text-sm text-gray-600">View all gym members with their current status and details</p>
            </CardHeader>
            <CardContent>
              {filteredMembers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                     <thead>
                       <tr className="border-b">
                         <th className="text-left text-sm font-medium text-gray-500 pb-3">Member ID</th>
                         <th className="text-left text-sm font-medium text-gray-500 pb-3">Name</th>
                         <th className="text-left text-sm font-medium text-gray-500 pb-3">Phone</th>
                         <th className="text-left text-sm font-medium text-gray-500 pb-3">Plan</th>
                         <th className="text-left text-sm font-medium text-gray-500 pb-3">Status</th>
                         <th className="text-left text-sm font-medium text-gray-500 pb-3">Join Date</th>
                         <th className="text-left text-sm font-medium text-gray-500 pb-3">Last Payment</th>
                         <th className="text-left text-sm font-medium text-gray-500 pb-3">Expiry Date</th>
                       </tr>
                     </thead>
                    <tbody>
                      {filteredMembers.map((member) => {
                        const expiry = member.plan_expiry_date ? new Date(member.plan_expiry_date) : null;
                        const isActive = expiry && expiry >= today;
                        const badgeClass = isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
                        const label = isActive ? 'Active' : 'Inactive';
                        return (
                          <tr key={member.id} className="border-b last:border-b-0 hover-scale">
                            <td className="py-3 text-sm font-medium">{member.user_id}</td>
                            <td className="py-3 text-sm">{member.name}</td>
                            <td className="py-3 text-sm">{member.phone}</td>
                            <td className="py-3 text-sm">{member.plan}</td>
                            <td className="py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>{label}</span>
                            </td>
                             <td className="py-3 text-sm">{formatDate(member.join_date)}</td>
                             <td className="py-3 text-sm">{member.last_payment ? formatDate(member.last_payment) : 'No payment'}</td>
                             <td className="py-3 text-sm">{member.plan_expiry_date ? formatDate(member.plan_expiry_date) : 'N/A'}</td>
                           </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">No members found</p>
                  <p className="text-gray-500 text-sm">Add members to see them listed here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;