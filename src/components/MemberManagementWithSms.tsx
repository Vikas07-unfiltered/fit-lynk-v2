import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { User } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { Member } from '@/types/member';
import MemberCardWithSms from './member/MemberCardWithSms';
import AddMemberDialog from './member/AddMemberDialog';
import MemberSearch from './member/MemberSearch';
import QRCodeGenerator from './QRCodeGenerator';
import { useAutoSms } from '@/hooks/useAutoSms';

const MemberManagementWithSms = () => {
  const { members, loading, addMember } = useMembers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Enable automatic SMS notifications
  useAutoSms();

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
        <AddMemberDialog onAddMember={addMember} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <MemberCardWithSms
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

export default MemberManagementWithSms;