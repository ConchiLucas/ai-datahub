import request from '@/utils/request';

export interface ApiResponse<T = any> {
  code: number;
  data: T;
  msg: string;
}

export interface ReleaseAddress {
  id: number;
  projectId: number;
  label: string;
  url: string;
  env: 'production' | 'staging' | 'dev';
}

export interface ReleaseFile {
  id: number;
  projectId: number;
  name: string;
  path: string;
  description: string;
}

export interface ReleaseCommand {
  id: number;
  projectId: number;
  label: string;
  command: string;
  description: string;
}

export interface ReleaseProject {
  id: number;
  name: string;
  description: string;
  addresses: ReleaseAddress[];
  files: ReleaseFile[];
  commands: ReleaseCommand[];
  UpdatedAt: string; // from gorm model
}

export const releaseApi = {
  // 项目
  getProjectList: () => {
    return request.get<any, ApiResponse<ReleaseProject[]>>('/release/getProjectList');
  },
  createProject: (data: { name: string, description: string }) => {
    return request.post<any, ApiResponse<ReleaseProject>>('/release/createProject', data);
  },
  updateProject: (data: { id: number, name: string, description: string }) => {
    return request.put<any, ApiResponse<any>>('/release/updateProject', data);
  },
  deleteProject: (id: number) => {
    return request.delete<any, ApiResponse<any>>('/release/deleteProject', { data: { id: id } });
  },

  // 地址
  createAddress: (data: { projectId: number, label: string, url: string, env: string }) => {
    return request.post<any, ApiResponse<ReleaseAddress>>('/release/createAddress', data);
  },
  updateAddress: (data: { id: number, projectId: number, label: string, url: string, env: string }) => {
    return request.put<any, ApiResponse<any>>('/release/updateAddress', data);
  },
  deleteAddress: (id: number) => {
    return request.delete<any, ApiResponse<any>>('/release/deleteAddress', { data: { id: id } });
  },

  // 文件
  createFile: (data: { projectId: number, name: string, path: string, description: string }) => {
    return request.post<any, ApiResponse<ReleaseFile>>('/release/createFile', data);
  },
  updateFile: (data: { id: number, projectId: number, name: string, path: string, description: string }) => {
    return request.put<any, ApiResponse<any>>('/release/updateFile', data);
  },
  deleteFile: (id: number) => {
    return request.delete<any, ApiResponse<any>>('/release/deleteFile', { data: { id: id } });
  },

  // 命令
  createCommand: (data: { projectId: number, label: string, command: string, description: string }) => {
    return request.post<any, ApiResponse<ReleaseCommand>>('/release/createCommand', data);
  },
  updateCommand: (data: { id: number, projectId: number, label: string, command: string, description: string }) => {
    return request.put<any, ApiResponse<any>>('/release/updateCommand', data);
  },
  deleteCommand: (id: number) => {
    return request.delete<any, ApiResponse<any>>('/release/deleteCommand', { data: { id: id } });
  }
};
