import request from '@/utils/request';

// API响应接口
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  msg: string;
}

// 核心数据模型 (对应后端)
export interface DockerFile {
  id: number;
  name: string;
  type: 'dockerfile' | 'compose';
  content: string;
  description: string;
  projectId: number;
  UpdatedAt: string;
}

export interface DockerProject {
  id: number;
  name: string;
  orgId: number;
  files: DockerFile[];
}

export interface DockerOrganization {
  id: number;
  name: string;
  projects: DockerProject[];
}

// ==============
// API 封装
// ==============

export const dockerApi = {
  // 获取完整树
  getDockerTree: () => {
    return request.get<any, ApiResponse<DockerOrganization[]>>('/docker/getTree');
  },

  // 组织
  createOrg: (data: { name: string }) => {
    return request.post<any, ApiResponse<DockerOrganization>>('/docker/createOrg', data);
  },
  updateOrg: (data: { id: number, name: string }) => {
    return request.put<any, ApiResponse<any>>('/docker/updateOrg', data);
  },
  deleteOrg: (id: number) => {
    return request.delete<any, ApiResponse<any>>('/docker/deleteOrg', { data: { id } });
  },

  // 项目
  createProject: (data: { name: string, orgId: number }) => {
    return request.post<any, ApiResponse<DockerProject>>('/docker/createProject', data);
  },
  updateProject: (data: { id: number, name: string, orgId: number }) => {
    return request.put<any, ApiResponse<any>>('/docker/updateProject', data);
  },
  deleteProject: (id: number) => {
    return request.delete<any, ApiResponse<any>>('/docker/deleteProject', { data: { id } });
  },

  // 文件
  createFile: (data: { name: string, type: string, content: string, description: string, projectId: number }) => {
    return request.post<any, ApiResponse<DockerFile>>('/docker/createFile', data);
  },
  updateFile: (data: { id: number, name: string, type: string, content: string, description: string, projectId: number }) => {
    return request.put<any, ApiResponse<any>>('/docker/updateFile', data);
  },
  deleteFile: (id: number) => {
    return request.delete<any, ApiResponse<any>>('/docker/deleteFile', { data: { id } });
  }
};
