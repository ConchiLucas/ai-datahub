import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, GraduationCap, Plus, Trash2, Search, X, Clock, ChevronDown, Edit2,
  ExternalLink, CheckCircle2, Circle, Loader2, Video, Link2, BookOpen, FileText, Tag,
  Send, MessageSquare, List, ChevronRight, CheckSquare, Square, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { 
  getLearningItemList, createLearningItem, updateLearningItem, deleteLearningItem, 
  createLearningChapter, updateLearningChapter, toggleChapterCompleted, deleteLearningChapter, 
  createLearningNote, updateLearningNote, deleteLearningNote 
} from '@/api/learning';

// ─── Types ───────────────────────────
type LearnStatus = 'todo' | 'in_progress' | 'done';
type LearnCategory = 'video' | 'article' | 'course' | 'book' | 'other';

interface LearnChapter {
  id: string;
  title: string;
  order: number;
  completed: boolean;
}

interface LearnNote {
  id: string;
  content: string;
  createdAt: string;
  chapterId?: string;
}

interface LearnItem {
  id: string;
  title: string;
  description: string;
  url: string;
  category: LearnCategory;
  tag: string;
  status: LearnStatus;
  notes: LearnNote[];
  chapters: LearnChapter[];
  createdAt: string;
}

const STORAGE_KEY = 'learning_manager_data_v2';

