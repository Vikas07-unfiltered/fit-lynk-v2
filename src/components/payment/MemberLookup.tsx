import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Member } from '@/types/member';
import { useMembers } from '@/hooks/useMembers';

interface MemberLookupProps {
  selectedMember: { id: string; user_id: string; name: string } | null;
  onMemberSelect: (member: { id: string; user_id: string; name: string } | null) => void;
}

const MemberLookup = ({ selectedMember, onMemberSelect }: MemberLookupProps) => {
  const { members } = useMembers();
  const [memberIdInput, setMemberIdInput] = useState('');
  const [memberNameInput, setMemberNameInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);

  // Update input fields when selectedMember changes
  useEffect(() => {
    if (selectedMember) {
      setMemberIdInput(selectedMember.user_id);
      setMemberNameInput(selectedMember.name);
    } else {
      setMemberIdInput('');
      setMemberNameInput('');
    }
  }, [selectedMember]);

  // Handle Member ID input
  const handleMemberIdChange = (value: string) => {
    setMemberIdInput(value);
    
    if (value.trim()) {
      const member = members.find(m => m.user_id.toLowerCase() === value.toLowerCase());
      if (member) {
        onMemberSelect({
          id: member.id,
          user_id: member.user_id,
          name: member.name
        });
      } else {
        onMemberSelect(null);
        setMemberNameInput('');
      }
    } else {
      onMemberSelect(null);
      setMemberNameInput('');
    }
  };

  // Handle Member Name input and filtering
  const handleMemberNameChange = (value: string) => {
    setMemberNameInput(value);
    
    if (value.trim()) {
      const filtered = members.filter(member =>
        member.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredMembers(filtered);
      
      // If exact match found, select it
      const exactMatch = filtered.find(m => m.name.toLowerCase() === value.toLowerCase());
      if (exactMatch) {
        onMemberSelect({
          id: exactMatch.id,
          user_id: exactMatch.user_id,
          name: exactMatch.name
        });
      } else {
        onMemberSelect(null);
        setMemberIdInput('');
      }
    } else {
      setFilteredMembers([]);
      onMemberSelect(null);
      setMemberIdInput('');
    }
  };

  // Handle member selection from dropdown
  const handleMemberSelect = (member: Member) => {
    onMemberSelect({
      id: member.id,
      user_id: member.user_id,
      name: member.name
    });
    setIsDropdownOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="memberId">Member ID</Label>
          <Input
            id="memberId"
            value={memberIdInput}
            onChange={(e) => handleMemberIdChange(e.target.value)}
            placeholder="Enter member ID (e.g. GM0001)"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="memberName">Member Name</Label>
          <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isDropdownOpen}
                className="w-full justify-between mt-1"
              >
                <Input
                  value={memberNameInput}
                  onChange={(e) => handleMemberNameChange(e.target.value)}
                  placeholder="Enter member name"
                  className="border-0 p-0 h-auto shadow-none focus-visible:ring-0"
                  onFocus={() => setIsDropdownOpen(true)}
                />
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search members..." />
                <CommandList>
                  <CommandEmpty>No members found.</CommandEmpty>
                  <CommandGroup>
                    {filteredMembers.map((member) => (
                      <CommandItem
                        key={member.id}
                        value={member.name}
                        onSelect={() => handleMemberSelect(member)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <User className="h-4 w-4" />
                          <div className="flex-1">
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">ID: {member.user_id}</div>
                          </div>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedMember?.id === member.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {selectedMember && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center gap-2 text-green-800">
            <Check className="h-4 w-4" />
            <span className="font-medium">Selected: {selectedMember.name} (ID: {selectedMember.user_id})</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberLookup;