import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { IndianRupee } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMembershipPlans } from '@/hooks/useMembershipPlans';
import { NewPayment } from '@/types/payment';
import MemberLookup from './MemberLookup';

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPayment: (payment: NewPayment) => Promise<boolean>;
}

const PaymentDialog = ({ isOpen, onOpenChange, onAddPayment }: PaymentDialogProps) => {
  const isMobile = useIsMobile();
  const { plans } = useMembershipPlans();
  const [selectedMember, setSelectedMember] = useState<{ id: string; user_id: string; name: string } | null>(null);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    method: '',
    planName: '',
    notes: '',
  });

  const handleAddPayment = async () => {
    if (!selectedMember || !newPayment.amount || !newPayment.method || !newPayment.planName) {
      return;
    }

    const paymentData: NewPayment = {
      member_id: selectedMember.id,
      member_user_id: selectedMember.user_id,
      member_name: selectedMember.name,
      amount: parseFloat(newPayment.amount),
      payment_date: newPayment.paymentDate,
      payment_method: newPayment.method,
      plan_name: newPayment.planName,
      notes: newPayment.notes || undefined,
    };

    const success = await onAddPayment(paymentData);
    if (success) {
      setNewPayment({ 
        amount: '', 
        paymentDate: new Date().toISOString().split('T')[0], 
        method: '', 
        planName: '', 
        notes: '' 
      });
      setSelectedMember(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className={`bg-emerald-600 hover:bg-emerald-700 ${isMobile ? 'w-full h-12' : ''}`}>
          <IndianRupee className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className={`${isMobile ? 'w-[95vw] max-w-none mx-auto' : 'sm:max-w-md'}`}>
        <DialogHeader>
          <DialogTitle className={isMobile ? 'text-lg' : ''}>Record New Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <MemberLookup
            selectedMember={selectedMember}
            onMemberSelect={setSelectedMember}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount" className={isMobile ? 'text-sm' : ''}>Amount Paid</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                placeholder="0.00"
                className={isMobile ? 'h-12 text-base mt-1' : 'mt-1'}
              />
            </div>
            
            <div>
              <Label htmlFor="paymentDate" className={isMobile ? 'text-sm' : ''}>Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={newPayment.paymentDate}
                onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
                className={isMobile ? 'h-12 text-base mt-1' : 'mt-1'}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="method" className={isMobile ? 'text-sm' : ''}>Payment Method</Label>
            <Select onValueChange={(value) => setNewPayment({ ...newPayment, method: value })}>
              <SelectTrigger className={isMobile ? 'h-12 text-base mt-1' : 'mt-1'}>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Card">Credit/Debit Card</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="UPI">UPI/Digital Wallet</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="planName" className={isMobile ? 'text-sm' : ''}>Membership Plan</Label>
            <Select onValueChange={(value) => setNewPayment({ ...newPayment, planName: value })}>
              <SelectTrigger className={isMobile ? 'h-12 text-base mt-1' : 'mt-1'}>
                <SelectValue placeholder="Select membership plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.name}>
                    {plan.name} - ₹{plan.price} ({plan.duration_months} month{plan.duration_months > 1 ? 's' : ''})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="notes" className={isMobile ? 'text-sm' : ''}>Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={newPayment.notes}
              onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
              placeholder="Additional notes about the payment..."
              className={isMobile ? 'text-base mt-1' : 'mt-1'}
              rows={3}
            />
          </div>
          
          <Button 
            onClick={handleAddPayment} 
            className={`w-full bg-emerald-600 hover:bg-emerald-700 ${isMobile ? 'h-12' : ''}`}
            disabled={!selectedMember}
          >
            Record Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;