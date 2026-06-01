// 用户类型
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isPremium: boolean;
}

// 笔记类型
export interface Note {
  id: string;
  title: string;
  content: string;
  searchContext?: string; // 搜索上下文
  notebookId?: string;
  notebookName?: string;  // 笔记本名称
  groupName?: string;     // 组名称
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  coverImage?: string;
  clientId?: string; // 客户端唯一标识，用于防止重复创建
}

// 笔记本类型
export interface Notebook {
  id: string;
  name: string;
  icon?: string;
  parentId?: string;
  noteCount: number;
  children?: Notebook[];
}

// 目录类型
export interface Directory {
  id: number;
  name: string;
  type: 'group' | 'note' | 'file';  // group=组，note=笔记本，file=文件夹
  parentId?: number | null;
  sortNum: number;
  createTime?: string;
  updateTime?: string;
  children?: Directory[];
  notebookId?: number;  // 创建组时绑定的笔记本 ID
  childrenCount?: number;  // 子目录/笔记数量
}

// 标签类型
export interface Tag {
  id: string;
  name: string;
  color: string;
  noteCount: number;
  userId?: string; // 标签所属用户ID，用于用户隔离
}

// 附件类型
export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'doc' | 'other';
  size: number;
  url: string;
  uploadedAt: string;
  noteId?: string;
}

// AI 消息类型
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isLoading?: boolean;
}

// 主题类型
export type Theme = 'light' | 'dark';

// 标签请求类型
export interface CreateTagRequest {
  name: string;
}

export interface UpdateTagRequest {
  name: string;
  color: string;
}

// API 响应类型
export interface TagListResponse {
  code: number;
  data: Tag[];
  message?: string;
}

export interface TagResponse {
  code: number;
  data?: Tag;
  message?: string;
}
