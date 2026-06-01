import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, Search, Plus, Filter, Settings2, X,
  Copy, Check, Edit2, Trash2, FileText, Clock, MessageSquare
} from 'lucide-react';
import { Prompt } from './types';
import PromptModal from './PromptModal';
import {
  addPrompt, deletePrompt, updatePrompt, getPromptData,
  addPromptCategory, deletePromptCategory
} from '@/api/prompt';

export default function PromptManagerPage() {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Tag/Category state
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const allCategories = ['All', ...customCategories];
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTagText, setNewTagText] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  // Drawer editing fields
  const [drawerEditTitle, setDrawerEditTitle] = useState('');
  const [drawerEditCategory, setDrawerEditCategory] = useState('');
  const [drawerEditContent, setDrawerEditContent] = useState('');

  // Copy feedback
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchPromptData = async () => {
    const res: any = await getPromptData();
    if (res.code === 0) {
      setPrompts(res.data.prompts || []);
      const cats = res.data.categories || [];
      setCustomCategories(cats.map((c: any) => c.name));
    }
  };

  useEffect(() => {
    fetchPromptData();
  }, []);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [prompts, searchQuery, activeCategory]);

  const handleSave = async (promptData: Omit<Prompt, 'id' | 'createdAt'> | Prompt) => {
    if ('id' in promptData) {
      const res: any = await updatePrompt({
        id: promptData.id,
        title: promptData.title,
        category: promptData.category,
        content: promptData.content
      });
      if (res.code === 0) {
        fetchPromptData();
        if (selectedPrompt?.id === promptData.id) {
          setSelectedPrompt({ ...selectedPrompt, ...promptData });
        }
      }
    } else {
      const res: any = await addPrompt({
        title: promptData.title,
        category: promptData.category,
        content: promptData.content
      });
      if (res.code === 0) fetchPromptData();
    }
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    const res: any = await deletePrompt({ id: deleteConfirmId });
    if (res.code === 0) {
      fetchPromptData();
      if (selectedPrompt?.id === deleteConfirmId) {
        setSelectedPrompt(null);
        setIsDrawerOpen(false);
      }
    }
    setDeleteConfirmId(null);
  };

  const handleAddTag = async () => {
    if (newTagText.trim() && !customCategories.includes(newTagText.trim())) {
      const res: any = await addPromptCategory({ name: newTagText.trim() });
      if (res.code === 0) {
        setNewTagText('');
        fetchPromptData();
      }
    }
  };

  const handleCopyContent = useCallback(async (prompt: Prompt) => {
    await navigator.clipboard.writeText(prompt.content);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleSelectPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setDrawerEditTitle(prompt.title);
    setDrawerEditCategory(prompt.category);
    setDrawerEditContent(prompt.content);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedPrompt(null), 300);
  };

  const handleDrawerSave = async () => {
    if (!selectedPrompt) return;
    const res: any = await updatePrompt({
      id: selectedPrompt.id,
      title: drawerEditTitle,
      category: drawerEditCategory,
      content: drawerEditContent,
    });
    if (res.code === 0) {
      fetchPromptData();
      setSelectedPrompt({ ...selectedPrompt, title: drawerEditTitle, category: drawerEditCategory, content: drawerEditContent });
    }
  };

  // Truncate content for preview
  const truncateContent = (content: string, maxLength: number = 60) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-[50%] h-[500px] bg-fuchsia-500/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute top-1/2 right-0 w-[40%] h-[400px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />

      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-[#0F111A]/80 flex-shrink-0 flex items-center justify-between px-6 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl transition-all bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.2)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-pink-500">
              提示词管理库
            </h1>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center max-w-lg mx-4">
          <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-fuchsia-400 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索提示词标题或内容..."
              className="pl-10 pr-4 py-2 w-full bg-[#151926]/90 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/10 transition-all placeholder-slate-500 text-slate-200"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setEditingPrompt(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>新增提示词</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden z-10">
        {/* Left Sidebar - Categories */}
        <aside className="w-52 border-r border-white/5 bg-[#0F111A]/50 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Filter className="w-4 h-4" />
                <span>分类</span>
              </div>
              <button
                onClick={() => setIsEditingTags(!isEditingTags)}
                className={`p-1.5 rounded-lg transition-colors ${isEditingTags ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'hover:bg-white/10 hover:text-white'}`}
                title="编辑分类"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </div>

            {isEditingTags && (
              <div className="flex items-center gap-2 mb-3 bg-black/40 border border-white/5 rounded-lg px-2 py-1">
                <input
                  type="text"
                  value={newTagText}
                  onChange={(e) => setNewTagText(e.target.value)}
                  placeholder="新分类"
                  className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 placeholder-slate-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <button onClick={handleAddTag} className="p-1 hover:bg-white/10 rounded text-slate-400">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {allCategories.map(category => {
              const count = category === 'All'
                ? prompts.length
                : prompts.filter(p => p.category === category).length;

              return (
                <button
                  key={category}
                  onClick={() => !isEditingTags && setActiveCategory(category)}
                  disabled={isEditingTags && category === 'All'}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm mb-1 transition-all ${
                    activeCategory === category && !isEditingTags
                      ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {category === 'All' ? <FileText className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    <span>{category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full">{count}</span>
                    {isEditingTags && category !== 'All' && (
                      <span
                        onClick={async (e) => {
                          e.stopPropagation();
                          const res: any = await deletePromptCategory({ name: category });
                          if (res.code === 0) {
                            if (activeCategory === category) setActiveCategory('All');
                            fetchPromptData();
                          }
                        }}
                        className="p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 text-slate-500"
                      >
                        <X className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center - Prompt List (Full width minus sidebar) */}
        <section className="flex-1 flex flex-col bg-[#07080C]/30 overflow-hidden">
          {/* List Header */}
          <div className="flex items-center px-6 py-3 border-b border-white/5 bg-[#0F111A]/30">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-400">
                {activeCategory === 'All' ? '全部提示词' : activeCategory}
              </span>
              <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                {filteredPrompts.length}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
              <span className="w-20 text-center">分类</span>
              <span className="w-16 text-center">字数</span>
              <span className="w-20 text-center">更新时间</span>
              <span className="w-8" />
            </div>
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredPrompts.map((prompt, index) => (
                <motion.div
                  key={prompt.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleSelectPrompt(prompt)}
                  className={`group flex items-center px-6 py-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${
                    selectedPrompt?.id === prompt.id ? 'bg-fuchsia-500/10 border-l-2 border-l-fuchsia-500' : 'border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      selectedPrompt?.id === prompt.id ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-white/5 text-slate-400'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-medium text-sm truncate mb-1 ${
                        selectedPrompt?.id === prompt.id ? 'text-fuchsia-400' : 'text-slate-200'
                      }`}>
                        {prompt.title}
                      </h3>
                      <p className="text-xs text-slate-500 truncate font-mono">
                        {truncateContent(prompt.content)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs flex-shrink-0">
                    <span className="w-20 text-center text-slate-400 bg-white/5 px-2 py-1 rounded-full truncate">
                      {prompt.category}
                    </span>
                    <span className="w-16 text-center text-slate-500">
                      {prompt.content.length} 字
                    </span>
                    <span className="w-20 text-center text-slate-500 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(prompt.createdAt)}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(prompt.id); }}
                      className="w-8 flex justify-center p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredPrompts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <FileText className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm">暂无提示词</p>
                <p className="text-xs text-slate-600 mt-1">尝试更改搜索条件或分类</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Drawer - Right Side Panel */}
      <AnimatePresence>
        {isDrawerOpen && selectedPrompt && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDrawer}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[640px] max-w-[90vw] bg-[#0F111A] border-l border-white/10 z-40 flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
                <span className="text-xs text-slate-500">提示词编辑</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => selectedPrompt && handleCopyContent(selectedPrompt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors text-xs"
                  >
                    {copiedId === selectedPrompt?.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === selectedPrompt?.id ? '已复制' : '复制内容'}
                  </button>
                  <button
                    onClick={handleCloseDrawer}
                    className="p-2 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content — always editable */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6">
                  {/* Title */}
                  <div className="mb-5">
                    <label className="block text-xs font-medium text-slate-400 mb-2">标题名称</label>
                    <input
                      type="text"
                      value={drawerEditTitle}
                      onChange={(e) => setDrawerEditTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-[#07080C] border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/10 transition-all placeholder-slate-500"
                    />
                  </div>

                  {/* Category */}
                  <div className="mb-5">
                    <label className="block text-xs font-medium text-slate-400 mb-2">业务分类</label>
                    <div className="flex flex-wrap gap-2">
                      {customCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setDrawerEditCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            drawerEditCategory === cat
                              ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/40'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                          }`}
                        >{cat}</button>
                      ))}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mb-5">
                    <label className="block text-xs font-medium text-slate-400 mb-2">提示词核心内容</label>
                    <textarea
                      value={drawerEditContent}
                      onChange={(e) => setDrawerEditContent(e.target.value)}
                      className="w-full px-4 py-4 bg-[#07080C] border border-white/10 rounded-xl text-slate-200 text-sm font-mono leading-relaxed focus:outline-none focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/10 transition-all placeholder-slate-500 resize-none min-h-[400px]"
                    />
                  </div>

                  {/* Save */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                    <button
                      onClick={handleCloseDrawer}
                      className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors"
                    >取消</button>
                    <button
                      onClick={handleDrawerSave}
                      className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white hover:opacity-90 transition-opacity shadow-lg shadow-fuchsia-500/20"
                    >保存修改</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
              <p className="text-sm text-slate-400 mb-6">删除后将无法恢复，确定要删除这条提示词吗？</p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-5 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors"
                >取消</button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20"
                >确认删除</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Editor Modal */}
      <PromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingPrompt}
        categories={customCategories}
      />
    </div>
  );
}
