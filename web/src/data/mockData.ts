import type { Note, Notebook, Tag, Attachment, User } from '../types';

// Mock 用户
export const mockUser: User = {
  id: '1',
  email: 'test@zhiji.com',
  name: '测试用户',
  avatar: undefined,
  isPremium: true,
};

// Mock 笔记本 - 支持树形结构，用户可以自定义添加子目录
export const mockNotebooks: Notebook[] = [
  {
    id: '1',
    name: '基础知识',
    icon: 'folder',
    noteCount: 5,
    children: [
      { id: '1-1', name: '入门教程', noteCount: 2, parentId: '1' },
      { id: '1-2', name: '进阶技巧', noteCount: 3, parentId: '1' },
    ],
  },
  {
    id: '2',
    name: '项目文档',
    icon: 'folder',
    noteCount: 8,
    children: [
      { id: '2-1', name: '需求文档', noteCount: 3, parentId: '2' },
      { id: '2-2', name: '技术方案', noteCount: 2, parentId: '2' },
      { id: '2-3', name: '会议记录', noteCount: 3, parentId: '2' },
    ],
  },
  {
    id: '3',
    name: '学习笔记',
    icon: 'folder',
    noteCount: 10,
    children: [
      { id: '3-1', name: '技术文章', noteCount: 4, parentId: '3' },
      { id: '3-2', name: '读书笔记', noteCount: 6, parentId: '3' },
    ],
  },
  {
    id: '4',
    name: '日常记录',
    icon: 'folder',
    noteCount: 6,
  },
];

// Mock 标签
export const mockTags: Tag[] = [
  { id: '1', name: '重要', color: '#EF4444', noteCount: 5 },
  { id: '2', name: '工作', color: '#6366F1', noteCount: 8 },
  { id: '3', name: '学习', color: '#10B981', noteCount: 12 },
  { id: '4', name: '灵感', color: '#F59E0B', noteCount: 3 },
  { id: '5', name: '待办', color: '#8B5CF6', noteCount: 6 },
];

