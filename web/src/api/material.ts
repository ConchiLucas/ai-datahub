import request from '../utils/request';

export interface Material {
  id: number;
  title: string;
  type: 'image' | 'prompt' | 'video' | 'copywriting';
  content: string;
  tags: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialSearchParams {
  page: number;
  pageSize: number;
  filterType?: string;
  filterTag?: string;
  searchQuery?: string;
}

export function createMaterial(data: Partial<Material>) {
  return request.post('/material/create', data);
}

export function updateMaterial(data: Partial<Material>) {
  return request.put('/material/update', data);
}

export function deleteMaterial(id: number) {
  return request.delete('/material/delete', { data: { id } });
}

export function getMaterialList(data: MaterialSearchParams) {
  return request.post<{
    data: {
      list: Material[];
      total: number;
      page: number;
      pageSize: number;
    }
  }>('/material/list', data);
}
