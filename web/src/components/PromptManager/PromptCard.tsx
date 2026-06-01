import React, { useState } from 'react';
import { Prompt } from './types';
import { Copy, Check, Trash2, Edit3, MessageSquareQuote } from 'lucide-react';
import { motion } from 'framer-motion';

interface PromptCardProps {
  prompt: Prompt;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: number) => void;
  onView: (prompt: Prompt) => void;
}

export default function PromptCard({ prompt, onEdit, onDelete, onView }: PromptCardProps) {
  const [copied, setCopied] = useState(false);

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col p-6 rounded-3xl bg-[#151926]/60 border border-white/5 hover:border-fuchsia-500/30 hover:bg-[#1E2335]/80 transition-all shadow-xl backdrop-blur-xl h-[280px]"
    >
      <div className="flex justify-between items-start mb-4 gap-4">
        <h3 className="text-xl font-bold text-slate-200 line-clamp-1 group-hover:text-fuchsia-400 transition-colors">
          {prompt.title}
        </h3>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border flex-shrink-0 ${getCategoryColor(prompt.category)}`}>
          {prompt.category}
        </span>
      </div>

      <div 
        onClick={() => onView(prompt)}
        className="flex-1 relative overflow-hidden rounded-xl bg-black/20 border border-black/30 p-4 font-mono text-sm leading-relaxed text-slate-400 mb-4 cursor-pointer hover:bg-black/40 hover:border-fuchsia-500/20 hover:text-slate-300 transition-all group/content"
      >
        <MessageSquareQuote className="absolute right-3 top-3 w-16 h-16 opacity-[0.03] text-fuchsia-500 pointer-events-none transition-opacity group-hover/content:opacity-10" />
        <div className="line-clamp-5 whitespace-pre-wrap relative z-10">
          {prompt.content}
        </div>
        {/* Soft bottom fade to indicate more text */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0e111a] via-[#0e111a]/80 to-transparent pointer-events-none z-10 rounded-b-xl" />
      </div>

      <div className="flex justify-between items-center mt-auto">
        <button
          onClick={handleCopy}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 
            ${copied 
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
              : 'bg-fuchsia-500/10 text-fuchsia-400 hover:bg-fuchsia-500/20'}`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? '已复制 (Copied)' : '一键复制'}
        </button>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(prompt)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(prompt.id)}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
