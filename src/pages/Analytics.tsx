import { useMemo } from 'react';
import { useSplitPayStore } from '@/store/splitpay-store';
import { formatCurrency, getCategoryIcon, getCategoryColor } from '@/lib/splitpay-utils';
import { ExpenseCategory } from '@/types/splitpay';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = [
  'hsl(160, 84%, 39%)',
  'hsl(200, 70%, 50%)',
  'hsl(280, 65%, 55%)',
  'hsl(340, 70%, 55%)',
  'hsl(35, 90%, 55%)',
  'hsl(45, 85%, 50%)',
  'hsl(220, 60%, 50%)',
];

export default function Analytics() {
  const { expenses, groups } = useSplitPayStore();

  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    expenses.forEach((expense) => {
      categoryTotals[expense.category] =
        (categoryTotals[expense.category] || 0) + expense.amount;
    });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        displayName:
          category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' '),
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const groupData = useMemo(() => {
    return groups
      .map((group) => ({
        name: group.name,
        amount: group.totalExpenses,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [groups]);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const averageExpense = useMemo(
    () => (expenses.length > 0 ? totalExpenses / expenses.length : 0),
    [totalExpenses, expenses.length]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Insights into your spending patterns
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-6 rounded-2xl bg-card shadow-card">
            <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-card shadow-card">
            <p className="text-sm text-muted-foreground mb-1">Transactions</p>
            <p className="text-2xl font-bold text-foreground">{expenses.length}</p>
          </div>
          <div className="p-6 rounded-2xl bg-card shadow-card">
            <p className="text-sm text-muted-foreground mb-1">Groups</p>
            <p className="text-2xl font-bold text-foreground">{groups.length}</p>
          </div>
          <div className="p-6 rounded-2xl bg-card shadow-card">
            <p className="text-sm text-muted-foreground mb-1">Avg. Expense</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(averageExpense)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Breakdown */}
          <div className="p-6 rounded-2xl bg-card shadow-card">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Spending by Category
            </h2>

            {categoryData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No expense data available
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-3">
                  {categoryData.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span
                          className={cn(
                            'text-xl',
                            getCategoryColor(item.name as ExpenseCategory)
                          )}
                        >
                          {getCategoryIcon(item.name)}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {item.displayName}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Group Breakdown */}
          <div className="p-6 rounded-2xl bg-card shadow-card">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Spending by Group
            </h2>

            {groupData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No group data available
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groupData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="hsl(160, 84%, 39%)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Top Expenses */}
        <div className="mt-8 p-6 rounded-2xl bg-card shadow-card">
          <h2 className="text-lg font-semibold text-foreground mb-6">
            Largest Expenses
          </h2>

          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expenses to display
            </div>
          ) : (
            <div className="space-y-4">
              {[...expenses]
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5)
                .map((expense, index) => {
                  const group = groups.find((g) => g.id === expense.groupId);
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <span className="text-2xl font-bold text-muted-foreground w-8">
                        {index + 1}
                      </span>
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg text-lg',
                          getCategoryColor(expense.category)
                        )}
                      >
                        {getCategoryIcon(expense.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {expense.description}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {group?.name}
                        </p>
                      </div>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
