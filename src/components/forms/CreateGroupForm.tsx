import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSplitPayStore } from '@/store/splitpay-store';
import { User } from '@/types/splitpay';
import { generateId } from '@/lib/splitpay-utils';
import { toast } from '@/hooks/use-toast';
import { Plus, X } from 'lucide-react';

interface CreateGroupFormProps {
  onSuccess?: () => void;
}

export function CreateGroupForm({ onSuccess }: CreateGroupFormProps) {
  const { currentUser, addGroup } = useSplitPayStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberName, setMemberName] = useState('');
  const [members, setMembers] = useState<User[]>([currentUser]);

  const handleAddMember = () => {
    if (!memberName.trim()) return;

    const newMember: User = {
      id: generateId(),
      name: memberName.trim(),
      email: `${memberName.toLowerCase().replace(/\s/g, '')}@example.com`,
    };

    setMembers([...members, newMember]);
    setMemberName('');
  };

  const handleRemoveMember = (id: string) => {
    if (id === currentUser.id) return; // Can't remove yourself
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Group name required',
        description: 'Please enter a name for your group',
        variant: 'destructive',
      });
      return;
    }

    if (members.length < 2) {
      toast({
        title: 'Add more members',
        description: 'A group needs at least 2 members',
        variant: 'destructive',
      });
      return;
    }

    addGroup({
      name: name.trim(),
      description: description.trim() || undefined,
      members,
    });

    toast({
      title: 'Group created!',
      description: `${name} is ready to track expenses`,
    });

    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="group-name">Group Name</Label>
        <Input
          id="group-name"
          placeholder="e.g., Goa Trip 2024"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="What's this group for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-3">
        <Label>Members</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add member name"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddMember();
              }
            }}
          />
          <Button type="button" variant="outline" size="icon" onClick={handleAddMember}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground"
            >
              <span className="text-sm font-medium">
                {member.id === currentUser.id ? 'You' : member.name}
              </span>
              {member.id !== currentUser.id && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.id)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" variant="hero" className="w-full">
        Create Group
      </Button>
    </form>
  );
}
