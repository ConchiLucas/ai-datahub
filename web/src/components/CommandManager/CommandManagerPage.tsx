import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import {
  ArrowLeft, Terminal, Search, Plus, Copy, Check,
  Trash2, Clock, X, Tag, Filter, Edit2
} from 'lucide-react';
import {
  addCommand as apiAddCommand, deleteCommand as apiDeleteCommand,
  updateCommand as apiUpdateCommand, getCommandData,
  addCommandCategory, deleteCommandCategory
} from '@/api/command';
import { toast } from 'react-hot-toast';

// ─── Types ───────────────────────────
interface CommandItem {
  id: number;
  title: string;
  command: string;
  description: string;
  category: string;
  CreatedAt: string;
}

// ─── Inline Code Block with Line Numbers ───
function CodeBlock({ code, maxLines = 6 }: { code: string; maxLines?: number }) {
  const lines = code.split('\n');
  const displayLines = lines.slice(0, maxLines);
  const hasMore = lines.length > maxLines;

  return (
    <div className="rounded-lg bg-[#0a0b10] border border-white/5 overflow-hidden font-mono text-xs">
      <div className="flex">
        {/* Line Numbers */}
        <div className="flex-shrink-0 py-2.5 px-2 text-right select-none border-r border-white/5 bg-white/[0.02]">
          {displayLines.map((_, i) => (
            <div key={i} className="leading-5 text-slate-600">{i + 1}</div>
          ))}
          {hasMore && <div className="leading-5 text-slate-700">…</div>}
        </div>
        {/* Code Content */}
        <div className="flex-1 py-2.5 px-3 overflow-x-auto">
          {displayLines.map((line, i) => (
            <div key={i} className="leading-5 text-amber-400/90 whitespace-pre">{line || ' '}</div>
          ))}
          {hasMore && (
            <div className="leading-5 text-slate-600 italic">+{lines.length - maxLines} 行更多...</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────
export default function CommandManagerPage() {
  const navigate = useNavigate();
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCmd, setSelectedCmd] = useState<CommandItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCommand, setEditCommand] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createCommand, setCreateCommand] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createCategory, setCreateCategory] = useState('');

  // Copy & Delete
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // ─── Fetch Data ──────────────────────
  const fetchData = async () => {
    const res: any = await getCommandData();
    if (res.code === 0) {
      const cmds = res.data.commands || [];
      setCommands(cmds);
      
      const cats = res.data.categories || [];
      const dbCats = cats.map((c: any) => c.name);
      const cmdCats = cmds.map((c: any) => c.category).filter((c: string) => c && c !== 'All');
      const uniqueCats = Array.from(new Set([...dbCats, ...cmdCats]));
      
      setCategories(uniqueCats);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Filtering ───────────────────────
  const filteredCommands = useMemo(() => {
    return commands.filter(c => {
      const matchCat = activeCategory === 'All' || c.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch = c.title.toLowerCase().includes(q) ||
                          c.command.toLowerCase().includes(q) ||
                          (c.description || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [commands, activeCategory, searchQuery]);

  // ─── Handlers ────────────────────────
  const handleCopy = useCallback((cmd: CommandItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(cmd.command);
    setCopiedId(cmd.id);
    toast.success('已复制到剪贴板');
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleSelect = (cmd: CommandItem) => {
    setSelectedCmd(cmd);
    setEditTitle(cmd.title);
    setEditCommand(cmd.command);
    setEditDesc(cmd.description);
    setEditCategory(cmd.category);
    setIsDrawerOpen(true);
  };

  const handleDrawerSave = async () => {
    if (!selectedCmd) return;
    try {
      const res: any = await apiUpdateCommand({
        id: selectedCmd.id,
        title: editTitle,
        command: editCommand,
        description: editDesc,
        category: editCategory,
      });
      if (res.code === 0) {
        toast.success('修改成功');
        fetchData();
        setSelectedCmd({ ...selectedCmd, title: editTitle, command: editCommand, description: editDesc, category: editCategory });
      } else {
        toast.error(res.msg || '修改失败');
      }
    } catch (e) {
      toast.error('修改失败');
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedCmd(null), 300);
  };

  const handleCreate = async () => {
    if (!createTitle.trim() || !createCommand.trim()) {
      toast.error('命令名称和内容不能为空');
      return;
    }
    try {
      const res: any = await apiAddCommand({
        title: createTitle,
        command: createCommand,
        description: createDesc,
        category: createCategory || categories[0] || 'Other',
      });
      if (res.code === 0) {
        toast.success('创建成功');
        fetchData();
        setIsCreateOpen(false);
        setCreateTitle(''); setCreateCommand(''); setCreateDesc(''); setCreateCategory('');
      } else {
        toast.error(res.msg || '创建失败');
      }
    } catch (e) {
      toast.error('创建失败');
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      const res: any = await apiDeleteCommand({ id: deleteConfirmId });
      if (res.code === 0) {
        toast.success('删除成功');
        fetchData();
        if (selectedCmd?.id === deleteConfirmId) { setIsDrawerOpen(false); setSelectedCmd(null); }
      } else {
        toast.error(res.msg || '删除失败');
      }
    } catch (e) {
      toast.error('删除失败');
    }
    setDeleteConfirmId(null);
  };

  // Monaco editor options shared
  const monacoOptions = {
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbersMinChars: 3,
    padding: { top: 12, bottom: 12 },
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on' as const,
    renderLineHighlight: 'line' as const,
    lineHeight: 22,
    scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    contextmenu: false,
  };

  return (
    <div className="h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/3 w-[50%] h-[400px] bg-amber-500/8 blur-[120px] rounded-full pointer-events-none" />

      {/* ─── Header ─── */}
      <header className="h-16 border-b border-white/5 bg-[#0F111A]/80 flex-shrink-0 flex items-center justify-between px-6 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Terminal className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-500">
              常用命令管理
            </h1>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 flex justify-center max-w-lg mx-4">
          <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索命令名称或内容..."
              className="pl-10 pr-4 py-2 w-full bg-[#151926]/90 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all placeholder-slate-500 text-slate-200"
            />
          </div>
        </div>

        <button
          onClick={() => { setCreateCategory(categories[0] || ''); setIsCreateOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-medium hover:opacity-90 transition-opacity text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>新增命令</span>
        </button>
      </header>

      {/* ─── Main ─── */}
      <main className="flex-1 flex overflow-hidden z-10">
        {/* Left Sidebar - Categories */}
        <aside className="w-52 border-r border-white/5 bg-[#0F111A]/50 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Filter className="w-4 h-4" />
              <span>分类过滤</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {['All', ...categories].map(cat => {
              const count = cat === 'All' ? commands.length : commands.filter(c => c.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm mb-1 transition-all ${
                    activeCategory === cat
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span>{cat === 'All' ? '全部' : cat}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full">{count}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center - Command Cards */}
        <section className="flex-1 flex flex-col bg-[#07080C]/30 overflow-hidden">
          {/* List Header */}
          <div className="flex items-center px-6 py-3 border-b border-white/5 bg-[#0F111A]/30">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-400">
                {activeCategory === 'All' ? '全部命令' : activeCategory}
              </span>
              <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                {filteredCommands.length}
              </span>
            </div>
          </div>

          {/* Command Cards */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredCommands.map((cmd, i) => {
                const lineCount = cmd.command.split('\n').length;
                return (
                  <motion.div
                    key={cmd.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.03 }}
                    className={`group rounded-xl border transition-all cursor-pointer ${
                      selectedCmd?.id === cmd.id
                        ? 'bg-[#12141D] border-amber-500/30 shadow-lg shadow-amber-500/5'
                        : 'bg-[#0D0F18]/60 border-white/5 hover:border-white/10 hover:bg-[#12141D]/80'
                    }`}
                    onClick={() => handleSelect(cmd)}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                          selectedCmd?.id === cmd.id ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-500'
                        }`}>
                          <Terminal className="w-3.5 h-3.5" />
                        </div>
                        <h3 className={`font-medium text-sm truncate ${
                          selectedCmd?.id === cmd.id ? 'text-amber-400' : 'text-slate-200'
                        }`}>
                          {cmd.title}
                        </h3>
                        {cmd.description && (
                          <span className="text-xs text-slate-500 truncate hidden sm:inline">— {cmd.description}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                          {cmd.category}
                        </span>
                        <span className="text-[10px] text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(cmd.CreatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                        </span>
                        {lineCount > 1 && (
                          <span className="text-[10px] text-amber-500/60 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10">
                            {lineCount} 行
                          </span>
                        )}
                        {/* Actions */}
                        <button
                          onClick={(e) => handleCopy(cmd, e)}
                          className={`p-1.5 rounded-lg transition-all ${
                            copiedId === cmd.id
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400'
                          }`}
                          title="复制命令"
                        >
                          {copiedId === cmd.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSelect(cmd); }}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 transition-all"
                          title="编辑"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(cmd.id); }}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Code Block */}
                    <div className="px-4 py-3">
                      <CodeBlock code={cmd.command} maxLines={6} />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredCommands.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Terminal className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">暂无匹配的命令</p>
                <p className="text-xs text-slate-600 mt-1">尝试更改搜索条件或分类</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ─── Detail Drawer ─── */}
      <AnimatePresence>
        {isDrawerOpen && selectedCmd && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseDrawer}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[640px] max-w-[90vw] bg-[#0F111A] border-l border-white/10 z-40 flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
                <span className="text-xs text-slate-500">命令编辑</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => selectedCmd && handleCopy(selectedCmd)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors text-xs"
                  >
                    {copiedId === selectedCmd?.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === selectedCmd?.id ? '已复制' : '复制命令'}
                  </button>
                  <button onClick={handleCloseDrawer} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">命令名称</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">所属分类（可输入新分类或选择已有）</label>
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      placeholder="如：Nginx"
                      className="w-full px-4 py-2 border border-white/10 rounded-xl bg-[#07080C] text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 mb-3"
                    />
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setEditCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            editCategory === cat
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                          }`}
                        >{cat}</button>
                      ))}
                    </div>
                  </div>

                  {/* Command - Monaco Editor */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      命令内容
                      <span className="ml-2 text-slate-600">({editCommand.split('\n').length} 行)</span>
                    </label>
                    <div className="rounded-xl bg-[#1a1b26] border border-white/10 overflow-hidden">
                      <Editor
                        height={`${Math.max(120, Math.min(300, editCommand.split('\n').length * 22 + 24))}px`}
                        language="shell"
                        value={editCommand}
                        onChange={v => setEditCommand(v || '')}
                        theme="vs-dark"
                        options={monacoOptions}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">备注说明</label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-slate-200 text-sm leading-relaxed focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 flex-shrink-0">
                <button onClick={handleCloseDrawer} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">
                  取消
                </button>
                <button
                  onClick={handleDrawerSave}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/20"
                >
                  保存修改
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Create Modal ─── */}
      <AnimatePresence>
        {isCreateOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#12141D] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10">
                    <Terminal className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">新增命令</h3>
                </div>
                <button onClick={() => setIsCreateOpen(false)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">命令名称 *</label>
                  <input
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="例：重启 Nginx 服务"
                    className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">所属分类（可输入新分类或选择已有）</label>
                  <input
                    type="text"
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    placeholder="如：Nginx"
                    className="w-full px-4 py-2 border border-white/10 rounded-xl bg-[#07080C] text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 mb-3 placeholder-slate-600"
                  />
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCreateCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          createCategory === cat
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                        }`}
                      >{cat}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">命令内容 *</label>
                  <div className="rounded-xl bg-[#1a1b26] border border-white/10 overflow-hidden">
                    <Editor
                      height="200px"
                      language="shell"
                      value={createCommand}
                      onChange={v => setCreateCommand(v || '')}
                      theme="vs-dark"
                      options={monacoOptions}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">备注说明（可选）</label>
                  <textarea
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    placeholder="简要描述命令的用途..."
                    rows={3}
                    className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-slate-200 text-sm leading-relaxed focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all placeholder-slate-500 resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 flex-shrink-0">
                <button onClick={() => setIsCreateOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors">
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/20"
                >
                  确认新增
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
              <p className="text-sm text-slate-400 mb-6">删除后将无法恢复，确定要删除这条命令吗？</p>
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
