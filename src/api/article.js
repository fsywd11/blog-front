import request from "@/utils/request.js";

//管理员文章分类列表查询
export const articleCateListService=()=>{
    return request.get('/category/list');
}

//管理员文章分类列表查询
export const CateListService=()=>{
    return request.get('/category');
}

//文章分类添加
export const articleCategoryAddService = (categoryData)=>{
    return request.post('/category',categoryData)
}

//编辑分类，文章分类修改
export const articleCategoryUpdateService = (categoryData)=>{
    return request.put('/category',categoryData)
}

//文章分类删除
export const articleCategoryDeleteService = (id)=>{
     return request.delete(`/category/${id}`)
    //return request.delete(`/category?id`+id)
}

//文章分页列表查询
export const articleListService = (params)=>{
    return request.get('/article',{params:params})
}

//文章添加
export const articleAddService = (articleData)=>{
    return request.post('/article',articleData)
}

//文章管理修改文章
export const articleUpdateService = (categoryData)=>{
    return request.put('/article',categoryData)
}

//文章管理删除
export const articleDeleteService = (id)=>{
    return request.delete(`/article/delete/${id}`)
    //return request.delete(`/category?id`+id)
}

//首页获取文章分页列表详细信息
export const articleInfoServices=(params)=>{
    return request.get('/article/info',{params:params})
}

//获取所有文章详细信息
export const articleListController = () => {
    return request.get(`/article/infoController`)
}

//根据id获取文章详细信息
export const articleInfoById = (id) => {
    return request.get(`/article/${id}`)
}
