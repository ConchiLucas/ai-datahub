import service from '@/utils/request';

// =======================
// Learning Item
// =======================

export const getLearningItemList = (data: any) => {
  return service({
    url: '/learningItem/list',
    method: 'post',
    data,
  });
};

export const createLearningItem = (data: any) => {
  return service({
    url: '/learningItem/create',
    method: 'post',
    data,
  });
};

export const updateLearningItem = (data: any) => {
  return service({
    url: '/learningItem/update',
    method: 'put',
    data,
  });
};

export const deleteLearningItem = (data: { id: number | string }) => {
  return service({
    url: '/learningItem/delete',
    method: 'delete',
    data,
  });
};

// =======================
// Learning Chapter
// =======================

export const createLearningChapter = (data: any) => {
  return service({
    url: '/learningChapter/create',
    method: 'post',
    data,
  });
};

export const updateLearningChapter = (data: any) => {
  return service({
    url: '/learningChapter/update',
    method: 'put',
    data,
  });
};

export const toggleChapterCompleted = (data: { id: number | string, completed: boolean }) => {
  return service({
    url: '/learningChapter/toggle',
    method: 'put',
    data,
  });
};

export const deleteLearningChapter = (data: { id: number | string }) => {
  return service({
    url: '/learningChapter/delete',
    method: 'delete',
    data,
  });
};

// =======================
// Learning Note
// =======================

export const createLearningNote = (data: any) => {
  return service({
    url: '/learningNote/create',
    method: 'post',
    data,
  });
};

export const updateLearningNote = (data: any) => {
  return service({
    url: '/learningNote/update',
    method: 'put',
    data,
  });
};

export const deleteLearningNote = (data: { id: number | string }) => {
  return service({
    url: '/learningNote/delete',
    method: 'delete',
    data,
  });
};
