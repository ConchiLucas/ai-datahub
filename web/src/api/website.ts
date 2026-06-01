import service from '@/utils/request'

export const addCategory = (data: { name: string }) => {
  return service({
    url: '/website/category/add',
    method: 'post',
    data
  })
}

export const deleteCategory = (data: { id: number }) => {
  return service({
    url: '/website/category/delete',
    method: 'delete',
    data
  })
}

export const updateCategory = (data: { id: number, name: string }) => {
  return service({
    url: '/website/category/update',
    method: 'put',
    data
  })
}

export const updateSite = (data: { id: number, categoryId: number, title: string, desc: string, url: string, iconPath: string, accounts?: string }) => {
  return service({
    url: '/website/site/update',
    method: 'put',
    data
  })
}

export const getWebsiteData = () => {
  return service({
    url: '/website/data',
    method: 'get'
  })
}

export const addSite = (data: { categoryId: number, title: string, desc: string, url: string, iconPath: string, accounts?: string }) => {
  return service({
    url: '/website/site/add',
    method: 'post',
    data
  })
}

export const deleteSite = (data: { id: number }) => {
  return service({
    url: '/website/site/delete',
    method: 'delete',
    data
  })
}
