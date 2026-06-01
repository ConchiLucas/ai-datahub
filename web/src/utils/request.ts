import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { withApiPrefix } from './apiPath';

// 创建 axios 实例
const request = axios.create({
  baseURL: '/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 Token
request.interceptors.request.use(
  (config) => {
    config.url = withApiPrefix(config.url);

    const token = localStorage.getItem('token');
    if (token && token.trim() !== '') {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['x-token'] = token;
    }
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理业务逻辑
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;

    // 检查业务状态码
    if (res.code === 401) {
      // Token 过期或无效，清除 token 并跳转到登录页
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error(res.msg || '登录信息已过期，请重新登录'));
    }

    if (res.code === 601 || res.code === 500) {
      // 业务错误
      return Promise.reject(new Error(res.msg || '系统错误'));
    }

    if (res.code !== 0 && res.code !== 200) {
      // ANY other error code should also be rejected
      return Promise.reject(new Error(res.msg || '请求失败'));
    }

    return res;
  },
  (error: AxiosError) => {
    console.error('HTTP 错误:', error);

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// 导出请求方法
export default request;

// 快捷方法
export const get = <T>(url: string, params?: object): Promise<T> => {
  return request.get(url, { params }).then((res) => res as T);
};

export const post = <T>(url: string, data?: object): Promise<T> => {
  return request.post(url, data).then((res) => res as T);
};

export const put = <T>(url: string, data?: object): Promise<T> => {
  return request.put(url, data).then((res) => res as T);
};

export const del = <T>(url: string): Promise<T> => {
  return request.delete(url).then((res) => res as T);
};
