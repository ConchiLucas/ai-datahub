import React, { useState, useEffect } from 'react';
import { Prompt, PromptCategory } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: Omit<Prompt, 'id' | 'createdAt'> | Prompt) => void;
  initialData?: Prompt | null;
  categories: string[];
}

export default function PromptModal({ isOpen, onClose, onSave, initialData, categories }: PromptModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PromptCategory>('Coding');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCategory(initialData.category);
      setContent(initialData.content);
    } else {
      setTitle('');
      setCategory('Coding');
      setContent('');
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    
    if (initialData) {
      onSave({ ...initialData, title, category, content });
    } else {
      onSave({ title, category, content });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0F111A]/90 border border-white/10 rounded-3xl p-8 shadow-2xl z-10 mx-4"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-fuchsia-500/20 text-fuchsia-400 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-pink-500">
              {initialData ? '编辑提示词' : '创建新提示词'}
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">标题名称</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如: Vue3 专家模式..."
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">业务分类</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      category === cat 
                        ? 'bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-400' 
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">提示词核心内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="在此输入您的魔法咒语..."
                className="w-full h-48 bg-black/40 border border-white/5 rounded-xl p-4 text-slate-300 outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-mono text-sm resize-none custom-scrollbar"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-slate-400 font-medium hover:bg-white/5 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim() || !content.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(217,70,239,0.3)]"
              >
                {initialData ? '保存修改' : '确认创建'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
