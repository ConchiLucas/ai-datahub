import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FileText, Plus, Copy, Check, Trash2, Search,
  X, Download, CloudOff, Loader2, Clock, SortAsc, SortDesc,
  Hash, Bold, Italic, Strikethrough, List, ListOrdered,
  Quote, Code, Heading1, Heading2, Heading3, Minus, Undo, Redo
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import UnderlineExt from '@tiptap/extension-underline';
import { Markdown } from 'tiptap-markdown';
import {
  addMarkdownSnippet, updateMarkdownSnippet, deleteMarkdownSnippet, getMarkdownSnippets
} from '@/api/markdown';

// ─── Types ───────────────────────────
interface MdSnippet {
  id: number;
  title: string;
  content: string;
  CreatedAt: string;
}

// ─── Save Status Badge ──────────────
type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';

function SaveStatusBadge({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;
  const config = {
    unsaved: { icon: <CloudOff className="w-3 h-3" />, text: '未保存', cls: 'text-slate-400 border-white/10 bg-white/5' },
    saving: { icon: <Loader2 className="w-3 h-3 animate-spin" />, text: '保存中', cls: 'text-teal-400 border-teal-500/20 bg-teal-500/10' },
    saved: { icon: <Check className="w-3 h-3" />, text: '已保存', cls: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' },
  }[status];
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${config.cls}`}>
      {config.icon}
      {config.text}
    </div>
  );
}

// ─── Toolbar Button ──────────────────
function TBtn({ icon, active, onClick, title }: {
  icon: React.ReactNode; active?: boolean; onClick?: () => void; title?: string;
}) {
  return (
    <button onClick={onClick} title={title}
      className={`p-1.5 rounded-md transition-all ${active ? 'bg-teal-500/20 text-teal-400' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
      {icon}
    </button>
  );
}

// ─── Main Component ──────────────────
export default function MarkdownManagerPage() {
  const navigate = useNavigate();
  const [snippets, setSnippets] = useState<MdSnippet[]>([]);
  const [selected, setSelected] = useState<MdSnippet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Save status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserEditing = useRef(false);

  // ─── Fetch Data ──────────────────────
  const fetchData = async () => {
    const res: any = await getMarkdownSnippets();
    if (res.code === 0) {
      const list = res.data || [];
      setSnippets(list);
      if (selected) {
        const refreshed = list.find((s: MdSnippet) => s.id === selected.id);
        if (refreshed) setSelected(refreshed);
      } else if (list.length > 0) {
        setSelected(list[0]);
        if (editor) editor.commands.setContent(list[0].content);
        isUserEditing.current = true;
      }
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── TipTap Editor ───────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: { class: 'md-code-block' },
        },
      }),
      UnderlineExt,
      Placeholder.configure({ placeholder: '开始编写 Markdown...' }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'md-editor-content prose prose-sm prose-invert max-w-none focus:outline-none min-h-[500px] px-6 py-5',
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (!isUserEditing.current || !selected) return;
      const markdown = ed.storage.markdown.getMarkdown();
      triggerAutoSave(markdown, selected.id);
    },
  });

  // ─── Filtering & Sorting ─────────────
  const filteredSnippets = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let filtered = snippets.filter(s =>
      s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
    );
    filtered.sort((a, b) => sortOrder === 'desc' 
      ? new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime() 
      : new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime());
    return filtered;
  }, [snippets, searchQuery, sortOrder]);

  // ─── Stats ───────────────────────────
  const wordCount = editor?.state.doc.textContent?.length || 0;
  const lineCount = editor?.state.doc.content.childCount || 0;

  // ─── Debounced auto-save ─────────────
  const triggerAutoSave = useCallback((content: string, snippetId: number) => {
    setSaveStatus('unsaved');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      const res: any = await updateMarkdownSnippet({ id: snippetId, content });
      if (res.code === 0) {
        setSnippets(prev => prev.map(s => s.id === snippetId ? { ...s, content } : s));
        setSaveStatus('saved');
        if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
        savedResetTimer.current = setTimeout(() => {
          setSaveStatus('idle');
          savedResetTimer.current = null;
        }, 2000);
      } else {
        setSaveStatus('unsaved');
      }
    }, 400);
  }, []);

  // ─── Handlers ────────────────────────
  const handleSelect = useCallback((s: MdSnippet) => {
    if (autoSaveTimer.current) { clearTimeout(autoSaveTimer.current); autoSaveTimer.current = null; }
    if (savedResetTimer.current) { clearTimeout(savedResetTimer.current); savedResetTimer.current = null; }
    setSaveStatus('idle');
    isUserEditing.current = false;
    setSelected(s);

    // Load markdown into TipTap
    if (editor) {
      editor.commands.setContent(s.content);
    }
    setTimeout(() => { isUserEditing.current = true; }, 50);
  }, [editor]);

  const handleTitleChange = (newTitle: string) => {
    if (!selected) return;
    setSelected({ ...selected, title: newTitle });
    setSnippets(prev => prev.map(s => s.id === selected.id ? { ...s, title: newTitle } : s));
    
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      await updateMarkdownSnippet({ id: selected.id, title: newTitle });
    }, 500);
  };

  const handleCopy = () => {
    if (!editor) return;
    const md = editor.storage.markdown.getMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async () => {
    if (!createTitle.trim()) return;
    const content = createContent.trim() || `# ${createTitle}\n\n`;
    const res: any = await addMarkdownSnippet({ title: createTitle, content });
    
    if (res.code === 0) {
      await fetchData();
      const newSnippet = res.data;
      setSelected(newSnippet);
      if (editor) editor.commands.setContent(newSnippet.content);
      isUserEditing.current = true;
      setIsCreateOpen(false);
      setCreateTitle(''); setCreateContent('');
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    const res: any = await deleteMarkdownSnippet({ id: deleteConfirmId });
    if (res.code === 0) {
      if (selected?.id === deleteConfirmId) {
        setSelected(null);
        if (editor) editor.commands.setContent('');
      }
      await fetchData();
    }
    setDeleteConfirmId(null);
  };

  const handleDownload = () => {
    if (!selected || !editor) return;
    const md = editor.storage.markdown.getMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selected.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMdPreview = (content: string) => {
    const plain = content.replace(/[#*`>\-\[\]|_~]/g, '').replace(/\n+/g, ' ').trim();
    return plain.length > 60 ? plain.slice(0, 60) + '...' : plain;
  };

  const getRelativeTime = (isoString: string) => {
    const ts = new Date(isoString).getTime();
    if (isNaN(ts)) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}天前`;
    return new Date(ts).toLocaleDateString('zh-CN');
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
    };
  }, []);

  // Init user editing flag after first mount
  // We handle this inside fetchData now when it auto-selects if any array items exist.

  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans overflow-hidden">
      {/* ─── Header ─── */}
      <header className="h-14 border-b border-white/5 bg-[#0A0C12]/90 flex-shrink-0 flex items-center justify-between px-5 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">
            Markdown 管理
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {selected && <SaveStatusBadge status={saveStatus} />}
          <button
            onClick={() => { setCreateTitle(''); setCreateContent(''); setIsCreateOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-white font-medium text-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            新建
          </button>
        </div>
      </header>

      {/* ─── Main Split Layout ─── */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Document List */}
        <aside className="w-72 border-r border-white/5 bg-[#0A0C12]/50 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-white/5 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索标题或内容..."
                className="w-full pl-8 pr-3 py-2 bg-[#12141D] border border-white/5 rounded-lg text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-teal-500/40 transition-all"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{filteredSnippets.length} 篇文档</span>
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors"
              >
                {sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />}
                {sortOrder === 'desc' ? '最新' : '最早'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredSnippets.map((snippet, i) => (
                <motion.div
                  key={snippet.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => handleSelect(snippet)}
                  className={`group relative px-4 py-3.5 border-b border-white/[0.03] cursor-pointer transition-all ${selected?.id === snippet.id
                    ? 'bg-teal-500/10 border-l-2 border-l-teal-500'
                    : 'border-l-2 border-l-transparent hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className={`text-sm font-medium truncate ${selected?.id === snippet.id ? 'text-teal-300' : 'text-slate-200'}`}>
                      {snippet.title}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(snippet.id); }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mb-1.5 leading-relaxed">{getMdPreview(snippet.content)}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{getRelativeTime(snippet.CreatedAt)}</span>
                    <span>·</span>
                    <span>{snippet.content.length} 字</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredSnippets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <FileText className="w-10 h-10 mb-3 opacity-15" />
                <p className="text-xs">暂无文档</p>
              </div>
            )}
          </div>
        </aside>

        {/* Right Panel - WYSIWYG Editor */}
        <section className="flex-1 flex flex-col overflow-hidden bg-[#07080C]">
          {selected ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0C0E15]/80 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <input
                    value={selected.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-semibold text-slate-200 min-w-[60px] max-w-[300px] focus:text-teal-300 transition-colors"
                  />
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1"><Hash className="w-2.5 h-2.5" />{lineCount} 段</span>
                    <span>·</span>
                    <span>{wordCount} 字</span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  <button onClick={handleCopy} title="复制 Markdown" className={`p-1.5 rounded-lg transition-colors ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5 text-slate-400 hover:text-emerald-400'}`}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={handleDownload} title="下载 .md" className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-sky-400 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Format Toolbar */}
              {editor && (
                <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-white/5 bg-[#0C0E15]/50 flex-shrink-0">
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
              <FileText className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-sm mb-1">选择一篇文档查看</p>
              <p className="text-xs opacity-50">或点击右上角「新建」创建</p>
            </div>
          )}
        </section>
      </main>

      {/* ─── Create Modal ─── */}
      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsCreateOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#12141D] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
                    <FileText className="w-4 h-4 text-teal-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100">新建文档</h3>
                </div>
                <button onClick={() => setIsCreateOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">文档标题</label>
                  <input
                    type="text" value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="例：部署流程文档"
                    className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-teal-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">初始内容（可选，支持 Markdown）</label>
                  <textarea
                    value={createContent}
                    onChange={(e) => setCreateContent(e.target.value)}
                    placeholder={'# 标题\n\n正文内容...'}
                    rows={6}
                    spellCheck={false}
                    className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm font-mono text-teal-300 placeholder-slate-600 outline-none focus:border-teal-500/50 transition-all resize-none custom-scrollbar"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
                <button onClick={() => setIsCreateOpen(false)} className="px-5 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">取消</button>
                <button onClick={handleCreate} className="px-5 py-2 rounded-xl text-sm font-medium bg-teal-500 hover:bg-teal-400 text-white transition-all">确认创建</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirmation ─── */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirmId(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-red-500/10">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">确认删除</h3>
              </div>
              <p className="text-sm text-slate-400 mb-6">删除后将无法恢复，确定要删除吗？</p>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">取消</button>
                <button onClick={confirmDelete} className="px-5 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20">确认删除</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Styles ─── */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }

        /* ─── TipTap WYSIWYG Editor Styles ─── */
        .md-editor-content {
          color: #cbd5e1;
          line-height: 1.8;
          font-size: 14px;
        }

        .md-editor-content h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #f1f5f9;
          margin: 1.5rem 0 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .md-editor-content h2 {
          font-size: 1.35rem;
          font-weight: 600;
          color: #e2e8f0;
          margin: 1.25rem 0 0.5rem;
          padding-bottom: 0.4rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .md-editor-content h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #e2e8f0;
          margin: 1rem 0 0.4rem;
        }

        .md-editor-content p {
          margin: 0.5rem 0;
        }

        .md-editor-content pre,
        .md-editor-content .md-code-block {
          background: #0F1118 !important;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 1rem 1.25rem;
          margin: 0.75rem 0;
          overflow-x: auto;
          font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
          font-size: 12.5px;
          line-height: 1.7;
          color: #a5b4fc;
        }

        .md-editor-content code:not(pre code) {
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
          padding: 0.15em 0.45em;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85em;
        }

        .md-editor-content blockquote {
          border-left: 3px solid rgba(20, 184, 166, 0.5);
          padding: 0.5rem 1rem;
          margin: 0.75rem 0;
          background: rgba(20, 184, 166, 0.05);
          border-radius: 0 8px 8px 0;
          color: #94a3b8;
        }

        .md-editor-content hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.08);
          margin: 1.5rem 0;
        }

        .md-editor-content ul {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
          list-style-type: disc;
        }
        .md-editor-content ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
          list-style-type: decimal;
        }
        .md-editor-content li {
          margin: 0.25rem 0;
        }
        .md-editor-content li p {
          margin: 0;
        }

        .md-editor-content strong { color: #f1f5f9; font-weight: 600; }
        .md-editor-content em { font-style: italic; color: #94a3b8; }
        .md-editor-content del { text-decoration: line-through; opacity: 0.6; }
        .md-editor-content a { color: #14b8a6; text-decoration: underline; }

        /* Placeholder */
        .md-editor-content .is-editor-empty:first-child::before {
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
