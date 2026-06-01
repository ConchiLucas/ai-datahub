import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, X, Edit2,
  BookOpen, ChevronLeft, Hash, Sparkles, FileText, CheckCircle2
} from 'lucide-react';
import {
  type Novel, type Chapter, formatWordCount
} from './NovelManagerPage';
import { getNovelById } from '@/api/novel';
import { createChapter, updateChapter, deleteChapter, getChapterById } from '@/api/novelChapter';

// ═══════════════════════════════════════
export default function NovelDetailPage() {
  const navigate = useNavigate();
  const { novelId } = useParams<{ novelId: string }>();

  const [novel, setNovel] = useState<Novel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [readingChapterId, setReadingChapterId] = useState<number | null>(null);
  const [readingChapter, setReadingChapter] = useState<Chapter | null>(null);

  const [analysisChapterId, setAnalysisChapterId] = useState<number | null>(null);
  const [analysisChapter, setAnalysisChapter] = useState<Chapter | null>(null);

  // Chapter Form
  const [isChapterFormOpen, setIsChapterFormOpen] = useState(false);
  const [editChapter, setEditChapter] = useState<Chapter | null>(null);
  const [chFormTitle, setChFormTitle] = useState('');
  const [chFormContent, setChFormContent] = useState('');

  // Delete
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const loadNovelData = useCallback(async () => {
    if (!novelId) return;
    setIsLoading(true);
    try {
      const res: any = await getNovelById({ id: Number(novelId) });
      if (res.code === 0) {
        setNovel(res.data.reTaNovel);
      } else {
        setNovel(null);
      }
    } catch (e) {
      console.error(e);
      setNovel(null);
    } finally {
      setIsLoading(false);
    }
  }, [novelId]);

  useEffect(() => {
    loadNovelData();
  }, [loadNovelData]);

  useEffect(() => {
    if (readingChapterId) {
      getChapterById({ id: readingChapterId }).then((res: any) => {
        if (res.code === 0) setReadingChapter(res.data.reTaNovelChapter || null);
      });
    } else {
      setReadingChapter(null);
    }
  }, [readingChapterId]);

  useEffect(() => {
    if (analysisChapterId) {
      getChapterById({ id: analysisChapterId }).then((res: any) => {
        if (res.code === 0) setAnalysisChapter(res.data.reTaNovelChapter || null);
      });
    } else {
      setAnalysisChapter(null);
    }
  }, [analysisChapterId]);
  const sortedChapters = useMemo(() => {
    if (!novel?.chapters) return [];
    return [...novel.chapters].sort((a, b) => a.order - b.order);
  }, [novel]);

  // ─── Chapter Handlers ────────────────
  const openChapterForm = async (chapter?: Chapter) => {
    if (chapter) {
      try {
        const res: any = await getChapterById({ id: chapter.id });
        if (res.code === 0 && res.data.reTaNovelChapter) {
          const fullChapter = res.data.reTaNovelChapter;
          setEditChapter(fullChapter);
          setChFormTitle(fullChapter.title);
          setChFormContent(fullChapter.content);
        }
      } catch (e) {
        console.error('Failed to load chapter details', e);
      }
    } else {
      setEditChapter(null);
      setChFormTitle('');
      setChFormContent('');
    }
    setIsChapterFormOpen(true);
  };

  const saveChapter = async () => {
    if (!chFormTitle.trim() || !novelId) return;
    try {
      if (editChapter) {
        await updateChapter({
          ...editChapter,
          title: chFormTitle.trim(),
          content: chFormContent,
          wordCount: chFormContent.length,
        });
      } else {
        const maxOrder = sortedChapters.reduce((max, c) => Math.max(max, c.order), 0);
        await createChapter({
          novelId: Number(novelId),
          title: chFormTitle.trim(),
          order: maxOrder + 1,
          wordCount: chFormContent.length,
          content: chFormContent,
        });
      }
      setIsChapterFormOpen(false);
      loadNovelData();
    } catch (e) {
      console.error('Error saving chapter', e);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteChapter({ id: deleteConfirmId });
      if (readingChapterId === deleteConfirmId) setReadingChapterId(null);
      if (analysisChapterId === deleteConfirmId) setAnalysisChapterId(null);
      setDeleteConfirmId(null);
      loadNovelData();
    } catch (e) {
      console.error('Error deleting chapter', e);
    }
  };

  const getTotalWords = () => novel?.chapters?.reduce((sum, c) => sum + c.wordCount, 0) || 0;

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0B0D14] flex flex-col items-center justify-center">
        <div className="relative w-12 h-12 mb-6">
          <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
          <div className="absolute inset-0 border-4 border-sky-500 rounded-full border-t-transparent animate-spin" />
          <BookOpen className="absolute inset-0 m-auto w-4 h-4 text-sky-400 opacity-80" />
        </div>
        <p className="text-sm font-medium text-slate-400 animate-pulse tracking-widest">正在拉取卷帙...</p>
      </div>
    );
  }

  if (!novel && !isLoading) {
    return (
      <div className="h-screen bg-[#0B0D14] text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-14 h-14 mx-auto mb-4 text-slate-700 opacity-60" />
          <p className="text-[15px] font-medium text-slate-400 mb-2">哎呀，这本小说似乎被风吹走了</p>
          <p className="text-xs text-slate-600 mb-6 font-mono border border-white/[0.03] bg-white/[0.01] inline-block px-3 py-1 rounded-full">id: {novelId}</p>
          <br/>
          <button onClick={() => navigate('/novels')} className="px-5 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium hover:bg-sky-500/20 hover:-translate-y-0.5 transition-all shadow-lg shadow-sky-500/5">
            ← 返回书架
          </button>
        </div>
      </div>
    );
  }

  // ── Analysis View ──
  if (analysisChapter) {
    const renderRating = (model: string, score: number, color: string) => (
      <div className="flex flex-col items-center justify-center gap-1.5 flex-1 border-r border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors rounded-lg py-2">
        <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">{model}</span>
        <div className={`text-2xl font-black ${color} tracking-tighter`}>{score ? score.toFixed(1) : '-'}</div>
      </div>
    );

    let diffsData: any[] = [];
    let isDiffsJson = false;
    try {
      if (analysisChapter.diffs) {
        diffsData = JSON.parse(analysisChapter.diffs);
        isDiffsJson = Array.isArray(diffsData);
      }
    } catch(e) {
      isDiffsJson = false;
    }

    return (
      <div className="h-screen bg-[#0B0D14] text-slate-200 flex flex-col font-sans overflow-hidden">
        {/* Header */}
        <header className="h-12 border-b border-white/5 bg-[#0E1019]/90 flex-shrink-0 flex items-center px-5 z-20 backdrop-blur-xl">
          <button onClick={() => setAnalysisChapterId(null)} className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-all">
            <ChevronLeft className="w-3.5 h-3.5" /> 退出分析
          </button>
          <div className="flex-1 text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 text-sm">
            AI 深度解析 · {analysisChapter.title}
          </div>
          <div className="w-[100px]" /> {/* Spacer for centering */}
        </header>

        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          {/* Top Rating Bar */}
          <div className="flex items-center bg-[#0E1019] border border-white/5 rounded-2xl p-2 shrink-0 shadow-lg shadow-black/20">
            {renderRating('qwen3.5-plus', analysisChapter.qwenScore, 'text-blue-400')}
            {renderRating('glm-5', analysisChapter.glmScore, 'text-emerald-400')}
            {renderRating('kimi-k2.5', analysisChapter.kimiScore, 'text-amber-400')}
            {renderRating('MiniMax-M2.5', analysisChapter.minimaxScore, 'text-purple-400')}
          </div>

          {/* Split Content Area */}
          <div className="flex-1 flex gap-4 overflow-hidden">
            {/* Left Box: Original Content */}
            <div className="w-1/2 flex flex-col bg-[#0E1019] border border-white/5 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
              <div className="h-10 border-b border-white/5 flex items-center px-4 bg-white/[0.01]">
                <FileText className="w-3.5 h-3.5 text-slate-500 mr-2" />
                <span className="text-xs font-semibold text-slate-300">章节正文</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="text-[14px] text-slate-300/90 leading-[2] whitespace-pre-wrap font-[system-ui]">
                  {analysisChapter.content || '暂无内容...'}
                </div>
              </div>
            </div>

            {/* Right Box: Setup vertically */}
            <div className="w-1/2 flex flex-col gap-4 overflow-hidden">
              {/* Top Right: Summary */}
              <div className="flex-1 flex flex-col bg-[#0E1019] border border-white/5 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
                <div className="h-10 border-b border-white/5 flex items-center px-4 bg-white/[0.01]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-2" />
                  <span className="text-xs font-semibold text-amber-500/90">小说概要 (AI 生成)</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                  <p className="text-[13px] text-slate-300/80 leading-relaxed">
                    {analysisChapter.summary || '暂无概要内容'}
                  </p>
                </div>
              </div>

              {/* Bottom Right: Diffs / Changes */}
              <div className="flex-1 flex flex-col bg-[#0E1019] border border-white/5 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
                <div className="h-10 border-b border-white/5 flex items-center px-4 bg-white/[0.01]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-2" />
                  <span className="text-xs font-semibold text-emerald-500/90">AI 魔改重构</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                  {isDiffsJson && diffsData.length > 0 ? (
                    <ul className="space-y-4">
                      {diffsData.map((d: any, i: number) => (
                        <li key={i} className="flex gap-3">
                          <span className={`w-1.5 h-1.5 rounded-full bg-${d.color || 'blue'}-500 shrink-0 mt-1.5`}></span>
                          <p className="text-[13px] text-slate-300/80 leading-relaxed">
                            <span className={`text-${d.color || 'blue'}-400 font-medium`}>{d.type}：</span>
                            {d.content}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : analysisChapter.diffs ? (
                    <div className="text-[13px] text-slate-300/80 leading-relaxed whitespace-pre-wrap font-[system-ui]">
                      {analysisChapter.diffs}
                    </div>
                  ) : (
                    <div className="text-[13px] text-slate-300/50 italic">暂无魔改数据</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Reading View ──
  if (readingChapter) {
    const idx = sortedChapters.findIndex(c => c.id === readingChapterId);

    return (
      <div className="h-screen bg-[#0B0D14] text-slate-200 flex flex-col font-sans overflow-hidden">
        {/* Reading Header */}
        <header className="h-12 border-b border-white/5 bg-[#0E1019]/90 flex-shrink-0 flex items-center px-5 z-20 backdrop-blur-xl">
          <button onClick={() => setReadingChapterId(null)} className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-all">
            <ChevronLeft className="w-3.5 h-3.5" /> 返回目录
          </button>
          <div className="flex-1 text-center">
            <div className="text-sm font-medium text-slate-300">{readingChapter.title}</div>
          </div>
          <div className="flex items-center gap-2">
            <button disabled={idx <= 0} onClick={() => idx > 0 && setReadingChapterId(sortedChapters[idx - 1].id)}
              className="px-2.5 py-1 rounded-lg text-[10px] text-slate-400 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              上一章
            </button>
            <button disabled={idx >= sortedChapters.length - 1} onClick={() => idx < sortedChapters.length - 1 && setReadingChapterId(sortedChapters[idx + 1].id)}
              className="px-2.5 py-1 rounded-lg text-[10px] text-slate-400 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              下一章
            </button>
          </div>
        </header>

        {/* Reading Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="w-full px-[10%] py-10">
            <h2 className="text-xl font-bold text-slate-100 mb-2">{readingChapter.title}</h2>
            <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-8 pb-4 border-b border-white/[0.05]">
              <span>{formatWordCount(readingChapter.wordCount)} 字</span>
              <span>更新于 {new Date(readingChapter.UpdatedAt).toLocaleString()}</span>
            </div>
            <div className="text-[15px] text-slate-300/90 leading-[2] whitespace-pre-wrap font-[system-ui] tracking-wide">
              {readingChapter.content}
            </div>
            <div className="flex items-center justify-between mt-12 pt-6 border-t border-white/[0.05]">
              <button disabled={idx <= 0} onClick={() => idx > 0 && setReadingChapterId(sortedChapters[idx - 1].id)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 bg-white/5 hover:bg-white/10 disabled:opacity-20 transition-all">← 上一章</button>
              <button onClick={() => setReadingChapterId(null)} className="px-4 py-2 rounded-xl text-sm text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition-all">返回目录</button>
              <button disabled={idx >= sortedChapters.length - 1} onClick={() => idx < sortedChapters.length - 1 && setReadingChapterId(sortedChapters[idx + 1].id)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 bg-white/5 hover:bg-white/10 disabled:opacity-20 transition-all">下一章 →</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Chapter Directory View ──
  return (
    <div className="h-screen bg-[#0B0D14] text-slate-200 flex flex-col font-sans overflow-hidden relative">
      <div className="absolute top-0 left-1/4 w-[40%] h-[300px] bg-sky-500/3 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="h-14 border-b border-white/5 bg-[#0E1019]/90 flex-shrink-0 flex items-center px-5 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/novels')} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className={`w-8 h-11 rounded-md bg-gradient-to-br ${novel.cover} flex items-end justify-center pb-0.5 shadow-md`}>
            <BookOpen className="w-3 h-3 text-white/70" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-200">{novel.title}</h1>
            <div className="text-[10px] text-slate-500">{novel.author} · {novel.chapters?.length || 0} 章 · {formatWordCount(getTotalWords())} 字</div>
          </div>
        </div>

        <div className="flex-1" />

        <button onClick={() => openChapterForm()} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/20 transition-all">
          <Plus className="w-3 h-3" /> 新章
        </button>
      </header>

      {/* Novel Description Bar */}
      {novel.description && (
        <div className="px-6 py-3 border-b border-white/[0.03] bg-[#0C0E15]/30 flex-shrink-0">
          <p className="text-[11px] text-slate-500 line-clamp-2">{novel.description}</p>
        </div>
      )}

      {/* Chapter List (flat) */}
      <main className="flex-1 overflow-y-auto custom-scrollbar z-10">
        {sortedChapters.map((ch, i) => (
          <div key={ch.id}>
            <div
              onClick={() => setReadingChapterId(ch.id)}
              className="group flex items-center gap-3 px-6 py-3 border-b border-white/[0.02] cursor-pointer transition-all hover:bg-sky-500/[0.03]">
              <Hash className="w-3 h-3 text-slate-600 flex-shrink-0" />
              <span className="flex-1 text-[12px] text-slate-300 truncate">{ch.title}</span>
              
              <div className="flex items-center gap-4 mr-2 opacity-80">
                <div className="flex items-center gap-1.5"><span className="text-[9px] text-slate-500 font-medium tracking-wider">QWEN</span><span className="text-[11px] text-blue-400 font-black">{ch.qwenScore}</span></div>
                <div className="flex items-center gap-1.5"><span className="text-[9px] text-slate-500 font-medium tracking-wider">GLM</span><span className="text-[11px] text-emerald-400 font-black">{ch.glmScore}</span></div>
                <div className="flex items-center gap-1.5"><span className="text-[9px] text-slate-500 font-medium tracking-wider">KIMI</span><span className="text-[11px] text-amber-400 font-black">{ch.kimiScore}</span></div>
                <div className="flex items-center gap-1.5"><span className="text-[9px] text-slate-500 font-medium tracking-wider">MINIMAX</span><span className="text-[11px] text-purple-400 font-black">{ch.minimaxScore}</span></div>
              </div>

              {/* Added analysis button here */}
              <button onClick={(e) => { e.stopPropagation(); setAnalysisChapterId(ch.id); }} 
                className="flex items-center gap-1 px-2 py-1 rounded bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-all opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100">
                <Sparkles className="w-3 h-3" />
                <span className="text-[10px] font-medium tracking-wide">AI 解析</span>
              </button>

              <span className="text-[9px] text-slate-600 flex-shrink-0 mr-2 ml-4">{formatWordCount(ch.wordCount)} 字</span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); openChapterForm(ch); }} className="p-1 rounded hover:bg-white/5 text-slate-600 hover:text-blue-400 transition-all">
                  <Edit2 className="w-3 h-3" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(ch.id); }} className="p-1 rounded hover:bg-white/5 text-slate-600 hover:text-red-400 transition-all">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {!novel.chapters || novel.chapters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <Hash className="w-12 h-12 mb-3 opacity-10" />
            <p className="text-sm text-slate-500">暂无章节</p>
            <p className="text-xs opacity-40 mt-1">点击右上角「新章」添加章节</p>
          </div>
        )}
      </main>

      {/* ─── Chapter Form Modal ─── */}
      <AnimatePresence>
        {isChapterFormOpen && novel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsChapterFormOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl bg-[#0F111A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <h3 className="text-base font-bold text-slate-100">{editChapter ? '编辑章节' : '新建章节'}</h3>
                  <button onClick={() => setIsChapterFormOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">章节标题 *</label>
                    <input value={chFormTitle} autoFocus onChange={e => setChFormTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500/50 transition-all"
                      placeholder="如：第001章 暗夜来临" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">章节内容</label>
                    <textarea value={chFormContent} onChange={e => setChFormContent(e.target.value)} rows={12}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500/50 transition-all resize-none leading-relaxed font-[system-ui]"
                      placeholder="章节正文..." />
                    <div className="text-right text-[10px] text-slate-500 mt-1">{chFormContent.length} 字</div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
                  <button onClick={() => setIsChapterFormOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5">取消</button>
                  <button onClick={saveChapter} disabled={!chFormTitle.trim()}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-blue-500 text-white disabled:opacity-40 shadow-lg shadow-sky-500/20 transition-all hover:opacity-90">
                    {editChapter ? '保存' : '创建'}
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
                <p className="text-sm text-slate-400 mb-6">确定要删除这个章节吗？</p>
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
