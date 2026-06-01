import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Search, FileText, Folder, ArrowRight, Loader2, Globe, Image as ImageIcon, Music, KeyRound, LayoutTemplate, Wallet, BookOpen, Terminal, Code2, Languages, Box, Command, FileEdit, Shapes, Type, AppWindow, Braces, Sun, Moon, LogOut, User, Lock, X, Eye, EyeOff, Settings } from 'lucide-react';
import { vectorSearchNotes, type VectorSearchResult } from '@/api/note';
import { changePassword, type ChangePasswordParams } from '@/api/auth';
import { useAppStore, type AppState } from '@/stores/useAppStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { MENU_CONFIG, CATEGORIES } from '@/config/menuConfig';

export default function NavigationPage() {
  const navigate = useNavigate();
  const theme = useAppStore((state: AppState) => state.theme);
  const setTheme = useAppStore((state: AppState) => state.setTheme);
  const logout = useAppStore((state: AppState) => state.logout);
  const user = useAppStore((state: AppState) => state.user);
  
  const menuSettings = useMenuStore(state => state.menuSettings);
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<VectorSearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showMoreCategories, setShowMoreCategories] = useState(false);

  // 初始化暗色模式
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // 处理输入
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performVectorSearch(value);
    }, 500);
  };

  const performVectorSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const response = await vectorSearchNotes(query, 5, 0.5, true);
      if (response.code === 200 && response.data?.results) {
        setSearchResults(response.data.results);
        setShowSearchDropdown(true);
      }
    } catch (error) {
      console.error('向量搜索失败:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultClick = (result: VectorSearchResult) => {
    setShowSearchDropdown(false);
    // 携带参数导航到主页
    // 这里使用 state.noteId 让 NotePage 判断跳转到特定笔记
    navigate('/notes', { state: { noteId: result.noteId, notebookId: result.notebookId } });
  };

  const handleNavClick = (path: 'note' | 'file' | 'websites' | 'accounts' | 'gallery' | 'music' | 'plans' | 'billing' | 'prompts' | 'novels' | 'scripts' | 'codes' | 'english' | 'docker' | 'commands' | 'drafts' | 'materials' | 'markdowns' | 'software' | 'json' | 'deploy' | 'release' | 'progress' | 'errors' | 'changelog' | 'guidelines' | 'screenshots' | 'learning' | 'skills' | 'ai-mistakes' | 'product-ideas' | 'paths' | 'ports') => {
    if (path === 'note') {
      navigate('/notes');
    } else if (path === 'file') {
      navigate('/files');
    } else if (path === 'websites') {
      navigate('/websites');
    } else if (path === 'accounts') {
      navigate('/accounts');
    } else if (path === 'gallery') {
      navigate('/gallery');
    } else if (path === 'music') {
      navigate('/music');
    } else if (path === 'plans') {
      navigate('/plans');
    } else if (path === 'billing') {
      navigate('/billing');
    } else if (path === 'prompts') {
      navigate('/prompts');
    } else if (path === 'novels') {
      navigate('/novels');
    } else if (path === 'scripts') {
      navigate('/scripts');
    } else if (path === 'codes') {
      navigate('/codes');
    } else if (path === 'english') {
      navigate('/english');
    } else if (path === 'docker') {
      navigate('/docker');
    } else if (path === 'commands') {
      navigate('/commands');
    } else if (path === 'drafts') {
      navigate('/drafts');
    } else if (path === 'materials') {
      navigate('/materials');
    } else if (path === 'markdowns') {
      navigate('/markdowns');
    } else if (path === 'software') {
      navigate('/software');
    } else if (path === 'json') {
      navigate('/json');
    } else if (path === 'deploy') {
      navigate('/deploy');
    } else if (path === 'release') {
      navigate('/release');
    } else if (path === 'progress') {
      navigate('/progress');
    } else if (path === 'errors') {
      navigate('/errors');
    } else if (path === 'changelog') {
      navigate('/changelog');
    } else if (path === 'guidelines') {
      navigate('/guidelines');
    } else if (path === 'screenshots') {
      navigate('/screenshots');
    } else if (path === 'learning') {
      navigate('/learning');
    } else if (path === 'skills') {
      navigate('/skills');
    } else if (path === 'ai-mistakes') {
      navigate('/ai-mistakes');
    } else if (path === 'product-ideas') {
      navigate('/product-ideas');
    } else if (path === 'paths') {
      navigate('/paths');
    } else if (path === 'ports') {
      navigate('/ports');
    }
  };

  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleToggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };


  return (
    <div className={`min-h-screen flex flex-col items-center pt-24 pb-12 relative overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0F111A] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 顶部导航栏 / 个人中心 */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <button
          onClick={handleToggleTheme}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          {theme === 'light' ? (
            <Sun size={20} className="text-slate-600 dark:text-slate-400" />
          ) : (
            <Moon size={20} className="text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {/* 用户头像下拉 */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base font-medium cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all shadow-lg"
          >
            {getUserInitial()}
          </button>

          {showUserMenu && (
            <>
              {/* 遮罩层 */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />

              {/* 下拉菜单 */}
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#13151F] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user?.name || '测试用户'}</p>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowChangePasswordModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors font-medium"
                  >
                    <Lock size={16} />
                    <span>修改密码</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/menu-manager');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors font-medium"
                  >
                    <Settings size={16} />
                    <span>菜单配置</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium"
                  >
                    <LogOut size={16} />
                    <span>退出登录</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 动态背景光晕特效 */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px] pointer-events-none mix-blend-screen" />

      <div className="z-10 w-full px-6 flex flex-col items-center">
        
        {/* Title area */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            AI数枢 DataHub
          </h1>
          <p className={`text-lg md:text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            AI 贯通您的私人垂类数据库
          </p>
        </motion.div>

        {/* AI search box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl relative mb-20 z-50"
        >
          <div className={`relative flex items-center w-full h-16 rounded-3xl overflow-hidden shadow-2xl border backdrop-blur-md transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/50 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200'}`}>
            <div className="pl-6 flex-shrink-0">
              {isSearching ? (
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              ) : (
                <Sparkles className="w-6 h-6 text-purple-500" />
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => searchQuery.trim() && searchResults.length > 0 && setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              placeholder="AI 全局搜索..."
              className="w-full h-full bg-transparent border-none outline-none px-4 text-lg placeholder-slate-400"
            />
            <div className={`pr-6 flex-shrink-0 flex items-center justify-center gap-3 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              <div className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <Search className="w-5 h-5 hover:text-blue-500 transition-colors" />
              </div>
            </div>
          </div>

          {/* AI 搜索下拉结果 */}
          <AnimatePresence>
            {showSearchDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`absolute top-20 left-0 right-0 rounded-2xl shadow-2xl border backdrop-blur-xl overflow-hidden ${theme === 'dark' ? 'bg-[#1A1D27]/95 border-white/10' : 'bg-white/95 border-slate-200'}`}
              >
                {searchResults.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto py-2">
                    {searchResults.map((result, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSearchResultClick(result)}
                        className={`px-6 py-4 cursor-pointer transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'} border-b last:border-0 ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className={`font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            {result.noteTitle || '无标题笔记'}
                          </h3>
                          <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-500 font-medium">
                            匹配度 {Math.round(result.similarity * 100)}%
                          </span>
                        </div>
                        <p className={`text-sm line-clamp-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {result.matchedChunk}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <p>并未找到相关笔记内容</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Feature Cards Layout */}
        <div className="w-full max-w-7xl 2xl:max-w-[100rem] z-10 space-y-10 pb-8">
          
          {/* 常用模块 (第一栏) */}
          {(() => {
            const frequentItems = menuSettings.filter(s => s.isVisible && s.isFavorite).map(s => s.key).filter(k => MENU_CONFIG[k]);
            
            if (frequentItems.length === 0) return null;
            
            return (
              <div>
                <div className="flex items-center gap-3 mb-4 px-1">
                  <span className="text-xl">⭐</span>
                  <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-amber-400' : 'text-slate-700'}`}>
                    常用功能
                  </h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${theme === 'dark' ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
                    {frequentItems.length}
                  </span>
                  <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-200'}`} />
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                  <AnimatePresence>
                    {frequentItems.map((key) => {
                      const config = MENU_CONFIG[key];
                      if (!config) return null;
                      const { title, Icon, colorTheme } = config;

                      return (
                        <motion.div 
                          key={`frequent-${key}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3 }}
                          onClick={() => handleNavClick(key as any)}
                          className={`group cursor-pointer p-4 md:p-5 aspect-square flex flex-col items-center justify-center text-center rounded-2xl border transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-md relative overflow-hidden backdrop-blur-xl ${theme === 'dark' ? `bg-gradient-to-br from-[#1E2335]/80 to-[#151926]/80 border-white/5 ${colorTheme.borderDark}` : `bg-white border-slate-200 ${colorTheme.borderLight}`}`}
                        >
                          <div className={`absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full ${colorTheme.glow} blur-2xl ${colorTheme.glowHover} transition-all duration-500`} />
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-inner ${colorTheme.badge}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <h3 className={`text-sm font-bold ${colorTheme.textActive} transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            {title}
                          </h3>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })()}

          {/* 剩余分类 (折叠/展开) */}
          {showMoreCategories ? (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-10"
            >
              {CATEGORIES.map((cat) => {
                const visibleKeys = new Set(menuSettings.filter(s => s.isVisible).map(s => s.key));
                const catItems = cat.items.filter(key => visibleKeys.has(key) && MENU_CONFIG[key]);
                if (catItems.length === 0) return null;

                return (
                  <div key={cat.key}>
                    <div className="flex items-center gap-3 mb-4 px-1">
                      <span className="text-xl">{cat.emoji}</span>
                      <h2 className={`text-lg font-bold ${theme === 'dark' ? cat.textColor : 'text-slate-700'}`}>
                        {cat.label}
                      </h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${theme === 'dark' ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
                        {catItems.length}
                      </span>
                      <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-200'}`} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                      <AnimatePresence>
                        {catItems.map((key) => {
                          const config = MENU_CONFIG[key];
                          if (!config) return null;
                          const { title, Icon, colorTheme } = config;

                          return (
                            <motion.div 
                              key={key}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.3 }}
                              onClick={() => handleNavClick(key as any)}
                              className={`group cursor-pointer p-4 md:p-5 aspect-square flex flex-col items-center justify-center text-center rounded-2xl border transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-md relative overflow-hidden backdrop-blur-xl ${theme === 'dark' ? `bg-gradient-to-br from-[#1E2335]/80 to-[#151926]/80 border-white/5 ${colorTheme.borderDark}` : `bg-white border-slate-200 ${colorTheme.borderLight}`}`}
                            >
                              <div className={`absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full ${colorTheme.glow} blur-2xl ${colorTheme.glowHover} transition-all duration-500`} />
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-inner ${colorTheme.badge}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <h3 className={`text-sm font-bold ${colorTheme.textActive} transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                {title}
                              </h3>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
              
              <div className="flex justify-center pt-6 pb-12">
                <button
                  onClick={() => setShowMoreCategories(false)}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    theme === 'dark' 
                      ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                  }`}
                >
                  <ArrowRight className="w-4 h-4 -rotate-90 transition-transform" />
                  收起分类
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex justify-center pt-8 pb-12">
              <button
                onClick={() => setShowMoreCategories(true)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 hover:-translate-y-1 ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-blue-300 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                    : 'bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 shadow-md'
                }`}
              >
                探索更多专属模块
                <ArrowRight className="w-4 h-4 rotate-90 transition-transform group-hover:translate-y-1" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 修改密码弹窗 */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}
    </div>
  );
}

// 修改密码弹窗组件
interface ChangePasswordModalProps {
  onClose: () => void;
}

function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const theme = useAppStore((state: any) => state.theme);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('新密码和确认密码不一致');
      return;
    }
    if (newPassword.length < 6) {
      setError('新密码长度至少为6位');
      return;
    }
    if (newPassword === oldPassword) {
      setError('新密码不能与原密码相同');
      return;
    }

    setIsLoading(true);
    try {
      const params: ChangePasswordParams = {
        password: oldPassword,
        newPassword: newPassword,
      };
      await changePassword(params);
      // 请求拦截器已处理错误码，能到这里说明成功
      setSuccess('密码修改成功！');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || '密码修改失败，请检查原密码是否正确');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl border overflow-hidden ${theme === 'dark' ? 'bg-[#13151F] border-white/10' : 'bg-white border-slate-200'}`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <Lock size={20} className="text-white" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>修改密码</h3>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>请验证原密码后设置新密码</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>原密码</label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入原密码"
                className={`w-full h-11 pl-4 pr-12 rounded-xl border text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all
                  ${theme === 'dark' ? 'bg-[#0B0D14] border-white/10 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}
              >
                {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>新密码</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
                className={`w-full h-11 pl-4 pr-12 rounded-xl border text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all
                  ${theme === 'dark' ? 'bg-[#0B0D14] border-white/10 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>确认新密码</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                className={`w-full h-11 pl-4 pr-12 rounded-xl border text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all
                  ${theme === 'dark' ? 'bg-[#0B0D14] border-white/10 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className={`p-3 rounded-lg border text-sm ${theme === 'dark' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
              {error}
            </div>
          )}

          {success && (
            <div className={`p-3 rounded-lg border text-sm ${theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-green-50 border-green-200 text-green-600'}`}>
              {success}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 h-11 px-4 rounded-xl border text-sm font-medium transition-colors
                ${theme === 'dark' ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-11 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600
                   text-white text-sm font-medium
                   hover:from-violet-600 hover:to-purple-700
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  保存中...
                </>
              ) : (
                '确认修改'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
