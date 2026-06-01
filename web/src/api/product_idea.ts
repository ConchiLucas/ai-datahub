import request from '../utils/request';

export interface KeyPoint {
  id: string;
  text: string;
  done: boolean;
}

export interface ProductIdea {
  id: number;
  title: string;
  product: string;
  description: string;
  keyPoints: KeyPoint[];
  notes: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  updatedAt: string;
}

export function createProductIdea(data: Partial<ProductIdea>) {
  return request.post('/productIdea/create', data);
}

export function updateProductIdea(data: Partial<ProductIdea>) {
  return request.put('/productIdea/update', data);
}

export function deleteProductIdea(id: number) {
  return request.delete('/productIdea/delete', { data: { id } });
}

export interface ProductIdeaSearchParams {
  page: number;
  pageSize: number;
  filterPriority?: string;
  filterProduct?: string;
  searchQuery?: string;
}

export function getProductIdeaList(data: ProductIdeaSearchParams) {
  return request.post<{
    data: {
      list: ProductIdea[];
      total: number;
      page: number;
      pageSize: number;
    }
  }>('/productIdea/list', data);
}
