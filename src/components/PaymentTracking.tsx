import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePayments } from '@/hooks/usePayments';
import { useMembers } from '@/hooks/useMembers';
import { Payment } from '@/types/payment';
import PaymentStats from './payment/PaymentStats';
import PaymentDialog from './payment/PaymentDialog';
import PaymentList from './payment/PaymentList';

const PaymentTracking = () => {
  const { payments, loading, addPayment } = usePayments();
  const { fetchMembers } = useMembers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleAddPayment = async (paymentData: any) => {
    const success = await addPayment(paymentData);
    if (success) {
      // Refresh member data after successful payment to update statuses and expiry dates
      console.log('Payment successful, refreshing member data...');
      await fetchMembers();
      
      // Small delay to ensure database trigger has processed
      setTimeout(async () => {
        await fetchMembers();
        console.log('Member data refreshed after payment');
      }, 1000);
    }
    return success;
  };

  const filteredPayments = payments.filter(payment =>
    payment.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.member_user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sendReminder = (payment: Payment) => {
    toast({
      title: "Reminder Sent",
      description: `Payment reminder sent to ${payment.member_name}`,
    });
  };

  return (
    <div className="space-y-4">
      <PaymentStats payments={payments} />

      <div className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} gap-4 items-start ${isMobile ? '' : 'sm:items-center'} justify-between`}>
        <div className={`relative flex-1 ${isMobile ? 'w-full' : 'max-w-md'}`}>
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${isMobile ? 'pl-12 h-12 text-base' : 'pl-10'}`}
          />
        </div>
        
        <PaymentDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddPayment={handleAddPayment}
        />
      </div>

      <PaymentList
        payments={filteredPayments}
        loading={loading}
        searchTerm={searchTerm}
        onSendReminder={sendReminder}
      />
    </div>
  );
};

export default PaymentTracking;