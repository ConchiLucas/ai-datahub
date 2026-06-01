import request from '@/utils/request';
import { Transaction } from '../components/BillingManager/BillingManagerPage';

export interface BaseResponse<T> {
  code: number;
  data: T;
  msg: string;
}

export interface CreateBillingReq {
  type: string;
  categoryId: string;
  amount: number;
  note: string;
}

// 获取列表
export const getBillingList = async () => {
  return request.get<any, BaseResponse<Transaction[]>>('/billing/list');
};

// 创建记录
export const createBilling = async (data: CreateBillingReq) => {
  return request.post<any, BaseResponse<Transaction>>('/billing/create', data);
};

// 删除记录
export const deleteBilling = async (id: number | string) => {
  return request.delete<any, BaseResponse<any>>('/billing/delete', {
    data: { id: Number(id) }
  });
};
