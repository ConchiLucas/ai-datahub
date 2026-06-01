import request from '@/utils/request';

export interface MusicItem {
  id: string | number;
  userId?: number;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
  duration: number; // in seconds
  size?: number;
  isFavorite?: boolean;
  lastPlayedAt?: string;
  CreatedAt?: string;
}

export const getMusicList = () => {
  return request({
    url: '/music/list',
    method: 'get'
  });
};

export const deleteMusic = (id: number) => {
  return request({
    url: '/music/delete',
    method: 'post',
    data: { id }
  });
};

export const uploadMusic = (data: FormData) => {
  return request({
    url: '/music/upload',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const toggleFavoriteMusic = (id: number) => {
  return request({
    url: '/music/favorite',
    method: 'post',
    data: { id }
  });
};

export const logMusicPlay = (id: number) => {
  return request({
    url: '/music/play',
    method: 'post',
    data: { id }
  });
};
