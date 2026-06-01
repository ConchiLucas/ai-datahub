import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Braces, Plus, Copy, Check, Trash2, Search,
  ChevronRight, ChevronDown, X, FileJson2,
  AlertTriangle, CheckCircle2, Download, CloudOff, Loader2
} from 'lucide-react';
import {
  addJsonSnippet, updateJsonSnippet, deleteJsonSnippet, getJsonSnippets
} from '@/api/json';

// ─── Types ───────────────────────────
interface JsonSnippet {
  id: number;
  title: string;
  content: string;
  CreatedAt: string;
}

// ─── Save Status ─────────────────────
type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';

function SaveStatusBadge({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;
  const config = {
    unsaved: { icon: <CloudOff className="w-3 h-3" />, text: '未保存', cls: 'text-slate-400 border-white/10 bg-white/5' },
    saving: { icon: <Loader2 className="w-3 h-3 animate-spin" />, text: '保存中', cls: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10' },
    saved: { icon: <Check className="w-3 h-3" />, text: '已保存', cls: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' },
  }[status];
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${config.cls}`}>
      {config.icon}
      {config.text}
    </div>
  );
}

// ─── JSON Tree Renderer ─────────────
function JsonTreeNode({ keyName, value, depth = 0 }: { keyName?: string; value: any; depth?: number }) {
  const [collapsed, setCollapsed] = useState(depth > 2);
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const entries = isObject ? Object.entries(value) : [];
  const bracketOpen = isArray ? '[' : '{';
  const bracketClose = isArray ? ']' : '}';

  const renderValue = (v: any) => {
    if (v === null) return <span className="text-orange-400/80 italic">null</span>;
    if (typeof v === 'boolean') return <span className="text-orange-400">{v ? 'true' : 'false'}</span>;
    if (typeof v === 'number') return <span className="text-sky-400">{v}</span>;
    if (typeof v === 'string') return <span className="text-emerald-400">"{v.length > 120 ? v.slice(0, 120) + '...' : v}"</span>;
    return null;
  };

  if (!isObject) {
    return (
      <div className="flex items-start leading-6 pl-1" style={{ paddingLeft: depth * 20 }}>
        {keyName !== undefined && <span className="text-violet-400 mr-1">"{keyName}"</span>}
        {keyName !== undefined && <span className="text-slate-500 mr-1">:</span>}
        {renderValue(value)}
      </div>
    );
  }

  return (
    <div style={{ paddingLeft: depth * 20 }}>
      <div
        className="flex items-center cursor-pointer hover:bg-white/[0.03] rounded px-1 leading-6 group"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="w-4 h-4 flex items-center justify-center text-slate-500 mr-1 flex-shrink-0">
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </span>
        {keyName !== undefined && <span className="text-violet-400 mr-1">"{keyName}"</span>}
        {keyName !== undefined && <span className="text-slate-500 mr-1">:</span>}
        <span className="text-slate-400">{bracketOpen}</span>
        {collapsed && (
          <>
            <span className="text-slate-600 mx-1 text-xs">{entries.length} {isArray ? 'items' : 'keys'}</span>
            <span className="text-slate-400">{bracketClose}</span>
          </>
        )}
      </div>
      {!collapsed && (
        <>
          {entries.map(([k, v], i) => (
            <JsonTreeNode key={`${k}-${i}`} keyName={isArray ? undefined : k} value={v} depth={depth + 1} />
          ))}
          <div className="pl-1 leading-6 text-slate-400" style={{ paddingLeft: (depth) * 20 + 20 }}>{bracketClose}</div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────
export default function JsonManagerPage() {
  const navigate = useNavigate();
  const [snippets, setSnippets] = useState<JsonSnippet[]>([]);
  const [selected, setSelected] = useState<JsonSnippet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Editor state
  const [editorContent, setEditorContent] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');
  const [copied, setCopied] = useState(false);

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // ─── Auto-save (debounced, like notes) ──
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserEditing = useRef(false);

  // ─── Fetch Data ──────────────────────
  const fetchData = async () => {
    const res: any = await getJsonSnippets();
    if (res.code === 0) {
      const list = res.data || [];
      setSnippets(list);
      if (selected) {
        const refreshed = list.find((s: JsonSnippet) => s.id === selected.id);
        if (refreshed) setSelected(refreshed);
      } else if (list.length > 0) {
        // 默认加载第一条
        setSelected(list[0]);
        setEditorContent(list[0].content);
        isUserEditing.current = true;
      }
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Validation ──────────────────────
  const jsonValidation = useMemo(() => {
    try {
      JSON.parse(editorContent);
      return { valid: true, error: '' };
    } catch (e: any) {
      return { valid: false, error: e.message };
    }
  }, [editorContent]);

  const parsedJson = useMemo(() => {
    try { return JSON.parse(editorContent); } catch { return null; }
  }, [editorContent]);

  // ─── Filtering ───────────────────────
  const filteredSnippets = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return snippets.filter(s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q));
  }, [snippets, searchQuery]);

  // ─── Debounced auto-save (like notes) ─
  const triggerAutoSave = useCallback(async (content: string, snippetId: number) => {
    // Mark unsaved immediately
    setSaveStatus('unsaved');

    // Clear previous timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(async () => {
      // Only auto-save if content is valid JSON
      try {
        JSON.parse(content);
      } catch {
        return; // Don't save invalid JSON
      }

      setSaveStatus('saving');
      const res: any = await updateJsonSnippet({ id: snippetId, content });
      if (res.code === 0) {
        setSaveStatus('saved');
        // Silently update the snippets list
        setSnippets(prev => prev.map(s => s.id === snippetId ? { ...s, content } : s));
        // Reset to idle after 2s
        if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
        savedResetTimer.current = setTimeout(() => {
          setSaveStatus('idle');
          savedResetTimer.current = null;
        }, 2000);
      } else {
        setSaveStatus('unsaved');
      }
    }, 300);
  }, []);

  // ─── Handlers ────────────────────────
  const handleSelect = useCallback((s: JsonSnippet) => {
    // Cancel any pending auto-save from previous snippet
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    if (savedResetTimer.current) {
      clearTimeout(savedResetTimer.current);
      savedResetTimer.current = null;
    }
    setSaveStatus('idle');
    isUserEditing.current = false;

    setSelected(s);
    setEditorContent(s.content);
    setViewMode('tree');

    // Re-enable user editing after content is set
    setTimeout(() => { isUserEditing.current = true; }, 0);
  }, []);

  const handleEditorChange = (newContent: string) => {
    setEditorContent(newContent);

    // Only auto-save if user is actively editing and we have a selection
    if (isUserEditing.current && selected) {
      triggerAutoSave(newContent, selected.id);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editorContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTitleChange = async (newTitle: string) => {
    if (!selected) return;
    setSelected({ ...selected, title: newTitle });
    setSnippets(prev => prev.map(s => s.id === selected.id ? { ...s, title: newTitle } : s));
    // Debounce title save
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      await updateJsonSnippet({ id: selected.id, title: newTitle });
    }, 500);
  };

  const handleCreate = async () => {
    if (!createTitle.trim()) return;
    let content = createContent.trim() || '{}';
    try { content = JSON.stringify(JSON.parse(content), null, 2); } catch { }
    const res: any = await addJsonSnippet({ title: createTitle, content });
    if (res.code === 0) {
      await fetchData();
      // Select the newly created snippet
      const newSnippet = res.data;
      setSelected(newSnippet);
      setEditorContent(newSnippet.content);
      isUserEditing.current = true;
      setIsCreateOpen(false);
      setCreateTitle(''); setCreateContent('');
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    const res: any = await deleteJsonSnippet({ id: deleteConfirmId });
    if (res.code === 0) {
      if (selected?.id === deleteConfirmId) { setSelected(null); setEditorContent(''); }
      await fetchData();
    }
    setDeleteConfirmId(null);
  };

  const handleDownload = () => {
    if (!selected) return;
    const blob = new Blob([editorContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selected.title}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getJsonPreview = (content: string) => {
    try {
      const obj = JSON.parse(content);
      const keys = Object.keys(obj);
      return keys.slice(0, 3).join(', ') + (keys.length > 3 ? ` +${keys.length - 3}` : '');
    } catch { return 'Invalid JSON'; }
  };

  const getJsonSize = (content: string) => {
    const bytes = new Blob([content]).size;
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
    };
  }, []);

  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans overflow-hidden">
      {/* ─── Header ─── */}
      <header className="h-14 border-b border-white/5 bg-[#0A0C12]/90 flex-shrink-0 flex items-center justify-between px-5 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Braces className="w-4 h-4" />
          </div>
          <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
            JSON 管理
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {selected && (
            <>
              <SaveStatusBadge status={saveStatus} />
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${jsonValidation.valid
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                {jsonValidation.valid ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {jsonValidation.valid ? 'Valid JSON' : 'Invalid'}
              </div>
            </>
          )}
          <button
            onClick={() => { setCreateTitle(''); setCreateContent(''); setIsCreateOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            新建
          </button>
        </div>
      </header>

      {/* ─── Main Split Layout ─── */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Snippet List */}
        <aside className="w-72 border-r border-white/5 bg-[#0A0C12]/50 flex flex-col flex-shrink-0">
          {/* Search */}
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索 JSON 片段..."
                className="w-full pl-8 pr-3 py-2 bg-[#12141D] border border-white/5 rounded-lg text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/40 transition-all"
              />
            </div>
          </div>

          {/* Snippet List */}
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
                  className={`group relative px-4 py-3 border-b border-white/[0.03] cursor-pointer transition-all ${selected?.id === snippet.id
                      ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500'
                      : 'border-l-2 border-l-transparent hover:bg-white/[0.03]'
                    }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileJson2 className={`w-3.5 h-3.5 flex-shrink-0 ${selected?.id === snippet.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span className={`text-sm font-medium truncate ${selected?.id === snippet.id ? 'text-indigo-300' : 'text-slate-200'}`}>
                        {snippet.title}
                      </span>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(snippet.id); }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pl-5.5">
                    <span className="truncate font-mono opacity-70">{getJsonPreview(snippet.content)}</span>
                    <span className="flex-shrink-0 ml-2">{getJsonSize(snippet.content)}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredSnippets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Braces className="w-10 h-10 mb-3 opacity-15" />
                <p className="text-xs">暂无 JSON 片段</p>
              </div>
            )}
          </div>
        </aside>

        {/* Right Panel - Editor / Viewer */}
        <section className="flex-1 flex flex-col overflow-hidden bg-[#07080C]">
          {selected ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/5 bg-[#0C0E15]/80 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <input
                    value={selected.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-semibold text-slate-200 min-w-[60px] max-w-[300px] focus:text-indigo-300 transition-colors"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">{getJsonSize(editorContent)}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-[#12141D] border border-white/5 rounded-lg overflow-hidden mr-2">
                    <button
                      onClick={() => setViewMode('tree')}
                      className={`px-2.5 py-1 text-[11px] font-medium transition-all ${viewMode === 'tree' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'}`}
                    >树形</button>
                    <button
                      onClick={() => setViewMode('raw')}
                      className={`px-2.5 py-1 text-[11px] font-medium transition-all ${viewMode === 'raw' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'}`}
                    >源码</button>
                  </div>

                  <button onClick={handleCopy} title="复制" className={`p-1.5 rounded-lg transition-colors ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5 text-slate-400 hover:text-emerald-400'}`}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={handleDownload} title="下载" className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-sky-400 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-auto custom-scrollbar">
                {viewMode === 'tree' && parsedJson !== null ? (
                  <div className="p-5 font-mono text-[13px] leading-relaxed">
                    <JsonTreeNode value={parsedJson} depth={0} />
                  </div>
                ) : (
                  <div className="relative h-full">
                    <textarea
                      value={editorContent}
                      onChange={(e) => handleEditorChange(e.target.value)}
                      spellCheck={false}
                      className="w-full h-full bg-transparent resize-none outline-none p-5 font-mono text-[13px] leading-relaxed text-slate-300 custom-scrollbar"
                      style={{ tabSize: 2 }}
                    />
                    {!jsonValidation.valid && (
                      <div className="absolute bottom-4 left-5 right-5 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-xs text-red-400 flex items-center gap-2 backdrop-blur-sm">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{jsonValidation.error}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <FileJson2 className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-sm mb-1">选择一个 JSON 片段查看</p>
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
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <Braces className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100">新建 JSON 片段</h3>
                </div>
                <button onClick={() => setIsCreateOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">名称</label>
                  <input
                    type="text" value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="例：Nginx 配置模板"
                    className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">JSON 内容（可选，留空默认 {"{}"}）</label>
                  <textarea
                    value={createContent}
                    onChange={(e) => setCreateContent(e.target.value)}
                    placeholder={'{\n  "key": "value"\n}'}
                    rows={8}
                    spellCheck={false}
                    className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm font-mono text-indigo-300 placeholder-slate-600 outline-none focus:border-indigo-500/50 transition-all resize-none custom-scrollbar"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
                <button onClick={() => setIsCreateOpen(false)} className="px-5 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">
                  取消
                </button>
                <button onClick={handleCreate} className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white transition-all">
                  确认创建
                </button>
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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
}
