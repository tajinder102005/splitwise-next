import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Group, Expense, User } from '@/types/splitpay';
import { generateId } from '@/lib/splitpay-utils';

interface SplitPayState {
  currentUser: User;
  groups: Group[];
  expenses: Expense[];
  
  // Actions
  setCurrentUser: (user: User) => void;
  addGroup: (group: Omit<Group, 'id' | 'createdAt' | 'totalExpenses'>) => Group;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Expense;
  deleteExpense: (id: string) => void;
  getGroupExpenses: (groupId: string) => Expense[];
  getGroupById: (id: string) => Group | undefined;
}

// Demo data
const demoUser: User = {
  id: 'user-1',
  name: 'You',
  email: 'you@example.com',
};

const demoMembers: User[] = [
  demoUser,
  { id: 'user-2', name: 'Rahul', email: 'rahul@example.com' },
  { id: 'user-3', name: 'Priya', email: 'priya@example.com' },
  { id: 'user-4', name: 'Amit', email: 'amit@example.com' },
];

const demoGroups: Group[] = [
  {
    id: 'group-1',
    name: 'Goa Trip 2024',
    description: 'Beach vacation with friends',
    members: demoMembers,
    createdAt: new Date('2024-01-15'),
    totalExpenses: 15000,
  },
  {
    id: 'group-2',
    name: 'Flatmates',
    description: 'Monthly shared expenses',
    members: [demoUser, demoMembers[1], demoMembers[2]],
    createdAt: new Date('2024-02-01'),
    totalExpenses: 8500,
  },
];

const demoExpenses: Expense[] = [
  {
    id: 'exp-1',
    groupId: 'group-1',
    description: 'Hotel booking',
    amount: 6000,
    paidBy: demoUser,
    splitAmong: demoMembers,
    splitType: 'equal',
    createdAt: new Date('2024-01-15'),
    category: 'accommodation',
  },
  {
    id: 'exp-2',
    groupId: 'group-1',
    description: 'Dinner at beach shack',
    amount: 3200,
    paidBy: demoMembers[1],
    splitAmong: demoMembers,
    splitType: 'equal',
    createdAt: new Date('2024-01-16'),
    category: 'food',
  },
  {
    id: 'exp-3',
    groupId: 'group-1',
    description: 'Water sports',
    amount: 4000,
    paidBy: demoMembers[2],
    splitAmong: demoMembers,
    splitType: 'equal',
    createdAt: new Date('2024-01-17'),
    category: 'entertainment',
  },
  {
    id: 'exp-4',
    groupId: 'group-1',
    description: 'Cab to airport',
    amount: 1800,
    paidBy: demoMembers[3],
    splitAmong: demoMembers,
    splitType: 'equal',
    createdAt: new Date('2024-01-18'),
    category: 'transport',
  },
  {
    id: 'exp-5',
    groupId: 'group-2',
    description: 'Electricity bill',
    amount: 2500,
    paidBy: demoUser,
    splitAmong: [demoUser, demoMembers[1], demoMembers[2]],
    splitType: 'equal',
    createdAt: new Date('2024-02-05'),
    category: 'utilities',
  },
  {
    id: 'exp-6',
    groupId: 'group-2',
    description: 'Groceries',
    amount: 3500,
    paidBy: demoMembers[1],
    splitAmong: [demoUser, demoMembers[1], demoMembers[2]],
    splitType: 'equal',
    createdAt: new Date('2024-02-10'),
    category: 'food',
  },
  {
    id: 'exp-7',
    groupId: 'group-2',
    description: 'WiFi subscription',
    amount: 1200,
    paidBy: demoMembers[2],
    splitAmong: [demoUser, demoMembers[1], demoMembers[2]],
    splitType: 'equal',
    createdAt: new Date('2024-02-15'),
    category: 'utilities',
  },
];

export const useSplitPayStore = create<SplitPayState>()(
  persist(
    (set, get) => ({
      currentUser: demoUser,
      groups: demoGroups,
      expenses: demoExpenses,

      setCurrentUser: (user) => set({ currentUser: user }),

      addGroup: (groupData) => {
        const newGroup: Group = {
          ...groupData,
          id: generateId(),
          createdAt: new Date(),
          totalExpenses: 0,
        };
        set((state) => ({ groups: [...state.groups, newGroup] }));
        return newGroup;
      },

      updateGroup: (id, updates) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
      },

      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== id),
          expenses: state.expenses.filter((e) => e.groupId !== id),
        }));
      },

      addExpense: (expenseData) => {
        const newExpense: Expense = {
          ...expenseData,
          id: generateId(),
          createdAt: new Date(),
        };
        set((state) => {
          const updatedGroups = state.groups.map((g) =>
            g.id === expenseData.groupId
              ? { ...g, totalExpenses: g.totalExpenses + expenseData.amount }
              : g
          );
          return {
            expenses: [...state.expenses, newExpense],
            groups: updatedGroups,
          };
        });
        return newExpense;
      },

      deleteExpense: (id) => {
        const expense = get().expenses.find((e) => e.id === id);
        if (!expense) return;
        
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
          groups: state.groups.map((g) =>
            g.id === expense.groupId
              ? { ...g, totalExpenses: g.totalExpenses - expense.amount }
              : g
          ),
        }));
      },

      getGroupExpenses: (groupId) => {
        return get().expenses.filter((e) => e.groupId === groupId);
      },

      getGroupById: (id) => {
        return get().groups.find((g) => g.id === id);
      },
    }),
    {
      name: 'splitpay-storage',
    }
  )
);
