import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  color: string;
}

const StatCard = ({ title, value, change, icon: Icon, color }: StatCardProps) => {
  const isMobile = useIsMobile();
  
  return (
    <Card className={`h-full animate-fade-in ${isMobile ? 'border shadow-sm' : ''}`}>
      <CardHeader className={`${isMobile ? 'pb-1 px-2.5 pt-2.5' : 'pb-2'}`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>
            {isMobile ? title.split(' ')[0] : title}
          </CardTitle>
          <Icon className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ${color}`} />
        </div>
      </CardHeader>
      <CardContent className={`pt-0 ${isMobile ? 'px-2.5 pb-2.5' : ''}`}>
        <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold mb-1`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {change !== 0 && (
          <div className={`flex items-center ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
            {change > 0 ? (
              <TrendingUp className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-green-600 mr-1`} />
            ) : change < 0 ? (
              <TrendingDown className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-red-600 mr-1`} />
            ) : null}
            <span className={change > 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(change).toFixed(1)}%
            </span>
            {!isMobile && <span className="text-gray-500 ml-1">from last period</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;