import request from '@/utils/request';

export interface EnglishWord {
  id?: number;
  word: string;
  meaning: string;
  phrase: string;
  phraseTranslation: string;
  link: string;
  date: string;
  mastery: 0 | 1 | 2;
}

export function getEnglishWordList() {
  return request({
    url: '/englishWord/list',
    method: 'get',
  });
}

export function createEnglishWord(data: EnglishWord) {
  return request({
    url: '/englishWord/create',
    method: 'post',
    data,
  });
}

export function updateEnglishWord(data: EnglishWord) {
  return request({
    url: '/englishWord/update',
    method: 'put',
    data,
  });
}

export function deleteEnglishWord(ids: number[]) {
  return request({
    url: '/englishWord/delete',
    method: 'delete',
    data: { ids },
  });
}
