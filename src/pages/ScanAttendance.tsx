
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

const supabase = createClient(
  'https://ahuwcoocemayyphdrmjz.supabase.co',
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFodXdjb29jZW1heXlwaGRybWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDQ4NzIsImV4cCI6MjA2NjI4MDg3Mn0.vE-fSJMD91TZicpK6eLyHZi7tprfh4hVi_wjRolj_2w"
);

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ScanAttendance: React.FC = () => {
  const query = useQuery();
  const gymId = query.get('gym_id') || '';
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [memberStatus, setMemberStatus] = useState<'checked_in' | 'checked_out' | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberFound, setMemberFound] = useState(false);
  const isMobile = useIsMobile();

  // Check member status when memberId changes
  useEffect(() => {
    const checkMemberStatus = async () => {
      if (!gymId || !memberId.trim()) {
        setMemberStatus(null);
        setMemberName('');
        setMemberFound(false);
        setError('');
        return;
      }

      try {
        console.log('Checking member:', memberId.trim(), 'for gym:', gymId);
        
        // Get member details - search by user_id (the member ID field)
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('name, user_id, id')
          .eq('gym_id', gymId)
          .eq('status', 'active')
          .eq('user_id', memberId.trim())
          .single();

        console.log('Member lookup result:', memberData, memberError);

        if (memberError || !memberData) {
          setMemberStatus(null);
          setMemberName('');
          setMemberFound(false);
          return;
        }

        setMemberName(memberData.name);
        setMemberFound(true);

        // Check current attendance status using the member's user_id
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('status')
          .eq('gym_id', gymId)
          .eq('member_id', memberData.user_id)
          .eq('status', 'checked_in')
          .order('timestamp', { ascending: false })
          .limit(1);

        console.log('Attendance check:', attendanceData, attendanceError);

        if (attendanceData && attendanceData.length > 0) {
          setMemberStatus('checked_in');
        } else {
          setMemberStatus('checked_out');
        }
      } catch (err) {
        console.error('Error checking member status:', err);
        setMemberStatus(null);
        setMemberName('');
        setMemberFound(false);
      }
    };

    const timeoutId = setTimeout(checkMemberStatus, 300);
    return () => clearTimeout(timeoutId);
  }, [gymId, memberId]);

  const handleCheckIn = async () => {
    setLoading(true);
    setSuccess('');
    setError('');

    if (!gymId || !memberId.trim()) {
      setError('Please provide both Gym ID and Member ID.');
      setLoading(false);
      return;
    }

    try {
      // Get member details - search by user_id (the member ID field)
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, name, user_id')
        .eq('gym_id', gymId)
        .eq('status', 'active')
        .eq('user_id', memberId.trim())
        .single();

      if (memberError || !memberData) {
        setError('Member ID not found or inactive. Please enter a valid Member ID.');
        setLoading(false);
        return;
      }

      // Check if already checked in using the member's user_id
      const { data: existingRecord } = await supabase
        .from('attendance')
        .select('*')
        .eq('gym_id', gymId)
        .eq('member_id', memberData.user_id)
        .eq('status', 'checked_in')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (existingRecord && existingRecord.length > 0) {
        setError('You are already checked in. Please check out first.');
        setLoading(false);
        return;
      }

      // Insert check-in record using the member's user_id
      const { error: insertError } = await supabase.from('attendance').insert([
        {
          gym_id: gymId,
          member_id: memberData.user_id,
          method: 'qr_scan',
          status: 'checked_in',
          timestamp: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        setError('Failed to record check-in: ' + insertError.message);
      } else {
        setSuccess(`Welcome ${memberData.name}! You have been checked in successfully.`);
        setMemberStatus('checked_in');
        setMemberId('');
      }
    } catch (err: any) {
      setError('Failed to process check-in: ' + (err.message || 'Unknown error'));
    }

    setLoading(false);
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setSuccess('');
    setError('');

    if (!gymId || !memberId.trim()) {
      setError('Please provide both Gym ID and Member ID.');
      setLoading(false);
      return;
    }

    try {
      // Get member details first - search by user_id (the member ID field)
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, name, user_id')
        .eq('gym_id', gymId)
        .eq('status', 'active')
        .eq('user_id', memberId.trim())
        .single();

      if (memberError || !memberData) {
        setError('Member ID not found or inactive. Please enter a valid Member ID.');
        setLoading(false);
        return;
      }

      // Find the active check-in record using member's user_id
      const { data: activeRecord, error: findError } = await supabase
        .from('attendance')
        .select('*')
        .eq('gym_id', gymId)
        .eq('member_id', memberData.user_id)
        .eq('status', 'checked_in')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (findError || !activeRecord || activeRecord.length === 0) {
        setError('No active check-in found. Please check in first.');
        setLoading(false);
        return;
      }

      // Update record with check-out time
      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          check_out_time: new Date().toISOString(),
          status: 'checked_out'
        })
        .eq('id', activeRecord[0].id);

      if (updateError) {
        setError('Failed to record check-out: ' + updateError.message);
      } else {
        setSuccess(`Goodbye ${memberData.name}! You have been checked out successfully.`);
        setMemberStatus('checked_out');
        setMemberId('');
      }
    } catch (err: any) {
      setError('Failed to process check-out: ' + (err.message || 'Unknown error'));
    }

    setLoading(false);
  };

  const getActionButton = () => {
    if (!memberId.trim()) {
      return (
        <Button 
          disabled
          className={`w-full ${isMobile ? 'h-12 text-base' : ''}`}
        >
          Enter Member ID
        </Button>
      );
    }

    if (!memberFound) {
      return (
        <Button 
          disabled
          className={`w-full bg-gray-400 ${isMobile ? 'h-12 text-base' : ''}`}
        >
          Member Not Found
        </Button>
      );
    }

    if (memberStatus === 'checked_in') {
      return (
        <Button 
          onClick={handleCheckOut}
          disabled={loading}
          className={`w-full bg-red-600 hover:bg-red-700 ${isMobile ? 'h-12 text-base' : ''}`}
        >
          {loading ? 'Checking Out...' : 'Check Out'}
        </Button>
      );
    } else {
      return (
        <Button 
          onClick={handleCheckIn}
          disabled={loading}
          className={`w-full bg-green-600 hover:bg-green-700 ${isMobile ? 'h-12 text-base' : ''}`}
        >
          {loading ? 'Checking In...' : 'Check In'}
        </Button>
      );
    }
  };

  return (
    <div className={`flex justify-center items-center min-h-screen bg-gray-50 ${isMobile ? 'px-4' : ''}`}>
      <Card className={`w-full ${isMobile ? 'max-w-sm' : 'max-w-md'}`}>
        <CardHeader className={isMobile ? 'pb-4' : ''}>
          <CardTitle className={`${isMobile ? 'text-lg text-center' : ''}`}>
            Mark Your Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="memberId" className={`block mb-2 font-medium ${isMobile ? 'text-sm' : ''}`}>
                Member ID
              </label>
              <Input
                id="memberId"
                type="text"
                value={memberId}
                onChange={e => setMemberId(e.target.value)}
                placeholder="Enter your Member ID"
                className={isMobile ? 'h-12 text-base' : ''}
              />
              {memberName && memberFound && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">
                    {memberName}
                  </Badge>
                  {memberStatus && (
                    <Badge 
                      className={memberStatus === 'checked_in' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {memberStatus === 'checked_in' ? 'Currently Inside' : 'Not Inside'}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            {getActionButton()}
            
            {success && (
              <div className={`text-green-600 mt-2 p-3 bg-green-50 rounded ${isMobile ? 'text-sm' : ''}`}>
                {success}
              </div>
            )}
            {error && (
              <div className={`text-red-600 mt-2 p-3 bg-red-50 rounded ${isMobile ? 'text-sm' : ''}`}>
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScanAttendance;
