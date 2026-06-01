import service from '@/utils/request';

// 创建小说
export const createNovel = (data: any) => {
  return service({
    url: '/novel/createNovel',
    method: 'post',
    data
  });
};

// 删除小说
export const deleteNovel = (data: any) => {
  return service({
    url: '/novel/deleteNovel',
    method: 'delete',
    data
  });
};

// 更新小说
export const updateNovel = (data: any) => {
  return service({
    url: '/novel/updateNovel',
    method: 'put',
    data
  });
};

// 获取小说列表
export const getNovelList = (params: any) => {
  return service({
    url: '/novel/getNovelList',
    method: 'get',
    params
  });
};

// 获取单条小说（包括章节）
export const getNovelById = (params: any) => {
  return service({
    url: '/novel/getNovelById',
    method: 'get',
    params
  });
};
