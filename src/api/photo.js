import request from "@/utils/request.js";

export const photoAddService = (PhotoData)=> {
  return request.post(`/photo/add`, PhotoData)
}

export const photoListService = ()=> {
   return request.get(`/photo/list`)
}

export const photoPageListService=(params)=> {
   return request.get(`/photo/pageList`, {params})
}

export const photoDeleteService=(id)=> {
   return request.delete(`/photo/delete/${id}`)
}

export const photoUpdateService=(PhotoData)=> {
   return request.put(`/photo/update`, PhotoData)
}