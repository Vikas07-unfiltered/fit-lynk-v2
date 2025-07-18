import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, CreditCard, Home, TrendingUp, UserCheck, AlertTriangle } from 'lucide-react';
import MemberManagement from '@/components/MemberManagement';
import AttendanceTracker from '@/components/AttendanceTracker';
import PaymentTracking from '@/components/PaymentTracking';
import Reports from '@/components/Reports';
import TrainerManagement from '@/components/TrainerManagement';
import GymHeader from '@/components/GymHeader';
import DashboardOverview from '@/components/DashboardOverview';
import ExpiredMembersReport from '@/components/ExpiredMembersReport';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const isMobile = useIsMobile();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'trainers', label: 'Trainers', icon: UserCheck },
  ];

  const renderMobileTabsList = () => {
    if (!isMobile) {
      return (
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      );
    }

    // Mobile: Horizontal scrollable tabs
    return (
      <div className="w-full overflow-x-auto pb-1">
        <TabsList className="flex w-max min-w-full gap-0.5 p-1 bg-muted/50">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id} 
              className="flex flex-col items-center gap-1.5 py-2.5 px-3 min-w-[75px] whitespace-nowrap text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
      <GymHeader />
      
      <div className={`${isMobile ? 'px-2 py-3' : 'container mx-auto px-4 py-6'}`}>
        <div className={`mb-${isMobile ? '3' : '8'}`}>
          <h1 className={`${isMobile ? 'text-lg font-semibold' : 'text-3xl font-bold'} text-gray-900 mb-1`}>
            {isMobile ? 'Dashboard' : 'Gym Management Dashboard'}
          </h1>
          <p className={`text-gray-600 ${isMobile ? 'text-xs' : ''}`}>
            {isMobile ? 'Manage your gym efficiently' : 'Manage your gym operations efficiently'}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className={`space-y-${isMobile ? '3' : '4'}`}>
          {renderMobileTabsList()}

          <TabsContent value="overview" className={`mt-${isMobile ? '3' : '4'}`}>
            <div className={`space-y-${isMobile ? '4' : '6'}`}>
              <DashboardOverview />
            </div>
          </TabsContent>

          <TabsContent value="members" className={`mt-${isMobile ? '3' : '4'}`}>
            <Card className={isMobile ? 'border-0 shadow-none' : ''}>
              <CardHeader className={isMobile ? 'pb-2 px-3 pt-3' : ''}>
                <CardTitle className={isMobile ? 'text-base' : ''}>Member Management</CardTitle>
                <CardDescription className={isMobile ? 'text-xs' : ''}>
                  {isMobile ? 'Manage your gym members' : 'Add, edit, and manage your gym members'}
                </CardDescription>
              </CardHeader>
              <CardContent className={isMobile ? 'px-3 pb-3' : ''}>
                <MemberManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className={`mt-${isMobile ? '3' : '4'}`}>
            <Card className={isMobile ? 'border-0 shadow-none' : ''}>
              <CardHeader className={isMobile ? 'pb-2 px-3 pt-3' : ''}>
                <CardTitle className={isMobile ? 'text-base' : ''}>Attendance Tracking</CardTitle>
                <CardDescription className={isMobile ? 'text-xs' : ''}>
                  {isMobile ? 'Track member check-ins' : 'Track member attendance and check-ins'}
                </CardDescription>
              </CardHeader>
              <CardContent className={isMobile ? 'px-3 pb-3' : ''}>
                <AttendanceTracker />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className={`mt-${isMobile ? '3' : '4'}`}>
            <Card className={isMobile ? 'border-0 shadow-none' : ''}>
              <CardHeader className={isMobile ? 'pb-2 px-3 pt-3' : ''}>
                <CardTitle className={isMobile ? 'text-base' : ''}>Payment Management</CardTitle>
                <CardDescription className={isMobile ? 'text-xs' : ''}>
                  {isMobile ? 'Track payments and billing' : 'Track payments and manage billing'}
                </CardDescription>
              </CardHeader>
              <CardContent className={isMobile ? 'px-3 pb-3' : ''}>
                <PaymentTracking />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expired" className={`mt-${isMobile ? '3' : '4'}`}>
            <Card className={isMobile ? 'border-0 shadow-none' : ''}>
              <CardHeader className={isMobile ? 'pb-2 px-3 pt-3' : ''}>
                <CardTitle className={isMobile ? 'text-base' : ''}>Expired Memberships</CardTitle>
                <CardDescription className={isMobile ? 'text-xs' : ''}>
                  {isMobile ? 'View and manage expired memberships' : 'View and manage members with expired memberships'}
                </CardDescription>
              </CardHeader>
              <CardContent className={isMobile ? 'px-3 pb-3' : ''}>
                <ExpiredMembersReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className={`mt-${isMobile ? '3' : '4'}`}>
            <Card className={isMobile ? 'border-0 shadow-none' : ''}>
              <CardHeader className={isMobile ? 'pb-2 px-3 pt-3' : ''}>
                <CardTitle className={isMobile ? 'text-base' : ''}>Reports & Analytics</CardTitle>
                <CardDescription className={isMobile ? 'text-xs' : ''}>
                  {isMobile ? 'Comprehensive insights' : 'Comprehensive analytics, insights, and performance trends'}
                </CardDescription>
              </CardHeader>
              <CardContent className={isMobile ? 'px-3 pb-3' : ''}>
                <Reports />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trainers" className={`mt-${isMobile ? '3' : '4'}`}>
            <Card className={isMobile ? 'border-0 shadow-none' : ''}>
              <CardHeader className={isMobile ? 'pb-2 px-3 pt-3' : ''}>
                <CardTitle className={isMobile ? 'text-base' : ''}>Trainer Management</CardTitle>
                <CardDescription className={isMobile ? 'text-xs' : ''}>
                  {isMobile ? 'Manage gym trainers' : 'Manage gym trainers and their schedules'}
                </CardDescription>
              </CardHeader>
              <CardContent className={isMobile ? 'px-3 pb-3' : ''}>
                <TrainerManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;