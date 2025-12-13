<script setup>
import { ref, onMounted} from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import QuillEditor from '@/components/QuillEditor.vue'
import { articleCateListService, articleAddService, articleUpdateService } from '@/api/article.js'
import { useTokenStore } from '@/stores/token.js'

const router = useRouter()
const tokenStore = useTokenStore()

// 文章分类数据
const categorys = ref([])
// 封面文件名（用于显示）
const coverFileName = ref('')

// 文章表单数据模型（新增图片中需要的字段）
const articleModel = ref({
  id: '',
  title: '',
  categoryId: '',
  coverImg: '',
  content: '',
  state: '',
})

// 获取文章分类列表
const getCategoryList = async () => {
  try {
    const result = await articleCateListService()
    categorys.value = result.data
  } catch (error) {
    ElMessage.error('获取分类失败')
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

// 提交文章
const submitArticle = async (stateType) => {
  // 表单验证（新增标签字段验证）
  if (!articleModel.value.title || !articleModel.value.categoryId || !articleModel.value.coverImg || !articleModel.value.content || !articleModel.value.tags) {
    ElMessage.warning('请完善所有必填字段')
    return
  }

  articleModel.value.state = stateType
  try {
    if (articleModel.value.id) {
      await articleUpdateService(articleModel.value)
      ElMessage.success('文章编辑成功')
    } else {
      await articleAddService(articleModel.value)
      await articleStore.fetchArticleList()
      ElMessage.success('文章发布成功')
    }
    await router.push('/article/manage')
  } catch (error) {
    ElMessage.error(articleModel.value.id ? '编辑失败' : '发布失败')
  }
}

// 页面挂载
onMounted(() => {
  getCategoryList()
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
    <!-- 面包屑导航：匹配图片头部 -->
    <div class="breadcrumbs">
      文章管理 / 发布文章
    </div>

    <el-card class="page-container">
      <el-form :model="articleModel" class="article-form" inline label-width="60px">
        <!-- 第一行表单：标题、分类、标签、类型、状态 -->
        <el-form-item label="标题">
          <el-input v-model="articleModel.title" placeholder="输入文章标题" style="width: 180px" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="articleModel.categoryId" placeholder="选择分类" style="width: 120px">
            <el-option v-for="c in categorys" :key="c.id" :label="c.categoryName" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="articleModel.state" style="width: 100px">
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
          <span class="file-name" v-if="coverFileName">{{ coverFileName }}</span>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitArticle('已发布'),handleClose(router.currentRoute.value.path)">发布</el-button>
          <el-button type="warning" @click="handleClose(router.currentRoute.value.path)">关闭</el-button>
        </el-form-item>
      </el-form>

      <!-- 富文本编辑器：匹配图片的双栏样式 -->
      <div class="editor-container">
        <QuillEditor v-model="articleModel.content" previewTheme="vuepress" codeTheme="atom" :height="400" />
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