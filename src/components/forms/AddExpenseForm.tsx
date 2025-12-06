import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useSplitPayStore } from '@/store/splitpay-store';
import { ExpenseCategory, User } from '@/types/splitpay';
import { getCategoryIcon } from '@/lib/splitpay-utils';
import { toast } from '@/hooks/use-toast';

const categories: { value: ExpenseCategory; label: string }[] = [
  { value: 'food', label: 'Food & Drinks' },
  { value: 'transport', label: 'Transport' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
];

interface AddExpenseFormProps {
  groupId: string;
  members: User[];
  onSuccess?: () => void;
}

export function AddExpenseForm({ groupId, members, onSuccess }: AddExpenseFormProps) {
  const { currentUser, addExpense } = useSplitPayStore();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState(currentUser.id);
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    members.map((m) => m.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !amount || selectedMembers.length === 0) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const paidBy = members.find((m) => m.id === paidById);
    if (!paidBy) return;

    const splitAmong = members.filter((m) => selectedMembers.includes(m.id));

    addExpense({
      groupId,
      description: description.trim(),
      amount: parseFloat(amount),
      paidBy,
      splitAmong,
      splitType: 'equal',
      category,
    });

    toast({
      title: 'Expense added!',
      description: `₹${amount} added to the group`,
    });

    onSuccess?.();
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="What's this expense for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (₹)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="0.00"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Paid by</Label>
          <Select value={paidById} onValueChange={setPaidById}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.id === currentUser.id ? 'You' : member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <span className="flex items-center gap-2">
                    {getCategoryIcon(cat.value)} {cat.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Split among</Label>
        <div className="grid grid-cols-2 gap-2">
          {members.map((member) => (
            <label
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors"
            >
              <Checkbox
                checked={selectedMembers.includes(member.id)}
                onCheckedChange={() => toggleMember(member.id)}
              />
              <span className="text-sm font-medium">
                {member.id === currentUser.id ? 'You' : member.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {selectedMembers.length > 0 && amount && (
        <div className="p-4 rounded-xl bg-accent">
          <p className="text-sm text-muted-foreground">
            Split equally: <span className="font-semibold text-foreground">
              ₹{(parseFloat(amount) / selectedMembers.length).toFixed(2)}
            </span> per person
          </p>
        </div>
      )}

      <Button type="submit" variant="hero" className="w-full">
        Add Expense
      </Button>
    </form>
  );
}
