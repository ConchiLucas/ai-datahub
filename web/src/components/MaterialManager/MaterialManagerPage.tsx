import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Shapes, Search, Plus, Copy, Edit2, Trash2, Clock, Check, X,
  Image as ImageIcon, Sparkles, Video, FileText, Tag, Filter, ExternalLink,
  Eye, CloudOff, Loader2, Link2, ChevronDown, Upload
} from 'lucide-react';
import { uploadMedia } from '@/api/gallery';
import {
  getMaterialList, createMaterial, updateMaterial, deleteMaterial,
  type Material, type MaterialSearchParams
} from '@/api/material';

// ─── Types ───────────────────────────
type MaterialType = 'image' | 'prompt' | 'video' | 'copywriting';

// ─── Type Config ─────────────────────
const TYPE_CONFIG: Record<MaterialType, { label: string; icon: any; cls: string; badge: string; accent: string }> = {
  image:       { label: '图片',   icon: ImageIcon, cls: 'text-pink-400',    badge: 'bg-pink-400/10 text-pink-400 border-pink-400/20',    accent: 'from-pink-500 to-rose-500' },
  prompt:      { label: '提示词', icon: Sparkles,  cls: 'text-violet-400',  badge: 'bg-violet-400/10 text-violet-400 border-violet-400/20', accent: 'from-violet-500 to-purple-500' },
  video:       { label: '视频',   icon: Video,     cls: 'text-sky-400',     badge: 'bg-sky-400/10 text-sky-400 border-sky-400/20',       accent: 'from-sky-500 to-blue-500' },
  copywriting: { label: '文案',   icon: FileText,  cls: 'text-amber-400',   badge: 'bg-amber-400/10 text-amber-400 border-amber-400/20',  accent: 'from-amber-500 to-orange-500' },
};

const ALL_TYPES: MaterialType[] = ['image', 'prompt', 'video', 'copywriting'];

// ─── Copy Hook ───────────────────────
function useCopy() {
  const [k, setK] = useState<string|null>(null);
  const cp = useCallback((t:string,key:string) => { navigator.clipboard.writeText(t); setK(key); setTimeout(()=>setK(null),1500); }, []);
  return { k, cp };
}

