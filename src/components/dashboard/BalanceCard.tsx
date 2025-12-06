import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/splitpay-utils';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  type: 'owed' | 'owe' | 'total';
  amount: number;
  label: string;
}

export function BalanceCard({ type, amount, label }: BalanceCardProps) {
  const config = {
    owed: {
      icon: TrendingUp,
      bgClass: 'gradient-hero',
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      amountColor: 'text-success',
    },
    owe: {
      icon: TrendingDown,
      bgClass: 'bg-destructive/5',
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      amountColor: 'text-destructive',
    },
    total: {
      icon: Wallet,
      bgClass: 'bg-secondary',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      amountColor: 'text-foreground',
    },
  };

  const { icon: Icon, bgClass, iconBg, iconColor, amountColor } = config[type];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 shadow-card transition-all duration-300 hover:shadow-elevated',
        bgClass
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <p className={cn('text-3xl font-bold', amountColor)}>
            {formatCurrency(amount)}
          </p>
        </div>
        <div className={cn('rounded-xl p-3', iconBg)}>
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
      </div>
      
      {/* Decorative element */}
      <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5" />
    </div>
  );
}
