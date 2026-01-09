import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Category, TransactionType, Budget } from './types';
import { 
  PlusIcon, HomeIcon, ChartIcon, ListIcon, EditIcon, TrashIcon,
  UtensilsIcon, CarIcon, ShoppingBagIcon, FilmIcon, ActivityIcon, 
  BriefcaseIcon, GiftIcon, MoreHorizontalIcon, SunIcon, MoonIcon,
  CoffeeIcon, FuelIcon, SmartphoneIcon, BookIcon, HeartIcon, ZapIcon, MusicIcon,
  WalletIcon, ShieldIcon, GlobeIcon, PlaneIcon,
  PawIcon, BankIcon, StarIcon, UserIcon, DownloadIcon, SettingsIcon, PiggyBankIcon,
  AlertCircleIcon, CheckCircleIcon
} from './components/Icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { exportTransactionsToPDF } from './utils/pdfExport';

const CATEGORIES: Category[] = [
  'Food', 'Groceries', 'Dining Out', 'Transport', 'Fuel', 'Gasoline', 'Rent', 'Utilities', 
  'Housing', 'Shopping', 'Entertainment', 'Subscriptions', 'Phone Card', 'Health', 'Personal Care', 
  'Education', 'Travel', 'Maintenance', 'Insurance', 'Pets', 'Parents', 'Taxes', 'Loans',
  'Salary', 'Investment', 'Savings', 'Bonus', 'Donations', 'Gift', 'Other'
];

const CATEGORY_MAP: Record<Category, string> = {
  Food: 'អាហារ',
  Groceries: 'ទំនិញប្រើប្រាស់',
  'Dining Out': 'ញ៉ាំខាងក្រៅ',
  Transport: 'ធ្វើដំណើរ',
  Fuel: 'ប្រេងសាំង',
  Gasoline: 'សាំង',
  Rent: 'ថ្លៃឈ្នួលផ្ទះ',
  Utilities: 'ថ្លៃទឹកភ្លើង',
  Housing: 'លំនៅឋាន',
  Shopping: 'ទិញទំនិញ',
  Entertainment: 'ការកម្សាន្ត',
  Subscriptions: 'សេវាកម្មប្រចាំខែ',
  'Phone Card': 'កាតទូរស័ព្ទ',
  Health: 'សុខភាព',
  'Personal Care': 'ថែរក្សាខ្លួន',
  Education: 'ការសិក្សា',
  Travel: 'ទេសចរណ៍',
  Maintenance: 'ការថែទាំ',
  Insurance: 'ធានារ៉ាប់រង',
  Pets: 'សត្វចិញ្ចឹម',
  Parents: 'ជូនឪពុកម្តាយ',
  Taxes: 'ពន្ធដារ',
  Loans: 'ប្រាក់កម្ចី',
  Salary: 'ប្រាក់ខែ',
  Investment: 'ការវិនិយោគ',
  Savings: 'ការសន្សំ',
  Bonus: 'ប្រាក់រង្វាន់',
  Donations: 'បរិច្ចាគ',
  Gift: 'កាដូ',
  Other: 'ផ្សេងៗ'
};

const ICON_POOL: Record<string, (props: { size?: number }) => React.JSX.Element> = {
  Utensils: UtensilsIcon, Car: CarIcon, ShoppingBag: ShoppingBagIcon, Film: FilmIcon,
  Activity: ActivityIcon, Briefcase: BriefcaseIcon, Gift: GiftIcon, More: MoreHorizontalIcon,
  Home: HomeIcon, Coffee: CoffeeIcon, Fuel: FuelIcon, Gasoline: FuelIcon,
  Smartphone: SmartphoneIcon, Book: BookIcon, Heart: HeartIcon, Zap: ZapIcon,
  Music: MusicIcon, Wallet: WalletIcon, Shield: ShieldIcon, Globe: GlobeIcon,
  Plane: PlaneIcon, Paw: PawIcon, Bank: BankIcon, Star: StarIcon, User: UserIcon,
  PiggyBank: PiggyBankIcon,
};

const ICON_KEYS = Object.keys(ICON_POOL);

