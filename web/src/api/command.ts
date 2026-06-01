import request from '@/utils/request';

export const addCommandCategory = (data: { name: string }) => {
  return request({
    url: '/command/addCategory',
    method: 'post',
    data
  });
};

export const deleteCommandCategory = (data: { name: string }) => {
  return request({
    url: '/command/deleteCategory',
    method: 'delete',
    data
  });
};

export const addCommand = (data: { title: string, category: string, command: string, description: string }) => {
  return request({
    url: '/command/add',
    method: 'post',
    data
  });
};

export const updateCommand = (data: { id: number, title: string, category: string, command: string, description: string }) => {
  return request({
    url: '/command/update',
    method: 'put',
    data
  });
};

export const deleteCommand = (data: { id: number }) => {
  return request({
    url: '/command/delete',
    method: 'delete',
    data
  });
};

export const getCommandData = () => {
  return request({
    url: '/command/getData',
    method: 'get'
  });
};
