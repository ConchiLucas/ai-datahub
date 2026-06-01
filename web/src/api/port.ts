import request from '@/utils/request';

export interface PortItem {
  id?: number | string;
  id?: number | string;
  hostType: 'server' | 'pc' | 'other';
  hostName: string;
  port: number | string;
  protocol: string; // 'TCP' | 'UDP' | 'TCP/UDP'
  application: string;
  description: string;
  status: 'active' | 'inactive' | 'reserved';
  updatedAt?: string;
  CreatedAt?: string;
}

export interface HostItem {
  id?: number | string;
  id?: number | string;
  name: string;
  type: 'server' | 'pc' | 'other';
  description?: string;
  updatedAt?: string;
  CreatedAt?: string;
}

// 主机 API
export const getHostList = () => {
  return request({
    url: '/port/hostList',
    method: 'get'
  });
};

export const createHost = (data: HostItem) => {
  return request({
    url: '/port/host',
    method: 'post',
    data
  });
};

export const deleteHost = (data: { id: string | number }) => {
  return request({
    url: '/port/host',
    method: 'delete',
    data
  });
};

export const updateHost = (data: HostItem) => {
  return request({
    url: '/port/host',
    method: 'put',
    data
  });
};

// 端口记录 API
export const getPortList = () => {
  return request({
    url: '/port/recordList',
    method: 'get'
  });
};

export const createPort = (data: PortItem) => {
  return request({
    url: '/port/record',
    method: 'post',
    data
  });
};

export const deletePort = (data: { id: string | number }) => {
  return request({
    url: '/port/record',
    method: 'delete',
    data
  });
};

export const updatePort = (data: PortItem) => {
  return request({
    url: '/port/record',
    method: 'put',
    data
  });
};
