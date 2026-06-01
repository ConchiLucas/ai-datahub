import { get, post, del, put } from '@/utils/request';
import type { TagListResponse, TagResponse, CreateTagRequest, UpdateTagRequest } from '@/types';

/**
 * 获取所有标签列表
 * @returns 标签列表
 */
export const getTagList = (): Promise<TagListResponse> => {
  return get('/tag/list');
};

/**
 * 创建新标签
 * @param tagData 标签数据
 * @returns 操作结果
 */
export const createTag = (tagData: CreateTagRequest): Promise<TagResponse> => {
  return post('/tag/create', tagData);
};

/**
 * 更新标签（重命名和修改颜色）
 * @param tagId 标签ID
 * @param tagData 标签数据
 * @returns 操作结果
 */
export const updateTag = (tagId: number, tagData: UpdateTagRequest): Promise<TagResponse> => {
  return put(`/tag/${tagId}`, tagData);
};

/**
 * 删除标签
 * @param tagId 标签ID
 * @returns 操作结果
 */
export const deleteTag = (tagId: number): Promise<TagResponse> => {
  return del(`/tag/${tagId}`);
};

/**
 * 更新笔记的标签（使用标签名称列表）
 * @param noteId 笔记ID
 * @param tagNames 标签名称数组
 * @returns 操作结果
 */
export const updateNoteTags = (
  noteId: number,
  tagNames: string[]
): Promise<TagResponse> => {
  return put(`/tag/note/${noteId}/tags`, { tag_names: tagNames });
};

/**
 * 为笔记添加标签
 * @param noteId 笔记ID
 * @param tagId 标签ID
 * @returns 操作结果
 */
export const addTagToNote = (
  noteId: number,
  tagId: number
): Promise<TagResponse> => {
  return post('/tag/note-tag', { noteId, tagId });
};

/**
 * 从笔记移除标签
 * @param noteId 笔记ID
 * @param tagId 标签ID
 * @returns 操作结果
 */
export const removeTagFromNote = (
  noteId: number,
  tagId: number
): Promise<TagResponse> => {
  return del(`/tag/note-tag?noteId=${noteId}&tagId=${tagId}`);
};
