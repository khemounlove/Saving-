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
import { getFinancialInsights } from './services/geminiService';

const CATEGORIES: Category[] = [
  'Food', 'Groceries', 'Dining Out', 'Transport', 'Fuel', 'Gasoline', 'Rent', 'Utilities', 
  'Housing', 'Shopping', 'Entertainment', 'Subscriptions', 'Phone Card', 'Health', 'Personal Care', 
  'Education', 'Travel', 'Maintenance', 'Insurance', 'Pets', 'Parents', 'Taxes', 'Loans',
  'Salary', 'Investment', 'Savings', 'Bonus', 'Donations', 'Gift', 'Other'
];

const ICON_POOL: Record<string, (props: { size?: number }) => React.JSX.Element> = {
  Utensils: UtensilsIcon, Car: CarIcon, ShoppingBag: ShoppingBagIcon, Film: FilmIcon,
  Activity: ActivityIcon, Briefcase: BriefcaseIcon, Gift: GiftIcon, More: MoreHorizontalIcon,
  Home: HomeIcon, Coffee: CoffeeIcon, Fuel: FuelIcon, Gasoline: FuelIcon,
  Smartphone: SmartphoneIcon, Book: BookIcon, Heart: HeartIcon, Zap: ZapIcon,
  Music: MusicIcon, Wallet: WalletIcon, Shield: ShieldIcon, Globe: GlobeIcon,
  Plane: PlaneIcon, Paw: PawIcon, Bank: BankIcon, Star: StarIcon, User: UserIcon,
  PiggyBank: PiggyBankIcon,
};

