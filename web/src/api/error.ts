import service from '@/utils/request';

// 获取报错列表
export const getErrorList = (data: any) => {
  return service({
    url: '/errorRecord/getErrorList',
    method: 'post',
    data,
  });
};

// 新增报错
export const createError = (data: any) => {
  return service({
    url: '/errorRecord/createError',
    method: 'post',
    data,
  });
};

// 更新报错
export const updateError = (data: any) => {
  return service({
    url: '/errorRecord/updateError',
    method: 'put',
    data,
  });
};

// 删除报错
export const deleteError = (data: { id: number }) => {
  return service({
    url: '/errorRecord/deleteError',
    method: 'delete',
    data,
  });
};
