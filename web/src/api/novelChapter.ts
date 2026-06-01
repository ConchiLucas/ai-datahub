import service from '@/utils/request';

// 创建章节
export const createChapter = (data: any) => {
  return service({
    url: '/novelChapter/createChapter',
    method: 'post',
    data
  });
};

// 删除章节
export const deleteChapter = (data: any) => {
  return service({
    url: '/novelChapter/deleteChapter',
    method: 'delete',
    data
  });
};

// 更新章节
export const updateChapter = (data: any) => {
  return service({
    url: '/novelChapter/updateChapter',
    method: 'put',
    data
  });
};

// 获取章节列表
export const getChapterList = (params: any) => {
  return service({
    url: '/novelChapter/getChapterList',
    method: 'get',
    params
  });
};

// 获取单条章节
export const getChapterById = (params: any) => {
  return service({
    url: '/novelChapter/getChapterById',
    method: 'get',
    params
  });
};
