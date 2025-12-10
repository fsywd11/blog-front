<script setup>
import {
  Edit,
  Delete, Plus
} from '@element-plus/icons-vue'

import { ref } from 'vue'

// 引入封装后的富文本编辑器组件
import QuillEditor from '@/components/QuillEditor.vue'

//文章分类数据模型
const categorys = ref([])

//用户搜索时选中的分类id
const categoryId = ref('')

//用户搜索时选中的发布状态
const state = ref('')

//文章列表数据模型
const articles = ref([])

//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(3)//每页条数

//选中的文章ID数组，用于批量删除
const selectedArticleIds = ref([])

//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
  pageSize.value = size
  ArticleList()
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
  pageNum.value = num
  ArticleList()
}

import {articleCateListService, articleListService,articleAddService} from '@/api/article.js'

//回显文章分类列表选择
const articleCategoryList = async () => {
  let result = await articleCateListService();
  categorys.value = result.data;
}
articleCategoryList()

//获取文章分页列表数据
const ArticleList = async () => {
  let params = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    categoryId: categoryId.value ? categoryId.value : null,
    state: state.value ? state.value : null
  }
  let result = await articleListService(params)
  //获取文章分页列表数据
  articles.value = result.data.items;

  total.value = result.data.total;
  //处理数据,给数据模型扩展一个新的属性categoryName,分类名称，转换id
  for (let i = 0; i < articles.value.length; i++) {
    let article = articles.value[i];
    for (let j = 0; j < categorys.value.length; j++) {
      if (article.categoryId === categorys.value[j].id) {
        article.categoryName = categorys.value[j].categoryName;
      }
    }
  }
}

ArticleList()

//控制抽屉是否显示
const visibleDrawer = ref(false)

//添加表单数据模型
const articleModel = ref({
  title: '',
  categoryId: '',
  coverImg: '',
  content: '',
  state: ''
})

import {useTokenStore} from '@/stores/token.js'
import {ElMessage, ElMessageBox} from "element-plus";
const tokenStore = useTokenStore()

//上传成功地回调函数，得到图片的地址
const uploadSuccess = (result) => {
  articleModel.value.coverImg = result.data;
  console.log(result.data);
}

//添加文章
const addArticle = async (clickStart) => {
  // 如果表单数据为空，则弹出不能为空的ElMessage
  if (articleModel.value.title === '' || articleModel.value.categoryId === '' || articleModel.value.coverImg === '' || articleModel.value.content === '') {
    ElMessage.warning('不能为空')
    return
  }

  // 把发布状态赋值给数据模型
  articleModel.value.state = clickStart
  // 调用接口
  let result = await articleAddService(articleModel.value)
  ElMessage.success(result.data ? result.data : '添加成功')
  // 关闭抽屉
  visibleDrawer.value = false
  // 刷新当前列表
  await ArticleList()
}

// 删除文章
import {articleDeleteService,articleUpdateService} from '@/api/article.js'
const articleDelete =  (row) => {
  // 提示用户，确认框
  ElMessageBox.confirm(
      '你确认要删除该文章信息吗?',
      '温馨提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
  )
      .then(async () => {
        // 调用接口
        await articleDeleteService(row.id)
        ElMessage({
          type:'success',
          message: '删除成功'
        })
        // 刷新列表
        await ArticleList();
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '用户取消了删除'
        })
      })
}