const DEFAULT_ICONS: Record<Category, string> = {
  Food: 'Utensils', Groceries: 'ShoppingBag', 'Dining Out': 'Coffee', Transport: 'Car',
  Fuel: 'Fuel', Gasoline: 'Gasoline', Rent: 'Home', Utilities: 'Zap',
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
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('wealthwise_darkmode');
    return saved === 'true';
  });

  const [categoryIcons, setCategoryIcons] = useState<Record<Category, string>>(() => {
    const saved = localStorage.getItem('wealthwise_category_icons');
    return saved ? JSON.parse(saved) : DEFAULT_ICONS;
  });

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
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('wealthwise_darkmode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('wealthwise_transactions');
    if (saved) {
      try { setTransactions(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wealthwise_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const summary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const saving = transactions.filter(t => t.type === 'saving').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, saving, balance: income - expense - saving };
  }, [transactions]);

  const handleAiInsight = async () => {
    setIsAiLoading(true);
    try {
      const insight = await getFinancialInsights(transactions);
      setAiInsight(insight);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount)) return;

    if (editingTransactionId) {
      setTransactions(transactions.map(t => 
        t.id === editingTransactionId 
          ? { ...t, amount: numAmount, description: description || category, category, type, date: dateTime } 
          : t
      ));
    } else {
      setTransactions([{ id: crypto.randomUUID(), amount: numAmount, description: description || category, category, type, date: dateTime }, ...transactions]);
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

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('Food');
    setType('expense');
    setDateTime(getDefaultDateTime());
    setEditingTransactionId(null);
  };

  const CategoryBadge = ({ category, size = 20, className = "" }: { category: Category, size?: number, className?: string }) => {
    const Icon = ICON_POOL[categoryIcons[category]] || MoreHorizontalIcon;
    return (
      <div className={`rounded-xl flex items-center justify-center shadow-sm shrink-0 ${className}`} style={{ backgroundColor: `${CATEGORY_COLORS[category]}15`, color: CATEGORY_COLORS[category] }}>
        <Icon size={size} />
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 max-w-lg mx-auto bg-white dark:bg-slate-950 shadow-xl overflow-x-hidden transition-colors duration-300 font-inter">
      <header className="p-6 bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">WealthWise</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Global Wealth Ledger</p>
        </div>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 active:scale-95">
          {isDarkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar">
        {activeTab === 'home' && (
          <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
              <p className="text-indigo-100 text-[10px] mb-1 font-black uppercase tracking-widest">Available Assets</p>
              <h2 className="text-4xl font-bold mb-8">${summary.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 text-center">
                  <p className="text-[10px] mb-1 font-black uppercase opacity-70">Inflow</p>
                  <p className="text-sm font-bold">${summary.income.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 text-center">
                  <p className="text-[10px] mb-1 font-black uppercase opacity-70">Saved</p>
                  <p className="text-sm font-bold">${summary.saving.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 text-center">
                  <p className="text-[10px] mb-1 font-black uppercase opacity-70">Outflow</p>
                  <p className="text-sm font-bold">${summary.expense.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-white">Recent Logs</h3>
                <button onClick={() => setActiveTab('history')} className="text-xs text-indigo-600 font-bold uppercase">View All</button>
              </div>
              {transactions.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem]">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <CategoryBadge category={t.category} size={22} className="w-11 h-11" />
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm truncate">{t.description}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase">{t.type}</p>
                    </div>
                  </div>
                  <div className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-600' : t.type === 'saving' ? 'text-blue-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="p-6 space-y-6 animate-in fade-in slide-in-from-left-4">
            <h3 className="text-xl font-bold dark:text-white">Analytics Center</h3>
            
            <div className="bg-slate-900 dark:bg-indigo-900/20 p-6 rounded-[2.5rem] border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">AI Advisor (Gemini 3)</p>
                <button onClick={handleAiInsight} disabled={isAiLoading} className="p-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 disabled:opacity-50">
                  {isAiLoading ? "Thinking..." : "Regenerate Tips"}
                </button>
              </div>
              {isAiLoading ? (
                <div className="space-y-3 animate-pulse-slow">
                  <div className="h-4 bg-slate-800 rounded w-full"></div>
                  <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                </div>
              ) : aiInsight ? (
                <div className="text-xs text-slate-300 leading-relaxed font-medium bg-black/20 p-4 rounded-2xl whitespace-pre-line border border-white/5">
                  {aiInsight}
                </div>
              ) : (
                <div className="text-center py-4">
                   <button onClick={handleAiInsight} className="text-indigo-400 text-xs font-bold uppercase underline">Run AI Financial Analysis</button>
                </div>
              )}
            </div>

            <div className="h-[300px] w-full bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-6 flex flex-col items-center justify-center border dark:border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={Object.entries(transactions.reduce((acc, t) => { if (t.type !== 'income') acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {} as any)).map(([name, value]) => ({ name, value }))} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {transactions.map((_, index) => <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[CATEGORIES[index % CATEGORIES.length]]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="p-6 space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold dark:text-white">Full Ledger</h3>
              <button onClick={() => exportTransactionsToPDF(transactions)} className="flex items-center gap-2 p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl font-black text-[10px] uppercase">
                <DownloadIcon /> Export PDF
              </button>
            </div>
            <div className="space-y-3">
              {transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[1.5rem] shadow-sm">
                  <div className="flex items-center gap-4">
                    <CategoryBadge category={t.category} />
                    <div>
                      <p className="font-bold text-sm">{t.description}</p>
                      <p className="text-[10px] text-slate-400">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>${t.amount.toLocaleString()}</p>
                    <button onClick={() => handleEdit(t)} className="p-2 text-slate-400"><EditIcon /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6 space-y-6 animate-in fade-in">
             <h3 className="text-xl font-bold dark:text-white">App Config</h3>
             <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] space-y-6 border dark:border-slate-800">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <MoonIcon /> <span className="font-bold">Dark Environment</span>
                 </div>
                 <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-12 h-6 rounded-full transition-all relative ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
                 </button>
               </div>
               <button onClick={() => setClearDataConfirm(true)} className="w-full py-4 text-rose-600 font-black text-[10px] uppercase tracking-widest border border-rose-100 rounded-2xl active:bg-rose-50">Wipe Local Database</button>
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 dark:bg-slate-900/95 border-t dark:border-slate-800 px-6 py-4 flex justify-between items-center z-40 backdrop-blur-xl">
        <button onClick={() => setActiveTab('home')} className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <HomeIcon size={20} /> <span className="text-[9px] font-black uppercase">Home</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'history' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <ListIcon size={20} /> <span className="text-[9px] font-black uppercase">Logs</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'stats' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <ChartIcon size={20} /> <span className="text-[9px] font-black uppercase">Stats</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <SettingsIcon size={20} /> <span className="text-[9px] font-black uppercase">App</span>
        </button>
      </nav>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="w-full bg-white dark:bg-slate-900 rounded-[3rem] p-8 animate-in slide-in-from-bottom-full duration-500">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold dark:text-white">Record Transaction</h2>
                <button onClick={() => { setIsAdding(false); resetForm(); }} className="p-2 text-slate-400">Close</button>
             </div>
             <form onSubmit={handleSaveTransaction} className="space-y-4">
               <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                 {(['income', 'saving', 'expense'] as TransactionType[]).map(t => (
                   <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === t ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>{t}</button>
                 ))}
               </div>
               <input autoFocus type="number" step="0.01" placeholder="0.00" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[1.5rem] py-6 px-8 text-3xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={amount} onChange={(e) => setAmount(e.target.value)} required />
               <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 font-bold outline-none" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                 {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
               </select>
               <input type="text" placeholder="Add details..." className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 outline-none" value={description} onChange={(e) => setDescription(e.target.value)} />
               <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Commit Entry</button>
             </form>
          </div>
        </div>
      )}

      {clearDataConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 text-center space-y-6">
            <h3 className="text-xl font-bold text-rose-600">Erase All Data?</h3>
            <p className="text-sm text-slate-500">This action will permanently delete all records from your device.</p>
            <div className="flex gap-3">
              <button onClick={() => setClearDataConfirm(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold">Cancel</button>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold">Wipe Now</button>
            </div>
          </div>
        </div>
      )}

      {!isAdding && <button onClick={() => setIsAdding(true)} className="fixed bottom-24 right-8 w-16 h-16 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-2xl z-40 active:rotate-90 transition-all"><PlusIcon /></button>}
    </div>
  );
};

export default App;