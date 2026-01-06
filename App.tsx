import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Category, TransactionType } from './types';
import { 
  PlusIcon, HomeIcon, ChartIcon, ListIcon, TrashIcon, EditIcon,
  UtensilsIcon, CarIcon, ShoppingBagIcon, FilmIcon, ActivityIcon, 
  BriefcaseIcon, GiftIcon, MoreHorizontalIcon, SunIcon, MoonIcon,
  CoffeeIcon, FuelIcon, SmartphoneIcon, BookIcon, HeartIcon, ZapIcon, MusicIcon,
  AlertCircleIcon, CheckCircleIcon, WalletIcon, ShieldIcon, GlobeIcon, PlaneIcon,
  PawIcon, BankIcon, StarIcon, UserIcon, DownloadIcon, SettingsIcon, PiggyBankIcon
} from './components/Icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { exportTransactionsToPDF } from './utils/pdfExport';

const CATEGORIES: Category[] = [
  'Food', 'Groceries', 'Dining Out', 'Transport', 'Fuel', 'Gasoline', 'Rent', 'Utilities', 
  'Housing', 'Shopping', 'Entertainment', 'Subscriptions', 'Phone Card', 'Health', 'Personal Care', 
  'Education', 'Travel', 'Maintenance', 'Insurance', 'Pets', 'Parents', 'Taxes', 'Loans',
  'Salary', 'Investment', 'Savings', 'Bonus', 'Donations', 'Gift', 'Other'
];

const ICON_POOL: Record<string, (props: { size?: number }) => React.JSX.Element> = {
  Utensils: UtensilsIcon,
  Car: CarIcon,
  ShoppingBag: ShoppingBagIcon,
  Film: FilmIcon,
  Activity: ActivityIcon,
  Briefcase: BriefcaseIcon,
  Gift: GiftIcon,
  More: MoreHorizontalIcon,
  Home: HomeIcon,
  Coffee: CoffeeIcon,
  Fuel: FuelIcon,
  Gasoline: FuelIcon,
  Smartphone: SmartphoneIcon,
  Book: BookIcon,
  Heart: HeartIcon,
  Zap: ZapIcon,
  Music: MusicIcon,
  Wallet: WalletIcon,
  Shield: ShieldIcon,
  Globe: GlobeIcon,
  Plane: PlaneIcon,
  Paw: PawIcon,
  Bank: BankIcon,
  Star: StarIcon,
  User: UserIcon,
  PiggyBank: PiggyBankIcon,
};

const DEFAULT_ICONS: Record<Category, string> = {
  Food: 'Utensils',
  Groceries: 'ShoppingBag',
  'Dining Out': 'Coffee',
  Transport: 'Car',
  Fuel: 'Fuel',
  Gasoline: 'Gasoline',
  Rent: 'Home',
  Utilities: 'Zap',
  Housing: 'Home',
  Shopping: 'ShoppingBag',
  Entertainment: 'Film',
  Subscriptions: 'Smartphone',
  'Phone Card': 'Smartphone',
  Health: 'Activity',
  'Personal Care': 'Heart',
  Education: 'Book',
  Travel: 'Plane',
  Maintenance: 'Shield',
  Insurance: 'Shield',
  Pets: 'Paw',
  Parents: 'User',
  Taxes: 'Bank',
  Loans: 'Bank',
  Salary: 'Briefcase',
  Investment: 'Star',
  Savings: 'PiggyBank',
  Bonus: 'Star',
  Donations: 'Heart',
  Gift: 'Gift',
  Other: 'More',
};

const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#f59e0b',
  Groceries: '#10b981',
  'Dining Out': '#f97316',
  Transport: '#6366f1',
  Fuel: '#ef4444',
  Gasoline: '#f43f5e',
  Rent: '#3b82f6',
  Utilities: '#eab308',
  Housing: '#1e293b',
  Shopping: '#ec4899',
  Entertainment: '#8b5cf6',
  Subscriptions: '#06b6d4',
  'Phone Card': '#6366f1',
  Health: '#10b981',
  'Personal Care': '#d946ef',
  Education: '#64748b',
  Travel: '#0ea5e9',
  Maintenance: '#475569',
  Insurance: '#1e293b',
  Pets: '#fbbf24',
  Parents: '#8b5cf6',
  Taxes: '#ef4444',
  Loans: '#dc2626',
  Salary: '#22c55e',
  Investment: '#84cc16',
  Savings: '#059669',
  Bonus: '#fcd34d',
  Donations: '#fb7185',
  Gift: '#fb7185',
  Other: '#94a3b8',
};

