<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import QuillEditor from '@/components/QuillEditor.vue'
import { articleCateListService, articleUpdateService } from '@/api/article.js'
import { useTokenStore } from '@/stores/token.js'

const router = useRouter()
const route = useRoute()
const tokenStore = useTokenStore()

// 文章分类数据
const categorys = ref([])
// 封面文件名（用于显示）
const coverFileName = ref('')

// 文章表单数据模型（保留原有功能，新增publicState字段匹配样式）
const articleModel = ref({
  id: '', // 编辑时的ID
  title: '',
  categoryId: '', // 统一为字符串类型，适配下拉选择的value
  coverImg: '',
  content: '',
  state: '',
  publicState: '公开' // 新增状态字段匹配样式
})

// 页面标题（添加/编辑）
const title = ref('添加文章')

// 获取文章分类列表
const getCategoryList = async () => {
  try {
    const result = await articleCateListService()
    categorys.value = result.data || []
  } catch (error) {
    ElMessage.error('获取文章分类失败')
  }
}

// 上传封面回调（修改为显示文件名+提示）
const uploadSuccess = (response) => {
  articleModel.value.coverImg = response.data
  coverFileName.value = response.data.split('/').pop() // 提取文件名
  ElMessage.success('封面上传成功')
}
const uploadError = () => {
  ElMessage.error('封面上传失败，请重试')
}
import { useArticleStore } from '@/stores/articleStore'
const articleStore = useArticleStore()
// 提交文章（添加/编辑）
const submitArticle = async (stateType) => {
  // 表单验证（保留原有验证逻辑，移除多余的tags验证）
  if (!articleModel.value.title || !articleModel.value.categoryId || !articleModel.value.coverImg || !articleModel.value.content) {
    ElMessage.warning('请完善所有必填字段')
    return
  }

  // 设置发布状态
  articleModel.value.state = stateType

  try {
    if (articleModel.value.id) {
      // 编辑文章
      await articleUpdateService(articleModel.value)
      await articleStore.fetchArticleList()
      ElMessage.success('文章编辑成功')
    }
    // 返回文章列表页（统一路径）
    await router.push('/article/manage')
  } catch (error) {
    ElMessage.error(articleModel.value.id ? '编辑失败' : '添加失败')
  }
}

// 初始化编辑数据（保留原有核心逻辑）
const initEditData = () => {
  // 1. 从sessionStorage获取编辑数据（JSON字符串）
  const articleStr = sessionStorage.getItem('editArticle')
  // 调试日志，确认读取的数据
  console.log('编辑页读取的sessionStorage数据：', articleStr)

  if (!articleStr) {
    // 没有编辑数据，重置为添加文章状态
    title.value = '添加文章'
    // 清空表单数据
    articleModel.value = {
      id: '',
      title: '',
      categoryId: '',
      coverImg: '',
      content: '',
      state: '',
      publicState: '公开' // 重置状态
    }
    coverFileName.value = '' // 清空文件名
    return
  }

  try {
    // 2. 解析JSON字符串为对象（处理解析失败的情况）
    const articleData = JSON.parse(articleStr)
    if (!articleData.id) {
      // 无ID则不是编辑状态
      title.value = '添加文章'
      articleModel.value = {
        id: '',
        title: '',
        categoryId: '',
        coverImg: '',
        content: '',
        state: '',
        publicState: '公开'
      }
      coverFileName.value = ''
      return
    }

    title.value = '编辑文章'
    // 3. 赋值前先清空原有数据，避免残留
    articleModel.value = {
      id: '',
      title: '',
      categoryId: '',
      coverImg: '',
      content: '',
      state: '',
      publicState: articleData.publicState || '公开' // 读取编辑数据的状态
    }
    // 4. 赋值编辑数据，统一类型为字符串（适配下拉选择的value）
    articleModel.value = {
      id: articleData.id + '', // 转为字符串，避免类型问题
      title: articleData.title || '',
      categoryId: articleData.categoryId ? articleData.categoryId + '' : '', // 优化：处理null/undefined
      coverImg: articleData.coverImg || '',
      content: articleData.content || '',
      state: articleData.state || '',
      publicState: articleData.publicState || '公开'
    }
    // 初始化封面文件名
    if (articleModel.value.coverImg) {
      coverFileName.value = articleModel.value.coverImg.split('/').pop()
    } else {
      coverFileName.value = ''
    }
  } catch (error) {
    ElMessage.warning('编辑数据解析失败，请重新选择')
    console.error('文章数据解析错误：', error)
    // 移除无效的存储数据
    sessionStorage.removeItem('editArticle')
    // 重置为添加文章状态
    title.value = '添加文章'
    articleModel.value = {
      id: '',
      title: '',
      categoryId: '',
      coverImg: '',
      content: '',
      state: '',
      publicState: '公开'
    }
    coverFileName.value = ''
  }
}

