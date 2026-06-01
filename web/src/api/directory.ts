import request, { get, post, del } from '@/utils/request';

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
  childrenCount?: number;  // 子目录/笔记数量
}

// 目录树响应类型
export interface DirectoryTreeResponse {
  code: number;
  msg: string;
  data: Directory[];
}

// 单个目录响应类型（用于保存/更新操作）
export interface DirectoryDetailResponse {
  code: number;
  msg: string;
  data: Directory;
}

// 目录列表响应类型
export interface DirectoryListResponse {
  code: number;
  msg: string;
  data: Directory[];
}

/**
 * 获取目录树
 * @returns 目录树数据
 */
export const getDirectoryTree = (): Promise<DirectoryTreeResponse> => {
  return get<DirectoryTreeResponse>('/directory/tree');
};

/**
 * 获取目录列表
 * @param directoryType 目录类型
 * @param parentId 父目录 ID
 * @returns 目录列表数据
 */
export const getDirectoryList = (
  directoryType: string,
  parentId?: number | null
): Promise<DirectoryListResponse> => {
  const params: { directory_type: string; parent_id?: number | null } = {
    directory_type: directoryType,
  };
  if (parentId !== undefined) {
    params.parent_id = parentId;
  }
  return get<DirectoryListResponse>('/directory/list', params);
};

/**
 * 获取目录详情
 * @param directoryId 目录 ID
 * @returns 目录详情
 */
export const getDirectoryById = (directoryId: number): Promise<DirectoryTreeResponse> => {
  return get<DirectoryTreeResponse>(`/directory/${directoryId}`);
};

/**
 * 保存或更新目录
 * @param directory 目录数据
 * @returns 操作结果
 */
export const saveOrUpdateDirectory = (directory: Partial<Directory> & { notebookId?: number }): Promise<DirectoryDetailResponse> => {
  return post<DirectoryDetailResponse>('/directory/saveOrUpdate', directory);
};

/**
 * 删除目录
 * @param ids 目录 ID 列表，逗号分隔
 * @returns 操作结果
 */
export const deleteDirectory = (ids: string): Promise<DirectoryTreeResponse> => {
  return del<DirectoryTreeResponse>(`/directory/delete/${ids}`);
};

/**
 * 创建组（可同时绑定笔记本）
 * @param name 组名
 * @param parentId 父目录 ID（一般为 null，放在第一层）
 * @param notebookId 可选：要绑定到该组的笔记本 ID
 * @returns 操作结果
 */
export const createGroup = (
  name: string,
  parentId: number | null,
  notebookId?: number
): Promise<DirectoryDetailResponse> => {
  return post<DirectoryDetailResponse>('/directory/saveOrUpdate', {
    name,
    type: 'group',
    parentId,
    sortNum: 0,
    notebookId,  // 传递笔记本 ID，后端可以将笔记本移动到组下
  });
};

/**
 * 移动目录（修改父目录 ID）
 * @param directoryId 目录 ID
 * @param parentId 新的父目录 ID
 * @param name 目录名称（更新时需要）
 * @param type 目录类型（更新时需要）
 * @returns 操作结果
 */
export const moveDirectory = (
  directoryId: number,
  parentId: number | null,
  name: string,
  type: 'group' | 'note' | 'file'
): Promise<DirectoryDetailResponse> => {
  return post<DirectoryDetailResponse>('/directory/saveOrUpdate', {
    id: directoryId,
    parentId,
    name,
    type,
  });
};

/**
 * 移动笔记到其他组
 * @param noteId 笔记 ID
 * @param groupId 目标组 ID
 * @returns 操作结果
 */
export const moveNoteToGroup = (
  noteId: number,
  groupId: number
): Promise<DirectoryDetailResponse> => {
  return post<DirectoryDetailResponse>('/directory/moveNote', {
    noteId,
    groupId,
  });
};

/**
 * 重命名组
 * @param id 组 ID
 * @param name 新的组名
 * @returns 操作结果
 */
export const renameGroup = (
  id: number,
  name: string
): Promise<DirectoryDetailResponse> => {
  return post<DirectoryDetailResponse>('/directory/saveOrUpdate', {
    id,
    name,
  });
};
