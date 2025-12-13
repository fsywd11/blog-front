<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { articleDeleteService } from '@/api/article.js'
import { articleUpdateService } from "@/api/article.js";
import { useArticleStore } from '@/stores/articleStore'

// 初始化路由和Store
const router = useRouter()
const route = useRoute()
const articleStore = useArticleStore()

// 窗口大小相关（原抽屉逻辑，可保留或删除）
const drawerSize = ref('50%')

// 每页条数变化
const onSizeChange = (size) => {
  articleStore.updatePageSize(size)
  articleStore.fetchArticleList()
}

// 当前页码变化
const onCurrentChange = (num) => {
  articleStore.updatePageNum(num)
  articleStore.fetchArticleList()
}

// 删除单篇文章
const articleDelete = (row) => {
  ElMessageBox.confirm('你确认要删除该文章信息吗?', '温馨提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  })
      .then(async () => {
        await articleDeleteService(row.id)
        ElMessage({
          type: 'success',
          message: '删除成功'
        })
        await articleStore.fetchArticleList()
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
  if (articleStore.selectedArticleIds.length === 0) {
    ElMessage.warning('请先选择要删除的文章')
    return
  }

  ElMessageBox.confirm(
      `确认要删除选中的 ${articleStore.selectedArticleIds.length} 篇文章吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'danger'
      }
  )
      .then(async () => {
        try {
          // 建议后端提供批量删除接口，替换循环调用
          for (const id of articleStore.selectedArticleIds) {
            await articleDeleteService(id)
          }

          ElMessage.success('批量删除成功')
          articleStore.setSelectedArticleIds([]) // 清空选中
          await articleStore.fetchArticleList()
        } catch (error) {
          ElMessage.error('批量删除失败，请重试')
        }
      })
      .catch(() => {
        ElMessage.info('已取消批量删除操作')
      })
}

// 处理表格选择变化
const handleSelectionChange = (selection) => {
  articleStore.setSelectedArticleIds(selection.map(row => row.id))
}

// 跳转到编辑文章页面
const toEditArticle = (row) => {
  // 存储编辑数据（复杂数据推荐用sessionStorage，也可通过路由query传id）
  sessionStorage.setItem('editArticle', JSON.stringify(row))
  router.push({
    path: '/article/edit',
    query: { id: row.id }
  })
}

// 处理文章状态切换
const handleStateChange = async (rowData) => {
  try {
    await articleUpdateService(rowData)
    await articleStore.fetchArticleList()
    ElMessage.success('状态更新成功')
  } catch (error) {
    // 状态回滚，避免界面与实际数据不一致
    rowData.state = rowData.state === '已发布' ? '草稿' : '已发布'
    ElMessage.error('状态更新失败，请重试')
  }
}

// 窗口大小调整处理
const handleResize = () => {
  drawerSize.value = window.innerWidth < 768 ? '100%' : '50%'
}

// 监听路由变化：从编辑/添加页返回时刷新列表
watch(
    () => route.fullPath,
    async (_newPath, oldPath) => {
      if (oldPath === '/article/edit' || oldPath === '/article/add') {
        await articleStore.fetchArticleList()
      }
    },
    { immediate: false }
)

// 生命周期钩子
onMounted(() => {
  // 初始化分类和文章列表
  articleStore.fetchArticleCategoryList()
  articleStore.fetchArticleList()
  // 窗口大小监听
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
          <el-select
              placeholder="请选择"
              v-model="articleStore.categoryId"
              @change="articleStore.fetchArticleList"
          >
            <el-option
                v-for="c in articleStore.categorys"
                :key="c.id"
                :label="c.categoryName"
                :value="c.id"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="发布状态：" style="width: 300px">
          <el-select
              placeholder="请选择"
              v-model="articleStore.state"
              @change="articleStore.fetchArticleList"
          >
            <el-option label="公开" value="已发布"></el-option>
            <el-option label="私密" value="草稿"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="articleStore.fetchArticleList">搜索</el-button>
          <el-button @click="articleStore.resetSearchCondition">重置</el-button>
          <el-button
              type="danger"
              :icon="Delete"
              @click="batchDeleteArticles"
              :disabled="articleStore.selectedArticleIds.length === 0"
              class="mr-2"
          >
            批量删除 ({{ articleStore.selectedArticleIds.length }})
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 文章列表 -->
    <el-table
        :data="articleStore.articles"
        style="width: 100%"
        @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column label="编号" width="80" prop="id"></el-table-column>
      <el-table-column label="文章封面" width="200">
        <template #default="{ row }">
          <img
              :src="row.coverImg"
              alt="文章封面"
              style="width: 100px; height: auto; object-fit: cover; border-radius: 15%"
          />
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
          <el-button
              :icon="Edit"
              circle
              plain
              type="primary"
              @click="toEditArticle(row)"
          ></el-button>
          <span>编辑</span>
          <el-button
              :icon="Delete"
              circle
              plain
              type="danger"
              @click="articleDelete(row)"
              class="ml-2"
          ></el-button>
          <span>删除</span>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="没有数据" />
      </template>
    </el-table>

    <!-- 分页条 -->
    <el-pagination
        v-model:current-page="articleStore.pageNum"
        v-model:page-size="articleStore.pageSize"
        :page-sizes="[3, 5, 10, 15]"
        layout="jumper, total, sizes, prev, pager, next"
        background
        :total="articleStore.total"
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

/* 左外边距样式 */
.ml-2 {
  margin-left: 8px;
}

/* 表格样式优化 */
:deep(el-table) {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}
</style>