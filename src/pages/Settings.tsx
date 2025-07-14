import PlanManagement from '@/components/PlanManagement';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Membership Plans</h2>
        <PlanManagement />
      </div>
      {/* Add more settings sections here as needed */}
    </div>
  );
};

export default Settings;
