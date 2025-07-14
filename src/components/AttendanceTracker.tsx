
import { useState, useEffect } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import AttendanceStats from './attendance/AttendanceStats';
import QuickCheckIn from './attendance/QuickCheckIn';
import TodayActivity from './attendance/TodayActivity';
import MembersModal from './attendance/MembersModal';
import AttendanceQRCode from './attendance/AttendanceQRCode';

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

const AttendanceTracker = () => {
  const { gym } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [qrScanMode, setQrScanMode] = useState(false);
  const [manualMemberName, setManualMemberName] = useState('');
  const { members } = useMembers();
  const [showMembersModal, setShowMembersModal] = useState(false);
  const isMobile = useIsMobile();

  const todayRecords = attendanceRecords.filter(record => 
    record.date === new Date().toISOString().split('T')[0]
  );

  const filteredRecords = todayRecords.filter(record =>
    record.memberName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManualCheckIn = async () => {
    if (!manualMemberName.trim()) {
      toast({
        title: "Error",
        description: "Please enter member ID",
        variant: "destructive",
      });
      return;
    }

    console.log('Manual check-in input:', manualMemberName);
    console.log('Members:', members);
    
    const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
    const input = normalize(manualMemberName);
    const foundMember = members.find(m =>
      m.status === 'active' && (
        normalize(m.name) === input ||
        normalize(m.id) === input ||
        normalize(m.user_id) === input
      )
    );

    if (!foundMember) {
      toast({
        title: "Error",
        description: "Only active members can check in. Check the name, Member ID, or member status.",
        variant: "destructive",
      });
      setShowMembersModal(true);
      return;
    }

    try {
      // Check if member is already checked in
      const { data: existingRecord } = await supabase
        .from('attendance')
        .select('*')
        .eq('gym_id', gym?.id)
        .eq('member_id', foundMember.user_id)
        .eq('status', 'checked_in')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (existingRecord && existingRecord.length > 0) {
        toast({
          title: "Already Checked In",
          description: `${foundMember.name} is already checked in. Please check out first.`,
          variant: "destructive",
        });
        return;
      }

      // Insert check-in record
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          gym_id: gym?.id,
          member_id: foundMember.user_id,
          method: 'manual',
          status: 'checked_in',
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const newRecord: AttendanceRecord = {
        id: data.id,
        memberName: foundMember.name,
        member_id: foundMember.user_id,
        checkInTime: new Date(data.timestamp).toTimeString().slice(0, 5),
        date: new Date(data.timestamp).toISOString().split('T')[0],
        status: 'checked_in',
      };

      setAttendanceRecords([newRecord, ...attendanceRecords]);
      setManualMemberName('');
      
      toast({
        title: "Success",
        description: `${foundMember.name} checked in successfully`,
      });

    } catch (error: any) {
      console.error('Error during check-in:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check in member",
        variant: "destructive",
      });
    }
  };

  const handleCheckOut = async (recordId: string, memberId: string) => {
    try {
      // Update the attendance record with check-out time
      const { data, error } = await supabase
        .from('attendance')
        .update({
          check_out_time: new Date().toISOString(),
          status: 'checked_out'
        })
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setAttendanceRecords(records =>
        records.map(record => {
          if (record.id === recordId) {
            const checkOutTime = new Date().toTimeString().slice(0, 5);
            const checkInHour = parseInt(record.checkInTime.split(':')[0]);
            const checkInMinute = parseInt(record.checkInTime.split(':')[1]);
            const checkOutHour = parseInt(checkOutTime.split(':')[0]);
            const checkOutMinute = parseInt(checkOutTime.split(':')[1]);
            
            const duration = (checkOutHour * 60 + checkOutMinute) - (checkInHour * 60 + checkInMinute);
            
            return {
              ...record,
              checkOutTime,
              duration: Math.max(0, duration),
              status: 'checked_out' as const,
            };
          }
          return record;
        })
      );

      toast({
        title: "Success",
        description: "Member checked out successfully",
      });

    } catch (error: any) {
      console.error('Error during check-out:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check out member",
        variant: "destructive",
      });
    }
  };

  // Fetch attendance records from Supabase for the current gym
  const fetchAttendance = async () => {
    if (!gym?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('gym_id', gym.id)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;

      // Map Supabase attendance rows to AttendanceRecord for UI
      const mapped = await Promise.all((data || []).map(async (row: any) => {
        // Find member name from members list
        const member = members.find(m => m.user_id === row.member_id);
        const memberName = member ? member.name : row.member_id;

        return {
          id: row.id,
          memberName,
          member_id: row.member_id,
          checkInTime: row.timestamp ? new Date(row.timestamp).toTimeString().slice(0, 5) : '',
          checkOutTime: row.check_out_time ? new Date(row.check_out_time).toTimeString().slice(0, 5) : undefined,
          date: row.timestamp ? new Date(row.timestamp).toISOString().split('T')[0] : '',
          status: row.status || 'checked_in',
          duration: row.check_out_time && row.timestamp ? 
            Math.max(0, (new Date(row.check_out_time).getTime() - new Date(row.timestamp).getTime()) / (1000 * 60)) : undefined,
        };
      }));

      setAttendanceRecords(mapped);
      
      toast({
        title: "Refreshed!",
        description: "Attendance records loaded.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch attendance',
        variant: 'destructive',
      });
    }
  };

  // Fetch attendance on mount and when members change
  useEffect(() => {
    if (members.length > 0) {
      fetchAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gym?.id, members]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-2">
        <Button variant="outline" onClick={fetchAttendance}>
          Refresh
        </Button>
      </div>
      
      {/* Stats Cards */}
      <AttendanceStats todayRecords={todayRecords} />

      {/* Main Content */}
      <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-6'}`}>
        {/* Quick Check-in Card */}
        <QuickCheckIn
          gymId={gym?.id}
          qrScanMode={qrScanMode}
          setQrScanMode={setQrScanMode}
          manualMemberName={manualMemberName}
          setManualMemberName={setManualMemberName}
          onManualCheckIn={handleManualCheckIn}
          onShowMembersModal={() => setShowMembersModal(true)}
        />

        {/* Today's Activity Card */}
        <TodayActivity
          filteredRecords={filteredRecords}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onCheckOut={handleCheckOut}
        />
      </div>

      {/* QR Code for attendance marking */}
      <AttendanceQRCode gymId={gym?.id} />
      
      {/* Members Modal for debugging */}
      <MembersModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        members={members}
      />
    </div>
  );
}

export default AttendanceTracker;
