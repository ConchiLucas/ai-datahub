import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { progressApi, ProgressProject, ProgressFeature, FeatureStatus, Priority } from '@/api/progress';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft, BarChart3, Search, Plus, Edit2, Trash2, Clock, Check, X,
  CircleDashed, Loader2, CheckCircle2,
  ChevronDown, ChevronRight, Minus, Flag
} from 'lucide-react';

const STATUS_CONFIG: Record<FeatureStatus, { label: string; icon: any; cls: string; bg: string; order: number }> = {
  in_progress: { label: '开发中', icon: Loader2,       cls: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/20',    order: 0 },
  todo:        { label: '待开发', icon: CircleDashed,   cls: 'text-slate-400',   bg: 'bg-slate-400/10 border-slate-400/20',  order: 1 },
  done:        { label: '已完成', icon: CheckCircle2,   cls: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', order: 2 },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; cls: string; dot: string }> = {
  high:   { label: '高', cls: 'text-red-400 bg-red-400/10 border-red-400/20',     dot: 'bg-red-400' },
  medium: { label: '中', cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20', dot: 'bg-amber-400' },
  low:    { label: '低', cls: 'text-slate-400 bg-slate-400/10 border-slate-400/20',  dot: 'bg-slate-400' },
};

const STATUS_ORDER: FeatureStatus[] = ['in_progress', 'todo', 'done'];

function formatTime(t: string | undefined) {
  if (!t) return '';
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ─── Progress Ring ───────────────────
function ProgressRing({ percent, size = 48, stroke = 4, textSize = 'text-xs' }: { percent: number; size?: number; stroke?: number; textSize?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 100 ? '#34d399' : percent >= 60 ? '#38bdf8' : percent >= 30 ? '#fbbf24' : '#94a3b8';
  return (
    <div className="relative inline-flex items-center justify-center p-0.5" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 origin-center absolute inset-0">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-500" />
      </svg>
      <span className={`relative z-10 ${textSize} font-bold select-none`} style={{ color }}>{Math.round(percent)}%</span>
    </div>
  );
}

// ─── Progress Bar ────────────────────
function ProgressBar({ percent, height = 6 }: { percent: number; height?: number }) {
  const color = percent >= 100 ? 'bg-emerald-400' : percent >= 60 ? 'bg-blue-400' : percent >= 30 ? 'bg-amber-400' : 'bg-slate-400';
  return (
    <div className="w-full bg-white/5 rounded-full overflow-hidden" style={{ height }}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  );
}

// ─── Draggable Progress Bar ─────────
function DraggableProgress({ percent, onChange }: { percent: number; onChange: (p: number) => void }) {
  const barRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [previewPercent, setPreviewPercent] = useState<number | null>(null);
  
  const getPercentFromClientX = (clientX: number) => {
    if (!barRef.current) return percent;
    const rect = barRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const rawPercent = Math.round((x / rect.width) * 100 / 5) * 5; // snap to 5%
    return Math.max(0, Math.min(100, rawPercent));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPreviewPercent(getPercentFromClientX(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging.current && e.buttons === 1) { // Left mouse button is pressed and we started drag here
      setPreviewPercent(getPercentFromClientX(e.clientX));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging.current) {
      const finalPercent = getPercentFromClientX(e.clientX);
      if (finalPercent !== percent) {
        onChange(finalPercent);
      }
    }
    isDragging.current = false;
    setPreviewPercent(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const displayPercent = previewPercent !== null ? previewPercent : percent;
  const color = displayPercent >= 100 ? 'bg-emerald-400' : displayPercent >= 60 ? 'bg-blue-400' : displayPercent >= 30 ? 'bg-amber-400' : 'bg-slate-400';

  return (
    <div 
      className="flex-1 relative cursor-pointer py-3 -my-2 flex items-center group/progress touch-none"
      ref={barRef}
      draggable={true}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      title={`拖拽调整进度 (当前 ${displayPercent}%)`}
    >
      <div className="w-full bg-white/5 rounded-full overflow-hidden h-[6px] group-hover/progress:h-[8px] transition-all">
        <div
          className={`h-full rounded-full transition-all duration-75 ${color}`}
          style={{ width: `${Math.min(displayPercent, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Compute group stats from children ──
function computeGroupStats(feat: ProgressFeature) {
  const children = feat.children || [];
  if (children.length === 0) return { percent: feat.progress, done: feat.status === 'done' ? 1 : 0, total: 1 };
  const total = children.length;
  const done = children.filter(c => c.status === 'done').length;
  const percent = Math.round(children.reduce((s, c) => s + c.progress, 0) / total);
  return { percent, done, total };
}

export default function ProgressManagerPage() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProgressProject[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const hasInitializedExpansion = useRef(false);

  // Drag state - feature rows
  const [draggedFeatId, setDraggedFeatId] = useState<number | null>(null);
  const [dragOverFeatId, setDragOverFeatId] = useState<number | null>(null);

  // Drag state - project list
  const [draggedProjIndex, setDraggedProjIndex] = useState<number | null>(null);
  const [dragOverProjIndex, setDragOverProjIndex] = useState<number | null>(null);

  // Modals
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProgressProject | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  const [isFeatureFormOpen, setIsFeatureFormOpen] = useState(false);
  const [editFeature, setEditFeature] = useState<ProgressFeature | null>(null);
  const [featureParentId, setFeatureParentId] = useState<number>(0);
  const [featureName, setFeatureName] = useState('');
  const [featureDesc, setFeatureDesc] = useState('');
  const [featurePriority, setFeaturePriority] = useState<Priority>('medium');
  const [featureProgress, setFeatureProgress] = useState(0);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'project' | 'feature'; id: number } | null>(null);

  // Load backend data
  const fetchData = async () => {
    try {
      const res = await progressApi.getProjectList();
      if (res.code === 0) {
        setProjects(res.data || []);
        if (selectedId === null && res.data && res.data.length > 0) {
          setSelectedId(res.data[0].id);
        }
        
        if (!hasInitializedExpansion.current && res.data) {
          const toExpand = new Set<number>();
          res.data.forEach(p => p.features?.forEach(f => {
            if (f.children && f.children.length > 0) toExpand.add(f.id);
          }));
          setExpandedGroups(toExpand);
          hasInitializedExpansion.current = true;
        }
      }
    } catch (e: any) {
      toast.error('获取项目失败');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.features || []).some(f => f.name.toLowerCase().includes(q)));
  }, [projects, searchQuery]);

  // ─── Project Drag Handlers ────────────────────────────────
  const handleProjDragStart = (e: React.DragEvent, index: number) => {
    setDraggedProjIndex(index);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  };

  const handleProjDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedProjIndex === null || draggedProjIndex === index) return;
    setDragOverProjIndex(index);
  };

  const handleProjDragEnd = () => {
    setDraggedProjIndex(null);
    setDragOverProjIndex(null);
  };

  const handleProjDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedProjIndex === null || draggedProjIndex === index) {
      setDraggedProjIndex(null);
      setDragOverProjIndex(null);
      return;
    }
    const list = [...filtered];
    const [item] = list.splice(draggedProjIndex, 1);
    list.splice(index, 0, item);
    // Optimistic update
    setProjects(prev => {
      const updated = list.map((p, i) => ({ ...p, sort: i }));
      // Merge back any projects not in filtered
      const filteredIds = new Set(list.map(p => p.id));
      const rest = prev.filter(p => !filteredIds.has(p.id));
      return [...updated, ...rest];
    });
    setDraggedProjIndex(null);
    setDragOverProjIndex(null);
    // Sync to backend
    try {
      await Promise.all(list.map((p, i) => {
        if ((p.sort ?? 999) !== i) {
          return progressApi.updateProject({ id: p.id, name: p.name, description: p.description, sort: i });
        }
        return Promise.resolve();
      }));
    } catch {
      toast.error('排序失败');
      fetchData();
    }
  };

  const selected = useMemo(() => projects.find(p => p.id === selectedId) || null, [projects, selectedId]);

  // Project stats - count all features including children
  const getProjectStats = useCallback((proj: ProgressProject) => {
    const defaultRes = { percent: 0, done: 0, total: 0 };
    if (!proj.features || proj.features.length === 0) return defaultRes;
    // Flatten: features are top-level groups, count children as the real tasks
    let allTasks: ProgressFeature[] = [];
    for (const feat of proj.features) {
      if (feat.children && feat.children.length > 0) {
        allTasks.push(...feat.children);
      } else {
        allTasks.push(feat);
      }
    }
    if (allTasks.length === 0) return defaultRes;
    const total = allTasks.length;
    const done = allTasks.filter(f => f.status === 'done').length;
    const percent = Math.round(allTasks.reduce((s, f) => s + f.progress, 0) / total);
    return { percent, done, total };
  }, []);

  // Sort top-level features by ID to maintain stable order
  const sortedFeatures = useMemo(() => {
    if (!selected || !selected.features) return [];
    return [...selected.features].sort((a, b) => a.id - b.id);
  }, [selected]);

  // Toggle group expand
  const toggleGroup = (id: number) => setExpandedGroups(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  // ─── Project CRUD ──────────────
  const openProjectForm = (proj?: ProgressProject) => {
    if (proj) { setEditProject(proj); setProjectName(proj.name); setProjectDesc(proj.description); }
    else { setEditProject(null); setProjectName(''); setProjectDesc(''); }
    setIsProjectFormOpen(true);
  };

  const submitProject = async () => {
    if (!projectName.trim()) return;
    try {
      if (editProject) {
        await progressApi.updateProject({ id: editProject.id, name: projectName, description: projectDesc });
        toast.success('更新成功');
      } else {
        const res = await progressApi.createProject({ name: projectName, description: projectDesc });
        if (res.code === 0) toast.success('创建成功');
      }
      setIsProjectFormOpen(false);
      fetchData();
    } catch (e) {
      toast.error(editProject ? '更新失败' : '创建失败');
    }
  };

  // ─── Feature CRUD ─────────────
  const openFeatureForm = (feat?: ProgressFeature, parentId: number = 0) => {
    if (feat) {
      setEditFeature(feat);
      setFeatureName(feat.name);
      setFeatureDesc(feat.description);
      setFeaturePriority(feat.priority);
      setFeatureProgress(feat.progress);
      setFeatureParentId(feat.parentId || 0);
    } else {
      setEditFeature(null);
      setFeatureName('');
      setFeatureDesc('');
      setFeaturePriority('medium');
      setFeatureProgress(parentId ? 0 : 0);
      setFeatureParentId(parentId);
    }
    setIsFeatureFormOpen(true);
  };

  const submitFeature = async () => {
    if (!featureName.trim() || !selected) return;
    // If editing a parent that has children, don't send progress - it's auto-computed
    const isParentWithChildren = editFeature && editFeature.children && editFeature.children.length > 0;
    const progressToSend = isParentWithChildren ? editFeature.progress : featureProgress;
    const computedStatus = progressToSend === 0 ? 'todo' : progressToSend === 100 ? 'done' : 'in_progress';
    try {
      if (editFeature) {
        await progressApi.updateFeature({ id: editFeature.id, name: featureName, description: featureDesc, status: isParentWithChildren ? editFeature.status : computedStatus, priority: featurePriority, progress: progressToSend });
        toast.success('更新成功');
      } else {
        await progressApi.createFeature({ projectId: selected.id, parentId: featureParentId, name: featureName, description: featureDesc, status: computedStatus, priority: featurePriority, progress: featureProgress });
        toast.success('创建成功');
        // Auto-expand the parent group
        if (featureParentId) {
          setExpandedGroups(prev => new Set(prev).add(featureParentId));
        }
      }
      setIsFeatureFormOpen(false);
      fetchData();
    } catch (e) {
      toast.error(editFeature ? '更新失败' : '创建失败');
    }
  };

  const optimisticallyUpdateFeature = (featId: number, changes: Partial<ProgressFeature>) => {
    setProjects(prev => prev.map(p => ({
      ...p,
      features: (p.features || []).map(f => {
        if (f.id === featId) return { ...f, ...changes };
        if (f.children) {
          return {
            ...f,
            children: f.children.map(c => c.id === featId ? { ...c, ...changes } : c)
          };
        }
        return f;
      })
    })));
  };

  // Quick status change
  const quickChangeStatus = async (feat: ProgressFeature, newStatus: FeatureStatus) => {
    const newProgress = newStatus === 'done' ? 100 : newStatus === 'todo' ? 0 : 50;
    optimisticallyUpdateFeature(feat.id, { status: newStatus, progress: newProgress });
    try {
      await progressApi.updateFeature({ ...feat, status: newStatus, progress: newProgress });
      fetchData();
    } catch {
      toast.error('切换状态失败');
      fetchData();
    }
  };

  // Quick progress change
  const quickChangeProgress = async (feat: ProgressFeature, newProgress: number) => {
    const newStatus = newProgress === 0 ? 'todo' : newProgress === 100 ? 'done' : 'in_progress';
    optimisticallyUpdateFeature(feat.id, { progress: newProgress, status: newStatus });
    try {
      await progressApi.updateFeature({ ...feat, progress: newProgress, status: newStatus });
      fetchData();
    } catch {
      toast.error('修改进度失败');
      fetchData();
    }
  };

  // Delete
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'project') {
        await progressApi.deleteProject({ id: deleteConfirm.id });
      } else {
        await progressApi.deleteFeature({ id: deleteConfirm.id });
      }
      toast.success('删除成功');
      setDeleteConfirm(null);
      fetchData();
    } catch {
      toast.error('删除失败');
    }
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.stopPropagation();
    setDraggedFeatId(id);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragEnter = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (draggedFeatId === null || draggedFeatId === id) return;
    setDragOverFeatId(id);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedFeatId(null);
    setDragOverFeatId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: number, sibs: ProgressFeature[]) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedFeatId === null || draggedFeatId === targetId) {
      setDraggedFeatId(null);
      setDragOverFeatId(null);
      return;
    }
    const draggedIdx = sibs.findIndex(f => f.id === draggedFeatId);
    const targetIdx = sibs.findIndex(f => f.id === targetId);
    if (draggedIdx < 0 || targetIdx < 0) return;

    const newSibs = [...sibs];
    const [item] = newSibs.splice(draggedIdx, 1);
    newSibs.splice(targetIdx, 0, item);

    try {
      for (let i = 0; i < newSibs.length; i++) {
        if (newSibs[i].sort !== i) {
          await progressApi.updateFeature({ ...newSibs[i], sort: i });
        }
      }
      fetchData();
    } catch {
      toast.error('排序失败');
    }
    setDraggedFeatId(null);
    setDragOverFeatId(null);
  };

  // ─── Render a single task row (child item) ──
  const renderTaskRow = (feat: ProgressFeature, indent: boolean = false, sibs: ProgressFeature[] = []) => {
    const sc = STATUS_CONFIG[feat.status] || STATUS_CONFIG['todo'];
    const StatusIcon = sc.icon;
    const pc = PRIORITY_CONFIG[feat.priority] || PRIORITY_CONFIG['medium'];

    const isDragging = draggedFeatId === feat.id;
    const isDragOver = dragOverFeatId === feat.id;
    // Top-level standalone tasks (not indented) can have sub-tasks added
    const isTopLevel = !indent;

    return (
      <div 
        key={feat.id} 
        draggable={sibs.length > 0}
        onDragStart={(e) => handleDragStart(e, feat.id)}
        onDragEnter={(e) => handleDragEnter(e, feat.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => { if(sibs.length > 0) e.preventDefault() }}
        onDrop={(e) => handleDrop(e, feat.id, sibs)}
        className={`group flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] transition-all ${indent ? 'pl-10' : ''}
          ${sibs.length > 0 ? 'cursor-grab active:cursor-grabbing select-none' : ''}
          ${isDragging ? 'opacity-30' : 'opacity-100'}
          ${isDragOver ? 'border-t-blue-500 shadow-[0_-5px_10px_rgba(59,130,246,0.2)]' : ''}
        `}
      >
        <button onClick={() => quickChangeStatus(feat, feat.status === 'done' ? 'todo' : feat.status === 'todo' ? 'in_progress' : 'done')}
          title="点击切换状态" className={`p-1 rounded-lg transition-all hover:scale-110 ${sc.cls}`}>
          <StatusIcon className="w-3.5 h-3.5"/>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${feat.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{feat.name}</span>
            <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border ${pc.cls}`}><Flag className="w-2 h-2"/>{pc.label}</span>
          </div>
        </div>
        {/* Draggable progress bar block (prevents row drag) */}
        <div 
          className="w-28 flex items-center gap-2 flex-shrink-0 py-4 -my-4"
          draggable={true}
          onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <DraggableProgress 
            percent={feat.progress} 
            onChange={(newPercent) => quickChangeProgress(feat, newPercent)} 
          />
          <span className="text-[10px] text-slate-500 w-7 text-right">{feat.progress}%</span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {isTopLevel && (
            <button onClick={() => openFeatureForm(undefined, feat.id)} className="p-1 rounded text-slate-500 hover:text-blue-400" title="添加子任务"><Plus className="w-3 h-3"/></button>
          )}
          <button onClick={() => openFeatureForm(feat)} className="p-1 rounded text-slate-500 hover:text-blue-400"><Edit2 className="w-3 h-3"/></button>
          <button onClick={() => setDeleteConfirm({ type: 'feature', id: feat.id })} className="p-1 rounded text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3"/></button>
        </div>
      </div>
    );
  };

  // ─── Render a feature group (parent with children) or standalone task ──
  const renderFeatureItem = (feat: ProgressFeature) => {
    const hasChildren = feat.children && feat.children.length > 0;

    if (!hasChildren) {
      // Standalone task (no children)
      return renderTaskRow(feat);
    }

    // Group header with collapsible children
    const isExpanded = expandedGroups.has(feat.id);
    const stats = computeGroupStats(feat);
    const sc = STATUS_CONFIG[feat.status] || STATUS_CONFIG['todo'];

    return (
      <div key={feat.id} className="border-b border-white/[0.03] last:border-0">
        {/* Group header */}
        <div className="group flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-all cursor-pointer"
          onClick={() => toggleGroup(feat.id)}>
          <button className="p-0.5 text-slate-500">
            {isExpanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
          </button>
          <span className={`text-sm font-semibold ${sc.cls}`}>{feat.name}</span>
          <span className="text-[10px] text-slate-600">{stats.done}/{stats.total}</span>
          <div className="flex-1"/>
          <div className="w-24 flex items-center gap-2 flex-shrink-0">
            <div className="flex-1"><ProgressBar percent={stats.percent} height={4}/></div>
            <span className="text-[10px] text-slate-500 w-7 text-right">{stats.percent}%</span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => openFeatureForm(undefined, feat.id)} className="p-1 rounded text-slate-500 hover:text-blue-400" title="添加子任务"><Plus className="w-3 h-3"/></button>
            <button onClick={() => openFeatureForm(feat)} className="p-1 rounded text-slate-500 hover:text-blue-400" title="编辑"><Edit2 className="w-3 h-3"/></button>
            <button onClick={() => setDeleteConfirm({ type: 'feature', id: feat.id })} className="p-1 rounded text-slate-500 hover:text-red-400" title="删除"><Trash2 className="w-3 h-3"/></button>
          </div>
        </div>
        {/* Children */}
        {isExpanded && (
          <div className="bg-white/[0.01]">
            {(feat.children || [])
              .sort((a, b) => a.sort !== undefined && b.sort !== undefined ? a.sort - b.sort : a.id - b.id)
              .map((child, _, arr) => renderTaskRow(child, true, arr))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-[50%] h-[350px] bg-blue-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-[#0F111A]/80 flex-shrink-0 flex items-center justify-between px-5 z-20 backdrop-blur-xl gap-3">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><ArrowLeft className="w-5 h-5"/></button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><BarChart3 className="w-5 h-5"/></div>
            <div>
              <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">进度管理</h1>
              <p className="text-[10px] text-slate-500">{projects.length} 个项目</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex justify-center max-w-md mx-3">
          <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400"/>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索项目或功能..."
              className="pl-10 pr-4 py-2 w-full bg-[#151926]/90 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 placeholder-slate-500"/>
          </div>
        </div>
        <button onClick={() => openProjectForm()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:opacity-90 text-sm shadow-lg shadow-blue-500/20 flex-shrink-0">
          <Plus className="w-4 h-4"/>新建项目
        </button>
      </header>

      <main className="flex-1 flex min-h-0 overflow-hidden z-10">
        {/* Left: Project List */}
        <aside className="w-72 flex-shrink-0 border-r border-white/5 bg-[#0A0C14]/60 flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">项目列表</div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filtered.map((proj, projIndex) => {
              const isActive = selectedId === proj.id;
              const stats = getProjectStats(proj);
              const isProjDragging = draggedProjIndex === projIndex;
              const isProjDragOver = dragOverProjIndex === projIndex;
              return (
                <div
                  key={proj.id}
                  draggable
                  onDragStart={(e) => handleProjDragStart(e, projIndex)}
                  onDragEnter={(e) => handleProjDragEnter(e, projIndex)}
                  onDragEnd={handleProjDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleProjDrop(e, projIndex)}
                  onClick={() => setSelectedId(proj.id)}
                  className={`group relative px-4 py-4 border-b border-white/[0.03] cursor-grab active:cursor-grabbing select-none transition-all
                    ${isActive ? 'bg-blue-500/10' : 'hover:bg-white/[0.02]'}
                    ${isProjDragging ? 'opacity-30 scale-[0.98]' : 'opacity-100'}
                    ${isProjDragOver && !isProjDragging ? 'border-t-2 border-t-blue-500 shadow-[0_-4px_12px_rgba(59,130,246,0.25)]' : ''}
                  `}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500"/>}
                  <div className="flex items-start gap-3">
                    <ProgressRing percent={stats.percent} size={42} stroke={3.5} textSize="text-[10px]" />
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-semibold truncate mb-0.5 ${isActive ? 'text-slate-100' : 'text-slate-300'}`}>{proj.name}</h3>
                      <p className="text-[11px] text-slate-500 truncate mb-1.5">{proj.description || '暂无描述'}</p>
                      <div className="flex items-center gap-2 text-[9px] text-slate-600">
                        <span>{stats.done}/{stats.total} 已完成</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">{(proj.features||[]).filter(f=>f.status==='in_progress').length} 开发中</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="text-center text-slate-600 text-xs py-16">暂无项目</div>}
          </div>
        </aside>

        {/* Right: Feature Detail */}
        <section className="flex-1 flex flex-col overflow-hidden bg-[#0A0C14]/20">
          {selected ? (
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {/* Project Header */}
              <div className="px-8 py-5 border-b border-white/5 bg-[#0D0F18]/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-5">
                    <ProgressRing percent={getProjectStats(selected).percent} size={64} stroke={5} textSize="text-sm" />
                    <div>
                      <h2 className="text-xl font-bold text-white mb-0.5">{selected.name}</h2>
                      <p className="text-sm text-slate-400 mb-2">{selected.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>共 {(selected.features || []).length} 个功能</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400"/>{getProjectStats(selected).done} 已完成</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>更新于 {formatTime(selected.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openProjectForm(selected)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => setDeleteConfirm({ type: 'project', id: selected.id })} className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>

                {/* Status summary pills */}
                <div className="flex items-center gap-2 mt-4">
                  {STATUS_ORDER.map(st => {
                    // Count all tasks (children + standalone) with this status
                    const allTasks = (selected.features||[]).flatMap(f => f.children && f.children.length > 0 ? f.children : [f]);
                    const count = allTasks.filter(f => f.status === st).length;
                    if (count === 0) return null;
                    const sc = STATUS_CONFIG[st]; const Icon = sc.icon;
                    if (!sc) return null;
                    return <span key={st} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${sc.bg} ${sc.cls}`}><Icon className="w-3 h-3"/>{sc.label} {count}</span>;
                  })}
                </div>
              </div>

              {/* Add Feature / Group Button */}
              <div className="px-8 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-500">共 {sortedFeatures.length} 个功能模块</span>
                <button onClick={() => openFeatureForm()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-blue-400 hover:bg-blue-500/10 border border-blue-500/20">
                  <Plus className="w-3 h-3"/>添加功能
                </button>
              </div>

              {/* Feature List */}
              <div className="px-8 py-4 pb-16">
                <div className="rounded-xl border border-white/5 bg-[#0E1019]/60 overflow-hidden">
                  {sortedFeatures.map(feat => renderFeatureItem(feat))}
                </div>
                {(!selected.features || selected.features.length === 0) && (
                  <div className="text-center py-12 text-slate-600 text-xs border border-dashed border-white/5 rounded-xl">
                    暂无功能，点击「添加功能」开始记录开发进度
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <BarChart3 className="w-14 h-14 mb-4 opacity-10"/>
              <p className="text-sm mb-1">选择一个项目</p>
              <p className="text-xs text-slate-600">或点击「新建项目」创建</p>
            </div>
          )}
        </section>
      </main>

      {/* ─── Project Form Modal ─── */}
      <AnimatePresence>
        {isProjectFormOpen && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setIsProjectFormOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"/>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:20}}
                className="w-full max-w-md bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-white">{editProject ? '编辑项目' : '新建项目'}</h2>
                  <button onClick={()=>setIsProjectFormOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400"><X className="w-5 h-5"/></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">项目名称 *</label>
                    <input value={projectName} onChange={e=>setProjectName(e.target.value)} autoFocus
                      className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50" placeholder="如：AI 数枢平台"/>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">描述</label>
                    <input value={projectDesc} onChange={e=>setProjectDesc(e.target.value)}
                      className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50" placeholder="简要描述"/>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                  <button onClick={()=>setIsProjectFormOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5">取消</button>
                  <button onClick={submitProject} disabled={!projectName.trim()}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-40 shadow-lg shadow-blue-500/20">
                    {editProject ? '保存' : '创建项目'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Feature Form Modal ─── */}
      <AnimatePresence>
        {isFeatureFormOpen && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setIsFeatureFormOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"/>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:20}}
                className="w-full max-w-lg bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-white">
                    {editFeature ? '编辑' : featureParentId ? '添加子任务' : '添加功能'}
                  </h2>
                  <button onClick={()=>setIsFeatureFormOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400"><X className="w-5 h-5"/></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">{featureParentId ? '子任务名称' : '功能名称'} *</label>
                    <input value={featureName} onChange={e=>setFeatureName(e.target.value)} autoFocus
                      className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50" placeholder={featureParentId ? '如：订单列表页' : '如：订单管理'}/>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">描述</label>
                    <input value={featureDesc} onChange={e=>setFeatureDesc(e.target.value)}
                      className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50" placeholder="简要说明"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">优先级</label>
                      <div className="space-y-1 mb-4">
                        {(['high','medium','low'] as Priority[]).map(pr => {
                          const pc = PRIORITY_CONFIG[pr];
                          return (
                            <button key={pr} type="button" onClick={()=>setFeaturePriority(pr)}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all text-left ${featurePriority === pr ? pc.cls : 'text-slate-400 hover:bg-white/[0.03]'}`}>
                              <div className={`w-2 h-2 rounded-full ${pc.dot}`}/>{pc.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      {editFeature && editFeature.children && editFeature.children.length > 0 ? (
                        /* Parent with children - progress is auto-calculated */
                        <>
                          <label className="block text-xs text-slate-400 mb-1.5">进度（自动计算）</label>
                          <div className="mb-4">
                            <ProgressBar percent={computeGroupStats(editFeature).percent} height={8} />
                            <div className="text-sm text-center text-slate-300 mt-2 font-medium">{computeGroupStats(editFeature).percent}%</div>
                          </div>
                          <div className="text-xs text-blue-400/80 bg-blue-500/5 rounded-lg p-2.5 border border-blue-500/10">
                            <div className="flex items-center gap-1.5 mb-1 font-medium">📊 进度自动计算</div>
                            该功能包含 {editFeature.children.length} 个子任务，进度由子任务的平均进度自动得出，无需手动调节。
                          </div>
                        </>
                      ) : (
                        /* Standalone task or child - manual progress */
                        <>
                          <label className="block text-xs text-slate-400 mb-1.5">进度 {featureProgress}%</label>
                          <div className="mb-4">
                            <input type="range" min={0} max={100} step={5} value={featureProgress} onChange={e => setFeatureProgress(+e.target.value)}
                              className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500 mt-2 mb-3" />
                            <ProgressBar percent={featureProgress} height={6} />
                          </div>
                          <div className="text-xs text-slate-500 bg-white/5 rounded-lg p-2.5">
                            自动状态说明：<br/>
                            • 0% 为待开发<br/>
                            • 1%-99% 为开发中<br/>
                            • 100% 为已完成
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                  <button onClick={()=>setIsFeatureFormOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5">取消</button>
                  <button onClick={submitFeature} disabled={!featureName.trim()}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-40 shadow-lg shadow-blue-500/20">
                    {editFeature ? '保存' : featureParentId ? '添加子任务' : '添加功能'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirm ─── */}
      <AnimatePresence>
        {deleteConfirm !== null && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setDeleteConfirm(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"/>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
                className="w-full max-w-sm bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-red-500/10"><Trash2 className="w-5 h-5 text-red-400"/></div>
                  <h3 className="text-lg font-bold text-slate-100">确认删除</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6">删除后无法恢复，确定要删除吗？</p>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={()=>setDeleteConfirm(null)} className="px-5 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5">取消</button>
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
