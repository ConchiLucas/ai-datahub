import request, { get, post, del } from '@/utils/request';

// 笔记数据模型
export interface Note {
  id: number;
  title: string;
  content: string;
  userId?: number;
  notebook_id?: number;
  notebookName?: string;  // 笔记本名称
  groupName?: string;    // 组名称
  tags?: string;
  createTime?: string;
  updateTime?: string;
}

// 笔记查询参数
export interface NoteQueryParams {
  titleKeyword?: string;
  tagsFilter?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  pageNum?: number;
  pageSize?: number;
}

// 分页响应
export interface PageResponse<T> {
  data: T[];
  pageNum: number;
  pageSize: number;
  total: number;
  pages: number;
}

// 通用响应类型
export interface NoteListResponse {
  code: number;
  msg: string;
  data: Note[];
}

export interface NoteResponse {
  code: number;
  msg: string;
  data: Note;
}

export interface CrudResponse {
  code: number;
  msg: string;
  data?: any;
}

/**
 * 获取笔记列表
 * @param notebookIds 笔记本 ID 数组（可选）
 * @param tagName 标签名称（可选）
 * @param noteId 笔记 ID 过滤（可选）
 * @returns 笔记列表数据
 */
export const getNoteList = (notebookIds?: number[] | null, tagName?: string | null, noteId?: string | null): Promise<NoteListResponse> => {
  const params: Record<string, string> = {};

  if (notebookIds && notebookIds.length > 0) {
    params.notebookIds = notebookIds.join(',');
  }

  if (tagName) {
    params.tags = tagName;
  }

  if (noteId) {
    params.noteId = noteId;
  }

  return get('/ai-note/list', params);
};

/**
 * 获取笔记详情
 * @param id 笔记 ID
 * @returns 笔记详情
 */
export const getNoteById = (id: number): Promise<NoteResponse> => {
  return get(`/ai-note/${id}`);
};

/**
 * 获取笔记分页数据
 * @param params 查询参数
 * @returns 分页数据
 */
export const getNotePage = (params: NoteQueryParams): Promise<CrudResponse> => {
  return post('/ai-note/page', params);
};

/**
 * 保存或更新笔记
 * @param note 笔记数据
 * @returns 操作结果
 */
export const saveOrUpdateNote = (note: Partial<Note>): Promise<CrudResponse> => {
  return post('/ai-note/saveOrUpdate', note);
};

/**
 * 删除笔记
 * @param ids 笔记 ID 列表，逗号分隔
 * @returns 操作结果
 */
export const deleteNote = (ids: string): Promise<CrudResponse> => {
  return del(`/ai-note/delete/${ids}`);
};

/**
 * 移动笔记到笔记本
 * @param noteId 笔记 ID
 * @param notebookId 目标笔记本 ID
 * @returns 操作结果
 */
export const moveNoteToNotebook = (
  noteId: number,
  notebookId: number
): Promise<CrudResponse> => {
  return post('/ai-note/move', { note_id: noteId, notebook_id: notebookId });
};

/**
 * 切换笔记收藏状态
 * @param noteId 笔记 ID
 * @param isFavorite 是否收藏（1-收藏，0-取消收藏）
 * @returns 操作结果
 */
export const toggleFavorite = (
  noteId: number,
  isFavorite: number
): Promise<CrudResponse> => {
  return post('/ai-note/favorite', { note_id: noteId, is_favorite: isFavorite });
};

/**
 * 搜索笔记
 * @param keyword 搜索关键词
 * @param notebookIds 笔记本 ID 数组（可选）
 * @returns 搜索结果
 */
export const searchNotes = (
  keyword: string,
  notebookIds?: number[] | null
): Promise<NoteListResponse> => {
  let params: Record<string, string> = { keyword };
  if (notebookIds && notebookIds.length > 0) {
    params.notebookIds = notebookIds.join(',');
  }
  return get('/ai-note/search', params);
};

// 向量搜索相关类型
export interface VectorSearchResult {
  noteId: number;
  noteTitle: string;
  similarity: number;
  matchedChunk: string;
  matchedChunkIndex: number;
  noteContent?: string;
  noteTags?: string;
  notebookId?: number;
}

export interface VectorSearchResponse {
  code: number;
  data: {
    results: VectorSearchResult[];
  };
}

/**
 * 向量语义搜索笔记
 * @param queryText 查询文本
 * @param limit 返回数量，默认5
 * @param minSimilarity 最小相似度，默认0.5
 * @param returnContent 是否返回完整内容，默认false
 * @returns 向量搜索结果
 */
export const vectorSearchNotes = (
  queryText: string,
  limit: number = 5,
  minSimilarity: number = 0.5,
  returnContent: boolean = false
): Promise<VectorSearchResponse> => {
  return post('/ai-note/vector-search', {
    queryText,
    limit,
    minSimilarity,
    returnContent
  });
};
