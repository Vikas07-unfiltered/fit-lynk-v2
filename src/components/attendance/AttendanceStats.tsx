
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface AttendanceRecord {
  id: string;
  memberName: string;
  member_id: string;
  checkInTime: string;
  checkOutTime?: string;
  date: string;
  duration?: number;
  status: 'checked_in' | 'checked_out';
}

interface AttendanceStatsProps {
  todayRecords: AttendanceRecord[];
}

const AttendanceStats = ({ todayRecords }: AttendanceStatsProps) => {
  const isMobile = useIsMobile();

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const todayStats = {
    totalCheckIns: todayRecords.length,
    currentlyInside: todayRecords.filter(r => r.status === 'checked_in').length,
    averageTime: todayRecords.filter(r => r.duration).reduce((sum, r) => sum + (r.duration || 0), 0) / 
                 todayRecords.filter(r => r.duration).length || 0,
  };

  return (
    <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-3 gap-4'}`}>
      <Card>
        <CardHeader className={`${isMobile ? 'pb-2 px-4 pt-3' : 'pb-2'}`}>
          <CardTitle className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Today's Check-ins</CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'px-4 pb-3' : ''}>
          <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-blue-600`}>{todayStats.totalCheckIns}</div>
          <p className="text-xs text-gray-500">Total members</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={`${isMobile ? 'pb-2 px-4 pt-3' : 'pb-2'}`}>
          <CardTitle className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Currently Inside</CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'px-4 pb-3' : ''}>
          <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>{todayStats.currentlyInside}</div>
          <p className="text-xs text-gray-500">Active members</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={`${isMobile ? 'pb-2 px-4 pt-3' : 'pb-2'}`}>
          <CardTitle className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Average Session</CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'px-4 pb-3' : ''}>
          <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-purple-600`}>
            {todayStats.averageTime ? formatDuration(Math.round(todayStats.averageTime)) : '0h 0m'}
          </div>
          <p className="text-xs text-gray-500">Duration</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceStats;