// ─── Config ──────────────────────────
const STATUS_CFG: Record<LearnStatus, { label: string; icon: any; cls: string; bg: string }> = {
  todo:        { label: '待学习', icon: Circle,        cls: 'text-slate-400',   bg: 'bg-slate-400/10 border-slate-400/20' },
  in_progress: { label: '学习中', icon: Loader2,       cls: 'text-violet-400',  bg: 'bg-violet-400/10 border-violet-400/20' },
  done:        { label: '已完成', icon: CheckCircle2,   cls: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
};

const CATEGORY_CFG: Record<LearnCategory, { label: string; icon: any; cls: string }> = {
  video:   { label: '视频', icon: Video,    cls: 'text-red-400 bg-red-400/10' },
  article: { label: '文章', icon: FileText, cls: 'text-blue-400 bg-blue-400/10' },
  course:  { label: '课程', icon: BookOpen, cls: 'text-amber-400 bg-amber-400/10' },
  book:    { label: '书籍', icon: BookOpen, cls: 'text-emerald-400 bg-emerald-400/10' },
  other:   { label: '其他', icon: Tag,      cls: 'text-slate-400 bg-slate-400/10' },
};

const ALL_CATEGORIES: LearnCategory[] = ['video', 'article', 'course', 'book', 'other'];
const ALL_STATUSES: LearnStatus[] = ['todo', 'in_progress', 'done'];

// ─── Helpers ─────────────────────────
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function nowStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function getDomain(url: string) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
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

// ─── NoteCard Component ──────────────
function NoteCard({ note, index, selected, setDeleteNoteId, getRelativeTime: relTime, onUpdateNote }: {
  note: LearnNote; index: number; selected: LearnItem;
  setDeleteNoteId: (v: { itemId: string; noteId: string } | null) => void;
  getRelativeTime: (s: string) => string;
  onUpdateNote: (noteId: string, content: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);

  const handleSave = () => {
    if (!editContent.trim()) {
      setIsEditing(false);
      setEditContent(note.content);
      return;
    }
    if (editContent !== note.content) {
      onUpdateNote(note.id, editContent);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(note.content);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }} className="group flex gap-3">
      <div className="flex flex-col items-center flex-shrink-0 pt-1">
        <div className="w-2 h-2 rounded-full bg-violet-500/40 border border-violet-500/30 flex-shrink-0" />
      </div>
      <div className="flex-1 pb-2">
        {isEditing ? (
          <div className="bg-[#0E1018] border border-violet-500/30 rounded-xl px-4 py-3 flex gap-2 items-end">
            <textarea
              className="flex-1 bg-transparent text-xs text-slate-200 resize-none outline-none leading-relaxed min-h-[40px]"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              onFocus={(e) => {
                 const len = e.target.value.length;
                 e.target.setSelectionRange(len, len);
              }}
              onBlur={(e) => {
                 // only save on blur if we aren't clicking the send button itself
                 if (!e.relatedTarget?.closest('.note-save-btn')) {
                    handleSave();
                 }
              }}
            />
            <button 
              onMouseDown={(e) => { e.preventDefault(); handleSave(); }} 
              className="note-save-btn p-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 transition-colors flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div 
            onClick={() => { setIsEditing(true); setEditContent(note.content); }}
            className="cursor-text bg-[#0E1018] border border-white/5 rounded-xl px-4 py-3 hover:border-violet-500/20 transition-all"
          >
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{note.content}</p>
          </div>
        )}
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[10px] text-slate-600 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />{relTime(note.createdAt)}
          </span>
          {!isEditing && (
            <button onClick={() => setDeleteNoteId({ itemId: selected.id, noteId: note.id })}
              className="p-0.5 rounded opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════
export default function LearningManagerPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<LearnItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<LearnStatus | 'all'>('all');

  // Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<LearnItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategory, setFormCategory] = useState<LearnCategory>('video');
  const [formTag, setFormTag] = useState('');

  // Inline URL edit
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [editingUrl, setEditingUrl] = useState('');

  // Note input
  const [noteInput, setNoteInput] = useState('');

  // Chapter
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [chapterPanelOpen, setChapterPanelOpen] = useState(true);
  const [chapterInput, setChapterInput] = useState('');
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);
  
  // Chapter Inline Editing
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState('');

  // Delete
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<{ itemId: string; noteId: string } | null>(null);

  const loadDataFromApi = async () => {
    try {
      const res = await getLearningItemList({ page: 1, pageSize: 999 }) as any;
      if (res.code === 0 && res.data.list) {
        const mapped = res.data.list.map((item: any) => ({
          id: item.id.toString(),
          title: item.title,
          description: item.description,
          url: item.url,
          category: item.category,
          tag: item.tag,
          status: item.status,
          createdAt: item.CreatedAt,
          chapters: (item.chapters || []).map((c: any) => ({
             id: c.id.toString(),
             title: c.title,
             order: c.order,
             completed: c.completed
          })),
          notes: (item.notes || []).map((n: any) => ({
             id: n.id.toString(),
             content: n.content,
             createdAt: n.CreatedAt,
             chapterId: n.chapterId ? n.chapterId.toString() : undefined
          }))
        }));
        setItems(mapped);
        if (mapped.length > 0 && !selectedId) setSelectedId(mapped[0].id);
      }
    } catch {}
  };

  useEffect(() => {
    loadDataFromApi();
  }, []);

  const allTags = useMemo(() => Array.from(new Set(items.map(i => i.tag).filter(Boolean))), [items]);

  const filtered = useMemo(() => {
    let result = items;
    if (filterStatus !== 'all') result = result.filter(i => i.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) ||
        i.tag.toLowerCase().includes(q) || i.notes.some(n => n.content.toLowerCase().includes(q))
      );
    }
    return result;
  }, [items, searchQuery, filterStatus]);

  const selected = useMemo(() => items.find(i => i.id === selectedId) || null, [items, selectedId]);

  // ─── Handlers ────────────────────────
  const openForm = (item?: LearnItem) => {
    if (item) {
      setEditItem(item); setFormTitle(item.title); setFormDesc(item.description);
      setFormUrl(item.url); setFormCategory(item.category); setFormTag(item.tag);
    } else {
      setEditItem(null); setFormTitle(''); setFormDesc('');
      setFormUrl(''); setFormCategory('video'); setFormTag('');
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) return;
    if (editItem) {
      await updateLearningItem({
        id: Number(editItem.id),
        title: formTitle.trim(),
        description: formDesc.trim(),
        url: formUrl.trim(),
        category: formCategory,
        tag: formTag.trim(),
        status: editItem.status,
      });
    } else {
      await createLearningItem({
        title: formTitle.trim(),
        description: formDesc.trim(),
        url: formUrl.trim(),
        category: formCategory,
        tag: formTag.trim(),
        status: 'todo',
      });
    }
    setIsFormOpen(false);
    loadDataFromApi();
  };

  const toggleStatus = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const item = items.find(i => i.id === id);
    if (!item) return;
    const next: LearnStatus = item.status === 'todo' ? 'in_progress' : item.status === 'in_progress' ? 'done' : 'todo';
    
    // Optimistic UI First
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: next } : i));
    
    await updateLearningItem({
      id: Number(item.id),
      title: item.title,
      description: item.description,
      url: item.url,
      category: item.category,
      tag: item.tag,
      status: next,
    });
  };

  const addNote = async () => {
    if (!noteInput.trim() || !selectedId) return;
    await createLearningNote({
      itemId: Number(selectedId),
      content: noteInput.trim(),
      chapterId: selectedChapterId ? Number(selectedChapterId) : 0,
    });
    setNoteInput('');
    loadDataFromApi();
  };

  const editNote = async (noteId: string, content: string) => {
    const noteToUpdate = items.flatMap(i => i.notes).find(n => n.id === noteId);
    if (!noteToUpdate) return;
    
    // 乐观更新
    setItems(prev => prev.map(item => ({
      ...item,
      notes: item.notes.map(n => n.id === noteId ? { ...n, content } : n)
    })));

    await updateLearningNote({
      id: Number(noteId),
      content,
      chapterId: noteToUpdate.chapterId ? Number(noteToUpdate.chapterId) : 0,
    });
    loadDataFromApi();
  };

  // ─── Chapter Handlers ───────────────
  const addChapter = async () => {
    if (!chapterInput.trim() || !selectedId) return;
    await createLearningChapter({
      itemId: Number(selectedId),
      title: chapterInput.trim(),
      order: selected?.chapters.length || 0,
      completed: false,
    });
    setChapterInput('');
    setIsAddingChapter(false);
    loadDataFromApi();
  };

  const submitEditChapter = async (ch: LearnChapter) => {
    if (editingChapterTitle.trim() && editingChapterTitle !== ch.title && selectedId) {
      setItems(prev => prev.map(i => i.id === selectedId
        ? { ...i, chapters: i.chapters.map(c => c.id === ch.id ? { ...c, title: editingChapterTitle.trim() } : c) } : i));
        
      await updateLearningChapter({
        id: Number(ch.id),
        title: editingChapterTitle.trim(),
        sortOrder: ch.order,
        completed: ch.completed,
      });
      loadDataFromApi();
    }
    setEditingChapterId(null);
  };

  const toggleChapterComplete = async (chapterId: string) => {
    if (!selectedId) return;
    const item = items.find(i => i.id === selectedId);
    const chapter = item?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    
    // Optimistic UI UI
    setItems(prev => prev.map(i => i.id === selectedId
      ? { ...i, chapters: i.chapters.map(c => c.id === chapterId ? { ...c, completed: !c.completed } : c) } : i));
      
    await toggleChapterCompleted({
      id: Number(chapterId),
      completed: !chapter.completed
    });
  };

  const confirmDeleteChapter = async () => {
    if (!deleteChapterId || !selectedId) return;
    await deleteLearningChapter({ id: Number(deleteChapterId) });
    if (selectedChapterId === deleteChapterId) setSelectedChapterId(null);
    setDeleteChapterId(null);
    loadDataFromApi();
  };

  // Filtered notes based on selected chapter
  const filteredNotes = useMemo(() => {
    if (!selected) return [];
    if (!selectedChapterId) return selected.notes;
    return selected.notes.filter(n => n.chapterId === selectedChapterId);
  }, [selected, selectedChapterId]);

  // Reset chapter selection when switching items
  useEffect(() => { setSelectedChapterId(null); }, [selectedId]);

  const confirmDeleteNote = async () => {
    if (!deleteNoteId) return;
    await deleteLearningNote({ id: Number(deleteNoteId.noteId) });
    setDeleteNoteId(null);
    loadDataFromApi();
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteLearningItem({ id: Number(deleteConfirmId) });
    if (selectedId === deleteConfirmId) setSelectedId(null);
    setDeleteConfirmId(null);
    loadDataFromApi();
  };

  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans overflow-hidden relative">
      <div className="absolute top-0 left-1/4 w-[50%] h-[350px] bg-violet-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="h-14 border-b border-white/5 bg-[#0A0C12]/90 flex-shrink-0 flex items-center justify-between px-5 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-400">学习管理</h1>
            <p className="text-[10px] text-slate-500">{items.length} 条学习记录</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-center max-w-lg mx-4">
          <div className="relative flex-shrink-0">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
              className="appearance-none pl-3 pr-7 py-2 bg-[#12141D] border border-white/5 rounded-lg text-xs text-slate-200 outline-none focus:border-violet-500/40 transition-all cursor-pointer min-w-[90px]">
              <option value="all">全部状态</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索学习内容..."
              className="w-full pl-8 pr-3 py-2 bg-[#12141D] border border-white/5 rounded-lg text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/40 transition-all" />
          </div>
        </div>

        <div className="flex-shrink-0" />
      </header>

      {/* Main: Sidebar + Detail */}
      <div className="flex-1 flex overflow-hidden z-10">

        {/* ─── Left Sidebar: Item List ─── */}
        <aside className="w-80 border-r border-white/5 bg-[#0A0C12]/50 flex flex-col flex-shrink-0">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">{filtered.length} 条记录</span>
            <button onClick={() => openForm()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium text-[11px] hover:opacity-90 shadow-lg shadow-violet-500/20 transition-all">
              <Plus className="w-3 h-3" />新建
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filtered.map(item => {
              const sc = STATUS_CFG[item.status];
              const StatusIcon = sc.icon;
              const cc = CATEGORY_CFG[item.category];
              const isActive = selectedId === item.id;
              return (
                <div key={item.id}
                  onClick={() => { setSelectedId(item.id); setNoteInput(''); }}
                  className={`px-4 py-3 border-b border-white/[0.03] cursor-pointer transition-all group ${isActive ? 'bg-violet-500/5 border-l-2 border-l-violet-500' : 'hover:bg-white/[0.02] border-l-2 border-l-transparent'}`}>
                  <div className="flex items-start gap-2.5">
                    <button onClick={e => toggleStatus(item.id, e)} title="切换状态"
                      className={`mt-0.5 p-0.5 rounded transition-all hover:scale-110 flex-shrink-0 ${sc.cls}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${item.status === 'in_progress' ? 'animate-spin' : ''}`} style={item.status === 'in_progress' ? { animationDuration: '3s' } : {}} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-medium truncate ${item.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-600 truncate mt-0.5">{item.description}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`text-[9px] px-1 py-0.5 rounded ${cc.cls}`}>{cc.label}</span>
                        {item.tag && <span className="text-[9px] px-1 py-0.5 rounded bg-violet-500/10 text-violet-400/70">{item.tag}</span>}
                        {item.notes.length > 0 && (
                          <span className="text-[9px] text-slate-600 flex items-center gap-0.5">
                            <MessageSquare className="w-2.5 h-2.5" />{item.notes.length}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Quick actions on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); openForm(item); }}
                        className="p-1 rounded hover:bg-white/5 text-slate-600 hover:text-violet-400 transition-all">
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setDeleteConfirmId(item.id); }}
                        className="p-1 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-all">
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                <GraduationCap className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-xs">暂无内容</p>
              </div>
            )}
          </div>
        </aside>

        {/* ─── Right: Detail + Chapters + Notes ─── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Detail Header */}
              <div className="px-5 py-2.5 border-b border-white/5 bg-[#0A0C12]/30 flex-shrink-0 flex items-center gap-2">
                <div className="inline-flex items-center gap-1 bg-violet-500/5 border border-violet-500/10 rounded-lg flex-shrink-0 overflow-hidden">
                  {selected.url && (
                    <a href={selected.url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 hover:bg-violet-500/15 text-violet-400 transition-all" title="打开链接">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {isEditingUrl ? (
                    <input value={editingUrl} onChange={e => setEditingUrl(e.target.value)} autoFocus
                      onBlur={() => {
                        setItems(prev => prev.map(i => i.id === selected.id ? { ...i, url: editingUrl.trim() } : i));
                        setIsEditingUrl(false);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); }
                        if (e.key === 'Escape') { setIsEditingUrl(false); }
                      }}
                      className="w-[220px] px-2 py-1 bg-transparent text-[11px] text-violet-300 placeholder-slate-600 outline-none"
                      placeholder="输入学习链接..." />
                  ) : (
                    <button onClick={() => { setEditingUrl(selected.url); setIsEditingUrl(true); }}
                      className="px-2 py-1 text-[11px] text-violet-400/80 hover:text-violet-300 transition-all truncate max-w-[220px]" title="点击编辑链接">
                      {selected.url ? (getDomain(selected.url) || selected.url) : '添加链接...'}
                    </button>
                  )}
                </div>
                <h2 className="text-sm font-semibold text-slate-100 truncate max-w-[260px] flex-shrink-0">{selected.title}</h2>
                <button onClick={() => toggleStatus(selected.id)}
                  className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg border transition-all flex-shrink-0 ${STATUS_CFG[selected.status].bg} ${STATUS_CFG[selected.status].cls}`}>
                  {(() => { const I = STATUS_CFG[selected.status].icon; return <I className="w-3 h-3" />; })()}
                  {STATUS_CFG[selected.status].label}
                </button>
                <span className={`text-[11px] px-2 py-1 rounded-lg flex items-center gap-1 flex-shrink-0 ${CATEGORY_CFG[selected.category].cls}`}>
                  {(() => { const I = CATEGORY_CFG[selected.category].icon; return <I className="w-3 h-3" />; })()}
                  {CATEGORY_CFG[selected.category].label}
                </span>
                {selected.tag && <span className="text-[11px] px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400/80 flex-shrink-0">{selected.tag}</span>}
                {selected.chapters.length > 0 && (
                  <span className="text-[10px] text-slate-500">
                    {selected.chapters.filter(c => c.completed).length}/{selected.chapters.length} 章节
                  </span>
                )}
                <div className="flex-1" />
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setChapterPanelOpen(p => !p)}
                    className={`p-1.5 rounded-lg hover:bg-white/5 transition-all ${chapterPanelOpen ? 'text-violet-400' : 'text-slate-500 hover:text-violet-400'}`} title="章节面板">
                    {chapterPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openForm(selected)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-violet-400 transition-all" title="编辑">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirmId(selected.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all" title="删除">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content Area: Chapters + Notes */}
              <div className="flex-1 flex overflow-hidden">

                {/* ─── Chapter Outline Panel ─── */}
                {chapterPanelOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                    className="w-[260px] border-r border-white/5 bg-[#0A0C12]/40 flex flex-col flex-shrink-0 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <List className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-[11px] font-semibold text-slate-300">章节大纲</span>
                      </div>
                      <button onClick={() => { setIsAddingChapter(true); setChapterInput(''); }}
                        className="p-1 rounded-md hover:bg-violet-500/10 text-slate-500 hover:text-violet-400 transition-all" title="添加章节">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {/* All Notes option */}
                      <button onClick={() => setSelectedChapterId(null)}
                        className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-all text-[11px] border-b border-white/[0.03] ${!selectedChapterId ? 'bg-violet-500/8 text-violet-300 border-l-2 border-l-violet-500' : 'text-slate-400 hover:bg-white/[0.02] border-l-2 border-l-transparent'}`}>
                        <MessageSquare className="w-3 h-3 flex-shrink-0" />
                        <span className="flex-1">全部笔记</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-500">{selected.notes.length}</span>
                      </button>

                      {/* Chapter items */}
                      {selected.chapters.sort((a, b) => a.order - b.order).map(ch => {
                        const noteCount = selected.notes.filter(n => n.chapterId === ch.id).length;
                        const isActive = selectedChapterId === ch.id;
                        return (
                          <div key={ch.id}
                            onClick={() => setSelectedChapterId(ch.id)}
                            className={`group px-3 py-2 flex items-center gap-2 cursor-pointer transition-all border-b border-white/[0.03] ${isActive ? 'bg-violet-500/8 border-l-2 border-l-violet-500' : 'hover:bg-white/[0.02] border-l-2 border-l-transparent'}`}>
                            <button onClick={e => { e.stopPropagation(); toggleChapterComplete(ch.id); }}
                              className={`flex-shrink-0 transition-all ${ch.completed ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}>
                              {ch.completed ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            </button>
                            
                            {editingChapterId === ch.id ? (
                              <input 
                                value={editingChapterTitle}
                                onChange={e => setEditingChapterTitle(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') { e.preventDefault(); submitEditChapter(ch); }
                                  if (e.key === 'Escape') setEditingChapterId(null);
                                }}
                                onBlur={() => submitEditChapter(ch)}
                                autoFocus
                                className="flex-1 bg-transparent border-b border-violet-500/50 text-[11px] text-violet-300 outline-none"
                              />
                            ) : (
                              <span 
                                onClick={(e) => { e.stopPropagation(); setEditingChapterId(ch.id); setEditingChapterTitle(ch.title); }}
                                className={`flex-1 text-[11px] truncate cursor-text hover:text-violet-300 transition-all ${ch.completed ? 'text-slate-600 line-through' : isActive ? 'text-violet-300' : 'text-slate-300'}`}
                              >
                                {ch.title}
                              </span>
                            )}
                            {noteCount > 0 && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400/60 flex-shrink-0">{noteCount}</span>
                            )}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button onClick={e => { e.stopPropagation(); setEditingChapterId(ch.id); setEditingChapterTitle(ch.title); }}
                                className="p-0.5 rounded text-slate-600 hover:text-violet-400 transition-all">
                                <Edit2 className="w-2.5 h-2.5" />
                              </button>
                              <button onClick={e => { e.stopPropagation(); setDeleteChapterId(ch.id); }}
                                className="p-0.5 rounded text-slate-600 hover:text-red-400 transition-all">
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Inline add chapter input */}
                      {isAddingChapter && (
                        <div className="px-3 py-2 border-b border-white/[0.03]">
                          <input value={chapterInput} onChange={e => setChapterInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') addChapter(); if (e.key === 'Escape') setIsAddingChapter(false); }}
                            autoFocus placeholder="章节标题... (Enter 确认)"
                            className="w-full px-2 py-1.5 bg-[#12141D] border border-violet-500/20 rounded-lg text-[11px] text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/40 transition-all" />
                        </div>
                      )}

                      {/* Empty state */}
                      {selected.chapters.length === 0 && !isAddingChapter && (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                          <List className="w-8 h-8 text-slate-700 mb-2" />
                          <p className="text-[11px] text-slate-600 mb-1">还没有章节</p>
                          <p className="text-[10px] text-slate-700 mb-3">添加章节来组织你的笔记</p>
                          <button onClick={() => { setIsAddingChapter(true); setChapterInput(''); }}
                            className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/15 transition-all">
                            <Plus className="w-3 h-3" />添加第一个章节
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Chapter progress bar */}
                    {selected.chapters.length > 0 && (
                      <div className="px-3 py-2 border-t border-white/5 flex-shrink-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] text-slate-600">学习进度</span>
                          <span className="text-[9px] text-slate-500">{Math.round((selected.chapters.filter(c => c.completed).length / selected.chapters.length) * 100)}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${(selected.chapters.filter(c => c.completed).length / selected.chapters.length) * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ─── Notes Section ─── */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Note Input */}
                  <div className="px-6 py-3 border-b border-white/5 flex-shrink-0">
                    {selectedChapterId && selected.chapters.find(c => c.id === selectedChapterId) && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <ChevronRight className="w-3 h-3 text-violet-400/50" />
                        <span className="text-[10px] text-violet-400/70 font-medium">
                          {selected.chapters.find(c => c.id === selectedChapterId)?.title}
                        </span>
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); } }}
                        rows={2} placeholder={selectedChapterId ? `记录「${selected.chapters.find(c => c.id === selectedChapterId)?.title}」的笔记...` : '记录学习笔记... (Enter 发送)'}
                        className="flex-1 px-4 py-2.5 bg-[#12141D] border border-white/5 rounded-xl text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/30 transition-all resize-none" />
                      <button onClick={addNote} disabled={!noteInput.trim()}
                        className="p-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:opacity-90 disabled:opacity-30 shadow-lg shadow-violet-500/20 transition-all flex-shrink-0">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notes List */}
                  <div className="flex-1 overflow-auto custom-scrollbar px-6 py-4">
                    {filteredNotes.length > 0 ? (
                      !selectedChapterId ? (
                        /* ─ Grouped by chapter when showing all ─ */
                        <div className="space-y-4">
                          {/* Uncategorized notes first */}
                          {(() => {
                            const uncategorized = selected.notes.filter(n => !n.chapterId);
                            if (uncategorized.length === 0) return null;
                            return (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="h-px flex-1 bg-white/5" />
                                  <span className="text-[10px] text-slate-600 flex-shrink-0">通用笔记</span>
                                  <div className="h-px flex-1 bg-white/5" />
                                </div>
                                <div className="space-y-2">
                                  {uncategorized.map((note, i) => (
                                    <NoteCard key={note.id} note={note} index={i} selected={selected}
                                      setDeleteNoteId={setDeleteNoteId} getRelativeTime={getRelativeTime} onUpdateNote={editNote} />
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                          {/* Grouped by chapter */}
                          {selected.chapters.sort((a, b) => a.order - b.order).map(ch => {
                            const chNotes = selected.notes.filter(n => n.chapterId === ch.id);
                            if (chNotes.length === 0) return null;
                            return (
                              <div key={ch.id}>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="h-px flex-1 bg-white/5" />
                                  <span className={`text-[10px] flex-shrink-0 flex items-center gap-1 ${ch.completed ? 'text-emerald-500/50' : 'text-violet-400/50'}`}>
                                    {ch.completed ? <CheckSquare className="w-2.5 h-2.5" /> : <BookOpen className="w-2.5 h-2.5" />}
                                    {ch.title}
                                  </span>
                                  <div className="h-px flex-1 bg-white/5" />
                                </div>
                                <div className="space-y-2">
                                  {chNotes.map((note, i) => (
                                    <NoteCard key={note.id} note={note} index={i} selected={selected}
                                      setDeleteNoteId={setDeleteNoteId} getRelativeTime={getRelativeTime} onUpdateNote={editNote} />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* ─ Single chapter notes ─ */
                        <div className="space-y-3">
                          {filteredNotes.map((note, i) => (
                            <NoteCard key={note.id} note={note} index={i} selected={selected}
                              setDeleteNoteId={setDeleteNoteId} getRelativeTime={getRelativeTime} onUpdateNote={editNote} />
                          ))}
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-600">
                        <MessageSquare className="w-12 h-12 mb-3 opacity-10" />
                        <p className="text-xs mb-1">{selectedChapterId ? '该章节还没有笔记' : '还没有学习笔记'}</p>
                        <p className="text-[10px] opacity-50">在上方输入框记录学习心得</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
              <GraduationCap className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-sm mb-1 text-slate-400">选择一条学习记录</p>
              <p className="text-xs opacity-50">在左侧列表中点击查看详情和笔记</p>
            </div>
          )}
        </main>
      </div>

      {/* ─── Create / Edit Modal ─── */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-lg bg-[#12141D] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <GraduationCap className="w-4 h-4 text-violet-400" />
                    </div>
                    <h3 className="text-base font-bold text-slate-100">{editItem ? '编辑学习内容' : '添加学习内容'}</h3>
                  </div>
                  <button onClick={() => setIsFormOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-4 overflow-auto custom-scrollbar flex-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">标题 *</label>
                    <input value={formTitle} autoFocus onChange={e => setFormTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/50 transition-all"
                      placeholder="学习什么内容？" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">描述</label>
                    <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/50 transition-all resize-none"
                      placeholder="简短描述学习内容..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">链接 (视频/文章/课程)</label>
                    <input value={formUrl} onChange={e => setFormUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/50 transition-all"
                      placeholder="https://..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">类型</label>
                      <div className="space-y-1">
                        {ALL_CATEGORIES.map(c => {
                          const cfg = CATEGORY_CFG[c]; const Icon = cfg.icon;
                          return (
                            <button key={c} type="button" onClick={() => setFormCategory(c)}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all text-left ${formCategory === c ? `${cfg.cls}` : 'text-slate-500 hover:bg-white/[0.03]'}`}>
                              <Icon className="w-3.5 h-3.5" />{cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">标签</label>
                      <input value={formTag} onChange={e => setFormTag(e.target.value)}
                        className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/50 transition-all"
                        placeholder="如：Go / React / AI" />
                      {allTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {allTags.slice(0, 8).map(t => (
                            <button key={t} onClick={() => setFormTag(t)} type="button"
                              className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400/60 hover:text-violet-400 transition-colors">
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 flex-shrink-0">
                  <button onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">取消</button>
                  <button onClick={handleSubmit} disabled={!formTitle.trim()}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:opacity-90 disabled:opacity-40 shadow-lg shadow-violet-500/20 transition-all">
                    {editItem ? '保存' : '添加'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Delete Item Confirm ─── */}
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
                <p className="text-sm text-slate-400 mb-6">删除后将无法恢复，包括所有关联的学习笔记。</p>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">取消</button>
                  <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all">确认删除</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Delete Note Confirm ─── */}
      <AnimatePresence>
        {deleteNoteId !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteNoteId(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-red-500/10"><Trash2 className="w-5 h-5 text-red-400" /></div>
                  <h3 className="text-lg font-bold text-slate-100">删除笔记</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6">确定要删除这条学习笔记吗？</p>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setDeleteNoteId(null)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">取消</button>
                  <button onClick={confirmDeleteNote} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all">确认删除</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Delete Chapter Confirm ─── */}
      <AnimatePresence>
        {deleteChapterId !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteChapterId(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-red-500/10"><Trash2 className="w-5 h-5 text-red-400" /></div>
                  <h3 className="text-lg font-bold text-slate-100">删除章节</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6">删除章节后，该章节下的笔记将变为未分类。</p>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setDeleteChapterId(null)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">取消</button>
                  <button onClick={confirmDeleteChapter} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all">确认删除</button>
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
