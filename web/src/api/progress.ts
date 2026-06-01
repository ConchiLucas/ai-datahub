import request from "@/utils/request";

export type FeatureStatus = 'todo' | 'in_progress' | 'done';
export type Priority = 'high' | 'medium' | 'low';

export interface ProgressFeature {
  id: number;
  createdAt: string;
  updatedAt: string;
  parentId: number;
  name: string;
  status: FeatureStatus;
  progress: number;
  priority: Priority;
  description: string;
  sort?: number;
  children: ProgressFeature[];
}

export interface ProgressProject {
  id: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  sort?: number;
  features: ProgressFeature[];
}

export const progressApi = {
  // Project
  createProject(data: Partial<ProgressProject>) {
    return request<ProgressProject>({
      url: "/progress/createProject",
      method: "post",
      data,
    });
  },
  deleteProject(data: { id: number }) {
    return request<any>({
      url: "/progress/deleteProject",
      method: "delete",
      data,
    });
  },
  updateProject(data: Partial<ProgressProject>) {
    return request<any>({
      url: "/progress/updateProject",
      method: "put",
      data,
    });
  },
  getProjectList() {
    return request<ProgressProject[]>({
      url: "/progress/getProjectList",
      method: "get",
    });
  },

  // Feature
  createFeature(data: Partial<ProgressFeature> & { projectId: number }) {
    return request<ProgressFeature>({
      url: "/progress/createFeature",
      method: "post",
      data,
    });
  },
  updateFeature(data: Partial<ProgressFeature> & { id: number }) {
    return request<any>({
      url: "/progress/updateFeature",
      method: "put",
      data,
    });
  },
  deleteFeature(data: { id: number }) {
    return request<any>({
      url: "/progress/deleteFeature",
      method: "delete",
      data,
    });
  },
};
