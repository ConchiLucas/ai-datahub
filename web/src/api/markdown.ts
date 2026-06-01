import request from '@/utils/request';

export const addMarkdownSnippet = (data: { title: string, content: string }) => {
  return request({
    url: '/markdown/add',
    method: 'post',
    data
  });
};

export const updateMarkdownSnippet = (data: { id: number, title?: string, content?: string }) => {
  return request({
    url: '/markdown/update',
    method: 'put',
    data
  });
};

export const deleteMarkdownSnippet = (data: { id: number }) => {
  return request({
    url: '/markdown/delete',
    method: 'delete',
    data
  });
};

export const getMarkdownSnippets = () => {
  return request({
    url: '/markdown/list',
    method: 'get'
  });
};
