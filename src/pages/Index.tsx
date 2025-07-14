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

    // Mobile: Show 3 tabs at a time with horizontal scroll
    return (
      <div className="w-full overflow-x-auto">
        <TabsList className="flex w-max min-w-full gap-1 p-1">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id} 
              className="flex flex-col items-center gap-1 py-3 px-4 min-w-[80px] whitespace-nowrap"
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-xs">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
      <GymHeader />
      
      <div className={`${isMobile ? 'px-3 py-4' : 'container mx-auto px-4 py-6'}`}>
        <div className={`mb-${isMobile ? '4' : '8'}`}>
          <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-gray-900 mb-2`}>
            {isMobile ? 'Dashboard' : 'Gym Management Dashboard'}
          </h1>
          <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
            {isMobile ? 'Manage your gym efficiently' : 'Manage your gym operations efficiently'}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {renderMobileTabsList()}

          <TabsContent value="overview" className="mt-4">
            <div className="space-y-6">
              <DashboardOverview />

            </div>
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <Card>
              <CardHeader className={isMobile ? 'pb-3 px-4 pt-4' : ''}>
                <CardTitle className={isMobile ? 'text-lg' : ''}>Member Management</CardTitle>
                <CardDescription className={isMobile ? 'text-sm' : ''}>
                  {isMobile ? 'Manage your gym members' : 'Add, edit, and manage your gym members'}
                </CardDescription>
              </CardHeader>
              <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
                <MemberManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="mt-4">
            <Card>
              <CardHeader className={isMobile ? 'pb-3 px-4 pt-4' : ''}>
                <CardTitle className={isMobile ? 'text-lg' : ''}>Attendance Tracking</CardTitle>
                <CardDescription className={isMobile ? 'text-sm' : ''}>
                  {isMobile ? 'Track member check-ins' : 'Track member attendance and check-ins'}
                </CardDescription>
              </CardHeader>
              <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
                <AttendanceTracker />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card>
              <CardHeader className={isMobile ? 'pb-3 px-4 pt-4' : ''}>
                <CardTitle className={isMobile ? 'text-lg' : ''}>Payment Management</CardTitle>
                <CardDescription className={isMobile ? 'text-sm' : ''}>
                  {isMobile ? 'Track payments and billing' : 'Track payments and manage billing'}
                </CardDescription>
              </CardHeader>
              <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
                <PaymentTracking />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expired" className="mt-4">
            <Card>
              <CardHeader className={isMobile ? 'pb-3 px-4 pt-4' : ''}>
                <CardTitle className={isMobile ? 'text-lg' : ''}>Expired Memberships</CardTitle>
                <CardDescription className={isMobile ? 'text-sm' : ''}>
                  {isMobile ? 'View and manage expired memberships' : 'View and manage members with expired memberships'}
                </CardDescription>
              </CardHeader>
              <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
                <ExpiredMembersReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <Card>
              <CardHeader className={isMobile ? 'pb-3 px-4 pt-4' : ''}>
                <CardTitle className={isMobile ? 'text-lg' : ''}>Reports & Analytics</CardTitle>
                <CardDescription className={isMobile ? 'text-sm' : ''}>
                  {isMobile ? 'Comprehensive insights' : 'Comprehensive analytics, insights, and performance trends'}
                </CardDescription>
              </CardHeader>
              <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
                <Reports />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trainers" className="mt-4">
            <Card>
              <CardHeader className={isMobile ? 'pb-3 px-4 pt-4' : ''}>
                <CardTitle className={isMobile ? 'text-lg' : ''}>Trainer Management</CardTitle>
                <CardDescription className={isMobile ? 'text-sm' : ''}>
                  {isMobile ? 'Manage gym trainers' : 'Manage gym trainers and their schedules'}
                </CardDescription>
              </CardHeader>
              <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
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