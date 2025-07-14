
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/date';
import { Bell, Calendar, Phone, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface ExpiringMember {
  member_id: string;
  member_name: string;
  member_phone: string;
  gym_id: string;
  plan_name: string;
  expiry_date: string;
}

const ExpiryNotifications = () => {
  const [expiringMembers, setExpiringMembers] = useState<ExpiringMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { gym } = useAuth();

  const fetchExpiringMembers = async () => {
    if (!gym?.id) return;

    try {
      const { data, error } = await supabase.rpc('get_expiring_members', {
        days_before: 5
      });

      if (error) throw error;

      // Filter by current gym
      const gymExpiringMembers = data?.filter(
        (member: ExpiringMember) => member.gym_id === gym.id
      ) || [];

      setExpiringMembers(gymExpiringMembers);
    } catch (error) {
      console.error('Error fetching expiring members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch expiring memberships",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendNotifications = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-expiry-notifications');
      
      if (error) throw error;

      toast({
        title: "Success",
        description: `Notifications sent to ${data?.successful_notifications || 0} members`,
      });

      // Refresh the list
      fetchExpiringMembers();
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast({
        title: "Error",
        description: "Failed to send notifications",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchExpiringMembers();
  }, [gym?.id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Expiry Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Expiry Notifications
            {expiringMembers.length > 0 && (
              <Badge variant="destructive">{expiringMembers.length}</Badge>
            )}
          </CardTitle>
          {expiringMembers.length > 0 && (
            <Button 
              onClick={sendNotifications} 
              disabled={sending}
              size="sm"
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send WhatsApp Notifications'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {expiringMembers.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No memberships expiring in the next 5 days</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">
              {expiringMembers.length} member{expiringMembers.length > 1 ? 's' : ''} 
              {expiringMembers.length > 1 ? ' have' : ' has'} membership{expiringMembers.length > 1 ? 's' : ''} expiring in 5 days:
            </p>
            {expiringMembers.map((member) => (
              <div key={member.member_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{member.member_name}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {member.member_phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {member.plan_name}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-red-700">
                    Expires: {formatDate(member.expiry_date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpiryNotifications;
