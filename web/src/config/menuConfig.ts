import { FileText, Folder, Globe, KeyRound, Image as ImageIcon, Music, LayoutTemplate, Wallet, Sparkles, BookOpen, Terminal, Code2, Languages, Box, Command, FileEdit, Shapes, Type, AppWindow, Braces, Rocket, Component, BarChart3, Bug, ScrollText, ShieldCheck, Camera, GraduationCap, Wand2, AlertTriangle, Lightbulb, Network } from 'lucide-react';

// ─── Category Definitions ─────────────────
export type CategoryKey = 'content' | 'devtools' | 'project' | 'resources' | 'infohub' | 'learning';

export interface CategoryDef {
  key: CategoryKey;
  label: string;
  emoji: string;
  items: string[]; // ordered list of menu keys in this category
  gradient: string; // gradient for the category header
  textColor: string;
}

export const CATEGORIES: CategoryDef[] = [
  {
    key: 'content',
    label: '内容创作',
    emoji: '📝',
    items: ['note', 'drafts', 'markdowns', 'novels', 'product-ideas', 'prompts', 'ai-mistakes'],
    gradient: 'from-blue-500/80 to-indigo-500/80',
    textColor: 'text-blue-400',
  },
  {
    key: 'devtools',
    label: '开发工具',
    emoji: '🛠️',
    items: ['codes', 'scripts', 'commands', 'skills', 'docker', 'json', 'errors', 'guidelines'],
    gradient: 'from-amber-500/80 to-orange-500/80',
    textColor: 'text-amber-400',
  },
  {
    key: 'project',
    label: '项目运维',
    emoji: '🚀',
    items: ['progress', 'deploy', 'release', 'changelog', 'ports'],
    gradient: 'from-emerald-500/80 to-teal-500/80',
    textColor: 'text-emerald-400',
  },
  {
    key: 'resources',
    label: '资源管理',
    emoji: '📚',
    items: ['file', 'gallery', 'screenshots', 'materials', 'music', 'software'],
    gradient: 'from-pink-500/80 to-rose-500/80',
    textColor: 'text-pink-400',
  },
  {
    key: 'infohub',
    label: '信息中枢',
    emoji: '🌐',
    items: ['websites', 'accounts', 'paths', 'plans'],
    gradient: 'from-cyan-500/80 to-sky-500/80',
    textColor: 'text-cyan-400',
  },
  {
    key: 'learning',
    label: '学习成长',
    emoji: '📖',
    items: ['learning', 'english', 'billing'],
    gradient: 'from-violet-500/80 to-purple-500/80',
    textColor: 'text-violet-400',
  },
];

// Lookup map: menu key -> category key
export const MENU_CATEGORY_MAP: Record<string, CategoryKey> = {};
CATEGORIES.forEach(cat => cat.items.forEach(key => { MENU_CATEGORY_MAP[key] = cat.key; }));

