import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Languages, Search, Plus, Trash2, X, Check,
  Volume2, Copy, Download, BookOpen, AlertCircle, CalendarPlus, Calendar
} from 'lucide-react';
import { getEnglishWordList, createEnglishWord, updateEnglishWord, deleteEnglishWord } from '@/api/english';

// ─── Types ───────────────────────────
export interface WordItem {
  id: number;
  word: string;
  meaning: string;
  phrase: string;
  phraseTranslation: string;
  link: string;
  date: string;
  mastery: 0 | 1 | 2; // 0=生词 1=熟悉 2=掌握
}

const MASTERY_STYLES = [
  { dot: 'bg-rose-400', glow: 'shadow-rose-400/40', label: '生词', ring: 'ring-rose-400/30' },
  { dot: 'bg-amber-400', glow: 'shadow-amber-400/40', label: '熟悉', ring: 'ring-amber-400/30' },
  { dot: 'bg-emerald-400', glow: 'shadow-emerald-400/40', label: '掌握', ring: 'ring-emerald-400/30' },
];
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// ─── Inline EditableCell ─────────────
function EditableCell({
  value, onChange, placeholder = '', isMultiline = false, className = '',
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  isMultiline?: boolean; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => { setEditing(false); if (draft !== value) onChange(draft); };

  if (editing) {
    const cls = `w-full bg-white/[0.04] border border-rose-500/30 rounded-lg px-2.5 py-1.5 outline-none text-sm text-slate-200 focus:ring-1 focus:ring-rose-500/20 transition-all`;
    return isMultiline ? (
      <textarea ref={ref as any} value={draft} onChange={e => setDraft(e.target.value)}
        onBlur={commit} onKeyDown={e => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        rows={2} className={`${cls} resize-none leading-relaxed`} />
    ) : (
      <input ref={ref as any} type="text" value={draft} onChange={e => setDraft(e.target.value)}
        onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className={cls} />
    );
  }

  return (
    <div onClick={() => setEditing(true)}
      className={`cursor-text min-h-[22px] text-sm leading-relaxed rounded px-0.5 hover:bg-white/[0.03] transition-colors ${className} ${!value ? 'text-slate-600 italic' : ''}`}
    >{value || placeholder}</div>
  );
}

// ─── Mastery Dot ─────────────────────
function MasteryDot({ level, onClick }: { level: 0 | 1 | 2; onClick: () => void }) {
  const s = MASTERY_STYLES[level];
  return (
    <button onClick={onClick} title={`${s.label}（点击切换）`}
      className={`w-3 h-3 rounded-full ${s.dot} shadow-md ${s.glow} ring-2 ${s.ring} hover:scale-125 transition-all flex-shrink-0`}
    />
  );
}

// ─── Main ────────────────────────────
export default function EnglishManagerPage() {
  const navigate = useNavigate();
  const [words, setWords] = useState<WordItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isAddingRow, setIsAddingRow] = useState(false);

  const [nWord, setNWord] = useState('');
  const [nMeaning, setNMeaning] = useState('');
  const [nPhrase, setNPhrase] = useState('');
  const [nPhraseTr, setNPhraseTr] = useState('');
  const [nLink, setNLink] = useState('');
  const wordRef = useRef<HTMLInputElement>(null);

  const loadDataFromApi = async () => {
    try {
      const res: any = await getEnglishWordList();
      if (res.code === 0) {
        setWords(res.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadDataFromApi(); }, []);

  // ─── Stats ───────────────────
  const stats = useMemo(() => {
    const mastered = words.filter(w => w.mastery === 2).length;
    const learning = words.filter(w => w.mastery === 1).length;
    const needReview = words.length - mastered; // 生词 + 熟悉 = 待复习
    // 本周新增：计算本周一到现在新增的单词数
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // 周日=7
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    monday.setHours(0, 0, 0, 0);
    const weekDates: string[] = [];
    for (let d = new Date(monday); d <= now; d.setDate(d.getDate() + 1)) {
      weekDates.push(`${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`);
    }
    const thisWeek = words.filter(w => weekDates.includes(w.date)).length;
    return { total: words.length, mastered, learning, neww: words.length - mastered - learning, needReview, thisWeek };
  }, [words]);

  // ─── Filter ──────────────────
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return words;
    const q = searchQuery.toLowerCase();
    return words.filter(w =>
      w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q) ||
      w.phrase.toLowerCase().includes(q) || w.phraseTranslation.toLowerCase().includes(q)
    );
  }, [words, searchQuery]);

  // ─── Group by date ───────────
  const grouped = useMemo(() => {
    const map = new Map<string, WordItem[]>();
    filtered.forEach(w => {
      const g = map.get(w.date) || [];
      g.push(w);
      map.set(w.date, g);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // ─── Handlers ────────────────
  const updateField = useCallback(async (id: number, field: keyof WordItem, value: any) => {
    const wordToUpdate = words.find(w => w.id === id);
    if (!wordToUpdate) return;
    const upd = { ...wordToUpdate, [field]: value };
    setWords(prev => prev.map(w => w.id === id ? upd : w));
    await updateEnglishWord(upd);
  }, [words]);

  const cycleMastery = useCallback(async (id: number) => {
    const wordToUpdate = words.find(w => w.id === id);
    if (!wordToUpdate) return;
    const n = ((wordToUpdate.mastery + 1) % 3) as 0 | 1 | 2;
    const upd = { ...wordToUpdate, mastery: n };
    setWords(prev => prev.map(w => w.id === id ? upd : w));
    await updateEnglishWord(upd);
  }, [words]);

  const handleAddRow = async () => {
    if (!nWord.trim()) return;
    const item: any = {
      word: nWord.trim(), meaning: nMeaning.trim(),
      phrase: nPhrase.trim(), phraseTranslation: nPhraseTr.trim(),
      link: nLink.trim(), date: todayStr(), mastery: 0,
    };
    
    try {
      const res: any = await createEnglishWord(item);
      if (res.code === 0) {
        await loadDataFromApi(); // reload to get new real IDs
        setNWord(''); setNMeaning(''); setNPhrase(''); setNPhraseTr(''); setNLink('');
        setIsAddingRow(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      await deleteEnglishWord([deleteConfirmId]);
      setWords(prev => prev.filter(w => w.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch(e) {
      console.error(e);
    }
  };

  const handleSpeak = useCallback((text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.85;
    speechSynthesis.speak(u);
  }, []);

  const handleCopy = useCallback((w: WordItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(`${w.word} — ${w.meaning}`);
    setCopiedId(w.id); setTimeout(() => setCopiedId(null), 1500);
  }, []);

  const handleExport = () => {
    const header = '单词,翻译,短语,短语翻译,链接,日期,掌握度\n';
    const rows = words.map(w =>
      [w.word, w.meaning, w.phrase, w.phraseTranslation, w.link, w.date, MASTERY_STYLES[w.mastery].label]
        .map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `英语单词本_${new Date().toLocaleDateString('zh-CN')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Mastery progress percentage
  const masteryPercent = words.length > 0 ? Math.round((stats.mastered / words.length) * 100) : 0;

  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-1/4 w-[55%] h-[400px] bg-rose-500/5 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[35%] h-[250px] bg-violet-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* ─── Header ─── */}
      <header className="h-14 sm:h-16 border-b border-white/5 bg-[#0F111A]/80 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 z-20 backdrop-blur-xl gap-3">
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
              <Languages className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-pink-500">
              英语单词本
            </h1>
          </div>
        </div>

        <div className="flex-1 flex justify-center max-w-sm mx-3">
          <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索单词或翻译..."
              className="pl-10 pr-4 py-2 w-full bg-[#151926]/90 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 transition-all placeholder-slate-500 text-slate-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleExport} title="导出 CSV"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-all text-xs">
            <Download className="w-3.5 h-3.5" /><span className="hidden md:inline">导出</span>
          </button>
          <button onClick={() => { setIsAddingRow(true); setTimeout(() => wordRef.current?.focus(), 100); }}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity text-sm shadow-lg shadow-rose-500/20">
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">添加单词</span>
          </button>
        </div>
      </header>

      {/* ─── Stats Bar ─── */}
      <div className="border-b border-white/5 bg-[#0C0E17]/60 backdrop-blur-sm px-4 sm:px-6 py-3 flex items-center gap-4 sm:gap-6 z-10 overflow-x-auto scrollbar-thin">
        {/* Total */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-100 leading-tight">{stats.total}</div>
            <div className="text-[10px] text-slate-500 leading-tight">总词汇</div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/5 flex-shrink-0" />

        {/* Need Review */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-amber-300 leading-tight">{stats.needReview}</div>
            <div className="text-[10px] text-slate-500 leading-tight">待复习</div>
          </div>
        </div>

        <div className="w-px h-8 bg-white/5 flex-shrink-0" />

        {/* This Week */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/10 flex items-center justify-center">
            <CalendarPlus className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-violet-300 leading-tight">{stats.thisWeek}</div>
            <div className="text-[10px] text-slate-500 leading-tight">本周新增</div>
          </div>
        </div>

        <div className="w-px h-8 bg-white/5 flex-shrink-0" />

        {/* Mastery Progress */}
        <div className="flex items-center gap-3 flex-shrink-0 min-w-[180px]">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-500">掌握进度</span>
              <span className="text-xs font-semibold text-emerald-400">{masteryPercent}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex">
              {stats.total > 0 && (
                <>
                  <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${(stats.mastered / stats.total) * 100}%` }} />
                  <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${(stats.learning / stats.total) * 100}%` }} />
                  <div className="h-full bg-rose-400/50 transition-all duration-500" style={{ width: `${(stats.neww / stats.total) * 100}%` }} />
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />{stats.mastered}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />{stats.learning}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" />{stats.neww}</span>
          </div>
        </div>
      </div>

      {/* ─── Table ─── */}
      <main className="flex-1 overflow-auto scrollbar-thin z-10">
        <div className="min-w-[720px]">
          {/* Table Header */}
          <div className="sticky top-0 z-10 bg-[#0D0F18]/95 backdrop-blur-xl border-b border-white/8">
            <div className="grid grid-cols-[36px_minmax(90px,1fr)_minmax(70px,0.7fr)_minmax(140px,2fr)_minmax(120px,1.5fr)_minmax(60px,0.5fr)_80px_46px] gap-0 px-4 sm:px-5">
              <div className="py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">#</div>
              <div className="py-3 text-[10px] font-bold text-rose-400/90 uppercase tracking-widest">单词</div>
              <div className="py-3 text-[10px] font-bold text-rose-400/70 uppercase tracking-widest">翻译</div>
              <div className="py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">短语 / 例句</div>
              <div className="py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">短语翻译</div>
              <div className="py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">链接</div>
              <div className="py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">掌握</div>
              <div className="py-3" />
            </div>
          </div>

          {/* Add Row */}
          <AnimatePresence>
            {isAddingRow && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden border-b border-rose-500/20 bg-gradient-to-r from-rose-500/[0.04] to-transparent">
                <div className="grid grid-cols-[36px_minmax(90px,1fr)_minmax(70px,0.7fr)_minmax(140px,2fr)_minmax(120px,1.5fr)_minmax(60px,0.5fr)_80px_46px] gap-0 px-4 sm:px-5 items-center">
                  <div className="py-2.5 text-xs text-rose-400/50">✦</div>
                  <div className="py-2.5 pr-2">
                    <input ref={wordRef} type="text" value={nWord} onChange={e => setNWord(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddRow(); if (e.key === 'Escape') setIsAddingRow(false); }}
                      placeholder="英文单词"
                      className="w-full bg-[#12141D] border border-rose-500/30 rounded-lg px-2.5 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-500/20 transition-all font-semibold" />
                  </div>
                  <div className="py-2.5 pr-2">
                    <input type="text" value={nMeaning} onChange={e => setNMeaning(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddRow(); if (e.key === 'Escape') setIsAddingRow(false); }}
                      placeholder="中文释义"
                      className="w-full bg-[#12141D] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/30 transition-all" />
                  </div>
                  <div className="py-2.5 pr-2">
                    <input type="text" value={nPhrase} onChange={e => setNPhrase(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddRow(); if (e.key === 'Escape') setIsAddingRow(false); }}
                      placeholder="例句或短语"
                      className="w-full bg-[#12141D] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/30 transition-all" />
                  </div>
                  <div className="py-2.5 pr-2">
                    <input type="text" value={nPhraseTr} onChange={e => setNPhraseTr(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddRow(); if (e.key === 'Escape') setIsAddingRow(false); }}
                      placeholder="短语翻译"
                      className="w-full bg-[#12141D] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/30 transition-all" />
                  </div>
                  <div className="py-2.5 pr-2">
                    <input type="text" value={nLink} onChange={e => setNLink(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddRow(); if (e.key === 'Escape') setIsAddingRow(false); }}
                      placeholder="链接"
                      className="w-full bg-[#12141D] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/30 transition-all" />
                  </div>
                  <div className="py-2.5 text-center"><span className="text-[10px] text-slate-500">—</span></div>
                  <div className="py-2.5 flex items-center gap-0.5 justify-center">
                    <button onClick={handleAddRow} disabled={!nWord.trim()}
                      className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all disabled:opacity-30">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { setIsAddingRow(false); setNWord(''); setNMeaning(''); setNPhrase(''); setNPhraseTr(''); setNLink(''); }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table Body - Grouped by Date */}
          {grouped.length > 0 ? (
            grouped.map(([date, items], gi) => (
              <div key={date}>
                {/* Date Group Header */}
                <div className="sticky top-[41px] z-[5] px-4 sm:px-5 py-2 bg-[#0A0C14]/90 backdrop-blur-md border-b border-white/[0.03] flex items-center gap-2.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-400">{date}</span>
                  <span className="text-[10px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">{items.length} 词</span>
                  {date === todayStr() && (
                    <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">今天</span>
                  )}
                </div>

                {/* Words */}
                {items.map((w, i) => {
                  const globalIdx = words.indexOf(w);
                  const mStyle = MASTERY_STYLES[w.mastery];
                  return (
                    <div key={w.id}
                      className={`group grid grid-cols-[36px_minmax(90px,1fr)_minmax(70px,0.7fr)_minmax(140px,2fr)_minmax(120px,1.5fr)_minmax(60px,0.5fr)_80px_46px] gap-0 px-4 sm:px-5 border-b border-white/[0.03] hover:bg-white/[0.015] transition-all items-start relative
                        ${w.mastery === 2 ? 'opacity-60 hover:opacity-90' : ''}`}>
                      {/* Left accent line on hover */}
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-rose-500/0 group-hover:bg-rose-500/40 transition-all" />

                      {/* # */}
                      <div className="py-3.5 text-xs text-slate-600 tabular-nums">{words.length - globalIdx}</div>

                      {/* Word */}
                      <div className="py-3.5 pr-2 flex items-start gap-1.5">
                        <button onClick={e => handleSpeak(w.word, e)} title="朗读"
                          className="mt-0.5 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 transition-all flex-shrink-0">
                          <Volume2 className="w-3 h-3" />
                        </button>
                        <EditableCell value={w.word} onChange={v => updateField(w.id, 'word', v)}
                          placeholder="—" className="font-semibold text-slate-100" />
                      </div>

                      {/* Translation */}
                      <div className="py-3.5 pr-2">
                        <EditableCell value={w.meaning} onChange={v => updateField(w.id, 'meaning', v)}
                          placeholder="—" className="text-rose-300/80" />
                      </div>

                      {/* Phrase */}
                      <div className="py-3.5 pr-2">
                        <EditableCell value={w.phrase} onChange={v => updateField(w.id, 'phrase', v)}
                          placeholder="—" className="text-slate-300/90" isMultiline />
                      </div>

                      {/* Phrase Translation */}
                      <div className="py-3.5 pr-2">
                        <EditableCell value={w.phraseTranslation} onChange={v => updateField(w.id, 'phraseTranslation', v)}
                          placeholder="—" className="text-slate-400" isMultiline />
                      </div>

                      {/* Link */}
                      <div className="py-3.5 pr-2">
                        {w.link ? (
                          <a href={w.link.startsWith('http') ? w.link : `https://${w.link}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                            onClick={e => e.stopPropagation()}>
                            链接↗
                          </a>
                        ) : (
                          <EditableCell value={w.link} onChange={v => updateField(w.id, 'link', v)}
                            placeholder="—" className="text-slate-600" />
                        )}
                      </div>

                      {/* Mastery */}
                      <div className="py-3.5 flex items-center justify-center">
                        <MasteryDot level={w.mastery} onClick={() => cycleMastery(w.id)} />
                      </div>

                      {/* Actions */}
                      <div className="py-3.5 flex items-center justify-center gap-0.5">
                        <button onClick={e => handleCopy(w, e)} title="复制"
                          className={`p-1.5 rounded-lg transition-all ${copiedId === w.id
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'opacity-0 group-hover:opacity-100 hover:bg-white/10 text-slate-500 hover:text-slate-300'
                          }`}>
                          {copiedId === w.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); setDeleteConfirmId(w.id); }} title="删除"
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-slate-500">
              <div className="relative mb-6">
                <Languages className="w-16 h-16 opacity-10" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <Plus className="w-3 h-3 text-rose-400" />
                </div>
              </div>
              <p className="text-base mb-1 text-slate-400">还没有记录任何单词</p>
              <p className="text-xs text-slate-600 mb-5">开始你的英语学习之旅吧</p>
              <button onClick={() => { setIsAddingRow(true); setTimeout(() => wordRef.current?.focus(), 100); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500/20 to-pink-500/10 text-rose-400 hover:from-rose-500/30 hover:to-pink-500/20 transition-all text-sm border border-rose-500/20 font-medium">
                <Plus className="w-4 h-4" />添加第一个单词
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ─── Delete Confirm ─── */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-red-500/10"><Trash2 className="w-5 h-5 text-red-400" /></div>
                <h3 className="text-lg font-bold text-slate-100">确认删除</h3>
              </div>
              <p className="text-sm text-slate-400 mb-6">删除后无法恢复，确定要删除这个单词吗？</p>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">取消</button>
                <button onClick={confirmDelete} className="px-5 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20">确认删除</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
