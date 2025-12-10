<script setup>
import {
  Edit,
  Delete
} from '@element-plus/icons-vue'

import {ref} from 'vue'
const messagesId = ref('')
//用户搜索时选中的分类id
const username = ref('')
//文章列表数据模型
const messages = ref([])
//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(3)//每页条数
//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
  pageSize.value = size
  messagesList()
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
  pageNum.value = num
  messagesList()
}
//获取文章分页列表数据
const messagesList = async () => {
  let params = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    id: messagesId.value ? messagesId.value : null,
    username:username.value ? username.value : null
  }
  let result = await getMessagePage(params)
  messages.value = result.data.items;
  total.value = result.data.total;
}
messagesList()
//控制添加分类弹窗
const dialogVisible = ref(false)
//添加用户数据模型
const messagesModel = ref({
  username: '',
  content: '',
})
//添加用户表单校验
const rules = {
  username: [
    {required: true, message: '请输入留言用户', trigger: 'blur'}
  ],
  content: [
    {required: true, message: '请输入留言内容', trigger: 'blur'}
  ]
}
import {ElMessage, ElMessageBox} from "element-plus";
import {deleteMessagesService, getMessagePage, MessageAddService, updateMessagesService} from "@/api/message.js";
//定义变量，控制弹窗的标题
const title = ref('')
const showDialog = (row) => {
  dialogVisible.value = true
  title.value = '修改评论'
  //数据拷贝
  messagesModel.value.username = row.username
  messagesModel.value. content= row.content
  messagesModel.value.id=row.id
}
const addMessages = async ()=>{
  //如果表单数据为空，则弹出不能为空的ElMessage
  if(messagesModel.value.username===''|| messagesModel.value.content===''){
    ElMessage.warning('不能为空')
    return
  }
  //调用接口
  let result = await MessageAddService(messagesModel.value)
  ElMessage.success(result.data? result.data :'添加成功');
  //调用获取所有文章分类的函数
  await messagesList();
  //弹窗消失
  dialogVisible.value = false
}
//编辑分类
const updateMessages = async () => {
  let result = await updateMessagesService(messagesModel.value)
  ElMessage.success(result.data ? result.data : '修改成功');
  //调用获取所有文章分类的函数
  await messagesList();
  //弹窗消失,隐藏弹窗
  dialogVisible.value = false
}
//清空模型的数据z
const clearData = ()=>{
  messagesModel.value.creater = ''
  messagesModel.value.content = ''
  messagesModel.value.id=''
}
//删除用户
const deleteMessages = (row) => {
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
        await deleteMessagesService(row.id)
        ElMessage({
          type: 'success',
          message: '删除成功'
        })
        //刷新列表
        await messagesList();
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '用户取消了删除'
        })
      })
}

// 移除 HTML 标签的工具函数
const stripHtml = (row) => {
  if (!row.content) return '';
  return row.content.replace(/<[^>]+>/g, ''); // 匹配并移除所有 HTML 标签
};
</script>


<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>留言管理</span>
        <div class="extra">
          <el-button type="primary" @click="dialogVisible = true,title='新增留言',clearData()">新增留言</el-button>
        </div>
      </div>
    </template>

    <!-- 搜索表单 -->
    <el-form inline>
      <el-form-item label="留言编号：" style="width: 300px">
        <el-input v-model="messagesId" placeholder="请输入留言编号">
        </el-input>
      </el-form-item>

      <el-form-item label="留言用户：" style="width: 300px">
        <el-input v-model="username" placeholder="请输入用户名">
        </el-input>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="messagesList">搜索</el-button>
        <el-button @click="messagesId='';username=''">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 文章列表 -->
    <el-table :data="messages" style="width: 100%">
      <el-table-column label="留言编号" width="100" prop="id"></el-table-column>
      <el-table-column label="留言用户" prop="username"></el-table-column>
      <el-table-column label="留言内容" prop="content"  :formatter="stripHtml"></el-table-column>
      <el-table-column label="创建时间" prop="createTime"></el-table-column>
      <el-table-column label="更新时间" prop="updateTime"></el-table-column>
      <el-table-column label="操作" width="300">
        <template #default="{ row }">
          <el-button :icon="Edit" circle plain type="primary" @click="showDialog(row)"></el-button>编辑
          <el-button :icon="Delete" circle plain type="danger" @click="deleteMessages(row)"></el-button>删除
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
      <el-form :model="messagesModel" :rules="rules" label-width="100px" style="padding-right: 30px">
        <el-form-item label="留言用户" prop="creater">
          <el-input v-model="messagesModel.username" minlength="1" maxlength="50"></el-input>
        </el-form-item>
        <el-form-item label="留言内容" prop="content">
          <el-input v-model="messagesModel.content" minlength="1" maxlength="50"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="title==='新增留言'?addMessages():updateMessages()">确认</el-button>
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