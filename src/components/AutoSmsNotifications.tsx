import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/date';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useSmsNotifications } from '@/hooks/useSmsNotifications';

interface ExpiringMember {
  member_id: string;
  member_name: string;
  member_phone: string;
  gym_id: string;
  plan_name: string;
  expiry_date: string;
}

const AutoSmsNotifications = () => {
  const [expiringMembers, setExpiringMembers] = useState<ExpiringMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [autoSmsEnabled, setAutoSmsEnabled] = useState(true);
  const { gym } = useAuth();
  const { sendBulkExpirySms } = useSmsNotifications();

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

  const sendSmsNotifications = async () => {
    setSending(true);
    await sendBulkExpirySms(5);
    setSending(false);
    // Refresh the list after sending
    fetchExpiringMembers();
  };

  useEffect(() => {
    fetchExpiringMembers();
  }, [gym?.id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            SMS Notifications
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
            <MessageSquare className="w-5 h-5" />
            SMS Notifications
            {expiringMembers.length > 0 && (
              <Badge variant="destructive">{expiringMembers.length}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-sms" className="text-sm">Auto SMS</Label>
              <Switch
                id="auto-sms"
                checked={autoSmsEnabled}
                onCheckedChange={setAutoSmsEnabled}
              />
            </div>
            {expiringMembers.length > 0 && (
              <Button 
                onClick={sendSmsNotifications} 
                disabled={sending}
                size="sm"
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send SMS Reminders'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {expiringMembers.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No memberships expiring in the next 5 days</p>
            <p className="text-sm">SMS reminders will appear here when needed</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-gray-600">
                {expiringMembers.length} member{expiringMembers.length > 1 ? 's' : ''} 
                {expiringMembers.length > 1 ? ' have' : ' has'} membership{expiringMembers.length > 1 ? 's' : ''} expiring in 5 days:
              </p>
            </div>
            {expiringMembers.map((member) => (
              <div key={member.member_id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{member.member_name}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {member.member_phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {member.plan_name}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-orange-700">
                    Expires: {formatDate(member.expiry_date)}
                  </div>
                  <Badge variant="outline" className="bg-orange-100 text-orange-700 text-xs">
                    SMS Ready
                  </Badge>
                </div>
              </div>
            ))}
            
            {autoSmsEnabled && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-green-700 font-medium">
                    Auto SMS is enabled - These members will receive automatic reminders
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoSmsNotifications;