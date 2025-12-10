<script setup>
import {Edit} from '@element-plus/icons-vue'
import {ref} from 'vue'
//文章分类数据模型
import {useRoute} from 'vue-router';
// 获取当前路由信息
const route = useRoute();
// 从查询参数中获取用户 ID
const permissionId = ref(route.query.permissionId)
const permissionIdDefault = ref(route.query.permissionId)
//用户搜索时选中的角色id
const roleId = ref()
//文章列表数据模型
const permissionRoles = ref([])
//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(3)//每页条数
//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
  pageSize.value = size
  PermissionRolesList()
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
  pageNum.value = num
  PermissionRolesList()
}
import {allRolesList} from "@/api/roles.js";

//文章分类数据模型
const roles = ref([])
//回显文章分类列表选择
const rolesList = async () => {
  let result = await allRolesList();
  roles.value = result.data;
}
rolesList()

const permissions= ref([])
const permissionList = async () => {
  let result = await allPermissionList()
  permissions.value = result.data;
}
permissionList()

//获取文章分页列表数据
const PermissionRolesList = async () => {
  let params = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    permissionId: permissionId.value ? permissionId.value : null,
    roleId: roleId.value ? roleId.value : null
  }
  let result = await permissionRolesListService(params)
  permissionRoles.value = result.data.items;
  total.value = result.data.total;
  await rolesList()
  await permissionList()
  //循环用户列表，给每个用户对象添加一个roleName属性
  for (let i = 0; i < permissionRoles.value.length; i++) {
    let permissionRole = permissionRoles.value[i];
    for (let j = 0; j < roles.value.length; j++) {
      if (String(permissionRole.roleId) === String(roles.value[j].roleId)) {
        permissionRole.permissionRoleName = roles.value[j].roleName;
      }
    }
    for (let j = 0; j < permissions.value.length; j++) {
      if (String(permissionRole.permissionId) === String(permissions.value[j].permissionId)) {
        permissionRole.permissionId = permissions.value[j].permissionId;
        permissionRole.permissionName = permissions.value[j].permissionName;
        permissionRole.permissionDescription = permissions.value[j].permissionDescription;
      }
    }
  }
}

PermissionRolesList()
import {ElMessage, ElMessageBox} from "element-plus";
import {
  allPermissionList,
  permissionRolesAdd,
  permissionRolesDelete,
  permissionRolesListService
} from "@/api/permission.js";
//控制添加分类弹窗
const dialogVisible = ref(false)
//添加用户数据模型
const permissionRolesModel = ref({
  permissionId: '',
  roleId: ''
})
//添加用户表单校验
//定义变量，控制弹窗的标题
const title = ref('')
const addPermissionRoles = async () => {
  //如果表单数据为空，则弹出不能为空的ElMessage
  if (permissionRolesModel.value.permissionId === '' || permissionRolesModel.value.roleId === '') {
    ElMessage.warning('不能为空')
    return
  }
  //调用接口
  let result = await permissionRolesAdd(permissionRolesModel.value)
  ElMessage.success(result.data ? result.data : '添加成功');
  //调用获取所有文章分类的函数
  await PermissionRolesList();
  //弹窗消失
  dialogVisible.value = false
}
const clearData = () => {
  permissionRolesModel.value.permissionId = permissionIdDefault.value
  permissionRolesModel.value.roleId = ''
  permissionRolesModel.value.userRoleId = ''
}
//删除用户
const deleteRoles = (row) => {
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
        await permissionRolesDelete(row.permissionRoleId)
        ElMessage({
          type: 'success',
          message: '删除成功'
        })
        //刷新列表
        await PermissionRolesList();
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
        <span>权限管理/授权角色</span>
        <div class="extra">
          <el-button type="primary" @click="dialogVisible = true,title='授权角色',clearData()">授权角色</el-button>
        </div>
      </div>
    </template>

    <!-- 搜索表单 -->
    <el-form inline>
      <el-form-item label="权限编号">
        <el-input v-model="permissionId"></el-input>
      </el-form-item>
      <el-form-item label="角色名称：" style="width: 300px">
        <el-select placeholder="请选择" v-model="roleId">
          <el-option
              v-for="c in roles"
              :key="c.roleId"
              :label="c.roleName"
              :value="c.roleId">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="PermissionRolesList">搜索</el-button>
        <el-button @click="permissionId='';roleId='';">重置</el-button>
      </el-form-item>
    </el-form>
    <!-- 文章列表 -->
    <el-table :data="permissionRoles" style="width: 100%">
      <el-table-column label="编号" width="100" prop="permissionRoleId"></el-table-column>
      <el-table-column label="权限编号" prop="permissionId"></el-table-column>
      <el-table-column label="权限名称" prop="permissionName"></el-table-column>
      <el-table-column label="权限说明" prop="permissionDescription"></el-table-column>
      <el-table-column label="角色名称" prop="permissionRoleName"></el-table-column>
      <el-table-column label="创建时间" prop="createTime"></el-table-column>
      <el-table-column label="修改时间" prop="updateTime"></el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button :icon="Edit" type="text" @click="deleteRoles(row)" style="color: rgba(244,70,70,0.74);">取消授权</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="没有数据"/>
      </template>
    </el-table>

    <!-- 分页条 -->
    <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :page-sizes="[3, 5 ,10, 15]"
                   layout="jumper, total, sizes,prev, pager, next" background :total="total"
                   @size-change="onSizeChange"
                   @current-change="onCurrentChange" style="margin-top: 20px; justify-content: flex-end"/>

    <!-- 添加分类弹窗 -->
    <!--prop 属性明确了表单数据对象中要绑定的字段,与rules进行校验-->
    <el-dialog v-model="dialogVisible" :title="title" width="30%">
      <el-form :model="permissionRolesModel" label-width="100px" style="padding-right: 30px">
        <el-form-item label="权限编号">
          <el-input v-model="permissionRolesModel.permissionId"></el-input>
        </el-form-item>
        <el-form-item label="角色名称">
          <el-select placeholder="请选择" v-model="permissionRolesModel.roleId">
            <el-option v-for="c in roles" :key="c.roleId" :label="c.roleName" :value="c.roleId">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="addPermissionRoles()">确认</el-button>
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
