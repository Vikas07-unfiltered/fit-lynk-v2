import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, Bell } from 'lucide-react';
import { formatDate } from '@/utils/date';
import { useIsMobile } from '@/hooks/use-mobile';
import { Payment } from '@/types/payment';

interface PaymentCardProps {
  payment: Payment;
  onSendReminder: (payment: Payment) => void;
}

const PaymentCard = ({ payment, onSendReminder }: PaymentCardProps) => {
  const isMobile = useIsMobile();

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return variants[status as keyof typeof variants] || '';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className={`${isMobile ? 'p-4' : 'p-4'}`}>
        <div className={`flex items-center justify-between ${isMobile ? 'flex-col gap-4' : ''}`}>
          <div className={`flex-1 ${isMobile ? 'w-full' : ''}`}>
            <div className={`flex items-center gap-3 mb-3 ${isMobile ? 'mb-2' : ''}`}>
              <div className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'} bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center`}>
                <IndianRupee className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-white`} />
              </div>
              <div>
                <h3 className={`font-semibold ${isMobile ? 'text-base' : ''}`}>{payment.member_name}</h3>
                <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-gray-600`}>{payment.plan_name} Plan • ID: {payment.member_user_id}</p>
              </div>
            </div>
            
            <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-4 gap-4'} ${isMobile ? 'text-sm' : 'text-sm'}`}>
              <div>
                <span className="font-medium">Amount:</span>
                <p className={`text-green-600 font-bold ${isMobile ? 'text-base' : ''}`}>₹{Number(payment.amount).toFixed(2)}</p>
              </div>
              <div>
                <span className="font-medium">Date:</span>
                <p>{formatDate(payment.payment_date)}</p>
              </div>
              <div>
                <span className="font-medium">Method:</span>
                <p>{payment.payment_method}</p>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <Badge className={getStatusBadge(payment.status)}>
                  {payment.status}
                </Badge>
              </div>
            </div>
          </div>
          
          {payment.notes && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
              <span className="font-medium">Notes:</span> {payment.notes}
            </div>
          )}
          
          {payment.status === 'pending' && (
            <Button
              size={isMobile ? "default" : "sm"}
              variant="outline"
              onClick={() => onSendReminder(payment)}
              className={`${isMobile ? 'w-full' : 'ml-4'}`}
            >
              <Bell className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} mr-1`} />
              Send Reminder
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentCard;