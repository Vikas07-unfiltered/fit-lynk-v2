import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Payment } from '@/types/payment';

interface PaymentStatsProps {
  payments: Payment[];
}

const PaymentStats = ({ payments }: PaymentStatsProps) => {
  const isMobile = useIsMobile();
  
  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0);
  const paymentRate = payments.length > 0 ? Math.round((payments.filter(p => p.status === 'completed').length / payments.length) * 100) : 0;

  return (
    <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-3 gap-4'}`}>
      <Card>
        <CardHeader className={`${isMobile ? 'pb-2 px-4 pt-3' : 'pb-2'}`}>
          <CardTitle className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Total Revenue</CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'px-4 pb-3' : ''}>
          <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>₹{totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-gray-500">This month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={`${isMobile ? 'pb-2 px-4 pt-3' : 'pb-2'}`}>
          <CardTitle className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Pending Payments</CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'px-4 pb-3' : ''}>
          <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-yellow-600`}>₹{pendingAmount.toFixed(2)}</div>
          <p className="text-xs text-gray-500">Awaiting collection</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={`${isMobile ? 'pb-2 px-4 pt-3' : 'pb-2'}`}>
          <CardTitle className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Payment Rate</CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'px-4 pb-3' : ''}>
          <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-blue-600`}>
            {paymentRate}%
          </div>
          <p className="text-xs text-gray-500">On-time payments</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentStats;