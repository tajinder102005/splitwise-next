import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { ExpenseItem } from '@/components/dashboard/ExpenseItem';
import { SettlementCard } from '@/components/dashboard/SettlementCard';
import { AddExpenseForm } from '@/components/forms/AddExpenseForm';
import { useSplitPayStore } from '@/store/splitpay-store';
import {
  calculateBalances,
  calculateSettlements,
  formatCurrency,
  getInitials,
  getAvatarColor,
} from '@/lib/splitpay-utils';
import {
  Plus,
  ArrowLeft,
  Receipt,
  Users,
  BarChart3,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, getGroupById, getGroupExpenses, deleteGroup } =
    useSplitPayStore();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  const group = getGroupById(id || '');
  const expenses = getGroupExpenses(id || '');

  const { balances, settlements, userBalance } = useMemo(() => {
    if (!group) return { balances: [], settlements: [], userBalance: 0 };

    const balances = calculateBalances(expenses, group.members);
    const settlements = calculateSettlements(balances);
    const userBalanceData = balances.find((b) => b.userId === currentUser.id);

    return {
      balances,
      settlements,
      userBalance: userBalanceData?.amount || 0,
    };
  }, [group, expenses, currentUser.id]);

  const handleDeleteGroup = () => {
    if (!id) return;
    deleteGroup(id);
    toast({
      title: 'Group deleted',
      description: 'The group has been removed',
    });
    navigate('/groups');
  };

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Group not found
          </h1>
          <Link to="/groups">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Back to Groups
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/groups">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Groups
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-muted-foreground mb-3">{group.description}</p>
              )}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {group.members.slice(0, 4).map((member) => (
                    <div
                      key={member.id}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-xs font-semibold text-primary-foreground',
                        getAvatarColor(member.name)
                      )}
                      title={member.name}
                    >
                      {getInitials(member.name)}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {group.members.length} members
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero">
                    <Plus className="h-4 w-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Expense</DialogTitle>
                  </DialogHeader>
                  <AddExpenseForm
                    groupId={group.id}
                    members={group.members}
                    onSuccess={() => setIsAddExpenseOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete group?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{group.name}" and all its
                      expenses. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteGroup}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <BalanceCard
            type="total"
            amount={group.totalExpenses}
            label="Total Expenses"
          />
          <BalanceCard
            type={userBalance >= 0 ? 'owed' : 'owe'}
            amount={Math.abs(userBalance)}
            label={userBalance >= 0 ? 'You are owed' : 'You owe'}
          />
          <div className="rounded-2xl bg-card p-6 shadow-card">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Transactions
            </p>
            <p className="text-3xl font-bold text-foreground">{expenses.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:inline-grid">
            <TabsTrigger value="expenses" className="gap-2">
              <Receipt className="h-4 w-4" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="balances" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Balances
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            {sortedExpenses.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-card">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground mb-2">
                  No expenses yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your first expense to start tracking
                </p>
                <Button variant="hero" onClick={() => setIsAddExpenseOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Expense
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedExpenses.map((expense) => (
                  <ExpenseItem
                    key={expense.id}
                    expense={expense}
                    currentUserId={currentUser.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Balances Tab */}
          <TabsContent value="balances" className="space-y-6">
            {/* Member Balances */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Member Balances</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {balances.map((balance) => (
                  <div
                    key={balance.userId}
                    className="flex items-center justify-between p-4 rounded-xl bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground',
                          getAvatarColor(balance.userName)
                        )}
                      >
                        {getInitials(balance.userName)}
                      </div>
                      <span className="font-medium text-foreground">
                        {balance.userId === currentUser.id
                          ? 'You'
                          : balance.userName}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'font-semibold',
                        balance.amount > 0
                          ? 'text-success'
                          : balance.amount < 0
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      )}
                    >
                      {balance.amount >= 0 ? '+' : ''}
                      {formatCurrency(balance.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Settlements */}
            {settlements.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">
                  Suggested Settlements
                </h3>
                <div className="space-y-3">
                  {settlements.map((settlement, idx) => (
                    <SettlementCard
                      key={idx}
                      settlement={settlement}
                      currentUserId={currentUser.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card"
                >
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-primary-foreground',
                      getAvatarColor(member.name)
                    )}
                  >
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {member.id === currentUser.id ? 'You' : member.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
