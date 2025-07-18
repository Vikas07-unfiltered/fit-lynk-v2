import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { User } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { Member } from '@/types/member';
import MemberCard from './member/MemberCard';
import AddMemberDialog from './member/AddMemberDialog';
import MemberSearch from './member/MemberSearch';
import QRCodeGenerator from './QRCodeGenerator';
import { useSmsNotifications } from '@/hooks/useSmsNotifications';

const MemberManagement = () => {
  const { members, loading, addMember } = useMembers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const { sendWelcomeSms } = useSmsNotifications();

  const handleAddMember = async (memberData: any) => {
    console.log('Adding member with data:', memberData);
    
    const newMember = await addMember(memberData);
    
    if (newMember && newMember.id) {
      console.log('Member added successfully, sending welcome SMS to member ID:', newMember.id);
      
      // Send welcome SMS immediately after successful member creation
      try {
        await sendWelcomeSms(newMember.id);
        console.log('Welcome SMS sent successfully for member:', newMember.name);
      } catch (error) {
        console.error('Failed to send welcome SMS:', error);
      }
      
      return true;
    }
    
    return false;
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm) ||
    member.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <MemberSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <AddMemberDialog onAddMember={handleAddMember} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredMembers.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onShowQR={setSelectedMember}
          />
        ))}
      </div>

      {selectedMember && (
        <QRCodeGenerator
          member={selectedMember}
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {filteredMembers.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
          <p className="text-gray-600">Try adjusting your search or add new members.</p>
        </Card>
      )}
    </div>
  );
};

export default MemberManagement;