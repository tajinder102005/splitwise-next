import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Target, TrendingUp } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline: string | null;
}

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addFundsId, setAddFundsId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGoals = async () => {
    if (!user) return;
    const { data } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setGoals((data as Goal[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchGoals(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const { error } = await supabase.from('goals').insert({
      user_id: user.id,
      name: name.trim(),
      target_amount: parseFloat(targetAmount),
      deadline: deadline || null,
    });

    if (error) toast.error(error.message);
    else {
      toast.success('Goal created');
      setDialogOpen(false);
      setName('');
      setTargetAmount('');
      setDeadline('');
      fetchGoals();
    }
    setSubmitting(false);
  };

  const handleAddFunds = async (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const newAmount = Number(goal.saved_amount) + parseFloat(addAmount);
    const { error } = await supabase
      .from('goals')
      .update({ saved_amount: newAmount })
      .eq('id', goalId);

    if (error) toast.error(error.message);
    else {
      toast.success('Funds added!');
      setAddFundsId(null);
      setAddAmount('');
      fetchGoals();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Goals</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-28 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Savings Goals</h1>
          <p className="text-muted-foreground text-sm">Track progress toward your financial targets</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Goal</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Goal Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Emergency fund" required />
              </div>
              <div className="space-y-2">
                <Label>Target Amount (₹)</Label>
                <Input type="number" step="0.01" min="1" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="100000" required className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Deadline (optional)</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Goal'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-16 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No goals yet</p>
            <p className="text-sm text-muted-foreground mt-1">Set a savings target and track your progress</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal, i) => {
            const pct = Math.min(Math.round((Number(goal.saved_amount) / Number(goal.target_amount)) * 100), 100);
            const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground text-lg">{goal.name}</h3>
                      <span className="text-sm font-mono text-primary font-semibold">{pct}%</span>
                    </div>
                    {goal.deadline && (
                      <p className="text-xs text-muted-foreground mb-3">
                        {daysLeft !== null && daysLeft > 0
                          ? `${daysLeft} days left`
                          : daysLeft === 0
                            ? 'Due today'
                            : 'Overdue'}
                        {' · '}
                        {format(new Date(goal.deadline), 'MMM dd, yyyy')}
                      </p>
                    )}
                    <Progress value={pct} className="h-3 mb-3" />
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="text-muted-foreground">
                        ₹{Number(goal.saved_amount).toLocaleString('en-IN')} saved
                      </span>
                      <span className="text-muted-foreground">
                        ₹{Number(goal.target_amount).toLocaleString('en-IN')} target
                      </span>
                    </div>

                    {addFundsId === goal.id ? (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={addAmount}
                          onChange={(e) => setAddAmount(e.target.value)}
                          placeholder="Amount"
                          className="font-mono"
                        />
                        <Button size="sm" onClick={() => handleAddFunds(goal.id)}>Add</Button>
                        <Button size="sm" variant="outline" onClick={() => setAddFundsId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => setAddFundsId(goal.id)}
                      >
                        <TrendingUp className="h-3 w-3" /> Add Funds
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
