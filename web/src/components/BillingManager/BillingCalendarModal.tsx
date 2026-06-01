import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

// Defining it here locally to avoid circular imports.
export type TransactionType = 'income' | 'expense';
export interface Transaction {
  id: string | number;
  type: TransactionType;
  categoryId: string;
  amount: number;
  date: string;
  note: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

export function BillingCalendarModal({ isOpen, onClose, transactions }: Props) {
  const theme = useAppStore(s => s.theme);
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const { days, blanks } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    // Group transactions by day
    const dailyData: Record<number, { income: number; expense: number }> = {};
    for (let i = 1; i <= daysInMonth; i++) {
        dailyData[i] = { income: 0, expense: 0 };
    }

    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (t.type === 'income') dailyData[day].income += t.amount;
        if (t.type === 'expense') dailyData[day].expense += t.amount;
      }
    });

    const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return {
            day,
            income: dailyData[day].income,
            expense: dailyData[day].expense
        };
    });

    return { days, blanks };
  }, [transactions, year, month]);

  const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className={`absolute inset-0 backdrop-blur-md ${theme === 'dark' ? 'bg-black/60' : 'bg-slate-900/40'}`} />
          
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`relative w-full max-w-4xl p-6 rounded-[2rem] border shadow-2xl flex flex-col h-[85vh] md:h-[75vh] ${theme === 'dark' ? 'bg-[#151822] border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                财务年月历
              </h3>
              <button onClick={onClose} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {year} <span className={theme === 'dark' ? 'text-slate-400 font-bold' : 'text-slate-500 font-bold'}>/ {String(month + 1).padStart(2, '0')}</span>
              </h2>
              <div className={`flex items-center gap-2 p-1 rounded-2xl border shadow-inner ${theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-slate-100/50 border-slate-200'}`}>
                 <button onClick={prevMonth} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-white hover:shadow-sm text-slate-700'}`}>
                   <ChevronLeft className="w-6 h-6" />
                 </button>
                 <button onClick={nextMonth} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-white hover:shadow-sm text-slate-700'}`}>
                   <ChevronRight className="w-6 h-6" />
                 </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[300px]">
              {/* Force minimum rows based on weeks */}
              <div className="grid grid-cols-7 gap-2 min-h-full pb-4">
                {/* Day Headers */}
                {WEEK_DAYS.map((w, i) => (
                  <div key={w} className={`text-center font-extrabold text-sm py-2 mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} ${(i === 0 || i === 6) ? 'text-rose-500/70' : ''}`}>
                    {w}
                  </div>
                ))}
                
                {/* Blank Cells */}
                {blanks.map(b => (
                  <div key={`blank-${b}`} className={`rounded-3xl p-3 border border-transparent ${theme === 'dark' ? 'bg-white/[0.02]' : 'bg-slate-50/50'}`} />
                ))}

                {/* Day Cells */}
                {days.map(d => {
                  const isToday = new Date().toDateString() === new Date(year, month, d.day).toDateString();
                  const hasData = d.income > 0 || d.expense > 0;
                  return (
                    <div key={d.day} className={`relative flex flex-col justify-start rounded-3xl p-3 border transition-all duration-300 aspect-square sm:aspect-auto ${isToday ? (theme === 'dark' ? 'bg-orange-500/20 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.15)]' : 'bg-orange-50 border-orange-200 shadow-sm') : (hasData ? (theme === 'dark' ? 'bg-white/[0.04] border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 shadow-sm hover:shadow-md') : (theme === 'dark' ? 'bg-transparent border-white/5' : 'bg-slate-50/30 border-slate-100'))}`}>
                      <span className={`text-sm sm:text-base font-extrabold w-8 h-8 flex items-center justify-center rounded-xl mb-2 flex-shrink-0 ${isToday ? 'bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-lg shadow-orange-500/30' : (theme === 'dark' ? 'text-slate-400' : 'text-slate-600')}`}>
                        {d.day}
                      </span>
                      <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
                        {d.income > 0 && (
                          <div className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-black tracking-tight ${theme === 'dark' ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
                            +{d.income.toLocaleString()}
                          </div>
                        )}
                        {d.expense > 0 && (
                          <div className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-black tracking-tight ${theme === 'dark' ? 'bg-slate-500/20 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                            -{d.expense.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
