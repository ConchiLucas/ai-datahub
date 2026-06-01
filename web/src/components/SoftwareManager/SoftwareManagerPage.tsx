import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, AppWindow, Search, Plus, X, Download,
  Trash2, Grid3X3, List, Package,
  Monitor, Smartphone, Globe, Terminal, Gamepad2, Camera,
  Database, Shield, Code2, Wrench,
  BookOpen, MessageSquare, ChevronDown, Upload as UploadIcon,
  Loader2
} from 'lucide-react';
import { getSoftwareData, addSoftware, deleteSoftware, SoftwareForm } from '@/api/software';

// ─── Types ───────────────────────────────────────
interface SoftwareItem {
  id: number;
  name: string;
  category: string;
  version: string;
  platform: string;
  description?: string;
  iconUrl?: string;
  downloadUrl?: string;
  fileSize?: string;
  createdAt?: string;
}

// ─── Mock Categories ──────────────────────────────
const CATEGORIES = [
  { id: 'all', label: '全部', icon: Grid3X3 },
  { id: '开发工具', label: '开发工具', icon: Code2 },
  { id: '系统工具', label: '系统工具', icon: Wrench },
  { id: '设计创作', label: '设计创作', icon: Camera },
  { id: '数据库', label: '数据库', icon: Database },
  { id: '安全', label: '安全', icon: Shield },
  { id: '娱乐', label: '娱乐', icon: Gamepad2 },
  { id: '办公', label: '办公', icon: BookOpen },
  { id: '通讯', label: '通讯', icon: MessageSquare },
  { id: '浏览器', label: '浏览器', icon: Globe },
  { id: '其他', label: '其他', icon: Package },
];

const PLATFORMS = ['全部平台', 'macOS', 'Windows', 'Linux', 'iOS', 'Android', 'Web'];

// ─── App Icon Component ───────────────────────────
const APP_ICON_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-sky-600',
  'from-lime-500 to-green-600',
  'from-fuchsia-500 to-purple-600',
  'from-red-500 to-rose-600',
  'from-teal-500 to-emerald-600',
  'from-orange-500 to-amber-600',
  'from-sky-500 to-blue-600',
];

