import request, { get, post, put } from '@/utils/request';

// 登录请求参数类型
export interface LoginParams {
  username: string;
  password: string;
}

// 登录响应数据类型
export interface LoginResponse {
  token: string;
  expires_in: number;
  token_type: string;
  user_info: {
    id: number;
    username: string;
    origin_setting?: any;
  };
}

// 用户信息类型
export interface UserInfo {
  id: number;
  username: string;
  origin_setting?: any;
}

/**
 * 用户登录
 * @param data 登录参数
 * @returns 登录响应
 */
export const login = (data: LoginParams): Promise<LoginResponse> => {
  return post<LoginResponse>('/auth/login', data);
};

/**
 * 获取当前用户信息
 * @returns 用户信息
 */
export const getUserInfo = (): Promise<UserInfo> => {
  return get<UserInfo>('/auth/userinfo');
};

/**
 * 退出登录
 * @returns 退出响应
 */
export const logout = (): Promise<void> => {
  return post<void>('/auth/logout');
};

// 修改密码请求参数类型
export interface ChangePasswordParams {
  password: string;
  newPassword: string;
}

// 修改密码响应类型
export interface ChangePasswordResponse {
  code: number;
  message: string;
}

/**
 * 修改密码
 * @param data 修改密码参数
 * @returns 修改密码响应
 */
export const changePassword = (data: ChangePasswordParams): Promise<ChangePasswordResponse> => {
  return post<ChangePasswordResponse>('/user/changePassword', data);
};

/**
 * 修改用户设置
 * @param settings 设置对象
 */
export const setUserSetting = (settings: any): Promise<any> => {
  return put<any>('/user/setSelfSetting', settings);
};
