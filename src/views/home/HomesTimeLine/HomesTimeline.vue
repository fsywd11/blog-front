<script setup lang="js">
import { ref, onMounted, nextTick, computed, onUnmounted, watch } from 'vue';
import { articleListController } from "@/api/article.js";
import { ElMessage } from 'element-plus';
import router from "@/router/index.js";
import Footer from "@/components/footer.vue";

function removeHtmlFormat(htmlStr) {
  const doc = new DOMParser().parseFromString(htmlStr, 'text/html');
  // 直接取文本内容，自动剔除所有标签、保留换行/空格逻辑
  return doc.body.textContent || '';
}

// 处理数据的函数
function handleData(data) {
  if (!data || !Array.isArray(data)) return {};

  data = data.map((item) => {
    item.content = (removeHtmlFormat(item.content) || '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9,.!?]/g, '');
    item.content = item.content || '暂无内容';
    item.content = item.content.substring(0, 60) + '...';
    item.createTime = (item.createTime || new Date().toISOString()).substring(0, 10);
    return item;
  });

  const groupedArticles = computed(() => {
    const groups = data.reduce((groups, article) => {
      const year = new Date(article.createTime).getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(article);
      return groups;
    }, {});

    const sortedGroups = {};
    Object.keys(groups).sort((a, b) => b - a).forEach(year => {
      sortedGroups[year] = groups[year];
    });
    return sortedGroups;
  });

  return groupedArticles.value;
}

// 响应式状态
const isMobile = ref(false);
const checkIsMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

// 核心数据
const shellRef = ref(null);
const items = ref({});
const isDataLoaded = ref(false);
const scrollHandler = ref(null);

// 组件挂载时初始化
onMounted(async () => {
  checkIsMobile();
  window.addEventListener('resize', checkIsMobile);

  try {
    const res = await articleListController();
    items.value = handleData(res.data);
    isDataLoaded.value = true;
    await nextTick();
    initTimeline();
  } catch (error) {
    ElMessage.error('获取文章数据失败，请稍后重试');
    console.error('文章数据获取失败:', error);
  }

  onUnmounted(() => {
    window.removeEventListener('resize', checkIsMobile);
    if (scrollHandler.value) {
      window.removeEventListener('scroll', scrollHandler.value);
    }
  });
});

// 窗口大小变化时重新初始化
watch(isMobile, () => {
  if (isDataLoaded.value) {
    nextTick(initTimeline);
  }
});

// 初始化时间轴交互
function initTimeline() {
  const shell = shellRef.value;
  if (!shell) return;

  if (scrollHandler.value) {
    window.removeEventListener('scroll', scrollHandler.value);
  }

  const itemElements = shell.querySelectorAll('.timeline-item');
  const itemsArray = Array.from(itemElements);

  if (itemsArray.length > 0) {
    activateItem(itemsArray[0], itemsArray);
    updateBackground(shell, itemsArray[0]);
  }

  scrollHandler.value = throttle(() => {
    const scrollPos = window.scrollY;
    updateHeaderStyle(scrollPos);

    if (isMobile.value) {
      handleMobileScroll(itemsArray, shell);
    } else {
      handleDesktopScroll(itemsArray, shell);
    }
  }, 80);

  window.addEventListener('scroll', scrollHandler.value);
  scrollHandler.value();
}

// 桌面端滚动逻辑
function handleDesktopScroll(itemsArray, shell) {
  const viewportHeight = window.innerHeight;
  itemsArray.forEach(item => {
    const rect = item.getBoundingClientRect();
    const isVisible = rect.top < viewportHeight * 0.6 && rect.bottom > viewportHeight * 0.2;
    if (isVisible) {
      activateItem(item, itemsArray);
      updateBackground(shell, item);
    }
  });
}

// 移动端滚动逻辑
function handleMobileScroll(itemsArray, shell) {
  const viewportHeight = window.innerHeight;
  itemsArray.forEach(item => {
    const rect = item.getBoundingClientRect();
    const isVisible = rect.top < viewportHeight * 0.8 && rect.bottom > 0;
    if (isVisible) {
      activateItem(item, itemsArray);
      updateBackground(shell, item);
    }
  });
}

// 激活当前项
function activateItem(currentItem, allItems) {
  allItems.forEach(item => item.classList.remove('active'));
  currentItem.classList.add('active');
}

// 更新背景图
function updateBackground(shell, item) {
  const img = item.querySelector('.article-img');
  if (img) {
    shell.style.backgroundImage = `url(${img.src})`;
  }
}

// 更新Header滚动样式
function updateHeaderStyle(scrollPos) {
  const header = document.querySelector('.banner-card');
  if (header) {
    header.classList.toggle('scrolled', scrollPos > 50);
  }
}

// 节流函数
function throttle(fn, delay = 100) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}

// 文章点击跳转（修复：添加错误处理和路由验证）
const goToArticle = (articleId) => {
  // 验证articleId是否有效
  if (!articleId) {
    ElMessage.warning('文章ID无效');
    return;
  }

  // 使用命名路由跳转，并添加错误处理
  router.push({
    name: 'ArticleComment',
    params: { id: articleId }
  }).catch(error => {
    console.error('路由跳转失败:', error);
    ElMessage.error('无法跳转到文章详情页');
  });
};

</script>

<template>
  <div class="app-wrapper">
    <!-- 头部（关键修复：移除el-header默认样式冲突） -->
    <header class="page-header">
      <div class="header-inner">
        <el-card class="banner-card">
          <h1 class="banner-title">时间轴</h1>
          <p class="banner-subtitle">Timeline Journal</p>
        </el-card>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 加载状态 -->
      <div v-if="!isDataLoaded" class="loading-state">
        <p class="loading-text">加载文章中...</p>
      </div>

      <!-- 时间轴内容 -->
      <div v-else class="timeline-container" ref="shellRef">
        <div class="timeline-inner">
          <!-- 年份分组渲染 -->
          <template v-for="(yearArticles, year) in items" :key="year">
            <h2 class="year-title">
              <span class="year-text">{{ year }}</span>
            </h2>

            <div class="articles-group">
              <div
                  class="timeline-item"
                  v-for="article in yearArticles"
                  :key="article.id"
                  :data-date="article.createTime"
              >
                <el-card class="article-card" @click="goToArticle(article.id)">
                  <div class="article-content">
                    <img
                        class="article-img"
                        :src="article.coverImg || require('@/assets/【哲风壁纸】我妻善逸-鬼灭之刃.png')"
                        :alt="article.title"
                    >
                    <div class="article-info">
                      <h3 class="article-title">{{ article.title }}</h3>
                      <p class="article-date">{{ article.createTime }}</p>
                      <p class="article-desc">{{ article.content }}</p>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>
          </template>

          <!-- 空状态 -->
          <div v-if="Object.keys(items).length === 0" class="empty-state">
            <p>暂无文章数据</p>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部 -->
    <Footer/>
  </div>
</template>

<style lang="scss" scoped>
@import "index.scss";
</style>