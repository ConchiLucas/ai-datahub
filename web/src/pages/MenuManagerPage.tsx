import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Sun, Star } from 'lucide-react';
import { useAppStore, type AppState } from '@/stores/useAppStore';
import { useMenuStore, type MenuSetting } from '@/stores/useMenuStore';
import { MENU_CONFIG, CATEGORIES } from '@/config/menuConfig';

function SortableMenuItem({ 
  setting, 
  theme, 
  toggleFavorite,
  index,
  draggedIndex,
  dragOverIndex,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop
}: { 
  setting: MenuSetting, 
  theme: string, 
  toggleFavorite: (k: string) => void,
  index: number,
  draggedIndex: number | null,
  dragOverIndex: number | null,
  onDragStart: (e: React.DragEvent, index: number) => void,
  onDragEnter: (e: React.DragEvent, index: number) => void,
  onDragEnd: (e: React.DragEvent) => void,
  onDrop: (e: React.DragEvent, index: number) => void
}) {
  const config = MENU_CONFIG[setting.key];
  if (!config) return null;
  const { title, Icon, colorTheme } = config;

  const isDragging = draggedIndex === index;
  const isDragOver = dragOverIndex === index;

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnter={(e) => onDragEnter(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, index)}
      className={`group cursor-grab active:cursor-grabbing p-4 md:p-5 aspect-square flex flex-col items-center justify-center text-center rounded-2xl border transition-all duration-300 relative overflow-hidden select-none backdrop-blur-xl
        ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'}
        ${isDragOver && !isDragging
          ? (theme === 'dark' ? 'scale-105 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'scale-105 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] z-10')
          : 'hover:scale-105'}
        ${theme === 'dark'
          ? `bg-gradient-to-br from-[#1E2335]/80 to-[#151926]/80 ${colorTheme.borderDark}`
          : `bg-white ${colorTheme.borderLight}`}
      `}
    >
      {/* 收藏按钮 */}
      <div className="absolute top-2 right-2 z-20 pointer-events-none">
        <button 
          onClick={(e) => { e.stopPropagation(); toggleFavorite(setting.key); }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all cursor-pointer pointer-events-auto shadow-sm ${
            setting.isFavorite 
              ? 'border-amber-400 bg-amber-400/10 text-amber-500' 
              : (theme === 'dark' ? 'border-transparent text-slate-600 hover:text-slate-400 hover:bg-slate-800' : 'border-transparent text-slate-300 hover:text-slate-500 hover:bg-slate-100')
          }`}
          title="加入常用"
        >
          <Star size={14} strokeWidth={setting.isFavorite ? 3 : 2} fill={setting.isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className={`absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full ${colorTheme.glow} blur-2xl transition-all duration-500 pointer-events-none`} />
      
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-inner pointer-events-none ${colorTheme.badge}`}>
        <Icon className="w-5 h-5" />
      </div>
      
      <h3 className={`text-sm font-bold pointer-events-none ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
        {title}
      </h3>
    </div>
  );
}


export default function MenuManagerPage() {
  const navigate = useNavigate();
  const theme = useAppStore((state: AppState) => state.theme);
  const setTheme = useAppStore((state: AppState) => state.setTheme);
  
  const { menuSettings, updateSettings } = useMenuStore();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleToggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleFavorite = (key: string) => {
    const newSettings = menuSettings.map(item => 
      item.key === key ? { ...item, isFavorite: !item.isFavorite } : item
    );
    updateSettings(newSettings);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    
    const newSettings = [...menuSettings];
    const itemToMove = newSettings[draggedIndex];
    newSettings.splice(draggedIndex, 1);
    newSettings.splice(index, 0, itemToMove);
    
    updateSettings(newSettings);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 生成通用的渲染函数
  const renderSortableItem = (setting: MenuSetting, index: number, prefix: string) => (
    <SortableMenuItem 
      key={`${prefix}-${setting.key}`} 
      setting={setting} 
      theme={theme} 
      toggleFavorite={toggleFavorite}
      index={index}
      draggedIndex={draggedIndex}
      dragOverIndex={dragOverIndex}
      onDragStart={handleDragStart}
      onDragEnter={handleDragEnter}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
    />
  );

  return (
    <div className={`min-h-screen flex flex-col pt-24 pb-20 relative overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0F111A] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none mix-blend-screen" />
      
      {/* 操作栏 */}
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 p-2 px-4 rounded-xl transition-colors backdrop-blur-xl border shadow-lg ${theme === 'dark' ? 'bg-[#1E2335]/80 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
        >
          <ArrowLeft size={18} />
          <span className="font-medium">返回导航</span>
        </button>
      </div>
      
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={handleToggleTheme}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors border shadow-lg bg-white/50 dark:bg-white/5 backdrop-blur-xl"
        >
          {theme === 'light' ? (
            <Sun size={20} className="text-slate-600 dark:text-slate-400" />
          ) : (
            <Moon size={20} className="text-slate-600 dark:text-slate-400" />
          )}
        </button>
      </div>

      <div className="z-10 w-full max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            自定义导航菜单
          </h1>
          <p className={`text-base md:text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            点击星标将模块加入常用栏，并可拖拽进行随心排序
          </p>
        </motion.div>

        {/* 网格化布局区域 */}
        <div className="space-y-12">
          
          {/* 星标常用区 */}
          {(() => {
            const favoriteSettings = menuSettings.filter(s => s.isFavorite && MENU_CONFIG[s.key]);
            if (favoriteSettings.length === 0) return null;

            return (
              <div className={`p-6 rounded-3xl border backdrop-blur-xl shadow-xl transition-all ${theme === 'dark' ? 'bg-[#13151F]/80 border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">⭐</span>
                  <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-amber-400' : 'text-slate-700'}`}>
                    常用功能
                  </h2>
                  <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${theme === 'dark' ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
                    拖拽全区排序连动
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {menuSettings.map((setting, index) => {
                    if (setting.isFavorite && MENU_CONFIG[setting.key]) {
                      return renderSortableItem(setting, index, 'freq');
                    }
                    return null;
                  })}
                </div>
              </div>
            );
          })()}

          {/* 各细分品类区 */}
          {CATEGORIES.map((cat) => {
            // 获取该组涵盖的所有模块（无论是否可见、是否收藏都能在此配置）
            const catSettings = menuSettings.filter(s => cat.items.includes(s.key) && MENU_CONFIG[s.key]);
            if (catSettings.length === 0) return null;

            return (
              <div 
                key={cat.key}
                className={`p-6 rounded-3xl border backdrop-blur-xl transition-all ${theme === 'dark' ? 'bg-[#13151F]/40 border-white/5' : 'bg-white/60 border-slate-100'}`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">{cat.emoji}</span>
                  <h2 className={`text-xl font-bold ${theme === 'dark' ? cat.textColor : 'text-slate-700'}`}>
                    {cat.label}
                  </h2>
                  <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-200'}`} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {menuSettings.map((setting, index) => {
                    if (cat.items.includes(setting.key) && MENU_CONFIG[setting.key]) {
                      return renderSortableItem(setting, index, 'cat');
                    }
                    return null;
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
