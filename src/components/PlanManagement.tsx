
import { Card } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { useMembershipPlans } from '@/hooks/useMembershipPlans';
import PlanCard from './plan/PlanCard';
import AddPlanDialog from './plan/AddPlanDialog';

const PlanManagement = () => {
  const { plans, loading, addPlan, updatePlan, deletePlan } = useMembershipPlans();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Membership Plans</h2>
          <p className="text-gray-600">Manage your gym's membership plans and pricing</p>
        </div>
        <AddPlanDialog onAddPlan={addPlan} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onUpdatePlan={updatePlan}
            onDeletePlan={deletePlan}
          />
        ))}
      </div>

      {plans.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No membership plans found</h3>
          <p className="text-gray-600">Create your first membership plan to get started.</p>
        </Card>
      )}
    </div>
  );
};

export default PlanManagement;
