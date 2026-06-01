import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Camera, Plus, Trash2, Search, X, Clock, ChevronDown, Edit2,
  ZoomIn, Upload, Image as ImageIcon, Copy, Check, Tag
} from 'lucide-react';
import * as ScreenshotApi from '@/api/screenshot';
import { withApiPrefix } from '@/utils/apiPath';

// ─── Types ───────────────────────────
interface Screenshot {
  id: number;
  url: string;
  description: string;
  tag: string;
  createdAt: string;
}

function getApiUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return withApiPrefix(url) || '';
}

function getRelativeTime(dateStr: string) {
  if (!dateStr) return '';
  const ts = new Date(dateStr.replace(' ', 'T')).getTime();
  if (isNaN(ts)) return dateStr;
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return dateStr;
}

// ═══════════════════════════════════════
export default function ScreenshotManagerPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<Screenshot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');

  // Create
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDesc, setCreateDesc] = useState('');
  const [createTag, setCreateTag] = useState('');
  const [createImage, setCreateImage] = useState('');
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Preview
  const [previewItem, setPreviewItem] = useState<Screenshot | null>(null);

  // Edit
  const [editItem, setEditItem] = useState<Screenshot | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editTag, setEditTag] = useState('');

  // Delete
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Copy
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const createFileRef = useRef<HTMLInputElement>(null);

  // Load / Save
  const fetchDocs = useCallback(async () => {
    try {
      const res = await ScreenshotApi.getScreenshotList({ page: 1, pageSize: 999 }) as any;
      if (res.code === 0) setItems(res.data.list || []);
    } catch {}
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // Tags
  const allTags = useMemo(() => {
    const tags = new Set(items.map(i => i.tag).filter(Boolean));
    return Array.from(tags);
  }, [items]);

  // Filtered
  const filtered = useMemo(() => {
    let result = items;
    if (filterTag) result = result.filter(i => i.tag === filterTag);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.description.toLowerCase().includes(q) || i.tag.toLowerCase().includes(q));
    }
    return result;
  }, [items, searchQuery, filterTag]);

  // ─── File reading ─────────────────
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type.startsWith('image/')) {
      setCreateFile(file);
      setCreateImage(URL.createObjectURL(file));
    }
  }, []);

  // Paste handler for create modal
  useEffect(() => {
    if (!isCreateOpen) return;
    const handler = (e: ClipboardEvent) => {
      const itemsList = e.clipboardData?.items;
      if (!itemsList) return;
      for (const item of itemsList) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            setCreateFile(file);
            setCreateImage(URL.createObjectURL(file));
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [isCreateOpen]);

  // ─── Handlers ────────────────────────
  const handleCreate = async () => {
    if (!createFile) return;
    const formData = new FormData();
    formData.append('file', createFile);
    formData.append('description', createDesc.trim());
    formData.append('tag', createTag.trim());

    try {
      await ScreenshotApi.createScreenshot(formData);
      fetchDocs();
      setIsCreateOpen(false);
      setCreateImage(''); setCreateFile(null); setCreateDesc(''); setCreateTag('');
    } catch {}
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    try {
      await ScreenshotApi.updateScreenshot({ id: editItem.id, description: editDesc.trim(), tag: editTag.trim() });
      fetchDocs();
    } catch {}
    setEditItem(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await ScreenshotApi.deleteScreenshot({ id: deleteConfirmId });
      if (previewItem?.id === deleteConfirmId) setPreviewItem(null);
      fetchDocs();
    } catch {}
    setDeleteConfirmId(null);
  };

  const handleCopyImage = async (item: Screenshot) => {
    try {
      const res = await fetch(getApiUrl(item.url));
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch { }
  };

  // Drop handlers for create modal
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      setCreateFile(files[0]);
      setCreateImage(URL.createObjectURL(files[0]));
    }
  }, []);

  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans overflow-hidden relative">
      <div className="absolute top-0 left-1/3 w-[40%] h-[300px] bg-sky-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="h-14 border-b border-white/5 bg-[#0A0C12]/90 flex-shrink-0 flex items-center justify-between px-5 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-400">截图管理</h1>
            <p className="text-[10px] text-slate-500">{items.length} 张截图</p>
          </div>
        </div>

        {/* Center: Tag Filter + Search */}
        <div className="flex items-center gap-2 flex-1 justify-center max-w-md mx-4">
          <div className="relative flex-shrink-0">
            <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 bg-[#12141D] border border-white/5 rounded-lg text-xs text-slate-200 outline-none focus:border-sky-500/40 transition-all cursor-pointer min-w-[90px]">
              <option value="">全部标签</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索截图说明..."
              className="w-full pl-8 pr-3 py-2 bg-[#12141D] border border-white/5 rounded-lg text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500/40 transition-all" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => { setCreateImage(''); setCreateDesc(''); setCreateTag(''); setIsCreateOpen(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-medium text-xs hover:opacity-90 shadow-lg shadow-sky-500/20 transition-all">
            <Plus className="w-3.5 h-3.5" />添加截图
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 overflow-auto custom-scrollbar p-5 z-10">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((item, i) => (
                <motion.div key={item.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  className="group bg-[#0E1018] border border-white/5 rounded-2xl overflow-hidden hover:border-sky-500/30 transition-all hover:shadow-lg hover:shadow-sky-500/5">

                  {/* Image area */}
                  <div className="relative aspect-video bg-[#07080C] cursor-pointer overflow-hidden" onClick={() => setPreviewItem(item)}>
                    <img src={getApiUrl(item.url)} alt={item.description} loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 transition-all"
                        onClick={e => { e.stopPropagation(); setPreviewItem(item); }}>
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 transition-all"
                        onClick={e => { e.stopPropagation(); handleCopyImage(item); }}>
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Info area */}
                  <div className="p-3.5">
                    {item.description ? (
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mb-2">{item.description}</p>
                    ) : (
                      <p className="text-xs text-slate-600 italic mb-2">暂无说明</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.tag && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400/80 border border-sky-500/10">{item.tag}</span>
                        )}
                        <span className="text-[10px] text-slate-600 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />{getRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditItem(item); setEditDesc(item.description); setEditTag(item.tag); }}
                          className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-sky-400 transition-all">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Camera className="w-16 h-16 mb-4 opacity-10" />
            <p className="text-sm mb-1 text-slate-400">{items.length === 0 ? '还没有截图' : '没有匹配的截图'}</p>
            <p className="text-xs opacity-50">{items.length === 0 ? '点击「添加截图」或粘贴图片' : '尝试调整搜索条件'}</p>
          </div>
        )}
      </main>

      {/* ─── Create Modal ─── */}
      <AnimatePresence>
        {isCreateOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-lg bg-[#12141D] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20">
                      <Camera className="w-4 h-4 text-sky-400" />
                    </div>
                    <h3 className="text-base font-bold text-slate-100">添加截图</h3>
                  </div>
                  <button onClick={() => setIsCreateOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Image Upload Area */}
                  {createImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/10">
                      <img src={createImage} alt="preview" className="w-full max-h-[300px] object-contain bg-black/30" />
                      <button onClick={() => setCreateImage('')}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white/80 hover:text-white hover:bg-red-500/60 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-sky-500/50 bg-sky-500/5' : 'border-white/10 hover:border-sky-500/30 hover:bg-white/[0.02]'}`}
                      onClick={() => createFileRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}>
                      <Upload className="w-10 h-10 mx-auto mb-3 text-slate-500" />
                      <p className="text-sm text-slate-400 mb-1">拖拽图片到此处，或点击上传</p>
                      <p className="text-xs text-slate-600">支持 Ctrl+V 粘贴截图</p>
                    </div>
                  )}
                  <input ref={createFileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e.target.files)} />

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">截图说明</label>
                    <textarea value={createDesc} onChange={e => setCreateDesc(e.target.value)} rows={2}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500/50 transition-all resize-none"
                      placeholder="描述这张截图的内容..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">标签</label>
                    <input value={createTag} onChange={e => setCreateTag(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500/50 transition-all"
                      placeholder="如：Bug截图 / UI设计 / 参考" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
                  <button onClick={() => setIsCreateOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">取消</button>
                  <button onClick={handleCreate} disabled={!createImage}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-40 shadow-lg shadow-sky-500/20 transition-all">
                    保存截图
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Preview Lightbox ─── */}
      <AnimatePresence>
        {previewItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPreviewItem(null)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                onClick={e => e.stopPropagation()}
                className="max-w-[90vw] max-h-[90vh] flex flex-col pointer-events-auto">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img src={getApiUrl(previewItem.url)} alt={previewItem.description}
                    className="max-w-[90vw] max-h-[75vh] object-contain bg-[#0A0C12]" />
                </div>
                <div className="mt-3 flex items-center justify-between px-1">
                  <div className="flex-1">
                    {previewItem.description && <p className="text-sm text-slate-300 mb-1">{previewItem.description}</p>}
                    <div className="flex items-center gap-2">
                      {previewItem.tag && <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400/80">{previewItem.tag}</span>}
                      <span className="text-[10px] text-slate-600 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{previewItem.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleCopyImage(previewItem)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-sky-400 transition-all">
                      {copiedId === previewItem.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setPreviewItem(null)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Edit Modal ─── */}
      <AnimatePresence>
        {editItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditItem(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md bg-[#12141D] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20">
                      <Edit2 className="w-4 h-4 text-sky-400" />
                    </div>
                    <h3 className="text-base font-bold text-slate-100">编辑截图信息</h3>
                  </div>
                  <button onClick={() => setEditItem(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="rounded-xl overflow-hidden border border-white/5">
                    <img src={getApiUrl(editItem.url)} alt="" className="w-full max-h-[150px] object-cover bg-black/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">截图说明</label>
                    <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500/50 transition-all resize-none"
                      placeholder="描述这张截图..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">标签</label>
                    <input value={editTag} onChange={e => setEditTag(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleEditSave()}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500/50 transition-all"
                      placeholder="标签" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
                  <button onClick={() => setEditItem(null)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">取消</button>
                  <button onClick={handleEditSave}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:opacity-90 shadow-lg shadow-sky-500/20 transition-all">
                    保存
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
                <p className="text-sm text-slate-400 mb-6">删除后将无法恢复，确定要删除这张截图吗？</p>
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
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}
