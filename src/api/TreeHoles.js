import request from "@/utils/request.js";

//管理员文章分类列表查询
export const addTreeHole=(contentData)=>{
    return request.post('/treeHoles/add',contentData);
}

//树洞列表查询
export const getTreeHoleList=()=>{
    return request.get('/treeHoles/list');
}

//删除树洞
export  const deleteTreeHole=(id)=>{
    return request.delete(`/treeHoles/delete/${id}`);
}

//修改树洞
export const updateTreeHole=(contentData)=>{
    return request.put('/treeHoles/update',contentData);
}

//树洞分页查询
export const getTreeHolePage=(params)=>{
    return request.get(`/treeHoles/pagelist`,{params:params});
}