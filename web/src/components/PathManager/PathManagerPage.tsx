import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import {
  ArrowLeft, FolderTree, Search, Plus, Copy, Check,
  Trash2, X, Tag, Filter, Server, Monitor, Clock, Edit2, FileCode2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getPathData, addPath, updatePath, deletePath } from '@/api/pathManagement';

// ─── Types ───────────────────────────
interface PathItem {
  id: number;
  title: string;
  path: string;
  description: string;
  content: string;
  category: string;
  category: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}


// ─── Component ───────────────────────
export default function PathManagerPage() {
  const navigate = useNavigate();
  const [paths, setPaths] = useState<PathItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');

  // Detail Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<PathItem | null>(null);

  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPath, setEditPath] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createPath, setCreatePath] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createCategory, setCreateCategory] = useState('');

  // Copy & Delete
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await getPathData();
      if (res.code === 0) {
        setPaths(res.data.paths || []);
        setCategories(res.data.categories ? res.data.categories.map((c: any) => c.name) : []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Filtering ───────────────────────
  const filteredPaths = useMemo(() => {
    return paths.filter(p => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch = p.title.toLowerCase().includes(q) ||
                          p.path.toLowerCase().includes(q) ||
                          (p.description || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [paths, activeCategory, searchQuery]);

  // ─── Handlers ────────────────────────
  const handleCopy = useCallback((text: string, id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('路径已复制');
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleSelect = (item: PathItem) => {
    setSelectedPath(item);
    setIsDrawerOpen(true);
  };

  const handleSelectForEdit = (item: PathItem) => {
    setSelectedPath(item);
    setEditTitle(item.title);
    setEditPath(item.path);
    setEditDesc(item.description);
    setEditContent(item.content);
    setEditCategory(item.category);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedPath) return;
    if (!editTitle.trim() || !editPath.trim()) {
      toast.error('名称和路径不能为空');
      return;
    }
    
    try {
      const res = await updatePath({
        id: selectedPath.id,
        title: editTitle.trim(),
        path: editPath.trim(),
        description: editDesc,
        content: editContent,
        category: editCategory || '未分类',
      });
      if (res.code === 0) {
        toast.success('修改成功');
        setIsEditModalOpen(false);
        // update drawer state if open
        const now = new Date().toISOString();
        setSelectedPath({ ...selectedPath, title: editTitle, path: editPath, description: editDesc, content: editContent, category: editCategory, UpdatedAt: now });
        loadData();
      } else {
        toast.error(res.msg || '修改失败');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedPath(null), 300);
  };

  const handleCreate = async () => {
    if (!createTitle.trim() || !createPath.trim()) {
      toast.error('名称和路径不能为空');
      return;
    }
    try {
      const res = await addPath({
        title: createTitle.trim(),
        path: createPath.trim(),
        description: createDesc,
        content: createContent,
        category: createCategory || '未分类',
      });
      if (res.code === 0) {
        toast.success('创建成功');
        setIsCreateOpen(false);
        setCreateTitle(''); setCreatePath(''); setCreateDesc(''); setCreateContent(''); setCreateCategory('');
        loadData();
      } else {
        toast.error(res.msg || '创建失败');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      const res = await deletePath({ id: deleteConfirmId });
      if (res.code === 0) {
        toast.success('删除成功');
        if (selectedPath?.id === deleteConfirmId) { setIsDrawerOpen(false); setSelectedPath(null); }
        setDeleteConfirmId(null);
        loadData();
      } else {
        toast.error(res.msg || '删除失败');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getCategoryIcon = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes('服务器') || lower.includes('server') || lower.includes('远程') || lower.includes('linux') || lower.includes('centos') || lower.includes('ubuntu')) {
      return <Server className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/3 w-[50%] h-[400px] bg-teal-500/8 blur-[120px] rounded-full pointer-events-none" />

      {/* ─── Header ─── */}
      <header className="h-16 border-b border-white/5 bg-[#0F111A]/80 flex-shrink-0 flex items-center justify-between px-6 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
              <FolderTree className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-500">
              路径管理
            </h1>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 flex justify-center max-w-lg mx-4">
          <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索路径名称或地址..."
              className="pl-10 pr-4 py-2 w-full bg-[#151926]/90 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 transition-all placeholder-slate-500 text-slate-200"
            />
          </div>
        </div>

        <button
          onClick={() => { setCreateCategory(''); setIsCreateOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-900 font-medium hover:opacity-90 transition-opacity text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>新增路径</span>
        </button>
      </header>

      {/* ─── Main ─── */}
      <main className="flex-1 flex overflow-hidden z-10">
        {/* Left Sidebar - Categories */}
        <aside className="w-52 border-r border-white/5 bg-[#0F111A]/50 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Filter className="w-4 h-4" />
              <span>设备分类</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {['All', ...categories].map(cat => {
              const count = cat === 'All' ? paths.length : paths.filter(p => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm mb-1 transition-all ${
                    activeCategory === cat
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {cat === 'All' ? <Tag className="w-4 h-4" /> : getCategoryIcon(cat)}
                    <span className="truncate">{cat === 'All' ? '全部' : cat}</span>
                  </div>
                  <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center - Path List */}
        <section className="flex-1 flex flex-col bg-[#07080C]/30 overflow-hidden">
          {/* List Header */}
          <div className="flex items-center px-6 py-3 border-b border-white/5 bg-[#0F111A]/30">
            <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
              {/* Spacer matching the icon block */}
              <div className="w-8 flex-shrink-0 hidden sm:block" />
              <div className="w-48 lg:w-80 min-w-0 flex-shrink-0 text-xs text-slate-500 font-medium">名称</div>
              <div className="flex-1 min-w-0 pr-4 hidden md:block text-xs text-slate-500 font-medium">路径</div>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
              <span className="w-24 text-center">更新时间</span>
              <span className="w-24" />
            </div>
          </div>

          {/* Path Items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredPaths.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => handleSelect(item)}
                  className={`group flex items-center px-6 py-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/[0.03] ${
                    selectedPath?.id === item.id ? 'bg-teal-500/10 border-l-2 border-l-teal-500' : 'border-l-2 border-l-transparent'
                  }`}
                >
                  {/* Left Info: Name and Path Columns */}
                  <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 hidden sm:flex ${
                      selectedPath?.id === item.id ? 'bg-teal-500/20 text-teal-400' : 'bg-white/5 text-slate-400'
                    }`}>
                      <FolderTree className="w-4 h-4" />
                    </div>
                    <div className="w-48 lg:w-80 min-w-0 flex-shrink-0">
                      <h3 className={`font-medium text-sm truncate ${
                        selectedPath?.id === item.id ? 'text-teal-400' : 'text-slate-200'
                      }`}>
                        {item.title}
                      </h3>
                    </div>
                    <div className="flex-1 min-w-0 pr-4 hidden md:block">
                      <code className="text-[11px] lg:text-xs text-teal-500/70 bg-teal-500/5 px-2 py-1 rounded font-mono truncate max-w-full border border-teal-500/10 inline-block">
                        {item.path}
                      </code>
                    </div>
                  </div>

                  {/* Right Columns */}
                  <div className="flex items-center gap-4 text-xs flex-shrink-0">
                    <span className="w-24 text-center text-slate-500 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.UpdatedAt || item.CreatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="w-24 flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelectForEdit(item); }}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-teal-500/20 text-slate-500 hover:text-teal-400 transition-all"
                        title="修改"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleCopy(item.path, item.id, e)}
                        className={`p-1.5 rounded-lg transition-all ${
                          copiedId === item.id
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-teal-500/20 text-slate-400 hover:text-teal-400'
                        }`}
                        title="复制路径"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id); }}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredPaths.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <FolderTree className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">暂无路径记录</p>
                <p className="text-xs text-slate-600 mt-1">点击右上角「新增路径」添加配置文件路径</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ─── Detail Drawer (View Only) ─── */}
      <AnimatePresence>
        {isDrawerOpen && selectedPath && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseDrawer}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[1100px] max-w-[95vw] bg-[#0F111A] border-l border-white/10 z-40 flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-slate-100">{selectedPath.title}</span>
                  <code className="text-xs text-teal-400 font-mono bg-teal-500/10 border border-teal-500/20 px-2 py-1 rounded-md">
                    {selectedPath.path}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectForEdit(selectedPath)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 transition-colors text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    修改信息
                  </button>
                  <button onClick={handleCloseDrawer} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-hidden flex flex-col bg-[#1a1b26]">
                <Editor
                  height="100%"
                  value={selectedPath.content || '// 暂无配置文件内容'}
                  language="shell"
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
                    minimap: { enabled: false }, scrollBeyondLastLine: false,
                    lineNumbersMinChars: 4, padding: { top: 16, bottom: 16 },
                    automaticLayout: true, tabSize: 2, wordWrap: 'on',
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Create & Edit Modal ─── */}
      <AnimatePresence>
        {(isCreateOpen || isEditModalOpen) && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => isCreateOpen ? setIsCreateOpen(false) : setIsEditModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#12141D] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-500/10">
                    {isEditModalOpen ? <Edit2 className="w-5 h-5 text-teal-400" /> : <FolderTree className="w-5 h-5 text-teal-400" />}
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{isEditModalOpen ? '修改路径配置' : '新增路径'}</h3>
                </div>
                <button onClick={() => isCreateOpen ? setIsCreateOpen(false) : setIsEditModalOpen(false)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">名称 *</label>
                  <input
                    type="text"
                    value={isEditModalOpen ? editTitle : createTitle}
                    onChange={(e) => isEditModalOpen ? setEditTitle(e.target.value) : setCreateTitle(e.target.value)}
                    placeholder="例：Nginx 主配置"
                    className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 transition-all placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">设备分类（可输入新分类或选择已有）</label>
                  <input
                    type="text"
                    value={isEditModalOpen ? editCategory : createCategory}
                    onChange={(e) => isEditModalOpen ? setEditCategory(e.target.value) : setCreateCategory(e.target.value)}
                    placeholder="如：MacBook Pro、阿里云服务器"
                    className="w-full px-4 py-2 border border-white/10 rounded-xl bg-[#07080C] text-sm text-slate-200 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 mb-3 placeholder-slate-600"
                  />
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => isEditModalOpen ? setEditCategory(cat) : setCreateCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          (isEditModalOpen ? editCategory : createCategory) === cat
                            ? 'bg-teal-500/20 text-teal-400 border-teal-500/40'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                        }`}
                      >{cat}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">文件路径 *</label>
                  <input
                    type="text"
                    value={isEditModalOpen ? editPath : createPath}
                    onChange={(e) => isEditModalOpen ? setEditPath(e.target.value) : setCreatePath(e.target.value)}
                    placeholder="/etc/nginx/nginx.conf"
                    className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-teal-400 text-sm font-mono focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 transition-all placeholder-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">备注说明（可选）</label>
                  <textarea
                    value={isEditModalOpen ? editDesc : createDesc}
                    onChange={(e) => isEditModalOpen ? setEditDesc(e.target.value) : setCreateDesc(e.target.value)}
                    placeholder="简要描述这个配置文件的用途..."
                    rows={2}
                    className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-slate-200 text-sm leading-relaxed focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 transition-all placeholder-slate-500 resize-none"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
                    <FileCode2 className="w-3.5 h-3.5 text-teal-500" />
                    配置内容（可选）
                  </label>
                  <div className="rounded-xl bg-[#1a1b26] border border-white/10 overflow-hidden">
                    <Editor
                      height="300px"
                      value={isEditModalOpen ? editContent : createContent}
                      onChange={(v) => isEditModalOpen ? setEditContent(v || '') : setCreateContent(v || '')}
                      language="shell"
                      theme="vs-dark"
                      options={{
                        fontSize: 13, fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
                        minimap: { enabled: false }, scrollBeyondLastLine: false,
                        lineNumbersMinChars: 3, padding: { top: 12, bottom: 12 },
                        automaticLayout: true, tabSize: 2, wordWrap: 'on',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
                <button onClick={() => isCreateOpen ? setIsCreateOpen(false) : setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">
                  取消
                </button>
                <button
                  onClick={isEditModalOpen ? handleEditSave : handleCreate}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-900 hover:opacity-90 transition-opacity shadow-lg shadow-teal-500/20"
                >
                  {isEditModalOpen ? '确认修改' : '确认新增'}
                </button>
              </div>
            </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirmation ─── */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#12141D] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-red-500/10">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">确认删除</h3>
              </div>
              <p className="text-sm text-slate-400 mb-6">删除后将无法恢复，确定要删除这条路径记录吗？</p>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">
                  取消
                </button>
                <button onClick={confirmDelete} className="px-5 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20">
                  确认删除
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
