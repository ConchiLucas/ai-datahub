import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, Plus, X, Copy, Check,
  Trash2, Clock, Edit3, Pin, PinOff, StickyNote, Star, Loader2
} from 'lucide-react';
import { createDraft, updateDraft, deleteDraft, getDraftList } from '@/api/draft';

// ─── Types ───────────────────────────
interface DraftItem {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  starred: boolean;
  color: string;
  CreatedAt: string;
  UpdatedAt: string;
}

// ─── Color palette for draft cards ───
const CARD_COLORS = [
  { key: 'default', bg: 'bg-white/[0.03]', border: 'border-white/5', headerBg: 'bg-white/[0.02]' },
  { key: 'blue', bg: 'bg-blue-500/[0.04]', border: 'border-blue-500/10', headerBg: 'bg-blue-500/[0.06]' },
  { key: 'violet', bg: 'bg-violet-500/[0.04]', border: 'border-violet-500/10', headerBg: 'bg-violet-500/[0.06]' },
  { key: 'emerald', bg: 'bg-emerald-500/[0.04]', border: 'border-emerald-500/10', headerBg: 'bg-emerald-500/[0.06]' },
  { key: 'amber', bg: 'bg-amber-500/[0.04]', border: 'border-amber-500/10', headerBg: 'bg-amber-500/[0.06]' },
  { key: 'rose', bg: 'bg-rose-500/[0.04]', border: 'border-rose-500/10', headerBg: 'bg-rose-500/[0.06]' },
];

