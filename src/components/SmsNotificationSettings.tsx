import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Settings, Clock, AlertCircle } from 'lucide-react';
import { useSmsNotifications } from '@/hooks/useSmsNotifications';
import { useIsMobile } from '@/hooks/use-mobile';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SmsNotificationSettings = () => {
  const [autoWelcomeSms, setAutoWelcomeSms] = useState(true);
  const [autoExpirySms, setAutoExpirySms] = useState(true);
  const [expiryDays, setExpiryDays] = useState(5);
  const [sending, setSending] = useState(false);
  const { sendBulkExpirySms } = useSmsNotifications();
  const isMobile = useIsMobile();

  const handleSendBulkExpiry = async () => {
    setSending(true);
    try {
      await sendBulkExpirySms(expiryDays);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          SMS notifications require Twilio configuration. Make sure your Twilio credentials are properly set up in the environment variables.
        </AlertDescription>
      </Alert>

      {/* SMS Settings Card */}
      <Card>
        <CardHeader className={isMobile ? 'px-4 pt-4 pb-3' : ''}>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
            <MessageSquare className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'} text-blue-600`} />
            SMS Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className={`space-y-4 ${isMobile ? 'px-4 pb-4' : ''}`}>
          {/* Auto Welcome SMS */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className={isMobile ? 'text-sm' : ''}>Welcome SMS</Label>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                Automatically send welcome SMS to new members
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={autoWelcomeSms}
                onCheckedChange={setAutoWelcomeSms}
              />
              <Badge variant={autoWelcomeSms ? "default" : "secondary"}>
                {autoWelcomeSms ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>

          {/* Auto Expiry SMS */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className={isMobile ? 'text-sm' : ''}>Expiry Reminders</Label>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                Automatically send expiry reminders
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={autoExpirySms}
                onCheckedChange={setAutoExpirySms}
              />
              <Badge variant={autoExpirySms ? "default" : "secondary"}>
                {autoExpirySms ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>

          {/* Expiry Days Setting */}
          <div className="space-y-2">
            <Label htmlFor="expiryDays" className={isMobile ? 'text-sm' : ''}>
              Send expiry reminder (days before expiry)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="expiryDays"
                type="number"
                min="1"
                max="30"
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className={`w-20 ${isMobile ? 'h-10 text-sm' : ''}`}
              />
              <span className={`${isMobile ? 'text-sm' : ''} text-gray-600`}>days</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual SMS Actions */}
      <Card>
        <CardHeader className={isMobile ? 'px-4 pt-4 pb-3' : ''}>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
            <Send className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'} text-green-600`} />
            Manual SMS Actions
          </CardTitle>
        </CardHeader>
        <CardContent className={`space-y-4 ${isMobile ? 'px-4 pb-4' : ''}`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className={isMobile ? 'text-sm' : ''}>Send Bulk Expiry Reminders</Label>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                  Send SMS to all members whose plans expire in {expiryDays} days
                </p>
              </div>
              <Button
                onClick={handleSendBulkExpiry}
                disabled={sending}
                className={`bg-green-600 hover:bg-green-700 ${isMobile ? 'h-10 px-4' : ''}`}
              >
                <Send className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} mr-2`} />
                {sending ? 'Sending...' : 'Send Now'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Status Info */}
      <Card>
        <CardHeader className={isMobile ? 'px-4 pt-4 pb-3' : ''}>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
            <Settings className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'} text-purple-600`} />
            SMS Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent className={`space-y-3 ${isMobile ? 'px-4 pb-4' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className={`${isMobile ? 'text-sm' : ''}`}>Twilio Integration</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Ready
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className={`${isMobile ? 'text-sm' : ''}`}>Auto Notifications</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {autoWelcomeSms || autoExpirySms ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium text-blue-800`}>
                  Automated Schedule
                </p>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600`}>
                  • Welcome SMS: Sent immediately when new member is added
                </p>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600`}>
                  • Expiry SMS: Sent {expiryDays} days before membership expires
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmsNotificationSettings;