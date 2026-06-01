import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Search, Plus, Copy, Edit2, Trash2, Clock, Check, X,
  Globe, Server, FileArchive, Terminal, ExternalLink, Minus, CloudOff, Loader2,
  FolderUp, Link2, Zap
} from 'lucide-react';
import { releaseApi, ReleaseProject, ReleaseAddress, ReleaseFile, ReleaseCommand } from '@/api/release';
import { toast } from 'react-hot-toast';

// ─── Env Config ──────────────────────
const ENV_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  production: { label: '生产', cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25', dot: 'bg-emerald-400' },
  staging:    { label: '预发', cls: 'text-amber-400 bg-amber-400/10 border-amber-400/25', dot: 'bg-amber-400' },
  dev:        { label: '开发', cls: 'text-sky-400 bg-sky-400/10 border-sky-400/25', dot: 'bg-sky-400' },
};

type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';
function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;
  const cfg = { 
    unsaved: { i: <CloudOff size={12}/>, t: '未保存', c: 'text-slate-400' }, 
    saving: { i: <Loader2 size={12} className="animate-spin"/>, t: '保存中', c: 'text-orange-400' }, 
    saved: { i: <Check size={12}/>, t: '已保存', c: 'text-emerald-400' } 
  }[status]!;
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.c}`}>{cfg.i}{cfg.t}</span>;
}

function useCopy() {
  const [k, setK] = useState<string|null>(null);
  const cp = useCallback((t:string,key:string) => { navigator.clipboard.writeText(t); setK(key); setTimeout(()=>setK(null),1500); }, []);
  return { k, cp };
}

function CopyBtn({ text, id, copied, onCopy }: { text: string; id: string; copied: string|null; onCopy:(t:string,k:string)=>void }) {
  const hit = copied === id;
  return (
    <button onClick={e=>{e.stopPropagation();onCopy(text,id);}} title="复制"
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${hit ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/5'}`}>
      {hit ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}{hit ? '已复制' : '复制'}
    </button>
  );
}

