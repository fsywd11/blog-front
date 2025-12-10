import request from "@/utils/request.js";

export const MessageAddService = (messageData )=>{
    return request.post(`/message/add`,messageData);
}

export const MessageListService = ()=>{
    return request.get(`/message/list`);
}

export const getMessagePage=(params)=>{
    return request.get(`/message/page`,{params});
}
export const updateMessagesService=(messageData)=>{
    return request.put(`/message/update`,messageData);
}
export const deleteMessagesService=(id)=>{
    return request.delete(`/message/delete/${id}`,);
}