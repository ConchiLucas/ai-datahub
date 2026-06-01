import request from '@/utils/request';

export interface AccountItem {
  id?: number | string;
  account: string;
  password?: string;
  website: string;
  description: string;
}

export interface BaseResponse<T> {
  code: number;
  data: T;
  msg: string;
}

// 获取账号列表
export const getAccountList = async () => {
  return request.get<any, BaseResponse<AccountItem[]>>('/account/list');
};

// 创建账号
export const createAccount = async (data: AccountItem) => {
  return request.post<any, BaseResponse<any>>('/account/create', data);
};

// 更新账号
export const updateAccount = async (data: AccountItem) => {
  return request.put<any, BaseResponse<any>>('/account/update', { ...data, id: Number(data.id) });
};

// 删除账号
export const deleteAccount = async (id: number | string) => {
  return request.delete<any, BaseResponse<any>>('/account/delete', {
    data: { id: Number(id) }
  });
};