// 批量删除文章
const batchDeleteArticles = async () => {
  if (selectedArticleIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的文章')
    return
  }

  ElMessageBox.confirm(
      `确认要删除选中的 ${selectedArticleIds.value.length} 篇文章吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'danger'
      }
  )
      .then(async () => {
        try {
          // 循环删除每个选中的文章
          for (const id of selectedArticleIds.value) {
            await articleDeleteService(id)
          }

          ElMessage.success('批量删除成功')
          // 清空选中状态
          selectedArticleIds.value = []
          // 刷新列表
          await ArticleList()
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
  selectedArticleIds.value = selection.map(row => row.id)
}

// 定义变量，控制抽屉的标题
const title = ref('')

const showDialog = (row)=>{
  // 抽屉的显示
  visibleDrawer.value = true
  title.value = '编辑分类'
  // 数据拷贝
  articleModel.value.title = row.title
  articleModel.value.categoryId = row.categoryId
  articleModel.value.coverImg = row.coverImg
  articleModel.value.content = row.content
  // 扩展id属性，将来需要传递给后台，完成分类的修改
  articleModel.value.id = row.id
}

// 更新文章
const updateArticle = async (clickStart)=>{
  // 把发布状态赋值给数据模型
  articleModel.value.state = clickStart
  let result = await articleUpdateService(articleModel.value)
  ElMessage.success(result.data? result.data :'修改成功');
  // 关闭抽屉
  visibleDrawer.value = false
  // 刷新当前列表
  await ArticleList()
}

// 处理文章状态变化
const handleStateChange = async (rowData) => {
  try {
    // 调用接口提交更新（传递当前行ID和新的状态）
    await articleUpdateService(rowData);

    await ArticleList(); // 重新拉取列表，同步最新状态
    // 提示更新成功
    ElMessage.success('状态更新成功');
  } catch (error) {
    // 失败时回滚状态（避免界面与实际数据不一致）
    rowData.state = rowData.state === '已发布' ? '草稿' : '已发布';
    ElMessage.error('状态更新失败，请重试');
  }
};

// 清空模型的数据
const clearData = ()=>{
  articleModel.value.title = ''
  articleModel.value.categoryId = ''
  articleModel.value.coverImg = ''
  articleModel.value.content = ' '
  // 扩展id属性，将来需要传递给后台，完成分类的修改
  articleModel.value.id = ''
}
</script>

<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>文章管理</span>
        <div class="extra">
          <el-button type="primary" @click="visibleDrawer = true,title='添加文章',clearData()">添加文章</el-button>
        </div>
      </div>
    </template>
    <!-- 搜索表单和操作按钮区域 -->
    <div class="operation-area">
      <el-form inline>
        <el-form-item label="文章分类：" style="width: 300px">
          <el-select placeholder="请选择" v-model="categoryId">
            <el-option
                v-for="c in categorys"
                :key="c.id"
                :label="c.categoryName"
                :value="c.id">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="发布状态：" style="width: 300px">
          <el-select placeholder="请选择" v-model="state">
            <el-option label="已发布" value="已发布"></el-option>
            <el-option label="草稿" value="草稿"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="ArticleList">搜索</el-button>
          <el-button @click="categoryId='';state=''">重置</el-button>
          <el-button
              type="danger"
              :icon="Delete"
              @click="batchDeleteArticles"
              :disabled="selectedArticleIds.length === 0"
              class="mr-2"
          >
            批量删除 ({{ selectedArticleIds.length }})
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    <!-- 文章列表 -->
    <el-table
        :data="articles"
        style="width: 100%"
        @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column label="编号" width="80" prop="id"></el-table-column>
      <el-table-column label="文章封面" width="200">
        <!-- 使用 v-slot 来获取当前行的数据 -->
        <template #default="{row}">
          <!-- 绑定头像的 URL 到 src 属性 -->
          <img :src="row.coverImg" alt="文章封面"
               :style="{width: '100px', height: 'auto', objectFit: 'cover', borderRadius: '15%'}">
        </template>
      </el-table-column>
      <el-table-column label="文章标题" width="300" prop="title"></el-table-column>
      <el-table-column label="分类" prop="categoryName"></el-table-column>
      <el-table-column label="发表时间" prop="createTime"></el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="scope">
          <el-switch
              v-model="scope.row.state"
              active-value="已发布"
              inactive-value="草稿"
              @change="handleStateChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button :icon="Edit" circle plain type="primary" @click="showDialog(row)"></el-button>编辑
          <el-button :icon="Delete" circle plain type="danger" @click="articleDelete(row)"></el-button>删除
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
    <!-- 抽屉 -->
    <el-drawer v-model="visibleDrawer" :title="title" direction="rtl" size="50%">
      <!-- 添加文章表单 -->
      <el-form :model="articleModel" label-width="100px">
        <el-form-item label="文章标题">
          <el-input v-model="articleModel.title" placeholder="请输入标题"></el-input>
        </el-form-item>
        <el-form-item label="文章分类">
          <el-select placeholder="请选择" v-model="articleModel.categoryId">
            <el-option v-for="c in categorys" :key="c.id" :label="c.categoryName" :value="c.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="文章封面">
          <el-upload class="avatar-uploader" :auto-upload="true" :show-file-list="false"
                     action="http://localhost:8080/upload"
                     name="file"
                     :headers="{
                              Authorization: tokenStore.token
                            }"
                     :on-success="uploadSuccess"
          >
            <img v-if="articleModel.coverImg" :src="articleModel.coverImg" class="avatar" alt="图片加载中"/>
            <el-icon v-else class="avatar-uploader-icon">
              <Plus/>
            </el-icon>
          </el-upload>
        </el-form-item>
        <!-- 调用封装后的富文本编辑器组件 -->
        <el-form-item label="文章内容">
          <QuillEditor
              v-model="articleModel.content"
              :height="340"/>
          <!-- 可选：传递自定义配置 -->
          <!-- :custom-options="{ modules: { toolbar: [...] } }" -->

        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="title==='添加文章'? addArticle('已发布') : updateArticle('已发布')">发布</el-button>
          <el-button type="info" @click="title==='添加文章'? addArticle('草稿') : updateArticle('草稿')">草稿</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
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
</style>