const DEFAULT_ICONS: Record<Category, string> = {
  Food: 'Utensils', Groceries: 'ShoppingBag', 'Dining Out': 'Coffee', Transport: 'Car',
  Fuel: 'Fuel', Gasoline: 'Fuel', Rent: 'Home', Utilities: 'Zap',
  Housing: 'Home', Shopping: 'ShoppingBag', Entertainment: 'Film', Subscriptions: 'Smartphone',
  'Phone Card': 'Smartphone', Health: 'Activity', 'Personal Care': 'Heart', Education: 'Book',
  Travel: 'Plane', Maintenance: 'Shield', Insurance: 'Shield', Pets: 'Paw',
  Parents: 'User', Taxes: 'Bank', Loans: 'Bank', Salary: 'Briefcase',
  Investment: 'Star', Savings: 'PiggyBank', Bonus: 'Star', Donations: 'Heart',
  Gift: 'Gift', Other: 'More',
};

const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#f59e0b', Groceries: '#10b981', 'Dining Out': '#f97316', Transport: '#6366f1',
  Fuel: '#ef4444', Gasoline: '#f43f5e', Rent: '#3b82f6', Utilities: '#eab308',
  Housing: '#1e293b', Shopping: '#ec4899', Entertainment: '#8b5cf6', Subscriptions: '#06b6d4',
  'Phone Card': '#6366f1', Health: '#10b981', 'Personal Care': '#d946ef', Education: '#64748b',
  Travel: '#0ea5e9', Maintenance: '#475569', Insurance: '#1e293b', Pets: '#fbbf24',
  Parents: '#8b5cf6', Taxes: '#ef4444', Loans: '#dc2626', Salary: '#22c55e',
  Investment: '#84cc16', Savings: '#059669', Bonus: '#fcd34d', Donations: '#fb7185',
  Gift: '#fb7185', Other: '#94a3b8',
};

type FilterOption = 'all' | 'income' | 'expense' | 'saving';
type TabName = 'home' | 'history' | 'stats' | 'settings';

const translateType = (t: TransactionType) => {
  switch(t) {
    case 'income': return 'ចំណូល';
    case 'expense': return 'ចំណាយ';
    case 'saving': return 'សន្សំ';
    default: return '';
  }
};

