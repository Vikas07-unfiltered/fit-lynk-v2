import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SmsNotificationSettings from '@/components/SmsNotificationSettings';
import AutoSmsNotifications from '@/components/AutoSmsNotifications';

const SmsSettings = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">SMS Notifications</h1>
          <p className="text-gray-600">Configure and manage SMS notifications for your gym members</p>
        </div>
        
        {/* Auto SMS Notifications Status */}
        <AutoSmsNotifications />
        
        {/* SMS Settings */}
        <SmsNotificationSettings />
      </div>
    </div>
  );
};

export default SmsSettings;