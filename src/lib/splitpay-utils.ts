import { Expense, Balance, Settlement, User } from '@/types/splitpay';

export function calculateBalances(expenses: Expense[], members: User[]): Balance[] {
  const balanceMap: Record<string, number> = {};
  
  // Initialize all members with 0 balance
  members.forEach(member => {
    balanceMap[member.id] = 0;
  });

  expenses.forEach(expense => {
    const { amount, paidBy, splitAmong, splitType, splitDetails } = expense;
    
    // Add amount to payer's balance (they are owed this much)
    balanceMap[paidBy.id] = (balanceMap[paidBy.id] || 0) + amount;

    // Calculate each person's share
    if (splitType === 'equal') {
      const sharePerPerson = amount / splitAmong.length;
      splitAmong.forEach(user => {
        balanceMap[user.id] = (balanceMap[user.id] || 0) - sharePerPerson;
      });
    } else if (splitType === 'exact' && splitDetails) {
      Object.entries(splitDetails).forEach(([userId, share]) => {
        balanceMap[userId] = (balanceMap[userId] || 0) - share;
      });
    } else if (splitType === 'percentage' && splitDetails) {
      Object.entries(splitDetails).forEach(([userId, percentage]) => {
        const share = (amount * percentage) / 100;
        balanceMap[userId] = (balanceMap[userId] || 0) - share;
      });
    }
  });

  return members.map(member => ({
    userId: member.id,
    userName: member.name,
    amount: Math.round(balanceMap[member.id] * 100) / 100, // Round to 2 decimal places
  }));
}

export function calculateSettlements(balances: Balance[]): Settlement[] {
  const settlements: Settlement[] = [];
  
  // Separate into creditors (positive balance) and debtors (negative balance)
  const creditors = balances
    .filter(b => b.amount > 0.01)
    .map(b => ({ ...b }))
    .sort((a, b) => b.amount - a.amount);
  
  const debtors = balances
    .filter(b => b.amount < -0.01)
    .map(b => ({ ...b, amount: Math.abs(b.amount) }))
    .sort((a, b) => b.amount - a.amount);

  let i = 0, j = 0;
  
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    
    const settleAmount = Math.min(creditor.amount, debtor.amount);
    
    if (settleAmount > 0.01) {
      settlements.push({
        from: { id: debtor.userId, name: debtor.userName, email: '' },
        to: { id: creditor.userId, name: creditor.userName, email: '' },
        amount: Math.round(settleAmount * 100) / 100,
      });
    }
    
    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;
    
    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return settlements;
}

export function formatCurrency(amount: number, currency: string = '₹'): string {
  const absAmount = Math.abs(amount);
  return `${currency}${absAmount.toLocaleString('en-IN', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  })}`;
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    food: '🍔',
    transport: '🚗',
    accommodation: '🏨',
    entertainment: '🎬',
    shopping: '🛍️',
    utilities: '💡',
    other: '📦',
  };
  return icons[category] || '📦';
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    food: 'bg-orange-100 text-orange-700',
    transport: 'bg-blue-100 text-blue-700',
    accommodation: 'bg-purple-100 text-purple-700',
    entertainment: 'bg-pink-100 text-pink-700',
    shopping: 'bg-yellow-100 text-yellow-700',
    utilities: 'bg-green-100 text-green-700',
    other: 'bg-gray-100 text-gray-700',
  };
  return colors[category] || 'bg-gray-100 text-gray-700';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-rose-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}
