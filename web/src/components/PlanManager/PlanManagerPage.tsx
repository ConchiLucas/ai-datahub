import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, Plus, Focus, X, Edit2, Trash2,
  LayoutTemplate, CheckCircle2, ChevronRight, ChevronLeft, Goal, Calendar
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { getPlanList, createPlan, updatePlan, updatePlanProgress, deletePlan } from '@/api/plan';

// 移除标签和栏目，引入进度字段 (0-100)
interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  progress: number;
  createdAt: string;
}

const mockTasks: Task[] = [
  // 今天的大量任务
  { id: '1', title: '完成系统架构设计', description: '整理微服务拓扑图，输出相关的设计文档并提交PR。', priority: 'high', progress: 30, createdAt: '今天' },
  { id: '6', title: '修复登录模块白屏Bug', description: '排查严格模式下的二次渲染问题。', priority: 'high', progress: 70, createdAt: '今天' },
  { id: '7', title: '补充API接口文档', description: '输出最新的后端API接入指南。', priority: 'medium', progress: 100, createdAt: '今天' },
  { id: '10', title: '跟进数据库大表优化', description: '针对超大记录表进行分库分表规划设计。', priority: 'high', progress: 10, createdAt: '今天' },
  { id: '11', title: '优化全局搜索响应时间', description: '引入ElasticSearch并配置同步策略。', priority: 'high', progress: 85, createdAt: '今天' },
  { id: '12', title: '团队周报汇总', description: '催促并收集各个产研小组的进度汇报。', priority: 'low', progress: 100, createdAt: '今天' },

  // 昨天的大量任务
  { id: '2', title: '开发首页 Kanban看板面板', description: '高保真还原Figma设计稿，并植入动画。', priority: 'high', progress: 85, createdAt: '昨天' },
  { id: '8', title: '与设计团队对齐UI规范', description: '统一组件库的圆角、阴影等。', priority: 'medium', progress: 40, createdAt: '昨天' },
  { id: '13', title: '处理线上紧急告警', description: '查看阿里云服务器CPU飙升的原因。', priority: 'high', progress: 100, createdAt: '昨天' },
  { id: '14', title: '面试三名候选人', description: '完成前端岗位的初试与复试。', priority: 'medium', progress: 100, createdAt: '昨天' },
  { id: '15', title: '报销上个月加班打车费', description: '贴票据并走OA审批流程。', priority: 'low', progress: 20, createdAt: '昨天' },
  { id: '16', title: '代码Review', description: '审查新入职同事提交的核心业务逻辑代码。', priority: 'medium', progress: 60, createdAt: '昨天' },

  // 其他日期的少量任务
  { id: '3', title: '跟进客户数据打通', description: '拉通相关业务线，对齐字段并处理脏数据。', priority: 'medium', progress: 0, createdAt: '周三' },
  { id: '9', title: '编写核心单元测试', description: '提升测试覆盖率到80%以上。', priority: 'low', progress: 20, createdAt: '周三' },
  { id: '4', title: '项目二期需求评审', description: '同产品经理确认功能优先级与排期。', priority: 'medium', progress: 100, createdAt: '上周' },
  { id: '5', title: '技术分享会PPT制作', description: '主题：关于现代React应用性能优化的实践。', priority: 'low', progress: 50, createdAt: '本周五' },
];

const priorityConfig = {
  high: { label: '紧急核心', emoji: '🔥', colors: 'from-rose-500/20 to-pink-500/20', text: 'text-rose-500', bg: 'bg-rose-500', icon: 'bg-rose-500/10 text-rose-500', glow: 'bg-rose-500/10' },
  medium: { label: '常规任务', emoji: '⚡', colors: 'from-amber-500/20 to-orange-500/20', text: 'text-amber-500', bg: 'bg-amber-500', icon: 'bg-amber-500/10 text-amber-500', glow: 'bg-amber-500/10' },
  low: { label: '闲暇时光', emoji: '🌱', colors: 'from-slate-400/20 to-gray-400/20', text: 'text-slate-500', bg: 'bg-slate-400', icon: 'bg-slate-400/10 text-slate-500', glow: 'bg-slate-400/10' }
};

export const getProgressColor = (val: number) => {
  if (val <= 30) return 'bg-indigo-400';
  if (val <= 60) return 'bg-blue-500';
  if (val <= 99) return 'bg-cyan-500';
  return 'bg-emerald-500';
};

