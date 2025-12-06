import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { GroupCard } from '@/components/dashboard/GroupCard';
import { ExpenseItem } from '@/components/dashboard/ExpenseItem';
import { SettlementCard } from '@/components/dashboard/SettlementCard';
import { useSplitPayStore } from '@/store/splitpay-store';
import { calculateBalances, calculateSettlements } from '@/lib/splitpay-utils';
import { Plus, ArrowRight, Receipt, Users } from 'lucide-react';

export default function Dashboard() {
  const { currentUser, groups, expenses } = useSplitPayStore();

  // Calculate overall balances
  const { totalOwed, totalOwe, settlements } = useMemo(() => {
    let totalOwed = 0;
    let totalOwe = 0;
    const allSettlements: ReturnType<typeof calculateSettlements> = [];

    groups.forEach((group) => {
      const groupExpenses = expenses.filter((e) => e.groupId === group.id);
      const balances = calculateBalances(groupExpenses, group.members);
      const userBalance = balances.find((b) => b.userId === currentUser.id);

      if (userBalance) {
        if (userBalance.amount > 0) {
          totalOwed += userBalance.amount;
        } else {
          totalOwe += Math.abs(userBalance.amount);
        }
      }

      allSettlements.push(...calculateSettlements(balances));
    });

    return {
      totalOwed,
      totalOwe,
      settlements: allSettlements.filter(
        (s) => s.from.id === currentUser.id || s.to.id === currentUser.id
      ),
    };
  }, [groups, expenses, currentUser.id]);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's your expense summary
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <BalanceCard type="owed" amount={totalOwed} label="You are owed" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <BalanceCard type="owe" amount={totalOwe} label="You owe" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <BalanceCard
              type="total"
              amount={totalOwed - totalOwe}
              label="Net balance"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          <Link to="/groups?create=true">
            <Button variant="hero" className="whitespace-nowrap">
              <Plus className="h-4 w-4" />
              New Group
            </Button>
          </Link>
          <Link to="/groups">
            <Button variant="outline" className="whitespace-nowrap">
              <Users className="h-4 w-4" />
              View Groups
            </Button>
          </Link>
          <Link to="/expenses">
            <Button variant="outline" className="whitespace-nowrap">
              <Receipt className="h-4 w-4" />
              All Expenses
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Groups */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Your Groups</h2>
              <Link to="/groups">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-card shadow-soft">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground mb-2">No groups yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a group to start splitting expenses
                </p>
                <Link to="/groups?create=true">
                  <Button variant="hero">
                    <Plus className="h-4 w-4" />
                    Create Group
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groups.slice(0, 4).map((group) => {
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

          {/* Recent Activity & Settlements */}
          <div className="space-y-6">
            {/* Settlements */}
            {settlements.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground">
                  Settle Up
                </h2>
                <div className="space-y-3">
                  {settlements.slice(0, 3).map((settlement, idx) => (
                    <SettlementCard
                      key={idx}
                      settlement={settlement}
                      currentUserId={currentUser.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Expenses */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  Recent Activity
                </h2>
                <Link to="/expenses">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View all <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {recentExpenses.length === 0 ? (
                <div className="text-center py-8 rounded-xl bg-card">
                  <Receipt className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No expenses yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentExpenses.map((expense) => (
                    <ExpenseItem
                      key={expense.id}
                      expense={expense}
                      currentUserId={currentUser.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
