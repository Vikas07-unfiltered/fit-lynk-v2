import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  color: string;
}

const StatCard = ({ title, value, change, icon: Icon, color }: StatCardProps) => (
  <Card className="h-full animate-fade-in">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="flex items-center text-xs">
        {change > 0 ? (
          <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
        ) : change < 0 ? (
          <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
        ) : null}
        {change !== 0 && (
          <>
            <span className={change > 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(change)}%
            </span>
            <span className="text-gray-500 ml-1">from last period</span>
          </>
        )}
      </div>
    </CardContent>
  </Card>
);

export default StatCard;