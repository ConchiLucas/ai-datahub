import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import {
  ArrowLeft, Search, Plus, X, Copy, Check, Trash2, Clock, Star,
  Code2, ChevronDown, Edit3, TerminalSquare, CheckCircle2, Server
} from 'lucide-react';

import { createTaSkill, updateTaSkill, toggleSkillStar, deleteTaSkill, getTaSkillList } from '@/api/skill';

// ─── Types ───────────────────────────
type SkillLang = 'go' | 'typescript' | 'python' | 'java' | 'shell' | 'sql' | string;

interface CodeSkill {
  id?: number;
  id?: number;
  title: string;
  description: string;
  code: string;
  language: SkillLang;
  service: string;
  starred: boolean;
  CreatedAt?: string;
  UpdatedAt?: string;
}

// ─── Lang Config ─────────────────────
const LANG_CFG: Record<SkillLang, { label: string; color: string; accent: string; monaco: string }> = {
  go:         { label: 'Go',         color: 'text-cyan-400',    accent: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',       monaco: 'go' },
  typescript: { label: 'TypeScript', color: 'text-blue-400',    accent: 'bg-blue-500/10 border-blue-500/20 text-blue-400',       monaco: 'typescript' },
  python:     { label: 'Python',     color: 'text-yellow-400',  accent: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400', monaco: 'python' },
  java:       { label: 'Java',       color: 'text-orange-400',  accent: 'bg-orange-500/10 border-orange-500/20 text-orange-400', monaco: 'java' },
  shell:      { label: 'Shell',      color: 'text-emerald-400', accent: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',monaco: 'shell' },
  sql:        { label: 'SQL',        color: 'text-violet-400',  accent: 'bg-violet-500/10 border-violet-500/20 text-violet-400', monaco: 'sql' },
};

// ─── Helpers ─────────────────────────
function nowStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function SkillManagerPage() {
  const navigate = useNavigate();

  const [skills, setSkills] = useState<CodeSkill[]>([]);
  const [activeService, setActiveService] = useState<string>('all');
  const [filterLang, setFilterLang] = useState<SkillLang | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawer & Selection
  const [selectedSkill, setSelectedSkill] = useState<CodeSkill | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerCodeState, setDrawerCodeState] = useState('');

  // Creation & Editing Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLang, setFormLang] = useState<SkillLang>('go');
  const [formService, setFormService] = useState('');
  const [formNewService, setFormNewService] = useState('');

  // Delete Confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Init Data fetch
  const fetchData = useCallback(async () => {
    try {
      const res = await getTaSkillList({ page: 1, pageSize: 999 });
      if (res && res.data && res.data.list) {
        setSkills(res.data.list.map((s: any) => ({ ...s, id: s.id || s.id })));
      }
    } catch (err) {}
  }, []);

  useEffect(() => { fetchData() }, [fetchData]);

  // Derived Services List
  const services = useMemo(() => {
    const counts: Record<string, number> = {};
    skills.forEach(s => {
      const srv = s.service || '未归类服务';
      counts[srv] = (counts[srv] || 0) + 1;
    });
    // sort alphabetically
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [skills]);

  // Derived filtered skills
  const filteredSkills = useMemo(() => {
    let list = skills;
    if (activeService !== 'all') {
      list = list.filter(s => (s.service || '未归类服务') === activeService);
    }
    if (filterLang !== 'all') {
      list = list.filter(s => s.language === filterLang);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        s => s.title.toLowerCase().includes(q) || 
             s.description.toLowerCase().includes(q) ||
             (s.service || '').toLowerCase().includes(q)
      );
    }
    // Starred first, then latest updated
    return list.sort((a, b) => {
      if (a.starred !== b.starred) return a.starred ? -1 : 1;
      const tA = a.UpdatedAt || a.CreatedAt || '';
      const tB = b.UpdatedAt || b.CreatedAt || '';
      return tB.localeCompare(tA);
    });
  }, [skills, activeService, filterLang, searchQuery]);


  // Actions
  // Actions
  const handleCopy = useCallback((text: string, id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const toggleStar = useCallback(async (id: number, currentStarred: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await toggleSkillStar({ id, starred: !currentStarred });
      setSkills(prev => prev.map(s => s.id === id ? { ...s, starred: !s.starred } : s));
    } catch {}
  }, []);

  const handleDelete = useCallback((id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteConfirmId(id);
  }, []);

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        await deleteTaSkill({ id: deleteConfirmId });
        fetchData();
        if (selectedSkill?.id === deleteConfirmId) {
          setIsDrawerOpen(false);
          setSelectedSkill(null);
        }
        setDeleteConfirmId(null);
      } catch {}
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormDesc('');
    setFormCode('');
    setFormLang('go');
    setFormService(activeService !== 'all' ? activeService : (services.length > 0 ? services[0][0] : ''));
    setFormNewService('');
    setIsModalOpen(true);
  };

  const openEditModal = (skill: CodeSkill, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(skill.id || null);
    setFormTitle(skill.title);
    setFormDesc(skill.description || '');
    setFormCode(skill.code || '');
    setFormLang(skill.language as SkillLang);
    setFormService(skill.service);
    setFormNewService('');
    setIsModalOpen(true);
  };

  const saveSkill = async () => {
    if (!formTitle.trim()) return;
    const finalService = formNewService.trim() || formService || '未命名服务';
    try {
      if (editingId) {
        await updateTaSkill({
          id: editingId,
          title: formTitle.trim(),
          description: formDesc.trim(),
          code: formCode,
          language: formLang,
          service: finalService,
        });
      } else {
        await createTaSkill({
          title: formTitle.trim(),
          description: formDesc.trim(),
          code: formCode,
          language: formLang,
          service: finalService,
        });
      }
      fetchData();
      setIsModalOpen(false);
    } catch {}
  };

  // Drawer
  const handleCardClick = (skill: CodeSkill) => {
    setSelectedSkill(skill);
    setDrawerCodeState(skill.code);
    setIsDrawerOpen(true);
  };

  const closeDrawer = async () => {
    if (selectedSkill && drawerCodeState !== selectedSkill.code && selectedSkill.id) {
      try {
        await updateTaSkill({ ...selectedSkill, id: selectedSkill.id, code: drawerCodeState });
        fetchData();
      } catch {}
    }
    setIsDrawerOpen(false);
    setTimeout(() => { setSelectedSkill(null); }, 300);
  };

  useEffect(() => {
    if (selectedSkill && isDrawerOpen) {
      const active = skills.find(s => s.id === selectedSkill.id);
      if (active) setSelectedSkill(active);
    }
  }, [skills, isDrawerOpen]);


  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans overflow-hidden relative">
      <div className="absolute top-0 right-1/4 w-[50%] h-[350px] bg-emerald-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* ─── Header ─── */}
      <header className="h-16 border-b border-white/5 bg-[#0A0C14]/80 flex-shrink-0 flex items-center justify-between px-6 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl transition-all bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
              <TerminalSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">代码 Skill</h1>
              <p className="text-[10px] text-slate-500 -mt-0.5">{skills.length} 个技能片段</p>
            </div>
          </div>
        </div>

        {/* Search & Lang Filter */}
        <div className="flex-1 flex justify-center max-w-2xl mx-4 gap-2">
          {/* Language Dropdown Filter */}
          <div className="relative flex-shrink-0 w-36">
            <select value={filterLang} onChange={e => setFilterLang(e.target.value as SkillLang | 'all')}
              className="w-full pl-3 pr-8 py-2 bg-[#151926]/90 border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-emerald-500/50 appearance-none cursor-pointer transition-all">
              <option value="all">全部语言</option>
              {(Object.entries(LANG_CFG) as [SkillLang, typeof LANG_CFG[SkillLang]][]).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索技能库..."
              className="pl-10 pr-4 py-2 w-full bg-[#151926]/90 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder-slate-500 text-slate-200" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <button onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 flex-shrink-0">
          <Plus className="w-4 h-4" />
          <span>新建 Skill</span>
        </button>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex overflow-hidden z-10 w-full relative">
        {/* Left Sidebar - Service Categories */}
        <aside className="w-52 border-r border-white/5 bg-[#0F111A]/50 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-2 text-slate-400 text-sm">
               <Server className="w-4 h-4" />
               <span>服务分类</span>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {/* All Category */}
            <button onClick={() => setActiveService('all')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm mb-1 transition-all ${
                activeService === 'all'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
              }`}>
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                <span>全部服务</span>
              </div>
              <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full">{skills.length}</span>
            </button>
            
            {/* Service Categories */}
            {services.map(([serviceName, count]) => (
                <button key={serviceName} onClick={() => setActiveService(serviceName)}
                  className={`group w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm mb-1 transition-all ${
                    activeService === serviceName
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                  }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${activeService === serviceName ? 'bg-emerald-400' : 'bg-slate-600 group-hover:bg-slate-400'} flex-shrink-0 transition-colors`} />
                  <span className="truncate flex-1 text-left">{serviceName}</span>
                  <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full flex-shrink-0">{count}</span>
                </button>
            ))}
          </div>
        </aside>

        {/* Center Card Grid */}
        <section className="flex-1 overflow-y-auto px-6 py-6 border-l border-transparent custom-scrollbar flex flex-col bg-[#07080C]/30 relative">
          <div className="flex items-center gap-2 mb-4">
             <span className="text-sm text-slate-400">{activeService === 'all' ? '全部代码 Skill' : activeService}</span>
             {filterLang !== 'all' && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-sm text-slate-400">仅看 {LANG_CFG[filterLang].label}</span>
                </>
             )}
             <span className="bg-white/5 px-2 py-0.5 rounded-full text-xs text-slate-500">{filteredSkills.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
            <AnimatePresence mode="popLayout">
              {filteredSkills.map((skill, index) => {
                const cfg = LANG_CFG[skill.language] || LANG_CFG.go;
                return (
                  <motion.div key={skill.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                    className="group relative rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-white/10 transition-all hover:shadow-lg hover:-translate-y-0.5 flex flex-col cursor-pointer"
                    onClick={() => handleCardClick(skill)}>
                    
                    {/* Header */}
                    <div className="flex items-start justify-between px-5 pt-4 pb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border font-mono uppercase tracking-wider ${cfg.accent}`}>
                        {cfg.label}
                      </span>
                      <button onClick={(e) => toggleStar(skill.id!, skill.starred, e)} className="p-1 -mr-2 -mt-1 transition-all">
                        {skill.starred ? <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> : <Star className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-amber-400 transition-all" />}
                      </button>
                    </div>

                    {/* Body */}
                    <div className="px-5 pb-3 flex-1 flex flex-col">
                      <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors mb-2 line-clamp-2">
                        {skill.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">
                        {skill.description || '暂无描述'}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.03] bg-black/10 mt-auto">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3" /> {(skill.UpdatedAt || skill.CreatedAt || '').split('T')[0]}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => handleCopy(skill.code, skill.id!, e)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-all" title="复制代码">
                           {copiedId === skill.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={(e) => openEditModal(skill, e)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 transition-all" title="修改">
                           <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => handleDelete(skill.id!, e)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all" title="删除">
                           <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          
          {filteredSkills.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 flex-1">
               <TerminalSquare className="w-12 h-12 mb-4 opacity-20" />
               <p className="text-sm">暂无符合条件的技能代码</p>
               <p className="text-xs text-slate-600 mt-1">尝试切换左侧服务或顶部的语言</p>
            </div>
          )}
        </section>
      </main>

      {/* ─── Detail Drawer (Right Pop-out) ─── */}
      <AnimatePresence>
        {isDrawerOpen && selectedSkill && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeDrawer} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[55vw] max-w-[800px] min-w-[500px] bg-[#0A0C14] border-l border-white/10 z-40 flex flex-col shadow-2xl">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0F111A]">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-mono uppercase tracking-wider ${(LANG_CFG[selectedSkill.language] || LANG_CFG.go).accent}`}>
                    {(LANG_CFG[selectedSkill.language] || LANG_CFG.go).label}
                  </span>
                  <span className="text-sm font-medium text-slate-300">Skill 详情与编辑</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleStar(selectedSkill.id!, selectedSkill.starred)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    {selectedSkill.starred ? <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> : <Star className="w-4 h-4 text-slate-400" />}
                  </button>
                  <button onClick={() => handleCopy(drawerCodeState, selectedSkill.id!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors text-xs">
                    {copiedId === selectedSkill.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedId === selectedSkill.id ? '已复制' : '复制代码'}
                  </button>
                  <button onClick={() => handleDelete(selectedSkill.id!)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={closeDrawer} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Editable Meta Info */}
              <div className="p-6 border-b border-white/5 bg-[#0A0C14] flex-shrink-0">
                 <input type="text"
                   value={selectedSkill.title}
                   onChange={e => setSkills(prev => prev.map(s => s.id === selectedSkill.id ? { ...s, title: e.target.value } : s))}
                   className="w-full text-lg font-bold text-slate-200 bg-transparent outline-none border-b border-transparent hover:border-white/10 focus:border-emerald-500/50 transition-colors mb-2"
                   placeholder="输入标题..." />
                 <input type="text"
                   value={selectedSkill.description}
                   onChange={e => setSkills(prev => prev.map(s => s.id === selectedSkill.id ? { ...s, description: e.target.value } : s))}
                   className="w-full text-sm text-slate-400 bg-transparent outline-none border-b border-transparent hover:border-white/10 focus:border-emerald-500/50 transition-colors"
                   placeholder="添加描述说明..." />
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 bg-[#0A0C14] p-4 relative overflow-hidden">
                <div className="absolute top-0 right-4 px-3 py-1 bg-black/40 text-[10px] text-slate-500 rounded-b-lg border-x border-b border-white/5 z-10 flex items-center gap-1">
                  <Edit3 className="w-3 h-3" />代码实时自动保存
                </div>
                <div className="w-full h-full rounded-xl border border-white/5 overflow-hidden bg-[#1a1b26]">
                  <Editor
                     height="100%"
                     theme="vs-dark"
                     language={(LANG_CFG[selectedSkill.language] || LANG_CFG.go).monaco}
                     value={drawerCodeState}
                     onChange={v => {
                       setDrawerCodeState(v || '');
                       setSkills(prev => prev.map(s => s.id === selectedSkill.id ? { ...s, code: v || '' } : s));
                     }}
                     options={{
                       fontSize: 13, fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
                       minimap: { enabled: false }, scrollBeyondLastLine: false,
                       lineNumbersMinChars: 3, padding: { top: 16, bottom: 16 },
                       automaticLayout: true, tabSize: 2, wordWrap: 'on',
                     }}
                  />
                </div>
              </div>
              
              {/* Drawer Footer Status */}
              <div className="px-6 py-3 border-t border-white/5 bg-[#0F111A] text-[10px] text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />更新于 {(selectedSkill.UpdatedAt || selectedSkill.CreatedAt || '').split('T')[0]}</span>
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <CheckCircle2 className="w-3 h-3" />
                  已同步
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Create Modal ─── */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-2xl bg-[#0F111A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shadow-sm">
                  <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                    {editingId ? <Edit3 className="w-5 h-5 text-blue-400" /> : <Plus className="w-5 h-5 text-emerald-400" />}
                    {editingId ? '修改代码 Skill' : '新建代码 Skill'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500"><X className="w-4 h-4" /></button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">标题 *</label>
                      <input value={formTitle} onChange={e => setFormTitle(e.target.value)} autoFocus
                        className="w-full px-4 py-2.5 bg-[#171A26] border border-white/5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/50"
                        placeholder="如：React 防抖 Hook" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">语言类别 *</label>
                      <div className="relative">
                        <select value={formLang} onChange={e => setFormLang(e.target.value as SkillLang)}
                          className="w-full px-4 py-2.5 bg-[#171A26] border border-white/5 rounded-xl text-sm text-slate-200 outline-none focus:border-emerald-500/50 appearance-none cursor-pointer">
                          {(Object.entries(LANG_CFG) as [SkillLang, typeof LANG_CFG[SkillLang]][]).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">所属服务 *</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <select value={formService} onChange={e => { setFormService(e.target.value); setFormNewService(''); }}
                          className="w-full px-4 py-2.5 bg-[#171A26] border border-white/5 rounded-xl text-sm text-slate-200 outline-none focus:border-emerald-500/50 appearance-none cursor-pointer">
                          {services.map(([srv]) => (
                            <option key={srv} value={srv}>{srv}</option>
                          ))}
                           <option value="" className="text-emerald-400 text-sm italic">-- 输入新服务 --</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                      <input type="text" value={formNewService}
                        onChange={e => { setFormNewService(e.target.value); if (e.target.value) setFormService(''); }}
                        className="flex-1 px-4 py-2.5 bg-[#171A26] border border-white/5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/50"
                        placeholder="或直接输入新服务名" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">代码描述</label>
                    <input value={formDesc} onChange={e => setFormDesc(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#171A26] border border-white/5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/50"
                      placeholder="简要描述这个代码片段的用途..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">初始代码内容</label>
                    <div className="w-full bg-[#171A26] border border-white/5 rounded-xl text-sm focus-within:border-emerald-500/50 overflow-hidden" style={{height: '240px'}}>
                      <Editor
                        height="100%"
                        theme="vs-dark"
                        language={LANG_CFG[formLang].monaco}
                        value={formCode}
                        onChange={v => setFormCode(v || '')}
                        options={{
                          fontSize: 13, fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
                          minimap: { enabled: false }, scrollBeyondLastLine: false,
                          lineNumbersMinChars: 3, padding: { top: 12, bottom: 12 },
                          automaticLayout: true, tabSize: 2, wordWrap: 'on'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 shadow-sm mt-auto">
                  <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5">取消</button>
                  <button onClick={saveSkill} disabled={!formTitle.trim()}
                    className={`px-6 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 shadow-lg transition-all ${editingId ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'}`}>
                    {editingId ? '确认修改' : '确认创建'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirm Modal ─── */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
             <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
                className="relative bg-[#171A26] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 rounded-xl bg-red-500/10"><Trash2 className="w-5 h-5 text-red-400" /></div>
                 <h3 className="text-lg font-bold text-slate-100">确认删除</h3>
               </div>
               <p className="text-sm text-slate-400 mb-6">确定要永久删除这个 Skill 代码片段吗？一旦删除将无法恢复。</p>
               <div className="flex items-center justify-end gap-3">
                 <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5">保留</button>
                 <button onClick={confirmDelete} className="px-5 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20">确认删除</button>
               </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }
      `}</style>
    </div>
  );
}
