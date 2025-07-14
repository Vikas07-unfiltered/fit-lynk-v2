
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { MembershipPlan } from '@/types/plan';
import EditPlanDialog from './EditPlanDialog';

interface PlanCardProps {
  plan: MembershipPlan;
  onUpdatePlan: (planId: string, updates: any) => Promise<boolean>;
  onDeletePlan: (planId: string) => Promise<boolean>;
}

const PlanCard = ({ plan, onUpdatePlan, onDeletePlan }: PlanCardProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this plan?')) {
      await onDeletePlan(plan.id);
    }
  };

  const formatPrice = (price: number) => `₹${price.toLocaleString()}`;
  const formatDuration = (months: number) => 
    months === 1 ? '1 month' : `${months} months`;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Price:</span>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                {formatPrice(plan.price)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Duration:</span>
              <span className="text-sm font-medium">{formatDuration(plan.duration_months)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Per Month:</span>
              <span className="text-sm font-medium">
                {formatPrice(Math.round(plan.price / plan.duration_months))}
              </span>
            </div>
            {plan.description && (
              <div className="pt-2">
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditPlanDialog
        plan={plan}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onUpdatePlan={onUpdatePlan}
      />
    </>
  );
};

export default PlanCard;
