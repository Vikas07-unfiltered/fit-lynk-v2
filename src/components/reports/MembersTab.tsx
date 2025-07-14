import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Users, UserCheck, TrendingUp } from 'lucide-react';
import { Member } from '@/types/member';
import StatCard from './StatCard';
import MemberListTable from './MemberListTable';

interface MembersTabProps {
  members: Member[];
}

const MembersTab = ({ members }: MembersTabProps) => {
  return (
    <TabsContent value="members" className="space-y-6 animate-fade-in">
      {/* Member Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Members"
          value={members.length}
          change={0}
          icon={Users}
          color="text-blue-600"
        />
        <StatCard
          title="Active Members"
          value={members.filter(m => m.status === 'active').length}
          change={0}
          icon={UserCheck}
          color="text-green-600"
        />
        <StatCard
          title="Inactive Members"
          value={members.filter(m => m.status === 'inactive').length}
          change={0}
          icon={Users}
          color="text-red-600"
        />
        <StatCard
          title="New This Month"
          value={members.filter(m => new Date(m.join_date).getMonth() === new Date().getMonth()).length}
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
          <MemberListTable members={members} />
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default MembersTab;