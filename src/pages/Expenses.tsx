import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExpenseItem } from '@/components/dashboard/ExpenseItem';
import { useSplitPayStore } from '@/store/splitpay-store';
import { formatCurrency, getCategoryIcon } from '@/lib/splitpay-utils';
import { ExpenseCategory } from '@/types/splitpay';
import { Search, Receipt, Filter, ArrowUpDown } from 'lucide-react';

const categories: { value: ExpenseCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'food', label: 'Food & Drinks' },
  { value: 'transport', label: 'Transport' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
];

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

export default function Expenses() {
  const { currentUser, groups, expenses } = useSplitPayStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Filter by search
    if (searchQuery) {
      result = result.filter((e) =>
        e.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((e) => e.category === selectedCategory);
    }

    // Filter by group
    if (selectedGroup !== 'all') {
      result = result.filter((e) => e.groupId === selectedGroup);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'oldest':
        result.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'highest':
        result.sort((a, b) => b.amount - a.amount);
        break;
      case 'lowest':
        result.sort((a, b) => a.amount - b.amount);
        break;
    }

    return result;
  }, [expenses, searchQuery, selectedCategory, selectedGroup, sortBy]);

  const totalAmount = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Expenses</h1>
          <p className="text-muted-foreground">
            View and filter all your expenses
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={selectedCategory}
            onValueChange={(v) => setSelectedCategory(v as ExpenseCategory | 'all')}
          >
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.value !== 'all' && (
                    <span className="mr-2">{getCategoryIcon(cat.value)}</span>
                  )}
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger>
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger>
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Amount</SelectItem>
              <SelectItem value="lowest">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-card shadow-soft mb-6">
          <div>
            <p className="text-sm text-muted-foreground">
              {filteredExpenses.length} expense
              {filteredExpenses.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>

        {/* Expense List */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-card">
            <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">
              No expenses found
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedCategory !== 'all' || selectedGroup !== 'all'
                ? 'Try adjusting your filters'
                : 'Start by adding an expense to a group'}
            </p>
            {!searchQuery && selectedCategory === 'all' && selectedGroup === 'all' && (
              <Link to="/groups">
                <Button variant="hero">Go to Groups</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredExpenses.map((expense) => (
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
  );
}
