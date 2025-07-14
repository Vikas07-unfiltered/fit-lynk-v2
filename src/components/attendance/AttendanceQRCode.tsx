
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QRCodeCanvas } from 'qrcode.react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AttendanceQRCodeProps {
  gymId?: string;
}

const AttendanceQRCode = ({ gymId }: AttendanceQRCodeProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="my-6">
      <Card>
        <CardHeader className={isMobile ? 'px-4 pt-4 pb-3' : ''}>
          <CardTitle className={isMobile ? 'text-base' : ''}>Scan to Mark Attendance</CardTitle>
        </CardHeader>
        <CardContent className={`flex flex-col items-center ${isMobile ? 'px-4 pb-4' : ''}`}>
          {gymId ? (
            <>
              <QRCodeCanvas 
                value={`${window.location.origin}/scan-attendance?gym_id=${gymId}`} 
                size={isMobile ? 160 : 200} 
              />
              <div className={`mt-3 text-center break-all ${isMobile ? 'text-xs px-2' : 'text-sm'}`}>
                {`${window.location.origin}/scan-attendance?gym_id=${gymId}`}
              </div>
            </>
          ) : (
            <div className="text-red-600">No gym selected. Please log in as a gym owner.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceQRCode;
