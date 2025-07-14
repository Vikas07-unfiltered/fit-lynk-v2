
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Cell, Pie, ResponsiveContainer } from 'recharts';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { useIsMobile } from '@/hooks/use-mobile';
import { TrendingUp, Users, Clock, DollarSign, UserCheck } from 'lucide-react';

const AdvancedAnalytics = () => {
  const { analytics, loading } = useAdvancedAnalytics();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const topPeakHours = analytics.peakHours.slice(0, 8);
  const topEngagedMembers = analytics.memberEngagement.slice(0, 5);
  const recentTrends = analytics.attendanceTrends.slice(-30);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className={`grid grid-cols-1 ${isMobile ? 'sm:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Peak Hour</CardTitle>
              <Clock className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-green-600`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>
              {topPeakHours[0] ? `${topPeakHours[0].hour}:00` : 'N/A'}
            </div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
              {topPeakHours[0] ? `${topPeakHours[0].count} visits` : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Top Member</CardTitle>
              <UserCheck className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-blue-600`}>
              {topEngagedMembers[0] ? topEngagedMembers[0].memberName.split(' ')[0] : 'N/A'}
            </div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
              {topEngagedMembers[0] ? `${Math.round(topEngagedMembers[0].score)} score` : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Avg Daily Visits</CardTitle>
              <TrendingUp className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-purple-600`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-purple-600`}>
              {recentTrends.length > 0 ? Math.round(recentTrends.reduce((sum, t) => sum + t.count, 0) / recentTrends.length) : 0}
            </div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Retention Rate</CardTitle>
              <Users className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-orange-600`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-orange-600`}>
              {analytics.retentionAnalysis[0] ? `${Math.round(analytics.retentionAnalysis[0].retentionRate)}%` : '0%'}
            </div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className={`grid grid-cols-1 ${isMobile ? 'gap-6' : 'lg:grid-cols-2 gap-6'}`}>
        {/* Peak Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle className={isMobile ? 'text-base' : 'text-lg'}>Peak Hours Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className={`${isMobile ? 'h-[200px]' : 'h-[300px]'}`}>
              <BarChart data={topPeakHours}>
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(value) => `${value}:00`}
                  fontSize={isMobile ? 10 : 12}
                />
                <YAxis fontSize={isMobile ? 10 : 12} />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value, name) => [`${value} visits`, `${name}:00`]}
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={2} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Attendance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className={isMobile ? 'text-base' : 'text-lg'}>30-Day Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className={`${isMobile ? 'h-[200px]' : 'h-[300px]'}`}>
              <LineChart data={recentTrends}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).getDate().toString()}
                  fontSize={isMobile ? 10 : 12}
                />
                <YAxis fontSize={isMobile ? 10 : 12} />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value) => [`${value} visits`, 'Attendance']}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="var(--color-count)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-count)', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className={isMobile ? 'text-base' : 'text-lg'}>Revenue Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className={`${isMobile ? 'h-[200px]' : 'h-[300px]'}`}>
              <BarChart data={analytics.revenueForecast}>
                <XAxis dataKey="month" fontSize={isMobile ? 9 : 12} />
                <YAxis fontSize={isMobile ? 10 : 12} />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value, name) => [`₹${Math.round(Number(value))}`, name === 'actualRevenue' ? 'Actual' : 'Forecast']}
                />
                <Bar dataKey="actualRevenue" fill="var(--color-revenue)" radius={2} />
                <Bar dataKey="forecastRevenue" fill="var(--color-forecast)" radius={2} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Member Engagement */}
        <Card>
          <CardHeader>
            <CardTitle className={isMobile ? 'text-base' : 'text-lg'}>Member Engagement Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topEngagedMembers.slice(0, 5).map((member, index) => (
                <div key={member.memberId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: COLORS[index] }}></div>
                    <span className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>
                      {member.memberName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                      {member.attendanceCount} visits
                    </span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${member.score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retention Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle className={isMobile ? 'text-base' : 'text-lg'}>Member Retention Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className={`text-left ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-500 pb-2`}>Period</th>
                  <th className={`text-left ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-500 pb-2`}>New Members</th>
                  <th className={`text-left ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-500 pb-2`}>Active</th>
                  <th className={`text-left ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-500 pb-2`}>Churned</th>
                  <th className={`text-left ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-500 pb-2`}>Retention Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.retentionAnalysis.map((period, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className={`py-2 ${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>{period.period}</td>
                    <td className={`py-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>{period.newMembers}</td>
                    <td className={`py-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>{period.activeMembers}</td>
                    <td className={`py-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>{period.churnedMembers}</td>
                    <td className={`py-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                      <span className={`font-medium ${period.retentionRate > 80 ? 'text-green-600' : period.retentionRate > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {Math.round(period.retentionRate)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalytics;
