import request from '@/utils/request';

export const createCode = (data: { feature: string, language: string, title: string, description: string, code: string }) => {
  return request({
    url: '/code/createCode',
    method: 'post',
    data
  });
};

export const updateCode = (data: { id: number, feature: string, language: string, title: string, description: string, code: string }) => {
  return request({
    url: '/code/updateCode',
    method: 'put',
    data
  });
};

export const deleteCode = (data: { id: number }) => {
  return request({
    url: '/code/deleteCode',
    method: 'delete',
    data
  });
};

export const getCodeList = (data: { page: number, pageSize: number, feature?: string, keyword?: string }) => {
  return request({
    url: '/code/getCodeList',
    method: 'post',
    data
  });
};