// ═══════════════════════════════════════
// Main Component
// ═══════════════════════════════════════
export default function MaterialManagerPage() {
  const navigate = useNavigate();
  const { k: copiedKey, cp } = useCopy();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<MaterialType | 'all'>('all');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Material | null>(null);
  const [detailItem, setDetailItem] = useState<Material | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<MaterialType>('image');
  const [formContent, setFormContent] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTags, setFormTags] = useState('');
  
  // Upload states
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'link'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch Data ────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMaterialList({
        page: 1,
        pageSize: 200,
        filterType: filterType !== 'all' ? filterType : '',
        filterTag: filterTag || '',
        searchQuery: searchQuery.trim(),
      }) as any;
      const list = res.data?.list || [];
      setMaterials(list);
      setTotalCount(res.data?.total || 0);
    } catch (err) {
      console.error('获取素材列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterTag, searchQuery]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // All tags (from loaded materials)
  const allTags = useMemo(() => {
    const s = new Set<string>();
    materials.forEach(m => (m.tags || []).forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [materials]);

  // Type counts (client-side for sidebar)
  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: materials.length };
    ALL_TYPES.forEach(t => c[t] = materials.filter(m => m.type === t).length);
    return c;
  }, [materials]);

  // Open form
  const openForm = (item?: Material) => {
    if (item) {
      setEditItem(item);
      setFormTitle(item.title); setFormType(item.type as MaterialType); setFormContent(item.content);
      setFormDesc(item.description); setFormTags((item.tags || []).join(', '));
      setUploadMethod('link');
    } else {
      setEditItem(null);
      setFormTitle(''); setFormType('image'); setFormContent('');
      setFormDesc(''); setFormTags('');
      setUploadMethod('upload');
    }
    setIsFormOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const res = await uploadMedia({ file, type: formType as 'image'|'video' }) as any;
      if (res.code === 0 && res.data?.url) {
         setFormContent(res.data.url);
      } else {
         if (res.url) setFormContent(res.url);
         else if (res.data?.url) setFormContent(res.data.url);
         else alert('上传异常，请确保后端正常启动。');
      }
    } catch (err) {
      console.error(err);
      alert('上传失败，请确保后端正常启动并配置正确');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) return;
    const tags = formTags.split(/[,，]/).map(t => t.trim()).filter(Boolean);
    try {
      if (editItem) {
        await updateMaterial({
          id: editItem.id,
          title: formTitle,
          type: formType,
          content: formContent,
          description: formDesc,
          tags,
        });
      } else {
        await createMaterial({
          title: formTitle,
          type: formType,
          content: formContent,
          description: formDesc,
          tags,
        });
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error('保存素材失败:', err);
      alert('保存失败，请检查后端是否正常');
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      await deleteMaterial(deleteConfirmId);
      if (detailItem?.id === deleteConfirmId) setDetailItem(null);
      setDeleteConfirmId(null);
      fetchData();
    } catch (err) {
      console.error('删除素材失败:', err);
      alert('删除失败');
    }
  };

  // ─── Card Renderer ────────────
  const renderCard = (item: Material) => {
    const tc = TYPE_CONFIG[item.type as MaterialType];
    if (!tc) return null;
    const Icon = tc.icon;
    const tags = item.tags || [];
    return (
      <motion.div key={item.id}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        layout className="group rounded-2xl border border-white/5 bg-[#0E1019]/80 overflow-hidden hover:border-white/10 hover:shadow-lg hover:shadow-black/20 transition-all cursor-pointer"
        onClick={() => setDetailItem(item)}>

        {/* Image Preview */}
        {item.type === 'image' && (
          <div className="relative aspect-video bg-[#0A0C14] overflow-hidden">
            <img src={item.content} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-3 right-3">
              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${tc.badge}`}><Icon className="w-2.5 h-2.5" />{tc.label}</span>
            </div>
          </div>
        )}

        {/* Video Card */}
        {item.type === 'video' && (
          <div className="relative aspect-video bg-gradient-to-br from-sky-500/5 to-blue-500/5 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-500/30 group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6 text-sky-400 ml-0.5" />
            </div>
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${tc.badge}`}><Icon className="w-2.5 h-2.5" />{tc.label}</span>
              <span className="text-[10px] text-sky-400/60 font-mono truncate max-w-[60%]">{item.content}</span>
            </div>
          </div>
        )}

        {/* Prompt Card */}
        {item.type === 'prompt' && (
          <div className="p-4 pb-2 bg-gradient-to-br from-violet-500/[0.03] to-purple-500/[0.03]">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${tc.badge}`}><Icon className="w-2.5 h-2.5" />{tc.label}</span>
            </div>
            <p className="text-xs text-slate-400 font-mono leading-5 line-clamp-4 whitespace-pre-wrap">{item.content}</p>
          </div>
        )}

        {/* Copywriting Card */}
        {item.type === 'copywriting' && (
          <div className="p-4 pb-2 bg-gradient-to-br from-amber-500/[0.03] to-orange-500/[0.03]">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${tc.badge}`}><Icon className="w-2.5 h-2.5" />{tc.label}</span>
            </div>
            <p className="text-xs text-slate-400 leading-5 line-clamp-4 whitespace-pre-wrap">{item.content}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/[0.03]">
          <h3 className="text-sm font-semibold text-slate-200 mb-1 truncate">{item.title}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 flex-wrap overflow-hidden max-h-5">
              {tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500 border border-white/5">{tag}</span>
              ))}
              {tags.length > 3 && <span className="text-[9px] text-slate-600">+{tags.length - 3}</span>}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={e => { e.stopPropagation(); cp(item.content, String(item.id)); }} title="复制内容"
                className={`p-1.5 rounded-lg transition-all ${copiedKey === String(item.id) ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-slate-500'}`}>
                {copiedKey === String(item.id) ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
              <button onClick={e => { e.stopPropagation(); openForm(item); }} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-lime-400"><Edit2 className="w-3 h-3" /></button>
              <button onClick={e => { e.stopPropagation(); setDeleteConfirmId(item.id); }} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[50%] h-[350px] bg-lime-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-[#0F111A]/80 flex-shrink-0 flex items-center justify-between px-5 z-20 backdrop-blur-xl gap-3">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-lime-500/10 text-lime-400"><Shapes className="w-5 h-5" /></div>
            <div>
              <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-lime-400 to-green-500">素材管理</h1>
              <p className="text-[10px] text-slate-500">{totalCount} 个素材</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center mx-3 gap-2">
          
          {/* Tag Dropdown */}
          <div className="relative flex-shrink-0">
            <select value={filterTag || ''} onChange={e => setFilterTag(e.target.value || null)} className="appearance-none pl-3 pr-8 py-2 bg-[#151926]/90 border border-white/10 rounded-xl text-sm text-slate-300 outline-none focus:border-lime-500/50 cursor-pointer max-w-[150px]">
              <option value="">全部标签</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative group flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-lime-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索素材..."
              className="pl-10 pr-4 py-2 w-full bg-[#151926]/90 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-lime-500/50 placeholder-slate-500" />
          </div>
        </div>
        <button onClick={() => openForm()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime-500 to-green-500 text-white font-medium hover:opacity-90 text-sm shadow-lg shadow-lime-500/20 flex-shrink-0">
          <Plus className="w-4 h-4" />添加素材
        </button>
      </header>

      <main className="flex-1 flex min-h-0 overflow-hidden z-10">
        {/* Left: Filters */}
        <aside className="w-56 flex-shrink-0 border-r border-white/5 bg-[#0A0C14]/60 flex flex-col overflow-hidden">
          {/* Type Filter */}
          <div className="px-3 py-2.5 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">素材类型</div>
          <div className="p-2 space-y-0.5 overflow-y-auto scrollbar-thin">
            <button onClick={() => { setFilterType('all'); setFilterTag(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${filterType === 'all' ? 'bg-lime-500/10 text-lime-400' : 'text-slate-400 hover:bg-white/[0.03]'}`}>
              <Filter className="w-4 h-4" /><span className="flex-1 text-left">全部</span>
              <span className="text-[10px] text-slate-600">{typeCounts.all}</span>
            </button>
            {ALL_TYPES.map(t => {
              const tc = TYPE_CONFIG[t]; const Icon = tc.icon;
              return (
                <button key={t} onClick={() => { setFilterType(t); setFilterTag(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${filterType === t ? 'bg-lime-500/10 text-lime-400' : 'text-slate-400 hover:bg-white/[0.03]'}`}>
                  <Icon className={`w-4 h-4 ${tc.cls}`} /><span className="flex-1 text-left">{tc.label}</span>
                  <span className="text-[10px] text-slate-600">{typeCounts[t] || 0}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Card Grid */}
        <section className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-lime-400" />
              <p className="text-sm">加载中...</p>
            </div>
          ) : materials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {materials.map(item => renderCard(item))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Shapes className="w-14 h-14 mb-4 opacity-10" />
              <p className="text-sm mb-1">暂无素材</p>
              <p className="text-xs text-slate-600">点击「添加素材」开始收集</p>
            </div>
          )}
        </section>
      </main>

      {/* ─── Detail Modal ─── */}
      <AnimatePresence>
        {detailItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDetailItem(null)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl bg-[#12141D] border border-white/10 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto scrollbar-thin pointer-events-auto">
                {/* Detail Header */}
                <div className="sticky top-0 bg-[#12141D] border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    {(() => { const tc = TYPE_CONFIG[detailItem.type as MaterialType]; if(!tc) return null; const Icon = tc.icon; return <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border ${tc.badge}`}><Icon className="w-3.5 h-3.5" />{tc.label}</span>; })()}
                    <h2 className="text-lg font-bold text-white">{detailItem.title}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { cp(detailItem.content, `detail-${detailItem.id}`); }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border transition-all ${copiedKey === `detail-${detailItem.id}` ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/5'}`}>
                      {copiedKey === `detail-${detailItem.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedKey === `detail-${detailItem.id}` ? '已复制' : '复制内容'}
                    </button>
                    <button onClick={() => { openForm(detailItem); setDetailItem(null); }}
                      className="p-2 rounded-xl hover:bg-white/10 text-slate-400"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDetailItem(null)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400"><X className="w-5 h-5" /></button>
                  </div>
                </div>

                <div className="p-6">
                  {detailItem.description && <p className="text-sm text-slate-400 mb-4">{detailItem.description}</p>}

                  {/* Content by type */}
                  {detailItem.type === 'image' && (
                    <div className="rounded-xl overflow-hidden border border-white/5 mb-4">
                      <img src={detailItem.content} alt={detailItem.title} className="w-full max-h-[50vh] object-contain bg-black" />
                    </div>
                  )}
                  {detailItem.type === 'video' && (
                    <div className="rounded-xl border border-white/5 p-4 bg-[#0E1019] mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-sky-500/10"><Video className="w-6 h-6 text-sky-400" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 font-medium mb-1">视频链接</p>
                          <a href={detailItem.content} target="_blank" rel="noreferrer"
                            className="text-xs font-mono text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 truncate">
                            {detailItem.content} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  {(detailItem.type === 'prompt' || detailItem.type === 'copywriting') && (
                    <div className={`rounded-xl border border-white/5 p-5 mb-4 ${detailItem.type === 'prompt' ? 'bg-violet-500/[0.03]' : 'bg-amber-500/[0.03]'}`}>
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-7">{detailItem.content}</pre>
                    </div>
                  )}

                  {/* Image URL */}
                  {detailItem.type === 'image' && (
                    <div className="rounded-lg border border-white/5 p-3 bg-[#0E1019] mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600 font-mono truncate flex-1 mr-2">{detailItem.content}</span>
                        <button onClick={() => cp(detailItem.content, `url-${detailItem.id}`)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition-all ${copiedKey === `url-${detailItem.id}` ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-slate-400 border-white/5'}`}>
                          {copiedKey === `url-${detailItem.id}` ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}复制链接
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tags + Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(detailItem.tags || []).map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-lg bg-white/5 text-slate-400 border border-white/5"># {tag}</span>
                      ))}
                    </div>
                    <span className="text-xs text-slate-600 flex items-center gap-1"><Clock className="w-3 h-3" />{detailItem.updatedAt}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Create/Edit Modal ─── */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg bg-[#12141D] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin pointer-events-auto">
                <div className="sticky top-0 bg-[#12141D] border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
                  <h2 className="text-lg font-bold text-white">{editItem ? '编辑素材' : '添加素材'}</h2>
                  <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">标题 *</label>
                    <input value={formTitle} onChange={e => setFormTitle(e.target.value)} autoFocus
                      className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-lime-500/50" placeholder="素材标题" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">类型 *</label>
                    <div className="grid grid-cols-4 gap-2">
                      {ALL_TYPES.map(t => {
                        const tc = TYPE_CONFIG[t]; const Icon = tc.icon;
                        return (
                          <button key={t} type="button" onClick={() => { setFormType(t); if(t === 'image' || t === 'video') setUploadMethod('upload'); }}
                            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs transition-all ${formType === t ? `${tc.badge} border-opacity-50` : 'text-slate-500 bg-white/5 border-white/10 hover:bg-white/10'}`}>
                            <Icon className="w-5 h-5" />{tc.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-slate-400">
                        {formType === 'image' ? '图片内容' : formType === 'video' ? '视频内容' : formType === 'prompt' ? '提示词内容' : '文案内容'} *
                      </label>
                      {(formType === 'image' || formType === 'video') && (
                        <div className="flex bg-black/20 p-0.5 rounded-lg border border-white/5">
                          <button type="button" onClick={() => setUploadMethod('upload')} className={`px-2.5 py-1 text-[10px] rounded-md transition-all ${uploadMethod === 'upload' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>本地上传</button>
                          <button type="button" onClick={() => setUploadMethod('link')} className={`px-2.5 py-1 text-[10px] rounded-md transition-all ${uploadMethod === 'link' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>填写链接</button>
                        </div>
                      )}
                    </div>
                    
                    {(formType === 'image' || formType === 'video') ? (
                      uploadMethod === 'upload' ? (
                        <div className="w-full bg-[#1a1d2e] border border-white/10 border-dashed rounded-xl px-4 py-8 flex flex-col items-center justify-center gap-3 transition-colors hover:border-lime-500/30">
                           <input type="file" ref={fileInputRef} className="hidden" accept={formType === 'image' ? 'image/*' : 'video/*'} onChange={handleFileUpload} />
                           {isUploading ? (
                             <div className="flex flex-col items-center gap-2">
                               <Loader2 className="w-6 h-6 text-lime-400 animate-spin" />
                               <span className="text-xs text-slate-400">正在上传...</span>
                             </div>
                           ) : formContent && uploadMethod === 'upload' ? (
                             <div className="flex flex-col items-center gap-2">
                               <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Check className="w-5 h-5" /></div>
                               <span className="text-xs text-emerald-400">素材已就绪</span>
                               <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[10px] text-slate-500 mt-1 hover:text-white underline">重新上传</button>
                             </div>
                           ) : (
                             <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                               <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-white/10 group-hover:text-white transition-all"><Upload className="w-5 h-5" /></div>
                               <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">点击选择文件 ({formType === 'image' ? '图片' : '视频'})</span>
                             </div>
                           )}
                        </div>
                      ) : (
                        <input value={formContent} onChange={e => setFormContent(e.target.value)}
                          className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-lime-500/50 font-mono"
                          placeholder={formType === 'image' ? 'https://...' : 'https://youtube.com/...'} />
                      )
                    ) : (
                      <textarea value={formContent} onChange={e => setFormContent(e.target.value)}
                        className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-lime-500/50 resize-none"
                        rows={6} placeholder={formType === 'prompt' ? '输入 AI 提示词...' : '输入文案内容...'} />
                    )}
                  </div>
                  {formType === 'image' && formContent && (
                    <div className="rounded-xl border border-white/5 overflow-hidden bg-black/30">
                      <img src={formContent} alt="preview" className="w-full max-h-40 object-contain"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">描述</label>
                    <input value={formDesc} onChange={e => setFormDesc(e.target.value)}
                      className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-lime-500/50" placeholder="简要说明" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">标签 <span className="text-slate-600">(逗号分隔)</span></label>
                    <input value={formTags} onChange={e => setFormTags(e.target.value)}
                      className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-lime-500/50" placeholder="如：产品, AI, 营销" />
                  </div>
                </div>
                <div className="sticky bottom-0 bg-[#12141D] border-t border-white/5 px-6 py-4 flex justify-end gap-3">
                  <button onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5">取消</button>
                  <button onClick={handleSubmit} disabled={!formTitle.trim() || !formContent.trim()}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-lime-500 to-green-500 text-white hover:opacity-90 disabled:opacity-40 shadow-lg shadow-lime-500/20">
                    {editItem ? '保存修改' : '添加素材'}
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
                  <div className="p-2 rounded-xl bg-red-500/10"><Trash2 className="w-5 h-5 text-red-400" /></div>
                  <h3 className="text-lg font-bold text-slate-100">确认删除</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6">删除后无法恢复，确定要删除这个素材吗？</p>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5">取消</button>
                  <button onClick={confirmDelete} className="px-5 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20">确认删除</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