const getColorConfig = (color: string) => CARD_COLORS.find(c => c.key === color) || CARD_COLORS[0];
const getRandomColor = () => CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)].key;

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function DraftManagerPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Edit/Create states
  const [editingItem, setEditingItem] = useState<DraftItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createData, setCreateData] = useState({ title: '', content: '' });

  // Quick input state
  const [quickInput, setQuickInput] = useState('');
  const quickInputRef = useRef<HTMLTextAreaElement>(null);

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // ─── Fetch data from backend ───
  const fetchDrafts = useCallback(async () => {
    try {
      const res = await getDraftList({
        page: 1,
        pageSize: 200,
        keyword: '',
      });
      if ((res as any)?.code === 0) {
        setItems((res as any)?.data?.list || []);
      }
    } catch (e) {
      console.error('获取草稿列表失败', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (showStarredOnly) result = result.filter(i => i.starred);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.content.toLowerCase().includes(q)
      );
    }

    // Sort: pinned first, then by updatedAt desc
    return [...result].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.UpdatedAt).getTime() - new Date(a.UpdatedAt).getTime();
    });
  }, [items, searchQuery, showStarredOnly]);

  const handleCopy = useCallback((item: DraftItem) => {
    navigator.clipboard.writeText(item.content);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleTogglePin = useCallback(async (id: number) => {
    const target = items.find(i => i.id === id);
    if (!target) return;
    const newPinned = !target.pinned;
    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, pinned: newPinned } : i));
    try {
      await updateDraft({ id, pinned: newPinned, starred: target.starred, title: target.title, content: target.content, color: target.color });
    } catch {
      // Revert on failure
      setItems(prev => prev.map(i => i.id === id ? { ...i, pinned: !newPinned } : i));
    }
  }, [items]);

  const handleToggleStar = useCallback(async (id: number) => {
    const target = items.find(i => i.id === id);
    if (!target) return;
    const newStarred = !target.starred;
    setItems(prev => prev.map(i => i.id === id ? { ...i, starred: newStarred } : i));
    try {
      await updateDraft({ id, starred: newStarred, pinned: target.pinned, title: target.title, content: target.content, color: target.color });
    } catch {
      setItems(prev => prev.map(i => i.id === id ? { ...i, starred: !newStarred } : i));
    }
  }, [items]);

  const handleDelete = useCallback(async (id: number) => {
    const backup = items.find(i => i.id === id);
    setItems(prev => prev.filter(i => i.id !== id));
    setDeleteConfirmId(null);
    try {
      await deleteDraft({ id });
    } catch {
      if (backup) setItems(prev => [...prev, backup]);
    }
  }, [items]);

  const handleQuickCreate = async () => {
    if (!quickInput.trim()) return;
    const lines = quickInput.trim().split('\n');
    const color = getRandomColor();
    try {
      const res: any = await createDraft({
        title: lines[0].slice(0, 50) || '无标题草稿',
        content: quickInput.trim(),
        color,
      });
      if (res?.code === 0 && res.data) {
        setItems(prev => [res.data, ...prev]);
      }
      setQuickInput('');
    } catch (e) {
      console.error('快速创建草稿失败', e);
    }
  };

  const openCreateModal = () => {
    setCreateData({ title: '', content: '' });
    setIsCreating(true);
  };

  const handleSaveCreate = async () => {
    if (!createData.content.trim()) return;
    const color = getRandomColor();
    try {
      const res: any = await createDraft({
        title: createData.title.trim() || createData.content.trim().split('\n')[0].slice(0, 50),
        content: createData.content.trim(),
        color,
      });
      if (res?.code === 0 && res.data) {
        setItems(prev => [res.data, ...prev]);
      }
      setIsCreating(false);
    } catch (e) {
      console.error('创建草稿失败', e);
    }
  };

  const openEditItem = (item: DraftItem) => {
    setEditingItem({ ...item });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await updateDraft({
        id: editingItem.id,
        title: editingItem.title,
        content: editingItem.content,
        pinned: editingItem.pinned,
        starred: editingItem.starred,
        color: editingItem.color,
      });
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...editingItem, UpdatedAt: new Date().toISOString() } : i));
      setEditingItem(null);
    } catch (e) {
      console.error('更新草稿失败', e);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#07080C] text-slate-200 flex flex-col font-sans overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/[0.03] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/[0.04] blur-[120px] pointer-events-none" />

      {/* ─── Header ─── */}
      <header className="h-16 border-b border-white/5 bg-[#0A0C14]/80 flex-shrink-0 flex items-center justify-between px-6 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-4 w-60">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">草稿便签</h1>
              <p className="text-[10px] text-slate-500 -mt-0.5">快速记录 · 随手查阅</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 flex justify-center max-w-2xl px-6 gap-3">
          <div className="relative group flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索随手记的内容..."
              className="w-full pl-10 pr-4 py-2 bg-[#12141E] border border-white/5 focus:border-amber-500/40 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:shadow-[0_0_20px_rgba(245,158,11,0.08)]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowStarredOnly(!showStarredOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all border ${
              showStarredOnly
                ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'
                : 'bg-[#12141E] text-slate-400 border-white/5 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <Star className={`w-4 h-4 ${showStarredOnly ? 'fill-yellow-400' : ''}`} />
            <span>收藏夹</span>
          </button>
        </div>

        <div className="w-60 flex justify-end">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-medium transition-all text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>新建便签</span>
          </button>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col overflow-hidden max-w-[1600px] w-full mx-auto relative">
        {/* Quick input bar */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="relative bg-[#12141E] border border-white/5 rounded-xl focus-within:border-amber-500/30 transition-all focus-within:shadow-[0_0_24px_rgba(245,158,11,0.06)] group">
            <textarea
              ref={quickInputRef}
              value={quickInput}
              onChange={e => setQuickInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleQuickCreate();
                }
              }}
              placeholder="在这里快速记录... (⌘/Ctrl + Enter 保存)"
              rows={3}
              className="w-full px-5 py-4 bg-transparent text-[15px] text-slate-200 placeholder-slate-600 outline-none resize-none leading-relaxed"
            />
            {quickInput.trim() && (
              <div className="absolute right-4 bottom-3 flex items-center gap-2">
                <span className="text-xs text-slate-500 hidden sm:inline-block">⌘/Ctrl+↵</span>
                <button
                  onClick={handleQuickCreate}
                  className="px-4 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors"
                >
                  保存
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Header counts */}
        {!loading && filteredItems.length > 0 && (
          <div className="px-6 pb-3 text-sm text-slate-500 flex items-center gap-2 flex-shrink-0">
            <span>{showStarredOnly ? '已收藏' : '全部便签'}</span>
            <span className="bg-white/5 px-2 py-0.5 rounded-full text-xs">{filteredItems.length}</span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        )}

        {/* Cards grid */}
        {!loading && (
          <div className="flex-1 overflow-y-auto px-6 pb-8 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, i) => {
                  const cc = getColorConfig(item.color);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ delay: i * 0.02, duration: 0.2 }}
                      className={`group relative rounded-2xl border ${cc.border} ${cc.bg} overflow-hidden hover:border-white/10 transition-all hover:shadow-lg hover:-translate-y-0.5 flex flex-col`}
                    >
                      {/* Card header */}
                      <div className={`flex items-start justify-between px-5 pt-5 pb-3 ${cc.headerBg}`}>
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="flex items-center gap-2">
                            {item.pinned && <Pin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                            <h3 className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                              {item.title}
                            </h3>
                          </div>
                        </div>

                        {/* Star icon */}
                        <button
                          onClick={() => handleToggleStar(item.id)}
                          className="p-1 -mr-1 -mt-1 flex-shrink-0 transition-all"
                        >
                          {item.starred
                            ? <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            : <Star className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-yellow-400 transition-all" />
                          }
                        </button>
                      </div>

                      {/* Card content */}
                      <div
                        className="px-5 pb-4 cursor-pointer flex-1"
                        onClick={() => openEditItem(item)}
                      >
                        <pre className="text-[13px] text-slate-400 whitespace-pre-wrap font-sans leading-relaxed line-clamp-[8] break-all group-hover:text-slate-300 transition-colors">
                          {item.content}
                        </pre>
                      </div>

                      {/* Card footer */}
                      <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.03] bg-black/10 mt-auto">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <Clock className="w-3 h-3" />
                          {formatTime(item.UpdatedAt)}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCopy(item)}
                            className={`p-1.5 rounded-lg transition-all ${
                              copiedId === item.id
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'hover:bg-white/10 text-slate-400 hover:text-white'
                            }`}
                            title="复制内容"
                          >
                            {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleTogglePin(item.id)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-400 transition-all"
                            title={item.pinned ? '取消置顶' : '置顶'}
                          >
                            {item.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-all"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {filteredItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-slate-500">
                <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
                  <StickyNote className="w-10 h-10 text-slate-600" />
                </div>
                <p className="text-base text-slate-400 mb-2">这里空空如也</p>
                <p className="text-sm text-slate-600">
                  {searchQuery ? '没有找到匹配的内容' : '在上方快速记录栏开始你的随手记'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── Create/Edit Modal ─── */}
      <AnimatePresence>
        {(isCreating || editingItem) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setIsCreating(false); setEditingItem(null); }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-3xl bg-[#12141E] border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[75vh] max-h-[800px]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0 bg-black/20">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isCreating ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
                    {isCreating ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{isCreating ? '新建便签' : '编辑便签'}</h3>
                </div>
                <button onClick={() => { setIsCreating(false); setEditingItem(null); }} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex flex-col flex-1 gap-5 overflow-hidden">
                <div className="flex-shrink-0">
                  <input
                    type="text"
                    value={isCreating ? createData.title : editingItem?.title || ''}
                    onChange={e => isCreating ? setCreateData({ ...createData, title: e.target.value }) : setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                    placeholder="标题（可选，留空将自动提取内容首行）"
                    className="w-full px-5 py-3.5 bg-black/20 border border-white/5 rounded-xl text-base font-medium text-slate-200 placeholder-slate-600 outline-none focus:border-amber-500/40 focus:bg-[#07080C] transition-all"
                  />
                </div>

                <div className="flex-1 flex flex-col">
                  <textarea
                    value={isCreating ? createData.content : editingItem?.content || ''}
                    onChange={e => isCreating ? setCreateData({ ...createData, content: e.target.value }) : setEditingItem(prev => prev ? { ...prev, content: e.target.value } : null)}
                    placeholder="开始记录你的想法..."
                    autoFocus
                    className="w-full flex-1 px-5 py-4 bg-[#07080C] border border-white/5 rounded-xl text-[15px] font-sans text-slate-300 placeholder-slate-700 outline-none focus:border-amber-500/40 transition-all resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 flex-shrink-0 bg-black/20">
                <div className="text-[11px] text-slate-600">
                  {editingItem && `更新于 ${formatTime(editingItem.UpdatedAt)}`}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setIsCreating(false); setEditingItem(null); }} className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">取消</button>
                  <button
                    onClick={isCreating ? handleSaveCreate : handleSaveEdit}
                    disabled={isCreating ? !createData.content.trim() : !editingItem?.content.trim()}
                    className={`px-8 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      isCreating ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 shadow-amber-500/20' : 'bg-gradient-to-r from-blue-500 to-violet-500 hover:opacity-90 shadow-blue-500/20'
                    }`}
                  >
                    {isCreating ? '保存便签' : '保存修改'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirm ─── */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-[60] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#12141E] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-red-500/10"><Trash2 className="w-5 h-5 text-red-400" /></div>
                <h3 className="text-lg font-bold text-slate-100">确认删除</h3>
              </div>
              <p className="text-sm text-slate-400 mb-6">删除后将无法恢复此便签，确定要继续吗？</p>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors">取消</button>
                <button onClick={() => handleDelete(deleteConfirmId)} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-500/90 hover:bg-red-500 text-white transition-colors shadow-lg shadow-red-500/20">确认删除</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}
      </style>
    </div>
  );
}
