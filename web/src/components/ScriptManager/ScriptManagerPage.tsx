import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor, { loader } from '@monaco-editor/react';
import {
  ArrowLeft, Terminal, Search, Plus, Copy, Edit2, Trash2, Clock,
  Check, Hash, X, Code2, ChevronRight, Tag, Filter, Settings2,
  FileCode, Play, CloudOff, Loader2
} from 'lucide-react';
import { createScript, updateScript, deleteScript, getScriptList } from '@/api/script';

// ─── Types ───────────────────────────
interface ScriptData {
  id: number;
  title: string;
  description: string;
  language: string;
  code: string;
  tags: string[];
  updatedAt: string;
}

const LANG_COLORS: Record<string, { badge: string; dot: string }> = {
  bash:       { badge: 'text-green-400 bg-green-400/10 border-green-400/20', dot: 'bg-green-400' },
  python:     { badge: 'text-blue-400 bg-blue-400/10 border-blue-400/20', dot: 'bg-blue-400' },
  go:         { badge: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20', dot: 'bg-cyan-400' },
  javascript: { badge: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', dot: 'bg-yellow-400' },
  sql:        { badge: 'text-orange-400 bg-orange-400/10 border-orange-400/20', dot: 'bg-orange-400' },
  shell:      { badge: 'text-green-400 bg-green-400/10 border-green-400/20', dot: 'bg-green-400' },
};
const defaultLang = { badge: 'text-slate-400 bg-slate-400/10 border-slate-400/20', dot: 'bg-slate-400' };

// ─── Monaco language mapping ─────────
const MONACO_LANG: Record<string, string> = {
  bash: 'shell', shell: 'shell', python: 'python',
  go: 'go', javascript: 'javascript', sql: 'sql',
};

type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;

  const config = {
    unsaved: {
      icon: <CloudOff size={14} />,
      text: '未保存',
      className: 'text-slate-400 border-transparent bg-transparent',
    },
    saving: {
      icon: <Loader2 size={14} className="animate-spin" />,
      text: '保存中',
      className: 'text-teal-500 border-teal-500/20 bg-teal-500/10',
    },
    saved: {
      icon: <Check size={14} />,
      text: '已保存',
      className: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10',
    },
  }[status];

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all duration-300 select-none ${config.className}`}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}


// ─── Component ───────────────────────
export default function ScriptManagerPage() {
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<ScriptData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [activeLang, setActiveLang] = useState('All');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Tag management
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTagText, setNewTagText] = useState('');

  // Copy
  const [copied, setCopied] = useState(false);

  // Delete
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Save status states
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const savedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ScriptData>>({ title: '', description: '', language: 'bash', code: '', tags: [] });
  const [formTags, setFormTags] = useState<string[]>([]);

  // Mobile detail panel
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Load
  const fetchScripts = async () => {
    try {
      const res = await getScriptList({ page: 1, pageSize: 9999 }) as any;
      if (res.code === 0) {
        const fetchedScripts = res.data.list.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          language: item.language,
          code: item.code,
          tags: item.tags || [],
          updatedAt: item.UpdatedAt ? (item.UpdatedAt.split('T')[0] + ' ' + item.UpdatedAt.split('T')[1].substring(0, 5)) : ''
        }));
        setScripts(fetchedScripts);
        
        // Extract categories
        const allTags = Array.from(new Set(fetchedScripts.flatMap((s: any) => s.tags))) as string[];
        setCategories(allTags);
        
        // Auto-select first if none selected
        if (fetchedScripts.length > 0) {
           setSelectedId(current => {
             if (!current || !fetchedScripts.some((s: any) => s.id === current)) {
               return fetchedScripts[0].id;
             }
             return current;
           });
        }
      }
    } catch (err) {
      console.error('Failed to fetch scripts:', err);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  // Selected script
  const selectedScript = useMemo(() => scripts.find(s => s.id === selectedId) || null, [scripts, selectedId]);

  // Filter
  const filtered = useMemo(() => {
    return scripts.filter(s => {
      const matchTag = activeTag === 'All' || s.tags.includes(activeTag);
      const matchLang = activeLang === 'All' || s.language === activeLang;
      if (!searchQuery.trim()) return matchTag && matchLang;
      const q = searchQuery.toLowerCase();
      return matchTag && matchLang && (
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [scripts, activeTag, activeLang, searchQuery]);

  // Auto-select first item in filtered list if current selection is invalid
  useEffect(() => {
    if (filtered.length > 0) {
      const isSelectedValid = filtered.some(s => s.id === selectedId);
      if (!isSelectedValid) {
        setSelectedId(filtered[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  // Available Languages
  const availableLangs = useMemo(() => {
    const map = new Map<string, number>();
    scripts.forEach(s => map.set(s.language, (map.get(s.language) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [scripts]);



  // Reset save status when selecting different script
  useEffect(() => {
    if (savedResetTimer.current) {
      clearTimeout(savedResetTimer.current);
      savedResetTimer.current = null;
    }
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    setSaveStatus('idle');
  }, [selectedId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
    };
  }, []);

  // Auto-save: update a field on the selected script
  const autoSave = useCallback((id: number, field: keyof ScriptData, value: string | string[]) => {
    setScripts(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

    setSaveStatus('unsaved');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      setSaveStatus('saving');
      
      setScripts(currentScripts => {
        const scriptToSave = currentScripts.find(s => s.id === id);
        if (scriptToSave) {
          updateScript({
            id: scriptToSave.id,
            title: scriptToSave.title,
            description: scriptToSave.description,
            language: scriptToSave.language,
            code: scriptToSave.code,
            tags: scriptToSave.tags
          }).then(() => {
            setSaveStatus('saved');
            if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
            savedResetTimer.current = setTimeout(() => {
              setSaveStatus('idle');
              savedResetTimer.current = null;
            }, 2000);
          }).catch((err: any) => {
             console.error(err);
             setSaveStatus('unsaved');
          });
        }
        return currentScripts;
      });
    }, 1000); // 1000ms debounce
  }, []);

  // Handlers
  const handleCopy = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setMobileDetailOpen(true);
  };

  const openForm = (script?: ScriptData) => {
    if (script) {
      setFormData({ ...script });
      setFormTags([...script.tags]);
    } else {
      setFormData({ title: '', description: '', language: 'bash', code: '', tags: [] });
      setFormTags([]);
    }
    setIsFormOpen(true);
  };

  const handleFormSave = async () => {
    const title = formData.title?.trim();
    const code = formData.code?.trim();
    if (!title || !code) return;

    const tags = formTags;

    const payload = {
      title,
      description: formData.description?.trim() || '',
      language: formData.language || 'bash',
      code,
      tags
    };

    try {
      if (formData.id) {
        // Edit
        await updateScript({ ...payload, id: formData.id });
      } else {
        // Create
        await createScript(payload);
      }
      setIsFormOpen(false);
      fetchScripts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteScript({ id: deleteConfirmId });
      setDeleteConfirmId(null);
      if (selectedId === deleteConfirmId) {
        setSelectedId(null);
      }
      fetchScripts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTag = () => {
    const tag = newTagText.trim();
    if (tag && !categories.includes(tag)) {
      setCategories(prev => [...prev, tag]);
      setNewTagText('');
    }
  };

  const handleDeleteTag = (tag: string) => {
    setCategories(prev => prev.filter(c => c !== tag));
    if (activeTag === tag) setActiveTag('All');
  };

  const langColor = (lang: string) => LANG_COLORS[lang.toLowerCase()] || defaultLang;

  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 right-1/4 w-[50%] h-[350px] bg-teal-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* ─── Header ─── */}
      <header className="h-14 sm:h-16 border-b border-white/5 bg-[#0F111A]/80 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 z-20 backdrop-blur-xl gap-3">
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-xl bg-teal-500/10 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400 leading-tight">
                脚本管理
              </h1>
              <p className="text-[11px] text-slate-500 leading-tight">
                共 {scripts.length} 个脚本
                {availableLangs.length > 0 && ` · ${availableLangs.map(([l, c]) => `${l} ${c}`).join(' / ')}`}
              </p>
            </div>
            <h1 className="sm:hidden text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400">
              脚本管理
            </h1>
          </div>
        </div>

        <div className="flex-1 flex justify-center max-w-lg mx-3">
          <div className="flex items-center gap-2 w-full">
            <select
              value={activeLang}
              onChange={e => setActiveLang(e.target.value)}
              className="bg-[#151926]/90 border border-white/10 focus:border-teal-500/50 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none transition-all appearance-none cursor-pointer w-[110px] flex-shrink-0"
              title="按语言筛选"
            >
              <option value="All">全部语言</option>
              {availableLangs.map(l => (
                <option key={l[0]} value={l[0]}>{l[0].toUpperCase()}</option>
              ))}
            </select>
            <div className="relative group flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索脚本..."
                className="pl-10 pr-4 py-2 w-full bg-[#151926]/90 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 transition-all placeholder-slate-500 text-slate-200" />
            </div>
          </div>
        </div>

        <button onClick={() => openForm()}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-medium hover:opacity-90 transition-opacity text-sm shadow-lg shadow-teal-500/20 flex-shrink-0">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">新建脚本</span>
        </button>
      </header>

      {/* ─── Main: Left sidebar + Script list + Detail pane ─── */}
      <main className="flex-1 flex overflow-hidden z-10">

        {/* Left Sidebar: Filters */}
        <aside className="hidden lg:flex w-48 border-r border-white/5 bg-[#0F111A]/50 flex-col flex-shrink-0">
          <div className="flex-1 overflow-y-auto scrollbar-thin py-4 space-y-6">

            {/* Tag Filter */}
            <div className="px-2">
              <div className="px-3 flex items-center justify-between text-[11px] font-bold text-slate-500 tracking-wider mb-2">
                <span>标签 TAGS</span>
                <button onClick={() => setIsEditingTags(!isEditingTags)}
                  className={`p-1 rounded transition-colors ${isEditingTags ? 'bg-teal-500/20 text-teal-400' : 'hover:bg-white/10 hover:text-white text-slate-500'}`}>
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {isEditingTags && (
                <div className="mx-2 mb-2 flex items-center gap-1 bg-black/40 border border-white/5 rounded-lg px-2 py-1">
                  <input type="text" value={newTagText} onChange={e => setNewTagText(e.target.value)}
                    placeholder="新标签" onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                    className="flex-1 bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 min-w-0" />
                  <button onClick={handleAddTag} className="p-1 hover:bg-white/10 rounded text-slate-400 flex-shrink-0">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="space-y-0.5">
                {['All', ...categories].map(tag => {
                  const count = tag === 'All'
                    ? scripts.filter(s => activeLang === 'All' || s.language === activeLang).length
                    : scripts.filter(s => s.tags.includes(tag) && (activeLang === 'All' || s.language === activeLang)).length;
                  
                  return (
                    <button key={tag} onClick={() => !isEditingTags && setActiveTag(tag)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                        activeTag === tag && !isEditingTags ? 'bg-teal-500/15 text-teal-400 border border-teal-500/25' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                      }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{tag === 'All' ? '全部' : tag}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded-full">{count}</span>
                        {isEditingTags && tag !== 'All' && (
                          <span onClick={e => { e.stopPropagation(); handleDeleteTag(tag); }}
                            className="p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 text-slate-500 cursor-pointer">
                            <X className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </aside>

        {/* Center: Script List */}
        <section className="w-full lg:w-[340px] xl:w-[380px] border-r border-white/5 flex flex-col flex-shrink-0 bg-[#0A0C14]/40">
          {/* List Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#0F111A]/30">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-400">
                {activeTag === 'All' ? '全部脚本' : activeTag}
              </span>
              <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>
          </div>

          {/* Script Items */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <AnimatePresence mode="popLayout">
              {filtered.map((script, i) => {
                const lc = langColor(script.language);
                const isActive = selectedId === script.id;
                return (
                  <motion.div key={script.id} layout
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => handleSelect(script.id)}
                    className={`group px-4 py-3.5 border-b border-white/[0.03] cursor-pointer transition-all relative
                      ${isActive ? 'bg-teal-500/[0.06]' : 'hover:bg-white/[0.02]'}`}
                  >
                    {/* Active indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-[2px] transition-all ${isActive ? 'bg-teal-400' : 'bg-transparent group-hover:bg-teal-400/30'}`} />

                    <div className="flex items-start gap-3">
                      {/* Lang dot */}
                      <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${lc.dot} shadow-sm`}
                        title={script.language} />

                      <div className="min-w-0 flex-1">
                        {/* Title */}
                        <h3 className={`font-semibold text-sm mb-1 truncate transition-colors ${isActive ? 'text-teal-400' : 'text-slate-200 group-hover:text-white'}`}>
                          {script.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-slate-500 line-clamp-1 mb-2 leading-relaxed">
                          {script.description || '暂无描述'}
                        </p>

                        {/* Meta row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase tracking-wider ${lc.badge}`}>
                            {script.language}
                          </span>
                          <span className="text-[10px] text-slate-600 ml-auto flex items-center gap-1 flex-shrink-0">
                            <Clock className="w-3 h-3" />{script.updatedAt.split(' ')[0]}
                          </span>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteConfirmId(script.id); }}
                        title="删除"
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/15 text-slate-600 hover:text-red-400 transition-all flex-shrink-0 mt-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Terminal className="w-10 h-10 mb-3 opacity-15" />
                <p className="text-sm mb-1">暂无匹配的脚本</p>
                <p className="text-[11px] text-slate-600">尝试更换关键词或标签</p>
              </div>
            )}
          </div>
        </section>

        {/* Right: Detail Panel (desktop) — inline editable with auto-save */}
        <section className="hidden lg:flex flex-1 flex-col bg-[#07080C]/50 overflow-hidden">
          {selectedScript ? (
            <>
              {/* Detail Header — editable title, description, language */}
              <div className="px-6 py-4 border-b border-white/5 bg-[#0F111A]/30 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    {/* Editable title */}
                    <div className="flex items-center gap-3 mb-2">
                      <select
                        value={selectedScript.language}
                        onChange={e => autoSave(selectedScript.id, 'language', e.target.value)}
                        className={`text-xs px-2 py-0.5 rounded border font-mono uppercase tracking-wider cursor-pointer outline-none bg-transparent appearance-none ${langColor(selectedScript.language).badge}`}
                      >
                        <option value="bash">BASH</option>
                        <option value="python">PYTHON</option>
                        <option value="go">GO</option>
                        <option value="javascript">JS</option>
                        <option value="sql">SQL</option>
                      </select>
                      <input
                        type="text"
                        value={selectedScript.title}
                        onChange={e => autoSave(selectedScript.id, 'title', e.target.value)}
                        className="text-xl font-bold text-slate-100 bg-transparent outline-none border-b border-transparent hover:border-white/10 focus:border-teal-500/50 transition-colors flex-1 min-w-0"
                        placeholder="脚本标题"
                      />
                    </div>
                    {/* Editable description */}
                    <input
                      type="text"
                      value={selectedScript.description}
                      onChange={e => autoSave(selectedScript.id, 'description', e.target.value)}
                      className="text-sm text-slate-400 bg-transparent outline-none w-full mb-3 leading-relaxed border-b border-transparent hover:border-white/10 focus:border-teal-500/30 transition-colors"
                      placeholder="添加描述..."
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedScript.tags.map(t => (
                        <span key={t} className="flex items-center gap-1 text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          <Hash className="w-3 h-3 text-teal-500/60" />{t}
                        </span>
                      ))}
                      <span className="text-xs text-slate-600 flex items-center gap-1 ml-2">
                        <Clock className="w-3 h-3" />{selectedScript.updatedAt}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <SaveStatusIndicator status={saveStatus} />
                    <button onClick={() => openForm(selectedScript)} title="编辑脚本"
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleCopy(selectedScript.code)} title="复制代码"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                        copied ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                      }`}>
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? '已复制' : '复制代码'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Monaco Code Editor */}
              <div className="flex-1 overflow-hidden p-6 pt-2">
                <div className="relative rounded-xl bg-[#1a1b26] border border-white/5 overflow-hidden h-full">
                  <Editor
                    height="100%"
                    language={MONACO_LANG[selectedScript.language] || 'plaintext'}
                    value={selectedScript.code}
                    onChange={v => autoSave(selectedScript.id, 'code', v || '')}
                    theme="vs-dark"
                    options={{
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      lineNumbersMinChars: 3,
                      padding: { top: 12, bottom: 12 },
                      renderLineHighlight: 'line',
                      lineHeight: 22,
                      tabSize: 2,
                      automaticLayout: true,
                      wordWrap: 'on',
                      scrollbar: {
                        verticalScrollbarSize: 6,
                        horizontalScrollbarSize: 6,
                      },
                      overviewRulerBorder: false,
                      hideCursorInOverviewRuler: true,
                      contextmenu: false,
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Terminal className="w-14 h-14 mb-4 opacity-10" />
              <p className="text-sm mb-1">选择一个脚本查看详情</p>
              <p className="text-xs text-slate-600">或点击「新建脚本」创建</p>
            </div>
          )}
        </section>
      </main>

      {/* ─── Mobile Detail Drawer ─── */}
      <AnimatePresence>
        {mobileDetailOpen && selectedScript && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileDetailOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[85vw] bg-[#0F111A] border-l border-white/10 z-40 flex flex-col shadow-2xl lg:hidden">
              {/* Drawer Header */}
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <select
                    value={selectedScript.language}
                    onChange={e => autoSave(selectedScript.id, 'language', e.target.value)}
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase cursor-pointer outline-none bg-transparent appearance-none ${langColor(selectedScript.language).badge}`}
                  >
                    <option value="bash">BASH</option>
                    <option value="python">PYTHON</option>
                    <option value="go">GO</option>
                    <option value="javascript">JS</option>
                    <option value="sql">SQL</option>
                  </select>
                  <input
                    type="text"
                    value={selectedScript.title}
                    onChange={e => autoSave(selectedScript.id, 'title', e.target.value)}
                    className="text-sm font-bold text-slate-100 bg-transparent outline-none flex-1 min-w-0"
                    placeholder="脚本标题"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => openForm(selectedScript)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleCopy(selectedScript.code)}
                    className={`p-1.5 rounded-lg text-xs transition-all ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'}`}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setMobileDetailOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Body — editable */}
              <div className="flex-1 overflow-auto scrollbar-thin p-4 flex flex-col gap-3">
                <input
                  type="text"
                  value={selectedScript.description}
                  onChange={e => autoSave(selectedScript.id, 'description', e.target.value)}
                  className="text-xs text-slate-400 bg-transparent outline-none w-full leading-relaxed border-b border-transparent focus:border-teal-500/30 transition-colors"
                  placeholder="添加描述..."
                />
                <div className="relative rounded-xl bg-[#1a1b26] border border-white/5 overflow-hidden flex-1">
                  <Editor
                    height="100%"
                    language={MONACO_LANG[selectedScript.language] || 'plaintext'}
                    value={selectedScript.code}
                    onChange={v => autoSave(selectedScript.id, 'code', v || '')}
                    theme="vs-dark"
                    options={{
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      lineNumbersMinChars: 3,
                      padding: { top: 8, bottom: 8 },
                      renderLineHighlight: 'line',
                      lineHeight: 20,
                      tabSize: 2,
                      automaticLayout: true,
                      wordWrap: 'on',
                      scrollbar: {
                        verticalScrollbarSize: 4,
                        horizontalScrollbarSize: 4,
                      },
                      overviewRulerBorder: false,
                      hideCursorInOverviewRuler: true,
                      contextmenu: false,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Form Modal ─── */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsFormOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }} onClick={e => e.stopPropagation()}
              className="bg-[#0E0F15] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
              {/* Form Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#12131A]/30">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Code2 className="w-5 h-5" />
                  </div>
                  {formData.id ? '编辑脚本' : '新建脚本'}
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 overflow-y-auto scrollbar-thin flex flex-col gap-5 max-h-[70vh]">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-400">脚本标题 *</label>
                  <input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="例如：自动备份PostgreSQL数据库"
                    className="w-full bg-[#161821] border border-white/5 focus:border-teal-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-all" />
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 flex-1 relative">
                    <label className="text-xs font-medium text-slate-400">语言</label>
                    <select value={formData.language || 'bash'} onChange={e => setFormData({ ...formData, language: e.target.value })}
                      className="w-full bg-[#161821] border border-white/5 focus:border-teal-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all appearance-none cursor-pointer">
                      <option value="bash">Bash / Shell</option>
                      <option value="python">Python</option>
                      <option value="go">Go</option>
                      <option value="javascript">JavaScript / Node.js</option>
                      <option value="sql">SQL</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 flex-1 relative">
                    <label className="text-xs font-medium text-slate-400">标签 (单选)</label>
                    <select 
                      value={formTags[0] || ''}
                      onChange={e => {
                        if (e.target.value) setFormTags([e.target.value]);
                      }}
                      className="w-full bg-[#161821] border border-white/5 focus:border-teal-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>选择标签...</option>
                      {categories.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                      {formTags[0] && !categories.includes(formTags[0]) && (
                        <option value={formTags[0]}>{formTags[0]}</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-400">描述</label>
                  <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="简要描述脚本的用途..." rows={2}
                    className="w-full bg-[#161821] border border-white/5 focus:border-teal-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-all resize-none" />
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-xs font-medium text-slate-400">代码 *</label>
                  <textarea value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })}
                    placeholder="# 输入或粘贴你的代码..." rows={14}
                    className="w-full bg-[#07080C] border border-white/10 focus:border-teal-500/50 rounded-xl px-4 py-4 text-sm font-mono text-slate-300 placeholder:text-slate-700 outline-none transition-all resize-none scrollbar-thin" />
                </div>
              </div>

              {/* Form Footer */}
              <div className="px-6 py-4 border-t border-white/5 bg-[#12131A]/50 flex justify-end gap-3">
                <button onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-sm transition-all">
                  取消
                </button>
                <button onClick={handleFormSave}
                  disabled={!formData.title?.trim() || !formData.code?.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-medium text-sm hover:opacity-90 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Check className="w-4 h-4" />{formData.id ? '保存修改' : '确认新建'}
                </button>
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
              onClick={() => setDeleteConfirmId(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-red-500/10"><Trash2 className="w-5 h-5 text-red-400" /></div>
                <h3 className="text-lg font-bold text-slate-100">确认删除</h3>
              </div>
              <p className="text-sm text-slate-400 mb-6">删除后无法恢复，确定要删除这个脚本吗？</p>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">取消</button>
                <button onClick={handleDelete} className="px-5 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20">确认删除</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
