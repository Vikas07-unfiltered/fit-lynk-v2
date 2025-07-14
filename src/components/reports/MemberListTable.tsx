import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate, parseDate } from '@/utils/date';
import { Users } from 'lucide-react';
import { Member } from '@/types/member';

interface MemberListTableProps {
  members: Member[];
}

const MemberListTable = ({ members }: MemberListTableProps) => {
  console.log('Rendering MemberListTable');
  // Debug: log member data to inspect plan_expiry_date
  console.log('Member data:', members);
  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-600">No members found</p>
        <p className="text-gray-500 text-sm">Add members to see them listed here</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Join Date</TableHead>
            <TableHead>Last Payment</TableHead>
            <TableHead>Expiry Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            console.log('Row:', member.user_id, 'Expiry:', member.plan_expiry_date);
            return (
              <TableRow key={member.id} className="hover-scale">
                <TableCell className="font-medium">{member.user_id}</TableCell>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.phone}</TableCell>
                <TableCell>{member.plan}</TableCell>
                <TableCell>
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    // Use the database status field if plan_expiry_date is not available
                    if (!member.plan_expiry_date) {
                      const statusLabel = member.status === 'active' ? 'Active' : 'Inactive';
                      const badgeClass = member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
                      const badgeVariant = member.status === 'active' ? 'default' : 'secondary';
                      return (
                        <Badge variant={badgeVariant} className={badgeClass}>
                          {statusLabel}
                        </Badge>
                      );
                    }
                    
                    const expiry = parseDate(member.plan_expiry_date);
                    const isExpired = expiry ? expiry.getTime() < today.getTime() : false;
                    const statusLabel = isExpired ? 'Inactive' : 'Active';
                    const badgeClass = isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
                    const badgeVariant = isExpired ? 'secondary' : 'default';
                    return (
                      <Badge variant={badgeVariant} className={badgeClass}>
                        {statusLabel}
                      </Badge>
                    );
                  })()}
                </TableCell>
                <TableCell>{formatDate(member.join_date)}</TableCell>
                <TableCell>
                  {member.last_payment ? formatDate(member.last_payment) : 'No payment'}
                </TableCell>
                <TableCell>
                  {member.plan_expiry_date ? formatDate(member.plan_expiry_date) : 'N/A'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default MemberListTable;