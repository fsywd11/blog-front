<script setup>
import {
  Edit,
  Delete
} from '@element-plus/icons-vue'

import {ref} from 'vue'

//文章分类数据模型
const roleName = ref("")

//用户搜索时选中的分类id
const roleDescription = ref('')

//文章列表数据模型
const roles = ref([])

//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(3)//每页条数

//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
  pageSize.value = size
  RolesList()
}

//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
  pageNum.value = num
  RolesList()
}

import {rolesAddService, rolesDeleteService, rolesListService, rolesUpdateInfoServices} from "@/api/roles.js";
//获取文章分页列表数据
const RolesList = async () => {
  let params = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    roleName: roleName.value ? roleName.value : null,
    roleDescription: roleDescription.value ? roleDescription.value : null
  }
  let result = await rolesListService(params)
  roles.value = result.data.items;
  total.value = result.data.total;
}

RolesList()

//控制添加分类弹窗
const dialogVisible = ref(false)

//添加用户数据模型
const rolesModel = ref({
  roleName: '',
  roleDescription: ''
})

//添加用户表单校验
const rules = {
  roleName: [
    {required: true, message: '请输入角色名称', trigger: 'blur'}
  ],
  roleDescription: [
    {required: true, message: '请输入角色权能', trigger: 'blur'}
  ]
}

import {ElMessage, ElMessageBox} from "element-plus";
import router from "@/router/index.js";
//定义变量，控制弹窗的标题
const title = ref('')

const showDialog = (row) => {
  dialogVisible.value = true
  title.value = '修改角色'
  //数据拷贝
  rolesModel.value.roleName = row.roleName
  rolesModel.value.roleDescription = row.roleDescription
  //拓展id属性，将来需要传递给后台，完成分类的修改
  rolesModel.value.roleId=row.roleId
}

const addRoles = async ()=>{
  //如果表单数据为空，则弹出不能为空的ElMessage
  if(rolesModel.value.roleName===''|| rolesModel.value.roleDescription===''){
    ElMessage.warning('不能为空')
    return
  }
  //调用接口
  let result = await rolesAddService(rolesModel.value)
  ElMessage.success(result.data? result.data :'添加成功');
  //调用获取所有文章分类的函数
  await RolesList();
  //弹窗消失
  dialogVisible.value = false
}

//编辑分类
const updateRoles = async () => {
  let result = await rolesUpdateInfoServices(rolesModel.value)
  ElMessage.success(result.data ? result.data : '修改成功');
  //调用获取所有文章分类的函数
  await RolesList();
  //弹窗消失,隐藏弹窗
  dialogVisible.value = false
}

const clearData = () => {
  rolesModel.value.roleName = ''
  rolesModel.value.roleDescription = ''
  rolesModel.value.roleId=''
}

//删除用户
const deleteRoles = (row) => {
//提示用户，确认框
  ElMessageBox.confirm(
      '你确认要删除该分类信息吗?',
      '温馨提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
  )
      .then(async () => {
        //调用接口
        await rolesDeleteService(row.roleId)
        ElMessage({
          type: 'success',
          message: '删除成功'
        })
        //刷新列表
        await RolesList();
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '用户取消了删除'
        })
      })
}

const UserGrant = (row) => {
  //跳转到用户角色分配页面
  router.push({
    path: '/user/userGrant',
    query: {
      // 传递角色id
      roleId: row.roleId,
      roleName: row.roleName
    }
  })
}
</script>


<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>角色管理</span>
        <div class="extra">
          <el-button type="primary" @click="dialogVisible = true,title='新增角色',clearData()">新增角色</el-button>
        </div>
      </div>
    </template>

    <!-- 搜索表单 -->
    <el-form inline>
      <el-form-item label="角色名称：" style="width: 300px">
        <el-input v-model="roleName" placeholder="请输入角色名称">
        </el-input>
      </el-form-item>

      <el-form-item label="角色权能：" style="width: 300px">
        <el-input v-model="roleDescription" placeholder="请输入角色权能">
        </el-input>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="RolesList">搜索</el-button>
        <el-button @click="roleName='';roleDescription=''">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 文章列表 -->
    <el-table :data="roles" style="width: 100%">
      <el-table-column label="角色编号" width="100" prop="roleId"></el-table-column>
      <el-table-column label="角色名称" prop="roleName"></el-table-column>
      <el-table-column label="角色权能" prop="roleDescription"></el-table-column>
      <el-table-column label="创建时间" prop="createTime"></el-table-column>
      <el-table-column label="修改时间" prop="updateTime"></el-table-column>
      <el-table-column label="操作" width="300">
        <template #default="{ row }">
          <el-button :icon="Edit" circle plain type="primary" @click="showDialog(row)"></el-button>编辑
          <el-button :icon="Delete" circle plain type="danger" @click="deleteRoles(row)"></el-button>删除
          <el-button :icon="Edit" circle plain type="primary" @click="UserGrant(row)"></el-button>授权用户
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="没有数据"/>
      </template>
    </el-table>

    <!-- 分页条 -->
    <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :page-sizes="[3, 5 ,10, 15]"
                   layout="jumper, total, sizes, prev, pager, next" background :total="total"
                   @size-change="onSizeChange"
                   @current-change="onCurrentChange" style="margin-top: 20px; justify-content: flex-end"/>

    <!-- 添加分类弹窗 -->
    <!--prop 属性明确了表单数据对象中要绑定的字段,与rules进行校验-->
    <el-dialog v-model="dialogVisible" :title="title" width="30%">
      <el-form :model="rolesModel" :rules="rules" label-width="100px" style="padding-right: 30px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="rolesModel.roleName" minlength="1" maxlength="20"></el-input>
        </el-form-item>
        <el-form-item label="角色权能" prop="roleDescription">
          <el-input v-model="rolesModel.roleDescription" minlength="1" maxlength="20"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="title==='新增角色'?addRoles():updateRoles()">确认</el-button>
          <el-button @click="dialogVisible = false">取消</el-button>
        </span>
      </template>
    </el-dialog>
  </el-card>
</template>
<style lang="scss" scoped>
.page-container {
  min-height: 100%;
  box-sizing: border-box;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

/* 抽屉样式 */
.avatar-uploader {
  :deep() {
    .avatar {
      width: 178px;
      height: 178px;
      display: block;
    }

    .el-upload {
      border: 1px dashed var(--el-border-color);
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: var(--el-transition-duration-fast);
    }

    .el-upload:hover {
      border-color: var(--el-color-primary);
    }

    .el-icon.avatar-uploader-icon {
      font-size: 28px;
      color: #8c939d;
      width: 178px;
      height: 178px;
      text-align: center;
    }
  }
}

.editor {
  width: 100%;

  :deep(.ql-editor) {
    min-height: 200px;
  }
}
</style>