type SortOption = 'date' | 'amount' | 'category';
type FilterOption = 'all' | 'income' | 'expense' | 'saving';
type StatsPeriod = 'week' | 'month' | 'year' | 'all';
type TabName = 'home' | 'saving' | 'history' | 'stats' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [clearDataConfirm, setClearDataConfirm] = useState(false);
  const [customizingCategory, setCustomizingCategory] = useState<Category | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('wealthwise_darkmode');
    return saved === 'true';
  });

  const [categoryIcons, setCategoryIcons] = useState<Record<Category, string>>(() => {
    const saved = localStorage.getItem('wealthwise_category_icons');
    return saved ? JSON.parse(saved) : DEFAULT_ICONS;
  });

  const [showCategoryConfirm, setShowCategoryConfirm] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<Category | null>(null);

  useEffect(() => {
    localStorage.setItem('wealthwise_category_icons', JSON.stringify(categoryIcons));
  }, [categoryIcons]);

  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterByType, setFilterByType] = useState<FilterOption>('all');
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('month');

  const getDefaultDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [type, setType] = useState<TransactionType>('expense');
  const [dateTime, setDateTime] = useState(getDefaultDateTime());

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('wealthwise_darkmode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('wealthwise_transactions');
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load transactions", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wealthwise_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const summary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const saving = transactions.filter(t => t.type === 'saving').reduce((sum, t) => sum + t.amount, 0);
    return {
      income,
      expense,
      saving,
      balance: income - expense - saving 
    };
  }, [transactions]);

  const effectiveBalance = useMemo(() => {
    if (!editingTransactionId) return summary.balance;
    const original = transactions.find(t => t.id === editingTransactionId);
    if (!original) return summary.balance;
    if (original.type === 'income') return summary.balance - original.amount;
    return summary.balance + original.amount;
  }, [transactions, editingTransactionId, summary.balance]);

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount)) return;

    if (type !== 'income' && numAmount > effectiveBalance) {
      alert(`Insufficient funds! Your available balance is $${effectiveBalance.toFixed(2)}`);
      return;
    }

    if (editingTransactionId) {
      setTransactions(transactions.map(t => 
        t.id === editingTransactionId 
          ? { ...t, amount: numAmount, description: description || category, category, type, date: dateTime } 
          : t
      ));
    } else {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        amount: numAmount,
        description: description || category,
        category,
        type,
        date: dateTime,
      };
      setTransactions([newTransaction, ...transactions]);
    }

    resetForm();
    setIsAdding(false);
    setEditingTransactionId(null);
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransactionId(t.id);
    setAmount(t.amount.toString());
    setDescription(t.description);
    setCategory(t.category);
    setType(t.type);
    setDateTime(t.date);
    setIsAdding(true);
  };

  const handleQuickAdd = (cat: Category, transactionType: TransactionType) => {
    resetForm();
    setCategory(cat);
    setType(transactionType);
    setIsAdding(true);
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('Food');
    setType('expense');
    setDateTime(getDefaultDateTime());
    setEditingTransactionId(null);
    setPendingCategory(null);
  };

  const formatDateTimeDisplay = (isoStr: string) => {
    const d = new Date(isoStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const executeDelete = () => {
    if (deleteConfirmId) {
      setTransactions(transactions.filter(t => t.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  const executeClearData = () => {
    setTransactions([]);
    localStorage.removeItem('wealthwise_transactions');
    setClearDataConfirm(false);
  };

  const filteredByPeriod = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (statsPeriod === 'all') return true;
      if (statsPeriod === 'year') return tDate.getFullYear() === now.getFullYear();
      if (statsPeriod === 'month') return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      if (statsPeriod === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return tDate >= oneWeekAgo;
      }
      return true;
    });
  }, [transactions, statsPeriod]);

  const statsSummary = useMemo(() => {
    const income = filteredByPeriod.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredByPeriod.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const saving = filteredByPeriod.filter(t => t.type === 'saving').reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = income > 0 ? ((saving + (income - expense - saving)) / income) * 100 : 0;
    return { income, expense, saving, net: income - expense - saving, savingsRate };
  }, [filteredByPeriod]);

  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredByPeriod.filter(t => t.type !== 'income').forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredByPeriod]);

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];
    if (filterByType !== 'all') {
      result = result.filter(t => t.type === filterByType);
    }
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') comparison = a.date.localeCompare(b.date);
      else if (sortBy === 'amount') comparison = a.amount - b.amount;
      else if (sortBy === 'category') comparison = a.category.localeCompare(b.category);
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    return result;
  }, [transactions, sortBy, sortOrder, filterByType]);

  const CategoryBadge = ({ category, size = 20, className = "" }: { category: Category, size?: number, className?: string }) => {
    const iconName = categoryIcons[category];
    const Icon = ICON_POOL[iconName] || MoreHorizontalIcon;
    const color = CATEGORY_COLORS[category];
    
    return (
      <div 
        className={`rounded-xl flex items-center justify-center shadow-sm shrink-0 ${className}`}
        style={{ backgroundColor: `${color}15`, color: color }}
      >
        <Icon size={size} />
      </div>
    );
  };

  const TypeBadge = ({ type, className = "" }: { type: TransactionType, className?: string }) => {
    const styles = {
      income: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
      saving: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
      expense: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${styles[type]} ${className}`}>
        {type}
      </span>
    );
  };

  const isOverBudget = type !== 'income' && Number(amount) > effectiveBalance;

  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setDateTime(d.toISOString().slice(0, 16));
  };

  const onCategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCat = e.target.value as Category;
    // Apply confirmation anytime the user switches from the current category state
    if (newCat !== category) {
      setPendingCategory(newCat);
      setShowCategoryConfirm(true);
    }
  };

  const confirmCategoryChange = () => {
    if (pendingCategory) {
      setCategory(pendingCategory);
      setPendingCategory(null);
    }
    setShowCategoryConfirm(false);
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 max-w-lg mx-auto bg-white dark:bg-slate-950 shadow-xl overflow-x-hidden transition-colors duration-300 font-inter">
      <header className="p-6 bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-10 flex justify-between items-center transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">WealthWise</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Financial Manager</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-all active:scale-95"
          >
            {isDarkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar">
        {activeTab === 'home' && (
          <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Balance Card */}
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/20 relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              <p className="text-indigo-100 text-[10px] mb-1 opacity-90 font-black uppercase tracking-widest">Total Balance</p>
              <h2 className="text-4xl font-bold mb-8">
                ${summary.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <div className="grid grid-cols-3 gap-3 relative z-10">
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 text-center">
                  <p className="text-[10px] text-indigo-100 mb-1 uppercase font-black opacity-80">Income</p>
                  <p className="text-sm font-bold truncate">${summary.income.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 text-center">
                  <p className="text-[10px] text-indigo-100 mb-1 uppercase font-black opacity-80">Preserved</p>
                  <p className="text-sm font-bold truncate">${summary.saving.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 text-center">
                  <p className="text-[10px] text-indigo-100 mb-1 uppercase font-black opacity-80">Spendings</p>
                  <p className="text-sm font-bold truncate">${summary.expense.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Quick Add Section - Horizontal Scroll */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-bold text-base dark:text-white">Quick Entry</h3>
              </div>
              <div className="flex overflow-x-auto gap-3 pb-3 hide-scrollbar snap-x snap-mandatory text-center">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleQuickAdd(cat, 'expense')}
                    className="flex flex-col items-center gap-2 flex-shrink-0 snap-start active:opacity-70 transition-opacity"
                  >
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm">
                      <CategoryBadge category={cat} size={22} className="w-10 h-10 shadow-none border-none bg-transparent" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter truncate max-w-[56px]">{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-bold text-base dark:text-white">Recent Records</h3>
                <button onClick={() => setActiveTab('history')} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">See Logs</button>
              </div>
              <div className="space-y-3">
                {transactions.slice(0, 8).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] active:bg-slate-100 dark:active:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <CategoryBadge category={t.category} size={22} className="w-11 h-11" />
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[150px] text-sm">{t.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <TypeBadge type={t.type} />
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                            {formatDateTimeDisplay(t.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className={`font-bold shrink-0 text-sm ${
                      t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 
                      t.type === 'saving' ? 'text-blue-600 dark:text-blue-400' :
                      'text-rose-600 dark:text-rose-400'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="text-center py-16 text-slate-400 dark:text-slate-600 italic bg-slate-50/50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                    No records found.<br/>Tap the + button to start.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'saving' && (
          <div className="p-6 space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <h3 className="text-2xl font-bold dark:text-white font-inter">Preservation Health</h3>
            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/20 relative overflow-hidden">
              <div className="absolute top-[-10%] left-[-10%] w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <p className="text-blue-100 text-[10px] mb-1 opacity-90 font-black uppercase tracking-widest">Preserved Wealth</p>
              <h2 className="text-4xl font-bold mb-6">
                ${summary.saving.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span className="opacity-80">Growth Ratio</span>
                  <span>{((summary.saving / (summary.income || 1)) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-1000 shadow-sm" 
                    style={{ width: `${Math.min(100, summary.income > 0 ? (summary.saving / summary.income) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-3xl">
                <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest mb-1">Total Inflow</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">${summary.income.toLocaleString()}</p>
              </div>
              <div className="p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 rounded-3xl">
                <p className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-widest mb-1">Net Outflow</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">${summary.expense.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 dark:text-slate-200 px-1">Preservation History</h4>
              {transactions.filter(t => t.type === 'saving').length > 0 ? (
                transactions.filter(t => t.type === 'saving').map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] shadow-sm">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <CategoryBadge category={t.category} size={20} className="w-10 h-10" />
                      <div className="overflow-hidden">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{t.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <TypeBadge type={t.type} />
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-tighter">
                            {formatDateTimeDisplay(t.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-sm text-blue-600 dark:text-blue-400">
                      ${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 opacity-40 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem]">
                  <PiggyBankIcon size={48} />
                  <p className="mt-3 text-sm font-bold uppercase tracking-widest">Start Preserving</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-6 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col gap-4 sticky top-0 bg-white dark:bg-slate-950 pb-4 z-[5] transition-colors">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold dark:text-white">Transaction Logs</h3>
                <button 
                  onClick={() => exportTransactionsToPDF(transactions)}
                  className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl active:bg-indigo-100 transition-all flex items-center gap-2"
                >
                  <DownloadIcon />
                  <span className="text-[10px] font-black uppercase">PDF Export</span>
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(['all', 'income', 'expense', 'saving'] as FilterOption[]).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setFilterByType(opt)}
                      className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase transition-all ${filterByType === opt ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 active:bg-slate-200 dark:active:bg-slate-700'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap">Order:</span>
                  {(['date', 'amount', 'category'] as SortOption[]).map(opt => (
                    <button
                      key={opt}
                      onClick={() => {
                        if (sortBy === opt) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else { setSortBy(opt); setSortOrder('desc'); }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border whitespace-nowrap flex items-center gap-1 ${sortBy === opt ? 'bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 active:border-slate-200 dark:active:border-slate-700'}`}
                    >
                      {opt} {sortBy === opt && (<span>{sortOrder === 'asc' ? '↑' : '↓'}</span>)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 pb-8">
              {filteredAndSortedTransactions.map(t => (
                <div key={t.id} className="group flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] shadow-sm active:shadow-md transition-all">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <CategoryBadge category={t.category} size={20} className="w-11 h-11" />
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{t.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <TypeBadge type={t.type} />
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {formatDateTimeDisplay(t.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-bold text-sm mr-2 ${
                      t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 
                      t.type === 'saving' ? 'text-blue-600 dark:text-blue-400' : 
                      'text-rose-600 dark:text-rose-400'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <button onClick={() => handleEdit(t)} className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400 active:bg-indigo-100 active:scale-90 transition-all">
                      <EditIcon />
                    </button>
                    <button onClick={() => setDeleteConfirmId(t.id)} className="p-2.5 bg-rose-50 dark:bg-rose-900/20 rounded-xl active:bg-rose-100 active:scale-90 transition-all">
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
              {filteredAndSortedTransactions.length === 0 && (
                <div className="text-center py-20 opacity-50 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem]">
                   <ListIcon />
                   <p className="mt-3 text-xs font-black uppercase tracking-widest">Empty Archives</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="p-6 space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold dark:text-white">Business Intelligence</h3>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {(['week', 'month', 'year'] as StatsPeriod[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setStatsPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${statsPeriod === p ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className={`p-6 rounded-[2.5rem] flex flex-col gap-4 border transition-all ${statsSummary.net < 0 ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/30' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-[1.5rem] flex items-center justify-center shrink-0 ${statsSummary.net < 0 ? 'bg-rose-100 dark:bg-rose-800 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-400'}`}>
                  {statsSummary.net < 0 ? <AlertCircleIcon size={28} /> : <CheckCircleIcon size={28} />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Results of Period</p>
                  <p className={`font-bold text-lg leading-tight ${statsSummary.net < 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                    {statsSummary.net < 0 
                      ? `Deficit of $${Math.abs(statsSummary.net).toLocaleString()}`
                      : `Surplus of $${statsSummary.net.toLocaleString()}`}
                  </p>
                </div>
              </div>
              <div className="w-full h-3 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${statsSummary.savingsRate >= 20 ? 'bg-emerald-500' : statsSummary.savingsRate > 0 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, Math.max(0, statsSummary.savingsRate))}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-center uppercase tracking-widest opacity-70">
                Retention Index: {statsSummary.savingsRate.toFixed(1)}%
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Inflow</p>
                <p className="text-md font-bold text-emerald-600 dark:text-emerald-400">${statsSummary.income.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Growth</p>
                <p className="text-md font-bold text-blue-600 dark:text-blue-400">${statsSummary.saving.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Spend</p>
                <p className="text-md font-bold text-rose-600 dark:text-rose-400">${statsSummary.expense.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="h-[300px] w-full bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-6 flex flex-col items-center justify-center relative border border-slate-100 dark:border-slate-800 transition-colors">
              <p className="absolute top-6 left-8 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Structural Outflow</p>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as Category] || '#cbd5e1'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#f1f5f9' : '#1e293b' }}
                      itemStyle={{ color: isDarkMode ? '#f1f5f9' : '#1e293b', fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center opacity-40">
                  <ChartIcon />
                  <p className="mt-2 text-xs font-black uppercase tracking-widest">Awaiting Data</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-2xl font-bold dark:text-white">Settings & Assets</h3>
            
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-7 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-[1.2rem]">
                      {isDarkMode ? <MoonIcon size={20} /> : <SunIcon size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">Visual Theme</p>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Toggle dark environment</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`w-14 h-8 rounded-full transition-all relative shadow-inner ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="border-t dark:border-slate-800 pt-7">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-[1.2rem]">
                      <StarIcon size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">Asset Indicators</p>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Personalize category icons</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {CATEGORIES.slice(0, 15).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCustomizingCategory(cat)}
                        className="flex flex-col items-center gap-2.5 p-4 rounded-[1.8rem] bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-indigo-100 transition-all text-center active:scale-95"
                      >
                        <CategoryBadge category={cat} size={18} className="w-10 h-10" />
                        <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase truncate w-full tracking-tighter">{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-rose-50 dark:bg-rose-900/10 p-7 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/30">
                <div className="flex items-center gap-4 mb-5">
                  <div className="p-3.5 bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400 rounded-[1.2rem]">
                    <AlertCircleIcon size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-rose-700 dark:text-rose-400">Critical Zone</p>
                    <p className="text-[11px] font-black uppercase text-rose-600/60 dark:text-rose-400/60 tracking-widest">Permanent actions</p>
                  </div>
                </div>
                <button 
                  onClick={() => setClearDataConfirm(true)}
                  className="w-full py-5 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                >
                  Clear Device Cache
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] pb-8">WealthWise v1.2.0</p>
          </div>
        )}
      </main>

      {/* MODALS SECTION */}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-sm bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-5">
              <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrashIcon />
              </div>
              <h3 className="text-2xl font-bold dark:text-white">Delete Entry?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm px-4 font-medium">This record will be permanently purged from this device's local memory.</p>
              <div className="flex gap-3 pt-6">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-5 rounded-[1.8rem] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 active:scale-95 transition-all">Cancel</button>
                <button onClick={executeDelete} className="flex-1 py-5 rounded-[1.8rem] font-bold text-white bg-rose-600 shadow-xl shadow-rose-200 dark:shadow-none active:scale-95 transition-all">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Data Confirmation Modal */}
      {clearDataConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-sm bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-5">
              <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircleIcon size={48} />
              </div>
              <h3 className="text-2xl font-bold dark:text-white text-rose-600 uppercase tracking-tight">Full Erase?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm px-4 font-medium">Warning: This operation will completely reset your transaction database. Recovery is impossible.</p>
              <div className="flex gap-3 pt-6">
                <button onClick={() => setClearDataConfirm(false)} className="flex-1 py-5 rounded-[1.8rem] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 active:scale-95 transition-all">Safe State</button>
                <button onClick={executeClearData} className="flex-1 py-5 rounded-[1.8rem] font-bold text-white bg-rose-600 shadow-xl shadow-rose-200 dark:shadow-none active:scale-95 transition-all">Wipe All</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Change Confirmation Modal */}
      {showCategoryConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-sm bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-5">
              <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircleIcon size={32} />
              </div>
              <h3 className="text-2xl font-bold dark:text-white">Change Category?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm px-4 font-medium">Reclassifying this record to <span className="font-bold text-slate-800 dark:text-slate-200 underline">{pendingCategory}</span> will update your analytics. Proceed?</p>
              <div className="flex gap-3 pt-6">
                <button onClick={() => { setShowCategoryConfirm(false); setPendingCategory(null); }} className="flex-1 py-5 rounded-[1.8rem] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 active:scale-95 transition-all">Revert</button>
                <button onClick={confirmCategoryChange} className="flex-1 py-5 rounded-[1.8rem] font-bold text-white bg-indigo-600 shadow-xl shadow-indigo-200 dark:shadow-none active:scale-95 transition-all">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Icon Picker Modal */}
      {customizingCategory && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[120] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-sm bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold dark:text-white">Indicator Assets</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{customizingCategory}</p>
              </div>
              <button onClick={() => setCustomizingCategory(null)} className="p-2.5 text-slate-400 rounded-xl active:bg-slate-100 dark:active:bg-slate-800 transition-all">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 max-h-[55vh] overflow-y-auto pr-3 custom-scrollbar p-1">
              {Object.keys(ICON_POOL).map(iconName => {
                const Icon = ICON_POOL[iconName];
                const isSelected = categoryIcons[customizingCategory!] === iconName;
                return (
                  <button
                    key={iconName}
                    onClick={() => {
                      if (customizingCategory) {
                        setCategoryIcons(prev => ({ ...prev, [customizingCategory]: iconName }));
                        setCustomizingCategory(null);
                      }
                    }}
                    className={`aspect-square rounded-2xl flex items-center justify-center border-2 transition-all active:scale-90 ${isSelected ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-400 active:bg-slate-100 dark:active:bg-slate-700'}`}
                  >
                    <Icon size={24} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Transaction Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-end justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3.5rem] p-8 animate-in slide-in-from-bottom-full duration-500 max-h-[92vh] overflow-y-auto shadow-2xl custom-scrollbar border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-8 px-2">
              <h2 className="text-2xl font-bold dark:text-white">{editingTransactionId ? 'Modify Entry' : 'Create Entry'}</h2>
              <button onClick={() => { setIsAdding(false); setEditingTransactionId(null); resetForm(); }} className="p-3 text-slate-400 rounded-full active:bg-slate-100 dark:active:bg-slate-800 transition-all">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveTransaction} className="space-y-7">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[1.8rem] shadow-inner">
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-4 rounded-[1.4rem] font-black text-[10px] uppercase tracking-widest transition-all ${type === 'income' ? 'bg-white dark:bg-slate-700 shadow-md text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Inflow
                </button>
                <button
                  type="button"
                  onClick={() => setType('saving')}
                  className={`flex-1 py-4 rounded-[1.4rem] font-black text-[10px] uppercase tracking-widest transition-all ${type === 'saving' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Saving
                </button>
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-4 rounded-[1.4rem] font-black text-[10px] uppercase tracking-widest transition-all ${type === 'expense' ? 'bg-white dark:bg-slate-700 shadow-md text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Outflow
                </button>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-3 mb-2 block">Value Input</label>
                <div className="relative">
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-400">$</span>
                  <input
                    autoFocus
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className={`w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[2.5rem] py-8 pl-14 pr-8 text-4xl font-bold dark:text-white focus:ring-4 placeholder:text-slate-200 dark:placeholder:text-slate-700 transition-all outline-none ${isOverBudget ? 'text-rose-600 dark:text-rose-400 focus:ring-rose-100 dark:focus:ring-rose-900/20' : 'text-slate-900 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 shadow-inner'}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                {type !== 'income' && (
                  <p className="mt-3 ml-4 text-[10px] font-black text-indigo-500/80 dark:text-indigo-400/60 uppercase tracking-widest">
                    Available: ${effectiveBalance.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Timestamp</label>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setQuickDate(0)} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest active:underline">Now</button>
                    <button type="button" onClick={() => setQuickDate(1)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest active:underline">Yesterday</button>
                  </div>
                </div>
                <input
                  type="datetime-local"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[1.8rem] py-5 px-6 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 outline-none transition-all shadow-inner"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-3 mb-2 block">Classification</label>
                <div className="relative">
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[1.8rem] py-5 px-6 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 outline-none transition-all appearance-none shadow-inner"
                    value={category}
                    onChange={onCategorySelectChange}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-3 mb-2 block">Remarks</label>
                <input
                  type="text"
                  placeholder="Record details..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[1.8rem] py-5 px-7 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 outline-none transition-all shadow-inner"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all mt-4"
              >
                {editingTransactionId ? 'Update Record' : 'Commit Entry'}
              </button>
            </form>
          </div>
        </div>
      )}

      {!isAdding && ( activeTab === 'home' || activeTab === 'history' || activeTab === 'saving' ) && (
        <button 
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="fixed bottom-24 right-8 w-16 h-16 bg-indigo-600 text-white rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-indigo-400 dark:shadow-indigo-900/50 z-40 active:bg-indigo-700 active:scale-90 transition-all active:rotate-90"
          aria-label="Add transaction"
        >
          <PlusIcon />
        </button>
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 dark:bg-slate-900/95 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center z-40 backdrop-blur-xl transition-all">
        <button onClick={() => setActiveTab('home')} className={`p-2.5 transition-all flex flex-col items-center gap-1.5 ${activeTab === 'home' ? 'text-indigo-600 dark:text-indigo-400 font-black scale-105' : 'text-slate-400 dark:text-slate-500'}`}>
          <HomeIcon size={18} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Home</span>
        </button>
        <button onClick={() => setActiveTab('saving')} className={`p-2.5 transition-all flex flex-col items-center gap-1.5 ${activeTab === 'saving' ? 'text-indigo-600 dark:text-indigo-400 font-black scale-105' : 'text-slate-400 dark:text-slate-500'}`}>
          <PiggyBankIcon size={18} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Saving</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`p-2.5 transition-all flex flex-col items-center gap-1.5 ${activeTab === 'history' ? 'text-indigo-600 dark:text-indigo-400 font-black scale-105' : 'text-slate-400 dark:text-slate-500'}`}>
          <ListIcon size={18} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Logs</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`p-2.5 transition-all flex flex-col items-center gap-1.5 ${activeTab === 'stats' ? 'text-indigo-600 dark:text-indigo-400 font-black scale-105' : 'text-slate-400 dark:text-slate-500'}`}>
          <ChartIcon size={18} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Stats</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`p-2.5 transition-all flex flex-col items-center gap-1.5 ${activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400 font-black scale-105' : 'text-slate-400 dark:text-slate-500'}`}>
          <SettingsIcon size={18} />
          <span className="text-[9px] font-black uppercase tracking-tighter">App</span>
        </button>
      </nav>
    </div>
  );
};

export default App;