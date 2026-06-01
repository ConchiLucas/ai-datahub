import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, Search, X, Edit2,
  ChevronDown, ChevronRight, Lightbulb, FolderOpen,
  Clock, Filter, Star, Target, Zap, Flag,
  CheckCircle2, Circle, MessageSquare,
} from 'lucide-react';
import { 
  ProductIdea,
  KeyPoint,
  getProductIdeaList,
  createProductIdea,
  updateProductIdea,
  deleteProductIdea 
} from '../../api/product_idea';

// ─── Types ───────────────────────────
type Priority = 'high' | 'medium' | 'low';

// ─── Config ──────────────────────────
const PRIORITY_CFG: Record<Priority, { label: string; color: string; bg: string; icon: any }> = {
  high:   { label: '高优', color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',    icon: Flag },
  medium: { label: '中优', color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20', icon: Target },
  low:    { label: '低优', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',   icon: Circle },
};

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

// ═══════════════════════════════════════
export default function ProductIdeaPage() {
  const navigate = useNavigate();

  const [ideas, setIdeas] = useState<ProductIdea[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterProduct, setFilterProduct] = useState<string | 'all'>('all');

  // Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ProductIdea | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formProduct, setFormProduct] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<Priority>('medium');

  // Delete
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await getProductIdeaList({
        page: 1,
        pageSize: 1000,
        searchQuery,
        filterPriority: filterPriority !== 'all' ? filterPriority : undefined,
        filterProduct: filterProduct !== 'all' ? filterProduct : undefined
      });
      if (res.data && (res as any).data.list) {
        setIdeas((res as any).data.list);
      } else if ((res as any).data) { // Interceptor returns T directly without AxiosResponse
        // if interceptor returns response.data
        setIdeas((res as any).data.list || []);
      } else {
        setIdeas([]);
      }
    } catch (err) {
      console.error(err);
    }
  }, [searchQuery, filterPriority, filterProduct]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selected = useMemo(() => ideas.find(m => m.id === selectedId) || null, [ideas, selectedId]);

  // All products
  const allProducts = useMemo(() => {
    const set = new Set(ideas.map(m => m.product).filter(Boolean));
    return Array.from(set);
  }, [ideas]);

  // Filtered
  const filtered = ideas;

  // ─── Handlers ────────────────────────
  const openForm = (item?: ProductIdea) => {
    if (item) {
      setEditItem(item);
      setFormTitle(item.title); setFormProduct(item.product);
      setFormDesc(item.description);
      setFormPriority(item.priority);
    } else {
      setEditItem(null);
      setFormTitle(''); setFormProduct(filterProduct !== 'all' ? filterProduct : '');
      setFormDesc('');
      setFormPriority('medium');
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) return;
    try {
      if (editItem) {
        await updateProductIdea({
          id: editItem.id,
          title: formTitle.trim(),
          product: formProduct.trim(),
          description: formDesc.trim(),
          priority: formPriority,
        });
      } else {
        await createProductIdea({
          title: formTitle.trim(),
          product: formProduct.trim(),
          description: formDesc.trim(),
          priority: formPriority,
          keyPoints: [],
          notes: ''
        });
      }
      setIsFormOpen(false);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const updateField = async (id: number, field: keyof ProductIdea, value: any) => {
    try {
      await updateProductIdea({ id, [field]: value });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const addKeyPoint = async (idea: ProductIdea) => {
    const kps = [...idea.keyPoints, { id: Date.now().toString(), text: '', done: false }];
    try {
      await updateProductIdea({ id: idea.id, keyPoints: kps });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const updateKeyPoint = async (idea: ProductIdea, kpId: string, text: string) => {
    const kps = idea.keyPoints.map(kp => kp.id === kpId ? { ...kp, text } : kp);
    try {
      await updateProductIdea({ id: idea.id, keyPoints: kps });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const toggleKeyPoint = async (idea: ProductIdea, kpId: string) => {
    const kps = idea.keyPoints.map(kp => kp.id === kpId ? { ...kp, done: !kp.done } : kp);
    try {
      await updateProductIdea({ id: idea.id, keyPoints: kps });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const deleteKeyPoint = async (idea: ProductIdea, kpId: string) => {
    const kps = idea.keyPoints.filter(kp => kp.id !== kpId);
    try {
      await updateProductIdea({ id: idea.id, keyPoints: kps });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteProductIdea(deleteConfirmId);
      if (selectedId === deleteConfirmId) setSelectedId(null);
      setDeleteConfirmId(null);
      fetchData();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="h-screen bg-[#0B0D14] text-slate-200 flex flex-col font-sans overflow-hidden relative">
      <div className="absolute top-0 left-1/3 w-[35%] h-[300px] bg-violet-500/3 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="h-14 border-b border-white/5 bg-[#0E1019]/90 flex-shrink-0 flex items-center px-5 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">产品思路</h1>
          </div>
        </div>

        {/* Search + Filter - Centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 w-full max-w-lg">
            <div className="relative flex-shrink-0">
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as any)}
                className="appearance-none pl-3 pr-7 py-2 bg-[#12141D] border border-white/5 rounded-lg text-[11px] text-slate-300 outline-none focus:border-violet-500/40 transition-all cursor-pointer">
                <option value="all">全部优先级</option>
                {(Object.entries(PRIORITY_CFG) as [Priority, typeof PRIORITY_CFG[Priority]][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索产品思路..."
                className="w-full pl-8 pr-3 py-2 bg-[#12141D] border border-white/5 rounded-lg text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/40 transition-all" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden z-10 relative">
        {/* Left Sidebar: Products */}
        <aside className="w-52 border-r border-white/5 bg-[#0C0E15]/50 flex flex-col flex-shrink-0">
          <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">产品</span>
            <button onClick={() => openForm()}
              className="p-1 rounded text-violet-400 hover:bg-white/5 transition-all" title="新建思路">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
            <button onClick={() => setFilterProduct('all')}
              className={`w-full px-3 py-2 text-left flex items-center gap-2 text-[11px] transition-all ${
                filterProduct === 'all'
                  ? 'bg-violet-500/10 text-violet-300 border-l-2 border-l-violet-400'
                  : 'text-slate-400 hover:bg-white/[0.03] border-l-2 border-l-transparent'}`}>
              <Filter className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1">全部产品</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-500">{ideas.length}</span>
            </button>
            {allProducts.map(p => {
              const count = ideas.filter(m => m.product === p).length;
              return (
                <button key={p} onClick={() => setFilterProduct(p)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 text-[11px] transition-all ${
                    filterProduct === p
                      ? 'bg-violet-500/10 text-violet-300 border-l-2 border-l-violet-400'
                      : 'text-slate-400 hover:bg-white/[0.03] border-l-2 border-l-transparent'}`}>
                  <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 text-violet-400/60" />
                  <span className="flex-1 truncate">{p}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-600">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Idea List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* List header */}
          <div className="sticky top-0 z-10 flex items-center gap-4 px-5 py-2.5 bg-[#0E1019]/95 backdrop-blur-sm border-b border-white/[0.03] text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
            <span className="w-5"></span>
            <span className="flex-1">思路概要</span>
            <span className="w-16 text-center">要点</span>
            <span className="w-16"></span>
          </div>

          <AnimatePresence mode="popLayout">
            {filtered.map((m, i) => {
              const priCfg = PRIORITY_CFG[m.priority];
              const PriIcon = priCfg.icon;
              const doneCount = m.keyPoints.filter(kp => kp.done).length;
              return (
                <motion.div key={m.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedId(m.id)}
                  className={`group flex items-center gap-4 px-5 py-3 border-b border-white/[0.03] cursor-pointer transition-all hover:bg-white/[0.02] ${selectedId === m.id
                    ? 'bg-violet-500/[0.04] border-l-2 border-l-violet-400'
                    : 'border-l-2 border-l-transparent'}`}>
                  {/* Priority Icon */}
                  <div className={`flex-shrink-0 ${priCfg.color}`}>
                    <PriIcon className="w-4 h-4" />
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate text-slate-200 block">{m.title}</span>
                    {m.description && (
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{m.description}</p>
                    )}
                  </div>

                  {/* Key Points Count */}
                  <div className="w-16 text-center">
                    {m.keyPoints.length > 0 && (
                      <span className="text-[10px] text-slate-500">
                        <span className="text-emerald-400">{doneCount}</span>/{m.keyPoints.length}
                      </span>
                    )}
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
              <Lightbulb className="w-12 h-12 mb-3 opacity-10" />
              <p className="text-sm text-slate-500">暂无匹配的产品思路</p>
              <p className="text-xs opacity-40 mt-1">点击左侧「+」添加新的产品思路</p>
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
                className="absolute right-0 top-0 bottom-0 w-[55%] max-w-[700px] z-30 overflow-y-auto custom-scrollbar bg-[#0E1019] border-l border-white/5 shadow-2xl shadow-black/40"
                onClick={(e) => e.stopPropagation()}>
              {/* Detail Header */}
              <div className="sticky top-0 z-10 bg-[#0E1019]/95 backdrop-blur-sm border-b border-white/5 px-6 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${PRIORITY_CFG[selected.priority].bg} ${PRIORITY_CFG[selected.priority].color}`}>
                        {PRIORITY_CFG[selected.priority].label}
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

                {/* Product */}
                {selected.product && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <FolderOpen className="w-3 h-3 text-violet-400/60" />
                    <span className="text-[11px] text-slate-400">{selected.product}</span>
                  </div>
                )}
              </div>

              {/* Detail Content */}
              <div className="px-6 py-5 space-y-5">
                {/* Description */}
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 rounded-full bg-violet-400" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">核心描述</h3>
                  </div>
                  <div className="bg-[#12141D] rounded-xl border border-white/[0.04] px-4 py-3 focus-within:border-violet-500/30 transition-colors">
                    <textarea
                      defaultValue={selected.description}
                      key={`desc-${selected.id}-${selected.updatedAt}`}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== selected!.description) updateField(selected!.id, 'description', v);
                      }}
                      rows={3}
                      className="w-full bg-transparent text-[13px] text-slate-300 leading-relaxed resize-none outline-none placeholder-slate-600"
                      placeholder="描述这个产品思路的核心内容..." />
                  </div>
                </section>

                {/* Key Points */}
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full bg-emerald-400" />
                      <h3 className="text-xs font-bold text-emerald-400/80 uppercase tracking-wider">💡 关键要点</h3>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-500">
                        {selected.keyPoints.filter(kp => kp.done).length}/{selected.keyPoints.length}
                      </span>
                    </div>
                    <button onClick={() => addKeyPoint(selected!)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/20 transition-all">
                      <Plus className="w-3 h-3" /> 添加
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {selected.keyPoints.map(kp => (
                      <div key={kp.id} className="group/kp flex items-start gap-2 bg-[#12141D] rounded-lg border border-white/[0.04] px-3 py-2 hover:border-white/[0.08] transition-colors">
                        <button onClick={() => toggleKeyPoint(selected!, kp.id)} className="mt-0.5 flex-shrink-0">
                          {kp.done
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            : <Circle className="w-4 h-4 text-slate-600 hover:text-emerald-400 transition-colors" />}
                        </button>
                        <input
                          type="text"
                          defaultValue={kp.text}
                          key={`kp-${kp.id}-${kp.done}`}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v !== kp.text) updateKeyPoint(selected!, kp.id, v);
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                          className={`flex-1 bg-transparent text-[13px] outline-none placeholder-slate-600 ${kp.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}
                          placeholder="输入要点..."
                          autoFocus={!kp.text}
                        />
                        <button onClick={() => deleteKeyPoint(selected!, kp.id)}
                          className="flex-shrink-0 p-0.5 rounded opacity-0 group-hover/kp:opacity-100 text-slate-600 hover:text-red-400 transition-all">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {selected.keyPoints.length === 0 && (
                      <div className="text-center py-4 text-[11px] text-slate-600">
                        暂无要点，点击「添加」记录关键想法
                      </div>
                    )}
                  </div>
                </section>

                {/* Notes */}
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 rounded-full bg-amber-400" />
                    <h3 className="text-xs font-bold text-amber-400/80 uppercase tracking-wider">📝 补充备注</h3>
                  </div>
                  <div className="bg-amber-500/[0.03] rounded-xl border border-amber-500/10 px-4 py-3 focus-within:border-amber-500/30 transition-colors">
                    <textarea
                      defaultValue={selected.notes}
                      key={`notes-${selected.id}-${selected.updatedAt}`}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== selected!.notes) updateField(selected!.id, 'notes', v);
                      }}
                      rows={3}
                      className="w-full bg-transparent text-[13px] text-amber-300/70 leading-relaxed resize-none outline-none placeholder-amber-900/40"
                      placeholder="补充说明、技术调研、竞品参考..." />
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
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg bg-[#0F111A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <h3 className="text-base font-bold text-slate-100">{editItem ? '编辑产品思路' : '新建产品思路'}</h3>
                  <button onClick={() => setIsFormOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400"><X className="w-4 h-4" /></button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">思路标题 *</label>
                      <input value={formTitle} autoFocus onChange={e => setFormTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/50 transition-all"
                        placeholder="如：智能搜索全局化" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">所属产品</label>
                      <input value={formProduct} onChange={e => setFormProduct(e.target.value)}
                        list="product-suggestions"
                        className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/50 transition-all"
                        placeholder="如：AI 数枢" />
                      <datalist id="product-suggestions">
                        {allProducts.map(p => <option key={p} value={p} />)}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">核心描述</label>
                    <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={3}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/50 transition-all resize-none"
                      placeholder="简述这个产品思路的核心内容..." />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">优先级</label>
                    <div className="relative">
                      <select value={formPriority} onChange={e => setFormPriority(e.target.value as Priority)}
                        className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-violet-500/50 transition-all appearance-none cursor-pointer">
                        {(Object.entries(PRIORITY_CFG) as [Priority, typeof PRIORITY_CFG[Priority]][]).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
                  <button onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5">取消</button>
                  <button onClick={handleSubmit} disabled={!formTitle.trim()}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white disabled:opacity-40 shadow-lg shadow-violet-500/20 transition-all hover:opacity-90">
                    {editItem ? '保存' : '创建'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirmId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#0F111A] border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-xs pointer-events-auto text-center">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-base font-bold text-slate-200 mb-1">确认删除</h3>
                <p className="text-sm text-slate-400 mb-6">删除后将无法恢复，确定要删除这条产品思路吗？</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 rounded-xl text-sm text-slate-400 bg-white/5 hover:bg-white/10">取消</button>
                  <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20">删除</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
