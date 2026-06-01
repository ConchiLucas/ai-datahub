import service from '@/utils/request';

export const getGuidelineList = (data: any) => {
  return service({
    url: '/guideline/getGuidelineList',
    method: 'post',
    data,
  });
};

export const createGuideline = (data: any) => {
  return service({
    url: '/guideline/createGuideline',
    method: 'post',
    data,
  });
};

export const updateGuideline = (data: any) => {
  return service({
    url: '/guideline/updateGuideline',
    method: 'put',
    data,
  });
};

export const deleteGuideline = (data: { id: number }) => {
  return service({
    url: '/guideline/deleteGuideline',
    method: 'delete',
    data,
  });
};
