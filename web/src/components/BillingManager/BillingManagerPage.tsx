import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { ArrowLeft, Wallet, Plus, TrendingDown, TrendingUp, X, Filter, Trash2, Banknote, Calendar } from 'lucide-react';
import { BillingCalendarModal } from './BillingCalendarModal';
import { getBillingList, createBilling, deleteBilling } from '@/api/billing';

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: number | string; // Changed from just string to support backend uint ID
  type: TransactionType;
  categoryId: string;
  amount: number;
  date: string; // ISO string or simple YYYY-MM-DD string
  note: string;
}

interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
  textColor: string;
  bgColor: string;
}

const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', label: '餐饮美食', emoji: '🍔', color: 'from-orange-400 to-rose-400', textColor: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { id: 'transport', label: '交通出行', emoji: '🚗', color: 'from-blue-400 to-indigo-400', textColor: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { id: 'shopping', label: '购物消费', emoji: '🛍️', color: 'from-pink-400 to-rose-400', textColor: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  { id: 'housing', label: '房租水电', emoji: '🏠', color: 'from-purple-400 to-fuchsia-400', textColor: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { id: 'fun', label: '娱乐休闲', emoji: '🎮', color: 'from-cyan-400 to-blue-400', textColor: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  { id: 'other', label: '其他支出', emoji: '📝', color: 'from-slate-400 to-gray-400', textColor: 'text-slate-500', bgColor: 'bg-slate-500/10' }
];

const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', label: '本职薪金', emoji: '💰', color: 'from-emerald-400 to-teal-400', textColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { id: 'invest', label: '理财收益', emoji: '📈', color: 'from-teal-400 to-cyan-400', textColor: 'text-teal-500', bgColor: 'bg-teal-500/10' },
  { id: 'bonus', label: '奖金兼职', emoji: '🎁', color: 'from-amber-400 to-orange-400', textColor: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { id: 'other_in', label: '其他收入', emoji: '💵', color: 'from-slate-400 to-gray-400', textColor: 'text-slate-500', bgColor: 'bg-slate-500/10' }
];

const ALL_CATEGORIES_MAP = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].reduce((acc, cat) => {
  acc[cat.id] = cat;
  return acc;
}, {} as Record<string, Category>);

