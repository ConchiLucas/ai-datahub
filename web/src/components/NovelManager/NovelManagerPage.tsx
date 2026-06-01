import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, Search, X, Edit2,
  BookOpen
} from 'lucide-react';
import { createNovel, deleteNovel, updateNovel, getNovelList } from '@/api/novel';

// ─── Types (shared) ──────────────────
export interface Chapter {
  id: number;
  novelId: number;
  title: string;
  order: number;
  wordCount: number;
  content: string;
  qwenScore: number;
  glmScore: number;
  kimiScore: number;
  minimaxScore: number;
  summary: string;
  diffs: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface Novel {
  id: number;
  title: string;
  author: string;
  cover: string;
  description: string;
  chapters: Chapter[];
  CreatedAt: string;
  UpdatedAt: string;
}

export const COVER_COLORS = [
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-sky-600',
  'from-fuchsia-500 to-pink-600',
  'from-lime-500 to-green-600',
];

export function formatWordCount(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return `${n}`;
}

// ═══════════════════════════════════════
export default function NovelManagerPage() {
  const navigate = useNavigate();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Novel Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editNovel, setEditNovel] = useState<Novel | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formDesc, setFormDesc] = useState('');

  // Delete
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchNovels = async () => {
    try {
      const res: any = await getNovelList({ page: 1, pageSize: 999 });
      if (res.code === 0) {
        setNovels(res.data.list || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNovels();
  }, []);

  const filteredNovels = useMemo(() => {
    if (!searchQuery.trim()) return novels;
    const q = searchQuery.toLowerCase();
    return novels.filter(n => n.title.toLowerCase().includes(q) || n.author.toLowerCase().includes(q));
  }, [novels, searchQuery]);

  // ─── Handlers ────────────────────────
  const openForm = (novel?: Novel) => {
    if (novel) {
      setEditNovel(novel);
      setFormTitle(novel.title); setFormAuthor(novel.author); setFormDesc(novel.description);
    } else {
      setEditNovel(null);
      setFormTitle(''); setFormAuthor(''); setFormDesc('');
    }
    setIsFormOpen(true);
  };

  const saveNovel = async () => {
    if (!formTitle.trim()) return;
    if (editNovel) {
      await updateNovel({
        ...editNovel, title: formTitle.trim(), author: formAuthor.trim(), description: formDesc.trim()
      });
    } else {
      await createNovel({
        title: formTitle.trim(), author: formAuthor.trim(),
        cover: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
        description: formDesc.trim(),
      });
    }
    setIsFormOpen(false);
    fetchNovels();
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteNovel({ id: deleteConfirmId });
    setDeleteConfirmId(null);
    fetchNovels();
  };

  const getTotalWords = (novel: Novel) => novel.chapters?.reduce((sum, c) => sum + c.wordCount, 0) || 0;
  const getLatestChapter = (novel: Novel) => {
    if (!novel.chapters || novel.chapters.length === 0) return null;
    return novel.chapters.sort((a, b) => b.order - a.order)[0];
  };

  return (
    <div className="h-screen bg-[#0B0D14] text-slate-200 flex flex-col font-sans overflow-hidden relative">
      <div className="absolute top-0 left-1/4 w-[40%] h-[300px] bg-sky-500/3 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="h-14 border-b border-white/5 bg-[#0E1019]/90 flex-shrink-0 flex items-center px-5 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <BookOpen className="w-4 h-4" />
          </div>
          <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500">小说管理</h1>
        </div>

        {/* Search - Centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索小说..."
              className="w-full pl-8 pr-3 py-2 bg-[#12141D] border border-white/5 rounded-lg text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500/40 transition-all" />
          </div>
        </div>

        <button onClick={() => openForm()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-medium hover:bg-sky-500/20 transition-all">
          <Plus className="w-3.5 h-3.5" /> 新建小说
        </button>
      </header>

      {/* Card Grid */}
      <main className="flex-1 overflow-y-auto custom-scrollbar z-10 p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredNovels.map((novel, index) => {
              const totalWords = getTotalWords(novel);
              const latestChapter = getLatestChapter(novel);
              return (
                <motion.div key={novel.id}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.04, duration: 0.25 }}
                  className="group relative cursor-pointer"
                  onClick={() => navigate(`/novels/${novel.id}`)}>
                  {/* Cover */}
                  <div className={`relative w-full aspect-[3/4] rounded-xl bg-gradient-to-br ${novel.cover} shadow-lg group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 overflow-hidden`}>
                    {/* Overlay pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(0deg,transparent,transparent_8px,rgba(255,255,255,0.03)_8px,rgba(255,255,255,0.03)_9px)]" />
                    {/* Spine */}
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/20" />
                    {/* Title on cover */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                      <BookOpen className="w-6 h-6 text-white/30 mb-3" />
                      <h3 className="text-sm font-bold text-white/90 leading-tight line-clamp-3">{novel.title}</h3>
                      <span className="text-[10px] text-white/50 mt-2">{novel.author}</span>
                    </div>
                    {/* Chapter count badge */}
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm text-[9px] text-white/70">
                      {novel.chapters?.length || 0} 章
                    </div>
                    {/* Hover actions */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openForm(novel); }}
                        className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/60 transition-all">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(novel.id); }}
                        className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white/70 hover:text-red-400 hover:bg-black/60 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Info below cover */}
                  <div className="mt-2.5 px-1">
                    <h3 className="text-[12px] font-semibold text-slate-200 truncate">{novel.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500">{novel.author}</span>
                      {totalWords > 0 && (
                        <span className="text-[9px] text-slate-600">· {formatWordCount(totalWords)} 字</span>
                      )}
                    </div>
                    {latestChapter && (
                      <p className="text-[9px] text-slate-600 truncate mt-1">最新: {latestChapter.title}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Add New Card */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: filteredNovels.length * 0.04 }}
            onClick={() => openForm()}
            className="cursor-pointer group">
            <div className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-white/10 hover:border-sky-500/30 flex flex-col items-center justify-center gap-2 transition-all hover:bg-sky-500/[0.03]">
              <div className="p-3 rounded-full bg-white/5 group-hover:bg-sky-500/10 transition-all">
                <Plus className="w-5 h-5 text-slate-600 group-hover:text-sky-400 transition-colors" />
              </div>
              <span className="text-[11px] text-slate-600 group-hover:text-sky-400 transition-colors">新建小说</span>
            </div>
          </motion.div>
        </div>

        {filteredNovels.length === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <BookOpen className="w-16 h-16 mb-4 opacity-10" />
            <p className="text-sm text-slate-500">书架空空如也</p>
            <p className="text-xs opacity-40 mt-1">点击上方「新建小说」开始创作</p>
          </div>
        )}
      </main>

      {/* ─── Novel Form Modal ─── */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-[#0F111A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <h3 className="text-base font-bold text-slate-100">{editNovel ? '编辑小说' : '新建小说'}</h3>
                  <button onClick={() => setIsFormOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">小说名称 *</label>
                    <input value={formTitle} autoFocus onChange={e => setFormTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500/50 transition-all"
                      placeholder="如：星际迷航" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">作者</label>
                    <input value={formAuthor} onChange={e => setFormAuthor(e.target.value)}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500/50 transition-all"
                      placeholder="作者名" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">简介</label>
                    <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={3}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500/50 transition-all resize-none"
                      placeholder="小说简介..." />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
                  <button onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5">取消</button>
                  <button onClick={saveNovel} disabled={!formTitle.trim()}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-blue-500 text-white disabled:opacity-40 shadow-lg shadow-sky-500/20 transition-all hover:opacity-90">
                    {editNovel ? '保存' : '创建'}
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
                <p className="text-sm text-slate-400 mb-6">删除后所有章节都将丢失，确定要删除这本小说吗？</p>
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
