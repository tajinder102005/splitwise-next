import { Expense } from '@/types/splitpay';
import { formatCurrency, getCategoryIcon, getCategoryColor } from '@/lib/splitpay-utils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ExpenseItemProps {
  expense: Expense;
  currentUserId: string;
}

export function ExpenseItem({ expense, currentUserId }: ExpenseItemProps) {
  const isPayer = expense.paidBy.id === currentUserId;
  const sharePerPerson = expense.amount / expense.splitAmong.length;
  const yourShare = expense.splitAmong.some((u) => u.id === currentUserId)
    ? sharePerPerson
    : 0;
  const netAmount = isPayer ? expense.amount - yourShare : -yourShare;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-card hover:bg-accent/50 transition-colors duration-200">
      {/* Category Icon */}
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl text-xl',
          getCategoryColor(expense.category)
        )}
      >
        {getCategoryIcon(expense.category)}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate">{expense.description}</h4>
        <p className="text-sm text-muted-foreground">
          Paid by{' '}
          <span className="font-medium">
            {isPayer ? 'you' : expense.paidBy.name}
          </span>
        </p>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p className="font-semibold text-foreground">
          {formatCurrency(expense.amount)}
        </p>
        {netAmount !== 0 && (
          <p
            className={cn(
              'text-sm font-medium',
              netAmount > 0 ? 'text-success' : 'text-destructive'
            )}
          >
            {netAmount > 0 ? 'you get ' : 'you owe '}
            {formatCurrency(Math.abs(netAmount))}
          </p>
        )}
      </div>

      {/* Date */}
      <div className="hidden sm:block text-right">
        <p className="text-sm text-muted-foreground">
          {format(new Date(expense.createdAt), 'MMM d')}
        </p>
      </div>
    </div>
  );
}
