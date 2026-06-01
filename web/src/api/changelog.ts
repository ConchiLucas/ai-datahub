import service from '@/utils/request';

// --- Projects ---

export const getProjectWithLogsList = (data: any) => {
  return service({
    url: '/changelog/getProjectWithLogsList',
    method: 'post',
    data,
  });
};

export const createProject = (data: any) => {
  return service({
    url: '/changelog/createProject',
    method: 'post',
    data,
  });
};

export const updateProject = (data: any) => {
  return service({
    url: '/changelog/updateProject',
    method: 'put',
    data,
  });
};

export const deleteProject = (data: { id: number }) => {
  return service({
    url: '/changelog/deleteProject',
    method: 'delete',
    data,
  });
};

// --- Logs ---

export const createLog = (data: any) => {
  return service({
    url: '/changelog/createLog',
    method: 'post',
    data,
  });
};

export const updateLog = (data: any) => {
  return service({
    url: '/changelog/updateLog',
    method: 'put',
    data,
  });
};

export const deleteLog = (data: { id: number }) => {
  return service({
    url: '/changelog/deleteLog',
    method: 'delete',
    data,
  });
};
