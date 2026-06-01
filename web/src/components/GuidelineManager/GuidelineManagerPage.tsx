import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShieldCheck, Plus, Copy, Check, Trash2, Search,
  X, Download, Clock, Hash, Bold, Italic, Strikethrough, List, ListOrdered,
  Quote, Code, Heading1, Heading2, Heading3, Minus, Undo, Redo, Edit2, ChevronDown
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import UnderlineExt from '@tiptap/extension-underline';
import { Markdown } from 'tiptap-markdown';
import * as GuidelineApi from '@/api/guideline';

// ─── Types ───────────────────────────
interface GuidelineDoc {
  id: number;
  title: string;
  content: string;
  tag: string;
  updatedAt: string;
}

// ─── Helpers ─────────────────────────
function nowStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── Toolbar Button ──────────────────
function TBtn({ icon, active, onClick, title }: {
  icon: React.ReactNode; active?: boolean; onClick?: () => void; title?: string;
}) {
  return (
    <button onClick={onClick} title={title}
      className={`p-1.5 rounded-md transition-all ${active ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
      {icon}
    </button>
  );
}



// ═══════════════════════════════════════
export default function GuidelineManagerPage() {
  const navigate = useNavigate();

  const [docs, setDocs] = useState<GuidelineDoc[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [copied, setCopied] = useState(false);

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createTag, setCreateTag] = useState('');

  // Delete
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Inline title edit
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [editingTag, setEditingTag] = useState(false);
  const [tempTag, setTempTag] = useState('');

  // Refs for auto-save
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserEditing = useRef(false);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await GuidelineApi.getGuidelineList({ page: 1, pageSize: 999 }) as any;
      if (res.code === 0) {
        setDocs(res.data.list || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  useEffect(() => {
    if (docs.length > 0 && !selectedId) {
      setSelectedId(docs[0].id);
    }
  }, [docs, selectedId]);

  const selectedDoc = useMemo(() => docs.find(d => d.id === selectedId) || null, [docs, selectedId]);

  // Filtered
  const filteredDocs = useMemo(() => {
    let result = docs;
    if (filterTag) result = result.filter(d => d.tag === filterTag);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => d.title.toLowerCase().includes(q) || d.tag.toLowerCase().includes(q) || d.content.toLowerCase().includes(q));
    }
    return result;
  }, [docs, searchQuery, filterTag]);

  // Tags for sidebar
  const allTags = useMemo(() => {
    const tags = new Set(docs.map(d => d.tag).filter(Boolean));
    return Array.from(tags);
  }, [docs]);

  // ─── TipTap Editor ───────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: { HTMLAttributes: { class: 'gl-code-block' } },
      }),
      UnderlineExt,
      Placeholder.configure({ placeholder: '开始编写 AI 规范文档...' }),
      Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full' } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-amber-400 underline' } }),
      Markdown.configure({ html: true, transformPastedText: true, transformCopiedText: true }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'gl-editor-content prose prose-sm prose-invert max-w-none focus:outline-none min-h-[500px] px-8 py-6',
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (!isUserEditing.current || !selectedDoc) return;
      const markdown = (ed.storage as any).markdown.getMarkdown();
      triggerAutoSave(markdown, selectedDoc);
    },
  });

  // ─── Auto-save ────────────────────────
  const triggerAutoSave = useCallback((content: string, doc: GuidelineDoc) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    
    // Optistic UI update
    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, content, updatedAt: nowStr() } : d));

    autoSaveTimer.current = setTimeout(async () => {
      try {
        await GuidelineApi.updateGuideline({ id: doc.id, title: doc.title, tag: doc.tag, content });
      } catch {}
    }, 800);
  }, []);

  // Sync editor content when selecting a doc
  useEffect(() => {
    if (!editor || !selectedDoc) return;
    isUserEditing.current = false;
    editor.commands.setContent(selectedDoc.content);
    setTimeout(() => { isUserEditing.current = true; }, 50);
  }, [selectedId, editor]);

  // ─── Handlers ────────────────────────
  const handleSelect = useCallback((docId: number) => {
    if (autoSaveTimer.current) { clearTimeout(autoSaveTimer.current); autoSaveTimer.current = null; }
    setSelectedId(docId);
  }, []);

  const handleCreate = async () => {
    if (!createTitle.trim()) return;
    try {
      await GuidelineApi.createGuideline({
         title: createTitle.trim(), tag: createTag.trim(),
         content: `# ${createTitle.trim()}\n\n开始编写规范内容...\n`
      });
      fetchDocs();
      setIsCreateOpen(false);
      setCreateTitle(''); setCreateTag('');
    } catch {}
  };

  const handleTitleSave = async () => {
    if (!selectedDoc || !tempTitle.trim()) { setEditingTitle(false); return; }
    try {
      await GuidelineApi.updateGuideline({ id: selectedDoc.id, title: tempTitle.trim(), tag: selectedDoc.tag, content: selectedDoc.content });
      setDocs(prev => prev.map(d => d.id === selectedDoc.id ? { ...d, title: tempTitle.trim(), updatedAt: nowStr() } : d));
    } catch {}
    setEditingTitle(false);
  };

  const handleTagSave = async () => {
    if (!selectedDoc) { setEditingTag(false); return; }
    try {
      await GuidelineApi.updateGuideline({ id: selectedDoc.id, title: selectedDoc.title, tag: tempTag.trim(), content: selectedDoc.content });
      setDocs(prev => prev.map(d => d.id === selectedDoc.id ? { ...d, tag: tempTag.trim(), updatedAt: nowStr() } : d));
    } catch {}
    setEditingTag(false);
  };

  const handleCopy = () => {
    if (!editor) return;
    const md = (editor.storage as any).markdown.getMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!selectedDoc || !editor) return;
    const md = (editor.storage as any).markdown.getMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${selectedDoc.title}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      await GuidelineApi.deleteGuideline({ id: deleteConfirmId });
      if (selectedId === deleteConfirmId) {
        setSelectedId(null);
        if (editor) editor.commands.setContent('');
      }
      fetchDocs();
    } catch {}
    setDeleteConfirmId(null);
  };

  const getMdPreview = (content: string) => {
    const plain = content.replace(/[#*`>\-\[\]|_~]/g, '').replace(/\n+/g, ' ').trim();
    return plain.length > 55 ? plain.slice(0, 55) + '...' : plain;
  };

  const wordCount = editor?.state.doc.textContent?.length || 0;
  const lineCount = editor?.state.doc.content.childCount || 0;

  useEffect(() => {
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, []);

  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans overflow-hidden relative">
      <div className="absolute top-0 left-1/4 w-[50%] h-[350px] bg-amber-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="h-14 border-b border-white/5 bg-[#0A0C12]/90 flex-shrink-0 flex items-center justify-between px-5 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">规范管理</h1>
            <p className="text-[10px] text-slate-500">{docs.length} 篇规范文档</p>
          </div>
        </div>

        {/* Center: Tag Filter + Search */}
        <div className="flex items-center gap-2 flex-1 justify-center max-w-md mx-4">
          <div className="relative flex-shrink-0">
            <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 bg-[#12141D] border border-white/5 rounded-lg text-xs text-slate-200 outline-none focus:border-amber-500/40 transition-all cursor-pointer min-w-[90px]">
              <option value="">全部标签</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索规范文档..."
              className="w-full pl-8 pr-3 py-2 bg-[#12141D] border border-white/5 rounded-lg text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/40 transition-all" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden z-10">
        {/* Left Sidebar */}
        <aside className="w-72 border-r border-white/5 bg-[#0A0C12]/50 flex flex-col flex-shrink-0">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">{filteredDocs.length} 篇文档</span>
            <button onClick={() => { setCreateTitle(''); setCreateTag(''); setIsCreateOpen(true); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-[11px] hover:opacity-90 shadow-lg shadow-amber-500/20 transition-all">
              <Plus className="w-3 h-3" />新建
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredDocs.map((doc, i) => (
                <motion.div key={doc.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => handleSelect(doc.id)}
                  className={`group relative px-4 py-3.5 border-b border-white/[0.03] cursor-pointer transition-all ${selectedId === doc.id
                    ? 'bg-amber-500/10 border-l-2 border-l-amber-500'
                    : 'border-l-2 border-l-transparent hover:bg-white/[0.03]'
                  }`}>
                  <div className="flex items-start justify-between mb-1">
                    <span className={`text-sm font-medium truncate ${selectedId === doc.id ? 'text-amber-300' : 'text-slate-200'}`}>{doc.title}</span>
                    <button onClick={e => { e.stopPropagation(); setDeleteConfirmId(doc.id); }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all flex-shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mb-1.5 leading-relaxed">{getMdPreview(doc.content)}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    {doc.tag && <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/80">{doc.tag}</span>}
                    <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{doc.updatedAt}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredDocs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <ShieldCheck className="w-10 h-10 mb-3 opacity-15" />
                <p className="text-xs">暂无规范文档</p>
              </div>
            )}
          </div>
        </aside>

        {/* Right: WYSIWYG Editor */}
        <section className="flex-1 flex flex-col overflow-hidden bg-[#07080C]">
          {selectedDoc ? (
            <>
              {/* Doc Header + Toolbar */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/5 bg-[#0C0E15]/80 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {editingTitle ? (
                    <input value={tempTitle} autoFocus onChange={e => setTempTitle(e.target.value)}
                      onBlur={handleTitleSave} onKeyDown={e => e.key === 'Enter' && handleTitleSave()}
                      className="bg-transparent border-b border-amber-500/50 outline-none text-sm font-semibold text-amber-300 min-w-[100px] max-w-[300px] pb-0.5" />
                  ) : (
                    <h3 className="text-sm font-semibold text-slate-200 cursor-pointer hover:text-amber-300 transition-colors group flex items-center gap-1.5"
                      onClick={() => { setTempTitle(selectedDoc.title); setEditingTitle(true); }}>
                      {selectedDoc.title}
                      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                    </h3>
                  )}

                  {editingTag ? (
                    <input value={tempTag} autoFocus onChange={e => setTempTag(e.target.value)}
                      onBlur={handleTagSave} onKeyDown={e => e.key === 'Enter' && handleTagSave()}
                      className="bg-amber-500/10 border border-amber-500/30 outline-none text-[10px] text-amber-400 px-2 py-0.5 rounded-md w-20" placeholder="标签" />
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400/80 border border-amber-500/10 cursor-pointer hover:bg-amber-500/20 transition-colors"
                      onClick={() => { setTempTag(selectedDoc.tag); setEditingTag(true); }}>
                      {selectedDoc.tag || '+ 标签'}
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono ml-2">
                    <span className="flex items-center gap-1"><Hash className="w-2.5 h-2.5" />{lineCount} 段</span>
                    <span>·</span>
                    <span>{wordCount} 字</span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  <button onClick={handleCopy} title="复制 Markdown"
                    className={`p-1.5 rounded-lg transition-colors ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5 text-slate-400 hover:text-emerald-400'}`}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={handleDownload} title="下载 .md" className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-sky-400 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Format Toolbar */}
              {editor && (
                <div className="flex items-center gap-0.5 px-5 py-1.5 border-b border-white/5 bg-[#0C0E15]/50 flex-shrink-0">
                  <TBtn icon={<Heading1 className="w-4 h-4" />} title="标题1"
                    active={editor.isActive('heading', { level: 1 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
                  <TBtn icon={<Heading2 className="w-4 h-4" />} title="标题2"
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
                  <TBtn icon={<Heading3 className="w-4 h-4" />} title="标题3"
                    active={editor.isActive('heading', { level: 3 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />

                  <div className="w-px h-5 bg-white/5 mx-1" />

                  <TBtn icon={<Bold className="w-4 h-4" />} title="粗体"
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()} />
                  <TBtn icon={<Italic className="w-4 h-4" />} title="斜体"
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()} />
                  <TBtn icon={<Strikethrough className="w-4 h-4" />} title="删除线"
                    active={editor.isActive('strike')}
                    onClick={() => editor.chain().focus().toggleStrike().run()} />

                  <div className="w-px h-5 bg-white/5 mx-1" />

                  <TBtn icon={<List className="w-4 h-4" />} title="无序列表"
                    active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()} />
                  <TBtn icon={<ListOrdered className="w-4 h-4" />} title="有序列表"
                    active={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()} />

                  <div className="w-px h-5 bg-white/5 mx-1" />

                  <TBtn icon={<Quote className="w-4 h-4" />} title="引用"
                    active={editor.isActive('blockquote')}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()} />
                  <TBtn icon={<Code className="w-4 h-4" />} title="代码块"
                    active={editor.isActive('codeBlock')}
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
                  <TBtn icon={<Minus className="w-4 h-4" />} title="分割线"
                    onClick={() => editor.chain().focus().setHorizontalRule().run()} />

                  <div className="w-px h-5 bg-white/5 mx-1" />

                  <TBtn icon={<Undo className="w-4 h-4" />} title="撤销"
                    onClick={() => editor.chain().focus().undo().run()} />
                  <TBtn icon={<Redo className="w-4 h-4" />} title="重做"
                    onClick={() => editor.chain().focus().redo().run()} />
                </div>
              )}

              {/* WYSIWYG Editor Area */}
              <div className="flex-1 overflow-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <ShieldCheck className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-sm mb-1 text-slate-400">选择一篇规范文档查看</p>
              <p className="text-xs opacity-50">或点击右上角「新建规范」创建</p>
            </div>
          )}
        </section>
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
                className="w-full max-w-md bg-[#12141D] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                    </div>
                    <h3 className="text-base font-bold text-slate-100">新建规范</h3>
                  </div>
                  <button onClick={() => setIsCreateOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">规范名称 *</label>
                    <input value={createTitle} autoFocus onChange={e => setCreateTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/50 transition-all"
                      placeholder="如：前端代码规范" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">分类标签</label>
                    <input value={createTag} onChange={e => setCreateTag(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/50 transition-all"
                      placeholder="如：React / Go / 通用" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
                  <button onClick={() => setIsCreateOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">取消</button>
                  <button onClick={handleCreate} disabled={!createTitle.trim()}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 disabled:opacity-40 shadow-lg shadow-amber-500/20 transition-all">
                    创建
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
                <p className="text-sm text-slate-400 mb-6">删除后将无法恢复，确定要删除这篇规范文档吗？</p>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">取消</button>
                  <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all">确认删除</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Editor Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }

        .gl-editor-content {
          color: #cbd5e1;
          line-height: 1.8;
          font-size: 14px;
        }

        .gl-editor-content h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #f1f5f9;
          margin: 1.5rem 0 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .gl-editor-content h2 {
          font-size: 1.35rem;
          font-weight: 600;
          color: #e2e8f0;
          margin: 1.25rem 0 0.5rem;
          padding-bottom: 0.4rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .gl-editor-content h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #e2e8f0;
          margin: 1rem 0 0.4rem;
        }

        .gl-editor-content p { margin: 0.5rem 0; }

        .gl-editor-content pre,
        .gl-editor-content .gl-code-block {
          background: #0F1118 !important;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 1rem 1.25rem;
          margin: 0.75rem 0;
          overflow-x: auto;
          font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
          font-size: 12.5px;
          line-height: 1.7;
          color: #fbbf24;
        }

        .gl-editor-content code:not(pre code) {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          padding: 0.15em 0.45em;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85em;
        }

        .gl-editor-content blockquote {
          border-left: 3px solid rgba(245, 158, 11, 0.5);
          padding: 0.5rem 1rem;
          margin: 0.75rem 0;
          background: rgba(245, 158, 11, 0.05);
          border-radius: 0 8px 8px 0;
          color: #94a3b8;
        }

        .gl-editor-content hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.08);
          margin: 1.5rem 0;
        }

        .gl-editor-content ul {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
          list-style-type: disc;
        }
        .gl-editor-content ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
          list-style-type: decimal;
        }
        .gl-editor-content li { margin: 0.25rem 0; }
        .gl-editor-content li p { margin: 0; }

        .gl-editor-content strong { color: #f1f5f9; font-weight: 600; }
        .gl-editor-content em { font-style: italic; color: #94a3b8; }
        .gl-editor-content del { text-decoration: line-through; opacity: 0.6; }
        .gl-editor-content a { color: #f59e0b; text-decoration: underline; }

        .gl-editor-content .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(148, 163, 184, 0.4);
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}
