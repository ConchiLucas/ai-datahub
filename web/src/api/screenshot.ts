import service from '@/utils/request';

export const getScreenshotList = (data: any) => {
  return service({
    url: '/screenshot/getScreenshotList',
    method: 'post',
    data,
  });
};

export const createScreenshot = (data: FormData) => {
  return service({
    url: '/screenshot/createScreenshot',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateScreenshot = (data: any) => {
  return service({
    url: '/screenshot/updateScreenshot',
    method: 'put',
    data,
  });
};

export const deleteScreenshot = (data: { id: number }) => {
  return service({
    url: '/screenshot/deleteScreenshot',
    method: 'delete',
    data,
  });
};
