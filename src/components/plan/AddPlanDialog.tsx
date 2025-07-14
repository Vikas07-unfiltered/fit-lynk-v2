
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { NewMembershipPlan } from '@/types/plan';

interface AddPlanDialogProps {
  onAddPlan: (plan: NewMembershipPlan) => Promise<boolean>;
}

const AddPlanDialog = ({ onAddPlan }: AddPlanDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newPlan, setNewPlan] = useState<NewMembershipPlan>({
    name: '',
    price: 0,
    duration_months: 1,
    description: '',
  });

  const handleAddPlan = async () => {
    if (!newPlan.name || newPlan.price <= 0) {
      return;
    }

    const success = await onAddPlan(newPlan);
    if (success) {
      setNewPlan({ name: '', price: 0, duration_months: 1, description: '' });
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Membership Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="plan-name">Plan Name *</Label>
            <Input
              id="plan-name"
              value={newPlan.name}
              onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
              placeholder="e.g., Basic, Premium, VIP"
            />
          </div>
          
          <div>
            <Label htmlFor="plan-price">Price (₹) *</Label>
            <Input
              id="plan-price"
              type="number"
              value={newPlan.price}
              onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
              placeholder="2999"
            />
          </div>

          <div>
            <Label htmlFor="plan-duration">Duration (Months) *</Label>
            <Select onValueChange={(value) => setNewPlan({ ...newPlan, duration_months: Number(value) })}>
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
            <Label htmlFor="plan-description">Description</Label>
            <Input
              id="plan-description"
              value={newPlan.description}
              onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          <Button onClick={handleAddPlan} className="w-full bg-emerald-600 hover:bg-emerald-700">
            Add Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlanDialog;