export const getProgressTextColor = (val: number) => {
  if (val <= 30) return 'text-indigo-400';
  if (val <= 60) return 'text-blue-500';
  if (val <= 99) return 'text-cyan-500';
  return 'text-emerald-500';
};

export const getProgressLabel = (val: number) => {
  if (val === 0) return '暂未开始';
  if (val <= 30) return '刚刚起步';
  if (val <= 60) return '稳步推进';
  if (val <= 99) return '即将完成';
  return '已达成';
};

export default function PlanManagerPage() {
  const navigate = useNavigate();
  const theme = useAppStore(state => state.theme);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week'>('all');
  const [progressFilter, setProgressFilter] = useState<'all' | 'just_started' | 'steady' | 'almost' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedMockDay, setSelectedMockDay] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchPlanList = async () => {
    try {
      const res = await getPlanList({ page: 1, pageSize: 999 }) as any;
      if (res.code === 0 && res.data.list) {
        const data = res.data.list.map((item: any) => ({
          id: item.id.toString(),
          title: item.title,
          description: item.description,
          priority: item.priority,
          progress: item.progress,
          createdAt: item.createdAt,
        }));
        setTasks(data);
      }
    } catch {}
  };

  React.useEffect(() => {
    fetchPlanList();
  }, []);

  const handleCreateTask = async (newTask: Omit<Task, 'id' | 'progress' | 'createdAt'>) => {
    try {
      const res = await createPlan({ ...newTask, progress: 0 }) as any;
      if (res.code === 0) {
        setIsModalOpen(false);
        fetchPlanList();
      }
    } catch {}
  };

  const handleProgressChange = async (id: string, newProgress: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, progress: newProgress } : t));
    await updatePlanProgress({ id: Number(id), progress: newProgress });
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
    await updatePlan({
      id: Number(updatedTask.id),
      title: updatedTask.title,
      description: updatedTask.description,
      priority: updatedTask.priority,
      progress: updatedTask.progress,
    });
  };

  const handleDeleteTask = async (id: string) => {
    await deletePlan({ id: Number(id) });
    setSelectedTask(null);
    fetchPlanList();
  };

  const handleDayClick = (day: number) => {
    setSelectedMockDay(day);
    setTimeFilter('all');
    setViewMode('grid'); // Default to grid card view instead of list
    setIsCalendarOpen(false);
  };

  const filteredTasks = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Priority filter match
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    // Progress filter match
    let matchProgress = true;
    if (progressFilter !== 'all') {
      if (progressFilter === 'just_started') matchProgress = t.progress <= 30;
      else if (progressFilter === 'steady') matchProgress = t.progress > 30 && t.progress <= 60;
      else if (progressFilter === 'almost') matchProgress = t.progress > 60 && t.progress < 100;
      else if (progressFilter === 'done') matchProgress = t.progress === 100;
    }

    // Explicit day click mock logic
    if (selectedMockDay !== null) {
      if (selectedMockDay === 15) return matchSearch && matchPriority && matchProgress && (t.createdAt === '今天' || t.createdAt === '刚刚');
      if (selectedMockDay === 14) return matchSearch && matchPriority && matchProgress && t.createdAt === '昨天';
      if (selectedMockDay === 18) return matchSearch && matchPriority && matchProgress && t.createdAt === '本周五';
      if (selectedMockDay === 12) return matchSearch && matchPriority && matchProgress && t.createdAt === '周三';
      if (selectedMockDay >= 1 && selectedMockDay <= 10) return matchSearch && matchPriority && matchProgress && t.createdAt === '上周';
      return false;
    }

    // Simple mock time filter logic
    let matchTime = true;
    if (timeFilter === 'today') {
      matchTime = t.createdAt === '今天' || t.createdAt === '刚刚';
    } else if (timeFilter === 'week') {
      matchTime = ['今天', '昨天', '刚刚', '周三', '本周五'].includes(t.createdAt);
    }
    return matchSearch && matchPriority && matchProgress && matchTime;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.progress === 100 && b.progress !== 100) return 1;
    if (a.progress !== 100 && b.progress === 100) return -1;
    return b.progress - a.progress;
  });

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 overflow-hidden relative ${theme === 'dark' ? 'bg-[#0F111A] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>

      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none mix-blend-screen" />

      {/* Top Header */}
      <header className={`h-20 shrink-0 border-b flex items-center justify-between px-8 z-10 ${theme === 'dark' ? 'bg-[#11131C]/90 border-white/5 backdrop-blur-xl' : 'bg-white/90 border-slate-200 backdrop-blur-xl'} shadow-sm`}>
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className={`p-2 rounded-2xl transition-all ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-white/5 shadow-inner">
              <LayoutTemplate className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500">计划管理</h1>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} mt-0.5`}>轻松追踪每一个目标的进度</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className={`h-11 px-3 rounded-2xl border text-sm outline-none transition-all appearance-none cursor-pointer ${theme === 'dark' ? 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
          >
            <option value="all">🚩 全部优先</option>
            <option value="high">🔥 紧急必做</option>
            <option value="medium">⚡ 稳步推进</option>
            <option value="low">🌱 稍后处理</option>
          </select>

          <select
            value={selectedMockDay !== null ? 'custom' : timeFilter}
            onChange={(e) => {
              setSelectedMockDay(null);
              if (e.target.value !== 'custom') setTimeFilter(e.target.value as any);
            }}
            className={`h-11 px-3 rounded-2xl border text-sm outline-none transition-all appearance-none cursor-pointer ${theme === 'dark' ? 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
          >
            <option value="all">📅 全部时间</option>
            <option value="today">⚡ 今日计划</option>
            <option value="week">🗓 本周计划</option>
            {selectedMockDay !== null && <option value="custom" disabled>🎯 4月{selectedMockDay}日</option>}
          </select>

          <div className={`p-1 flex items-center rounded-2xl border mx-2 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? (theme === 'dark' ? 'bg-white/10 text-cyan-400 shadow-sm' : 'bg-white text-cyan-600 shadow-sm') : 'text-slate-400 hover:text-slate-500'}`}>
              <LayoutTemplate className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? (theme === 'dark' ? 'bg-white/10 text-cyan-400 shadow-sm' : 'bg-white text-cyan-600 shadow-sm') : 'text-slate-400 hover:text-slate-500'}`}>
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button onClick={() => setIsCalendarOpen(true)} className={`p-2 rounded-xl transition-all text-slate-400 hover:text-cyan-500`}>
              <Calendar className="w-4 h-4" />
            </button>
          </div>

          <div className={`relative flex items-center w-52 h-11 rounded-2xl overflow-hidden border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 focus-within:border-cyan-500/50 focus-within:bg-white/10' : 'bg-white border-slate-200 focus-within:border-cyan-400 focus-within:shadow-lg'}`}>
            <Search className={`w-4 h-4 ml-4 shrink-0 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="搜索计划..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-full bg-transparent border-none outline-none px-3 text-sm ${theme === 'dark' ? 'placeholder-slate-500' : 'placeholder-slate-400'}`}
            />
          </div>

          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 h-11 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95 ml-1 shrink-0">
            <Plus className="w-5 h-5" /> 新建项
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-10 relative z-10 w-full max-w-7xl mx-auto">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {sortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  theme={theme}
                  onClick={() => setSelectedTask(task)}
                  onProgressChange={(val) => handleProgressChange(task.id, val)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {sortedTasks.map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  theme={theme}
                  onClick={() => setSelectedTask(task)}
                  onProgressChange={(val) => handleProgressChange(task.id, val)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {sortedTasks.length === 0 && (
          <div className={`w-full h-64 flex flex-col items-center justify-center rounded-3xl border border-dashed ${theme === 'dark' ? 'border-white/10 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
            <Focus className="w-12 h-12 mb-4 opacity-20" />
            <p>暂无计划项，点击右上角开始设立一个小目标吧！</p>
          </div>
        )}
      </main>

      {/* Modern Create Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <CreateTaskModal
            theme={theme}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleCreateTask}
          />
        )}
      </AnimatePresence>

      {/* Calendar Overview Modal */}
      <AnimatePresence>
        {isCalendarOpen && (
          <CalendarOverviewModal
            theme={theme}
            onClose={() => setIsCalendarOpen(false)}
            tasks={tasks}
            onDayClick={handleDayClick}
          />
        )}
      </AnimatePresence>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            theme={theme}
            onClose={() => setSelectedTask(null)}
            onSave={handleUpdateTask}
            onDelete={() => handleDeleteTask(selectedTask.id)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

// 独立的导航栏风格计划卡片
function TaskCard({ task, theme, onProgressChange, onClick }: { task: Task, theme: string, onProgressChange: (val: number) => void, onClick: () => void }) {
  const cfg = priorityConfig[task.priority];
  const isDone = task.progress === 100;


  const progressBg = getProgressColor(task.progress);
  const progressText = getProgressTextColor(task.progress);
  const progressLabel = getProgressLabel(task.progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      onClick={onClick}
      className={`group relative flex flex-col justify-between p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden backdrop-blur-xl cursor-pointer ${theme === 'dark'
          ? `bg-gradient-to-br from-[#1E2335]/80 to-[#151926]/80 border-white/5`
          : `bg-white border-slate-200`
        }`}
      style={{
        boxShadow: theme === 'dark' ? undefined : '0 10px 40px -10px rgba(0,0,0,0.05)'
      }}
    >
      {/* Top right decorative glow */}
      <div className={`absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full blur-3xl transition-all duration-500 opacity-50 group-hover:opacity-100 pointer-events-none ${cfg.glow}`} />

      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center pointer-events-none transition-colors ${cfg.icon}`}>
            <span className="text-2xl drop-shadow-sm">{cfg.emoji}</span>
          </div>
          {isDone ? (
            <div 
              className={`w-7 h-7 flex items-center justify-center shrink-0 rounded-full pointer-events-none ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-500 border border-emerald-200'}`}
              title="已完成"
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : <div className="w-7 h-7 shrink-0" />}
        </div>

        {/* Titles & Desc */}
        <div className="relative z-10 mb-6 pointer-events-none">
          <h3 className={`text-lg font-bold mb-2 line-clamp-1 transition-colors ${isDone ? 'text-slate-500 line-through' : (theme === 'dark' ? 'text-white group-hover:text-cyan-400' : 'text-slate-900 group-hover:text-cyan-600')}`}>
            {task.title}
          </h3>
          <p className={`text-sm line-clamp-2 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {task.description}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${theme === 'dark' ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
              📅 创建于 {task.createdAt}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Slider */}
      <div className="relative z-10 mt-auto pt-4 border-t border-slate-500/10">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            {progressLabel}
          </span>
          <span className={`text-sm font-bold font-mono transition-colors duration-300 ${progressText}`}>
            {task.progress}%
          </span>
        </div>

        <div className="relative group/slider w-full h-4 flex items-center cursor-ew-resize">
          {/* Background Track */}
          <div className={`absolute w-full h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
            <div
              className={`h-full ${progressBg}`}
              style={{ width: `${task.progress}%` }}
            />
          </div>
          {/* Invisible native range input for flawless drag control */}
          <input
            type="range"
            min="0"
            max="100"
            value={task.progress}
            onChange={(e) => onProgressChange(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute inset-0 w-full opacity-0 cursor-ew-resize z-20"
          />
          {/* Custom Thumb indicator */}
          <div
            className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-md group-active/slider:scale-125 pointer-events-none z-10 ${progressBg}`}
            style={{ left: `calc(${task.progress}% - 8px)` }}
          />
        </div>
      </div>
    </motion.div>
  );
}


function CreateTaskModal({ theme, onClose, onSubmit }: { theme: string, onClose: () => void, onSubmit: (t: Omit<Task, 'id' | 'progress' | 'createdAt'>) => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-2xl ${theme === 'dark' ? 'bg-[#151926]/90 border-white/10' : 'bg-white/90 border-slate-200'}`}
      >
        <div className={`px-8 py-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
          <h2 className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-white to-slate-400' : 'from-slate-900 to-slate-500'}`}>创建新目标</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors">
            <div className="p-2 rounded-full hover:bg-white/5"><Focus className="w-5 h-5 rotate-45" /></div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className={`block text-xs font-bold mb-2 uppercase tracking-wide ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>目标标题</label>
            <input
              autoFocus required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="你想达成什么？"
              className={`w-full px-5 py-3.5 rounded-2xl border text-sm transition-all outline-none focus:ring-2 focus:ring-cyan-500/50 ${theme === 'dark' ? 'bg-black/20 border-white/5 text-white placeholder-slate-600 focus:bg-white/5' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'}`}
            />
          </div>

          <div>
            <label className={`block text-xs font-bold mb-2 uppercase tracking-wide ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>补充详情</label>
            <textarea
              rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="记录一些具体细节..."
              className={`w-full px-5 py-3.5 rounded-2xl border text-sm transition-all outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none ${theme === 'dark' ? 'bg-black/20 border-white/5 text-white placeholder-slate-600 focus:bg-white/5' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'}`}
            />
          </div>

          <div>
            <label className={`block text-xs font-bold mb-2 uppercase tracking-wide ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>优先级 / Priority</label>
            <select
              value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
              className={`w-full px-5 py-3.5 rounded-2xl border text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none ${theme === 'dark' ? 'bg-black/20 border-white/5 text-white focus:bg-white/5' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'}`}
            >
              <option value="high">🔥 紧急必做 (High)</option>
              <option value="medium">⚡ 稳步推进 (Medium)</option>
              <option value="low">🌱 稍后处理 (Low)</option>
            </select>
          </div>

          <div className="pt-6 flex gap-4 mt-8 border-t border-white/5">
            <button type="button" onClick={onClose} className={`flex-1 py-3.5 rounded-2xl text-sm font-bold transition-colors ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>稍等再说</button>
            <button type="submit" className="flex-[2] py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white shadow-xl shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
              开始追踪 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// 列表视图行组件
function TaskListItem({ task, theme, onProgressChange, onClick }: { task: Task, theme: string, onProgressChange: (val: number) => void, onClick: () => void }) {
  const cfg = priorityConfig[task.priority];
  const isDone = task.progress === 100;


  const progressBg = getProgressColor(task.progress);
  const progressLabel = getProgressLabel(task.progress);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      onClick={onClick}
      className={`group flex items-center gap-6 p-4 px-6 rounded-2xl border transition-all duration-300 hover:shadow-lg overflow-hidden backdrop-blur-xl cursor-pointer ${theme === 'dark'
          ? `bg-white/[0.02] hover:bg-white/[0.05] border-white/5`
          : `bg-white hover:bg-slate-50 border-slate-200`
        }`}
    >
      {/* Icon */}
      <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${cfg.icon}`}>
        <span className="text-xl drop-shadow-sm">{cfg.emoji}</span>
      </div>

      {/* Detail */}
      <div className="flex-1 min-w-0">
        <h3 className={`text-base font-bold truncate transition-colors ${isDone ? 'text-slate-500 line-through' : (theme === 'dark' ? 'text-white' : 'text-slate-900')}`}>
          {task.title}
        </h3>
        <div className={`flex items-center gap-3 mt-1 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          <span className="truncate max-w-[300px]">{task.description}</span>
          <span className="w-1 h-1 rounded-full bg-slate-500/50" />
          <span>{task.createdAt}</span>
        </div>
      </div>

      {/* Interactive Progress Segment */}
      <div className="w-64 shrink-0 flex items-center gap-4">
        <span className={`text-xs font-bold w-12 text-right ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{progressLabel}</span>

        <div className="relative group/slider flex-1 h-3 flex items-center cursor-ew-resize">
          <div className={`absolute w-full h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
            <div className={`h-full ${progressBg}`} style={{ width: `${task.progress}%` }} />
          </div>
          <input
            type="range" min="0" max="100" value={task.progress} onChange={(e) => onProgressChange(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute inset-0 w-full opacity-0 cursor-ew-resize z-20"
          />
          <div
            className={`absolute w-3 h-3 rounded-full border-2 border-white shadow-md group-hover/slider:scale-150 pointer-events-none z-10 ${progressBg}`}
            style={{ left: `calc(${task.progress}% - 6px)` }}
          />
        </div>
        <span className={`text-xs font-bold font-mono w-8 text-right ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{task.progress}%</span>
      </div>
    </motion.div>
  );
}

// 独立的日历概览组件
function CalendarOverviewModal({ theme, onClose, tasks, onDayClick }: { theme: string, onClose: () => void, tasks: Task[], onDayClick: (day: number) => void }) {
  // 当前查阅的月份，默认设置到模拟数据的四月或当前时间
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 根据年月动态计算日历排布
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };



  const getTasksForDay = (day: number) => {
    // 只有在当前的模拟基准月（2026年4月）才展示这些写死的Mock数据
    if (year !== 2026 || month !== 3) return [];

    return tasks.filter(t => {
      if (day === 15 && (t.createdAt === '今天' || t.createdAt === '刚刚')) return true;
      if (day === 14 && t.createdAt === '昨天') return true;
      if (day === 18 && t.createdAt === '本周五') return true;
      if (day === 12 && t.createdAt === '周三') return true;
      if (day >= 1 && day <= 10 && t.createdAt === '上周') return true;
      return false;
    });
  };

  const renderDayCell = (day: number) => {
    const dayTasks = getTasksForDay(day);
    // 只在使用模拟基准月时高亮15号为“今天”
    const isToday = (year === 2026 && month === 3 && day === 15);

    // 计算当天的平均进度
    let averageProgress = 0;
    if (dayTasks.length > 0) {
      averageProgress = Math.round(dayTasks.reduce((sum, t) => sum + t.progress, 0) / dayTasks.length);
    }
    const avgColorClass = getProgressColor(averageProgress);

    // 动态计算悬浮窗的位置，防止边缘溢出被裁切
    const gridIndex = startDay + day - 1;
    const isLeftCol = gridIndex % 7 === 0 || gridIndex % 7 === 1;
    const isRightCol = gridIndex % 7 === 6 || gridIndex % 7 === 5;
    let popoverPosClass = 'left-1/2 -translate-x-1/2';
    if (isLeftCol) popoverPosClass = 'left-0 translate-x-0 origin-left';
    else if (isRightCol) popoverPosClass = 'right-0 translate-x-0 origin-right';

    return (
      <div
        key={day}
        onClick={() => dayTasks.length > 0 ? onDayClick(day) : undefined}
        className={`aspect-square p-2 border relative group flex flex-col justify-between transition-all ${dayTasks.length > 0 ? 'cursor-pointer hover:shadow-inner hover:scale-105 z-10 bg-black/[0.03] dark:bg-white/[0.03]' : ''} ${theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}
      >
        <span className={`text-sm font-bold ${isToday ? 'text-indigo-500' : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}`}>
          {isToday ? <span className="bg-indigo-500 text-white w-6 h-6 flex items-center justify-center rounded-full leading-none">{day}</span> : day}
        </span>

        <div className="flex items-center gap-1.5 mt-auto pb-1">
          {dayTasks.length > 0 && (
            <>
              <div className={`w-3.5 h-3.5 rounded-full ${avgColorClass} shadow-md border border-white/20`} />
              <span className={`text-[10px] font-bold opacity-60`}>均 {averageProgress}%</span>
            </>
          )}
        </div>

        {/* 悬停时的Tooltip可以展示真实的进度列表 */}
        {dayTasks.length > 0 && (
          <div className="absolute inset-0 bg-transparent flex items-center opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
            <div className={`p-4 rounded-2xl shadow-2xl backdrop-blur-3xl border w-56 absolute ${popoverPosClass} scale-90 group-hover:scale-100 transition-all ${theme === 'dark' ? 'bg-[#1A1D27]/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
              <div className="text-xs font-bold mb-3 pb-2 border-b border-white/10 flex justify-between">
                <span>{month + 1}月{day}日 概览</span>
                <span className="text-indigo-500">{dayTasks.length} 项</span>
              </div>

              <div className="space-y-2.5 max-h-32 overflow-y-auto scrollbar-hide">
                {dayTasks.map(t => (
                  <div key={t.id} className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold truncate line-clamp-1 dark:text-white text-slate-800">{t.title}</span>
                    <div className="flex items-center gap-2">
                      <div className={`flex-1 h-1 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}>
                        <div className={`h-full rounded-full ${getProgressColor(t.progress)}`} style={{ width: `${t.progress}%` }} />
                      </div>
                      <span className={`text-[10px] font-mono ${getProgressColor(t.progress).replace('bg-', 'text')}`}>{t.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2 text-center text-[10px] text-indigo-500 font-bold uppercase tracking-wider backdrop-blur-md">点击转到该日列表</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-2xl ${theme === 'dark' ? 'bg-[#151926]/90 border-white/10' : 'bg-white/90 border-slate-200'}`}
      >
        {/* Calendar Header */}
        <div className={`px-8 py-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
          <div>
            <h2 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-500 flex items-center gap-2`}>
              <Goal className="w-6 h-6 text-indigo-400" />
              月度任务完成全景
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <div className={`flex items-center rounded-xl overflow-hidden border ${theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-white'}`}>
                <button onClick={handlePrevMonth} className={`p-1 transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={handleNextMonth} className={`p-1 transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}><ChevronRight className="w-4 h-4" /></button>
              </div>
              <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{year}年 {month + 1}月</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors">
            <div className="p-2 rounded-full hover:bg-white/5"><X className="w-6 h-6" /></div>
          </button>
        </div>
        <div className="p-8">
          {/* Legend */}
          <div className="flex items-center justify-end gap-6 mb-6 text-xs font-bold uppercase tracking-wide">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 完美达成</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> 稳步推进</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> 刚起步</div>
          </div>

          {/* Calendar Grid */}
          <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
            {/* Days of Week */}
            <div className={`grid grid-cols-7 border-b ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
              {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(d => (
                <div key={d} className={`text-center py-3 text-xs font-bold ${['周日', '周六'].includes(d) ? 'text-rose-400' : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-7 bg-transparent border-t-0">
              {/* Empty cells for start padding */}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className={`aspect-square border ${theme === 'dark' ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50/50'}`} />
              ))}
              {/* Real dates */}
              {Array.from({ length: daysInMonth }).map((_, i) => renderDayCell(i + 1))}
            </div>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
}

// 独立的详情弹窗组件
function TaskDetailModal({ task, theme, onClose, onSave, onDelete }: { task: Task, theme: string, onClose: () => void, onSave: (task: Task) => void, onDelete?: () => void }) {
  const cfg = priorityConfig[task.priority];
  const isDone = task.progress === 100;
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: task.title, description: task.description, priority: task.priority });

  const handleSave = () => {
    onSave({ ...task, ...editForm });
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-2xl ${theme === 'dark' ? 'bg-[#1A1D27]/95 border-white/10' : 'bg-white/95 border-slate-200'}`}
      >
        <div className={`px-8 py-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${cfg.icon}`}>
              <span className="text-xl drop-shadow-sm">{cfg.emoji}</span>
            </div>
            <h2 className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-white to-slate-400' : 'from-slate-900 to-slate-500'}`}>任务全貌</h2>
            {isDone && (
              <div className={`ml-2 px-2.5 py-1 rounded-full border flex items-center gap-1.5 text-xs font-bold ${theme === 'dark' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-emerald-200 bg-emerald-50 text-emerald-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> 已完成
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>取消</button>
                <button onClick={handleSave} className="px-4 py-1.5 rounded-lg bg-indigo-500 text-white text-sm font-bold shadow-md hover:bg-indigo-600 transition-colors">保存更改</button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                  <Edit2 className="w-4 h-4" />
                </button>
                {onDelete && (
                  <button onClick={onDelete} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-rose-500/10 text-slate-500 hover:text-rose-400' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-500'}`} title="删除计划">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={onClose} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`} title="关闭">
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'} ${cfg.text}`}>
                <div className={`w-2 h-2 rounded-full ${cfg.bg}`} />
                {cfg.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${theme === 'dark' ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                📅 创建于：{task.createdAt}
              </span>
            </div>

            {isEditing ? (
              <input
                type="text"
                value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                className={`text-2xl font-bold mb-4 w-full bg-transparent border-b outline-none pb-2 transition-colors ${theme === 'dark' ? 'text-white border-white/20 focus:border-indigo-500' : 'text-slate-900 border-slate-300 focus:border-indigo-500'}`}
              />
            ) : (
              <h1 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{task.title}</h1>
            )}

            {isEditing ? (
              <textarea
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                className={`w-full p-4 rounded-xl border leading-relaxed text-sm min-h-[120px] outline-none resize-none transition-colors ${theme === 'dark' ? 'bg-black/20 border-white/20 text-slate-300 focus:border-indigo-500 focus:bg-white/5' : 'bg-slate-50 border-slate-300 text-slate-600 focus:border-indigo-500 focus:bg-white'}`}
              />
            ) : (
              <div className={`p-4 rounded-xl border leading-relaxed text-sm min-h-[100px] ${theme === 'dark' ? 'bg-black/20 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                {task.description || "暂无更多细节描述..."}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>当前执行进度</span>
              <span className={`text-xl font-bold font-mono ${task.progress === 100 ? 'text-emerald-500' : 'text-cyan-500'}`}>{task.progress}%</span>
            </div>
            <div className={`h-3 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
              <div
                className={`h-full transition-all duration-500 ${getProgressColor(task.progress)}`}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
