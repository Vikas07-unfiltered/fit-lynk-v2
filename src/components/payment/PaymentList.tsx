import { Card } from '@/components/ui/card';
import { IndianRupee } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Payment } from '@/types/payment';
import PaymentCard from './PaymentCard';

interface PaymentListProps {
  payments: Payment[];
  loading: boolean;
  searchTerm: string;
  onSendReminder: (payment: Payment) => void;
}

const PaymentList = ({ payments, loading, searchTerm, onSendReminder }: PaymentListProps) => {
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg">Loading payments...</div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <Card className={`${isMobile ? 'p-6' : 'p-8'} text-center`}>
        <IndianRupee className={`${isMobile ? 'w-16 h-16' : 'w-12 h-12'} mx-auto text-gray-400 mb-4`} />
        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>No payments found</h3>
        <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
          {searchTerm ? 'No payments match your search criteria' : 'Record your first payment to get started'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <PaymentCard
          key={payment.id}
          payment={payment}
          onSendReminder={onSendReminder}
        />
      ))}
    </div>
  );
};

export default PaymentList;