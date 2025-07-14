import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send } from 'lucide-react';
import { useSmsNotifications } from '@/hooks/useSmsNotifications';
import { useMembers } from '@/hooks/useMembers';

const TestSmsButton = () => {
  const [testPhone, setTestPhone] = useState('');
  const [sending, setSending] = useState(false);
  const { sendWelcomeSms } = useSmsNotifications();
  const { members } = useMembers();

  const handleTestSms = async () => {
    if (!testPhone.trim()) {
      alert('Please enter a phone number');
      return;
    }

    setSending(true);
    try {
      // Create a test member entry temporarily for SMS testing
      const testMember = {
        id: 'test-' + Date.now(),
        name: 'Test User',
        phone: testPhone,
        gym_id: 'test-gym',
        plan: 'Test Plan',
        plan_expiry_date: new Date().toISOString(),
        join_date: new Date().toISOString()
      };

      console.log('Testing SMS with test member:', testMember);
      
      // Call the SMS function directly
      const response = await fetch('/api/test-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'welcome',
          member: testMember
        })
      });

      if (response.ok) {
        alert('Test SMS sent successfully!');
      } else {
        const error = await response.text();
        alert('Failed to send test SMS: ' + error);
      }
    } catch (error) {
      console.error('Test SMS error:', error);
      alert('Error sending test SMS: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleTestWithExistingMember = async () => {
    if (members.length === 0) {
      alert('No members found. Add a member first.');
      return;
    }

    setSending(true);
    try {
      const firstMember = members[0];
      console.log('Testing SMS with existing member:', firstMember.id);
      await sendWelcomeSms(firstMember.id);
    } catch (error) {
      console.error('Test SMS error:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-dashed border-2 border-orange-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <MessageSquare className="w-5 h-5" />
          Test SMS Function
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="testPhone">Test Phone Number</Label>
          <Input
            id="testPhone"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="+919876543210"
            className="mt-1"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleTestSms}
            disabled={sending || !testPhone.trim()}
            className="flex-1"
            variant="outline"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Sending...' : 'Test SMS'}
          </Button>
          
          {members.length > 0 && (
            <Button
              onClick={handleTestWithExistingMember}
              disabled={sending}
              variant="outline"
            >
              Test with First Member
            </Button>
          )}
        </div>
        
        <p className="text-xs text-gray-500">
          This will test the SMS function with the provided phone number or the first member in your list.
        </p>
      </CardContent>
    </Card>
  );
};

export default TestSmsButton;