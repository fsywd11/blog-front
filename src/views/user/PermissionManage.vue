<script setup>
import {
  Edit,
  Delete
} from '@element-plus/icons-vue'

import {ref} from 'vue'

//文章分类数据模型
const permissionName = ref("")

//用户搜索时选中的分类id
const permissionDescription = ref('')

//文章列表数据模型
const permissions = ref([])

//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(3)//每页条数

//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
  pageSize.value = size
  PermissionList()
}

//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
  pageNum.value = num
  PermissionList()
}

import {
  permissionAddService,
  permissionDeleteService,
  permissionListService,
  permissionUpdateInfoServices
} from "@/api/permission.js";
//获取文章分页列表数据
const PermissionList = async () => {
  let params = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    permissionName: permissionName.value ? permissionName.value : null,
    permissionDescription:permissionDescription.value ? permissionDescription.value : null
  }
  let result = await permissionListService(params)
  permissions.value = result.data.items;
  total.value = result.data.total;
}

PermissionList()

//控制添加分类弹窗
const dialogVisible = ref(false)

//添加用户数据模型
const permissionModel = ref({
  permissionName: '',
  permissionDescription: '',
})

//添加用户表单校验
const rules = {
  permissionName: [
    {required: true, message: '请输入权限名称', trigger: 'blur'}
  ],
  permissionDescription: [
    {required: true, message: '请输入权限说明', trigger: 'blur'}
  ]
}

import {ElMessage, ElMessageBox} from "element-plus";
import router from "@/router/index.js";
//定义变量，控制弹窗的标题
const title = ref('')

const showDialog = (row) => {
  dialogVisible.value = true
  title.value = '修改权限'
  //数据拷贝
  permissionModel.value.permissionName = row.permissionName
  permissionModel.value.permissionDescription = row.permissionDescription
  permissionModel.value.permissionId=row.permissionId
}

const addPermission = async ()=>{
  //如果表单数据为空，则弹出不能为空的ElMessage
  if(permissionModel.value.permissionName===''|| permissionModel.value.permissionDescription===''){
    ElMessage.warning('不能为空')
    return
  }
  //调用接口
  let result = await permissionAddService(permissionModel.value)
  ElMessage.success(result.data? result.data :'添加成功');
  //调用获取所有文章分类的函数
  await PermissionList();
  //弹窗消失
  dialogVisible.value = false
}

//编辑分类
const updatePermission = async () => {
  let result = await permissionUpdateInfoServices(permissionModel.value)
  ElMessage.success(result.data ? result.data : '修改成功');
  //调用获取所有文章分类的函数
  await PermissionList();
  //弹窗消失,隐藏弹窗
  dialogVisible.value = false
}

//清空模型的数据
const clearData = ()=>{
  permissionModel.value.permissionName = ''
  permissionModel.value.permissionDescription = ''
  permissionModel.value.permissionId=''
}


//删除用户
const deletePermission = (row) => {
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
        await permissionDeleteService(row.permissionId)
        ElMessage({
          type: 'success',
          message: '删除成功'
        })
        //刷新列表
        await PermissionList();
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '用户取消了删除'
        })
      })
}

const permissionGrant = (row) => {
  //跳转到用户角色分配页面
  router.push({
    path: '/permission/permissionGrant',
    query: {
      // 传递角色id
      permissionId: row.permissionId,
      permissionName: row.permissionName,
      permissionDescription:row.permissionDescription
    }
  })
}
</script>


<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>权限管理</span>
        <div class="extra">
          <el-button type="primary" @click="dialogVisible = true,title='新增权限',clearData()">新增权限</el-button>
        </div>
      </div>
    </template>

    <!-- 搜索表单 -->
    <el-form inline>
      <el-form-item label="权限字符：" style="width: 300px">
        <el-input v-model="permissionName" placeholder="请输入权限字符">
        </el-input>
      </el-form-item>

      <el-form-item label="权限说明：" style="width: 300px">
        <el-input v-model="permissionDescription" placeholder="请输入权限说明">
        </el-input>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="PermissionList">搜索</el-button>
        <el-button @click="permissionName='';permissionDescription=''">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 文章列表 -->
    <el-table :data="permissions" style="width: 100%">
      <el-table-column label="权限编号" width="100" prop="permissionId"></el-table-column>
      <el-table-column label="权限字符" prop="permissionName"></el-table-column>
      <el-table-column label="权限说明" prop="permissionDescription"></el-table-column>
      <el-table-column label="创建时间" prop="createTime"></el-table-column>
      <el-table-column label="修改时间" prop="updateTime"></el-table-column>
      <el-table-column label="操作" width="300">
        <template #default="{ row }">
          <el-button :icon="Edit" circle plain type="primary" @click="showDialog(row)"></el-button>编辑
          <el-button :icon="Delete" circle plain type="danger" @click="deletePermission(row)"></el-button>删除
          <el-button :icon="Edit" circle plain type="primary" @click="permissionGrant(row)"></el-button>授权角色
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
      <el-form :model="permissionModel" :rules="rules" label-width="100px" style="padding-right: 30px">
        <el-form-item label="权限字符" prop="permissionName">
          <el-input v-model="permissionModel.permissionName" minlength="1" maxlength="50"></el-input>
        </el-form-item>
        <el-form-item label="权限说明" prop="permissionDescription">
          <el-input v-model="permissionModel.permissionDescription" minlength="1" maxlength="50"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="title==='新增权限'?addPermission():updatePermission()">确认</el-button>
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