// 监听路由变化，每次进入页面都重新初始化数据
watch(
    () => route.fullPath, // 监听完整路由路径，确保每次跳转都触发
    () => {
      initEditData() // 重新初始化数据
    },
    { immediate: true } // 立即执行一次
)

// 页面挂载时获取分类列表
onMounted(() => {
  getCategoryList()
})

// 组件卸载时清除sessionStorage中的编辑数据（避免残留）
onUnmounted(() => {
  sessionStorage.removeItem('editArticle')
})


import { useTagsViewStore } from '@/stores/tagsView.js'

// 新增store实例
const tagsViewStore = useTagsViewStore()

const handleClose = (path) => {  // 只接收路径参数
  // 找到当前标签的索引
  const index = tagsViewStore.tagsList.findIndex(tag => tag.path === path)
  if (index === -1) return

  // 新增：如果只有一个标签，不允许关闭
  if (tagsViewStore.tagsList.length <= 1) {
    ElMessage.warning('这是最后一个标签页，不能关闭！')
    return
  }
  // 如果关闭的是当前激活的标签，需要跳转
  // 错误点：将 route.path 改为 router.currentRoute.value.path
  if (path === router.currentRoute.value.path) {
    // 跳转到上一个标签
    const prevTag = tagsViewStore.tagsList[index - 1]
    if (prevTag) {
      router.push(prevTag.path)
    } else {
      // 如果是第一个标签，跳转到下一个标签
      const nextTag = tagsViewStore.tagsList[index + 1]
      if (nextTag) {
        router.push(nextTag.path)
      }
    }
  }
  //清空图片
  coverFileName.value = ''
  articleModel.value.coverImg = ''
  tagsViewStore.delTagsItem(index)
}
</script>

<template>
  <div class="article-form-container">
    <!-- 面包屑导航：匹配目标样式 -->
    <div class="breadcrumbs">
      文章管理 / {{ title === '添加文章' ? '发布文章' : '编辑文章' }}
    </div>

    <el-card class="page-container">
      <el-form :model="articleModel" class="article-form" inline label-width="60px">
        <!-- 第一行表单：标题、分类、状态、封面、按钮（匹配目标样式） -->
        <el-form-item label="标题">
          <el-input v-model="articleModel.title" placeholder="输入文章标题" style="width: 180px" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="articleModel.categoryId" placeholder="选择分类" style="width: 120px">
            <el-option
                v-for="c in categorys"
                :key="c.id"
                :label="c.categoryName"
                :value="c.id + ''"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="articleModel.publicState" style="width: 100px">
            <el-option label="公开" value="公开" />
            <el-option label="私密" value="私密" />
          </el-select>
        </el-form-item>

        <el-form-item label="封面">
          <el-upload
              class="upload-btn"
              :auto-upload="true"
              :show-file-list="false"
              action="http://localhost:8080/upload"
              name="file"
              :headers="{ Authorization: tokenStore.token }"
              :on-success="uploadSuccess"
              :on-error="uploadError"
          >
            <el-button type="primary" plain>上传封面</el-button>
          </el-upload>
          <!-- 显示上传的文件名 -->
          <span  class="file-name" v-if="coverFileName">{{ coverFileName }}</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitArticle('已发布'),handleClose(router.currentRoute.value.path)">发布</el-button>
          <el-button type="info" @click="submitArticle('草稿'),handleClose(router.currentRoute.value.path)">草稿</el-button>
          <el-button type="warning" @click="handleClose(router.currentRoute.value.path)">关闭</el-button>
        </el-form-item>
      </el-form>

      <!-- 富文本编辑器：匹配目标样式的双栏样式 -->
      <div class="editor-container">
        <QuillEditor v-model="articleModel.content" :height="400" />
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.article-form-container {
  padding: 10px 20px;
  min-height: 100vh;
  box-sizing: border-box;

  .breadcrumbs {
    font-size: 14px;
    color: #666;
    margin-bottom: 10px;
  }
}

.page-container {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.article-form {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;

  .upload-btn {
    margin-right: 8px;
  }

  .file-name {
    font-size: 14px;
    color: #666;
  }
}

.editor-container {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;

  :deep(.ql-container) {
    min-height: 400px;
    border-right: 1px solid #ebeef5;
  }
}
</style>