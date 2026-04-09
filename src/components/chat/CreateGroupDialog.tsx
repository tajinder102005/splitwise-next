import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onCreated: () => void;
}

export default function CreateGroupDialog({ onCreated }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setCreating(true);

    // Create group
    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name: name.trim(), created_by: user.id })
      .select('id')
      .single();

    if (error || !group) {
      toast.error('Failed to create group');
      setCreating(false);
      return;
    }

    // Add creator as admin
    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: user.id,
      role: 'admin',
    });

    toast.success('Group created!');
    setName('');
    setOpen(false);
    setCreating(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mb-2 gap-2">
          <Plus className="h-4 w-4" /> Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Create Group</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Group Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weekend Plans" />
          </div>
          <Button onClick={handleCreate} disabled={creating || !name.trim()} className="w-full">
            {creating ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
