import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import {
  ArrowLeft, Braces, Search, Plus, Copy, Edit2, Trash2, Clock,
  Check, X, CloudOff, Loader2, FolderCode, FileCode2, ChevronRight
} from 'lucide-react';
import { createCode, updateCode, deleteCode, getCodeList } from '@/api/code';

// ─── Types ───────────────────────────
interface CodeSnippet {
  id: number;
  feature: string;
  language: string;
  title: string;
  description: string;
  code: string;
  UpdatedAt: string;
}

// ─── Language Config ─────────────────
const LANGUAGES: Record<string, { label: string; dot: string; badge: string; monaco: string }> = {
  java:       { label: 'Java',       dot: 'bg-orange-400', badge: 'text-orange-400 bg-orange-400/10 border-orange-400/20', monaco: 'java' },
  python:     { label: 'Python',     dot: 'bg-blue-400',   badge: 'text-blue-400 bg-blue-400/10 border-blue-400/20',   monaco: 'python' },
  go:         { label: 'Go',         dot: 'bg-cyan-400',   badge: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',   monaco: 'go' },
  javascript: { label: 'JavaScript', dot: 'bg-yellow-400', badge: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', monaco: 'javascript' },
  typescript: { label: 'TypeScript', dot: 'bg-blue-500',   badge: 'text-blue-500 bg-blue-500/10 border-blue-500/20',   monaco: 'typescript' },
  sql:        { label: 'SQL',        dot: 'bg-emerald-400', badge: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', monaco: 'sql' },
  rust:       { label: 'Rust',       dot: 'bg-red-400',    badge: 'text-red-400 bg-red-400/10 border-red-400/20',    monaco: 'rust' },
  cpp:        { label: 'C++',        dot: 'bg-violet-400', badge: 'text-violet-400 bg-violet-400/10 border-violet-400/20', monaco: 'cpp' },
  html:       { label: 'HTML',       dot: 'bg-pink-400',   badge: 'text-pink-400 bg-pink-400/10 border-pink-400/20',   monaco: 'html' },
  css:        { label: 'CSS',        dot: 'bg-sky-400',    badge: 'text-sky-400 bg-sky-400/10 border-sky-400/20',    monaco: 'css' },
  shell:      { label: 'Shell',      dot: 'bg-green-400',  badge: 'text-green-400 bg-green-400/10 border-green-400/20',  monaco: 'shell' },
  yaml:       { label: 'YAML',       dot: 'bg-amber-400',  badge: 'text-amber-400 bg-amber-400/10 border-amber-400/20',  monaco: 'yaml' },
  json:       { label: 'JSON',       dot: 'bg-lime-400',   badge: 'text-lime-400 bg-lime-400/10 border-lime-400/20',   monaco: 'json' },
  vue:        { label: 'Vue',        dot: 'bg-green-500',  badge: 'text-green-500 bg-green-500/10 border-green-500/20',  monaco: 'html' },
  react:      { label: 'React',      dot: 'bg-cyan-300',   badge: 'text-cyan-300 bg-cyan-300/10 border-cyan-300/20',   monaco: 'typescript' },
  nginx:      { label: 'Nginx',      dot: 'bg-green-400',  badge: 'text-green-400 bg-green-400/10 border-green-400/20',  monaco: 'shell' },
  dockerfile: { label: 'Docker',     dot: 'bg-blue-400',   badge: 'text-blue-400 bg-blue-400/10 border-blue-400/20',   monaco: 'dockerfile' },
};
const defaultLang = { label: '其他', dot: 'bg-slate-400', badge: 'text-slate-400 bg-slate-400/10 border-slate-400/20', monaco: 'plaintext' };
function getLang(lang: string) { return LANGUAGES[lang] || defaultLang; }

// ─── Save Status ─────────────────────
type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;
  const config = {
    unsaved: { icon: <CloudOff size={14} />, text: '未保存', cls: 'text-slate-400' },
    saving:  { icon: <Loader2 size={14} className="animate-spin" />, text: '保存中', cls: 'text-violet-400' },
    saved:   { icon: <Check size={14} />, text: '已保存', cls: 'text-emerald-400' },
  };
  const c = config[status] || config.unsaved;
  return <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${c.cls}`}>{c.icon}{c.text}</span>;
}

// Formatter for Date
function formatDate(dStr: string) {
  if (!dStr) return '';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return dStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── Main Component ──────────────────
export default function CodeManagerPage() {
  const navigate = useNavigate();

  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editSnippet, setEditSnippet] = useState<CodeSnippet | null>(null);
  const [formFeature, setFormFeature] = useState('');
  const [formNewFeature, setFormNewFeature] = useState('');
  const [formLang, setFormLang] = useState('java');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCode, setFormCode] = useState('');

  const [copied, setCopied] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const detailHeaderRef = useRef<HTMLDivElement>(null);
  const [detailHeaderH, setDetailHeaderH] = useState(100);

  // ─── Fetch Data ─────────────
  const fetchData = useCallback(async () => {
    try {
      const res = await getCodeList({ page: 1, pageSize: 999 });
      if (res && res.data && res.data.list) {
        setSnippets(res.data.list);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-select first feature & first snippet
  useEffect(() => {
    if (snippets.length > 0 && !selectedFeature) {
      const f = snippets[0].feature;
      setSelectedFeature(f);
    }
  }, [snippets]);

  useEffect(() => {
    if (selectedFeature) {
      const inFeature = snippets.filter(s => s.feature === selectedFeature);
      if (inFeature.length > 0 && (!selectedId || !inFeature.find(s => s.id === selectedId))) {
        setSelectedId(inFeature[0].id);
      } else if (inFeature.length === 0) {
        setSelectedId(null);
      }
    }
  }, [selectedFeature, snippets, selectedId]);

  // Cleanup
  useEffect(() => () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
  }, []);

  // Measure header
  useEffect(() => {
    const el = detailHeaderRef.current;
    if (!el) return;
    const obs = new ResizeObserver(e => { for (const en of e) setDetailHeaderH(en.contentRect.height); });
    obs.observe(el);
    setDetailHeaderH(el.clientHeight);
    return () => obs.disconnect();
  }, [selectedId]);

  useEffect(() => {
    if (savedResetTimer.current) { clearTimeout(savedResetTimer.current); savedResetTimer.current = null; }
    setSaveStatus('idle');
  }, [selectedId]);

  // ─── Computed ────────────────
  const features = useMemo(() => {
    const map = new Map<string, number>();
    snippets.forEach(s => map.set(s.feature, (map.get(s.feature) || 0) + 1));
    return Array.from(map.entries()); // [name, count]
  }, [snippets]);

  const featureSnippets = useMemo(() => {
    if (!selectedFeature) return [];
    let list = snippets.filter(s => s.feature === selectedFeature);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q)
      );
    }
    return list;
  }, [snippets, selectedFeature, searchQuery]);

  const selectedSnippet = useMemo(() => snippets.find(s => s.id === selectedId) || null, [snippets, selectedId]);

  // ─── Handlers ────────────────
  const autoSave = useCallback((id: number, field: keyof CodeSnippet, value: any) => {
    setSaveStatus('unsaved');
    setSnippets(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    
    autoSaveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const item = snippets.find(s => s.id === id);
        // Fallback to updated item
        const currentItem = item ? { ...item, [field]: value } : null;
        if (currentItem) {
          await updateCode({
            id: currentItem.id,
            feature: currentItem.feature,
            language: currentItem.language,
            title: currentItem.title,
            description: currentItem.description,
            code: currentItem.code
          });
        }
        setSaveStatus('saved');
        if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
        savedResetTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error(err);
        setSaveStatus('idle'); // Or add an error state
      }
    }, 1500); // 1.5s debounce network
  }, [snippets]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }, []);

  const openForm = (snippet?: CodeSnippet) => {
    if (snippet) {
      setEditSnippet(snippet);
      setFormFeature(snippet.feature);
      setFormNewFeature('');
      setFormLang(snippet.language);
      setFormTitle(snippet.title);
      setFormDesc(snippet.description);
      setFormCode(snippet.code);
    } else {
      setEditSnippet(null);
      setFormFeature(selectedFeature || (features.length > 0 ? features[0][0] : ''));
      setFormNewFeature('');
      setFormLang('java');
      setFormTitle('');
      setFormDesc('');
      setFormCode('');
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) return;
    const feature = formNewFeature.trim() || formFeature;
    if (!feature) return;

    try {
      if (editSnippet) {
        await updateCode({
          id: editSnippet.id,
          feature,
          language: formLang,
          title: formTitle,
          description: formDesc,
          code: formCode
        });
      } else {
        await createCode({
          feature,
          language: formLang,
          title: formTitle,
          description: formDesc,
          code: formCode
        });
      }
      setIsFormOpen(false);
      fetchData(); // reload
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      await deleteCode({ id: deleteConfirmId });
      setDeleteConfirmId(null);
      if (selectedId === deleteConfirmId) setSelectedId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[55%] h-[400px] bg-violet-500/5 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[35%] h-[250px] bg-fuchsia-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* ─── Header ─── */}
      <header className="h-16 border-b border-white/5 bg-[#0F111A]/80 flex-shrink-0 flex items-center justify-between px-5 z-20 backdrop-blur-xl gap-3">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
              <Braces className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-500">代码管理</h1>
              <p className="text-[10px] text-slate-500">{features.length} 个功能 · {snippets.length} 个代码片段</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-center max-w-md mx-3">
          <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索代码片段..."
              className="pl-10 pr-4 py-2 w-full bg-[#151926]/90 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all placeholder-slate-500" />
          </div>
        </div>

        <button onClick={() => openForm()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium hover:opacity-90 transition-opacity text-sm shadow-lg shadow-violet-500/20 flex-shrink-0">
          <Plus className="w-4 h-4" />新建代码
        </button>
      </header>

      {/* ─── Main 3-Column ─── */}
      <main className="flex-1 flex min-h-0 overflow-hidden z-10">

        {/* ─── Col 1: Feature List ─── */}
        <aside className="w-48 flex-shrink-0 border-r border-white/5 bg-[#0A0C14]/60 flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            功能模块
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
            {features.map(([name, count]) => (
              <button key={name}
                onClick={() => setSelectedFeature(name)}
                className={`group w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  selectedFeature === name
                    ? 'bg-violet-500/15 text-violet-300'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}>
                <FolderCode className={`w-4 h-4 flex-shrink-0 ${selectedFeature === name ? 'text-violet-400' : 'text-slate-500'}`} />
                <span className="truncate flex-1 text-left">{name}</span>
                <span className="text-[10px] opacity-50 flex-shrink-0">{count}</span>
              </button>
            ))}
            {features.length === 0 && (
              <div className="text-center text-slate-600 text-xs py-10">暂无功能模块</div>
            )}
          </div>
        </aside>

        {/* ─── Col 2: Snippet List ─── */}
        <section className="w-72 flex-shrink-0 border-r border-white/5 bg-[#0B0D15]/50 flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium truncate">{selectedFeature || '—'}</span>
            <span className="text-[10px] text-slate-600">{featureSnippets.length} 个文件</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {featureSnippets.map(snippet => {
              const lc = getLang(snippet.language);
              const isActive = selectedId === snippet.id;
              return (
                <div key={snippet.id}
                  onClick={() => setSelectedId(snippet.id)}
                  className={`group relative px-3 py-3.5 border-b border-white/[0.03] cursor-pointer transition-all ${
                    isActive ? 'bg-violet-500/10' : 'hover:bg-white/[0.02]'
                  }`}>
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-violet-500" />}
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileCode2 className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                    <h3 className={`text-sm font-medium truncate flex-1 ${isActive ? 'text-slate-100' : 'text-slate-300'}`}>{snippet.title}</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mb-2 pl-6">{snippet.description || '暂无描述'}</p>
                  <div className="flex items-center gap-2 pl-6">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase tracking-wider ${lc.badge}`}>
                      {lc.label}
                    </span>
                    <span className="text-[10px] text-slate-600 ml-auto">{formatDate(snippet.UpdatedAt).split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
            {featureSnippets.length === 0 && selectedFeature && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <FileCode2 className="w-10 h-10 mb-3 opacity-15" />
                <p className="text-xs">该功能下暂无代码</p>
              </div>
            )}
            {!selectedFeature && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <FolderCode className="w-10 h-10 mb-3 opacity-15" />
                <p className="text-xs">请先选择一个功能</p>
              </div>
            )}
          </div>
        </section>

        {/* ─── Col 3: Code Detail ─── */}
        <section className="flex-1 flex flex-col overflow-hidden bg-[#0A0C14]/20">
          {selectedSnippet ? (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div ref={detailHeaderRef} className="px-6 py-4 border-b border-white/5 bg-[#0D0F18]/50 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                      <FolderCode className="w-3 h-3 text-violet-400" />
                      <span>{selectedSnippet.feature}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span className={getLang(selectedSnippet.language).badge.split(' ')[0]}>{selectedSnippet.title}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border font-mono uppercase tracking-wider flex-shrink-0 ${getLang(selectedSnippet.language).badge}`}>
                        {getLang(selectedSnippet.language).label}
                      </span>
                      <input type="text" value={selectedSnippet.title}
                        onChange={e => autoSave(selectedSnippet.id, 'title', e.target.value)}
                        className="text-xl font-bold text-slate-100 bg-transparent outline-none border-b border-transparent hover:border-white/10 focus:border-violet-500/50 transition-colors flex-1 min-w-0"
                        placeholder="文件名" />
                    </div>
                    <input type="text" value={selectedSnippet.description}
                      onChange={e => autoSave(selectedSnippet.id, 'description', e.target.value)}
                      className="text-sm text-slate-400 bg-transparent outline-none w-full leading-relaxed border-b border-transparent hover:border-white/10 focus:border-violet-500/30 transition-colors"
                      placeholder="添加描述..." />
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{formatDate(selectedSnippet.UpdatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <SaveStatusIndicator status={saveStatus} />
                    <button onClick={() => openForm(selectedSnippet)} title="编辑"
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirmId(selectedSnippet.id)} title="删除"
                      className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleCopy(selectedSnippet.code)} title="复制代码"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                        copied ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                      }`}>
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? '已复制' : '复制'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 p-4 pt-2">
                <div className="rounded-xl bg-[#1a1b26] border border-white/5 overflow-hidden"
                  style={{ height: `calc(100vh - ${64 + detailHeaderH + 24}px)` }}>
                  <Editor height="100%"
                    language={getLang(selectedSnippet.language).monaco}
                    value={selectedSnippet.code}
                    onChange={v => autoSave(selectedSnippet.id, 'code', v || '')}
                    theme="vs-dark"
                    options={{
                      fontSize: 13, fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
                      minimap: { enabled: false }, scrollBeyondLastLine: true,
                      lineNumbersMinChars: 3, padding: { top: 12, bottom: 12 },
                      renderLineHighlight: 'line', lineHeight: 22, tabSize: 2,
                      automaticLayout: true, wordWrap: 'on',
                      scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                      overviewRulerBorder: false, hideCursorInOverviewRuler: true, contextmenu: false,
                    }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Braces className="w-14 h-14 mb-4 opacity-10" />
              <p className="text-sm mb-1">选择一个代码片段查看</p>
              <p className="text-xs text-slate-600">或点击「新建代码」创建</p>
            </div>
          )}
        </section>
      </main>

      {/* ─── Form Modal ─── */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl bg-[#12141D] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col pointer-events-auto">
              {/* Fixed Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
                <h2 className="text-lg font-bold text-white">{editSnippet ? '编辑代码片段' : '新建代码片段'}</h2>
                <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-all"><X className="w-5 h-5" /></button>
              </div>
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto scrollbar-thin px-6">
              <div className="space-y-4">
                {/* 功能名称 */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">功能模块 *</label>
                  <div className="flex gap-2">
                    <select value={formFeature} onChange={e => { setFormFeature(e.target.value); setFormNewFeature(''); }}
                      className="flex-1 bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 cursor-pointer">
                      <option value="" className="bg-[#1a1d2e] text-slate-400">— 选择已有功能 —</option>
                      {features.map(([name]) => <option key={name} value={name} className="bg-[#1a1d2e] text-slate-200">{name}</option>)}
                    </select>
                    <input type="text" value={formNewFeature}
                      onChange={e => { setFormNewFeature(e.target.value); if (e.target.value) setFormFeature(''); }}
                      className="flex-1 bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
                      placeholder="或输入新功能名" />
                  </div>
                </div>
                {/* 语言 */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">语言 *</label>
                  <select value={formLang} onChange={e => setFormLang(e.target.value)}
                    className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 cursor-pointer">
                    {Object.entries(LANGUAGES).map(([k, v]) => <option key={k} value={k} className="bg-[#1a1d2e] text-slate-200">{v.label}</option>)}
                  </select>
                </div>
                {/* 标题 & 描述 */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">标题 *</label>
                  <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)}
                    className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
                    placeholder="如：GlobalExceptionHandler.java" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">描述</label>
                  <input type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)}
                    className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
                    placeholder="简要描述这段代码的用途" />
                </div>
                {/* 代码 */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">代码</label>
                  <div className="rounded-xl bg-[#1a1b26] border border-white/10 overflow-hidden">
                    <Editor height="250px"
                      language={getLang(formLang).monaco}
                      value={formCode} onChange={v => setFormCode(v || '')} theme="vs-dark"
                      options={{
                        fontSize: 13, fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
                        minimap: { enabled: false }, scrollBeyondLastLine: false,
                        lineNumbersMinChars: 3, padding: { top: 12, bottom: 12 },
                        automaticLayout: true, tabSize: 2, wordWrap: 'on',
                      }} />
                  </div>
                </div>
              </div>
              </div>
              {/* Fixed Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/5 flex-shrink-0">
                <button onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5">取消</button>
                <button onClick={handleSubmit} disabled={!formTitle.trim() || (!formFeature && !formNewFeature.trim())}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:opacity-90 disabled:opacity-40 shadow-lg shadow-violet-500/20">
                  {editSnippet ? '保存修改' : '创建代码'}
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
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-red-500/10"><Trash2 className="w-5 h-5 text-red-400" /></div>
                <h3 className="text-lg font-bold text-slate-100">确认删除</h3>
              </div>
              <p className="text-sm text-slate-400 mb-6">删除后无法恢复，确定要删除这个代码片段吗？</p>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5">取消</button>
                <button onClick={confirmDelete} className="px-5 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20">确认删除</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
