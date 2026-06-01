import request from '@/utils/request';
import type { MediaItem } from '@/components/GalleryManager/mockData';

// Reusing MediaItem type here, typically you'd abstract it to a types file

export interface UploadMediaParams {
  file: File;
  type?: 'image' | 'video';
  duration?: string;
  thumbnail?: Blob;
}

export interface BaseResponse<T> {
  code: number;
  data: T;
  msg: string;
}

// Upload Media
export const uploadMedia = async (params: UploadMediaParams) => {
  const formData = new FormData();
  formData.append('file', params.file);
  if (params.type) formData.append('type', params.type);
  if (params.duration) formData.append('duration', params.duration);
  if (params.thumbnail) formData.append('thumbnail', params.thumbnail, 'thumb.jpg');

  return request.post<any, BaseResponse<MediaItem>>('/gallery/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Fetch Media List
export const getMediaList = async () => {
  return request.get<any, BaseResponse<MediaItem[]>>('/gallery/list');
};

// Delete Media
export const deleteMedia = async (id: string | number) => {
  return request.delete<any, BaseResponse<null>>('/gallery/delete', {
    data: { id: Number(id) },
  });
};
