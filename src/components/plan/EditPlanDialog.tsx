
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MembershipPlan, NewMembershipPlan } from '@/types/plan';

interface EditPlanDialogProps {
  plan: MembershipPlan;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePlan: (planId: string, updates: Partial<NewMembershipPlan>) => Promise<boolean>;
}

const EditPlanDialog = ({ plan, isOpen, onClose, onUpdatePlan }: EditPlanDialogProps) => {
  const [editPlan, setEditPlan] = useState<NewMembershipPlan>({
    name: plan.name,
    price: plan.price,
    duration_months: plan.duration_months,
    description: plan.description || '',
  });

  useEffect(() => {
    setEditPlan({
      name: plan.name,
      price: plan.price,
      duration_months: plan.duration_months,
      description: plan.description || '',
    });
  }, [plan]);

  const handleUpdatePlan = async () => {
    if (!editPlan.name || editPlan.price <= 0) {
      return;
    }

    const success = await onUpdatePlan(plan.id, editPlan);
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Membership Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-plan-name">Plan Name *</Label>
            <Input
              id="edit-plan-name"
              value={editPlan.name}
              onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })}
              placeholder="e.g., Basic, Premium, VIP"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-plan-price">Price (₹) *</Label>
            <Input
              id="edit-plan-price"
              type="number"
              value={editPlan.price}
              onChange={(e) => setEditPlan({ ...editPlan, price: Number(e.target.value) })}
              placeholder="2999"
            />
          </div>

          <div>
            <Label htmlFor="edit-plan-duration">Duration (Months) *</Label>
            <Select 
              value={editPlan.duration_months.toString()} 
              onValueChange={(value) => setEditPlan({ ...editPlan, duration_months: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Month</SelectItem>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-plan-description">Description</Label>
            <Input
              id="edit-plan-description"
              value={editPlan.description}
              onChange={(e) => setEditPlan({ ...editPlan, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUpdatePlan} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              Update Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlanDialog;
