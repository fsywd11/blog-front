<script setup>
import {Edit} from '@element-plus/icons-vue'
import {ref} from 'vue'
//文章分类数据模型
import {useRoute} from 'vue-router';
// 获取当前路由信息
const route = useRoute();
// 从查询参数中获取用户 ID
const userId = ref()
//用户搜索时选中的角色id
const roleId = ref(route.query.roleId)
//文章列表数据模型
const userRoles = ref([])
//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(10)//每页条数
//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
  pageSize.value = size
  UserRolesList()
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
  pageNum.value = num
  UserRolesList()
}
import {
  userRolesListService,
  userRolesDelete, userRolesAdd
} from "@/api/roles.js";

//文章分类数据模型
const users = ref([])
//回显文章分类列表选择
const usersList = async () => {
  let result = await allUserList();
  users.value = result.data;

}
usersList()

//获取文章分页列表数据
const UserRolesList = async () => {
  let params = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    userId: userId.value ? userId.value : null,
    roleId: roleId.value ? roleId.value : null
  }
  let result = await userRolesListService(params)
  userRoles.value = result.data.items;
  total.value = result.data.total;
  //确保调用回显用户列表的函数
  await allUserList();
  //循环用户列表，给每个用户对象添加一个roleName属性
  for (let i = 0; i < userRoles.value.length; i++) {
    let userRole = userRoles.value[i];
    for (let j = 0; j < users.value.length; j++) {
      if (String(userRole.userId) === String(users.value[j].id)) {
        userRole.userRoleName = users.value[j].username;
      }
    }
  }
}

UserRolesList()
import {ElMessage, ElMessageBox} from "element-plus";
import {allUserList} from "@/api/user.js";
//控制添加分类弹窗
const dialogVisible = ref(false)
//添加用户数据模型
const userRolesModel = ref({
  userId: '',
  roleId: ''
})
//添加用户表单校验
//定义变量，控制弹窗的标题
const title = ref('')
const addUserRoles = async () => {
  //如果表单数据为空，则弹出不能为空的ElMessage
  if (userRolesModel.value.userId === '' || userRolesModel.value.roleId === '') {
    ElMessage.warning('不能为空')
    return
  }
  //调用接口
  let result = await userRolesAdd(userRolesModel.value)
  ElMessage.success(result.data ? result.data : '添加成功');
  //调用获取所有文章分类的函数
  await UserRolesList();
  //弹窗消失
  dialogVisible.value = false
}
const clearData = () => {
  userRolesModel.value.roleId = roleId.value
  userRolesModel.value.userId = ''
  userRolesModel.value.userRoleId = ''
}
//删除用户
const deleteUsers = (row) => {
//提示用户，确认框
  ElMessageBox.confirm(
      '你确认要取消授权吗?',
      '温馨提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
  )
      .then(async () => {
        //调用接口
        await userRolesDelete(row.userRoleId)
        ElMessage({
          type: 'success',
          message: '删除成功'
        })
        //刷新列表
        await UserRolesList();
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '用户取消了删除'
        })
      })
}
</script>

<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>角色管理/授权用户</span>
        <div class="extra">
          <el-button type="primary" @click="dialogVisible = true,title='授权用户',clearData()">授权用户</el-button>
        </div>
      </div>
    </template>

    <!-- 搜索表单 -->
    <el-form inline>
      <el-form-item label="用户名称：" style="width: 300px">
        <el-select placeholder="请选择" v-model="userId">
          <el-option
              v-for="c in users"
              :key="c.id"
              :label="c.username"
              :value="c.id">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="UserRolesList">搜索</el-button>
        <el-button @click="userId='';">重置</el-button>
      </el-form-item>
    </el-form>
    <!-- 文章列表 -->
    <el-table :data="userRoles" style="width: 100%">
      <el-table-column label="编号" width="100" prop="userRoleId"></el-table-column>
      <el-table-column label="角色名称">{{route.query.roleName}}</el-table-column>
      <el-table-column label="用户名称" prop="userRoleName"></el-table-column>
      <el-table-column label="创建时间" prop="createTime"></el-table-column>
      <el-table-column label="修改时间" prop="updateTime"></el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button :icon="Edit" type="text" @click="deleteUsers(row)" style="color: rgba(244,70,70,0.74);">取消授权</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="没有数据"/>
      </template>
    </el-table>

    <!-- 分页条 -->
    <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :page-sizes="[3, 5 ,10, 15]"
                   layout="prev, pager, next" background :total="total"
                   @size-change="onSizeChange"
                   @current-change="onCurrentChange" style="margin-top: 20px; justify-content: flex-end"/>

    <!-- 添加分类弹窗 -->
    <!--prop 属性明确了表单数据对象中要绑定的字段,与rules进行校验-->
    <el-dialog v-model="dialogVisible" :title="title" width="30%">
      <el-form :model="userRolesModel" label-width="100px" style="padding-right: 30px">
        <el-form-item label="角色编号">
          <el-input v-model="userRolesModel.roleId" disabled></el-input>
        </el-form-item>
        <el-form-item label="用户名称">
          <el-select placeholder="请选择" v-model="userRolesModel.userId">
            <el-option v-for="c in users" :key="c.id" :label="c.username" :value="c.id">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="addUserRoles()">确认</el-button>
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
