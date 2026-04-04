import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, PiggyBank, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Budget {
  id: string;
  category_id: string;
  amount_limit: number;
  month: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function Budgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spending, setSpending] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('📁');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentMonth = format(new Date(), 'yyyy-MM');

  const fetchData = async () => {
    if (!user) return;

    const [budgetRes, catRes, txRes] = await Promise.all([
      supabase.from('budgets').select('*').eq('user_id', user.id).eq('month', currentMonth),
      supabase.from('categories').select('*').eq('user_id', user.id),
      supabase.from('transactions').select('*').eq('user_id', user.id).eq('type', 'expense')
        .gte('date', `${currentMonth}-01`)
        .lte('date', `${currentMonth}-31`),
    ]);

    setBudgets((budgetRes.data as Budget[]) || []);
    setCategories((catRes.data as Category[]) || []);

    const spendMap: Record<string, number> = {};
    ((txRes.data || []) as { category_id: string | null; amount: number }[]).forEach((tx) => {
      if (tx.category_id) {
        spendMap[tx.category_id] = (spendMap[tx.category_id] || 0) + Number(tx.amount);
      }
    });
    setSpending(spendMap);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    // Create category first
    const { data: cat, error: catError } = await supabase
      .from('categories')
      .insert({ user_id: user.id, name: catName.trim(), icon: catIcon })
      .select()
      .single();

    if (catError) { toast.error(catError.message); setSubmitting(false); return; }

    const { error } = await supabase.from('budgets').insert({
      user_id: user.id,
      category_id: cat.id,
      amount_limit: parseFloat(budgetLimit),
      month: currentMonth,
    });

    if (error) toast.error(error.message);
    else {
      toast.success('Budget created');
      setDialogOpen(false);
      setCatName('');
      setBudgetLimit('');
      fetchData();
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Budgets</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-24 bg-muted rounded" /></CardContent>
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
          <h1 className="text-2xl font-bold text-foreground">Budgets</h1>
          <p className="text-muted-foreground text-sm">{format(new Date(), 'MMMM yyyy')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Budget</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Budget</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex gap-3">
                <div className="space-y-2 w-16">
                  <Label>Icon</Label>
                  <Input value={catIcon} onChange={(e) => setCatIcon(e.target.value)} className="text-center text-lg" maxLength={2} />
                </div>
                <div className="space-y-2 flex-1">
                  <Label>Category</Label>
                  <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Food, Transport" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Monthly Limit (₹)</Label>
                <Input type="number" step="0.01" min="1" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)} placeholder="5000" required className="font-mono" />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Budget'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-16 text-center">
            <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No budgets set</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first budget to start tracking spending</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget, i) => {
            const cat = categories.find((c) => c.id === budget.category_id);
            const spent = spending[budget.category_id] || 0;
            const pct = Math.min(Math.round((spent / Number(budget.amount_limit)) * 100), 100);
            const overBudget = spent > Number(budget.amount_limit);

            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat?.icon || '📁'}</span>
                        <span className="font-medium text-foreground">{cat?.name || 'Unknown'}</span>
                      </div>
                      {overBudget && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    <Progress value={pct} className="h-2 mb-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className={overBudget ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                        ₹{spent.toLocaleString('en-IN')} spent
                      </span>
                      <span className="text-muted-foreground">
                        ₹{Number(budget.amount_limit).toLocaleString('en-IN')} limit
                      </span>
                    </div>
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