// ─── Menu Item Config ─────────────────────
export const MENU_CONFIG: Record<string, {
  title: string;
  Icon: React.ElementType;
  colorTheme: {
    borderDark: string;
    borderLight: string;
    glow: string;
    glowHover: string;
    badge: string;
    textActive: string;
  };
}> = {
  note: { title: '笔记管理', Icon: FileText, colorTheme: { borderDark: 'hover:border-blue-500/50', borderLight: 'hover:border-blue-300', glow: 'bg-blue-500/10', glowHover: 'group-hover:bg-blue-500/20', badge: 'bg-blue-500/10 text-blue-500', textActive: 'group-hover:text-blue-500' } },
  file: { title: '文件管理', Icon: Folder, colorTheme: { borderDark: 'hover:border-purple-500/50', borderLight: 'hover:border-purple-300', glow: 'bg-purple-500/10', glowHover: 'group-hover:bg-purple-500/20', badge: 'bg-purple-500/10 text-purple-500', textActive: 'group-hover:text-purple-500' } },
  websites: { title: '网页管理', Icon: Globe, colorTheme: { borderDark: 'hover:border-emerald-500/50', borderLight: 'hover:border-emerald-300', glow: 'bg-emerald-500/10', glowHover: 'group-hover:bg-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-500', textActive: 'group-hover:text-emerald-500' } },
  accounts: { title: '账号管理', Icon: KeyRound, colorTheme: { borderDark: 'hover:border-orange-500/50', borderLight: 'hover:border-orange-300', glow: 'bg-orange-500/10', glowHover: 'group-hover:bg-orange-500/20', badge: 'bg-orange-500/10 text-orange-500', textActive: 'group-hover:text-orange-500' } },
  gallery: { title: '图库管理', Icon: ImageIcon, colorTheme: { borderDark: 'hover:border-pink-500/50', borderLight: 'hover:border-pink-300', glow: 'bg-pink-500/10', glowHover: 'group-hover:bg-pink-500/20', badge: 'bg-pink-500/10 text-pink-500', textActive: 'group-hover:text-pink-500' } },
  music: { title: '音乐管理', Icon: Music, colorTheme: { borderDark: 'hover:border-indigo-500/50', borderLight: 'hover:border-indigo-300', glow: 'bg-indigo-500/10', glowHover: 'group-hover:bg-indigo-500/20', badge: 'bg-indigo-500/10 text-indigo-500', textActive: 'group-hover:text-indigo-500' } },
  plans: { title: '计划管理', Icon: LayoutTemplate, colorTheme: { borderDark: 'hover:border-cyan-500/50', borderLight: 'hover:border-cyan-300', glow: 'bg-cyan-500/10', glowHover: 'group-hover:bg-cyan-500/20', badge: 'bg-cyan-500/10 text-cyan-500', textActive: 'group-hover:text-cyan-500' } },
  billing: { title: '记账管理', Icon: Wallet, colorTheme: { borderDark: 'hover:border-yellow-500/50', borderLight: 'hover:border-yellow-300', glow: 'bg-yellow-500/10', glowHover: 'group-hover:bg-yellow-500/20', badge: 'bg-yellow-500/10 text-yellow-500', textActive: 'group-hover:text-yellow-500' } },
  prompts: { title: '提示词管理', Icon: Sparkles, colorTheme: { borderDark: 'hover:border-fuchsia-500/50', borderLight: 'hover:border-fuchsia-300', glow: 'bg-fuchsia-500/10', glowHover: 'group-hover:bg-fuchsia-500/20', badge: 'bg-fuchsia-500/10 text-fuchsia-500', textActive: 'group-hover:text-fuchsia-500' } },
  novels: { title: '小说管理', Icon: BookOpen, colorTheme: { borderDark: 'hover:border-sky-500/50', borderLight: 'hover:border-sky-300', glow: 'bg-sky-500/10', glowHover: 'group-hover:bg-sky-500/20', badge: 'bg-sky-500/10 text-sky-500', textActive: 'group-hover:text-sky-500' } },
  scripts: { title: '脚本管理', Icon: Terminal, colorTheme: { borderDark: 'hover:border-teal-500/50', borderLight: 'hover:border-teal-300', glow: 'bg-teal-500/10', glowHover: 'group-hover:bg-teal-500/20', badge: 'bg-teal-500/10 text-teal-500', textActive: 'group-hover:text-teal-500' } },
  codes: { title: '代码管理', Icon: Code2, colorTheme: { borderDark: 'hover:border-violet-500/50', borderLight: 'hover:border-violet-300', glow: 'bg-violet-500/10', glowHover: 'group-hover:bg-violet-500/20', badge: 'bg-violet-500/10 text-violet-500', textActive: 'group-hover:text-violet-500' } },
  english: { title: '英语管理', Icon: Languages, colorTheme: { borderDark: 'hover:border-rose-500/50', borderLight: 'hover:border-rose-300', glow: 'bg-rose-500/10', glowHover: 'group-hover:bg-rose-500/20', badge: 'bg-rose-500/10 text-rose-500', textActive: 'group-hover:text-rose-500' } },
  docker: { title: 'Docker文件', Icon: Box, colorTheme: { borderDark: 'hover:border-blue-400/50', borderLight: 'hover:border-blue-400', glow: 'bg-blue-400/10', glowHover: 'group-hover:bg-blue-400/20', badge: 'bg-blue-400/10 text-blue-400', textActive: 'group-hover:text-blue-400' } },
  commands: { title: '常用命令', Icon: Command, colorTheme: { borderDark: 'hover:border-amber-500/50', borderLight: 'hover:border-amber-300', glow: 'bg-amber-500/10', glowHover: 'group-hover:bg-amber-500/20', badge: 'bg-amber-500/10 text-amber-500', textActive: 'group-hover:text-amber-500' } },
  drafts: { title: '草稿管理', Icon: FileEdit, colorTheme: { borderDark: 'hover:border-red-400/50', borderLight: 'hover:border-red-400', glow: 'bg-red-400/10', glowHover: 'group-hover:bg-red-400/20', badge: 'bg-red-400/10 text-red-400', textActive: 'group-hover:text-red-400' } },
  materials: { title: '素材管理', Icon: Shapes, colorTheme: { borderDark: 'hover:border-lime-500/50', borderLight: 'hover:border-lime-300', glow: 'bg-lime-500/10', glowHover: 'group-hover:bg-lime-500/20', badge: 'bg-lime-500/10 text-lime-500', textActive: 'group-hover:text-lime-500' } },
  markdowns: { title: 'Markdown', Icon: Type, colorTheme: { borderDark: 'hover:border-slate-400/50', borderLight: 'hover:border-slate-300', glow: 'bg-slate-500/10', glowHover: 'group-hover:bg-slate-400/20', badge: 'bg-slate-500/10 text-slate-400', textActive: 'group-hover:text-slate-300' } },
  software: { title: '软件管理', Icon: AppWindow, colorTheme: { borderDark: 'hover:border-green-500/50', borderLight: 'hover:border-green-300', glow: 'bg-green-500/10', glowHover: 'group-hover:bg-green-500/20', badge: 'bg-green-500/10 text-green-500', textActive: 'group-hover:text-green-500' } },
  json: { title: 'JSON 管理', Icon: Braces, colorTheme: { borderDark: 'hover:border-indigo-500/50', borderLight: 'hover:border-indigo-300', glow: 'bg-indigo-500/10', glowHover: 'group-hover:bg-indigo-500/20', badge: 'bg-indigo-500/10 text-indigo-500', textActive: 'group-hover:text-indigo-500' } },
  deploy: { title: '部署管理', Icon: Rocket, colorTheme: { borderDark: 'hover:border-teal-400/50', borderLight: 'hover:border-teal-400', glow: 'bg-teal-400/10', glowHover: 'group-hover:bg-teal-400/20', badge: 'bg-teal-400/10 text-teal-400', textActive: 'group-hover:text-teal-400' } },
  release: { title: '发布管理', Icon: Component, colorTheme: { borderDark: 'hover:border-orange-400/50', borderLight: 'hover:border-orange-400', glow: 'bg-orange-400/10', glowHover: 'group-hover:bg-orange-400/20', badge: 'bg-orange-400/10 text-orange-400', textActive: 'group-hover:text-orange-400' } },
  progress: { title: '进度管理', Icon: BarChart3, colorTheme: { borderDark: 'hover:border-blue-400/50', borderLight: 'hover:border-blue-400', glow: 'bg-blue-400/10', glowHover: 'group-hover:bg-blue-400/20', badge: 'bg-blue-400/10 text-blue-400', textActive: 'group-hover:text-blue-400' } },
  errors: { title: '报错管理', Icon: Bug, colorTheme: { borderDark: 'hover:border-red-400/50', borderLight: 'hover:border-red-400', glow: 'bg-red-400/10', glowHover: 'group-hover:bg-red-400/20', badge: 'bg-red-400/10 text-red-400', textActive: 'group-hover:text-red-400' } },
  changelog: { title: '日志管理', Icon: ScrollText, colorTheme: { borderDark: 'hover:border-violet-400/50', borderLight: 'hover:border-violet-400', glow: 'bg-violet-400/10', glowHover: 'group-hover:bg-violet-400/20', badge: 'bg-violet-400/10 text-violet-400', textActive: 'group-hover:text-violet-400' } },
  guidelines: { title: '规范管理', Icon: ShieldCheck, colorTheme: { borderDark: 'hover:border-amber-400/50', borderLight: 'hover:border-amber-400', glow: 'bg-amber-400/10', glowHover: 'group-hover:bg-amber-400/20', badge: 'bg-amber-400/10 text-amber-400', textActive: 'group-hover:text-amber-400' } },
  screenshots: { title: '截图管理', Icon: Camera, colorTheme: { borderDark: 'hover:border-sky-400/50', borderLight: 'hover:border-sky-400', glow: 'bg-sky-400/10', glowHover: 'group-hover:bg-sky-400/20', badge: 'bg-sky-400/10 text-sky-400', textActive: 'group-hover:text-sky-400' } },
  learning: { title: '学习管理', Icon: GraduationCap, colorTheme: { borderDark: 'hover:border-violet-400/50', borderLight: 'hover:border-violet-400', glow: 'bg-violet-400/10', glowHover: 'group-hover:bg-violet-400/20', badge: 'bg-violet-400/10 text-violet-400', textActive: 'group-hover:text-violet-400' } },
  skills: { title: '代码 Skill', Icon: Wand2, colorTheme: { borderDark: 'hover:border-cyan-400/50', borderLight: 'hover:border-cyan-400', glow: 'bg-cyan-400/10', glowHover: 'group-hover:bg-cyan-400/20', badge: 'bg-cyan-400/10 text-cyan-400', textActive: 'group-hover:text-cyan-400' } },
  'ai-mistakes': { title: 'AI 犯错', Icon: AlertTriangle, colorTheme: { borderDark: 'hover:border-red-400/50', borderLight: 'hover:border-red-400', glow: 'bg-red-400/10', glowHover: 'group-hover:bg-red-400/20', badge: 'bg-red-400/10 text-red-400', textActive: 'group-hover:text-red-400' } },
  'product-ideas': { title: '产品思路', Icon: Lightbulb, colorTheme: { borderDark: 'hover:border-violet-400/50', borderLight: 'hover:border-violet-400', glow: 'bg-violet-400/10', glowHover: 'group-hover:bg-violet-400/20', badge: 'bg-violet-400/10 text-violet-400', textActive: 'group-hover:text-violet-400' } },
  paths: { title: '路径管理', Icon: Folder, colorTheme: { borderDark: 'hover:border-teal-500/50', borderLight: 'hover:border-teal-300', glow: 'bg-teal-500/10', glowHover: 'group-hover:bg-teal-500/20', badge: 'bg-teal-500/10 text-teal-500', textActive: 'group-hover:text-teal-500' } },
  ports: { title: '端口管理', Icon: Network, colorTheme: { borderDark: 'hover:border-blue-500/50', borderLight: 'hover:border-blue-300', glow: 'bg-blue-500/10', glowHover: 'group-hover:bg-blue-500/20', badge: 'bg-blue-500/10 text-blue-500', textActive: 'group-hover:text-blue-500' } },
};
