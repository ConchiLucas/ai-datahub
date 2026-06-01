import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, KeyRound, Plus, Search, Copy, Eye, EyeOff, 
  Trash2, Edit, CheckCircle2, Globe, FileText, User, Lock, X
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { getAccountList, createAccount, updateAccount, deleteAccount, type AccountItem } from '@/api/account';

export default function AccountManagerPage() {
  const navigate = useNavigate();
  const theme = useAppStore(state => state.theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AccountItem>({
    account: '', password: '', website: '', description: ''
  });

  const fetchAccounts = async () => {
    try {
      const res = await getAccountList();
      if((res.code === 0 || res.code === 200) && res.data) {
        setAccounts(res.data);
      }
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = accounts.filter(acc => 
    (acc.account || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (acc.website || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (acc.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePasswordVisibility = (id: string | number) => {
    const strId = String(id);
    const newSet = new Set(visiblePasswords);
    if (newSet.has(strId)) newSet.delete(strId);
    else newSet.add(strId);
    setVisiblePasswords(newSet);
  };

  const handleCopy = (text: string, id: string) => {
    if(!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string | number) => {
    try {
      if(confirm('确认删除此账号吗？该操作不可逆转！')) {
        await deleteAccount(id);
        await fetchAccounts();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const openModal = (acc?: any) => {
    if (acc) {
      setEditingId(acc.id || acc.id);
      setFormData({
        account: acc.account || '',
        password: acc.password || '',
        website: acc.website || '',
        description: acc.description || ''
      });
    } else {
      setEditingId(null);
      setFormData({ account: '', password: '', website: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAccount({ ...formData, id: editingId });
      } else {
        await createAccount(formData);
      }
      setIsModalOpen(false);
      await fetchAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 overflow-hidden ${theme === 'dark' ? 'bg-[#090A0F] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 顶部标题栏 */}
      <header className={`h-20 shrink-0 border-b flex items-center justify-between px-8 z-10 ${theme === 'dark' ? 'bg-[#11131C]/90 border-white/5 backdrop-blur-xl' : 'bg-white/90 border-slate-200 backdrop-blur-xl'} shadow-sm`}>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/')}
            className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
              账号管理
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={`relative flex items-center w-72 h-10 rounded-full overflow-hidden border transition-all ${theme === 'dark' ? 'bg-[#1A1D27] border-white/5 focus-within:border-orange-500/50' : 'bg-white border-slate-200 focus-within:border-orange-400'}`}>
            <Search className={`w-4 h-4 ml-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
            <input 
              type="text" 
              placeholder="搜索账号、网页或描述..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-full bg-transparent border-none outline-none px-3 text-sm ${theme === 'dark' ? 'placeholder-slate-500' : 'placeholder-slate-400'}`}
            />
          </div>

          <button onClick={() => openModal()} className="flex items-center gap-2 h-10 px-5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95">
            <Plus className="w-4 h-4" /> 新建账号
          </button>
        </div>
      </header>

      {/* 主体表格区域 */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 relative">
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto z-10 relative border-b border-t sm:border rounded-none sm:rounded-3xl shadow-xl overflow-x-auto sm:overflow-hidden backdrop-blur-md dark:border-white/5 dark:bg-[#151926]/80 bg-white/80 border-slate-200">
          <div className="min-w-[800px]">
             {/* 表头 */}
            <div className={`grid grid-cols-12 gap-4 px-8 py-5 border-b text-sm font-semibold tracking-wider ${theme === 'dark' ? 'bg-white/[0.02] border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <div className="col-span-3 flex items-center gap-2"><Globe className="w-4 h-4" /> 网页地址</div>
              <div className="col-span-3 flex items-center gap-2"><User className="w-4 h-4" /> 账号</div>
              <div className="col-span-3 flex items-center gap-2"><Lock className="w-4 h-4" /> 密码</div>
              <div className="col-span-2 flex items-center gap-2"><FileText className="w-4 h-4" /> 描述</div>
              <div className="col-span-1 text-right">操作</div>
            </div>

            {/* 表格内容 */}
            <div className="divide-y divide-white/5 dark:divide-white/5 divide-slate-100">
              <AnimatePresence>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((acc, idx) => {
                    const idKey = acc.id || acc.id;
                    return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      key={idKey}
                      className={`grid grid-cols-12 gap-4 px-8 py-5 items-center transition-colors ${theme === 'dark' ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}`}
                    >
                      {/* 网页列 */}
                      <div className="col-span-3 pr-4 truncate">
                        <a href={acc.website?.startsWith('http') ? acc.website : `https://${acc.website}`} target="_blank" rel="noopener noreferrer" className={`hover:underline flex items-center gap-2 ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}>
                          <img src={`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${acc.website}&size=32`} className="w-5 h-5 rounded bg-white/10" alt="" onError={(e) => e.currentTarget.style.display='none'} />
                          <span className="truncate">{acc.website}</span>
                        </a>
                      </div>

                      {/* 账号列 */}
                      <div className="col-span-3 pr-4 truncate flex items-center gap-3 group">
                        <span className={`font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'} truncate`}>{acc.account}</span>
                        <button 
                          onClick={() => handleCopy(acc.account, `acc_${idKey}`)}
                          className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-md transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
                          title="复制账号"
                        >
                          {copiedId === `acc_${idKey}` ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* 密码列 */}
                      <div className="col-span-3 pr-4 flex items-center gap-3 group">
                        <div className={`font-mono text-sm px-3 py-1.5 rounded-lg flex-1 truncate select-none ${theme === 'dark' ? 'bg-black/30 text-emerald-400' : 'bg-slate-100 text-emerald-600'}`}>
                          {visiblePasswords.has(String(idKey)) ? (acc.password || '') : '••••••••••••••••'}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => togglePasswordVisibility(idKey)}
                            className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
                          >
                            {visiblePasswords.has(String(idKey)) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleCopy(acc.password, `pass_${idKey}`)}
                            className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
                            title="复制密码"
                          >
                            {copiedId === `pass_${idKey}` ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* 描述列 */}
                      <div className="col-span-2 pr-4 truncate">
                        <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} truncate block`} title={acc.description}>
                          {acc.description}
                        </span>
                      </div>

                      {/* 操作列 */}
                      <div className="col-span-1 flex items-center justify-end gap-2">
                        <button onClick={() => openModal(acc)} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-slate-500 hover:text-blue-400 hover:bg-blue-500/10' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title="编辑">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(idKey)} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`} title="删除">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )})
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center col-span-12">
                    <div className="w-16 h-16 rounded-full bg-slate-500/10 flex items-center justify-center mb-4">
                      <KeyRound className="w-8 h-8 text-slate-500/50" />
                    </div>
                    <p className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>查无相关账号数据</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border ${theme === 'dark' ? 'bg-[#151926] border-white/10' : 'bg-white border-slate-200'}`}
            >
              <div className={`px-6 py-4 flex items-center justify-between border-b ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                  {editingId ? '编辑账号' : '添加账号'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>账号名</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.account} 
                    onChange={e => setFormData({...formData, account: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${theme === 'dark' ? 'bg-black/20 border-white/10 focus:border-orange-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-orange-500 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>密码</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${theme === 'dark' ? 'bg-black/20 border-white/10 focus:border-orange-500 text-white font-mono' : 'bg-slate-50 border-slate-200 focus:border-orange-500 text-slate-900 font-mono'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>网站链接</label>
                  <input 
                    type="url" 
                    placeholder="https://"
                    value={formData.website} 
                    onChange={e => setFormData({...formData, website: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${theme === 'dark' ? 'bg-black/20 border-white/10 focus:border-orange-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-orange-500 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>备注描述</label>
                  <textarea 
                    value={formData.description} 
                    rows={2}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all resize-none ${theme === 'dark' ? 'bg-black/20 border-white/10 focus:border-orange-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-orange-500 text-slate-900'}`}
                  />
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 font-medium text-white shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                    {editingId ? '保存修改' : '确认添加'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
