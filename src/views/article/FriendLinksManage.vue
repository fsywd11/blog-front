<script setup lang="js">
import {
  Edit,
  Delete
} from '@element-plus/icons-vue'

import {ref} from 'vue'
const friendLinksName = ref('')
//用户搜索时选中的分类id
const passed = ref('')
//文章列表数据模型
const friendLinks = ref([])
//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(3)//每页条数
//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
  pageSize.value = size
  friendLinksList()
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
  pageNum.value = num
  friendLinksList()
}
//获取文章分页列表数据
const friendLinksList = async () => {
  let params = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    name: friendLinksName.value ? friendLinksName.value : null,
    passed:passed.value ? passed.value : null
  }
  let result = await getfriendLinksPage(params)
  friendLinks.value = result.data.items;
  total.value = result.data.total;
}
friendLinksList()
//控制添加分类弹窗
const dialogVisible = ref(false)
//添加用户数据模型
const friendLinksModel = ref({
  name: '',
  url: '',
  imageUrl: '',
  description: '',
  passed: false
})
//添加用户表单校验
const rules = {
  name: [
    {required: true, message: '请输入友链名称', trigger: 'blur'}
  ],
  url: [
    {required: true, message: '请输入网站URL', trigger: 'blur'}
  ],
  imageUrl: [
    {required: true, message: '请输入图标URL', trigger: 'blur'}
  ],
  description: [
    {required: true, message: '请输入网站描述', trigger: 'blur'}
  ]

}
import {ElMessage, ElMessageBox} from "element-plus";
import {
  deletefriendLinksService,
  FriendLinksAddService,
  getfriendLinksPage,
  updatefriendLinksService,
  updateFriendLinkStatus
} from "@/api/friendLinks.js";
//定义变量，控制弹窗的标题
const title = ref('')
const showDialog = (row) => {
  dialogVisible.value = true
  title.value = '修改友链'
  //数据拷贝
  friendLinksModel.value.name = row.name
  friendLinksModel.value.url = row.url
  friendLinksModel.value.imageUrl = row.imageUrl
  friendLinksModel.value.description = row.description
  friendLinksModel.value.id=row.id
}
const addfriendLinks = async ()=>{
  //如果表单数据为空，则弹出不能为空的ElMessage
  if(friendLinksModel.value.name===''|| friendLinksModel.value.url===''){
    ElMessage.warning('不能为空')
    return
  }
  //调用接口
  let result = await FriendLinksAddService(friendLinksModel.value)
  ElMessage.success(result.data? result.data :'申请成功');
  //调用获取所有文章分类的函数
  await friendLinksList();
  //弹窗消失
  dialogVisible.value = false
}
//编辑分类
const updatefriendLinks = async () => {
  let result = await updatefriendLinksService(friendLinksModel.value)
  ElMessage.success(result.data ? result.data : '修改成功');
  //调用获取所有文章分类的函数
  await friendLinksList();
  //弹窗消失,隐藏弹窗
  dialogVisible.value = false
}
//清空模型的数据z
const clearData = ()=>{
  friendLinksModel.value.name = ''
  friendLinksModel.value.url = ''
  friendLinksModel.value.imageUrl = ''
  friendLinksModel.value.description = ''
  friendLinksModel.value.id=''
}
//删除用户
const deletefriendLinks = (row) => {
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
        await deletefriendLinksService(row.id)
        ElMessage({
          type: 'success',
          message: '删除成功'
        })
        //刷新列表
        await friendLinksList();
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '用户取消了删除'
        })
      })
}

const handleStatusChange = async (rowData) => {
  try {
    // 调用接口提交更新（传递当前行ID和新的状态）
    await updateFriendLinkStatus({
      id: rowData.id,
      passed: rowData.passed
    });
    // 提示更新成功
    ElMessage.success('状态更新成功');
  } catch (error) {
    // 失败时回滚状态（避免界面与实际数据不一致）
    rowData.passed = !rowData.passed;
    ElMessage.error('状态更新失败，请重试');
  }
};
</script>


<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>友链管理</span>
        <div class="extra">
          <el-button type="primary" @click="dialogVisible = true,title='新增友链',clearData()">新增友链</el-button>
        </div>
      </div>
    </template>

    <!-- 搜索表单 -->
    <el-form inline>
      <el-form-item label="友链名称：" style="width: 300px">
        <el-input v-model="friendLinksName" placeholder="请输入友链名称">
        </el-input>
      </el-form-item>

      <el-form-item label="友链状态：" style="width: 300px">
        <el-select placeholder="请选择" v-model="passed">
          <el-option label="通过" value='true'></el-option>
          <el-option label="未通过" value='false'></el-option>
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="friendLinksList">搜索</el-button>
        <el-button @click="friendLinksName='';passed=''">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 文章列表 -->
    <el-table :data="friendLinks" style="width: 100%">
      <!-- 友链编号：内容短，固定窄宽度 -->
      <el-table-column label="友链编号" width="90" prop="id"></el-table-column>

      <!-- 友链封面：固定图片尺寸，宽度匹配图片显示 -->
      <el-table-column label="友链封面" width="160">
        <template #default="{row}">
          <img
              :src="row.imageUrl"
              alt="友链封面"
              :style="{
          width: '100px',
          height: '50px',
          objectFit: 'cover',
          borderRadius: '15%'
        }"
          >
        </template>
      </el-table-column>

      <!-- 友链名称：中等长度，适中宽度 -->
      <el-table-column label="友链名称" width="140" prop="name"></el-table-column>

      <!-- 友链地址：URL可能较长，预留稍宽空间 -->
      <el-table-column label="友链地址" width="220" prop="url"></el-table-column>

      <!-- 友链描述：内容可能较长，不固定宽度让其自适应剩余空间 -->
      <el-table-column label="友链描述" prop="description"></el-table-column>

      <!-- 申请状态：开关组件宽度固定 -->
      <el-table-column label="申请状态" width="120">
        <template #default="scope">
          <el-switch
              v-model="scope.row.passed"
              @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>

      <!-- 时间列：日期格式固定，统一宽度 -->
      <el-table-column label="申请时间" width="180" prop="createTime"></el-table-column>
      <el-table-column label="更新时间" width="180" prop="updateTime"></el-table-column>

      <!-- 操作列：图标按钮紧凑布局，节省空间 -->
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <div style="display: flex; justify-content: center;">
            <el-button
                :icon="Edit"
                circle
                plain
                type="primary"
                @click="showDialog(row)"
                title="编辑"
            ></el-button>编辑
            <el-button
                :icon="Delete"
                circle
                plain
                type="danger"
                @click="deletefriendLinks(row)"
                title="删除"
            ></el-button>删除
          </div>
        </template>
      </el-table-column>

      <!-- 空状态提示 -->
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
      <el-form :model="friendLinksModel" :rules="rules" label-width="100px" style="padding-right: 30px">
        <el-form-item label="网站名称" prop="name">
          <el-input v-model="friendLinksModel.name" minlength="1" maxlength="50"></el-input>
        </el-form-item>
        <el-form-item label="网站URL" prop="url">
          <el-input v-model="friendLinksModel.url" minlength="1" maxlength="100"></el-input>
        </el-form-item>
        <el-form-item label="图标URL" prop="imageUrl">
          <el-input v-model="friendLinksModel.imageUrl" minlength="1" maxlength="100"></el-input>
        </el-form-item>
        <el-form-item label="网站描述" prop="description">
          <textarea rows="3" v-model="friendLinksModel.description" style="width: 100%"></textarea>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="title==='新增友链'?addfriendLinks():updatefriendLinks()">确认</el-button>
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