function AppIcon({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const idx = name.charCodeAt(0) % APP_ICON_COLORS.length;
  const color = APP_ICON_COLORS[idx] || APP_ICON_COLORS[0];
  const sizeClasses = {
    sm: 'w-10 h-10 rounded-xl text-lg',
    md: 'w-14 h-14 rounded-2xl text-2xl',
    lg: 'w-20 h-20 rounded-3xl text-4xl',
  }[size];
  return (
    <div className={`bg-gradient-to-br ${color} ${sizeClasses} flex items-center justify-center font-bold text-white shadow-lg select-none shrink-0`}>
      {name.charAt(0)?.toUpperCase()}
    </div>
  );
}

// ─── Platform Badge ────────────────────────────────
function PlatformBadge({ platform }: { platform: string }) {
  const map: Record<string, { icon: any; cls: string }> = {
    macOS: { icon: Monitor, cls: 'text-slate-300 bg-white/5 border-white/10' },
    Windows: { icon: Monitor, cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    Linux: { icon: Terminal, cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    iOS: { icon: Smartphone, cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    Android: { icon: Smartphone, cls: 'text-green-400 bg-green-500/10 border-green-500/20' },
    Web: { icon: Globe, cls: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  };
  const cfg = map[platform] || { icon: Package, cls: 'text-slate-400 bg-white/5 border-white/10' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${cfg.cls}`}>
      <Icon className="w-2.5 h-2.5" />
      {platform}
    </span>
  );
}

// ─── Main Component ───────────────────────────────
export default function SoftwareManagerPage() {
  const navigate = useNavigate();
  const [software, setSoftware] = useState<SoftwareItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePlatform, setActivePlatform] = useState('全部平台');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SoftwareItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [platformOpen, setPlatformOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Upload form
  const [form, setForm] = useState<SoftwareForm>({ name: '', version: '', category: '开发工具', platform: 'macOS', description: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res: any = await getSoftwareData();
      if (res.code === 0) {
        const list = (res.data || []).map((s: any) => ({
          id: s.id || s.id,
          name: s.name,
          version: s.version,
          category: s.category,
          platform: s.platform,
          description: s.description,
          fileSize: s.fileSize ? (s.fileSize / (1024 * 1024)).toFixed(1) + ' MB' : '',
          createdAt: s.CreatedAt?.split('T')[0] || s.createdAt?.split('T')[0] || '',
          downloadUrl: `/software/download/${s.id || s.id}`
        }));
        setSoftware(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return software.filter(s => {
      const matchCat = activeCategory === 'all' || s.category === activeCategory;
      const matchPlatform = activePlatform === '全部平台' || s.platform === activePlatform;
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
      return matchCat && matchPlatform && matchSearch;
    });
  }, [software, searchQuery, activeCategory, activePlatform]);

  const handleAddSoftware = async () => {
    if (!form.name.trim() || !form.file) return;
    try {
      setIsUploading(true);
      const res: any = await addSoftware(form);
      if (res.code === 0) {
        await fetchData();
        setForm({ name: '', version: '', category: '开发工具', platform: 'macOS', description: '', file: undefined });
        setIsUploadOpen(false);
      } else {
        console.error('Upload failed:', res.msg);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res: any = await deleteSoftware(id);
      if (res.code === 0) {
        setSoftware(prev => prev.filter(s => s.id !== id));
        setDeleteConfirmId(null);
        if (selectedItem?.id === id) setSelectedItem(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = async () => {
    if (!selectedItem || !selectedItem.downloadUrl) return;
    try {
      setIsDownloading(true);
      const token = localStorage.getItem('token') || '';
      const response = await fetch(selectedItem.downloadUrl, {
        headers: {
          'x-token': token,
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cd = response.headers.get('content-disposition');
        let filename = selectedItem.name;
        if (cd && cd.includes('filename="')) {
          filename = cd.split('filename="')[1].split('"')[0];
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Download failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: software.length };
    software.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
    return counts;
  }, [software]);

  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex font-sans overflow-hidden">
      {/* ── Left Sidebar ── */}
      <aside className="w-56 shrink-0 border-r border-white/5 bg-[#0B0D14] flex flex-col py-6 overflow-hidden">
        {/* Back + Title */}
        <div className="px-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-green-500/15 text-green-400">
              <AppWindow className="w-5 h-5" />
            </div>
            <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">
              软件管理
            </h1>
          </div>
        </div>

        {/* Categories */}
        <div className="px-3 flex-1 overflow-y-auto space-y-0.5 webkit-scrollbar">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-2 mb-2">分类</p>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const count = categoryCounts[cat.id] || 0;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                  active ? 'bg-green-500/15 text-green-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {cat.label}
                </span>
                {count > 0 && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${active ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-slate-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Upload Button */}
        <div className="px-4 pt-4 border-t border-white/5">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 text-sm font-medium transition-all border border-green-500/20 hover:border-green-500/30"
          >
            <Plus className="w-4 h-4" />
            添加软件
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="shrink-0 h-14 border-b border-white/5 bg-[#0B0D14]/80 backdrop-blur-md px-5 flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索软件名称、分类、描述..."
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-green-500/40 focus:bg-white/[0.06] transition-all"
            />
          </div>

          {/* Platform Filter */}
          <div className="relative">
            <button
              onClick={() => setPlatformOpen(prev => !prev)}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] transition-all"
            >
              <Monitor className="w-3.5 h-3.5" />
              {activePlatform}
              <ChevronDown className="w-3 h-3" />
            </button>
            {platformOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setPlatformOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-32 bg-[#13151F] border border-white/10 rounded-xl shadow-2xl py-1 z-20 overflow-hidden flex flex-col">
                  {PLATFORMS.map(p => (
                    <button
                      key={p}
                      onClick={() => { setActivePlatform(p); setPlatformOpen(false); }}
                      className={`text-left px-3 py-2 text-sm transition-all ${activePlatform === p ? 'bg-green-500/10 text-green-400' : 'text-slate-300 hover:bg-white/5'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
            {[
              { id: 'grid', icon: Grid3X3 },
              { id: 'list', icon: List }
            ].map(vm => (
              <button
                key={vm.id}
                onClick={() => setViewMode(vm.id as any)}
                className={`p-1.5 rounded-lg transition-all ${viewMode === vm.id ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <vm.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 webkit-scrollbar relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-green-500/50 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
                <AppWindow className="w-8 h-8 text-slate-600" />
              </div>
              <p>暂无匹配的软件应用</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {viewMode === 'grid' ? (
                /* Grid View */
                <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-7 gap-4">
                  {filtered.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedItem(item)}
                      className={`group flex flex-col items-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.07] hover:border-white/10 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 ${selectedItem?.id === item.id ? 'border-green-500/30 bg-green-500/[0.06]' : ''}`}
                    >
                      <AppIcon name={item.name} size="md" />
                      <div className="mt-3 text-center w-full">
                        <p className="text-xs font-semibold text-slate-200 truncate max-w-full leading-tight">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5 truncate">{item.version}</p>
                      </div>
                      <div className="mt-2">
                        <PlatformBadge platform={item.platform} />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                /* List View */
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
                  {filtered.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setSelectedItem(item)}
                      className={`group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/10 cursor-pointer transition-all ${selectedItem?.id === item.id ? 'border-green-500/30 bg-green-500/[0.06]' : ''}`}
                    >
                      <AppIcon name={item.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-200 truncate">{item.name}</p>
                          <PlatformBadge platform={item.platform} />
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{item.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-slate-400 font-mono">{item.version}</p>
                        {item.fileSize && <p className="text-[10px] text-slate-600 mt-0.5">{item.fileSize}</p>}
                      </div>
                      <span className="shrink-0 text-xs px-2 py-1 rounded-lg bg-white/5 text-slate-500">{item.category}</span>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteConfirmId(item.id); }}
                        className="shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* ── Right Detail Panel ── */}
      <AnimatePresence>
        {selectedItem && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="shrink-0 border-l border-white/5 bg-[#0B0D14] flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-5 webkit-scrollbar">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div />
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* App Info */}
              <div className="flex flex-col items-center text-center mb-6">
                <AppIcon name={selectedItem.name} size="lg" />
                <h2 className="text-base font-bold text-white mt-4 leading-tight">{selectedItem.name}</h2>
                <p className="text-xs text-slate-500 mt-1">v{selectedItem.version}</p>
                <div className="mt-2">
                  <PlatformBadge platform={selectedItem.platform} />
                </div>
              </div>

              {/* Description */}
              {selectedItem.description && (
                <div className="mb-5">
                  <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-2">简介</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{selectedItem.description}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-2 mb-6">
                <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-2">详情</p>
                {[
                  { label: '分类', value: selectedItem.category },
                  { label: '平台', value: selectedItem.platform },
                  { label: '版本', value: selectedItem.version },
                  ...(selectedItem.fileSize ? [{ label: '大小', value: selectedItem.fileSize }] : []),
                  ...(selectedItem.createdAt ? [{ label: '添加', value: selectedItem.createdAt }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-xs text-slate-600">{label}</span>
                    <span className="text-xs text-slate-300 font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {selectedItem.downloadUrl && (
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-medium transition-all border border-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isDownloading ? '准备下载...' : '下载软件文件'}
                  </button>
                )}
                <button
                  onClick={() => setDeleteConfirmId(selectedItem.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-500/70 hover:text-red-400 text-sm font-medium transition-all border border-red-500/10 hover:border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  删除记录
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Add Software Modal ── */}
      <AnimatePresence>
        {isUploadOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => !isUploading && setIsUploadOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-[#13151F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-green-500/15 text-green-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-white text-sm">添加软件安装包</span>
                </div>
                <button onClick={() => !isUploading && setIsUploadOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                
                {/* File Upload Area */}
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1.5 font-medium">安装包文件 *</label>
                  <label className="block w-full border-2 border-dashed border-white/[0.08] hover:border-green-500/30 rounded-xl p-4 text-center cursor-pointer transition-all bg-white/[0.02] hover:bg-green-500/[0.02]">
                    <UploadIcon className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                    <span className="text-sm text-slate-300">
                      {form.file ? form.file.name : "点击选择软件文件 (需包含扩展名)"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files?.[0]) {
                          const file = e.target.files[0];
                          // auto-extract name if empty
                          setForm(prev => ({
                            ...prev, 
                            file,
                            name: prev.name || file.name.replace(/\.[^/.]+$/, "") 
                          }));
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-500 mb-1.5 font-medium">软件名称 *</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="例：Visual Studio Code"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-green-500/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1.5 font-medium">版本号</label>
                    <input
                      value={form.version}
                      onChange={e => setForm(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="例：1.87.0"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-green-500/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1.5 font-medium">平台</label>
                    <select
                      value={form.platform}
                      onChange={e => setForm(prev => ({ ...prev, platform: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-green-500/40 transition-all appearance-none"
                    >
                      {PLATFORMS.slice(1).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-500 mb-1.5 font-medium">分类</label>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.slice(1).map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setForm(prev => ({ ...prev, category: cat.id }))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${form.category === cat.id ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/[0.04] text-slate-500 border-white/[0.06] hover:border-white/10 hover:text-slate-300'}`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-500 mb-1.5 font-medium">描述</label>
                    <textarea
                      rows={2}
                      value={form.description}
                      onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="简短描述这个软件的用途..."
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-green-500/40 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
                <button
                  onClick={() => !isUploading && setIsUploadOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleAddSoftware}
                  disabled={!form.name.trim() || !form.file || isUploading}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/20 hover:border-green-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : '开始上传'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ── */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#13151F] border border-white/10 rounded-2xl p-6 w-72 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">确定删除？</h3>
              <p className="text-xs text-slate-500 mb-5">此操作将删除文件，不可撤销</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2 rounded-xl text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 transition-all"
                >
                  删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
