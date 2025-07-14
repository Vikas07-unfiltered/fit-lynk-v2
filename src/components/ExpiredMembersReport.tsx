import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/date';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Calendar, Phone, User, Clock, RefreshCw, Plus } from 'lucide-react';
import { useExpiredMembers } from '@/hooks/useExpiredMembers';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';

const ExpiredMembersReport = () => {
  const { expiredMembers, loading, fetchExpiredMembers, extendMembership } = useExpiredMembers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [extensionMonths, setExtensionMonths] = useState('1');
  const [extending, setExtending] = useState(false);
  const isMobile = useIsMobile();

  const filteredMembers = expiredMembers.filter(member =>
    member.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.member_user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.member_phone.includes(searchTerm)
  );

  const handleExtendMembership = async () => {
    if (!selectedMember) return;
    
    setExtending(true);
    const success = await extendMembership(selectedMember.member_id, parseInt(extensionMonths));
    if (success) {
      setSelectedMember(null);
      setExtensionMonths('1');
    }
    setExtending(false);
  };

  const getDaysExpiredBadge = (daysExpired: number) => {
    if (daysExpired <= 7) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (daysExpired <= 30) {
      return 'bg-orange-100 text-orange-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Expired Memberships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading expired members...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Expired Memberships Report
              {expiredMembers.length > 0 && (
                <Badge variant="destructive">{expiredMembers.length}</Badge>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExpiredMembers}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {expiredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">No expired memberships found</p>
              <p className="text-sm text-gray-500">All members have active memberships</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search by name, ID, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-4"
                  />
                </div>
              </div>

              {/* Mobile View */}
              {isMobile ? (
                <div className="space-y-3">
                  {filteredMembers.map((member) => (
                    <Card key={member.member_id} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-base">{member.member_name}</h3>
                            <p className="text-sm text-gray-600">ID: {member.member_user_id}</p>
                          </div>
                          <Badge className={getDaysExpiredBadge(member.days_expired)}>
                            {member.days_expired} days ago
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Plan:</span>
                            <p className="font-medium">{member.plan_name}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Expired:</span>
                            <p className="font-medium">{formatDate(member.expiry_date)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Phone:</span>
                            <p className="font-medium">{member.member_phone}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Last Payment:</span>
                            <p className="font-medium">
                              {member.last_payment_date 
                                ? formatDate(member.last_payment_date)
                                : 'No payment'
                              }
                            </p>
                          </div>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => setSelectedMember(member)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Extend Membership
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Extend Membership</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="font-medium">{selectedMember?.member_name}</p>
                                <p className="text-sm text-gray-600">ID: {selectedMember?.member_user_id}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Extend by (months):
                                </label>
                                <Select value={extensionMonths} onValueChange={setExtensionMonths}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1 Month</SelectItem>
                                    <SelectItem value="2">2 Months</SelectItem>
                                    <SelectItem value="3">3 Months</SelectItem>
                                    <SelectItem value="6">6 Months</SelectItem>
                                    <SelectItem value="12">12 Months</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button 
                                onClick={handleExtendMembership}
                                disabled={extending}
                                className="w-full"
                              >
                                {extending ? 'Extending...' : 'Extend Membership'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Desktop Table View */
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Expired Date</TableHead>
                        <TableHead>Days Expired</TableHead>
                        <TableHead>Last Payment</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member.member_id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{member.member_name}</div>
                              <div className="text-sm text-gray-500">ID: {member.member_user_id}</div>
                            </div>
                          </TableCell>
                          <TableCell>{member.plan_name}</TableCell>
                          <TableCell>{formatDate(member.expiry_date)}</TableCell>
                          <TableCell>
                            <Badge className={getDaysExpiredBadge(member.days_expired)}>
                              {member.days_expired} days
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {member.last_payment_date 
                              ? formatDate(member.last_payment_date)
                              : 'No payment'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {member.member_phone}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedMember(member)}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Extend
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Extend Membership</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <p className="font-medium">{selectedMember?.member_name}</p>
                                    <p className="text-sm text-gray-600">ID: {selectedMember?.member_user_id}</p>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-2">
                                      Extend by (months):
                                    </label>
                                    <Select value={extensionMonths} onValueChange={setExtensionMonths}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="1">1 Month</SelectItem>
                                        <SelectItem value="2">2 Months</SelectItem>
                                        <SelectItem value="3">3 Months</SelectItem>
                                        <SelectItem value="6">6 Months</SelectItem>
                                        <SelectItem value="12">12 Months</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button 
                                    onClick={handleExtendMembership}
                                    disabled={extending}
                                    className="w-full"
                                  >
                                    {extending ? 'Extending...' : 'Extend Membership'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpiredMembersReport;