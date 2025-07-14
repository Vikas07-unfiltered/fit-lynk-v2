
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Member {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  plan: string;
  status: string;
}

interface QRCodeGeneratorProps {
  member: Member;
  isOpen: boolean;
  onClose: () => void;
}

const QRCodeGenerator = ({ member, isOpen, onClose }: QRCodeGeneratorProps) => {
  const qrData = JSON.stringify({
    id: member.user_id,
    name: member.name,
    plan: member.plan
  });

  // Generate a simple QR code representation using CSS
  const generateQRPattern = () => {
    const patterns = [];
    for (let i = 0; i < 100; i++) {
      patterns.push(
        <div
          key={i}
          className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
        />
      );
    }
    return patterns;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Member QR Code</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <p className="text-gray-600">{member.plan} Plan</p>
                <p className="text-emerald-600 font-semibold">ID: {member.user_id}</p>
              </div>
              
              {/* QR Code placeholder - in a real app, use a QR code library */}
              <div className="w-40 h-40 mx-auto border-2 border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 mb-4">
                <div className="grid grid-cols-10 gap-px w-32 h-32">
                  {generateQRPattern()}
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mb-4">
                Scan this QR code for attendance tracking
              </p>
              
              <div className="text-xs bg-gray-100 p-2 rounded font-mono break-all">
                Member ID: {member.user_id}
              </div>
            </CardContent>
          </Card>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              Download QR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeGenerator;
