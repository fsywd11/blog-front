<script setup>
import { ref, onMounted, computed } from 'vue';
import { articleCateListService, articleListController } from "@/api/article.js";
import Footer from "@/components/footer.vue";

// 定义加载状态
const loading = ref(true);
const categoryLoading = ref(true);
const articleLoading = ref(true);

// 使用 ref 来存储分类数据
const categories = ref([]);
// 使用 ref 来存储文章数据
const articles = ref([]);
const currentArticles = ref([]);
// 新增：当前选中的分类
const currentCategory = ref(null);

// 计算属性：判断是否有分类数据
const hasCategories = computed(() => categories.value.length > 0);

// 计算属性：判断是否有文章数据
const hasArticles = computed(() => currentArticles.value.length > 0);

// 处理分类选择
const handleSelect = (key) => {
  const categoryId = parseInt(key);

  // 更新当前选中的分类
  currentCategory.value = categories.value.find(cat => cat.id === categoryId);

  // 如果选中的分类有文章，则筛选文章；否则显示空数组
  currentArticles.value = articles.value.filter(
      (article) => article.categoryId === categoryId
  );
};

// 获取文章分类列表
const fetchArticleCategories = async () => {
  try {
    const result = await articleCateListService();
    // 假设后端返回的数据结构中有 data 字段存储分类列表
    categories.value = result.data || [];

    // 如果有分类数据，默认选中第一个分类
    if (hasCategories.value) {
      currentCategory.value = categories.value[0];
    }
  } catch (error) {
    console.error('获取文章分类数据失败:', error);
  } finally {
    categoryLoading.value = false;
    updateLoadingStatus();
  }
};

// 获取文章列表
const fetchArticles = async () => {
  try {
    const result = await articleListController();
    // 假设后端返回的数据结构中有 data 字段存储文章列表
    articles.value = result.data || [];

    // 如果有分类数据，初始显示第一个分类的文章
    if (hasCategories.value) {
      handleSelect(currentCategory.value.id.toString());
    }
  } catch (error) {
    console.error('获取文章数据失败:', error);
  } finally {
    articleLoading.value = false;
    updateLoadingStatus();
  }
};

// 更新整体加载状态
const updateLoadingStatus = () => {
  loading.value = categoryLoading.value || articleLoading.value;
};

// 移除 HTML 标签的工具函数
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ''); // 匹配并移除所有 HTML 标签
};

// 截取文章内容前 N 个字
const getShortContent = (content, length = 80) => {
  if (!content) return '';

  const text = stripHtml(content);
  return text.length > length
      ? `${text.slice(0, length)}...`
      : text;
};

// 在组件挂载时调用获取分类数据和文章数据的函数
onMounted(async () => {
  await fetchArticleCategories();
  await fetchArticles();
});
</script>

<template>
  <div class="main-container">
    <!-- 分类信息框 -->
    <div class="category-info-box" v-if="currentCategory && !loading">
      <h2 class="category-title">{{ currentCategory.categoryName || '未选择分类' }}</h2>
      <p class="category-desc">创建者：{{ currentCategory.createUser || '未知' }}</p>
    </div>

    <el-row>
      <!-- 左侧分类菜单 -->
      <el-col :span="5">
        <el-card class="category-card">
          <template #header>
            <div class="category-header">文章分类</div>
          </template>

          <!-- 分类加载状态 -->
          <template v-if="categoryLoading">
            <el-skeleton animated />
          </template>

          <!-- 无分类数据 -->
          <template v-else-if="!hasCategories">
            <div class="empty-category">暂无分类数据</div>
          </template>

          <!-- 分类列表 -->
          <template v-else>
            <el-menu
                :default-active="currentCategory?.id?.toString() || ''"
                class="el-menu-vertical-demo"
                @select="handleSelect"
            >
              <el-menu-item
                  class="category-item"
                  v-for="category in categories"
                  :key="category.id"
                  :index="category.id.toString()"
              >
                <span class="category-text">{{ category.categoryName }}</span>
              </el-menu-item>
            </el-menu>
          </template>
        </el-card>
      </el-col>

      <!-- 右侧文章列表 -->
      <el-col :span="18">
        <el-card class="article-list-card">
          <template #header>
            <div class="article-header">文章列表</div>
          </template>

          <!-- 文章加载状态 -->
          <template v-if="articleLoading">
            <el-skeleton animated count="3" />
          </template>

          <!-- 无文章数据 -->
          <template v-else-if="!hasArticles">
            <div class="empty-articles">
              <p class="empty-text">暂无文章数据</p>
              <p class="empty-hint" v-if="currentCategory">当前分类下没有文章</p>
            </div>
          </template>

          <!-- 文章列表 -->
          <template v-else>
            <div class="article-list">
              <el-card
                  v-for="article in currentArticles"
                  :key="article.id"
                  @click="$router.push(`/homes/articleComment/${article.id}`)"
                  class="article-card"
              >
                <template #header>
                  <div class="card-header">
                    {{ stripHtml(article.title) || '无标题' }}
                  </div>
                </template>
                <div class="article-content">
                  {{ getShortContent(article.content) }}
                </div>
                <div class="article-meta">
                  <span class="publish-time">
                    <i class="el-icon-time"></i>
                    发布于：{{ new Date(article.createTime).toLocaleDateString() }}
                  </span>
                  <span class="author" v-if="article.createUser">
                    <i class="el-icon-user"></i>
                    作者：{{ article.createUser }}
                  </span>
                </div>
              </el-card>
            </div>
          </template>
        </el-card>
      </el-col>
    </el-row>
  </div>
  <div style="width: 100% ">
    <Footer/>
  </div>
</template>

<style scoped lang="scss">
.main-container {
  margin-top: 56px;
  padding: 10px;
  min-height: 100vh;
  background: var(--bg);
}

.category-card, .article-list-card {
  height: 100%;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  background: var(--nav-bg);
  backdrop-filter: none;
  .el-menu-item {
    background-color: rgba(255, 255, 255, 0);
    &:hover .category-text{
      transform: translateX(5px);
      color: #dc40ff;
    }
    &.is-active {
      color: #cf00ff;
    }
  }
}

.category-header, .article-header {
  font-size: 18px;
  font-weight: bold;
  color: var(--text);
}

.article-list {
  margin-top: 15px;
  background: var(--nav-bg);
  backdrop-filter: none;
}

.article-card {
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  background: var(--nav-bg);
  backdrop-filter: none;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
}

.card-header {
  font-size: 18px;
  font-weight: bold;
  color: var(--text);
  margin-bottom: 10px;
  position: relative;
  display: inline-block;/*功能是让元素以行内块级元素的方式显示,只显示元素内容下划线部分*/

  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(60deg, rgb(228, 165, 222) 0%, rgb(190, 95, 213) 100%);
    transition: width 0.3s ease;
  }

  .article-card:hover &::after {
    width: 100%;
  }
}

.article-content {
  font-size: 14px;
  color: var(--text);
  line-height: 1.6;
  margin-bottom: 10px;
}

.article-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 15px;
}

.category-text {
  font-size: 15px;
  transition: all 0.3s ease;
}

.category-info-box {
  border-radius: 8px;
  padding: 15px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  background: var(--nav-bg);
  backdrop-filter: none;
}

.category-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
  color: var(--text);
}

.category-desc {
  font-size: 14px;
  color: var(--text);
}

.empty-category, .empty-articles {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  color: #909399;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 5px;
}

.empty-hint {
  font-size: 14px;
}


.el-menu-vertical-demo{
  background: var(--nav-bg);
  .category-item{
    color: var(--text);
  }
}
</style>