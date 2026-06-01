import request from '@/utils/request';

export interface ApiResponse<T = any> {
  code: number;
  data: T;
  msg: string;
}

export interface DeployStep {
  id: number;
  projectId: number;
  sortOrder: number;
  title: string;
  description: string;
  commands: string;
  platform: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface DeployFile {
  id: number;
  projectId: number;
  name: string;
  language: string;
  content: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface DeployProject {
  id: number;
  name: string;
  description: string;
  platforms: string;
  files: DeployFile[];
  steps: DeployStep[];
  CreatedAt: string;
  UpdatedAt: string;
}

export const deployApi = {
  // 获取完整树
  getTree: () => {
    return request.get<any, ApiResponse<DeployProject[]>>('/deploy/getTree');
  },

  // 项目
  createProject: (data: { name: string; description?: string; platforms?: string }) => {
    return request.post<any, ApiResponse<DeployProject>>('/deploy/createProject', data);
  },
  updateProject: (data: { id: number; name: string; description: string; platforms: string }) => {
    return request.put<any, ApiResponse<any>>('/deploy/updateProject', data);
  },
  deleteProject: (id: number) => {
    return request.delete<any, ApiResponse<any>>('/deploy/deleteProject', { data: { id } });
  },

  // 文件
  createFile: (data: { name: string; language: string; content: string; projectId: number }) => {
    return request.post<any, ApiResponse<DeployFile>>('/deploy/createFile', data);
  },
  updateFile: (data: { id: number; name: string; language: string; content: string; projectId: number }) => {
    return request.put<any, ApiResponse<any>>('/deploy/updateFile', data);
  },
  deleteFile: (id: number) => {
    return request.delete<any, ApiResponse<any>>('/deploy/deleteFile', { data: { id } });
  },

  // 步骤
  createStep: (data: { projectId: number; sortOrder: number; title: string; description?: string; commands?: string; platform?: string }) => {
    return request.post<any, ApiResponse<DeployStep>>('/deploy/createStep', data);
  },
  updateStep: (data: { id: number; sortOrder: number; title: string; description: string; commands: string; platform: string }) => {
    return request.put<any, ApiResponse<any>>('/deploy/updateStep', data);
  },
  deleteStep: (id: number) => {
    return request.delete<any, ApiResponse<any>>('/deploy/deleteStep', { data: { id } });
  },
};
