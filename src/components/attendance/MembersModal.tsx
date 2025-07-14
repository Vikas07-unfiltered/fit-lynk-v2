
import { Button } from '@/components/ui/button';

interface Member {
  id: string;
  name: string;
  user_id: string;
  status: string;
}

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
}

const MembersModal = ({ isOpen, onClose, members }: MembersModalProps) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: 24, borderRadius: 8, maxHeight: '80vh', overflowY: 'auto', minWidth: 350 }}>
        <h2 style={{ fontWeight: 600, marginBottom: 12 }}>Members List (debug)</h2>
        <table style={{ width: '100%', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Name</th>
              <th style={{ textAlign: 'left' }}>ID</th>
              <th style={{ textAlign: 'left' }}>User ID</th>
              <th style={{ textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} style={{ background: m.status !== 'active' ? '#ffeaea' : undefined }}>
                <td>{m.name}</td>
                <td>{m.id}</td>
                <td>{m.user_id}</td>
                <td>{m.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default MembersModal;
