
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { NewMember } from '@/types/member';
import { useMembershipPlans } from '@/hooks/useMembershipPlans';

interface AddMemberDialogProps {
  onAddMember: (member: NewMember) => Promise<false | any>;
}

const AddMemberDialog = ({ onAddMember }: AddMemberDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [joinDate, setJoinDate] = useState<Date>();
  const [firstPaymentDate, setFirstPaymentDate] = useState<Date>();
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [newMember, setNewMember] = useState<NewMember>({
    name: '',
    phone: '',
    plan: '',
  });

  const { plans, loading: plansLoading } = useMembershipPlans();

  const handleAddMember = async () => {
    const memberData = {
      ...newMember,
      join_date: joinDate ? format(joinDate, 'yyyy-MM-dd') : undefined,
      first_payment_date: firstPaymentDate ? format(firstPaymentDate, 'yyyy-MM-dd') : undefined,
      plan_expiry_date: expiryDate ? format(expiryDate, 'yyyy-MM-dd') : undefined,
    };

    const result = await onAddMember(memberData);
    if (result) {
      setNewMember({ name: '', phone: '', plan: '' });
      setJoinDate(undefined);
      setFirstPaymentDate(undefined);
      setExpiryDate(undefined);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              placeholder="Enter full name"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={newMember.phone}
              onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
              placeholder="+1234567890"
            />
          </div>

          <div>
            <Label htmlFor="join-date">Join Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !joinDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {joinDate ? format(joinDate, "PPP") : <span>Select join date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={joinDate}
                  onSelect={setJoinDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="first-payment">First Payment Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !firstPaymentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {firstPaymentDate ? format(firstPaymentDate, "PPP") : <span>Select payment date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={firstPaymentDate}
                  onSelect={setFirstPaymentDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="expiry-date">Membership Expiry Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiryDate ? format(expiryDate, "PPP") : <span>Select expiry date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiryDate}
                  onSelect={setExpiryDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="plan">Membership Plan *</Label>
            <Select onValueChange={(value) => setNewMember({ ...newMember, plan: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a membership plan" />
              </SelectTrigger>
              <SelectContent>
                {plansLoading ? (
                  <div className="p-2 text-sm text-gray-500">Loading plans...</div>
                ) : plans.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">No plans available. Please create a plan first.</div>
                ) : (
                  plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.name}>
                      {plan.name} - {plan.price.toLocaleString()}/{plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {plans.find(p => p.name === newMember.plan) && (
              <div className="mt-2 p-3 bg-emerald-50 rounded border text-sm">
                <div className="font-medium text-emerald-800">Plan Details:</div>
                <div className="text-emerald-700">
                  Duration: {plans.find(p => p.name === newMember.plan)?.duration_months} month{plans.find(p => p.name === newMember.plan)?.duration_months > 1 ? 's' : ''}
                </div>
                <div className="text-emerald-700">
                  Total Cost: {plans.find(p => p.name === newMember.plan)?.price.toLocaleString()}
                </div>
                <div className="text-emerald-700">
                  Per Month: {Math.round((plans.find(p => p.name === newMember.plan)?.price || 0) / (plans.find(p => p.name === newMember.plan)?.duration_months || 1)).toLocaleString()}
                </div>
                {plans.find(p => p.name === newMember.plan)?.description && (
                  <div className="text-emerald-700 mt-1">
                    {plans.find(p => p.name === newMember.plan)?.description}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button onClick={handleAddMember} className="w-full bg-emerald-600 hover:bg-emerald-700">
            Add Member
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberDialog;
