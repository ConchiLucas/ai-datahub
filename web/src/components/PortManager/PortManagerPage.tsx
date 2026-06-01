import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Search, Plus, Edit, Trash2, X, AlertCircle, 
  Server, Monitor, Globe2, Activity, HardDrive, CheckCircle2,
  Network
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { getPortList, createPort, updatePort, deletePort, getHostList, type PortItem, type HostItem } from '@/api/port';
import toast from 'react-hot-toast';

export default function PortManagerPage() {
  const navigate = useNavigate();
  const theme = useAppStore(state => state.theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [ports, setPorts] = useState<PortItem[]>([]);
  const [hosts, setHosts] = useState<HostItem[]>([]);
  const [selectedHostId, setSelectedHostId] = useState<string | number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [formData, setFormData] = useState<PortItem>({
    hostType: 'server',
    hostName: '',
    port: '',
    protocol: 'TCP',
    application: '',
    description: '',
    status: 'active'
  });

  const fetchData = async () => {
    try {
      const [portsRes, hostsRes] = await Promise.all([getPortList(), getHostList()]);
      if ((portsRes.code === 0 || portsRes.code === 200) && portsRes.data) {
        setPorts(portsRes.data);
      }
      if ((hostsRes.code === 0 || hostsRes.code === 200) && hostsRes.data) {
        setHosts(hostsRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPorts = ports.filter(p => {
    // 1. Filter by host if selected
    if (selectedHostId) {
      // Find the host name to match, because PortItem stores hostName directly currently
      // (If PortItem stored hostId, we'd compare id directly)
      const targetHost = hosts.find(h => (h.id || h.id) === selectedHostId);
      if (targetHost && p.hostName !== targetHost.name) {
        return false;
      }
    }
    
    // 2. Search query filter
    return (p.hostName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      String(p.port).includes(searchQuery) ||
      (p.application || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleDelete = async (id: number | string) => {
    try {
      if (confirm('确认删除此端口记录吗？')) {
        await deletePort({ id: id });
        toast.success('删除成功');
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error('删除失败');
    }
  };

  const openModal = (port?: PortItem) => {
    if (!port && !selectedHostId) {
      toast.error('请先在左侧选择所属主机，再新增端口记录');
      return;
    }

    const currentHost = hosts.find(h => (h.id || h.id) === selectedHostId);

    if (port) {
      setEditingId(port.id || port.id || null);
      setFormData({
        hostType: port.hostType,
        hostName: port.hostName,
        port: port.port,
        protocol: port.protocol,
        application: port.application,
        description: port.description,
        status: port.status
      });
    } else {
      setEditingId(null);
      setFormData({
        hostType: currentHost?.type || 'server',
        hostName: currentHost?.name || '',
        port: '',
        protocol: 'TCP',
        application: '',
        description: '',
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if(!formData.port || !formData.hostName) {
        toast.error('主机名和端口号不能为空');
        return;
      }

      if (editingId) {
        await updatePort({ ...formData, id: editingId });
        toast.success('更新成功');
      } else {
        await createPort(formData);
        toast.success('添加成功');
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('保存失败');
    }
  };

  const getHostIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server className="w-4 h-4" />;
      case 'pc': return <Monitor className="w-4 h-4" />;
      default: return <Globe2 className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 flex items-center gap-1.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>占用中</span>;
      case 'inactive':
        return <span className="px-2 py-1 flex items-center gap-1.5 text-xs font-medium rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>暂未使用</span>;
      case 'reserved':
        return <span className="px-2 py-1 flex items-center gap-1.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>保留端口</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 overflow-hidden ${theme === 'dark' ? 'bg-[#090A0F] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 顶部标题栏 */}
      <header className={`h-20 shrink-0 border-b flex items-center px-8 z-10 ${theme === 'dark' ? 'bg-[#11131C]/90 border-white/5 backdrop-blur-xl' : 'bg-white/90 border-slate-200 backdrop-blur-xl'} shadow-sm`}>
        <div className="flex items-center gap-6 flex-1 justify-start">
          <button 
            onClick={() => navigate('/')}
            className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Network className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
              端口管理
            </h1>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className={`relative flex items-center w-80 h-10 rounded-full overflow-hidden border transition-all ${theme === 'dark' ? 'bg-[#1A1D27] border-white/5 focus-within:border-blue-500/50' : 'bg-white border-slate-200 focus-within:border-blue-400'}`}>
            <Search className={`w-4 h-4 ml-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
            <input 
              type="text" 
              placeholder="搜索主机名、端口号或服务应用..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-full bg-transparent border-none outline-none px-3 text-sm ${theme === 'dark' ? 'placeholder-slate-500' : 'placeholder-slate-400'}`}
            />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-end">
          <button onClick={() => openModal()} className="flex items-center gap-2 h-10 px-5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95">
            <Plus className="w-4 h-4" /> 新增记录
          </button>
        </div>
      </header>

      {/* 主体内容区域包裹 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏：主机列表 */}
        <aside className={`w-64 shrink-0 flex flex-col border-r ${theme === 'dark' ? 'bg-[#0B0D14]/50 border-white/5' : 'bg-white/50 border-slate-200'} backdrop-blur-md z-10 block`}>
          <div className="p-5 overflow-y-auto flex-1 space-y-1">
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 px-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>所属主机</h3>
            
            <button
              onClick={() => setSelectedHostId(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                selectedHostId === null 
                  ? (theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                  : (theme === 'dark' ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
              }`}
            >
              <Globe2 className={`w-4 h-4 ${selectedHostId === null ? 'text-blue-500' : ''}`} />
              <span className="truncate">全部机房/主机</span>
            </button>

            {hosts.map((host, idx) => {
              const hostId = host.id || host.id || idx;
              return (
              <button
                key={hostId}
                onClick={() => setSelectedHostId(hostId)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium group ${
                  selectedHostId === hostId 
                    ? (theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                    : (theme === 'dark' ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                }`}
              >
                <div className={`${selectedHostId === hostId ? 'text-blue-500' : (theme === 'dark' ? 'text-slate-500 group-hover:text-slate-400' : 'text-slate-400 group-hover:text-slate-500')}`}>
                  {getHostIcon(host.type)}
                </div>
                <div className="flex flex-col items-start truncate">
                  <span className="truncate w-full text-left">{host.name}</span>
                </div>
              </button>
            )})}
          </div>
        </aside>

        {/* 右侧主表格 */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 relative">
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

        <div className="max-w-[1400px] mx-auto z-10 relative border-b border-t sm:border rounded-none sm:rounded-3xl shadow-xl overflow-x-auto sm:overflow-hidden backdrop-blur-md dark:border-white/5 dark:bg-[#151926]/80 bg-white/80 border-slate-200 min-w-[1000px]">
           {/* 表头 */}
          <div className={`grid grid-cols-12 gap-4 px-8 py-5 border-b text-sm font-semibold tracking-wider ${theme === 'dark' ? 'bg-white/[0.02] border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            <div className="col-span-3 flex items-center gap-2"><HardDrive className="w-4 h-4" /> 所属主机</div>
            <div className="col-span-2 flex items-center gap-2"><Network className="w-4 h-4" /> 端口与协议</div>
            <div className="col-span-2 flex items-center gap-2"><Activity className="w-4 h-4" /> 占用应用</div>
            <div className="col-span-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> 状态</div>
            <div className="col-span-2 flex items-center gap-2">描述备注</div>
            <div className="col-span-1 text-right">操作</div>
          </div>

          {/* 表格内容 */}
          <div className="divide-y divide-white/5 dark:divide-white/5 divide-slate-100">
            <AnimatePresence>
              {filteredPorts.length > 0 ? (
                filteredPorts.map((port, idx) => {
                  const idKey = port.id || port.id || idx;
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
                    {/* 主机信息 */}
                    <div className="col-span-3 pr-4 truncate flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                        {getHostIcon(port.hostType)}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className={`font-medium truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                          {port.hostName}
                        </span>
                        <span className="text-xs text-slate-500 mt-0.5">
                          {port.hostType === 'server' ? 'Server' : port.hostType === 'pc' ? 'Personal Computer' : 'Other Device'}
                        </span>
                      </div>
                    </div>

                    {/* 端口号和协议 */}
                    <div className="col-span-2 pr-4 flex items-center gap-2">
                       <div className={`font-mono px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border ${theme === 'dark' ? 'border-blue-500/20' : 'border-blue-200'}`}>
                         {port.port || '—'}
                       </div>
                       <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                         {port.protocol}
                       </span>
                    </div>

                    {/* 应用服务 */}
                    <div className="col-span-2 pr-4 truncate">
                      <span className={`font-medium ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        {port.application || '—'}
                      </span>
                    </div>

                    {/* 状态 */}
                    <div className="col-span-2 pr-4 flex items-center">
                      {getStatusBadge(port.status)}
                    </div>

                    {/* 描述 */}
                    <div className="col-span-2 pr-4 truncate text-sm text-slate-500">
                      {port.description || '—'}
                    </div>

                    {/* 操作 */}
                    <div className="col-span-1 flex items-center justify-end gap-2">
                      <button onClick={() => openModal(port)} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-slate-500 hover:text-blue-400 hover:bg-blue-500/10' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title="编辑">
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
                    <Network className="w-8 h-8 text-slate-500/50" />
                  </div>
                  <p className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>查无端口登记数据</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      </div>

      {/* 新增/编辑弹窗 */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className={`w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border ${theme === 'dark' ? 'bg-[#151926] border-white/10' : 'bg-white border-slate-200'}`}
            >
              <div className={`px-6 py-4 flex items-center justify-between border-b ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center gap-2">
                  <Network className="w-5 h-5 text-blue-500" />
                  {editingId ? '编辑端口记录' : '登记新端口'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                {/* 如果是被强制绑定的主机，不再让用户修改主机名字段 */}
                <div className={`p-4 rounded-xl flex items-center gap-4 border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                   <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                     {getHostIcon(formData.hostType)}
                   </div>
                   <div>
                     <p className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>所属主机 / 环境</p>
                     <p className={`font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{formData.hostName}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-1">
                    <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>端口号</label>
                    <input 
                      type="number" 
                      required 
                      placeholder="例: 8080"
                      value={formData.port} 
                      onChange={e => setFormData({...formData, port: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl font-mono border outline-none transition-all ${theme === 'dark' ? 'bg-black/20 border-white/10 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-900'}`}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>协议</label>
                    <select
                      value={formData.protocol}
                      onChange={e => setFormData({...formData, protocol: e.target.value})}
                      className={`w-full px-3 py-2.5 rounded-xl border outline-none transition-all ${theme === 'dark' ? 'bg-black/20 border-white/10 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-900'}`}
                    >
                      <option value="TCP">TCP</option>
                      <option value="UDP">UDP</option>
                      <option value="TCP/UDP">TCP / UDP</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-1">
                    <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>占用该端口的程序</label>
                    <input 
                      type="text" 
                      placeholder="例: Nginx"
                      value={formData.application} 
                      onChange={e => setFormData({...formData, application: e.target.value})}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${theme === 'dark' ? 'bg-black/20 border-white/10 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-900'}`}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>当前状态</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as any})}
                      className={`w-full px-3 py-2.5 rounded-xl border outline-none transition-all ${theme === 'dark' ? 'bg-black/20 border-white/10 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-900'}`}
                    >
                      <option value="active">占用中 (Active)</option>
                      <option value="inactive">暂未使用 (Inactive)</option>
                      <option value="reserved">保留端口 (Reserved)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>备注描述</label>
                  <textarea 
                    value={formData.description} 
                    rows={2}
                    placeholder="可选，添加额外的信息..."
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all resize-none ${theme === 'dark' ? 'bg-black/20 border-white/10 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-900'}`}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className={`px-5 py-2 rounded-xl transition-colors font-medium border ${theme === 'dark' ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                    取消
                  </button>
                  <button type="submit" className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 font-medium text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                    {editingId ? '保存修改' : '确认登记'}
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
