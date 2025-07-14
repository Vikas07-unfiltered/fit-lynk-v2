
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MemberSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const MemberSearch = ({ searchTerm, onSearchChange }: MemberSearchProps) => {
  const isMobile = useIsMobile();

  return (
    <div className={`relative flex-1 ${isMobile ? 'max-w-full' : 'max-w-md'}`}>
      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
      <Input
        placeholder={isMobile ? "Search members..." : "Search by name, phone, or member ID..."}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`pl-10 ${isMobile ? 'h-10 text-sm' : ''}`}
      />
    </div>
  );
};

export default MemberSearch;
