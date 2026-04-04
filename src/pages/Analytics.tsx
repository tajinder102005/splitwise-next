import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

interface Transaction {
  type: 'income' | 'expense';
  amount: number;
  date: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(262, 83%, 58%)', 'hsl(0, 84%, 60%)', 'hsl(180, 60%, 45%)'];

export default function Analytics() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [txRes, catRes] = await Promise.all([
        supabase.from('transactions').select('type, amount, date, category_id').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id),
      ]);
      setTransactions((txRes.data as Transaction[]) || []);
      setCategories((catRes.data as Category[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthExpenses = transactions.filter(
    (t) => t.type === 'expense' && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd
  );

  const catSpending: Record<string, number> = {};
  monthExpenses.forEach((t) => {
    const key = t.category_id || 'uncategorized';
    catSpending[key] = (catSpending[key] || 0) + Number(t.amount);
  });

  const pieData = Object.entries(catSpending).map(([catId, amount]) => {
    const cat = categories.find((c) => c.id === catId);
    return { name: cat?.name || 'Uncategorized', value: amount };
  });

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const mStart = startOfMonth(month);
    const mEnd = endOfMonth(month);
    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= mStart && d <= mEnd;
    });
    return {
      month: format(month, 'MMM'),
      income: monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
      expenses: monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-64 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm">Insights into your spending patterns</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass">
            <CardHeader><CardTitle className="text-lg">Income vs Expenses</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                    <Bar dataKey="income" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass">
            <CardHeader><CardTitle className="text-lg">Spending by Category</CardTitle></CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">No expense data this month</div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              {pieData.length > 0 && (
                <div className="mt-4 space-y-2">
                  {pieData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-foreground">{item.name}</span>
                      </div>
                      <span className="font-mono text-muted-foreground">₹{item.value.toLocaleString('en-IN')}</span>
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
