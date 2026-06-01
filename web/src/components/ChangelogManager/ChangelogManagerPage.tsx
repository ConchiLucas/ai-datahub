import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ScrollText, Search, Plus, Edit2, Trash2, Clock, X, Copy, Check,
  FolderOpen, ChevronDown, Sparkles, Bug, Wrench, Zap, RefreshCw, ArrowUpCircle,
  Tag, Calendar, GitCommit, MoreVertical
} from 'lucide-react';
import * as ChangelogApi from '@/api/changelog';

// ─── Types ───────────────────────────
type ChangeType = 'feature' | 'fix' | 'refactor' | 'perf' | 'style' | 'docs' | 'other';

interface LogEntry {
  id: number;
  projectId: number;
  version: string;
  description: string;
  changeType: ChangeType;
  date: string;
  details: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  logs: LogEntry[];
  createdAt: string;
}

// ─── Helpers ─────────────────────────
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function useCopy() {
  const [k, setK] = useState<number | null>(null);
  const cp = useCallback((t: string, key: number) => { navigator.clipboard.writeText(t); setK(key); setTimeout(() => setK(null), 1500); }, []);
  return { k, cp };
}

const CHANGE_TYPE_CFG: Record<ChangeType, { label: string; icon: any; cls: string; bg: string; border: string }> = {
  feature:  { label: '新功能', icon: Sparkles,       cls: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  fix:      { label: '修复',   icon: Bug,             cls: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/20' },
  refactor: { label: '重构',   icon: RefreshCw,       cls: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/20' },
  perf:     { label: '优化',   icon: Zap,             cls: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20' },
  style:    { label: '样式',   icon: Wrench,          cls: 'text-purple-400',  bg: 'bg-purple-400/10',  border: 'border-purple-400/20' },
  docs:     { label: '文档',   icon: ScrollText,      cls: 'text-cyan-400',    bg: 'bg-cyan-400/10',    border: 'border-cyan-400/20' },
  other:    { label: '其他',   icon: ArrowUpCircle,   cls: 'text-slate-400',   bg: 'bg-slate-400/10',   border: 'border-slate-400/20' },
};

// ═══════════════════════════════════════
export default function ChangelogManagerPage() {
  const navigate = useNavigate();
  const { k: copiedKey, cp } = useCopy();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ChangeType | 'all'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Project form
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  // Log form
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const [editLog, setEditLog] = useState<LogEntry | null>(null);
  const [logVersion, setLogVersion] = useState('');
  const [logDesc, setLogDesc] = useState('');
  const [logDetails, setLogDetails] = useState('');
  const [logType, setLogType] = useState<ChangeType>('feature');
  const [logDate, setLogDate] = useState(todayStr());

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'project' | 'log'; id: number } | null>(null);

  // Context menu
  const [contextMenuLogId, setContextMenuLogId] = useState<number | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await ChangelogApi.getProjectWithLogsList({ page: 1, pageSize: 999 }) as any;
      if (res.code === 0) {
        setProjects(res.data.list || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId) || null, [projects, selectedProjectId]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    if (!selectedProject) return [];
    let logs = selectedProject.logs;
    if (filterType !== 'all') logs = logs.filter(l => l.changeType === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      logs = logs.filter(l =>
        l.description.toLowerCase().includes(q) || l.version.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q)
      );
    }
    return logs.sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedProject, filterType, searchQuery]);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, LogEntry[]> = {};
    filteredLogs.forEach(log => {
      if (!groups[log.date]) groups[log.date] = [];
      groups[log.date].push(log);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredLogs]);

  // ─── Project CRUD ──────────────────
  const openProjectForm = (proj?: Project) => {
    if (proj) {
      setEditProject(proj); setProjectName(proj.name); setProjectDesc(proj.description);
    } else {
      setEditProject(null); setProjectName(''); setProjectDesc('');
    }
    setIsProjectFormOpen(true);
  };

  const submitProject = async () => {
    if (!projectName.trim()) return;
    try {
      if (editProject) {
        await ChangelogApi.updateProject({ id: editProject.id, name: projectName.trim(), description: projectDesc.trim() });
      } else {
        await ChangelogApi.createProject({ name: projectName.trim(), description: projectDesc.trim() });
      }
      fetchProjects();
      setIsProjectFormOpen(false);
    } catch {}
  };

  // ─── Log CRUD ──────────────────────
  const openLogForm = (log?: LogEntry) => {
    if (log) {
      setEditLog(log); setLogVersion(log.version); setLogDesc(log.description);
      setLogDetails(log.details); setLogType(log.changeType); setLogDate(log.date);
    } else {
      setEditLog(null); setLogVersion(''); setLogDesc('');
      setLogDetails(''); setLogType('feature'); setLogDate(todayStr());
    }
    setIsLogFormOpen(true);
  };

  const submitLog = async () => {
    if (!logDesc.trim() || !selectedProjectId) return;
    try {
      if (editLog) {
        await ChangelogApi.updateLog({
          id: editLog.id, projectId: selectedProjectId, version: logVersion.trim(),
          description: logDesc.trim(), changeType: logType, date: logDate, details: logDetails.trim()
        });
      } else {
        await ChangelogApi.createLog({
          projectId: selectedProjectId, version: logVersion.trim(),
          description: logDesc.trim(), changeType: logType, date: logDate, details: logDetails.trim()
        });
      }
      fetchProjects();
      setIsLogFormOpen(false);
    } catch {}
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'project') {
        await ChangelogApi.deleteProject({ id: deleteTarget.id });
        if (selectedProjectId === deleteTarget.id) setSelectedProjectId(null);
      } else {
        await ChangelogApi.deleteLog({ id: deleteTarget.id });
      }
      fetchProjects();
      setDeleteTarget(null);
    } catch {}
  };

  const formatDateLabel = (dateStr: string) => {
    const today = todayStr();
    const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
    if (dateStr === today) return '今天';
    if (dateStr === yesterday) return '昨天';
    return dateStr;
  };

  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[50%] h-[350px] bg-indigo-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-[#0F111A]/80 flex-shrink-0 flex items-center justify-between px-5 z-20 backdrop-blur-xl gap-3">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400"><ScrollText className="w-5 h-5" /></div>
            <div>
              <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">日志管理</h1>
              <p className="text-[10px] text-slate-500">{projects.reduce((s, p) => s + p.logs.length, 0)} 条变更记录</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-center max-w-2xl mx-3 gap-2">
          {/* Type Filter Dropdown */}
          <div className="relative">
            <button onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-[#151926]/90 border border-white/10 rounded-xl text-sm text-slate-300 hover:bg-white/5 transition-all focus:outline-none focus:border-indigo-500/50 whitespace-nowrap">
              <span className="text-slate-400">
                {filterType === 'all' ? '全部类型' : CHANGE_TYPE_CFG[filterType].label}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 mt-1.5 w-36 bg-[#12141D] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 py-1">
                    <button onClick={() => { setFilterType('all'); setIsFilterOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors ${filterType === 'all' ? 'text-white bg-white/5' : 'text-slate-400'}`}>
                      全部类型
                    </button>
                    {(Object.entries(CHANGE_TYPE_CFG) as [ChangeType, typeof CHANGE_TYPE_CFG[ChangeType]][]).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      return (
                        <button key={key} onClick={() => { setFilterType(key); setIsFilterOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors ${filterType === key ? `${cfg.cls} ${cfg.bg}` : 'text-slate-400'}`}>
                          <Icon className="w-3.5 h-3.5" />{cfg.label}
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索变更记录..."
              className="pl-10 pr-4 py-2 w-full bg-[#151926]/90 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500/50 placeholder-slate-500" />
          </div>
        </div>

        <button onClick={() => { if (selectedProjectId) openLogForm(); }}
          disabled={!selectedProjectId}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90 text-sm shadow-lg shadow-indigo-500/20 flex-shrink-0 disabled:opacity-40">
          <Plus className="w-4 h-4" />记录变更
        </button>
      </header>

      <main className="flex-1 flex min-h-0 overflow-hidden z-10">
        {/* Left Sidebar: Projects */}
        <aside className="w-[260px] flex-shrink-0 border-r border-white/5 bg-[#0A0C14]/60 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">项目列表</span>
            <button onClick={() => openProjectForm()}
              className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors" title="新建项目">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
            {projects.map(proj => {
              const isActive = selectedProjectId === proj.id;
              return (
                <div key={proj.id}
                  className={`group relative flex items-start gap-2.5 px-3 py-3 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-indigo-500/10' : 'hover:bg-white/[0.03]'}`}>
                  <div className="flex-1 min-w-0" onClick={() => setSelectedProjectId(proj.id)}>
                    <div className="flex items-center gap-2 mb-1">
                      <FolderOpen className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <h3 className={`text-sm font-medium leading-tight truncate ${isActive ? 'text-slate-100' : 'text-slate-300'}`}>{proj.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 pl-[22px]">
                      <span className="text-[9px] text-slate-600">{proj.logs.length} 条日志</span>
                      {proj.logs.length > 0 && (
                        <span className="text-[9px] text-slate-600">· {proj.logs[0]?.version || ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                    <button onClick={(e) => { e.stopPropagation(); openProjectForm(proj); }}
                      className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition-colors"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'project', id: proj.id }); }}
                      className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              );
            })}
            {projects.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs">
                <FolderOpen className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>暂无项目</p>
              </div>
            )}
          </div>
        </aside>

        {/* Right: Timeline */}
        <section className="flex-1 flex flex-col overflow-hidden bg-[#0A0C14]/20 relative">
          {selectedProject ? (
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {/* Project Header */}
              <div className="sticky top-0 z-10 bg-[#0A0C14]/90 backdrop-blur-md border-b border-white/5 px-8 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-indigo-400" />{selectedProject.name}
                    </h2>
                    {selectedProject.description && <p className="text-xs text-slate-500 mt-1 ml-7">{selectedProject.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><GitCommit className="w-3.5 h-3.5" />{selectedProject.logs.length} 条</span>
                    {selectedProject.logs.length > 0 && (
                      <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />{selectedProject.logs[0].version}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline Content */}
              <div className="px-8 py-6">
                <div className="max-w-4xl mx-auto">
                  {groupedLogs.length > 0 ? (
                    <div className="relative">
                      {/* Timeline center line */}
                      <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/30 via-white/5 to-transparent" />

                      {groupedLogs.map(([date, logs], gi) => (
                        <div key={date} className="mb-8">
                          {/* Date header */}
                          <div className="flex items-center gap-3 mb-4 relative">
                            <div className="w-[37px] flex justify-center flex-shrink-0">
                              <div className="w-3 h-3 rounded-full bg-indigo-500/20 border-2 border-indigo-400/60" />
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="font-semibold text-indigo-400">{formatDateLabel(date)}</span>
                              <span className="text-slate-600">{date}</span>
                              <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-500">{logs.length} 条变更</span>
                            </div>
                          </div>

                          {/* Log cards for this date */}
                          <div className="space-y-3 ml-[37px]">
                            {logs.map((log, li) => {
                              const cfg = CHANGE_TYPE_CFG[log.changeType];
                              const TypeIcon = cfg.icon;
                              return (
                                <motion.div key={log.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: gi * 0.05 + li * 0.03 }}
                                  className="group relative bg-[#0D0F18]/80 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.border} ${cfg.cls} font-medium`}>
                                          <TypeIcon className="w-3 h-3" />{cfg.label}
                                        </span>
                                        {log.version && (
                                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5 font-mono">
                                            <Tag className="w-3 h-3" />{log.version}
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="text-sm font-medium text-slate-200 mb-1">{log.description}</h4>
                                      {log.details && (
                                        <p className="text-xs text-slate-500 leading-relaxed mt-2">{log.details}</p>
                                      )}
                                    </div>
                                    <div className="relative flex-shrink-0">
                                      <button onClick={() => setContextMenuLogId(contextMenuLogId === log.id ? null : log.id)}
                                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all">
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                      <AnimatePresence>
                                        {contextMenuLogId === log.id && (
                                          <>
                                            <div className="fixed inset-0 z-40" onClick={() => setContextMenuLogId(null)} />
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                              className="absolute right-0 top-full mt-1 w-28 bg-[#12141D] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 py-1">
                                              <button onClick={() => { setContextMenuLogId(null); openLogForm(log); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 transition-colors"><Edit2 className="w-3 h-3" />编辑</button>
                                              <button onClick={() => { setContextMenuLogId(null); cp(`${log.version ? `[${log.version}] ` : ''}${log.description}${log.details ? '\n' + log.details : ''}`, log.id); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 transition-colors">
                                                {copiedKey === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                {copiedKey === log.id ? '已复制' : '复制'}
                                              </button>
                                              <button onClick={() => { setContextMenuLogId(null); setDeleteTarget({ type: 'log', id: log.id }); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 className="w-3 h-3" />删除</button>
                                            </motion.div>
                                          </>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                      <GitCommit className="w-16 h-16 mb-6 opacity-10" />
                      <p className="text-base font-medium mb-1 text-slate-400">暂无变更记录</p>
                      <p className="text-sm text-slate-600">点击右上角「记录变更」开始</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <ScrollText className="w-16 h-16 mb-6 opacity-10" />
              <p className="text-base font-medium mb-1 text-slate-400">选择一个项目以查看变更日志</p>
              <p className="text-sm text-slate-600">或点击左上角 + 新建项目</p>
            </div>
          )}
        </section>
      </main>

      {/* ─── Project Form Modal ─── */}
      <AnimatePresence>
        {isProjectFormOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsProjectFormOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-[#12141D] border border-white/10 rounded-2xl shadow-2xl pointer-events-auto">
                <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-indigo-400" />{editProject ? '编辑项目' : '新建项目'}
                  </h2>
                  <button onClick={() => setIsProjectFormOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">项目名称 *</label>
                    <input value={projectName} onChange={e => setProjectName(e.target.value)} autoFocus
                      className="w-full bg-[#1A1D2D] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors" placeholder="如：AI 文件导航" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">项目描述</label>
                    <input value={projectDesc} onChange={e => setProjectDesc(e.target.value)}
                      className="w-full bg-[#1A1D2D] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors" placeholder="简要描述项目..." />
                  </div>
                </div>
                <div className="border-t border-white/5 p-6 flex justify-end gap-3">
                  <button onClick={() => setIsProjectFormOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">取消</button>
                  <button onClick={submitProject} disabled={!projectName.trim()}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:opacity-90 disabled:opacity-40 shadow-lg shadow-indigo-500/20 transition-all">
                    {editProject ? '保存' : '创建'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Log Form Modal ─── */}
      <AnimatePresence>
        {isLogFormOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsLogFormOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl bg-[#12141D] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin pointer-events-auto flex flex-col">
                <div className="sticky top-0 bg-[#12141D]/90 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between z-10 flex-shrink-0">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <GitCommit className="w-5 h-5 text-indigo-400" />{editLog ? '编辑变更' : '记录变更'}
                  </h2>
                  <button onClick={() => setIsLogFormOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">版本号</label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input value={logVersion} onChange={e => setLogVersion(e.target.value)}
                          className="w-full bg-[#1A1D2D] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500/50 transition-colors" placeholder="如：v2.4.0" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">日期</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
                          className="w-full bg-[#1A1D2D] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors [color-scheme:dark]" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">变更类型</label>
                    <div className="flex flex-wrap gap-2">
                      {(Object.entries(CHANGE_TYPE_CFG) as [ChangeType, typeof CHANGE_TYPE_CFG[ChangeType]][]).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        return (
                          <button key={key} type="button" onClick={() => setLogType(key)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${logType === key ? `${cfg.bg} ${cfg.border} ${cfg.cls}` : 'text-slate-500 bg-[#1A1D2D] border-white/5 hover:bg-white/5'}`}>
                            <Icon className="w-3.5 h-3.5" />{cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">变更描述 *</label>
                    <input value={logDesc} onChange={e => setLogDesc(e.target.value)}
                      className="w-full bg-[#1A1D2D] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors" placeholder="一句话总结变更内容" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">详细说明</label>
                    <textarea value={logDetails} onChange={e => setLogDetails(e.target.value)}
                      className="w-full bg-[#1A1D2D] border border-white/10 rounded-xl px-4 py-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 resize-none transition-colors"
                      rows={4} placeholder="变更的详细内容、影响范围等..." />
                  </div>
                </div>
                <div className="sticky bottom-0 bg-[#12141D]/90 backdrop-blur-md border-t border-white/5 p-6 flex justify-end gap-3 flex-shrink-0">
                  <button onClick={() => setIsLogFormOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">取消</button>
                  <button onClick={submitLog} disabled={!logDesc.trim()}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:opacity-90 disabled:opacity-40 shadow-lg shadow-indigo-500/20 transition-all">
                    {editLog ? '保存修改' : '确认记录'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirm ─── */}
      <AnimatePresence>
        {deleteTarget !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-red-500/10"><Trash2 className="w-6 h-6 text-red-500" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">确认删除</h3>
                    <p className="text-xs text-slate-500 mt-1">此操作不可恢复</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 mb-6 bg-white/5 p-3 rounded-lg border border-white/5">
                  确定要删除这{deleteTarget.type === 'project' ? '个项目及其所有日志' : '条变更记录'}吗？
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">取消</button>
                  <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all">确认删除</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
