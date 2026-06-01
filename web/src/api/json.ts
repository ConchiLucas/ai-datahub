import request from '@/utils/request';

export const addJsonSnippet = (data: { title: string, content: string }) => {
  return request({
    url: '/json/add',
    method: 'post',
    data
  });
};

export const updateJsonSnippet = (data: { id: number, title?: string, content?: string }) => {
  return request({
    url: '/json/update',
    method: 'put',
    data
  });
};

export const deleteJsonSnippet = (data: { id: number }) => {
  return request({
    url: '/json/delete',
    method: 'delete',
    data
  });
};

export const getJsonSnippets = () => {
  return request({
    url: '/json/list',
    method: 'get'
  });
};