// ═══════════════════════════════════════
// Main Component
// ═══════════════════════════════════════
export default function ReleaseManagerPage() {
  const navigate = useNavigate();
  const { k: copiedKey, cp } = useCopy();

  const [projects, setProjects] = useState<ReleaseProject[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Save status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedReset = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Inline editing
  const [editingId, setEditingId] = useState<number | null>(null);

  // Load from API
  const loadData = async () => {
    try {
      const res = await releaseApi.getProjectList();
      if (res.code === 0) {
        setProjects(res.data);
        if (res.data.length > 0 && !selectedId) {
          setSelectedId(res.data[0].id);
        } else if (res.data.length === 0) {
          setSelectedId(null);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('获取发布项目失败');
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => { setSaveStatus('idle'); }, [selectedId]);
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); if (savedReset.current) clearTimeout(savedReset.current); }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
  }, [projects, searchQuery]);

  const selected = useMemo(() => projects.find(p => p.id === selectedId) || null, [projects, selectedId]);

  // Update backend with debouncing
  const debounceApiCall = (apiCall: () => Promise<any>) => {
    setSaveStatus('unsaved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const res = await apiCall();
        if (res.code === 0) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('idle');
          toast.error(res.msg || '保存失败');
        }
      } catch (err) {
        setSaveStatus('idle');
        toast.error('保存失败');
      }
      if (savedReset.current) clearTimeout(savedReset.current);
      savedReset.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  // Create
  const handleCreate = async () => {
    if (!createName.trim()) return;
    try {
      const res = await releaseApi.createProject({ name: createName, description: createDesc });
      if (res.code === 0) {
        toast.success('创建成功');
        await loadData();
        setSelectedId(res.data.id);
        setIsCreateOpen(false);
        setCreateName(''); setCreateDesc('');
      } else {
        toast.error(res.msg || '创建失败');
      }
    } catch (e) {
      toast.error('创建失败');
    }
  };

  // Delete
  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      const res = await releaseApi.deleteProject(deleteConfirmId);
      if (res.code === 0) {
        toast.success('删除成功');
        await loadData();
        if (selectedId === deleteConfirmId) setSelectedId(null);
        setDeleteConfirmId(null);
      } else {
        toast.error(res.msg || '删除失败');
      }
    } catch (e) {
       toast.error('删除失败');
    }
  };

  const updateProjectField = (id: number, field: string, value: string) => {
    const proj = projects.find(p => p.id === id);
    if (!proj) return;
    const patched = { ...proj, [field]: value };
    setProjects(prev => prev.map(p => p.id === id ? patched : p));
    debounceApiCall(() => releaseApi.updateProject({ id: id, name: patched.name, description: patched.description }));
  };

  // ─── Address ops ───────────────
  const addAddress = async (projId: number) => {
    try {
      const res = await releaseApi.createAddress({ projectId: projId, label: '新增环境', url: '', env: 'dev' });
      if (res.code === 0) {
        await loadData();
        setEditingId(res.data.id);
      }
    } catch(e) {}
  };
  const updateAddressField = (projId: number, aId: number, patch: Partial<ReleaseAddress>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projId) return p;
      return { ...p, addresses: p.addresses.map(a => a.id === aId ? { ...a, ...patch } : a) };
    }));
    const addr = projects.find(p => p.id === projId)?.addresses.find(a => a.id === aId);
    if (!addr) return;
    const updated = { ...addr, ...patch };
    debounceApiCall(() => releaseApi.updateAddress({ id: aId, projectId: projId, label: updated.label, url: updated.url, env: updated.env }));
  };
  const removeAddress = async (projId: number, aId: number) => {
    try {
      const res = await releaseApi.deleteAddress(aId);
      if (res.code === 0) loadData();
    } catch(e) {}
  };

  // ─── File ops ──────────────────
  const addFile = async (projId: number) => {
    try {
      const res = await releaseApi.createFile({ projectId: projId, name: '新文件', path: '', description: '' });
      if (res.code === 0) {
        await loadData();
        setEditingId(res.data.id);
      }
    } catch (e) {}
  };
  const updateFileField = (projId: number, fId: number, patch: Partial<ReleaseFile>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projId) return p;
      return { ...p, files: p.files.map(f => f.id === fId ? { ...f, ...patch } : f) };
    }));
    const file = projects.find(p => p.id === projId)?.files.find(f => f.id === fId);
    if (!file) return;
    const updated = { ...file, ...patch };
    debounceApiCall(() => releaseApi.updateFile({ id: fId, projectId: projId, name: updated.name, path: updated.path, description: updated.description }));
  };
  const removeFile = async (projId: number, fId: number) => {
    try {
      const res = await releaseApi.deleteFile(fId);
      if (res.code === 0) loadData();
    } catch(e) {}
  };

  // ─── Command ops ───────────────
  const addCommand = async (projId: number) => {
    try {
      const res = await releaseApi.createCommand({ projectId: projId, label: '新命令', command: '', description: '' });
      if (res.code === 0) {
        await loadData();
        setEditingId(res.data.id);
      }
    } catch(e) {}
  };
  const updateCommandField = (projId: number, cId: number, patch: Partial<ReleaseCommand>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projId) return p;
      return { ...p, commands: p.commands.map(c => c.id === cId ? { ...c, ...patch } : c) };
    }));
    const cmd = projects.find(p => p.id === projId)?.commands.find(c => c.id === cId);
    if (!cmd) return;
    const updated = { ...cmd, ...patch };
    debounceApiCall(() => releaseApi.updateCommand({ id: cId, projectId: projId, label: updated.label, command: updated.command, description: updated.description }));
  };
  const removeCommand = async (projId: number, cId: number) => {
    try {
      const res = await releaseApi.deleteCommand(cId);
      if (res.code === 0) loadData();
    } catch(e) {}
  };

  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-[50%] h-[350px] bg-orange-500/5 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[30%] h-[200px] bg-rose-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-[#0F111A]/80 flex-shrink-0 flex items-center justify-between px-5 z-20 backdrop-blur-xl gap-3">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><ArrowLeft className="w-5 h-5"/></button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.12)]"><Send className="w-5 h-5"/></div>
            <div>
              <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-rose-500">发布管理</h1>
              <p className="text-[10px] text-slate-500">{projects.length} 个发布项目</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex justify-center max-w-md mx-3">
          <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-orange-400"/>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索..."
              className="pl-10 pr-4 py-2 w-full bg-[#151926]/90 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-orange-500/50 placeholder-slate-500"/>
          </div>
        </div>
        <button onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:opacity-90 text-sm shadow-lg shadow-orange-500/20 flex-shrink-0">
          <Plus className="w-4 h-4"/>新建发布
        </button>
      </header>

      <main className="flex-1 flex min-h-0 overflow-hidden z-10">
        {/* Left: List */}
        <aside className="w-72 flex-shrink-0 border-r border-white/5 bg-[#0A0C14]/60 flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">项目列表</div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filtered.map(proj => {
              const isActive = selectedId === proj.id;
              return (
                <div key={proj.id} onClick={() => { setSelectedId(proj.id); setEditingId(null); }}
                  className={`group relative px-4 py-3.5 border-b border-white/[0.03] cursor-pointer transition-all ${isActive ? 'bg-orange-500/10' : 'hover:bg-white/[0.02]'}`}>
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-orange-500"/>}
                  <h3 className={`text-sm font-semibold mb-1 truncate ${isActive ? 'text-slate-100' : 'text-slate-300'}`}>{proj.name}</h3>
                  <p className="text-[11px] text-slate-500 truncate mb-2">{proj.description || '暂无描述'}</p>
                  <div className="flex items-center gap-2 text-[9px] text-slate-600">
                    <span className="flex items-center gap-0.5"><Globe className="w-2.5 h-2.5"/>{(proj.addresses || []).length} 地址</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><FileArchive className="w-2.5 h-2.5"/>{(proj.files || []).length} 文件</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Terminal className="w-2.5 h-2.5"/>{(proj.commands || []).length} 命令</span>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="text-center text-slate-600 text-xs py-16">暂无项目</div>}
          </div>
        </aside>

        {/* Right: Detail */}
        <section className="flex-1 flex flex-col overflow-hidden bg-[#0A0C14]/20">
          {selected ? (
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {/* Header */}
              <div className="px-8 py-5 border-b border-white/5 bg-[#0D0F18]/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <input type="text" value={selected.name}
                      onChange={e => updateProjectField(selected.id, 'name', e.target.value)}
                      className="text-2xl font-bold text-white bg-transparent outline-none border-b border-transparent hover:border-white/10 focus:border-orange-500/50 transition-colors w-full mb-1"/>
                    <input type="text" value={selected.description}
                      onChange={e => updateProjectField(selected.id, 'description', e.target.value)}
                      className="text-sm text-slate-400 bg-transparent outline-none w-full border-b border-transparent hover:border-white/10 focus:border-orange-500/30" placeholder="添加描述..."/>
                    <p className="text-xs text-slate-600 mt-2 flex items-center gap-1"><Clock className="w-3 h-3"/>最后更新时间可能受 API 控制</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <SaveBadge status={saveStatus}/>
                    <button onClick={() => setDeleteConfirmId(selected.id)} className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              </div>

              {/* ─── Addresses ─── */}
              <div className="px-8 py-5 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400"/>
                    <h3 className="text-sm font-bold text-slate-200">发布地址</h3>
                    <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{(selected.addresses || []).length}</span>
                  </div>
                  <button onClick={() => addAddress(selected.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-orange-400 hover:bg-orange-500/10 border border-orange-500/20"><Plus className="w-3 h-3"/>添加地址</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(selected.addresses || []).map(addr => {
                    const env = ENV_CONFIG[addr.env] || ENV_CONFIG.dev;
                    const isEditing = editingId === addr.id;
                    return (
                      <div key={addr.id} className="group rounded-xl border border-white/5 bg-[#0E1019]/80 p-4 hover:border-white/10 transition-all relative">
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input value={addr.label} onChange={e => updateAddressField(selected.id, addr.id, { label: e.target.value })} autoFocus
                                className="flex-1 bg-[#1a1d2e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-orange-500/50" placeholder="名称"/>
                              <select value={addr.env} onChange={e => updateAddressField(selected.id, addr.id, { env: e.target.value as any })}
                                className="bg-[#1a1d2e] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 cursor-pointer">
                                <option value="production" className="bg-[#1a1d2e]">生产</option>
                                <option value="staging" className="bg-[#1a1d2e]">预发</option>
                                <option value="dev" className="bg-[#1a1d2e]">开发</option>
                              </select>
                            </div>
                            <input value={addr.url} onChange={e => updateAddressField(selected.id, addr.id, { url: e.target.value })}
                              className="w-full bg-[#1a1d2e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-orange-500/50 font-mono" placeholder="https://..."/>
                            <div className="flex justify-end">
                              <button onClick={() => setEditingId(null)} className="text-xs text-orange-400 hover:underline">完成</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`w-2 h-2 rounded-full ${env.dot}`}/>
                              <span className="text-sm font-medium text-slate-200 flex-1">{addr.label || '(未命名)'}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${env.cls}`}>{env.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <a href={addr.url} target="_blank" rel="noreferrer"
                                className="text-xs font-mono text-sky-400 hover:text-sky-300 hover:underline truncate flex-1">{addr.url || '(未设置)'}</a>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyBtn text={addr.url} id={`a-${addr.id}`} copied={copiedKey} onCopy={cp}/>
                                <button onClick={() => setEditingId(addr.id)} className="p-1 rounded text-slate-500 hover:text-orange-400"><Edit2 className="w-3 h-3"/></button>
                                <button onClick={() => removeAddress(selected.id, addr.id)} className="p-1 rounded text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3"/></button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {(selected.addresses || []).length === 0 && (
                    <div className="col-span-2 text-center py-6 text-slate-600 text-xs border border-dashed border-white/5 rounded-xl">暂无地址</div>
                  )}
                </div>
              </div>

              {/* ─── Files ─── */}
              <div className="px-8 py-5 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileArchive className="w-4 h-4 text-violet-400"/>
                    <h3 className="text-sm font-bold text-slate-200">发布文件</h3>
                    <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{(selected.files || []).length}</span>
                  </div>
                  <button onClick={() => addFile(selected.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-orange-400 hover:bg-orange-500/10 border border-orange-500/20"><Plus className="w-3 h-3"/>添加文件</button>
                </div>
                <div className="space-y-2">
                  {(selected.files || []).map(file => {
                    const isEditing = editingId === file.id;
                    return (
                      <div key={file.id} className="group rounded-xl border border-white/5 bg-[#0E1019]/80 overflow-hidden hover:border-white/10 transition-all">
                        {isEditing ? (
                          <div className="p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <input value={file.name} onChange={e => updateFileField(selected.id, file.id, { name: e.target.value })} autoFocus
                                className="flex-1 bg-[#1a1d2e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-orange-500/50 font-mono" placeholder="文件名"/>
                            </div>
                            <input value={file.path} onChange={e => updateFileField(selected.id, file.id, { path: e.target.value })}
                              className="w-full bg-[#1a1d2e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-orange-500/50 font-mono" placeholder="文件路径 /opt/..."/>
                            <input value={file.description} onChange={e => updateFileField(selected.id, file.id, { description: e.target.value })}
                              className="w-full bg-[#1a1d2e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-orange-500/50" placeholder="说明"/>
                            <div className="flex justify-end">
                              <button onClick={() => setEditingId(null)} className="text-xs text-orange-400 hover:underline">完成</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 px-4 py-3">
                            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 flex-shrink-0"><FolderUp className="w-4 h-4"/></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-200">{file.name || '(未命名)'}</span>
                                {file.description && <span className="text-[11px] text-slate-500">— {file.description}</span>}
                              </div>
                              <span className="text-xs font-mono text-slate-500 truncate block">{file.path || '(未设置路径)'}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <CopyBtn text={file.path} id={`f-${file.id}`} copied={copiedKey} onCopy={cp}/>
                              <button onClick={() => setEditingId(file.id)} className="p-1 rounded text-slate-500 hover:text-orange-400"><Edit2 className="w-3 h-3"/></button>
                              <button onClick={() => removeFile(selected.id, file.id)} className="p-1 rounded text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3"/></button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(selected.files || []).length === 0 && (
                    <div className="text-center py-6 text-slate-600 text-xs border border-dashed border-white/5 rounded-xl">暂无文件</div>
                  )}
                </div>
              </div>

              {/* ─── Commands ─── */}
              <div className="px-8 py-5 pb-16">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400"/>
                    <h3 className="text-sm font-bold text-slate-200">发布命令</h3>
                    <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{(selected.commands || []).length}</span>
                  </div>
                  <button onClick={() => addCommand(selected.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-orange-400 hover:bg-orange-500/10 border border-orange-500/20"><Plus className="w-3 h-3"/>添加命令</button>
                </div>
                <div className="space-y-3">
                  {(selected.commands || []).map((cmd, ci) => {
                    const isEditing = editingId === cmd.id;
                    return (
                      <div key={cmd.id} className="group relative pl-10">
                        <div className="absolute left-0 top-0 w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-400">{ci + 1}</div>
                        {ci < (selected.commands || []).length - 1 && <div className="absolute left-[13px] top-7 bottom-[-12px] w-px bg-white/5"/>}
                        {isEditing ? (
                          <div className="space-y-2 mb-2">
                            <div className="flex items-center gap-2">
                              <input value={cmd.label} onChange={e => updateCommandField(selected.id, cmd.id, { label: e.target.value })} autoFocus
                                className="flex-1 bg-[#1a1d2e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-orange-500/50" placeholder="命令名称"/>
                              <button onClick={() => setEditingId(null)} className="text-xs text-orange-400 hover:underline">完成</button>
                            </div>
                            <input value={cmd.description} onChange={e => updateCommandField(selected.id, cmd.id, { description: e.target.value })}
                              className="w-full bg-[#1a1d2e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-orange-500/50" placeholder="说明（可选）"/>
                            <textarea value={cmd.command} onChange={e => updateCommandField(selected.id, cmd.id, { command: e.target.value })}
                              className="w-full bg-[#0E1019] border border-white/5 rounded-lg px-4 py-3 text-sm text-slate-300 font-mono resize-none outline-none focus:border-orange-500/30" rows={2} placeholder="终端命令"/>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-slate-200">{cmd.label || '(未命名)'}</h4>
                              {cmd.description && <span className="text-[11px] text-slate-500">— {cmd.description}</span>}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                <button onClick={() => setEditingId(cmd.id)} className="p-1 rounded text-slate-500 hover:text-orange-400"><Edit2 className="w-3 h-3"/></button>
                                <button onClick={() => removeCommand(selected.id, cmd.id)} className="p-1 rounded text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3"/></button>
                              </div>
                            </div>
                            {cmd.command && (
                              <div className="rounded-lg bg-[#0E1019] border border-white/5 overflow-hidden">
                                <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-white/[0.02]">
                                  <span className="text-[10px] text-slate-600 font-mono">Terminal</span>
                                  <CopyBtn text={cmd.command} id={`c-${cmd.id}`} copied={copiedKey} onCopy={cp}/>
                                </div>
                                <pre className="px-4 py-3 text-[13px] text-slate-300 font-mono leading-6 overflow-x-auto whitespace-pre-wrap">{cmd.command}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(selected.commands || []).length === 0 && (
                    <div className="text-center py-6 text-slate-600 text-xs border border-dashed border-white/5 rounded-xl">暂无命令</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Send className="w-14 h-14 mb-4 opacity-10"/>
              <p className="text-sm mb-1">选择一个发布项目</p>
              <p className="text-xs text-slate-600">或点击「新建发布」创建</p>
            </div>
          )}
        </section>
      </main>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setIsCreateOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"/>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:20}}
                className="w-full max-w-md bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-white">新建发布项目</h2>
                  <button onClick={()=>setIsCreateOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400"><X className="w-5 h-5"/></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">项目名称 *</label>
                    <input value={createName} onChange={e=>setCreateName(e.target.value)}
                      className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500/50" placeholder="如：用户中心" autoFocus/>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">描述</label>
                    <input value={createDesc} onChange={e=>setCreateDesc(e.target.value)}
                      className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500/50" placeholder="简要描述"/>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                  <button onClick={()=>setIsCreateOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5">取消</button>
                  <button onClick={handleCreate} disabled={!createName.trim()}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:opacity-90 disabled:opacity-40 shadow-lg shadow-orange-500/20">创建项目</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setDeleteConfirmId(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"/>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
                className="w-full max-w-sm bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-red-500/10"><Trash2 className="w-5 h-5 text-red-400"/></div>
                  <h3 className="text-lg font-bold text-slate-100">确认删除</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6">删除后无法恢复，确定要删除这个发布项目吗？</p>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={()=>setDeleteConfirmId(null)} className="px-5 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5">取消</button>
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