export default function BillingManagerPage() {
  const navigate = useNavigate();
  const theme = useAppStore(state => state.theme);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter State (Strict Two-Dropdowns)
  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthStr = (new Date().getMonth() + 1).toString();
  
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // Custom Range State
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');

  // New Transaction Form State
  const [newType, setNewType] = useState<TransactionType>('expense');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [newNote, setNewNote] = useState('');

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    const currentY = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
        years.add((currentY - i).toString());
    }
    transactions.forEach(t => {
      if (t.date) {
        years.add(new Date(t.date).getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [transactions]);

  // Read From Backend
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await getBillingList();
        if (res.code === 0 && res.data) {
          setTransactions(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch billing data", err);
      }
    };
    fetchTransactions();
  }, []);

  // Computations
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      const tTime = d.getTime();

      // Custom Range precedence
      if (customStartDate || customEndDate) {
        let pass = true;
        if (customStartDate) {
          const sDate = new Date(customStartDate);
          sDate.setHours(0, 0, 0, 0);
          if (tTime < sDate.getTime()) pass = false;
        }
        if (customEndDate) {
          const eDate = new Date(customEndDate);
          eDate.setHours(23, 59, 59, 999);
          if (tTime > eDate.getTime()) pass = false;
        }
        return pass;
      }

      // Normal Dropdown Mode
      if (selectedYear !== 'all' && d.getFullYear().toString() !== selectedYear) return false;
      if (selectedMonth !== 'all' && (d.getMonth() + 1).toString() !== selectedMonth) return false;
      
      return true;
    });
  }, [transactions, selectedYear, selectedMonth, customStartDate, customEndDate]);

  const { totalIncome, totalExpense, balance, expenseBreakdown } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const categoryTotals: Record<string, number> = {};

    filteredTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else {
        expense += t.amount;
        categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
      }
    });

    const breakdown = Object.keys(categoryTotals).map(catId => ({
      categoryId: catId,
      amount: categoryTotals[catId],
      percent: expense > 0 ? (categoryTotals[catId] / expense) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);

    return { totalIncome: income, totalExpense: expense, balance: income - expense, expenseBreakdown: breakdown };
  }, [filteredTransactions]);

  const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || isNaN(Number(newAmount)) || Number(newAmount) <= 0) return;

    try {
      const res = await createBilling({
        type: newType,
        categoryId: newCategory,
        amount: Number(newAmount),
        note: newNote || (newType === 'expense' ? '日常开销' : '收入明细')
      });
      if (res.code === 0 && res.data) {
        setTransactions([res.data, ...transactions]);
        setIsModalOpen(false);
        setNewAmount('');
        setNewNote('');
      }
    } catch (err) {
      console.error("Create transaction failed:", err);
    }
  };

  const handleDelete = async (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await deleteBilling(id);
      if (res.code === 0) {
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error("Delete transaction failed:", err);
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 2 });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 overflow-hidden relative ${theme === 'dark' ? 'bg-[#0F111A] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      {/* Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-rose-500/10 blur-[120px] pointer-events-none mix-blend-screen" />

      {/* Header */}
      <header className={`h-20 shrink-0 border-b flex items-center justify-between px-8 z-10 ${theme === 'dark' ? 'bg-[#11131C]/90 border-white/5 backdrop-blur-xl' : 'bg-white/90 border-slate-200 backdrop-blur-xl'} shadow-sm`}>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/')}
            className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500">
              <Wallet className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-500">
              记账管理
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsCalendarModalOpen(true)}
            className={`flex items-center gap-2 h-11 px-5 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-md shrink-0 ${theme === 'dark' ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' : 'bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm'}`}
          >
            <Calendar className="w-5 h-5" /> 财务日历
          </button>
          
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 h-11 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 shrink-0">
            <Plus className="w-5 h-5" /> 记一笔
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative z-10 w-full max-w-7xl mx-auto flex flex-col gap-8">
        {/* Unified Time Control Panel */}
        <div className={`p-4 flex flex-col md:flex-row items-center gap-4 rounded-3xl border backdrop-blur-xl transition-all ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
          <button 
            onClick={() => {
              setTempStart(customStartDate);
              setTempEnd(customEndDate);
              setIsDateModalOpen(true);
            }}
            className={`flex items-center gap-3 px-3 py-2 -ml-2 rounded-2xl transition-all group ${theme === 'dark' ? 'hover:bg-indigo-500/10' : 'hover:bg-indigo-50'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'bg-white/5 text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
              <Calendar className="w-5 h-5" />
            </div>
            <span className={`font-bold text-sm hidden sm:inline-block whitespace-nowrap transition-colors ${theme === 'dark' ? 'group-hover:text-indigo-400' : 'group-hover:text-indigo-600'}`}>高级区间筛选</span>
          </button>
          
          <div className="flex-1" />

          {/* Two Dropdowns or Custom Date Pill */}
          <div className="flex flex-nowrap items-center gap-2 w-full md:w-auto">
            {(customStartDate || customEndDate) ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`flex items-center h-10 pl-4 pr-1.5 rounded-xl border text-sm font-bold shadow-sm ${theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                <span>{customStartDate || '最初'} ⭢ {customEndDate || '最新'}</span>
                <button 
                  onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                  className={`ml-3 p-1.5 rounded-lg opacity-80 hover:opacity-100 transition-all ${theme === 'dark' ? 'hover:bg-indigo-500/20 hover:text-white' : 'hover:bg-indigo-200 hover:text-indigo-900'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className={`min-w-[120px] h-10 px-4 rounded-xl border text-sm font-bold outline-none transition-all cursor-pointer appearance-none ${selectedYear !== 'all' ? (theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-400/50 text-emerald-600 shadow-sm') : (theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600')}`}
                >
                  <option value="all" className={theme === 'dark' ? 'bg-[#0F111A]' : 'bg-white'}>全部年份</option>
                  {availableYears.map(y => (
                    <option key={y} value={y} className={theme === 'dark' ? 'bg-[#0F111A]' : 'bg-white'}>{y}年</option>
                  ))}
                </select>

                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className={`min-w-[100px] h-10 px-4 rounded-xl border text-sm font-bold outline-none transition-all cursor-pointer appearance-none ${selectedMonth !== 'all' ? (theme === 'dark' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-400/50 text-cyan-600 shadow-sm') : (theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600')}`}
                >
                  <option value="all" className={theme === 'dark' ? 'bg-[#0F111A]' : 'bg-white'}>全部月份</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m.toString()} className={theme === 'dark' ? 'bg-[#0F111A]' : 'bg-white'}>{m}月</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-3xl relative overflow-hidden backdrop-blur-xl border ${theme === 'dark' ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200 shadow-xl shadow-slate-200'}`}>
            <div className={`flex items-center justify-between mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="font-semibold text-sm">当月总支出</span>
              <div className="p-2 rounded-xl bg-slate-500/10"><TrendingDown className="w-5 h-5" /></div>
            </div>
            <div className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-black'}`}>{formatCurrency(totalExpense)}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`p-6 rounded-3xl relative overflow-hidden backdrop-blur-xl border ${theme === 'dark' ? 'bg-rose-500/5 border-rose-500/10' : 'bg-white border-rose-100 shadow-xl shadow-rose-500/5'}`}>
            <div className={`flex items-center justify-between mb-4 ${theme === 'dark' ? 'text-rose-400/80' : 'text-rose-500/80'}`}>
              <span className="font-semibold text-sm">当月总收入</span>
              <div className="p-2 rounded-xl bg-rose-500/10"><TrendingUp className="w-5 h-5" /></div>
            </div>
            <div className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`}>{formatCurrency(totalIncome)}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`p-6 rounded-3xl relative overflow-hidden backdrop-blur-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-[#1E293B] border-slate-700 shadow-2xl'}`}>
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className={`flex items-center justify-between mb-4 text-slate-300`}>
              <span className="font-semibold text-sm">当月结余</span>
              <div className="p-2 rounded-xl bg-white/10"><Banknote className="w-5 h-5" /></div>
            </div>
            <div className={`text-3xl md:text-4xl font-bold ${balance >= 0 ? (theme === 'dark' ? 'text-rose-400' : 'text-rose-500') : (theme === 'dark' ? 'text-slate-200' : 'text-black')}`}>{balance >= 0 ? '+' : ''}{formatCurrency(balance)}</div>
          </motion.div>
        </div>

        {/* Content Split */}
        <div className="flex flex-col lg:flex-row gap-8 min-h-0 relative">
          {/* Left: Analytics */}
          <div className={`w-full lg:w-1/3 flex flex-col p-6 rounded-3xl border backdrop-blur-xl ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-500" />
              支出分类占比
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
              {expenseBreakdown.length > 0 ? expenseBreakdown.map((item, idx) => {
                const cat = ALL_CATEGORIES_MAP[item.categoryId];
                return (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }} key={item.categoryId} className="flex flex-col gap-2 relative group">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 font-medium">
                        <span className={`w-8 h-8 rounded-full flex justify-center items-center ${cat.bgColor}`}>{cat.emoji}</span>
                        {cat.label}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(item.amount)}</div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{item.percent.toFixed(1)}%</div>
                      </div>
                    </div>
                    {/* Progress Bar Container */}
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percent}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full bg-gradient-to-r ${cat.color}`}
                      />
                    </div>
                  </motion.div>
                );
              }) : (
                <div className={`text-center py-10 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  暂无支出记录
                </div>
              )}
            </div>
          </div>

          {/* Right: Timeline */}
          <div className={`w-full lg:w-2/3 flex flex-col p-6 rounded-3xl border backdrop-blur-xl ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              交易流水
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence>
                {sortedTransactions.length > 0 ? sortedTransactions.map(tx => {
                  const cat = ALL_CATEGORIES_MAP[tx.categoryId];
                  const isIncome = tx.type === 'income';
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`group flex items-center justify-between p-4 mb-3 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${cat.bgColor}`}>
                          {cat.emoji}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[15px]">{cat.label}</span>
                          <span className={`text-xs mt-0.5 line-clamp-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{tx.note || '无备注'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                          <span className={`font-bold text-lg ${isIncome ? (theme === 'dark' ? 'text-rose-400' : 'text-rose-500') : (theme === 'dark' ? 'text-slate-200' : 'text-slate-800')}`}>
                            {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                          <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{formatDate(tx.date)}</span>
                        </div>
                        <button onClick={(e) => handleDelete(tx.id as number | string, e)} className={`opacity-0 group-hover:opacity-100 p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-rose-500/20 text-slate-500 hover:text-rose-400' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-500'}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div className={`h-40 flex items-center justify-center ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    还没有任何流水记录哦~
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className={`absolute inset-0 backdrop-blur-sm ${theme === 'dark' ? 'bg-black/60' : 'bg-slate-900/20'}`} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`relative w-full max-w-md p-6 rounded-[2rem] border overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-[#151822] border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">记一笔账</h3>
                <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col gap-6">
                {/* Type Toggle */}
                <div className={`flex rounded-2xl p-1 border ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                  <button type="button" onClick={() => { setNewType('expense'); setNewCategory(EXPENSE_CATEGORIES[0].id); }} className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${newType === 'expense' ? (theme === 'dark' ? 'bg-slate-700 text-white shadow-lg' : 'bg-slate-900 text-white shadow-sm') : 'text-slate-500 hover:text-slate-400'}`}>
                    支出
                  </button>
                  <button type="button" onClick={() => { setNewType('income'); setNewCategory(INCOME_CATEGORIES[0].id); }} className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${newType === 'income' ? (theme === 'dark' ? 'bg-rose-500 text-white shadow-lg' : 'bg-white text-rose-500 shadow-sm') : 'text-slate-500 hover:text-slate-400'}`}>
                    收入
                  </button>
                </div>

                {/* Amount Input */}
                <div>
                  <div className={`flex items-center px-4 h-16 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 focus-within:border-emerald-500 focus-within:bg-white/10' : 'bg-slate-50 border-slate-200 focus-within:border-emerald-500 focus-within:bg-white'}`}>
                    <span className="text-2xl font-bold mr-2">¥</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="w-full h-full bg-transparent border-none outline-none text-2xl font-bold placeholder-slate-300 dark:placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Categories Grid */}
                <div>
                  <div className="text-sm font-semibold mb-3">选择分类</div>
                  <div className="grid grid-cols-4 gap-3">
                    {(newType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewCategory(cat.id)}
                        className={`flex flex-col items-center justify-center py-3 gap-1 rounded-2xl transition-all border ${newCategory === cat.id ? (theme === 'dark' ? 'bg-white/10 border-white/20' : 'bg-slate-100 border-slate-300 shadow-sm') : (theme === 'dark' ? 'bg-transparent border-transparent hover:bg-white/5' : 'bg-transparent border-transparent hover:bg-slate-50')}`}
                      >
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-1 ${newCategory === cat.id ? cat.bgColor : (theme === 'dark' ? 'bg-white/5' : 'bg-slate-50')}`}>
                          {cat.emoji}
                        </span>
                        <span className={`text-xs ${newCategory === cat.id ? 'font-bold' : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}`}>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note Input */}
                <div className={`flex items-center px-4 h-12 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 focus-within:border-white/20' : 'bg-slate-50 border-slate-200 focus-within:border-slate-300'}`}>
                  <input
                    type="text"
                    placeholder="写点备注吧..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full h-full bg-transparent border-none outline-none text-sm"
                  />
                </div>

                {/* Submit */}
                <button type="submit" className={`w-full h-12 mt-2 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 ${newType === 'expense' ? 'bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 shadow-slate-900/25' : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 shadow-rose-500/25'}`}>
                  保存记录
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Custom Date Range Modal */}
        {isDateModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDateModalOpen(false)} className={`absolute inset-0 backdrop-blur-sm ${theme === 'dark' ? 'bg-black/60' : 'bg-slate-900/20'}`} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`relative w-full max-w-xs p-6 rounded-[2rem] border shadow-2xl ${theme === 'dark' ? 'bg-[#151822] border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" /> 高级区间筛选
                </h3>
                <button onClick={() => setIsDateModalOpen(false)} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <label className={`text-xs font-bold mb-2 block uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>起始日期 (From)</label>
                  <input 
                    type="date" 
                    value={tempStart} 
                    onChange={e => setTempStart(e.target.value)} 
                    className={`w-full h-12 px-4 rounded-xl border text-sm font-medium outline-none transition-all cursor-pointer ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-300 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-indigo-500'}`} 
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold mb-2 block uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>结束日期 (To)</label>
                  <input 
                    type="date" 
                    value={tempEnd} 
                    onChange={e => setTempEnd(e.target.value)} 
                    className={`w-full h-12 px-4 rounded-xl border text-sm font-medium outline-none transition-all cursor-pointer ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-300 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-indigo-500'}`} 
                  />
                </div>
                
                <button 
                  onClick={() => {
                    setCustomStartDate(tempStart);
                    setCustomEndDate(tempEnd);
                    setIsDateModalOpen(false);
                  }}
                  className="mt-4 w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/25"
                >
                  应用区间过滤
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Calendar Modal */}
      <BillingCalendarModal 
        isOpen={isCalendarModalOpen} 
        onClose={() => setIsCalendarModalOpen(false)} 
        transactions={transactions} 
      />
    </div>
  );
}
