import request from '@/utils/request';

export const addPromptCategory = (data: { name: string }) => {
  return request({
    url: '/prompt/addCategory',
    method: 'post',
    data
  });
};

export const deletePromptCategory = (data: { name: string }) => {
  return request({
    url: '/prompt/deleteCategory',
    method: 'delete',
    data
  });
};

export const addPrompt = (data: { title: string, category: string, content: string }) => {
  return request({
    url: '/prompt/add',
    method: 'post',
    data
  });
};

export const updatePrompt = (data: { id: number, title: string, category: string, content: string }) => {
  return request({
    url: '/prompt/update',
    method: 'put',
    data
  });
};

export const deletePrompt = (data: { id: number }) => {
  return request({
    url: '/prompt/delete',
    method: 'delete',
    data
  });
};

export const getPromptData = () => {
  return request({
    url: '/prompt/getData',
    method: 'get'
  });
};