const TypeBadge = ({ type }: { type: TransactionType }) => {
  const styles = {
    income: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    expense: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    saving: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${styles[type]}`}>
      {translateType(type)}
    </span>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [clearDataConfirm, setClearDataConfirm] = useState(false);
  const [resetBudgetsConfirm, setResetBudgetsConfirm] = useState(false);
  const [iconPickerCategory, setIconPickerCategory] = useState<Category | null>(null);
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('wealthwise_darkmode');
    return saved === 'true';
  });

  const [categoryIcons, setCategoryIcons] = useState<Record<Category, string>>(() => {
    const saved = localStorage.getItem('wealthwise_category_icons');
    return saved ? JSON.parse(saved) : DEFAULT_ICONS;
  });

  const [filterByType, setFilterByType] = useState<FilterOption>('all');

  const getDefaultDateTime = () => {
    const now = new Date();
    now.setMinutes(Number(now.getMinutes()) - Number(now.getTimezoneOffset()));
    return now.toISOString().slice(0, 16);
  };

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [type, setType] = useState<TransactionType>('expense');
  const [dateTime, setDateTime] = useState(getDefaultDateTime());

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('wealthwise_darkmode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const savedTrans = localStorage.getItem('wealthwise_transactions');
    if (savedTrans) {
      try { setTransactions(JSON.parse(savedTrans)); } catch (e) { console.error(e); }
    }
    const savedBudgets = localStorage.getItem('wealthwise_budgets');
    if (savedBudgets) {
      try { setBudgets(JSON.parse(savedBudgets)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wealthwise_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('wealthwise_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('wealthwise_category_icons', JSON.stringify(categoryIcons));
  }, [categoryIcons]);

  const summary = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
    const saving = transactions
      .filter(t => t.type === 'saving')
      .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
    
    return { 
      income, 
      expense, 
      saving, 
      balance: Number(income) - Number(expense) - Number(saving) 
    };
  }, [transactions]);

  const currentMonthSpending = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    return transactions.reduce((acc, t) => {
      const d = new Date(t.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth && t.type !== 'income') {
        acc[t.category] = (Number(acc[t.category]) || 0) + Number(t.amount);
      }
      return acc;
    }, {} as Record<string, number>);
  }, [transactions]);

  const categorySpending = useMemo(() => {
    const counts = transactions.reduce((acc, t) => {
      if (t.type !== 'income') {
        const cat = t.category;
        acc[cat] = (Number(acc[cat]) || 0) + Number(t.amount);
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name: name as Category, value: Number(value) }))
      .sort((a, b) => Number(b.value) - Number(a.value));
  }, [transactions]);

  const budgetWarnings = useMemo(() => {
    return budgets.map(b => {
      const spent = currentMonthSpending[b.category] || 0;
      const percent = (spent / b.limit) * 100;
      return { category: b.category, spent, limit: b.limit, percent };
    }).filter(b => b.percent >= 80);
  }, [budgets, currentMonthSpending]);

  const filteredTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
    if (filterByType === 'all') return sorted;
    return sorted.filter(t => t.type === filterByType);
  }, [transactions, filterByType]);

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount)) return;

    if (editingTransactionId) {
      setTransactions(transactions.map(t => 
        t.id === editingTransactionId 
          ? { ...t, amount: numAmount, description: description || CATEGORY_MAP[category], category, type, date: dateTime } 
          : t
      ));
    } else {
      setTransactions([{ id: crypto.randomUUID(), amount: numAmount, description: description || CATEGORY_MAP[category], category, type, date: dateTime }, ...transactions]);
    }
    resetForm();
    setIsAdding(false);
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

  const handleQuickAdd = (cat: Category, tType: TransactionType) => {
    setCategory(cat);
    setType(tType);
    setAmount('');
    setDescription('');
    setDateTime(getDefaultDateTime());
    setEditingTransactionId(null);
    setIsAdding(true);
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('Food');
    setType('expense');
    setDateTime(getDefaultDateTime());
    setEditingTransactionId(null);
  };

  const updateBudget = (cat: Category, limit: string) => {
    const numLimit = parseFloat(limit) || 0;
    if (numLimit === 0) {
      setBudgets(budgets.filter(b => b.category !== cat));
    } else {
      const existing = budgets.find(b => b.category === cat);
      if (existing) {
        setBudgets(budgets.map(b => b.category === cat ? { ...b, limit: numLimit } : b));
      } else {
        setBudgets([...budgets, { category: cat, limit: numLimit }]);
      }
    }
  };

  const handleResetBudgets = () => {
    setBudgets([]);
    setResetBudgetsConfirm(false);
  };

  const cycleCategoryIcon = (cat: Category) => {
    const currentIcon = categoryIcons[cat];
    const currentIndex = ICON_KEYS.indexOf(currentIcon);
    const nextIndex = (currentIndex + 1) % ICON_KEYS.length;
    setCategoryIcons({ ...categoryIcons, [cat]: ICON_KEYS[nextIndex] });
  };

  const handlePickIcon = (iconName: string) => {
    if (iconPickerCategory) {
      setCategoryIcons({ ...categoryIcons, [iconPickerCategory]: iconName });
      setIconPickerCategory(null);
    }
  };

  const CategoryBadge = ({ category, size = 20, className = "", onClick }: { category: Category, size?: number, className?: string, onClick?: () => void }) => {
    const Icon = ICON_POOL[categoryIcons[category]] || MoreHorizontalIcon;
    return (
      <div 
        onClick={(e) => {
          if (onClick) {
            e.stopPropagation();
            onClick();
          }
        }}
        className={`rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-transform active:scale-110 ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`} 
        style={{ backgroundColor: `${CATEGORY_COLORS[category]}15`, color: CATEGORY_COLORS[category] }}
      >
        <Icon size={size} />
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 max-w-lg mx-auto bg-white dark:bg-slate-950 shadow-xl overflow-x-hidden transition-colors duration-300 font-khmer">
      <header className="p-6 bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-normal text-slate-900 dark:text-white font-moul">ទ្រព្យសម្បត្តិ</h1>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">សន្សំលុយ</p>
        </div>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 active:scale-95">
          {isDarkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar">
        {activeTab === 'home' && (
          <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
              <p className="text-indigo-100 text-[10px] mb-1 font-bold uppercase tracking-widest">ទ្រព្យសម្បត្តិសរុប</p>
              <h2 className="text-4xl font-bold mb-1 font-inter">${summary.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
              <p className="text-indigo-100 text-[10px] mb-8 font-bold uppercase tracking-wider">ចំនួនប្រតិបត្តិការសរុប: {transactions.length}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 text-center">
                  <p className="text-[10px] mb-1 font-bold uppercase opacity-70">ចំណូល</p>
                  <p className="text-sm font-bold font-inter">${summary.income.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 text-center">
                  <p className="text-[10px] mb-1 font-bold uppercase opacity-70">សន្សំ</p>
                  <p className="text-sm font-bold font-inter">${summary.saving.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 text-center">
                  <p className="text-[10px] mb-1 font-bold uppercase opacity-70">ចំណាយ</p>
                  <p className="text-sm font-bold font-inter">${summary.expense.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {budgetWarnings.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-rose-600 dark:text-rose-400 px-1 flex items-center gap-2">
                  <AlertCircleIcon size={18} /> ការព្រមានអំពីកញ្ចប់ថវិកា
                </h3>
                <div className="space-y-2">
                  {budgetWarnings.map(w => (
                    <div key={w.category} className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm">{CATEGORY_MAP[w.category]}</span>
                        <span className={`text-[10px] font-bold ${w.percent >= 100 ? 'text-rose-600' : 'text-amber-600'}`}>
                          {w.percent >= 100 ? 'លើសកំណត់' : 'ជិតអស់ហើយ'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${w.percent >= 100 ? 'bg-rose-500' : 'bg-amber-500'}`} 
                          style={{ width: `${Math.min(w.percent, 100)}%` }} 
                        />
                      </div>
                      <p className="text-[10px] mt-1 text-slate-500">ចាយអស់ ${w.spent.toLocaleString()} នៃ ${w.limit.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white px-1">បញ្ចូលរហ័ស</h3>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                {[
                  { label: 'អាហារ', cat: 'Food' as Category },
                  { label: 'ទំនិញ', cat: 'Groceries' as Category },
                  { label: 'ធ្វើដំណើរ', cat: 'Transport' as Category },
                  { label: 'ប្រាក់ខែ', cat: 'Salary' as Category, type: 'income' as TransactionType }
                ].map((item) => (
                  <button 
                    key={item.label}
                    onClick={() => handleQuickAdd(item.cat, item.type || 'expense')}
                    className="flex flex-col items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-[2rem] shadow-sm min-w-[95px] active:scale-95 transition-all border dark:border-slate-800"
                  >
                    <CategoryBadge category={item.cat} size={24} className="w-12 h-12" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-slate-800 dark:text-white">ប្រតិបត្តិការថ្មីៗ</h3>
                <button onClick={() => setActiveTab('history')} className="text-xs text-indigo-600 font-bold uppercase">មើលទាំងអស់</button>
              </div>
              <div className="space-y-3">
                {transactions.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-[1.5rem] border dark:border-slate-800">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <CategoryBadge category={t.category} size={22} className="w-11 h-11" />
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-sm truncate">{t.description}</p>
                          <TypeBadge type={t.type} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(t.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className={`font-bold text-sm font-inter ${t.type === 'income' ? 'text-emerald-600' : t.type === 'saving' ? 'text-blue-600' : 'text-rose-600'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="text-center py-10 text-slate-400 italic text-xs">មិនទាន់មានទិន្នន័យនៅឡើយទេ។</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="p-6 space-y-8 animate-in fade-in slide-in-from-left-4 pb-12">
            <h3 className="text-xl font-bold dark:text-white px-1">មជ្ឈមណ្ឌលវិភាគ</h3>
            
            <div className="h-[280px] w-full bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-6 flex flex-col items-center justify-center border dark:border-slate-800 shadow-sm relative overflow-hidden">
                {categorySpending.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={categorySpending} 
                        innerRadius={65} 
                        outerRadius={85} 
                        paddingAngle={5} 
                        dataKey="value"
                        animationDuration={1000}
                      >
                        {categorySpending.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => `$${Number(value || 0).toLocaleString()}`}
                        labelFormatter={(name: string) => CATEGORY_MAP[name as Category] || name}
                        contentStyle={{ 
                          borderRadius: '1.25rem', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                          fontFamily: 'Battambang, Inter'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 text-xs italic">មិនមានទិន្នន័យគ្រប់គ្រាន់</p>
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase text-slate-400">សរុបចេញ</p>
                    <p className="text-lg font-bold dark:text-white font-inter">${(Number(summary.expense) + Number(summary.saving)).toLocaleString()}</p>
                  </div>
                </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-slate-800 dark:text-white">ចំណាត់ថ្នាក់ចំណាយតាមប្រភេទ</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">ចុចលើរូបដើម្បីប្តូរ</p>
              </div>
              <div className="space-y-3">
                {categorySpending.map((item) => {
                  const budget = budgets.find(b => b.category === item.name);
                  const monthlySpent = currentMonthSpending[item.name] || 0;
                  const isOver = budget && monthlySpent > budget.limit;
                  return (
                    <div key={item.name} className="p-4 bg-white dark:bg-slate-900/50 border dark:border-slate-800 rounded-[1.5rem] shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                          <CategoryBadge 
                            category={item.name} 
                            size={20} 
                            className="w-10 h-10" 
                            onClick={() => setIconPickerCategory(item.name)}
                          />
                          <div>
                            <p className="font-bold text-sm">{CATEGORY_MAP[item.name]}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">
                              {((Number(item.value) / (Number(summary.expense) + Number(summary.saving))) * 100).toFixed(1)}% នៃសរុប
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-sm dark:text-white font-inter">
                          ${Number(item.value).toLocaleString()}
                        </p>
                      </div>
                      {budget && (
                        <div className="mt-2 pt-2 border-t dark:border-slate-800">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-slate-400">ខែនេះ: ${monthlySpent.toLocaleString()}</span>
                            <span className={isOver ? 'text-rose-500 font-bold' : 'text-slate-400'}>
                              កញ្ចប់ថវិកា: ${budget.limit.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-700 ${isOver ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                              style={{ width: `${Math.min((monthlySpent / budget.limit) * 100, 100)}%` }} 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
               <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-1">ចំណូលសរុប</p>
                    <p className="text-xl font-bold dark:text-white font-inter">${summary.income.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-600"><PlusIcon size={24} /></div>
               </div>
               <div className="p-5 bg-rose-50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/20 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 mb-1">ចំណាយសរុប</p>
                    <p className="text-xl font-bold dark:text-white font-inter">${summary.expense.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-rose-500/10 rounded-full text-rose-600"><TrashIcon size={20} /></div>
               </div>
               <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 mb-1">សន្សំសរុប</p>
                    <p className="text-xl font-bold dark:text-white font-inter">${summary.saving.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-full text-blue-600"><PiggyBankIcon size={24} /></div>
               </div>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold dark:text-white">បញ្ជីប្រតិបត្តិការ</h3>
              <button onClick={() => exportTransactionsToPDF(transactions)} className="flex items-center gap-2 p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl font-bold text-[10px] uppercase active:scale-95">
                <DownloadIcon /> ទាញយក PDF
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {(['all', 'income', 'expense', 'saving'] as FilterOption[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterByType(f)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                    filterByType === f 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {f === 'all' ? 'ទាំងអស់' : f === 'income' ? 'ចំណូល' : f === 'saving' ? 'សន្សំ' : 'ចំណាយ'}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[1.5rem] shadow-sm">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <CategoryBadge category={t.category} />
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-sm truncate">{t.description}</p>
                          <TypeBadge type={t.type} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-inter">{new Date(t.date).toLocaleDateString()} {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={`font-bold text-sm font-inter ${t.type === 'income' ? 'text-emerald-600' : t.type === 'saving' ? 'text-blue-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                      </p>
                      <button onClick={() => handleEdit(t)} className="p-2 text-slate-400 active:scale-125 transition-transform"><EditIcon /></button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 text-xs font-medium italic">រកមិនឃើញប្រតិបត្តិការទេ។</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6 space-y-6 animate-in fade-in">
             <h3 className="text-xl font-bold dark:text-white">ការកំណត់កម្មវិធី</h3>
             <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] space-y-6 border dark:border-slate-800 shadow-sm">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                   <MoonIcon size={20} /> <span className="font-bold text-sm">របៀបងងឹត</span>
                 </div>
                 <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-12 h-6 rounded-full transition-all relative ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
                 </button>
               </div>
               
               <div className="pt-4 border-t dark:border-slate-800 space-y-4">
                 <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm">ការកំណត់កញ្ចប់ថវិកា និង រូបតំណាង</h4>
                    <button 
                      onClick={() => setResetBudgetsConfirm(true)}
                      className="text-[9px] font-bold text-rose-600 uppercase border border-rose-100 dark:border-rose-900/20 px-3 py-1.5 rounded-lg active:bg-rose-50"
                    >
                      លុបកញ្ចប់ថវិកាទាំងអស់
                    </button>
                 </div>
                 <p className="text-[10px] text-slate-400 italic">ចុចលើរូបតំណាងដើម្បីប្តូររូបរាង។</p>
                 <div className="space-y-4 max-h-80 overflow-y-auto hide-scrollbar pr-1">
                   {CATEGORIES.map(cat => (
                     <div key={cat} className="flex items-center justify-between gap-4">
                       <div className="flex items-center gap-2 min-w-[120px]">
                         <CategoryBadge category={cat} size={16} className="w-8 h-8" onClick={() => setIconPickerCategory(cat)} />
                         <span className="text-[11px] font-bold truncate">{CATEGORY_MAP[cat]}</span>
                       </div>
                       {cat !== 'Salary' && cat !== 'Investment' && cat !== 'Bonus' && (
                         <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">$</span>
                          <input 
                            type="number" 
                            placeholder="0.00" 
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2 pl-6 pr-3 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                            value={budgets.find(b => b.category === cat)?.limit || ''}
                            onChange={(e) => updateBudget(cat, e.target.value)}
                          />
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               </div>

               <div className="pt-4 border-t dark:border-slate-800">
                 <button onClick={() => setClearDataConfirm(true)} className="w-full py-4 text-rose-600 font-bold text-[10px] uppercase tracking-widest border border-rose-100 dark:border-rose-900/20 rounded-2xl active:bg-rose-50">លុបទិន្នន័យទាំងអស់</button>
               </div>
             </div>
             
             <div className="text-center opacity-30 select-none">
                <p className="text-[10px] font-black uppercase tracking-widest font-inter">WealthWise v1.3</p>
                <p className="text-[10px] mt-1">សន្សំលុយ ដើម្បីអនាគត</p>
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 dark:bg-slate-900/95 border-t dark:border-slate-800 px-6 py-4 flex justify-between items-center z-40 backdrop-blur-xl shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <button onClick={() => setActiveTab('home')} className={`p-2 flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <HomeIcon size={20} /> <span className="text-[9px] font-bold uppercase">ទំព័រដើម</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`p-2 flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <ListIcon size={20} /> <span className="text-[9px] font-bold uppercase">បញ្ជី</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`p-2 flex flex-col items-center gap-1 transition-colors ${activeTab === 'stats' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <ChartIcon size={20} /> <span className="text-[9px] font-bold uppercase">ស្ថិតិ</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`p-2 flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <SettingsIcon size={20} /> <span className="text-[9px] font-bold uppercase">កំណត់</span>
        </button>
      </nav>

      {/* Modal for Icon Picker */}
      {iconPickerCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
          <div className="w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold dark:text-white">ជ្រើសរើសរូបតំណាង</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{CATEGORY_MAP[iconPickerCategory]}</p>
              </div>
              <button onClick={() => setIconPickerCategory(null)} className="p-2 text-slate-400">បិទ</button>
            </div>
            <div className="grid grid-cols-4 gap-4 overflow-y-auto hide-scrollbar p-1 flex-1">
              {ICON_KEYS.map(key => {
                const Icon = ICON_POOL[key];
                const isSelected = categoryIcons[iconPickerCategory] === key;
                return (
                  <button 
                    key={key} 
                    onClick={() => handlePickIcon(key)}
                    className={`aspect-square flex items-center justify-center rounded-2xl transition-all border ${
                      isSelected 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 active:scale-90'
                    }`}
                  >
                    <Icon size={24} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="w-full bg-white dark:bg-slate-900 rounded-[3rem] p-8 animate-in slide-in-from-bottom-full duration-500 max-h-[90vh] overflow-y-auto hide-scrollbar">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold dark:text-white font-khmer">{editingTransactionId ? 'កែសម្រួលទិន្នន័យ' : 'បញ្ចូលទិន្នន័យ'}</h2>
                <button onClick={() => { setIsAdding(false); resetForm(); }} className="p-2 text-slate-400 text-sm">បិទ</button>
             </div>
             <form onSubmit={handleSaveTransaction} className="space-y-4">
               <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                 {(['income', 'saving', 'expense'] as TransactionType[]).map(t => (
                   <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${type === t ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 font-bold' : 'text-slate-500'}`}>
                     {translateType(t)}
                   </button>
                 ))}
               </div>
               
               <div className="space-y-1">
                 <label className="text-[10px] font-bold uppercase text-slate-400 ml-4">ចំនួនទឹកប្រាក់</label>
                 <input autoFocus type="number" step="0.01" placeholder="0.00" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[1.5rem] py-6 px-8 text-3xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-inter" value={amount} onChange={(e) => setAmount(e.target.value)} required />
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-bold uppercase text-slate-400 ml-4">ប្រភេទចំណាយ</label>
                 <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 font-bold outline-none appearance-none" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                   {CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_MAP[cat]}</option>)}
                 </select>
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-bold uppercase text-slate-400 ml-4">ថ្ងៃ និង ម៉ោង</label>
                 <input 
                   type="datetime-local" 
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 outline-none font-medium text-slate-600 dark:text-slate-300 font-inter" 
                   value={dateTime} 
                   onChange={(e) => setDateTime(e.target.value)} 
                   required 
                 />
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-bold uppercase text-slate-400 ml-4">ចំណាំ/ព័ត៌មាន</label>
                 <input type="text" placeholder="ព័ត៌មានបន្ថែម..." className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 outline-none text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
               </div>

               <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all mt-4">រក្សាទុកទិន្នន័យ</button>
             </form>
          </div>
        </div>
      )}

      {clearDataConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 text-center space-y-6">
            <h3 className="text-xl font-bold text-rose-600">លុបទិន្នន័យទាំងអស់?</h3>
            <p className="text-sm text-slate-500">សកម្មភាពនេះនឹងលុបកំណត់ត្រាទាំងអស់ចេញពីឧបករណ៍របស់អ្នកជារៀងរហូត។</p>
            <div className="flex gap-3">
              <button onClick={() => setClearDataConfirm(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold">បោះបង់</button>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold">លុបឥឡូវនេះ</button>
            </div>
          </div>
        </div>
      )}

      {resetBudgetsConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 text-center space-y-6">
            <h3 className="text-xl font-bold text-rose-600">លុបកញ្ចប់ថវិកាទាំងអស់?</h3>
            <p className="text-sm text-slate-500">សកម្មភាពនេះនឹងលុបការកំណត់កញ្ចប់ថវិកាប្រចាំខែទាំងអស់ដែលអ្នកបានកំណត់។</p>
            <div className="flex gap-3">
              <button onClick={() => setResetBudgetsConfirm(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold">បោះបង់</button>
              <button onClick={handleResetBudgets} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold">យល់ព្រម</button>
            </div>
          </div>
        </div>
      )}

      {!isAdding && <button onClick={() => setIsAdding(true)} className="fixed bottom-24 right-8 w-16 h-16 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-2xl z-40 active:rotate-90 transition-all"><PlusIcon /></button>}
    </div>
  );
};

export default App;