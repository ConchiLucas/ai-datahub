import React, { useState } from 'react';
import { Prompt } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, MessageSquareQuote } from 'lucide-react';

interface PromptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
}

export default function PromptDetailModal({ isOpen, onClose, prompt }: PromptDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !prompt) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Coding': return 'text-violet-400 bg-violet-400/10 border-violet-400/20';
      case 'Writing': return 'text-sky-400 bg-sky-400/10 border-sky-400/20';
      case 'System': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Analysis': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'Roleplay': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-auto">
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
          className="relative w-full max-w-4xl max-h-[85vh] bg-[#0F111A]/95 border border-white/10 rounded-3xl p-8 shadow-2xl z-10 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-6 mb-6 flex-shrink-0">
            <div className="flex flex-col gap-3">
              <span className={`self-start px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryColor(prompt.category)}`}>
                {prompt.category}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-100 flex items-center gap-3">
                <MessageSquareQuote className="w-8 h-8 text-fuchsia-500" />
                {prompt.title}
              </h2>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/40 border border-white/5 rounded-2xl p-6 relative group">
            <pre className="font-mono text-[15px] leading-relaxed text-slate-300 whitespace-pre-wrap break-words">
              {prompt.content}
            </pre>
          </div>

          {/* Footer Action */}
          <div className="mt-6 flex justify-end flex-shrink-0">
            <button
              onClick={handleCopy}
              className={`px-8 py-3 rounded-xl text-base font-medium transition-all flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95
                ${copied 
                  ? 'bg-emerald-500 text-emerald-50 hover:bg-emerald-400 shadow-emerald-500/20' 
                  : 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-fuchsia-500/20'}`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? '内容已复制 (Copied)' : '一键复制完整咒语'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
