import service from '@/utils/request';

// 获取计划列表
export const getPlanList = (data: any) => {
  return service({
    url: '/plan/getPlanList',
    method: 'post',
    data,
  });
};

// 新增计划
export const createPlan = (data: any) => {
  return service({
    url: '/plan/createPlan',
    method: 'post',
    data,
  });
};

// 更新计划
export const updatePlan = (data: any) => {
  return service({
    url: '/plan/updatePlan',
    method: 'put',
    data,
  });
};

// 仅更新进度
export const updatePlanProgress = (data: any) => {
  return service({
    url: '/plan/updatePlanProgress',
    method: 'put',
    data,
  });
};

// 删除计划
export const deletePlan = (data: { id: number }) => {
  return service({
    url: '/plan/deletePlan',
    method: 'delete',
    data,
  });
};
