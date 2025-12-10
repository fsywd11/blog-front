import request from "@/utils/request.js";

// 文章点赞添加
export const articleAddLike = (articleId) =>{
    return request.post(`/like/add/${articleId}`)
}
// 文章点赞删除
export const articleDeleteLike = (articleId) =>{
    return request.delete(`/like/delete/${articleId}`)
}

// 文章点赞列表
export const articleListByArticleId = (articleId) =>{
    return request.get(`/like/list/${articleId}`)
}

//文章收藏添加
export const articleAddCollect = (articleId) =>{
    return request.post(`/collect/add/${articleId}`)
}

//文章收藏删除
export const articleDeleteCollect = (articleId) =>{
    return request.delete(`/collect/delete/${articleId}`)
}

//文章收藏列表
export const articleListByCollectId = (articleId) =>{
    return request.get(`/collect/list/${articleId}`)
}

export const articleLikeListService = (articleId) =>{
    return request.get(`/like/allList/${articleId}`)
}

export const articleCollectListService = (articleId) =>{
    return request.get(`/collect/allList/${articleId}`)
}

