import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor, { loader } from '@monaco-editor/react';
import {
  ArrowLeft, Search, Plus, Copy, Check, X, Trash2, Edit2,
  Box, FileCode2, Layers, ChevronRight, ChevronDown,
  Building2, FolderOpen, CloudOff, Loader2, Clock, Hash
} from 'lucide-react';
import { dockerApi, DockerOrganization, DockerProject, DockerFile } from '@/api/docker';

// ─── Constants ───────────────────────
const FILE_TYPE_CONFIG = {
  dockerfile: {
    label: 'Dockerfile',
    icon: FileCode2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    monacoLang: 'dockerfile',
  },
  compose: {
    label: 'Compose',
    icon: Layers,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    monacoLang: 'yaml',
  },
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
      className: 'text-blue-500 border-blue-500/20 bg-blue-500/10',
    },
    saved: {
      icon: <Check size={14} />,
      text: '已保存',
      className: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10',
    },
  }[status];

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all duration-300 select-none ${config.className}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}

// ─── Main Component ─────────────────
export default function DockerManagerPage() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<DockerOrganization[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Tree expansion
  const [expandedOrgs, setExpandedOrgs] = useState<Set<number>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());

  // Selection
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);

  // Copy
  const [copied, setCopied] = useState(false);

  // Save status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detail header ref for measuring height
  const detailHeaderRef = useRef<HTMLDivElement>(null);
  const [detailHeaderHeight, setDetailHeaderHeight] = useState(168);

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'file' | 'project' | 'org'>('file');
  const [formData, setFormData] = useState({
    name: '', type: 'dockerfile' as DockerFile['type'],
    content: '', description: '', orgId: 0, projectId: 0,
  });
  const [editFileId, setEditFileId] = useState<number | null>(null);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'org' | 'project' | 'file'; id: number; name: string } | null>(null);

  // Api Fetch Data
  const loadData = useCallback(async () => {
    try {
      const res = await dockerApi.getDockerTree();
      if (res.code === 0 && res.data) {
        setOrgs(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadData().then(() => {
      // Intentionally not auto-expanding all if empty to prevent issues
    });
  }, [loadData]);

  // Find selected file
  const selectedFile = useMemo(() => {
    for (const org of orgs) {
      for (const proj of (org.projects || [])) {
        const f = (proj.files || []).find(f => f.id === selectedFileId);
        if (f) return { file: f, project: proj, org };
      }
    }
    return null;
  }, [orgs, selectedFileId]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
    };
  }, []);

  // Measure detail header height
  useEffect(() => {
    const el = detailHeaderRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDetailHeaderHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    setDetailHeaderHeight(el.clientHeight);
    return () => observer.disconnect();
  }, [selectedFileId]);

  // Reset save status on selection change
  useEffect(() => {
    if (savedResetTimer.current) { clearTimeout(savedResetTimer.current); savedResetTimer.current = null; }
    if (autoSaveTimer.current) { clearTimeout(autoSaveTimer.current); autoSaveTimer.current = null; }
    setSaveStatus('idle');
  }, [selectedFileId]);

  // Auto-save
  const autoSave = useCallback((fileId: number, field: keyof DockerFile, value: string) => {
    // Optimistic update locally
    setOrgs(prev => prev.map(org => ({
      ...org,
      projects: org.projects?.map(proj => ({
        ...proj,
        files: proj.files?.map(f => f.id === fileId ? { ...f, [field]: value } : f),
      })),
    })));

    setSaveStatus('unsaved');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      // Find the file content in the orgs ref natively, or relying on selectedFile might be safer but `selectedFile` is outdated here
      setSaveStatus('saving');
      
      // Look up current file
      let latestFile: DockerFile | undefined;
      // We need to use state setter callback trick or let it fetch latest, since it's hard we will use updated object
      setOrgs(currentOrgs => {
        currentOrgs.forEach(o => o.projects?.forEach(p => p.files?.forEach(f => {
          if (f.id === fileId) latestFile = f;
        })));
        return currentOrgs;
      });

      if (latestFile) {
         try {
           await dockerApi.updateFile({
             id: latestFile.id,
             name: latestFile.name,
             type: latestFile.type,
             content: latestFile.content,
             description: latestFile.description,
             projectId: latestFile.projectId,
           });
           setSaveStatus('saved');
           if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
           savedResetTimer.current = setTimeout(() => {
             setSaveStatus('idle');
             savedResetTimer.current = null;
           }, 2000);
         } catch(e) {
           setSaveStatus('unsaved');
         }
      }
    }, 1000);
  }, []);

  // Copy
  const handleCopy = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // Toggle tree
  const toggleOrg = (id: number) => {
    setExpandedOrgs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleProject = (id: number) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Open form
  const openNewFileForm = (orgId?: number, projectId?: number) => {
    setEditFileId(null);
    setFormMode('file');
    setFormData({
      name: '', type: 'dockerfile', content: '', description: '',
      orgId: orgId || (orgs[0]?.id || 0),
      projectId: projectId || 0,
    });
    setIsFormOpen(true);
  };

  const openNewOrgForm = () => {
    setEditFileId(null);
    setFormMode('org');
    setFormData({ name: '', type: 'dockerfile', content: '', description: '', orgId: 0, projectId: 0 });
    setIsFormOpen(true);
  };

  const openNewProjectForm = (orgId: number) => {
    setEditFileId(null);
    setFormMode('project');
    setFormData({ name: '', type: 'dockerfile', content: '', description: '', orgId, projectId: 0 });
    setIsFormOpen(true);
  };

  const openEditFileForm = (file: DockerFile, orgId: number, projectId: number) => {
    setEditFileId(file.id);
    setFormMode('file');
    setFormData({
      name: file.name, type: file.type, content: file.content,
      description: file.description, orgId, projectId,
    });
    setIsFormOpen(true);
  };

  // Save form
  const handleFormSave = async () => {
    try {
      if (formMode === 'org') {
        if (!formData.name.trim()) return;
        await dockerApi.createOrg({ name: formData.name.trim() });
      } else if (formMode === 'project') {
        if (!formData.name.trim() || !formData.orgId) return;
        await dockerApi.createProject({ 
          name: formData.name.trim(), 
          orgId: Number(formData.orgId) 
        });
        setExpandedOrgs(prev => new Set([...prev, Number(formData.orgId)]));
      } else {
        if (!formData.name.trim() || !formData.orgId || !formData.projectId) return;
        if (editFileId) {
          await dockerApi.updateFile({
            id: editFileId,
            name: formData.name.trim(),
            type: formData.type,
            content: formData.content,
            description: formData.description,
            projectId: Number(formData.projectId)
          });
        } else {
          const res = await dockerApi.createFile({
            name: formData.name.trim(),
            type: formData.type,
            content: formData.content,
            description: formData.description,
            projectId: Number(formData.projectId)
          });
          if(res.code === 0 && res.data) {
             setSelectedFileId(res.data.id);
          }
          setExpandedOrgs(prev => new Set([...prev, Number(formData.orgId)]));
          setExpandedProjects(prev => new Set([...prev, Number(formData.projectId)]));
        }
      }
      setIsFormOpen(false);
      loadData(); // reload entire tree
    } catch (e) {
      console.error("Save error", e);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    try {
      if (type === 'org') {
        await dockerApi.deleteOrg(id);
        if (selectedFile && selectedFile.org.id === id) setSelectedFileId(null);
      } else if (type === 'project') {
        await dockerApi.deleteProject(id);
        if (selectedFile && selectedFile.project.id === id) setSelectedFileId(null);
      } else {
        await dockerApi.deleteFile(id);
        if (selectedFileId === id) setSelectedFileId(null);
      }
      setDeleteConfirm(null);
      loadData();
    } catch(e) {
      console.error("Delete err", e);
    }
  };

  // Search filter
  const matchesSearch = useCallback((file: DockerFile) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return file.name.toLowerCase().includes(q) ||
      file.description?.toLowerCase().includes(q) ||
      file.content?.toLowerCase().includes(q);
  }, [searchQuery]);

  // Stats
  const stats = useMemo(() => {
    let total = 0, dockerfiles = 0, composes = 0;
    orgs.forEach(o => o.projects?.forEach(p => p.files?.forEach(f => {
      total++;
      if (f.type === 'dockerfile') dockerfiles++;
      else composes++;
    })));
    return { total, dockerfiles, composes, orgs: orgs.length, projects: orgs.reduce((a, o) => a + (o.projects?.length || 0), 0) };
  }, [orgs]);

  // Fallback to avoid empty fields due to late loading
  const safeDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-');
  };

  return (
    <div className="fixed inset-0 bg-[#07080C] text-slate-200 flex flex-col font-sans overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] rounded-full bg-blue-500/8 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/6 blur-[120px] pointer-events-none" />

      {/* ─── Header ─── */}
      <header className="h-16 border-b border-white/5 bg-[#0A0C14]/80 flex-shrink-0 flex items-center justify-between px-6 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <Box className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-violet-400 leading-tight">
                Docker 文件管理
              </h1>
              <p className="text-[11px] text-slate-500 leading-tight">
                {stats.orgs} 个组织 · {stats.projects} 个项目 · {stats.total} 个文件
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 flex justify-center max-w-md mx-6">
          <div className="relative group w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文件名、内容..."
              className="w-full pl-10 pr-4 py-2 bg-[#12141E] border border-white/5 focus:border-blue-500/40 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => openNewFileForm()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white font-medium transition-all text-sm shadow-lg shadow-blue-500/20 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">新建文件</span>
        </button>
      </header>

      {/* ─── Main Layout ─── */}
      <div className="flex-1 flex overflow-hidden z-10">

        {/* ─── Left: Tree Sidebar ─── */}
        <aside className="w-64 border-r border-white/5 bg-[#0A0C14]/50 flex flex-col flex-shrink-0">
          {/* Tree Header */}
          <div className="py-3 px-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider">项目结构</span>
            <button
              onClick={openNewOrgForm}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
              title="新建组织"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tree Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
            {orgs.map(org => {
              const isOrgExpanded = expandedOrgs.has(org.id);
              const hasMatchingFiles = (org.projects || []).some(p => (p.files || []).some(f => matchesSearch(f)));
              if (searchQuery && !hasMatchingFiles) return null;

              return (
                <div key={org.id} className="mb-1">
                  {/* Org Level */}
                  <div className="group flex items-center gap-1 px-3 py-2 hover:bg-white/[0.03] transition-colors cursor-pointer rounded-lg mx-1">
                    <button onClick={() => toggleOrg(org.id)} className="flex items-center flex-1 min-w-0 gap-1.5">
                      {isOrgExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />}
                      <Building2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-slate-200 truncate">{org.name}</span>
                    </button>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openNewProjectForm(org.id); }}
                        className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-blue-400 transition-colors" title="新建项目">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'org', id: org.id, name: org.name }); }}
                        className="p-1 rounded hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-colors" title="删除组织">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Projects */}
                  <AnimatePresence>
                    {isOrgExpanded && (org.projects || []).map(proj => {
                      const isProjExpanded = expandedProjects.has(proj.id);
                      const filteredFiles = (proj.files || []).filter(f => matchesSearch(f));
                      if (searchQuery && filteredFiles.length === 0) return null;

                      return (
                        <motion.div key={proj.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          {/* Project Level */}
                          <div className="group flex items-center gap-1 pl-7 pr-3 py-1.5 hover:bg-white/[0.03] transition-colors cursor-pointer rounded-lg mx-1">
                            <button onClick={() => toggleProject(proj.id)} className="flex items-center flex-1 min-w-0 gap-1.5">
                              {isProjExpanded ? <ChevronDown className="w-3 h-3 text-slate-500 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 text-slate-500 flex-shrink-0" />}
                              <FolderOpen className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                              <span className="text-[13px] text-slate-300 truncate">{proj.name}</span>
                              <span className="text-[10px] text-slate-600 ml-auto flex-shrink-0">{(proj.files || []).length}</span>
                            </button>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => { e.stopPropagation(); openNewFileForm(org.id, proj.id); }}
                                className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-blue-400 transition-colors" title="新建文件">
                                <Plus className="w-3 h-3" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'project', id: proj.id, name: proj.name }); }}
                                className="p-1 rounded hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-colors" title="删除项目">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Files */}
                          <AnimatePresence>
                            {isProjExpanded && filteredFiles.map(file => {
                              const fc = FILE_TYPE_CONFIG[file.type as 'dockerfile' | 'compose'] || FILE_TYPE_CONFIG.dockerfile;
                              const FileIcon = fc.icon;
                              const isActive = selectedFileId === file.id;

                              return (
                                <motion.div key={file.id}
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.1 }}
                                  className="overflow-hidden"
                                >
                                  <div
                                    onClick={() => setSelectedFileId(file.id)}
                                    className={`group flex items-center gap-2 pl-14 pr-3 py-1.5 cursor-pointer transition-all rounded-lg mx-1 ${
                                      isActive
                                        ? 'bg-blue-500/10 border border-blue-500/20'
                                        : 'hover:bg-white/[0.03] border border-transparent'
                                    }`}
                                  >
                                    <FileIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? fc.color : 'text-slate-500'}`} />
                                    <span className={`text-[13px] truncate flex-1 ${isActive ? 'text-blue-400 font-medium' : 'text-slate-400'}`}>
                                      {file.name}
                                    </span>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={(e) => { e.stopPropagation(); openEditFileForm(file, org.id, proj.id); }}
                                        className="p-0.5 rounded hover:bg-white/10 text-slate-500 hover:text-blue-400 transition-colors" title="编辑">
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'file', id: file.id, name: file.name }); }}
                                        className="p-0.5 rounded hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-colors" title="删除">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              );
            })}

            {orgs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                <Building2 className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-xs">暂无组织</p>
              </div>
            )}
          </div>
        </aside>

        {/* ─── Right: Detail / Editor ─── */}
        <section className="flex-1 flex flex-col overflow-hidden bg-[#0A0C14]/20">
          {selectedFile ? (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Detail Header */}
              <div ref={detailHeaderRef} className="px-6 py-4 border-b border-white/5 bg-[#0D0F18]/50 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                      <Building2 className="w-3 h-3 text-amber-400" />
                      <span>{selectedFile.org.name}</span>
                      <ChevronRight className="w-3 h-3" />
                      <FolderOpen className="w-3 h-3 text-blue-400" />
                      <span>{selectedFile.project.name}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span className={FILE_TYPE_CONFIG[selectedFile.file.type as 'dockerfile' | 'compose']?.color || ''}>
                        {selectedFile.file.name}
                      </span>
                    </div>

                    {/* Title + Type Badge */}
                    <div className="flex items-center gap-3 mb-1">
                      <input
                        type="text"
                        value={selectedFile.file.name}
                        onChange={e => autoSave(selectedFile.file.id, 'name', e.target.value)}
                        className="text-xl font-bold text-slate-100 bg-transparent outline-none border-b border-transparent hover:border-white/10 focus:border-blue-500/50 transition-colors flex-1 min-w-0"
                        placeholder="文件名称"
                      />
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium flex-shrink-0 ${FILE_TYPE_CONFIG[selectedFile.file.type as 'dockerfile' | 'compose']?.bg} ${FILE_TYPE_CONFIG[selectedFile.file.type as 'dockerfile'|'compose']?.color} ${FILE_TYPE_CONFIG[selectedFile.file.type as 'dockerfile'|'compose']?.border}`}>
                        {FILE_TYPE_CONFIG[selectedFile.file.type as 'dockerfile'|'compose']?.label}
                      </span>
                    </div>

                    {/* Description */}
                    <input
                      type="text"
                      value={selectedFile.file.description}
                      onChange={e => autoSave(selectedFile.file.id, 'description', e.target.value)}
                      className="text-sm text-slate-400 bg-transparent outline-none w-full leading-relaxed border-b border-transparent hover:border-white/10 focus:border-blue-500/30 transition-colors"
                      placeholder="添加描述..."
                    />

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{safeDate(selectedFile.file.UpdatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <SaveStatusIndicator status={saveStatus} />
                    <button onClick={() => openEditFileForm(selectedFile.file, selectedFile.org.id, selectedFile.project.id)} title="编辑文件"
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleCopy(selectedFile.file.content)} title="复制内容"
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
                  style={{ height: `calc(100vh - ${64 + detailHeaderHeight + 24}px)` }}>
                  <Editor
                    height="100%"
                    language={FILE_TYPE_CONFIG[selectedFile.file.type as 'dockerfile'|'compose']?.monacoLang || 'dockerfile'}
                    value={selectedFile.file.content}
                    onChange={v => autoSave(selectedFile.file.id, 'content', v || '')}
                    theme="vs-dark"
                    options={{
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
                      minimap: { enabled: false },
                      scrollBeyondLastLine: true,
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
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Box className="w-14 h-14 mb-4 opacity-10" />
              <p className="text-sm mb-1">选择一个文件查看内容</p>
              <p className="text-xs text-slate-600">在左侧树中展开项目并选择文件</p>
            </div>
          )}
        </section>
      </div>

      {/* ─── Form Modal ─── */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsFormOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#12141E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    {formMode === 'org' ? <Building2 className="w-5 h-5 text-amber-400" /> :
                     formMode === 'project' ? <FolderOpen className="w-5 h-5 text-blue-400" /> :
                     <FileCode2 className="w-5 h-5 text-blue-400" />}
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {formMode === 'org' ? '新建组织' :
                     formMode === 'project' ? '新建项目' :
                     editFileId ? '编辑文件' : '新建文件'}
                  </h3>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    {formMode === 'org' ? '组织名称' : formMode === 'project' ? '项目名称' : '文件名称'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder={formMode === 'org' ? '例：国能集团' : formMode === 'project' ? '例：智慧能源平台' : '例：前端 Dockerfile'}
                    className="w-full px-4 py-2.5 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>

                {/* File-specific fields */}
                {formMode === 'file' && (
                  <>
                    {/* Org + Project selects */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">所属组织</label>
                        <select
                          value={formData.orgId}
                          onChange={e => setFormData({ ...formData, orgId: Number(e.target.value), projectId: 0 })}
                          className="w-full px-4 py-2.5 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                        >
                          <option value={0} disabled>选择组织...</option>
                          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">所属项目</label>
                        <select
                          value={formData.projectId}
                          onChange={e => setFormData({ ...formData, projectId: Number(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                        >
                          <option value={0} disabled>选择项目...</option>
                          {orgs.find(o => o.id === Number(formData.orgId))?.projects?.map(p =>
                            <option key={p.id} value={p.id}>{p.name}</option>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">文件类型</label>
                      <div className="flex gap-2">
                        {(['dockerfile', 'compose'] as const).map(t => {
                          const tc = FILE_TYPE_CONFIG[t];
                          return (
                            <button key={t} onClick={() => setFormData({ ...formData, type: t })}
                              className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                                formData.type === t
                                  ? `${tc.bg} ${tc.color} ${tc.border}`
                                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                              }`}>
                              {tc.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">描述</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="简要描述此文件的用途..."
                        className="w-full px-4 py-2.5 bg-[#07080C] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">文件内容</label>
                      <textarea
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                        placeholder="粘贴你的 Dockerfile / docker-compose.yml 内容..."
                        rows={12}
                        className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-sm font-mono text-blue-300 placeholder-slate-700 outline-none focus:border-blue-500/50 transition-all resize-none leading-relaxed"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 flex-shrink-0">
                <button onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">
                  取消
                </button>
                <button
                  onClick={handleFormSave}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20"
                >
                  {editFileId ? '保存修改' : '确认创建'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirm ─── */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#12141E] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-red-500/10">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">确认删除</h3>
              </div>
              <p className="text-sm text-slate-400 mb-1">
                确定要删除{deleteConfirm.type === 'org' ? '组织' : deleteConfirm.type === 'project' ? '项目' : '文件'}
                「<span className="text-white font-medium">{deleteConfirm.name}</span>」吗？
              </p>
              {deleteConfirm.type !== 'file' && (
                <p className="text-xs text-red-400/80 mb-4">⚠ 这将同时删除其下所有{deleteConfirm.type === 'org' ? '项目和文件' : '文件'}</p>
              )}
              {deleteConfirm.type === 'file' && <div className="mb-4" />}
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
}
