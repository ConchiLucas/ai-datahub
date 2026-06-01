import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Eye, ArrowLeft, Plus, Search, Globe, LayoutGrid, Terminal, Image as ImageIcon, MessageSquare, Video, Music, Code, PenTool, LayoutTemplate, Layers, Sparkles, X, UploadCloud, Settings2, Trash2, CheckCircle2, Circle, AlertTriangle, Edit2, Key, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getWebsiteData, addCategory, deleteCategory, updateCategory, addSite, updateSite, deleteSite } from '@/api/website';
import request from '@/utils/request';

interface Category {
  id: number;
  name: string;
}

interface Site {
  id: number;
  categoryId: number;
  title: string;
  desc: string;
  url: string;
  iconPath: string;
  isNew: boolean;
  accounts?: string;
}

const renderIcon = (site: Site) => {
  if (site.iconPath) {
    if (site.iconPath.startsWith('http') || site.iconPath.startsWith('/')) {
      return <img src={site.iconPath} alt="" className="w-full h-full object-cover" />;
    }
    
    switch (site.iconPath) {
      case 'openai': return <MessageSquare className="w-5 h-5" />;
      case 'star': return <Sparkles className="w-5 h-5" />;
      case 'new': return <span className="font-extrabold text-[10px] uppercase">New</span>;
      case 'ship': return <Globe className="w-5 h-5" />;
      case 'box': return <Code className="w-5 h-5" />;
      case 'robot': return <Terminal className="w-5 h-5" />;
      case 'triangle': return <LayoutTemplate className="w-5 h-5" />;
      case 'magic': return <PenTool className="w-5 h-5" />;
      case 'layers': return <Layers className="w-5 h-5" />;
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'github': return <Code className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'scan': return <Eye className="w-5 h-5" />;
      case 'cloud': return <Globe className="w-5 h-5" />;
      case 'presentation': return <LayoutGrid className="w-5 h-5" />;
      case 'music': return <Music className="w-5 h-5" />;
      default: return <span className="font-bold text-sm uppercase">{site.iconPath.substring(0,2)}</span>;
    }
  }

  return (
    <img 
      src={`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${site.url}&size=64`} 
      className="w-full h-full bg-white/10 object-cover" 
      alt="" 
    />
  );
};

