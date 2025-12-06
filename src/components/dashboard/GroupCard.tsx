import { Link } from 'react-router-dom';
import { Group } from '@/types/splitpay';
import { formatCurrency, getInitials, getAvatarColor } from '@/lib/splitpay-utils';
import { Users, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupCardProps {
  group: Group;
  balance?: number;
}

export function GroupCard({ group, balance = 0 }: GroupCardProps) {
  const displayedMembers = group.members.slice(0, 3);
  const remainingCount = group.members.length - 3;

  return (
    <Link to={`/groups/${group.id}`}>
      <div className="group relative overflow-hidden rounded-2xl bg-card p-5 shadow-card transition-all duration-300 hover:shadow-elevated hover:scale-[1.02]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
              {group.name}
            </h3>
            {group.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {group.description}
              </p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {displayedMembers.map((member) => (
                <div
                  key={member.id}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 border-card text-xs font-semibold text-primary-foreground',
                    getAvatarColor(member.name)
                  )}
                  title={member.name}
                >
                  {getInitials(member.name)}
                </div>
              ))}
              {remainingCount > 0 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium text-muted-foreground">
                  +{remainingCount}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{group.members.length}</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5">Total</p>
            <p className="font-semibold text-foreground">
              {formatCurrency(group.totalExpenses)}
            </p>
          </div>
        </div>

        {/* Balance indicator */}
        {balance !== 0 && (
          <div
            className={cn(
              'absolute top-0 right-0 px-3 py-1 text-xs font-semibold rounded-bl-xl',
              balance > 0
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            )}
          >
            {balance > 0 ? '+' : ''}{formatCurrency(balance)}
          </div>
        )}
      </div>
    </Link>
  );
}
