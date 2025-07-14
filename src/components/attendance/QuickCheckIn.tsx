
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRCodeCanvas } from 'qrcode.react';
import { UserCheck } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface QuickCheckInProps {
  gymId?: string;
  qrScanMode: boolean;
  setQrScanMode: (mode: boolean) => void;
  manualMemberName: string;
  setManualMemberName: (name: string) => void;
  onManualCheckIn: () => void;
  onShowMembersModal: () => void;
}

const QuickCheckIn = ({
  gymId,
  qrScanMode,
  setQrScanMode,
  manualMemberName,
  setManualMemberName,
  onManualCheckIn,
  onShowMembersModal
}: QuickCheckInProps) => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className={isMobile ? 'px-4 pt-4 pb-3' : ''}>
        <CardTitle className={isMobile ? 'text-base' : ''}>Quick Check-in</CardTitle>
      </CardHeader>
      <CardContent className={`space-y-4 ${isMobile ? 'px-4 pb-4' : ''}`}>
        {/* QR code for public scan link */}
        {gymId && (
          <div className="flex flex-col items-center mb-2">
            <QRCodeCanvas value={`${window.location.origin}/scan-attendance?gym_id=${gymId}`} size={140} />
            <div className="text-xs text-gray-500 mt-1">Scan to check in/out</div>
          </div>
        )}
        
        <div className="space-y-3">
          <Button
            onClick={() => setQrScanMode(!qrScanMode)}
            className={`w-full bg-blue-600 hover:bg-blue-700 ${isMobile ? 'h-12' : ''}`}
          >
            <UserCheck className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
            {qrScanMode ? 'Stop QR Scan' : 'Scan QR Code'}
          </Button>

          {qrScanMode && (
            <div className={`p-4 border-2 border-dashed border-blue-300 rounded-lg text-center ${isMobile ? 'py-6' : ''}`}>
              <div className={`${isMobile ? 'w-20 h-20' : 'w-16 h-16'} mx-auto bg-blue-100 rounded-lg flex items-center justify-center mb-2`}>
                <UserCheck className={`${isMobile ? 'w-10 h-10' : 'w-8 h-8'} text-blue-600`} />
              </div>
              <p className={`${isMobile ? 'text-base' : 'text-sm'} text-gray-600`}>QR Scanner Active</p>
              <p className="text-xs text-gray-500">Point camera at member's QR code</p>
            </div>
          )}

          <div className="relative">
            <span className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 text-center text-xs text-gray-500 bg-white px-2">
              OR
            </span>
            <hr className="border-gray-300" />
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Enter member ID"
              value={manualMemberName}
              onChange={(e) => setManualMemberName(e.target.value)}
              className={isMobile ? 'h-12 text-base' : ''}
            />
            <div className="flex gap-2">
              <Button
                onClick={onManualCheckIn}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Manual Check-in
              </Button>
              <Button
                variant="outline"
                onClick={onShowMembersModal}
                className="whitespace-nowrap"
              >
                Show Members
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickCheckIn;
