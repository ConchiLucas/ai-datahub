import request from '@/utils/request';

export interface SoftwareForm {
  name: string;
  version: string;
  category: string;
  platform: string;
  description: string;
  file?: File;
  icon?: File;
}

export const getSoftwareData = () => {
  return request({
    url: '/software/list',
    method: 'get',
  });
};

export const addSoftware = (data: SoftwareForm) => {
  const formData = new FormData();
  if (data.file) {
    formData.append('file', data.file);
  }
  if (data.icon) {
    formData.append('icon', data.icon);
  }
  formData.append('name', data.name);
  formData.append('version', data.version);
  formData.append('category', data.category);
  formData.append('platform', data.platform);
  formData.append('description', data.description || '');

  return request({
    url: '/software/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateSoftware = (data: Omit<SoftwareForm, 'file' | 'icon'> & { id: number }) => {
  return request({
    url: '/software/update',
    method: 'put',
    data,
  });
};

export const deleteSoftware = (id: number) => {
  return request({
    url: '/software/delete',
    method: 'delete',
    data: { id },
  });
};
