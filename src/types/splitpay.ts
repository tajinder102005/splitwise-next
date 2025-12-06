export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: User[];
  createdAt: Date;
  totalExpenses: number;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: User;
  splitAmong: User[];
  splitType: 'equal' | 'percentage' | 'exact';
  splitDetails?: Record<string, number>;
  createdAt: Date;
  category: ExpenseCategory;
}

export type ExpenseCategory = 
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'entertainment'
  | 'shopping'
  | 'utilities'
  | 'other';

export interface Balance {
  userId: string;
  userName: string;
  amount: number; // positive = owed to them, negative = they owe
}

export interface Settlement {
  from: User;
  to: User;
  amount: number;
}
