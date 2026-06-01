import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import {
  ArrowLeft, Rocket, Search, Plus, Copy, Edit2, Trash2, Clock, Check, X,
  Monitor, Apple, Terminal as LinuxIcon, ChevronDown, ChevronRight, FileCode,
  ListOrdered, Package, Upload, Loader2
} from 'lucide-react';
import { deployApi, DeployProject, DeployFile, DeployStep } from '@/api/deploy';

// ─── Types ───────────────────────────
type Platform = 'windows' | 'mac' | 'linux';

// ─── Platform Config ─────────────────
const PLATFORM_CONFIG: Record<Platform, { label: string; icon: any; cls: string; clsActive: string }> = {
  windows: { label: 'Windows', icon: Monitor, cls: 'text-slate-500 bg-white/5 border-white/10', clsActive: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  mac: { label: 'macOS', icon: Apple, cls: 'text-slate-500 bg-white/5 border-white/10', clsActive: 'text-slate-200 bg-slate-300/10 border-slate-300/30' },
  linux: { label: 'Linux', icon: LinuxIcon, cls: 'text-slate-500 bg-white/5 border-white/10', clsActive: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
};

const LANG_OPTIONS = [
  { value: 'yaml', label: 'YAML' }, { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'shell', label: 'Shell' }, { value: 'nginx', label: 'Nginx' },
  { value: 'properties', label: 'Properties' }, { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' }, { value: 'ini', label: 'INI' },
  { value: 'plaintext', label: 'Text' },
];

// ─── Helpers ─────────────────────────
function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function guessLang(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    yml: 'yaml', yaml: 'yaml', json: 'json', xml: 'xml', ini: 'ini', conf: 'nginx',
    properties: 'properties', sh: 'shell', bash: 'shell', dockerfile: 'dockerfile',
    env: 'shell', toml: 'ini', cfg: 'ini', cnf: 'ini', txt: 'plaintext',
  };
  if (name.toLowerCase().includes('dockerfile')) return 'dockerfile';
  if (name.toLowerCase().includes('nginx')) return 'nginx';
  return map[ext] || 'plaintext';
}

function parsePlatforms(str: string): Platform[] {
  if (!str) return [];
  return str.split(',').filter(Boolean) as Platform[];
}

// ─── Copy Hook ───────────────────────
function useCopy() {
  const [ck, setCk] = useState<string | null>(null);
  const cp = useCallback((t: string, k: string) => { navigator.clipboard.writeText(t); setCk(k); setTimeout(() => setCk(null), 1500); }, []);
  return { ck, cp };
}
function CopyBtn({ text, k, ck, cp }: { text: string; k: string; ck: string | null; cp: (t: string, k: string) => void }) {
  const hit = ck === k;
  return (
    <button onClick={e => { e.stopPropagation(); cp(text, k); }}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-all ${hit ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/5'
        }`}>{hit ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{hit ? '已复制' : '复制'}</button>
  );
}

// ═══════════════════════════════════════
// Main Component
// ═══════════════════════════════════════
export default function DeployManagerPage() {
  const navigate = useNavigate();
  const { ck, cp } = useCopy();

  const [projects, setProjects] = useState<DeployProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set());

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createPlatforms, setCreatePlatforms] = useState<Platform[]>(['linux']);

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Inline editing
  const [editingFile, setEditingFile] = useState<number | null>(null);
  const [editingStep, setEditingStep] = useState<number | null>(null);

  // Auto-save debounce
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ─── Fetch data ───────────────────
  const fetchProjects = useCallback(async () => {
    try {
      const res: any = await deployApi.getTree();
      if (res?.code === 0) {
        const data = res.data || [];
        setProjects(data);
        if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
      }
    } catch (e) {
      console.error('获取部署项目失败', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }, [projects, searchQuery]);

  const selected = useMemo(() => projects.find(p => p.id === selectedId) || null, [projects, selectedId]);

  const toggleFile = (k: number) => setExpandedFiles(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });

  // ─── Create Project ────────────
  const handleCreate = async () => {
    if (!createName.trim()) return;
    try {
      const res: any = await deployApi.createProject({
        name: createName.trim(),
        description: createDesc.trim(),
        platforms: createPlatforms.join(','),
      });
      if (res?.code === 0 && res.data) {
        const newProj = { ...res.data, files: [], steps: [] };
        setProjects(prev => [newProj, ...prev]);
        setSelectedId(newProj.id);
      }
      setIsCreateOpen(false);
      setCreateName(''); setCreateDesc(''); setCreatePlatforms(['linux']);
    } catch (e) {
      console.error('创建项目失败', e);
    }
  };

  // ─── Update Project (debounced) ────
  const debouncedUpdateProject = useCallback((proj: DeployProject) => {
    const key = `proj-${proj.id}`;
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(async () => {
      try {
        await deployApi.updateProject({ id: proj.id, name: proj.name, description: proj.description, platforms: proj.platforms });
      } catch (e) { console.error('更新项目失败', e); }
    }, 800);
  }, []);

  const updateProjectLocal = useCallback((id: number, updater: (p: DeployProject) => DeployProject) => {
    setProjects(prev => {
      const updated = prev.map(p => p.id === id ? updater(p) : p);
      const proj = updated.find(p => p.id === id);
      if (proj) debouncedUpdateProject(proj);
      return updated;
    });
  }, [debouncedUpdateProject]);

  // ─── File Operations ───────────
  const addFile = async (projId: number) => {
    try {
      const res: any = await deployApi.createFile({ name: 'new-file.yml', language: 'yaml', content: '', projectId: projId });
      if (res?.code === 0 && res.data) {
        setProjects(prev => prev.map(p => p.id === projId ? { ...p, files: [...(p.files || []), res.data] } : p));
        setEditingFile(res.data.id);
        setExpandedFiles(prev => new Set(prev).add(res.data.id));
      }
    } catch (e) { console.error('添加文件失败', e); }
  };

  const uploadFile = (projId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yml,.yaml,.json,.xml,.conf,.ini,.sh,.env,.properties,.toml,.cfg,.cnf,.txt,.dockerfile,Dockerfile,docker-compose*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = async () => {
          const content = reader.result as string;
          try {
            const res: any = await deployApi.createFile({ name: file.name, language: guessLang(file.name), content, projectId: projId });
            if (res?.code === 0 && res.data) {
              setProjects(prev => prev.map(p => p.id === projId ? { ...p, files: [...(p.files || []), res.data] } : p));
              setExpandedFiles(prev => new Set(prev).add(res.data.id));
            }
          } catch (e) { console.error('上传文件失败', e); }
        };
        reader.readAsText(file);
      });
    };
    input.click();
  };

  const updateFileLocal = useCallback((projId: number, fileId: number, patch: Partial<DeployFile>) => {
    setProjects(prev => prev.map(p => p.id === projId ? { ...p, files: (p.files || []).map(f => f.id === fileId ? { ...f, ...patch } : f) } : p));
    const key = `file-${fileId}`;
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(async () => {
      const proj = projects.find(p => p.id === projId);
      const file = proj?.files?.find(f => f.id === fileId);
      if (!file) return;
      const merged = { ...file, ...patch };
      try {
        await deployApi.updateFile({ id: fileId, name: merged.name, language: merged.language, content: merged.content, projectId: projId });
      } catch (e) { console.error('更新文件失败', e); }
    }, 800);
  }, [projects]);

  const removeFile = async (projId: number, fileId: number) => {
    setProjects(prev => prev.map(p => p.id === projId ? { ...p, files: (p.files || []).filter(f => f.id !== fileId) } : p));
    try { await deployApi.deleteFile(fileId); } catch (e) { console.error('删除文件失败', e); fetchProjects(); }
  };

  // ─── Step Operations ───────────
  const addStep = async (projId: number) => {
    const proj = projects.find(p => p.id === projId);
    const nextOrder = (proj?.steps?.length || 0) + 1;
    try {
      const res: any = await deployApi.createStep({ projectId: projId, sortOrder: nextOrder, title: '', description: '', commands: '' });
      if (res?.code === 0 && res.data) {
        setProjects(prev => prev.map(p => p.id === projId ? { ...p, steps: [...(p.steps || []), res.data] } : p));
        setEditingStep(res.data.id);
      }
    } catch (e) { console.error('添加步骤失败', e); }
  };

  const updateStepLocal = useCallback((projId: number, stepId: number, patch: Partial<DeployStep>) => {
    setProjects(prev => prev.map(p => p.id === projId ? { ...p, steps: (p.steps || []).map(s => s.id === stepId ? { ...s, ...patch } : s) } : p));
    const key = `step-${stepId}`;
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(async () => {
      const proj = projects.find(p => p.id === projId);
      const step = proj?.steps?.find(s => s.id === stepId);
      if (!step) return;
      const merged = { ...step, ...patch };
      try {
        await deployApi.updateStep({ id: stepId, sortOrder: merged.sortOrder, title: merged.title, description: merged.description, commands: merged.commands, platform: merged.platform || '' });
      } catch (e) { console.error('更新步骤失败', e); }
    }, 800);
  }, [projects]);

  const removeStep = async (projId: number, stepId: number) => {
    setProjects(prev => prev.map(p => p.id === projId ? { ...p, steps: (p.steps || []).filter(s => s.id !== stepId) } : p));
    try { await deployApi.deleteStep(stepId); } catch (e) { console.error('删除步骤失败', e); fetchProjects(); }
  };

  // ─── Delete Project ────────────
  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setProjects(prev => prev.filter(p => p.id !== deleteConfirmId));
    if (selectedId === deleteConfirmId) setSelectedId(null);
    try { await deployApi.deleteProject(deleteConfirmId); } catch (e) { console.error('删除项目失败', e); fetchProjects(); }
    setDeleteConfirmId(null);
  };

  const togglePlatform = (p: Platform, list: Platform[], setter: (v: Platform[]) => void) => {
    setter(list.includes(p) ? list.filter(x => x !== p) : [...list, p]);
  };

  // ─── Render ─────────────────────
  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[55%] h-[400px] bg-teal-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* ─── Header ─── */}
      <header className="h-16 border-b border-white/5 bg-[#0F111A]/80 flex-shrink-0 flex items-center justify-between px-5 z-20 backdrop-blur-xl gap-3">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400"><Rocket className="w-5 h-5" /></div>
            <div>
              <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-500">部署管理</h1>
              <p className="text-[10px] text-slate-500">{projects.length} 个部署项目</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex justify-center max-w-md mx-3">
          <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索..."
              className="pl-10 pr-4 py-2 w-full bg-[#151926]/90 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-500/50 placeholder-slate-500" />
          </div>
        </div>
        <button onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium hover:opacity-90 text-sm shadow-lg shadow-teal-500/20 flex-shrink-0">
          <Plus className="w-4 h-4" />新建部署
        </button>
      </header>

      <main className="flex-1 flex min-h-0 overflow-hidden z-10">
        {/* ─── Left: Project List ─── */}
        <aside className="w-72 flex-shrink-0 border-r border-white/5 bg-[#0A0C14]/60 flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">项目列表</div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {loading && <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-teal-400 animate-spin" /></div>}
            {!loading && filteredProjects.map(proj => {
              const isActive = selectedId === proj.id;
              const platforms = parsePlatforms(proj.platforms);
              return (
                <div key={proj.id} onClick={() => { setSelectedId(proj.id); setExpandedFiles(new Set()); setEditingFile(null); setEditingStep(null); }}
                  className={`group relative px-4 py-3.5 border-b border-white/[0.03] cursor-pointer transition-all ${isActive ? 'bg-teal-500/10' : 'hover:bg-white/[0.02]'}`}>
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-teal-500" />}
                  <h3 className={`text-sm font-semibold mb-1 truncate ${isActive ? 'text-slate-100' : 'text-slate-300'}`}>{proj.name}</h3>
                  <p className="text-[11px] text-slate-500 truncate mb-2">{proj.description || '暂无描述'}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {platforms.map(p => {
                      const pc = PLATFORM_CONFIG[p]; const Icon = pc.icon;
                      return <span key={p} className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border ${pc.clsActive}`}><Icon className="w-2.5 h-2.5" />{pc.label}</span>;
                    })}
                    <span className="text-[9px] text-slate-600 ml-auto">{(proj.files || []).length} 文件 · {(proj.steps || []).length} 步</span>
                  </div>
                </div>
              );
            })}
            {!loading && filteredProjects.length === 0 && <div className="text-center text-slate-600 text-xs py-16">暂无项目</div>}
          </div>
        </aside>

        {/* ─── Right: Detail ─── */}
        <section className="flex-1 flex flex-col overflow-hidden bg-[#0A0C14]/20">
          {selected ? (
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {/* Project Header */}
              <div className="px-8 py-5 border-b border-white/5 bg-[#0D0F18]/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {parsePlatforms(selected.platforms).map(p => {
                        const pc = PLATFORM_CONFIG[p]; const Icon = pc.icon;
                        return <span key={p} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${pc.clsActive}`}><Icon className="w-3.5 h-3.5" />{pc.label}</span>;
                      })}
                      {(['windows', 'mac', 'linux'] as Platform[]).filter(p => !parsePlatforms(selected.platforms).includes(p)).map(p => {
                        const pc = PLATFORM_CONFIG[p]; const Icon = pc.icon;
                        return <button key={p} onClick={() => {
                          const newPlatforms = [...parsePlatforms(selected.platforms), p].join(',');
                          updateProjectLocal(selected.id, pr => ({ ...pr, platforms: newPlatforms }));
                        }}
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-dashed opacity-40 hover:opacity-80 transition-opacity ${pc.cls}`}><Icon className="w-3.5 h-3.5" /><Plus className="w-2.5 h-2.5" /></button>;
                      })}
                    </div>
                    <input type="text" value={selected.name}
                      onChange={e => updateProjectLocal(selected.id, p => ({ ...p, name: e.target.value }))}
                      className="text-2xl font-bold text-white bg-transparent outline-none border-b border-transparent hover:border-white/10 focus:border-teal-500/50 transition-colors w-full mb-1" />
                    <input type="text" value={selected.description}
                      onChange={e => updateProjectLocal(selected.id, p => ({ ...p, description: e.target.value }))}
                      className="text-sm text-slate-400 bg-transparent outline-none w-full border-b border-transparent hover:border-white/10 focus:border-teal-500/30 transition-colors"
                      placeholder="添加描述..." />
                    <p className="text-xs text-slate-600 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(selected.UpdatedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => setDeleteConfirmId(selected.id)} className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              {/* ─── Files Section ─── */}
              <div className="px-8 py-5 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-slate-200">所需文件</h3>
                    <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{(selected.files || []).length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => uploadFile(selected.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 transition-all">
                      <Upload className="w-3 h-3" />上传文件
                    </button>
                    <button onClick={() => addFile(selected.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 transition-all">
                      <Plus className="w-3 h-3" />手动添加
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {(selected.files || []).map(file => {
                    const isExpanded = expandedFiles.has(file.id);
                    const isEditing = editingFile === file.id;
                    return (
                      <div key={file.id} className="rounded-xl border border-white/5 bg-[#0E1019]/80 overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/[0.02] transition-all" onClick={() => toggleFile(file.id)}>
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-teal-400" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                          <Package className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          {isEditing ? (
                            <input value={file.name} onChange={e => updateFileLocal(selected.id, file.id, { name: e.target.value })}
                              onClick={e => e.stopPropagation()} autoFocus
                              className="text-sm font-mono text-slate-200 bg-[#1a1d2e] border border-white/10 rounded px-2 py-0.5 flex-1 outline-none focus:border-teal-500/50" />
                          ) : (
                            <span className="text-sm font-mono text-slate-200 flex-1">{file.name}</span>
                          )}
                          {isEditing && (
                            <select value={file.language} onClick={e => e.stopPropagation()}
                              onChange={e => updateFileLocal(selected.id, file.id, { language: e.target.value })}
                              className="bg-[#1a1d2e] border border-white/10 rounded px-2 py-0.5 text-xs text-slate-300 cursor-pointer">
                              {LANG_OPTIONS.map(l => <option key={l.value} value={l.value} className="bg-[#1a1d2e]">{l.label}</option>)}
                            </select>
                          )}
                          <span className="text-[10px] text-slate-600 uppercase">{file.language}</span>
                          <CopyBtn text={file.content} k={`fc-${file.id}`} ck={ck} cp={cp} />
                          <button onClick={e => { e.stopPropagation(); setEditingFile(isEditing ? null : file.id); }}
                            className="p-1 rounded text-slate-500 hover:text-teal-400"><Edit2 className="w-3 h-3" /></button>
                          <button onClick={e => { e.stopPropagation(); removeFile(selected.id, file.id); }}
                            className="p-1 rounded text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                        </div>
                        {isExpanded && (
                          <div className="border-t border-white/5">
                            <Editor height={`${Math.min(Math.max(file.content.split('\n').length * 20, 80), 400)}px`}
                              language={file.language} value={file.content}
                              onChange={v => updateFileLocal(selected.id, file.id, { content: v || '' })}
                              theme="vs-dark"
                              options={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", minimap: { enabled: false }, scrollBeyondLastLine: false, lineNumbersMinChars: 3, padding: { top: 8, bottom: 8 }, automaticLayout: true, wordWrap: 'on', contextmenu: false, overviewRulerBorder: false, scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 } }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(selected.files || []).length === 0 && (
                    <div className="text-center py-8 text-slate-600 text-xs border border-dashed border-white/5 rounded-xl">
                      暂无文件，点击上方按钮添加
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Steps Section ─── */}
              <div className="px-8 py-5 pb-16">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-teal-400" />
                    <h3 className="text-sm font-bold text-slate-200">部署步骤</h3>
                    <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{(selected.steps || []).length}</span>
                  </div>
                  <button onClick={() => addStep(selected.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 transition-all">
                    <Plus className="w-3 h-3" />添加步骤
                  </button>
                </div>
                <div className="space-y-4">
                  {(selected.steps || []).map((step, si) => {
                    const isEditing = editingStep === step.id;
                    return (
                      <div key={step.id} className="relative pl-10">
                        <div className="absolute left-0 top-0 w-7 h-7 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-xs font-bold text-teal-400">{si + 1}</div>
                        {si < (selected.steps || []).length - 1 && <div className="absolute left-[13px] top-7 bottom-[-16px] w-px bg-white/5" />}
                        <div className="group">
                          <div className="flex items-center gap-2 mb-1">
                            {isEditing ? (
                              <input value={step.title} onChange={e => updateStepLocal(selected.id, step.id, { title: e.target.value })} autoFocus
                                className="text-sm font-semibold text-slate-200 bg-[#1a1d2e] border border-white/10 rounded-lg px-3 py-1 flex-1 outline-none focus:border-teal-500/50" placeholder="步骤标题" />
                            ) : (
                              <h4 className="text-sm font-semibold text-slate-200 flex-1">{step.title || '(未命名步骤)'}</h4>
                            )}
                            {step.platform && <span className={`text-[9px] px-1.5 py-0.5 rounded border ${PLATFORM_CONFIG[step.platform as Platform]?.clsActive || ''}`}>仅 {PLATFORM_CONFIG[step.platform as Platform]?.label || step.platform}</span>}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingStep(isEditing ? null : step.id)} className="p-1 rounded text-slate-500 hover:text-teal-400"><Edit2 className="w-3 h-3" /></button>
                              <button onClick={() => removeStep(selected.id, step.id)} className="p-1 rounded text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                          {isEditing ? (
                            <div className="space-y-2 mb-2">
                              <input value={step.description} onChange={e => updateStepLocal(selected.id, step.id, { description: e.target.value })}
                                className="w-full text-xs text-slate-400 bg-[#1a1d2e] border border-white/10 rounded-lg px-3 py-1.5 outline-none focus:border-teal-500/50" placeholder="说明（可选）" />
                              <textarea value={step.commands} onChange={e => updateStepLocal(selected.id, step.id, { commands: e.target.value })}
                                className="w-full bg-[#0E1019] border border-white/5 rounded-lg px-4 py-3 text-sm text-slate-300 font-mono resize-none outline-none focus:border-teal-500/30" rows={4} placeholder="终端命令" />
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500">平台限定:</span>
                                {(['windows', 'mac', 'linux'] as Platform[]).map(p => {
                                  const pc = PLATFORM_CONFIG[p]; const Icon = pc.icon;
                                  return <button key={p} onClick={() => updateStepLocal(selected.id, step.id, { platform: step.platform === p ? '' : p })}
                                    className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-all ${step.platform === p ? pc.clsActive : pc.cls}`}><Icon className="w-2.5 h-2.5" />{pc.label}</button>;
                                })}
                                <span className="text-[10px] text-slate-600">(不选=全平台)</span>
                              </div>
                            </div>
                          ) : (
                            step.description && <p className="text-xs text-slate-500 mb-2">{step.description}</p>
                          )}
                          {step.commands && !isEditing && (
                            <div className="rounded-lg bg-[#0E1019] border border-white/5 overflow-hidden">
                              <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-white/[0.02]">
                                <span className="text-[10px] text-slate-600 font-mono">Terminal</span>
                                <CopyBtn text={step.commands} k={`sc-${step.id}`} ck={ck} cp={cp} />
                              </div>
                              <pre className="px-4 py-3 text-[13px] text-slate-300 font-mono leading-6 overflow-x-auto whitespace-pre-wrap">{step.commands}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {(selected.steps || []).length === 0 && (
                    <div className="text-center py-8 text-slate-600 text-xs border border-dashed border-white/5 rounded-xl">
                      暂无步骤，点击上方按钮添加
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Rocket className="w-14 h-14 mb-4 opacity-10" />
              <p className="text-sm mb-1">选择一个部署项目</p>
              <p className="text-xs text-slate-600">或点击「新建部署」创建</p>
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
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-white">新建部署项目</h2>
                  <button onClick={() => setIsCreateOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">项目名称 *</label>
                    <input value={createName} onChange={e => setCreateName(e.target.value)}
                      className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50"
                      placeholder="如：Redis 集群部署" autoFocus />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">描述</label>
                    <input value={createDesc} onChange={e => setCreateDesc(e.target.value)}
                      className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50"
                      placeholder="简要描述" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">适用平台</label>
                    <div className="flex gap-3">
                      {(['windows', 'mac', 'linux'] as Platform[]).map(p => {
                        const pc = PLATFORM_CONFIG[p]; const Icon = pc.icon; const isOn = createPlatforms.includes(p);
                        return <button key={p} type="button" onClick={() => togglePlatform(p, createPlatforms, setCreatePlatforms)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ${isOn ? pc.clsActive : pc.cls}`}>
                          <Icon className="w-4 h-4" />{pc.label}
                        </button>;
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                  <button onClick={() => setIsCreateOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5">取消</button>
                  <button onClick={handleCreate} disabled={!createName.trim()}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-40 shadow-lg shadow-teal-500/20">
                    创建项目
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
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-sm bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-red-500/10"><Trash2 className="w-5 h-5 text-red-400" /></div>
                  <h3 className="text-lg font-bold text-slate-100">确认删除</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6">删除后无法恢复，确定要删除这个部署项目吗？</p>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5">取消</button>
                  <button onClick={confirmDelete} className="px-5 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20">确认删除</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