export default function WebsiteManagerPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTag, setActiveTag] = useState<number>(0);
  const [modalCategory, setModalCategory] = useState<number>(0);

  const [isAddingModalCategory, setIsAddingModalCategory] = useState(false);
  const [newModalCategoryName, setNewModalCategoryName] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  
  const [renamingTagId, setRenamingTagId] = useState<number>(0);
  const [renamingTagText, setRenamingTagText] = useState('');
  
  // Selection for batch delete
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [editingSiteId, setEditingSiteId] = useState<number>(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [accountFields, setAccountFields] = useState<{id: string, keyName: string, value: string}[]>([]);
  const [copiedId, setCopiedId] = useState<string>('');

  // form items
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIconParams, setFormIconParams] = useState('');

  const fetchData = async () => {
    const res: any = await getWebsiteData();
    if (res.code === 0) {
      setCategories(res.data.categories || []);
      setSites(res.data.sites || []);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteTag = async (c: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    const res: any = await deleteCategory({ id: c.id });
    if (res.code === 0) {
      if (activeTag === c.id) setActiveTag(0);
      if (modalCategory === c.id) setModalCategory(0);
      fetchData();
    }
  };

  const handleAddTag = async () => {
    const trimmed = newTagText.trim();
    if (trimmed) {
      const res: any = await addCategory({ name: trimmed });
      if (res.code === 0) {
        setNewTagText('');
        fetchData();
      }
    }
  };

  const handleUpdateTag = async () => {
    const trimmed = renamingTagText.trim();
    if (trimmed && renamingTagId !== 0) {
      const res: any = await updateCategory({ id: renamingTagId, name: trimmed });
      if (res.code === 0) {
        setRenamingTagId(0);
        setRenamingTagText('');
        fetchData();
      }
    } else {
        setRenamingTagId(0);
    }
  };

  const handleAddModalCategory = async () => {
    const trimmed = newModalCategoryName.trim();
    if (trimmed) {
      const res: any = await addCategory({ name: trimmed });
      if (res.code === 0) {
        setNewModalCategoryName('');
        setIsAddingModalCategory(false);
        await fetchData();
        if (res.data && res.data.id) {
          setModalCategory(res.data.id);
        }
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingSiteId(0);
    setFormTitle('');
    setFormUrl('');
    setFormDesc('');
    setFormIconParams('');
    setModalCategory(categories.length > 0 ? categories[0].id : 0);
    setShowAddModal(true);
  };

  const handleOpenEditModal = () => {
    if (selectedSiteIds.length !== 1) return;
    const siteToEdit = sites.find(s => s.id === selectedSiteIds[0]);
    if (!siteToEdit) return;
    setEditingSiteId(siteToEdit.id);
    setFormTitle(siteToEdit.title);
    setFormUrl(siteToEdit.url);
    setFormDesc(siteToEdit.desc);
    setFormIconParams(siteToEdit.iconPath);
    setModalCategory(siteToEdit.categoryId);
    setShowAddModal(true);
  };

  const handleOpenAccountsModal = () => {
    if (selectedSiteIds.length !== 1) return;
    const site = sites.find(s => s.id === selectedSiteIds[0]);
    if (!site) return;
    setEditingSiteId(site.id);
    if (site.accounts) {
      try {
        const parsed = JSON.parse(site.accounts);
        setAccountFields(Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ id: Date.now().toString(), keyName: '账号', value: '' }]);
      } catch (e) {
        setAccountFields([{ id: Date.now().toString(), keyName: '账号', value: '' }]);
      }
    } else {
      setAccountFields([{ id: Date.now().toString(), keyName: '账号', value: '' }]);
    }
    setShowAccountsModal(true);
  };

  const handleSaveAccounts = async () => {
    const site = sites.find(s => s.id === editingSiteId);
    if (!site) return;
    const accountsStr = JSON.stringify(accountFields.filter(f => f.keyName.trim() || f.value.trim()));
    const res: any = await updateSite({
      ...site,
      accounts: accountsStr
    });
    if (res.code === 0) {
      setShowAccountsModal(false);
      fetchData();
    }
  };

  const handleCopyValue = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleSaveSite = async () => {
    if (!formTitle || !formUrl) return;
    if (editingSiteId !== 0) {
      const res: any = await updateSite({
        id: editingSiteId,
        categoryId: modalCategory,
        title: formTitle,
        desc: formDesc,
        url: formUrl,
        iconPath: formIconParams
      });
      if (res.code === 0) {
        setShowAddModal(false);
        fetchData();
        setSelectedSiteIds([]);
      }
    } else {
      const res: any = await addSite({
        categoryId: modalCategory,
        title: formTitle,
        desc: formDesc,
        url: formUrl,
        iconPath: formIconParams
      });
      if (res.code === 0) {
        setShowAddModal(false);
        fetchData();
      }
    }
  };

  const handleDeleteSite = async (siteId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res: any = await deleteSite({ id: siteId });
      if (res.code === 0) {
        fetchData();
      }
    } catch (err) {}
  };

  const toggleSiteSelection = (id: number) => {
    setSelectedSiteIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchDeleteSites = async () => {
    if (selectedSiteIds.length === 0) return;
    try {
      await Promise.all(selectedSiteIds.map(id => deleteSite({ id })));
      setSelectedSiteIds([]);
      await fetchData();
    } catch (err) {
      console.error('Batch delete fail', err);
    }
  };


  const filteredSites = sites.filter(site => {
    const matchSearch = site.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        site.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTag = activeTag === 0 || site.categoryId === activeTag;
    return matchSearch && matchTag;
  });

  return (
    <div className="min-h-screen bg-[#11131C] text-slate-200 selection:bg-emerald-500/30 font-sans">
      
      {/* Header */}
      <header className="h-20 shrink-0 border-b flex items-center justify-between px-8 z-50 bg-[#11131C]/90 border-white/5 backdrop-blur-xl shadow-sm sticky top-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-xl transition-all bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Globe className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
              常用网页导航
            </h1>
          </div>
        </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="搜索网站..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 bg-[#1A1D27] border border-white/5 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder-slate-500 text-slate-300"
              />
            </div>
            <button 
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>添加网站</span>
            </button>
          </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        
        {/* Category Tags */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative group/tag">
              <button 
                onClick={() => !isEditingTags && setActiveTag(0)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeTag === 0 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-inner' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                全部
              </button>
            </motion.div>
            {categories.map((c, idx) => {
              const isRenaming = renamingTagId === c.id;
              return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }} 
                key={c.id} 
                className="relative group/tag"
              >
                {isRenaming ? (
                  <div className="flex items-center gap-1 bg-[#1A1D27] border border-dashed border-emerald-500/50 rounded-full pl-3 pr-1 py-1">
                    <input
                      type="text"
                      autoFocus
                      value={renamingTagText}
                      onChange={(e) => setRenamingTagText(e.target.value)}
                      onKeyDown={(e) => {
                         if (e.key === 'Enter') handleUpdateTag();
                         if (e.key === 'Escape') setRenamingTagId(0);
                      }}
                      onBlur={handleUpdateTag}
                      className="bg-transparent border-none outline-none text-sm text-emerald-400 w-20"
                    />
                  </div>
                ) : (
                  <>
                  <button 
                    onClick={() => {
                        if (!isEditingTags) setActiveTag(c.id);
                        else {
                           setRenamingTagId(c.id);
                           setRenamingTagText(c.name);
                        }
                    }}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      activeTag === c.id 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-inner' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    } ${isEditingTags ? 'pr-8 border-dashed border-white/20 bg-[#1A1D27] cursor-text hover:border-emerald-500/30 hover:text-emerald-400' : ''}`}
                    title={isEditingTags ? "点击修改分类名称" : ""}
                  >
                    {c.name}
                  </button>
                  {isEditingTags && (
                    <button 
                      onClick={(e) => handleDeleteTag(c, e)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  </>
                )}
              </motion.div>
            )})}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isEditingTags ? (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="flex items-center gap-2 bg-[#1A1D27] border border-dashed border-white/20 rounded-full pl-3 pr-1 py-1">
                <input
                  type="text"
                  autoFocus
                  placeholder="新分类..."
                  value={newTagText}
                  onChange={(e) => setNewTagText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  className="bg-transparent border-none outline-none text-sm text-slate-200 placeholder-slate-600 w-24"
                />
                <button onClick={handleAddTag} className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </motion.div>
            ) : (
               <motion.button 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 onClick={() => setIsEditingTags(true)}
                 className="ml-2 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                 title="管理分类"
               >
                 <Settings2 className="w-4 h-4" />
               </motion.button>
            )}
            {isEditingTags && (
               <motion.button
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 onClick={() => { setIsEditingTags(false); setRenamingTagId(0); }}
                 className="ml-2 px-4 py-1.5 rounded-full text-sm font-medium bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex-shrink-0"
                 title="完成管理"
               >
                 完成管理
               </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredSites.map((site, index) => {
            const isSelected = selectedSiteIds.includes(site.id);
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                key={site.id}
                className={`group flex flex-col bg-[#1A1D27]/80 rounded-2xl p-5 border border-white/5 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 relative overflow-hidden backdrop-blur-sm ${isSelected ? 'ring-2 ring-inset ring-emerald-500 scale-[0.98]' : ''}`}
                onClick={() => {
                   if (selectedSiteIds.length > 0) {
                       toggleSiteSelection(site.id);
                   } else {
                       window.open(site.url, '_blank');
                   }
                }}
              >
                {/* Subtle gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/5 group-hover:opacity-100 opacity-0 transition-opacity duration-500" />
                
                {/* Selection Checkbox overlay */}
                <div className="absolute top-2 left-2 z-20">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSiteSelection(site.id);
                    }}
                    className={`p-1 rounded-full transition-all ${isSelected ? 'bg-emerald-500 text-white shadow-lg' : 'bg-black/30 text-white/70 hover:bg-black/50 opacity-0 group-hover:opacity-100'} backdrop-blur-md`}
                  >
                    {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Main Content Body */}
                <div className="flex items-start gap-4 z-10 pt-2 pointer-events-none">
                  <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white shadow-inner uppercase overflow-hidden ring-2 ring-[#11131C] bg-slate-800`}>
                    {renderIcon(site)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-semibold text-base truncate pr-6 group-hover:text-emerald-400 transition-colors">
                        {site.title}
                      </h3>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredSites.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">未找到相关网站</h3>
            <p className="text-slate-500">试着换一个搜索词吧</p>
          </div>
        )}
      </main>

      {/* Floating Action Bar for Batch Selection */}
      <AnimatePresence>
        {selectedSiteIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-[#212431]/95 backdrop-blur-xl border border-white/5 px-6 py-3 rounded-full shadow-2xl z-[100] text-white"
          >
            <span className="text-sm font-medium text-emerald-400">已选择 {selectedSiteIds.length} 项目</span>
            <div className="w-px h-6 bg-white/10"></div>
            <button onClick={() => setSelectedSiteIds([])} className="text-sm text-slate-300 hover:text-white transition-colors font-medium">取消</button>
            {selectedSiteIds.length === 1 && (
              <>
                <button 
                  onClick={handleOpenAccountsModal} 
                  className="flex items-center gap-2 text-sm bg-violet-500/10 text-violet-400 hover:bg-violet-500 hover:text-white px-4 py-2 rounded-full transition-all font-medium"
                >
                  <Key className="w-4 h-4" /> 账号管理
                </button>
                <button 
                  onClick={handleOpenEditModal} 
                  className="flex items-center gap-2 text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white px-4 py-2 rounded-full transition-all font-medium"
                >
                  <Edit2 className="w-4 h-4" /> 编辑
                </button>
              </>
            )}
            <button 
                onClick={() => setShowDeleteConfirm(true)} 
                className="flex items-center gap-2 text-sm bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-full transition-all font-medium"
            >
              <Trash2 className="w-4 h-4" /> 批量删除
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Website Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#090A0F]/80 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-[#1A1D27] border border-white/10 rounded-2xl shadow-2xl overflow-hidden m-4"
            >
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-200">{editingSiteId !== 0 ? '编辑常用网站' : '添加常用网站'}</h2>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                >
                   <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">网站名称</label>
                  <input 
                    type="text" 
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="例如：ChatGPT" 
                    className="w-full bg-[#11131C] border border-white/5 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder-slate-600" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">网址链接</label>
                  <input 
                    type="text" 
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://" 
                    className="w-full bg-[#11131C] border border-white/5 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder-slate-600 font-mono text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">所属分类</label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {categories.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => setModalCategory(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                          modalCategory === c.id 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-inner' 
                          : 'bg-[#11131C] text-slate-400 border-white/5 hover:border-white/20 hover:text-slate-300'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                    
                    {isAddingModalCategory ? (
                      <div className="flex items-center gap-1 bg-[#1A1D27] border border-dashed border-white/20 rounded-lg pl-2 pr-1 py-1">
                        <input
                          type="text"
                          autoFocus
                          placeholder="新分类..."
                          value={newModalCategoryName}
                          onChange={(e) => setNewModalCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                               e.preventDefault();
                               handleAddModalCategory();
                             }
                          }}
                          className="bg-transparent border-none outline-none text-sm text-slate-200 placeholder-slate-600 w-20"
                        />
                        <button onClick={handleAddModalCategory} className="w-5 h-5 rounded hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center transition-colors">
                          <CheckCircle2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => setIsAddingModalCategory(false)} className="w-5 h-5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsAddingModalCategory(true)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border border-dashed border-white/10 bg-[#11131C] text-slate-500 hover:border-white/30 hover:text-slate-300 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> 新分类
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">一句话描述 <span className="text-slate-600 font-normal">(选填)</span></label>
                  <input 
                    type="text" 
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="网站的主要功能介绍" 
                    className="w-full bg-[#11131C] border border-white/5 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder-slate-600" 
                  />
                </div>
              </div>
              
              <div className="px-6 py-5 bg-[#11131C]/60 border-t border-white/5 flex justify-end gap-3">
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
                >
                  取消
                </button>
                <button 
                  onClick={handleSaveSite} 
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-lg shadow-emerald-500/20 active:scale-95 text-sm font-medium"
                >
                  {editingSiteId !== 0 ? '确认修改' : '确认添加'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#090A0F]/80 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-[#1A1D27] border border-red-500/20 rounded-2xl shadow-2xl overflow-hidden m-4"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">确认删除？</h3>
                <p className="text-slate-400 text-sm mb-6">
                  您即将删除选中的 {selectedSiteIds.length} 个网站项目。此操作不可恢复，是否继续？
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)} 
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors font-medium text-sm"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => {
                        setShowDeleteConfirm(false);
                        handleBatchDeleteSites();
                    }} 
                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all active:scale-95 font-medium text-sm"
                  >
                    确认删除
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Accounts Management Modal */}
      <AnimatePresence>
        {showAccountsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#090A0F]/80 backdrop-blur-sm"
              onClick={() => setShowAccountsModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-[#1A1D27] border border-white/10 rounded-2xl shadow-2xl overflow-hidden m-4 flex flex-col"
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
            >
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1A1D27] flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-200">动态账号管理</h2>
                </div>
                <button 
                  onClick={() => setShowAccountsModal(false)} 
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                >
                   <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
                <div className="space-y-4">
                  {accountFields.map((field) => (
                    <div key={field.id} className="flex items-start gap-3 bg-[#11131C] p-3 rounded-xl border border-white/5">
                      <div className="flex-1 space-y-3">
                        <div>
                          <input
                            type="text"
                            value={field.keyName}
                            onChange={(e) => setAccountFields(accountFields.map(f => f.id === field.id ? { ...f, keyName: e.target.value } : f))}
                            placeholder="设定名称 (如: 账号, Token等)"
                            className="w-full bg-transparent border-b border-white/10 px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 transition-colors placeholder-slate-600"
                          />
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => setAccountFields(accountFields.map(f => f.id === field.id ? { ...f, value: e.target.value } : f))}
                            placeholder="填写内容"
                            className="w-full bg-black/20 border border-white/5 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-300 focus:outline-none focus:border-violet-500/50 transition-all font-mono"
                          />
                          <button 
                            onClick={() => handleCopyValue(field.value, field.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-violet-400 transition-colors"
                            title="复制内容"
                          >
                            {copiedId === field.id ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <button 
                        onClick={() => setAccountFields(accountFields.filter(f => f.id !== field.id))}
                        className="p-2 rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all mt-1"
                        title="删除该字段"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {accountFields.length === 0 && (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      暂无配置数据，请点击下方按钮添加。
                    </div>
                  )}

                  <button
                    onClick={() => setAccountFields([...accountFields, { id: Date.now().toString(), keyName: '', value: '' }])}
                    className="w-full py-3 rounded-xl border border-dashed border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5 text-slate-400 hover:text-violet-400 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" /> 添加新字段
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-5 bg-[#11131C]/60 border-t border-white/5 flex justify-end gap-3 flex-shrink-0">
                <button 
                  onClick={() => setShowAccountsModal(false)} 
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
                >
                  取消
                </button>
                <button 
                  onClick={handleSaveAccounts} 
                  className="px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white transition-all shadow-lg shadow-violet-500/20 active:scale-95 text-sm font-medium"
                >
                  确认保存
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
