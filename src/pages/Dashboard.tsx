import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(50);
      setTransactions((data as Transaction[]) || []);
      setLoading(false);
    };
    fetchData();

    const channel = supabase
      .channel('transactions-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${user.id}`,
      }, () => { fetchData(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= monthStart && d <= monthEnd;
  });

  const totalIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalExpenses = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(now, 29 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTx = transactions.filter((t) => t.date === dateStr);
    return {
      date: format(date, 'MMM dd'),
      income: dayTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
      expenses: dayTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  const recentTransactions = transactions.slice(0, 5);

  const stats = [
    { label: 'Balance', value: balance, icon: Wallet, color: 'text-primary', bgColor: 'bg-primary/10' },
    { label: 'Income', value: totalIncome, icon: ArrowUpRight, color: 'text-success', bgColor: 'bg-success/10' },
    { label: 'Expenses', value: totalExpenses, icon: ArrowDownRight, color: 'text-destructive', bgColor: 'bg-destructive/10' },
    { label: 'Savings Rate', value: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0, icon: TrendingUp, color: 'text-warning', bgColor: 'bg-warning/10', isStat: true },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-16 bg-muted rounded" /></CardContent>
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
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">{format(now, 'MMMM yyyy')} overview</p>
        </div>
        <Link to="/transactions">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Add Transaction</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} variants={fadeUp} initial="initial" animate="animate" transition={{ delay: i * 0.1 }}>
            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground font-medium">{stat.label}</span>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stat.isStat ? `${stat.value}%` : `₹${stat.value.toLocaleString('en-IN')}`}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <motion.div variants={fadeUp} initial="initial" animate="animate" transition={{ delay: 0.4 }} className="lg:col-span-3">
          <Card className="glass">
            <CardHeader><CardTitle className="text-lg">Cash Flow — Last 30 Days</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                    <Area type="monotone" dataKey="income" stroke="hsl(142, 71%, 45%)" fill="url(#incomeGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="expenses" stroke="hsl(0, 84%, 60%)" fill="url(#expenseGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} initial="initial" animate="animate" transition={{ delay: 0.5 }} className="lg:col-span-2">
          <Card className="glass h-full">
            <CardHeader><CardTitle className="text-lg">Recent Transactions</CardTitle></CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No transactions yet</p>
                  <Link to="/transactions">
                    <Button variant="outline" size="sm" className="mt-3 gap-1"><Plus className="h-3 w-3" /> Add first</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tx.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                          {tx.type === 'income' ? <ArrowUpRight className="h-4 w-4 text-success" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{tx.description || 'Untitled'}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(tx.date), 'MMM dd')}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold font-mono ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                        {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
