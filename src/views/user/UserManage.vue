<script setup>
import {
  Edit,
  Delete
} from '@element-plus/icons-vue'

import {ref} from 'vue'

//文章分类数据模型
const username = ref("")

//用户搜索时选中的分类id
const email = ref('')

//文章列表数据模型
const users = ref([])

//选中的用户ID数组，用于批量删除
const selectedUserIds = ref([])

//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(3)//每页条数

//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
  pageSize.value = size
  UserList()
}

//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
  pageNum.value = num
  UserList()
}

import {userUpdateInfoServices, userListService, userDeleteService} from '@/api/user.js'
//获取文章分页列表数据
const UserList = async () => {
  let params = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    username: username.value ? username.value : null,
    email: email.value ? email.value : null
  }
  let result = await userListService(params)
  users.value = result.data.items;

  total.value = result.data.total;
}

UserList()

//控制添加分类弹窗
const dialogVisible = ref(false)

//添加用户数据模型
const userModel = ref({
  username: '',
  nickname: '',
  email: ''
})

//添加用户表单校验
const rules = {
  username: [
    {required: true, message: '请输入用户名称', trigger: 'blur'}
  ],
  nickname: [
    {required: true, message: '请输入用户昵称', trigger: 'blur'}
  ],
  email: [
    {required: true, message: '请输入用户邮箱', trigger: 'blur'}
  ]
}

import {ElMessage, ElMessageBox} from "element-plus";
import router from "@/router/index.js";
//定义变量，控制弹窗的标题
const title = ref('编辑用户')

const showDialog = (row) => {
  dialogVisible.value = true
  //数据拷贝
  userModel.value.username = row.username
  userModel.value.nickname = row.nickname
  userModel.value.email = row.email
}

//编辑分类
const updateUser = async () => {
  let result = await userUpdateInfoServices(userModel.value)
  ElMessage.success(result.data ? result.data : '修改成功');
  //调用获取所有文章分类的函数
  await UserList();
  //弹窗消失,隐藏弹窗
  dialogVisible.value = false
}

//删除用户
const deleteUser = (row) => {
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
        await userDeleteService(row.id)
        ElMessage({
          type: 'success',
          message: '删除成功'
        })
        //刷新列表
        await UserList();
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '用户取消了删除'
        })
      })
}

// 批量删除用户
const batchDeleteUsers = async () => {
  if (selectedUserIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的用户')
    return
  }
  
  ElMessageBox.confirm(
    `确认要删除选中的 ${selectedUserIds.value.length} 个用户吗？`,
    '批量删除确认',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'danger'
    }
  )
  .then(async () => {
    try {
      // 循环删除每个选中的用户
      for (const id of selectedUserIds.value) {
        await userDeleteService(id)
      }
      
      ElMessage.success('批量删除成功')
      // 清空选中状态
      selectedUserIds.value = []
      // 刷新列表
      await UserList()
    } catch (error) {
      ElMessage.error('批量删除失败，请重试')
    }
  })
  .catch(() => {
    ElMessage.info('已取消批量删除操作')
  })
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedUserIds.value = selection.map(row => row.id)
}

const RolesGrant = (row) => {
  //跳转到用户角色分配页面
  router.push({
    path: '/roles/rolesGrant',
    query: {
      // 传递用户id
      id: row.id,
      username: row.username
    }
  })
}

</script>


<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>用户管理</span>
      </div>
    </template>

    <!-- 搜索表单 -->
    <el-form inline>
      <el-form-item label="用户名称：" style="width: 300px">
        <el-input v-model="username" placeholder="请输入用户名称">
        </el-input>
      </el-form-item>

      <el-form-item label="用户邮箱：" style="width: 300px">
        <el-input v-model="email" placeholder="请输入用户邮箱">
        </el-input>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="UserList">搜索</el-button>
        <el-button @click="username='';email=''">重置</el-button>
        <el-button 
          type="danger" 
          :icon="Delete" 
          @click="batchDeleteUsers"
          :disabled="selectedUserIds.length === 0"
          class="mr-2"
        >
          批量删除 ({{ selectedUserIds.length }})
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 用户列表 -->
    <el-table 
      :data="users" 
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column label="用户编号" width="80" prop="id"></el-table-column>
      <el-table-column label="用户头像" width="120">
        <!-- 使用 v-slot 来获取当前行的数据 -->
        <template #default="{row}">
          <!-- 绑定头像的 URL 到 src 属性 -->
          <img :src="row.userPic" alt="用户头像"
               :style="{width: '80px', height: 'auto', objectFit: 'cover', borderRadius: '15%'}">
        </template>
      </el-table-column>
      <el-table-column label="用户名称" prop="username" width="150"></el-table-column>
      <el-table-column label="用户昵称" prop="nickname" width="150"></el-table-column>
      <el-table-column label="用户邮箱" prop="email" width="200">
        <template #default="{ row }">
          <el-tooltip :content="row.email" placement="top">
            <div class="text-ellipsis">{{ row.email }}</div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">
          {{ row.createTime ? row.createTime.replace('T', ' ') : '' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button size="small" :icon="Edit" circle plain type="primary" @click="showDialog(row)"></el-button>编辑
          <el-button size="small" :icon="Delete" circle plain type="danger" @click="deleteUser(row)"></el-button>删除
          <el-button size="small" :icon="Edit" circle plain type="primary" @click="RolesGrant(row)"></el-button>分配
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
      <el-form :model="userModel" :rules="rules" label-width="100px" style="padding-right: 30px">
        <el-form-item label="用户名称" prop="username">
          <el-input v-model="userModel.username" minlength="1" maxlength="10"></el-input>
        </el-form-item>
        <el-form-item label="用户昵称" prop="nickname">
          <el-input v-model="userModel.nickname" minlength="1" maxlength="15"></el-input>
        </el-form-item>
      <el-form-item label="用户邮箱" prop="email">
        <el-input v-model="userModel.email" minlength="1" maxlength="20"></el-input>
      </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="updateUser()">确认</el-button>
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

/* 操作区域样式 */
.operation-area {
  margin-bottom: 20px;
}

/* 右外边距样式 */
.mr-2 {
  margin-right: 8px;
}

/* 表格样式优化 */
el-table {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

/* 文本省略样式 */
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
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
