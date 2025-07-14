
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { TestTube } from 'lucide-react';

const TestDataGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { gym } = useAuth();

  const generateTestData = async () => {
    if (!gym?.id) {
      toast({
        title: "Error",
        description: "No gym selected",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Calculate date 5 days from now for expiry
      const fiveDaysFromNow = new Date();
      fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
      const expiryDate = fiveDaysFromNow.toISOString().split('T')[0];

      // Calculate join date based on 1-month plan (30 days ago + 5 days = expiry in 5 days)
      const joinDate = new Date();
      joinDate.setDate(joinDate.getDate() - 25); // 25 days ago so it expires in 5 days
      const joinDateStr = joinDate.toISOString().split('T')[0];

      const testMembers = [
        {
          gym_id: gym.id,
          user_id: '', // Will be auto-generated
          name: 'Test Member 1',
          phone: '+919876543210', // Test Indian phone number
          plan: 'Monthly Basic',
          status: 'active',
          join_date: joinDateStr,
          last_payment: joinDateStr,
          plan_expiry_date: expiryDate,
          expiry_notification_sent: false
        },
        {
          gym_id: gym.id,
          user_id: '', // Will be auto-generated
          name: 'Test Member 2',
          phone: '+919876543211', // Test Indian phone number
          plan: 'Monthly Premium',
          status: 'active',
          join_date: joinDateStr,
          last_payment: joinDateStr,
          plan_expiry_date: expiryDate,
          expiry_notification_sent: false
        }
      ];

      const { data, error } = await supabase
        .from('members')
        .insert(testMembers)
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${data.length} test members with memberships expiring in 5 days`,
      });

    } catch (error) {
      console.error('Error generating test data:', error);
      toast({
        title: "Error",
        description: "Failed to generate test data",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-dashed border-2 border-gray-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <TestTube className="w-5 h-5" />
          Test WhatsApp Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Generate test members with memberships expiring in 5 days to test the WhatsApp notification system.
          </p>
          <Button 
            onClick={generateTestData} 
            disabled={isGenerating}
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
          >
            {isGenerating ? 'Generating...' : 'Add Test Members'}
          </Button>
          <p className="text-xs text-gray-500">
            ⚠️ This will add members with test phone numbers. The WhatsApp messages will be sent to these test numbers.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestDataGenerator;
