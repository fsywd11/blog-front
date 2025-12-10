import request from "@/utils/request.js";

export const FriendLinksAddService = (FriendLinksData)=> {
   return request.post(`/friendLinks/add`, FriendLinksData)
}

export const FriendLinksListService = ()=> {
   return request.get(`/friendLinks/list`)
}

export const getfriendLinksPage=(params)=>{
   return request.get(`/friendLinks/page`,{params})
}

export const updateFriendLinkStatus = (FriendLinksData)=> {
   return request.put(`/friendLinks/update`, FriendLinksData)
}

export const updatefriendLinksService=(FriendLinksData)=>{
   return request.put(`/friendLinks/updateAll`, FriendLinksData)
}

export const deletefriendLinksService=(id)=>{
   return request.delete(`/friendLinks/delete/${id}`)
}