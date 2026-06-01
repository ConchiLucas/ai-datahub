import service from '@/utils/request';

// 获取报错列表
export const getErrorList = (data: any) => {
  return service({
    url: '/appError/getErrorList',
    method: 'post',
    data,
  });
};

// 新增报错
export const createError = (data: any) => {
  return service({
    url: '/appError/createError',
    method: 'post',
    data,
  });
};

// 更新报错
export const updateError = (data: any) => {
  return service({
    url: '/appError/updateError',
    method: 'put',
    data,
  });
};

// 快捷更新报错状态
export const updateErrorStatus = (data: any) => {
  return service({
    url: '/appError/updateErrorStatus',
    method: 'put',
    data,
  });
};

// 删除报错
export const deleteError = (data: { id: number }) => {
  return service({
    url: '/appError/deleteError',
    method: 'delete',
    data,
  });
};
