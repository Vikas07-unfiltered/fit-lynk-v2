
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/date';
import { User, Calendar, Bell, Pencil, Trash, DollarSign } from 'lucide-react';
import { Member } from '@/types/member';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMembers } from '@/hooks/useMembers';
import { processMembershipPayment } from '@/utils/membership';

interface MemberCardProps {
  member: Member;
  onShowQR: (member: Member) => void;
}

const MemberCard = ({ member, onShowQR }: MemberCardProps) => {
  const { deleteMember, updateMember, fetchMembers } = useMembers();
  const [isEditing, setIsEditing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [editFields, setEditFields] = useState({ name: member.name, phone: member.phone, plan: member.plan });
  // Placeholder handlers for edit and delete
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFields({ ...editFields, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    await updateMember(member.id, editFields);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditFields({ name: member.name, phone: member.phone, plan: member.plan });
  };
  const handleCollectPayment = async () => {
    const amountStr = prompt('Enter payment amount:');
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid', description: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    setIsPaying(true);
    try {
      const res = await processMembershipPayment({
        gymId: member.gym_id ?? '',
        memberId: member.id,
        amount,
        method: 'cash',
      });
      if (res.success) {
        toast({ title: 'Success', description: res.message });
        fetchMembers();
      } else {
        toast({ title: 'Error', description: res.message, variant: 'destructive' });
      }
    } catch (err:any) {
      console.error(err);
      toast({ title: 'Error', description: 'Payment failed', variant: 'destructive' });
    } finally {
      setIsPaying(false);
    }
  };

  const handleDelete = async () => {
    if(window.confirm(`Are you sure you want to delete member: ${member.name}?`)) {
      await deleteMember(member.id);
    }
  };

  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const isMobile = useIsMobile();

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const sendIndividualNotification = async () => {
    setIsSendingNotification(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-expiry-notifications', {
        body: {
          member_id: member.id,
          individual_notification: true
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Notification sent to ${member.name}`,
      });
    } catch (error) {
      console.error('Error sending individual notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setIsSendingNotification(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className={`${isMobile ? 'pb-2' : 'pb-3'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full flex items-center justify-center flex-shrink-0`}>
              <User className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} truncate`}>{member.name}</CardTitle>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-emerald-600 font-semibold truncate`}>
                ID: {member.user_id}
              </p>
            </div>
          </div>
          {(() => {
            const today = new Date();
            today.setHours(0,0,0,0); // Set time to midnight for accurate comparison
            const expiry = member.plan_expiry_date ? new Date(member.plan_expiry_date) : null;
            const isActive = expiry && expiry >= today;
            const statusLabel = isActive ? 'active' : 'inactive';
            const badgeClass = isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
            return (
              <Badge className={badgeClass}>
                {statusLabel}
              </Badge>
            );
          })()}
        </div>
      </CardHeader>
      <CardContent className={`space-y-${isMobile ? '2' : '3'}`}>
        <div className={`flex justify-between ${isMobile ? 'text-[10px]' : 'text-sm'}`}>
          <span className="font-medium">Plan:</span>
          <span className="text-emerald-600 font-semibold truncate ml-2">{member.plan}</span>
        </div>
        <div className={`flex justify-between ${isMobile ? 'text-[10px]' : 'text-sm'}`}>
          <span className="font-medium">Phone:</span>
          <span className="truncate ml-2">{member.phone}</span>
        </div>
        <div className={`flex justify-between ${isMobile ? 'text-[10px]' : 'text-sm'}`}>
          <span className="font-medium">Joined:</span>
          <span className="truncate ml-2">{formatDate(member.join_date)}</span>
        </div>
        <div className={`flex justify-between ${isMobile ? 'text-[10px]' : 'text-sm'}`}>
          <span className="font-medium">Last Payment:</span>
          <span className="truncate ml-2">{member.last_payment ? formatDate(member.last_payment) : 'No payment'}</span>
        </div>
        <div className={`flex gap-1.5 pt-${isMobile ? '1.5' : '2'}`}>
          <Button
            size="sm"
            variant="outline"
            onClick={handleEdit}
            className={`border-blue-500 text-blue-600 hover:bg-blue-50 ${isMobile ? 'h-7 px-2' : 'px-3'} flex-1`}
          >
            <Pencil className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCollectPayment}
            disabled={isPaying}
            className={`border-green-500 text-green-600 hover:bg-green-50 ${isMobile ? 'h-7 px-2' : 'px-3'} flex-1`}
          >
            <DollarSign className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            className={`border-red-500 text-red-600 hover:bg-red-50 ${isMobile ? 'h-7 px-2' : 'px-3'} flex-1`}
          >
            <Trash className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
          </Button>
        </div>

        {/* Edit Dialog */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
            <div className={`bg-white rounded-lg w-full shadow-lg ${isMobile ? 'max-w-sm p-4' : 'max-w-md p-6'}`}>
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-4`}>Edit Member</h3>
              <div className={`space-y-${isMobile ? '2' : '3'}`}>
                <input
                  className={`w-full border rounded ${isMobile ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'}`}
                  name="name"
                  value={editFields.name}
                  onChange={handleEditChange}
                  placeholder="Name"
                />
                <input
                  className={`w-full border rounded ${isMobile ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'}`}
                  name="phone"
                  value={editFields.phone}
                  onChange={handleEditChange}
                  placeholder="Phone"
                />
                <input
                  className={`w-full border rounded ${isMobile ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'}`}
                  name="plan"
                  value={editFields.plan}
                  onChange={handleEditChange}
                  placeholder="Plan"
                />
              </div>
              <div className={`flex justify-end gap-2 mt-${isMobile ? '4' : '6'}`}>
                <button 
                  onClick={handleEditCancel} 
                  className={`${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} rounded bg-gray-200`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEditSave} 
                  className={`${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} rounded bg-blue-600 text-white`}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberCard;
