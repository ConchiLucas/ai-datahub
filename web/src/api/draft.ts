import request from '@/utils/request';

export const createDraft = (data: { title: string; content: string; color: string }) => {
  return request({
    url: '/draft/createTaDraft',
    method: 'post',
    data
  });
};

export const updateDraft = (data: { id: number; title?: string; content?: string; pinned?: boolean; starred?: boolean; color?: string }) => {
  return request({
    url: '/draft/updateTaDraft',
    method: 'put',
    data
  });
};

export const deleteDraft = (data: { id: number }) => {
  return request({
    url: '/draft/deleteTaDraft',
    method: 'delete',
    data
  });
};

export const getDraftList = (params: { page: number; pageSize: number; keyword?: string; starred?: boolean }) => {
  return request({
    url: '/draft/getTaDraftList',
    method: 'get',
    params
  });
};
