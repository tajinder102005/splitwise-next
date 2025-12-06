import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GroupCard } from '@/components/dashboard/GroupCard';
import { CreateGroupForm } from '@/components/forms/CreateGroupForm';
import { useSplitPayStore } from '@/store/splitpay-store';
import { calculateBalances } from '@/lib/splitpay-utils';
import { Plus, Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Groups() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(
    searchParams.get('create') === 'true'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser, groups, expenses } = useSplitPayStore();

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Groups</h1>
            <p className="text-muted-foreground">
              Manage your expense groups
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
              </DialogHeader>
              <CreateGroupForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Groups Grid */}
        {filteredGroups.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-card shadow-soft">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">
              {searchQuery ? 'No groups found' : 'No groups yet'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {searchQuery
                ? 'Try a different search term'
                : 'Create a group to start tracking shared expenses with friends'}
            </p>
            {!searchQuery && (
              <Button variant="hero" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Your First Group
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => {
              const groupExpenses = expenses.filter((e) => e.groupId === group.id);
              const balances = calculateBalances(groupExpenses, group.members);
              const userBalance = balances.find((b) => b.userId === currentUser.id);
              return (
                <GroupCard
                  key={group.id}
                  group={group}
                  balance={userBalance?.amount}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
