<script setup>
import { ref, onMounted, onUnmounted} from 'vue'
import { onBeforeRouteUpdate } from 'vue-router'
import { useRouter} from 'vue-router' // 新增：引入useRoute
import { Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { articleCateListService, articleListService, articleDeleteService } from '@/api/article.js'

const router = useRouter()
// 文章分类数据模型
const categorys = ref([])

// 用户搜索时选中的分类id
const categoryId = ref('')

// 用户搜索时选中的发布状态
const state = ref('')

// 文章列表数据模型
const articles = ref([])

// 分页条数据模型
const pageNum = ref(1) // 当前页
const total = ref(20) // 总条数
const pageSize = ref(3) // 每页条数

// 选中的文章ID数组，用于批量删除
const selectedArticleIds = ref([])

// 当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
  pageSize.value = size
  ArticleList()
}

// 当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
  pageNum.value = num
  ArticleList()
}

// 回显文章分类列表选择
const articleCategoryList = async () => {
  let result = await articleCateListService()
  categorys.value = result.data
}

// 【核心封装】文章列表刷新方法（便于复用）
const refreshArticleList = async () => {
  await ArticleList()
}

// 获取文章分页列表数据
const ArticleList = async () => {
  let params = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    categoryId: categoryId.value ? categoryId.value : null,
    state: state.value ? state.value : null
  }
  let result = await articleListService(params)
  // 获取文章分页列表数据
  articles.value = result.data.items
  total.value = result.data.total

  // 处理数据,给数据模型扩展一个新的属性categoryName,分类名称，转换id
  for (let i = 0; i < articles.value.length; i++) {
    let article = articles.value[i]
    for (let j = 0; j < categorys.value.length; j++) {
      if (article.categoryId === categorys.value[j].id) {
        article.categoryName = categorys.value[j].categoryName
      }
    }
  }
}

// 删除文章
const articleDelete = (row) => {
  // 提示用户，确认框
  ElMessageBox.confirm('你确认要删除该文章信息吗?', '温馨提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  })
      .then(async () => {
        // 调用接口
        await articleDeleteService(row.id)
        ElMessage({
          type: 'success',
          message: '删除成功'
        })
        // 刷新列表
        await refreshArticleList() // 改用封装的刷新方法
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
          await refreshArticleList() // 改用封装的刷新方法
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

// 跳转到编辑文章页面
const toEditArticle = (row) => {
  sessionStorage.setItem('editArticle', JSON.stringify(row))
  // 传递文章数据作为路由参数（注意：复杂数据建议用sessionStorage或Pinia，这里简单处理）
  router.push({
    path: '/article/edit',
  })
}

// 处理文章状态变化
const handleStateChange = async (rowData) => {
  try {
    // 调用接口提交更新（传递当前行ID和新的状态）
    await import('@/api/article.js').then(mod => mod.articleUpdateService(rowData))
    await refreshArticleList() // 改用封装的刷新方法
    ElMessage.success('状态更新成功')
  } catch (error) {
    // 失败时回滚状态（避免界面与实际数据不一致）
    rowData.state = rowData.state === '已发布' ? '草稿' : '已发布'
    ElMessage.error('状态更新失败，请重试')
  }
}

// 窗口大小处理（原抽屉的逻辑，已移除抽屉，可保留或删除）
const drawerSize = ref('50%')
const handleResize = () => {
  drawerSize.value = window.innerWidth < 768 ? '100%' : '50%'
}

// 【新增】路由守卫：当路由更新（从表单页返回）时刷新列表
onBeforeRouteUpdate(async (to, from) => {
  // 判断是否从文章编辑/添加页返回（根据实际路由路径调整）
  if (from.path === '/article/edit' || from.path === '/article/form') {
    await refreshArticleList()
  }
})

onMounted(() => {
  articleCategoryList()
  refreshArticleList() // 改用封装的刷新方法
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>文章管理</span>
      </div>
    </template>

    <!-- 搜索表单和操作按钮区域 -->
    <div class="operation-area">
      <el-form inline>
        <el-form-item label="文章分类：" style="width: 300px">
          <el-select placeholder="请选择" v-model="categoryId">
            <el-option v-for="c in categorys" :key="c.id" :label="c.categoryName" :value="c.id"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="发布状态：" style="width: 300px">
          <el-select placeholder="请选择" v-model="state">
            <el-option label="公开" value="已发布"></el-option>
            <el-option label="私密" value="草稿"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="refreshArticleList">搜索</el-button> <!-- 改用封装的刷新方法 -->
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
    <el-table :data="articles" style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column label="编号" width="80" prop="id"></el-table-column>
      <el-table-column label="文章封面" width="200">
        <template #default="{ row }">
          <img :src="row.coverImg" alt="文章封面" style="width: 100px; height: auto; objectFit: cover; borderRadius: 15%" />
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
          <el-button :icon="Edit" circle plain type="primary" @click="toEditArticle(row)"></el-button>编辑
          <el-button :icon="Delete" circle plain type="danger" @click="articleDelete(row)"></el-button>删除
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="没有数据" />
      </template>
    </el-table>

    <!-- 分页条 -->
    <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :page-sizes="[3, 5, 10, 15]"
        layout="jumper, total, sizes, prev, pager, next"
        background
        :total="total"
        @size-change="onSizeChange"
        @current-change="onCurrentChange"
        style="margin-top: 20px; justify-content: flex-end"
    />
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
:deep(el-table) {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}
</style>