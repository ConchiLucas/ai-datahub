import service from '@/utils/request';

export const createScript = (data: any) => {
  return service({
    url: '/script/createScript',
    method: 'post',
    data
  });
};

export const updateScript = (data: any) => {
  return service({
    url: '/script/updateScript',
    method: 'put',
    data
  });
};

export const deleteScript = (data: { id: number }) => {
  return service({
    url: '/script/deleteScript',
    method: 'delete',
    data
  });
};

export const getScriptList = (data: any) => {
  return service({
    url: '/script/getScriptList',
    method: 'post',
    data
  });
};
