import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, Search, X, Copy, Check, Edit2,
  ChevronDown, AlertTriangle, AlertCircle, Info, Bot,
  FolderOpen, Clock, Filter,
} from 'lucide-react';
import { getErrorList, createError, updateError, deleteError } from '@/api/error';

// ─── Types ───────────────────────────
type Severity = 'critical' | 'major' | 'minor';
type AIModel = 'chatgpt' | 'claude' | 'gemini' | 'copilot' | 'cursor' | 'other';

interface AIMistake {
  id?: number;
  id?: number;
  title: string;
  project: string;          // 所属项目
  scenario: string;         // 触发场景
  wrongOutput: string;      // AI 的错误回答
  correctAnswer: string;    // 正确做法
  model: AIModel;
  severity: Severity;
  createdAt: string;
  updatedAt: string;
}

// ─── Config ──────────────────────────
const SEVERITY_CFG: Record<Severity, { label: string; icon: any; color: string; bg: string; ring: string }> = {
  critical: { label: '严重', icon: AlertCircle, color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',    ring: 'ring-red-500/30' },
  major:    { label: '一般', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', ring: 'ring-amber-500/30' },
  minor:    { label: '轻微', icon: Info,          color: 'text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/20',  ring: 'ring-blue-500/30' },
};

const MODEL_CFG: Record<AIModel, { label: string; color: string }> = {
  chatgpt:  { label: 'ChatGPT',  color: 'text-emerald-400' },
  claude:   { label: 'Claude',   color: 'text-orange-400' },
  gemini:   { label: 'Gemini',   color: 'text-blue-400' },
  copilot:  { label: 'Copilot',  color: 'text-sky-400' },
  cursor:   { label: 'Cursor',   color: 'text-violet-400' },
  other:    { label: '其他',      color: 'text-slate-400' },
};

function nowStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}



// ═══════════════════════════════════════
export default function AIMistakeManagerPage() {
  const navigate = useNavigate();

  const [mistakes, setMistakes] = useState<AIMistake[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'all'>('all');
  const [filterModel, setFilterModel] = useState<AIModel | 'all'>('all');
  const [filterProject, setFilterProject] = useState<string | 'all'>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AIMistake | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formProject, setFormProject] = useState('');
  const [formScenario, setFormScenario] = useState('');
  const [formWrong, setFormWrong] = useState('');
  const [formCorrect, setFormCorrect] = useState('');
  const [formModel, setFormModel] = useState<AIModel>('chatgpt');
  const [formSeverity, setFormSeverity] = useState<Severity>('major');

  // Delete
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Load Data
  const fetchData = useCallback(async () => {
    try {
      const res = await getErrorList({ page: 1, pageSize: 999 });
      if (res && res.data && res.data.list) {
        setMistakes(res.data.list.map((m: any) => ({ ...m, id: m.id || m.id })));
      }
    } catch {}
  }, []);

  useEffect(() => { fetchData() }, [fetchData]);

  const selected = useMemo(() => mistakes.find(m => m.id === selectedId) || null, [mistakes, selectedId]);

  // All projects
  const allProjects = useMemo(() => {
    const set = new Set(mistakes.map(m => m.project).filter(Boolean));
    return Array.from(set);
  }, [mistakes]);

  // Filtered
  const filtered = useMemo(() => {
    let result = mistakes;
    if (filterProject !== 'all') result = result.filter(m => m.project === filterProject);
    if (filterSeverity !== 'all') result = result.filter(m => m.severity === filterSeverity);
    if (filterModel !== 'all') result = result.filter(m => m.model === filterModel);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.title.toLowerCase().includes(q) || m.scenario.toLowerCase().includes(q) ||
        m.wrongOutput.toLowerCase().includes(q) || m.correctAnswer.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      const sev = { critical: 0, major: 1, minor: 2 };
      if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [mistakes, searchQuery, filterSeverity, filterModel, filterProject]);


  // ─── Handlers ────────────────────────
  const openForm = (item?: AIMistake) => {
    if (item) {
      setEditItem(item);
      setFormTitle(item.title); setFormProject(item.project);
      setFormScenario(item.scenario);
      setFormWrong(item.wrongOutput); setFormCorrect(item.correctAnswer);
      setFormModel(item.model);
      setFormSeverity(item.severity);
    } else {
      setEditItem(null);
      setFormTitle(''); setFormProject(filterProject !== 'all' ? filterProject : '');
      setFormScenario(''); setFormWrong(''); setFormCorrect('');
      setFormModel('chatgpt');
      setFormSeverity('major');
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) return;
    try {
      const payload = {
        title: formTitle.trim(),
        project: formProject.trim(),
        scenario: formScenario.trim(),
        wrongOutput: formWrong.trim(),
        correctAnswer: formCorrect.trim(),
        model: formModel,
        severity: formSeverity,
      };
      
      if (editItem) {
        await updateError({ ...payload, id: editItem.id || editItem.id });
      } else {
        await createError(payload);
      }
      setIsFormOpen(false);
      fetchData();
    } catch {}
  };



  const copyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteError({ id: deleteConfirmId });
      setMistakes(prev => prev.filter(m => (m.id || m.id) !== deleteConfirmId));
      if (selected?.id === deleteConfirmId || selected?.id === deleteConfirmId) setSelectedId(null);
      setDeleteConfirmId(null);
    } catch {}
  };

  return (
    <div className="h-screen bg-[#0B0D14] text-slate-200 flex flex-col font-sans overflow-hidden relative">
      <div className="absolute top-0 left-1/4 w-[40%] h-[300px] bg-red-500/3 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="h-14 border-b border-white/5 bg-[#0E1019]/90 flex-shrink-0 flex items-center px-5 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-amber-400">AI 犯错管理</h1>
          </div>
        </div>

        {/* Search + Filter - Centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 w-full max-w-lg">
            <div className="relative flex-shrink-0">
              <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value as any)}
                className="appearance-none pl-3 pr-7 py-2 bg-[#12141D] border border-white/5 rounded-lg text-[11px] text-slate-300 outline-none focus:border-red-500/40 transition-all cursor-pointer">
                <option value="all">全部级别</option>
                {(Object.entries(SEVERITY_CFG) as [Severity, typeof SEVERITY_CFG[Severity]][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
            </div>
            <div className="relative flex-shrink-0">
              <select value={filterModel} onChange={e => setFilterModel(e.target.value as any)}
                className="appearance-none pl-3 pr-7 py-2 bg-[#12141D] border border-white/5 rounded-lg text-[11px] text-slate-300 outline-none focus:border-red-500/40 transition-all cursor-pointer">
                <option value="all">全部模型</option>
                {(Object.entries(MODEL_CFG) as [AIModel, typeof MODEL_CFG[AIModel]][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索错误记录..."
                className="w-full pl-8 pr-3 py-2 bg-[#12141D] border border-white/5 rounded-lg text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-red-500/40 transition-all" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden z-10 relative">
        {/* Left Sidebar: Projects */}
        <aside className="w-52 border-r border-white/5 bg-[#0C0E15]/50 flex flex-col flex-shrink-0">
          <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">项目</span>
            <button onClick={() => openForm()}
              className="p-1 rounded text-red-400 hover:bg-white/5 transition-all" title="新建记录">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
            <button onClick={() => setFilterProject('all')}
              className={`w-full px-3 py-2 text-left flex items-center gap-2 text-[11px] transition-all ${
                filterProject === 'all'
                  ? 'bg-red-500/10 text-red-300 border-l-2 border-l-red-400'
                  : 'text-slate-400 hover:bg-white/[0.03] border-l-2 border-l-transparent'}`}>
              <Filter className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1">全部项目</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-500">{mistakes.length}</span>
            </button>
            {allProjects.map(p => {
              const count = mistakes.filter(m => m.project === p).length;
              return (
                <button key={p} onClick={() => setFilterProject(p)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 text-[11px] transition-all ${
                    filterProject === p
                      ? 'bg-red-500/10 text-red-300 border-l-2 border-l-red-400'
                      : 'text-slate-400 hover:bg-white/[0.03] border-l-2 border-l-transparent'}`}>
                  <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 text-amber-400/60" />
                  <span className="flex-1 truncate">{p}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-600">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Issue List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* List header */}
          <div className="sticky top-0 z-10 flex items-center gap-4 px-5 py-2.5 bg-[#0E1019]/95 backdrop-blur-sm border-b border-white/[0.03] text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
            <span className="w-5"></span>
            <span className="flex-1">错误描述</span>
            <span className="w-16"></span>
          </div>

          <AnimatePresence mode="popLayout">
            {filtered.map((m, i) => {
              const sevCfg = SEVERITY_CFG[m.severity] || SEVERITY_CFG.major;
              const SevIcon = sevCfg.icon;
              return (
                <motion.div key={m.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedId((m.id || m.id)!)}
                  className={`group flex items-center gap-4 px-5 py-3 border-b border-white/[0.03] cursor-pointer transition-all hover:bg-white/[0.02] ${selectedId === m.id
                    ? 'bg-red-500/[0.04] border-l-2 border-l-red-400'
                    : 'border-l-2 border-l-transparent'}`}>
                  {/* Severity Icon */}
                  <div className={`flex-shrink-0 ${sevCfg.color}`}>
                    <SevIcon className="w-4 h-4" />
                  </div>

                  {/* Title + Model */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
					  <span className={`text-sm font-medium truncate text-slate-200`}>{m.title}</span>
                      <span className={`text-[10px] font-medium flex-shrink-0 ${(MODEL_CFG[m.model] || MODEL_CFG.other).color}`}>{(MODEL_CFG[m.model] || MODEL_CFG.other).label}</span>
                    </div>
                  </div>



                  {/* Actions */}
                  <div className="w-16 flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); openForm(m); }} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-600 hover:text-blue-400 transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(m.id); }} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-600 hover:text-red-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
              <AlertTriangle className="w-12 h-12 mb-3 opacity-10" />
              <p className="text-sm text-slate-500">暂无匹配的错误记录</p>
              <p className="text-xs opacity-40 mt-1">点击左侧「+」添加新的犯错记录</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selected && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedId(null)}
                className="absolute inset-0 z-20 bg-black/30" />
              <motion.div
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                className="absolute right-0 top-14 bottom-0 w-[55%] max-w-[700px] z-30 overflow-y-auto custom-scrollbar bg-[#0E1019] border-l border-white/5 shadow-2xl shadow-black/40"
                onClick={(e) => e.stopPropagation()}>
              {/* Detail Header */}
              <div className="sticky top-0 z-10 bg-[#0E1019]/95 backdrop-blur-sm border-b border-white/5 px-6 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${(SEVERITY_CFG[selected.severity] || SEVERITY_CFG.major).bg} ${(SEVERITY_CFG[selected.severity] || SEVERITY_CFG.major).color}`}>
                        {(SEVERITY_CFG[selected.severity] || SEVERITY_CFG.major).label}
                      </span>
                      <span className={`text-[11px] font-medium ${(MODEL_CFG[selected.model] || MODEL_CFG.other).color}`}>
                        <Bot className="w-3 h-3 inline mr-0.5" />{(MODEL_CFG[selected.model] || MODEL_CFG.other).label}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-100">{selected.title}</h2>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Project */}
                {selected.project && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <FolderOpen className="w-3 h-3 text-amber-400/60" />
                    <span className="text-[11px] text-slate-400">{selected.project}</span>
                  </div>
                )}
              </div>

              {/* Detail Content */}
              <div className="px-6 py-5 space-y-5">
                {/* Scenario */}
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 rounded-full bg-blue-400" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">触发场景</h3>
                  </div>
                  <div className="bg-[#12141D] rounded-xl border border-white/[0.04] px-4 py-3 focus-within:border-blue-500/30 transition-colors">
                    <textarea
                      defaultValue={selected.scenario}
                      key={`scenario-${selected.id}-${selected.updatedAt}`}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== selected!.scenario) {
                          setMistakes(prev => prev.map(m => m.id === selected!.id ? { ...m, scenario: v, updatedAt: nowStr() } : m));
                        }
                      }}
                      rows={2}
                      className="w-full bg-transparent text-[13px] text-slate-300 leading-relaxed resize-none outline-none placeholder-slate-600"
                      placeholder="描述触发该错误的场景..." />
                  </div>
                </section>

                {/* Wrong Output */}
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full bg-red-400" />
                      <h3 className="text-xs font-bold text-red-400/80 uppercase tracking-wider">❌ AI 错误回答</h3>
                    </div>
                    <button onClick={() => copyText(selected.wrongOutput, `wrong-${selected.id}`)}
                      className={`p-1 rounded text-slate-600 hover:text-slate-300 ${copiedField === `wrong-${selected.id}` ? 'text-emerald-400' : ''}`}>
                      {copiedField === `wrong-${selected.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="bg-red-500/[0.04] rounded-xl border border-red-500/10 px-4 py-3 focus-within:border-red-500/30 transition-colors">
                    <textarea
                      defaultValue={selected.wrongOutput}
                      key={`wrong-${selected.id}-${selected.updatedAt}`}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== selected!.wrongOutput) {
                          setMistakes(prev => prev.map(m => m.id === selected!.id ? { ...m, wrongOutput: v, updatedAt: nowStr() } : m));
                        }
                      }}
                      rows={3}
                      className="w-full bg-transparent text-[13px] text-red-300/80 leading-relaxed resize-none outline-none placeholder-red-900/50"
                      placeholder="AI 给出的错误输出..." />
                  </div>
                </section>

                {/* Correct Answer */}
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full bg-emerald-400" />
                      <h3 className="text-xs font-bold text-emerald-400/80 uppercase tracking-wider">✅ 正确做法</h3>
                    </div>
                    <button onClick={() => copyText(selected.correctAnswer, `correct-${selected.id}`)}
                      className={`p-1 rounded text-slate-600 hover:text-slate-300 ${copiedField === `correct-${selected.id}` ? 'text-emerald-400' : ''}`}>
                      {copiedField === `correct-${selected.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="bg-emerald-500/[0.04] rounded-xl border border-emerald-500/10 px-4 py-3 focus-within:border-emerald-500/30 transition-colors">
                    <textarea
                      defaultValue={selected.correctAnswer}
                      key={`correct-${selected.id}-${selected.updatedAt}`}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== selected!.correctAnswer) {
                          setMistakes(prev => prev.map(m => m.id === selected!.id ? { ...m, correctAnswer: v, updatedAt: nowStr() } : m));
                        }
                      }}
                      rows={3}
                      className="w-full bg-transparent text-[13px] text-emerald-300/80 leading-relaxed resize-none outline-none placeholder-emerald-900/50"
                      placeholder="正确做法或防范措施..." />
                  </div>
                </section>

                {/* Meta */}
                <div className="flex items-center gap-4 text-[10px] text-slate-600 pt-2 border-t border-white/[0.03]">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />创建: {selected.createdAt}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />更新: {selected.updatedAt}</span>
                </div>
              </div>
            </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      {/* ─── Create / Edit Modal ─── */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-2xl bg-[#12141D] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto max-h-[85vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    </div>
                    <h3 className="text-base font-bold text-slate-100">{editItem ? '编辑犯错记录' : '记录 AI 犯错'}</h3>
                  </div>
                  <button onClick={() => setIsFormOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400"><X className="w-4 h-4" /></button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">错误标题 *</label>
                      <input value={formTitle} autoFocus onChange={e => setFormTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-red-500/50 transition-all"
                        placeholder="如：编造不存在的 API" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">所属项目</label>
                      <input value={formProject} onChange={e => setFormProject(e.target.value)}
                        list="project-suggestions"
                        className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-red-500/50 transition-all"
                        placeholder="如：AI 数枢" />
                      <datalist id="project-suggestions">
                        {allProjects.map(p => <option key={p} value={p} />)}
                      </datalist>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">AI 模型</label>
                      <div className="relative">
                        <select value={formModel} onChange={e => setFormModel(e.target.value as AIModel)}
                          className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-red-500/50 transition-all appearance-none cursor-pointer">
                          {(Object.entries(MODEL_CFG) as [AIModel, typeof MODEL_CFG[AIModel]][]).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">严重程度</label>
                      <div className="relative">
                        <select value={formSeverity} onChange={e => setFormSeverity(e.target.value as Severity)}
                          className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-red-500/50 transition-all appearance-none cursor-pointer">
                          {(Object.entries(SEVERITY_CFG) as [Severity, typeof SEVERITY_CFG[Severity]][]).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">触发场景</label>
                    <textarea value={formScenario} onChange={e => setFormScenario(e.target.value)} rows={2}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-red-500/50 transition-all resize-none"
                      placeholder="在什么场景下触发了这个错误？" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">❌ AI 的错误输出</label>
                    <textarea value={formWrong} onChange={e => setFormWrong(e.target.value)} rows={3}
                      className="w-full px-4 py-3 bg-red-500/[0.03] border border-red-500/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-red-500/30 transition-all resize-none"
                      placeholder="AI 给出了什么样的错误回答？" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">✅ 正确做法</label>
                    <textarea value={formCorrect} onChange={e => setFormCorrect(e.target.value)} rows={3}
                      className="w-full px-4 py-3 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/30 transition-all resize-none"
                      placeholder="正确的做法或防范措施是什么？" />
                  </div>


                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 flex-shrink-0">
                  <button onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">取消</button>
                  <button onClick={handleSubmit} disabled={!formTitle.trim()}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-red-500 to-amber-500 text-white hover:opacity-90 disabled:opacity-40 shadow-lg shadow-red-500/20 transition-all">
                    {editItem ? '保存' : '记录'}
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
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-red-500/10"><Trash2 className="w-5 h-5 text-red-400" /></div>
                  <h3 className="text-lg font-bold text-slate-100">确认删除</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6">删除后将无法恢复，确定要删除这条犯错记录吗？</p>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">取消</button>
                  <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all">确认删除</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
}
