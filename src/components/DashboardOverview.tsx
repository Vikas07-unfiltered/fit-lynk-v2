
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, TrendingDown, Activity, BarChart, AlertTriangle } from 'lucide-react';
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';
import { useMembershipPlans } from '@/hooks/useMembershipPlans';
import { useIsMobile } from '@/hooks/use-mobile';
import { useExpiredMembers } from '@/hooks/useExpiredMembers';

const DashboardOverview = () => {
  const { analytics, loading } = useDashboardAnalytics();
  const { plans } = useMembershipPlans();
  const { expiredMembers } = useExpiredMembers();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className={`grid grid-cols-1 ${isMobile ? 'sm:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'} gap-4 mb-8`}>
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
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color,
    prefix = '',
    suffix = ''
  }: { 
    title: string; 
    value: string | number; 
    change?: number; 
    icon: any; 
    color: string;
    prefix?: string;
    suffix?: string;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className={`${isMobile ? 'pb-1' : 'pb-2'}`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>{title}</CardTitle>
          <Icon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${color}`} />
        </div>
      </CardHeader>
      <CardContent className={isMobile ? 'pt-0' : ''}>
        <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-1`}>
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
        {change !== undefined && (
          <div className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {change > 0 ? (
              <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
            ) : change < 0 ? (
              <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
            ) : null}
            {change !== 0 && (
              <>
                <span className={change > 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(change).toFixed(1)}%
                </span>
                <span className="text-gray-500 ml-1">{isMobile ? 'vs last month' : 'from last month'}</span>
              </>
            )}
            {change === 0 && (
              <span className="text-gray-500">{isMobile ? 'No change' : 'No change from last month'}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className={isMobile ? 'text-center' : ''}>
        <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-2`}>
          {isMobile ? 'Overview' : 'Gym Overview'}
        </h2>
        <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
          {isMobile ? 'Key metrics for your gym' : 'Key metrics and insights for your gym performance'}
        </p>
      </div>

      <div className={`grid grid-cols-1 ${isMobile ? 'sm:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
        <StatCard
          title="Total Members"
          value={analytics.totalMembers}
          change={analytics.memberGrowthRate}
          icon={Users}
          color="text-blue-600"
        />
        
        <StatCard
          title="Active Members"
          value={analytics.activeMembers}
          icon={Activity}
          color="text-green-600"
        />
        
        <StatCard
          title={isMobile ? "Revenue" : "Monthly Revenue"}
          value={Math.round(analytics.monthlyRevenue)}
          icon={BarChart}
          color="text-emerald-600"
          prefix="₹"
        />
        
        <StatCard
          title={isMobile ? "Plans" : "Membership Plans"}
          value={analytics.totalPlans}
          icon={TrendingUp}
          color="text-purple-600"
        />
      </div>

      <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-3 gap-4'}`}>
        <Card>
          <CardHeader>
            <CardTitle className={isMobile ? 'text-base' : 'text-lg'}>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                {isMobile ? 'New Members:' : 'New Members This Month:'}
              </span>
              <span className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>{analytics.newMembersThisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                {isMobile ? 'Avg Price:' : 'Average Plan Price:'}
              </span>
              <span className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>₹{Math.round(analytics.averagePlanPrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                {isMobile ? 'Retention:' : 'Member Retention:'}
              </span>
              <span className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>
                {analytics.totalMembers > 0 ? Math.round((analytics.activeMembers / analytics.totalMembers) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={isMobile ? 'text-base' : 'text-lg'}>Popular Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.mostPopularPlan ? (
              <div className="text-center">
                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-emerald-600 mb-2`}>
                  {(() => {
                    const plan = plans.find(p => p.id === analytics.mostPopularPlan);
                    return plan ? plan.name : analytics.mostPopularPlan;
                  })()}
                </div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                  {isMobile ? 'Most chosen' : 'Most chosen by members'}
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p className={isMobile ? 'text-sm' : ''}>No membership data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={isMobile ? 'text-base' : 'text-lg'}>Growth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-2 ${
                analytics.memberGrowthRate > 0 ? 'text-green-600' : 
                analytics.memberGrowthRate < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {analytics.memberGrowthRate > 0 ? '+' : ''}{analytics.memberGrowthRate.toFixed(1)}%
              </div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                {isMobile ? 'Growth this month' : 'Member growth this month'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiry Notifications */}
      {expiredMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Expired Memberships
              <Badge variant="destructive">{expiredMembers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              {expiredMembers.length} member{expiredMembers.length > 1 ? 's have' : ' has'} expired membership{expiredMembers.length > 1 ? 's' : ''}:
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {expiredMembers.slice(0, 5).map((member) => (
                <div key={member.member_id} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                  <div>
                    <span className="font-medium text-red-800">{member.member_name}</span>
                    <span className="text-sm text-red-600 ml-2">({member.member_user_id})</span>
                  </div>
                  <Badge variant="outline" className="bg-red-100 text-red-700 text-xs">
                    {member.days_expired} days ago
                  </Badge>
                </div>
              ))}
              {expiredMembers.length > 5 && (
                <p className="text-xs text-gray-500 text-center">
                  +{expiredMembers.length - 5} more expired memberships
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardOverview;