// Mock 笔记
export const mockNotes: Note[] = [
  {
    id: '1',
    title: '欢迎使用智记 AI 笔记',
    content: `# 欢迎使用智记 AI 笔记 🎉

## 开始你的智能创作之旅

智记是一款融合 AI 能力的智能笔记应用，帮助你更高效地记录、整理和创作知识。

## 主要功能

- 📝 **富文本编辑** - 支持 Markdown 语法，代码高亮
- 🤖 **AI 助手** - 智能续写、翻译、总结、解答
- 📁 **文件管理** - 支持图片、PDF、Word 等多种格式
- 🏷️ **标签系统** - 灵活组织你的知识
- 🌓 **深色模式** - 护眼舒适，昼夜皆宜

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Cmd+N | 新建笔记 |
| Cmd+S | 保存笔记 |
| Cmd+K | 全局搜索 |
| Cmd+J | 唤起 AI |

---

开始你的第一篇笔记吧！`,
    notebookId: '1-1',
    tags: ['重要'],
    isFavorite: true,
    isArchived: false,
    createdAt: '2026-02-28T10:00:00Z',
    updatedAt: '2026-03-01T09:00:00Z',
    wordCount: 156,
  },
  {
    id: '2',
    title: 'AI 使用指南',
    content: `# AI 助手使用指南

## 如何与 AI 协作

### 1. 基础对话
在右侧 AI 面板中输入你的问题，AI 会即时回复。

### 2. 快捷指令
- **总结要点** - 快速提炼长文核心
- **翻译** - 支持多语言互译
- **续写** - 根据上下文智能创作
- **解释概念** - 深入讲解专业术语

### 3. 上下文关联
勾选「读取当前笔记」让 AI 理解你的内容

### 4. 结果应用
- 点击「插入」将 AI 回复添加到笔记
- 点击「替换」用 AI 回复替换选中内容
- 点击「复制」快速复制内容`,
    notebookId: '1-2',
    tags: ['学习', '重要'],
    isFavorite: false,
    isArchived: false,
    createdAt: '2026-02-28T11:00:00Z',
    updatedAt: '2026-02-28T14:30:00Z',
    wordCount: 189,
  },
  {
    id: '3',
    title: 'React Hooks 最佳实践',
    content: `# React Hooks 最佳实践

## useState

\`\`\`tsx
const [count, setCount] = useState(0);

// 使用函数式更新
setCount(prev => prev + 1);
\`\`\`

## useEffect

\`\`\`tsx
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);
\`\`\`

## useMemo & useCallback

\`\`\`tsx
const memoizedValue = useMemo(() => compute(a, b), [a, b]);
const memoizedFn = useCallback(() => doSomething(a), [a]);
\`\`\`

## 自定义 Hook

\`\`\`tsx
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  const setValue = (value) => {
    setStoredValue(value);
    localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue];
}
\`\`\``,
    notebookId: '3-1',
    tags: ['学习', '工作'],
    isFavorite: true,
    isArchived: false,
    createdAt: '2026-02-27T09:00:00Z',
    updatedAt: '2026-02-27T16:00:00Z',
    wordCount: 245,
  },
  {
    id: '4',
    title: '2026 年目标规划',
    content: `# 2026 年目标规划

## 职业发展
- [ ] 晋升高级工程师
- [ ] 主导一个核心项目
- [ ] 发表 3 篇技术博客

## 技能提升
- [ ] 深入学习 Rust
- [ ] 掌握 AI/ML 基础
- [ ] 提升系统设计能力

## 健康生活
- [ ] 每周运动 3 次
- [ ] 每天阅读 30 分钟
- [ ] 规律作息

## 个人项目
- [ ] 完成开源项目 v2.0
- [ ] 技术分享 5 次`,
    notebookId: '4',
    tags: ['待办', '重要'],
    isFavorite: false,
    isArchived: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-15T10:00:00Z',
    wordCount: 98,
  },
  {
    id: '5',
    title: '项目会议记录 - 2026/02/25',
    content: `# 项目周会记录

**时间**: 2026/02/25 14:00-15:00
**参与人**: 张三、李四、王五、赵六

## 上周进展

### 张三
- 完成用户模块开发
- 修复 3 个 P1 bug

### 李四
- API 性能优化，QPS 提升 50%
- 编写技术文档

### 王五
- UI 改版设计完成
- 设计系统组件库

## 本周计划

1. 开始支付模块开发
2. 代码 Review
3. 准备下周演示

## 待决议项

- 技术栈升级时间
- 新成员分工`,
    notebookId: '2-3',
    tags: ['工作'],
    isFavorite: false,
    isArchived: false,
    createdAt: '2026-02-25T15:00:00Z',
    updatedAt: '2026-02-25T15:30:00Z',
    wordCount: 167,
  },
];

// Mock 附件
export const mockAttachments: Attachment[] = [
  {
    id: '1',
    name: '产品原型图.png',
    type: 'image',
    size: 2048576,
    url: '/placeholder.png',
    uploadedAt: '2026-02-28T10:00:00Z',
    noteId: '1',
  },
  {
    id: '2',
    name: '需求文档.pdf',
    type: 'pdf',
    size: 1024000,
    url: '/placeholder.pdf',
    uploadedAt: '2026-02-27T14:00:00Z',
    noteId: '5',
  },
];

// Mock AI 初始消息
export const mockAIMessages = [
  {
    id: 'welcome',
    role: 'assistant' as const,
    content: '你好！我是你的 AI 助手，我可以帮你：\n\n- 📝 总结笔记要点\n- 🌐 翻译内容\n- ✍️ 续写文章\n- 💡 解答问题\n\n有什么我可以帮助你的吗？',
    timestamp: new Date().toISOString(),
  },
];
