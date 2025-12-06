import { Settlement } from '@/types/splitpay';
import { formatCurrency, getInitials, getAvatarColor } from '@/lib/splitpay-utils';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SettlementCardProps {
  settlement: Settlement;
  currentUserId: string;
  onSettle?: () => void;
}

export function SettlementCard({ settlement, currentUserId, onSettle }: SettlementCardProps) {
  const isYouPaying = settlement.from.id === currentUserId;
  const isYouReceiving = settlement.to.id === currentUserId;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-card shadow-soft">
      {/* From User */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground',
            getAvatarColor(settlement.from.name)
          )}
        >
          {getInitials(settlement.from.name)}
        </div>
        <span className="font-medium text-foreground">
          {isYouPaying ? 'You' : settlement.from.name}
        </span>
      </div>

      {/* Arrow */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
          <span className="text-sm font-semibold text-foreground">
            {formatCurrency(settlement.amount)}
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* To User */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground',
            getAvatarColor(settlement.to.name)
          )}
        >
          {getInitials(settlement.to.name)}
        </div>
        <span className="font-medium text-foreground">
          {isYouReceiving ? 'You' : settlement.to.name}
        </span>
      </div>

      {/* Settle Button */}
      {(isYouPaying || isYouReceiving) && onSettle && (
        <Button variant="outline" size="sm" onClick={onSettle}>
          {isYouPaying ? 'Pay' : 'Remind'}
        </Button>
      )}
    </div>
  );
}
