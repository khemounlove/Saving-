export type TransactionType = 'income' | 'expense' | 'saving';

export type Category = 
  | 'Food' 
  | 'Groceries'
  | 'Dining Out'
  | 'Transport' 
  | 'Fuel'
  | 'Gasoline'
  | 'Rent' 
  | 'Utilities'
  | 'Housing'
  | 'Shopping' 
  | 'Entertainment' 
  | 'Subscriptions'
  | 'Phone Card'
  | 'Health' 
  | 'Personal Care'
  | 'Education'
  | 'Travel'
  | 'Maintenance'
  | 'Insurance'
  | 'Pets'
  | 'Parents'
  | 'Taxes'
  | 'Loans'
  | 'Salary' 
  | 'Investment'
  | 'Savings'
  | 'Bonus'
  | 'Donations'
  | 'Gift' 
  | 'Other';

export interface Transaction {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO string with time
  type: TransactionType;
}

export interface SpendingSummary {
  totalIncome: number;
  totalExpense: number;
  totalSaving: number;
  balance: number;
  categoryBreakdown: Record<Category, number>;
}