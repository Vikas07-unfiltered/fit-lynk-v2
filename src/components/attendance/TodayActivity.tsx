
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, UserCheck, Clock, Calendar } from 'lucide-react';
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

interface TodayActivityProps {
  filteredRecords: AttendanceRecord[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onCheckOut: (recordId: string, memberId: string) => void;
}

const TodayActivity = ({ filteredRecords, searchTerm, setSearchTerm, onCheckOut }: TodayActivityProps) => {
  const isMobile = useIsMobile();

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Card>
      <CardHeader className={isMobile ? 'px-4 pt-4 pb-3' : ''}>
        <CardTitle className={isMobile ? 'text-base' : ''}>Today's Activity</CardTitle>
      </CardHeader>
      <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
        <div className="relative flex-1 max-w-md mb-4">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
          <Input
            placeholder={isMobile ? "Search members..." : "Search by name, phone, or member ID..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${isMobile ? 'pl-12 h-12 text-base' : 'pl-10'}`}
          />
        </div>

        <div className={`space-y-3 ${isMobile ? 'max-h-64' : 'max-h-80'} overflow-y-auto`}>
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 ${isMobile ? 'flex-col gap-3' : ''}`}
            >
              <div className={`flex items-center space-x-3 ${isMobile ? 'w-full' : ''}`}>
                <div className={`${isMobile ? 'w-10 h-10' : 'w-8 h-8'} bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full flex items-center justify-center`}>
                  <UserCheck className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-white`} />
                </div>
                <div className={isMobile ? 'flex-1' : ''}>
                  <p className={`font-medium ${isMobile ? 'text-base' : ''}`}>{record.memberName}</p>
                  <div className={`flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-xs'} text-gray-600 ${isMobile ? 'flex-wrap' : ''}`}>
                    <Clock className="w-3 h-3" />
                    <span>In: {record.checkInTime}</span>
                    {record.checkOutTime && (
                      <>
                        <span>• Out: {record.checkOutTime}</span>
                        <span>• {formatDuration(record.duration || 0)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className={`flex items-center gap-2 ${isMobile ? 'w-full justify-between' : ''}`}>
                {record.status === 'checked_out' ? (
                  <Badge className="bg-gray-100 text-gray-800">
                    Completed
                  </Badge>
                ) : (
                  <>
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                    <Button
                      size={isMobile ? "default" : "sm"}
                      variant="outline"
                      onClick={() => onCheckOut(record.id, record.member_id)}
                      className={isMobile ? 'flex-1' : ''}
                    >
                      Check Out
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <div className={`text-center ${isMobile ? 'py-6' : 'py-8'}`}>
            <Calendar className={`${isMobile ? 'w-16 h-16' : 'w-12 h-12'} mx-auto text-gray-400 mb-2`} />
            <p className={`text-gray-600 ${isMobile ? 'text-base' : ''}`}>No attendance records for today</p>
            <p className="text-sm text-gray-500">Check-ins will appear here when members arrive</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayActivity;
