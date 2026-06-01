import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Bug, Search, Plus, Edit2, Trash2, Clock, Check, X, Copy,
  CheckCircle2, XCircle, Tag, Terminal, Lightbulb, ChevronDown
} from 'lucide-react';

// ─── Types ───────────────────────────
type ErrorStatus = 'unsolved' | 'solved';
type Severity = 'critical' | 'normal' | 'minor';

interface ErrorRecord {
  id: string;
  title: string;
  errorMessage: string;
  solution: string;
  status: ErrorStatus;
  severity: Severity;
  tag: string;
  updatedAt: string;
}

import { getErrorList, createError, updateError, updateErrorStatus, deleteError } from '@/api/appError';
const STATUS_CFG: Record<ErrorStatus, { label: string; icon: any; cls: string; bg: string }> = {
  unsolved: { label: '未解决', icon: XCircle,      cls: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/20' },
  solved:   { label: '已解决', icon: CheckCircle2,  cls: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
};

const SEVERITY_CFG: Record<Severity, { label: string; cls: string; dot: string }> = {
  critical: { label: '严重', cls: 'text-red-400 bg-red-400/10 border-red-400/20',       dot: 'bg-red-400' },
  normal:   { label: '一般', cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20',   dot: 'bg-amber-400' },
  minor:    { label: '轻微', cls: 'text-slate-400 bg-slate-400/10 border-slate-400/20',    dot: 'bg-slate-400' },
};

// ─── Helpers ─────────────────────────
function useCopy() {
  const [k, setK] = useState<string | null>(null);
  const cp = useCallback((t: string, key: string) => { navigator.clipboard.writeText(t); setK(key); setTimeout(() => setK(null), 1500); }, []);
  return { k, cp };
}

// ═══════════════════════════════════════
export default function ErrorManagerPage() {
  const navigate = useNavigate();
  const { k: copiedKey, cp } = useCopy();

  const [records, setRecords] = useState<ErrorRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ErrorStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ErrorRecord | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formError, setFormError] = useState('');
  const [formSolution, setFormSolution] = useState('');
  const [formStatus, setFormStatus] = useState<ErrorStatus>('unsolved');
  const [formSeverity, setFormSeverity] = useState<Severity>('normal');
  const [formTag, setFormTag] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Status Filter Dropdown state
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const fetchErrorList = useCallback(async () => {
    try {
      const res = await getErrorList({ page: 1, pageSize: 999, status: filterStatus, searchQuery }) as any;
      if (res.code === 0 && res.data.list) {
        setRecords(res.data.list.map((item: any) => ({
          ...item,
          id: item.id.toString(),
        })));
      }
    } catch {}
  }, [filterStatus, searchQuery]);

  useEffect(() => { fetchErrorList(); }, [fetchErrorList]);

  useEffect(() => {
    if (records.length > 0 && !selectedId && !records.find(r => r.id === selectedId)) {
       setSelectedId(records[0].id);
    }
  }, [records, selectedId]);

  // Filter (now primarily filtering on top of server data if needed, or rely strictly on server. But we do soft filter here for instant UI)
  const filtered = useMemo(() => {
    let list = records;
    if (filterStatus !== 'all') list = list.filter(r => r.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) || r.errorMessage.toLowerCase().includes(q) ||
        r.solution.toLowerCase().includes(q) || r.tag.toLowerCase().includes(q)
      );
    }
    return list;
  }, [records, filterStatus, searchQuery]);

  const selectedRecord = useMemo(() => records.find(r => r.id === selectedId) || null, [records, selectedId]);

  // Open form
  const openForm = (item?: ErrorRecord) => {
    if (item) {
      setEditItem(item);
      setFormTitle(item.title); setFormError(item.errorMessage);
      setFormSolution(item.solution); setFormStatus(item.status);
      setFormSeverity(item.severity); setFormTag(item.tag);
    } else {
      setEditItem(null);
      setFormTitle(''); setFormError('');
      setFormSolution(''); setFormStatus('unsolved'); setFormSeverity('normal');
      setFormTag('');
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formError.trim()) return;
    try {
      if (editItem) {
        const payload = {
          id: Number(editItem.id),
          title: formTitle, errorMessage: formError,
          solution: formSolution, status: formStatus,
          severity: formSeverity, tag: formTag.trim(),
        };
        const res = await updateError(payload) as any;
        if (res.code === 0) fetchErrorList();
      } else {
        const payload = {
          title: formTitle, errorMessage: formError,
          solution: formSolution, status: formStatus,
          severity: formSeverity, tag: formTag.trim(),
        };
        const res = await createError(payload) as any;
        if (res.code === 0) {
          fetchErrorList();
          if (res.data?.id) setSelectedId(res.data.id.toString());
        }
      }
      setIsFormOpen(false);
    } catch {}
  };

  // Quick toggle status
  const toggleStatus = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = records.find(r => r.id === id);
    if (!target) return;
    const newStatus = target.status === 'solved' ? 'unsolved' : 'solved';
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    
    try {
      await updateErrorStatus({ id: Number(id), status: newStatus });
      fetchErrorList();
    } catch {}
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteError({ id: Number(deleteConfirmId) });
      if (selectedId === deleteConfirmId) setSelectedId(null);
      setDeleteConfirmId(null);
      fetchErrorList();
    } catch {}
  };

  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[50%] h-[350px] bg-red-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-[#0F111A]/80 flex-shrink-0 flex items-center justify-between px-5 z-20 backdrop-blur-xl gap-3">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400"><Bug className="w-5 h-5" /></div>
            <div>
              <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-rose-400">报错管理</h1>
              <p className="text-[10px] text-slate-500">{records.length} 条记录</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex justify-center max-w-2xl mx-3 gap-2">
          {/* Status Dropdown Filter */}
          <div className="relative">
            <button 
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-[#151926]/90 border border-white/10 rounded-xl text-sm text-slate-300 hover:bg-white/5 transition-all focus:outline-none focus:border-red-500/50"
            >
              <div className="flex items-center gap-1.5 w-16">
                {filterStatus === 'all' && <span className="text-slate-400">全部状态</span>}
                {filterStatus === 'unsolved' && <><XCircle className="w-3.5 h-3.5 text-red-400" /><span className="text-slate-300">未解决</span></>}
                {filterStatus === 'solved' && <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span className="text-slate-300">已解决</span></>}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isStatusDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 mt-1.5 w-full bg-[#12141D] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 py-1">
                    <button onClick={() => { setFilterStatus('all'); setIsStatusDropdownOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors ${filterStatus === 'all' ? 'text-white bg-white/5' : 'text-slate-400'}`}>全部状态</button>
                    <button onClick={() => { setFilterStatus('unsolved'); setIsStatusDropdownOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors ${filterStatus === 'unsolved' ? 'text-red-400 bg-red-400/10' : 'text-slate-400'}`}><XCircle className="w-3.5 h-3.5 text-red-500"/>未解决</button>
                    <button onClick={() => { setFilterStatus('solved'); setIsStatusDropdownOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors ${filterStatus === 'solved' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400'}`}><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/>已解决</button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-red-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索报错信息..."
              className="pl-10 pr-4 py-2 w-full bg-[#151926]/90 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-red-500/50 placeholder-slate-500" />
          </div>
        </div>
        <button onClick={() => openForm()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-medium hover:opacity-90 text-sm shadow-lg shadow-red-500/20 flex-shrink-0">
          <Plus className="w-4 h-4" />记录报错
        </button>
      </header>

      <main className="flex-1 flex min-h-0 overflow-hidden z-10">
        {/* Left Sidebar: Titles List */}
        <aside className="w-[300px] flex-shrink-0 border-r border-white/5 bg-[#0A0C14]/60 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">报错列表</span>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400">{filtered.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
            {filtered.map(item => {
              const isActive = selectedId === item.id;
              const sc = STATUS_CFG[item.status];
              const StatusIcon = sc.icon;
              return (
                <div key={item.id} onClick={() => setSelectedId(item.id)}
                  className={`group relative flex items-start gap-2.5 px-3 py-3 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-red-500/10' : 'hover:bg-white/[0.03]'}`}>
                  <button onClick={(e) => toggleStatus(item.id, e)} className={`mt-0.5 flex-shrink-0 ${sc.cls} hover:scale-110 transition-transform`} title="切换状态">
                    <StatusIcon className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-medium leading-tight mb-1.5 truncate ${isActive ? 'text-slate-100' : 'text-slate-300'}`}>{item.title}</h3>
                    <div className="flex items-center gap-2">
                       {item.tag && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A1D2D] text-slate-400 truncate max-w-[80px]">{item.tag}</span>}
                       <span className="text-[9px] text-slate-600">{item.updatedAt.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs text-opacity-60">未找到结果</div>
            )}
          </div>
        </aside>

        {/* Right: Error Detail Workspace */}
        <section className="flex-1 flex flex-col overflow-hidden bg-[#0A0C14]/20 relative">
          {selectedRecord ? (
            <div className="flex-1 overflow-y-auto scrollbar-thin p-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${STATUS_CFG[selectedRecord.status].bg} ${STATUS_CFG[selectedRecord.status].cls}`}>
                          {(() => {
                            const StatusIcon = STATUS_CFG[selectedRecord.status].icon;
                            return <StatusIcon className="w-3.5 h-3.5" />;
                          })()}
                          {STATUS_CFG[selectedRecord.status].label}
                       </span>
                       <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded border ${SEVERITY_CFG[selectedRecord.severity].cls}`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${SEVERITY_CFG[selectedRecord.severity].dot}`} />{SEVERITY_CFG[selectedRecord.severity].label}
                       </span>
                       {selectedRecord.tag && (
                         <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-white/5 text-slate-400 border border-white/5">
                           <Tag className="w-3 h-3"/>{selectedRecord.tag}
                         </span>
                       )}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-100 mb-2">{selectedRecord.title}</h2>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> 最新更新于 {selectedRecord.updatedAt}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleStatus(selectedRecord.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all border ${selectedRecord.status === 'solved' ? 'bg-[#151926] border-white/10 text-slate-400 hover:text-white hover:bg-white/10' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'}`}>
                      {selectedRecord.status === 'solved' ? <><XCircle className="w-4 h-4" />重新打开</> : <><CheckCircle2 className="w-4 h-4" />标记为已解决</>}
                    </button>
                    <button onClick={() => openForm(selectedRecord)} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirmId(selectedRecord.id)} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Error Message */}
                  <div className="bg-[#0B0D15]/80 rounded-2xl border border-red-500/10 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-red-500/10 bg-red-500/5">
                      <span className="text-sm font-bold text-red-400 flex items-center gap-2"><Terminal className="w-4 h-4" />报错信息</span>
                      <button onClick={() => cp(selectedRecord.errorMessage, `err-${selectedRecord.id}`)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all ${copiedKey === `err-${selectedRecord.id}` ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>
                        {copiedKey === `err-${selectedRecord.id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey === `err-${selectedRecord.id}` ? '已复制' : '复制'}
                      </button>
                    </div>
                    <div className="p-5">
                      <pre className="text-sm font-mono text-red-300/90 whitespace-pre-wrap leading-relaxed">{selectedRecord.errorMessage}</pre>
                    </div>
                  </div>

                  {/* Solution */}
                  {selectedRecord.solution && (
                    <div className="bg-[#0B0D15]/80 rounded-2xl border border-emerald-500/10 overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 border-b border-emerald-500/10 bg-emerald-500/5">
                        <span className="text-sm font-bold text-emerald-400 flex items-center gap-2"><Lightbulb className="w-4 h-4" />解决方案</span>
                        <button onClick={() => cp(selectedRecord.solution, `sol-${selectedRecord.id}`)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all ${copiedKey === `sol-${selectedRecord.id}` ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>
                          {copiedKey === `sol-${selectedRecord.id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedKey === `sol-${selectedRecord.id}` ? '已复制' : '复制'}
                        </button>
                      </div>
                      <div className="p-5">
                        <pre className="text-sm font-mono text-emerald-300/90 whitespace-pre-wrap leading-relaxed">{selectedRecord.solution}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Bug className="w-16 h-16 mb-6 opacity-10" />
              <p className="text-base font-medium mb-1 text-slate-400">选择一个报错以查看详情</p>
              <p className="text-sm text-slate-600">或点击右上角「记录报错」</p>
            </div>
          )}
        </section>
      </main>

      {/* ─── Create/Edit Modal ─── */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl bg-[#12141D] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin pointer-events-auto flex flex-col">
                <div className="sticky top-0 bg-[#12141D]/90 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between z-10 flex-shrink-0">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bug className="w-5 h-5 text-red-500"/>
                    {editItem ? '编辑报错' : '记录报错'}
                  </h2>
                  <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">报错标题 *</label>
                    <input value={formTitle} onChange={e => setFormTitle(e.target.value)} autoFocus
                      className="w-full bg-[#1A1D2D] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-red-500/50 transition-colors" placeholder="一句话描述问题" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">状态</label>
                      <div className="flex gap-2">
                        {(['unsolved', 'solved'] as ErrorStatus[]).map(st => {
                          const sc = STATUS_CFG[st]; const Icon = sc.icon;
                          return (
                            <button key={st} type="button" onClick={() => setFormStatus(st)}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${formStatus === st ? `${sc.bg} ${sc.cls}` : 'text-slate-500 bg-[#1A1D2D] border-white/5 hover:bg-white/5'}`}>
                              <Icon className="w-4 h-4" />{sc.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">严重程度</label>
                      <div className="flex gap-2">
                        {(['critical', 'normal', 'minor'] as Severity[]).map(sev => {
                          const sc = SEVERITY_CFG[sev];
                          return (
                            <button key={sev} type="button" onClick={() => setFormSeverity(sev)}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${formSeverity === sev ? sc.cls : 'text-slate-500 bg-[#1A1D2D] border-white/5 hover:bg-white/5'}`}>
                              <div className={`w-2 h-2 rounded-full ${sc.dot}`} />{sc.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                     <label className="block text-xs font-semibold text-slate-400 mb-2">标签 <span className="text-slate-600 font-normal">(自定义输入)</span></label>
                     <div className="relative">
                       <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                       <input value={formTag} onChange={e => setFormTag(e.target.value)}
                        className="w-full bg-[#1A1D2D] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-red-500/50 transition-colors" placeholder="如：GORM" />
                     </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5"><Terminal className="w-4 h-4 text-red-400"/>错误信息 *</label>
                    <textarea value={formError} onChange={e => setFormError(e.target.value)}
                      className="w-full bg-[#1A1D2D] border border-white/10 rounded-xl px-4 py-4 text-sm text-red-300/90 font-mono focus:outline-none focus:border-red-500/50 resize-none transition-colors"
                      rows={5} placeholder="粘贴核心错误日志..." />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5"><Lightbulb className="w-4 h-4 text-emerald-400" />解决方案</label>
                    <textarea value={formSolution} onChange={e => setFormSolution(e.target.value)}
                      className="w-full bg-[#1A1D2D] border border-white/10 rounded-xl px-4 py-4 text-sm text-emerald-300/90 font-mono focus:outline-none focus:border-emerald-500/50 resize-none transition-colors"
                      rows={5} placeholder="如何解决的？" />
                  </div>
                </div>
                <div className="sticky bottom-0 bg-[#12141D]/90 backdrop-blur-md border-t border-white/5 p-6 flex justify-end gap-3 flex-shrink-0">
                  <button onClick={() => setIsFormOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">取消</button>
                  <button onClick={handleSubmit} disabled={!formTitle.trim() || !formError.trim()}
                    className="px-8 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-red-500 to-rose-500 text-white hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40 shadow-lg shadow-red-500/20 transition-all">
                    {editItem ? '保存修改' : '确认记录'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirm ─── */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-red-500/10"><Trash2 className="w-6 h-6 text-red-500" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">确认删除</h3>
                    <p className="text-xs text-slate-500 mt-1">此操作不可恢复</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 mb-6 bg-white/5 p-3 rounded-lg border border-white/5">确定要删除这条报错记录吗？</p>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">取消</button>
                  <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all">确认删除</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
