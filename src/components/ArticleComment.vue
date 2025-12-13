<script setup lang="js">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
import HomeRight from '@/components/homeRight.vue';
import { useRoute } from 'vue-router';
import Footer from "@/components/footer.vue";
import { ElMessage } from 'element-plus';
import Comment from "@/components/Comment.vue";
import { articleInfoById } from "@/api/article.js";
import router from "@/router/index.js";
import { commentList } from "@/api/comment.js";
import { articleCollectListService, articleLikeListService } from "@/api/likeCollect.js";
// 引入代码高亮库
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
// 引入封装的Markdown预览组件
import MarkdownDisplay from "@/components/MarkdownDisplay.vue";

const loading = ref(false);
// 获取当前路由信息
const route = useRoute();
const articleId = ref(Number(route.params.id));
// 文章数据
const articleDetail = ref({
  id: 0,
  title: '',
  content: '',
  coverImg: '',
  state: '',
  categoryId: 0,
  createUser: '',
  createTime: '',
  updateTime: '',
});

// ========== 新增：目录悬浮相关响应式数据 ==========
const isDirFixed = ref(false); // 目录是否悬浮
const dirRef = ref(null); // 目录容器的ref
const dirOffsetTop = ref(0); // 目录距离页面顶部的初始距离
const dirWidth = ref(0); // 目录的初始宽度

// 代码高亮处理函数
const highlightCodeBlocks = async () => {
  await nextTick();
  if (!articleContentRef.value) return;
  const codeBlocks = articleContentRef.value.querySelectorAll('.article-content-text pre code, .article-content-text pre');
  codeBlocks.forEach(block => {
    const target = block.tagName === 'CODE' ? block : block.querySelector('code') || block;
    hljs.highlightElement(target);
  });
};

// 监听路由变化
watch(() => route.params.id, async (newId) => {
  articleId.value = Number(newId);
  await getArticleDetailById();
  await updateAdjacentArticles();
}, { immediate: false });

// ========== 核心优化：生成唯一锚点ID（避免冲突） ==========
const generateAnchorId = (title, index) => {
  const cleanTitle = title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').toLowerCase();
  return `anchor-${cleanTitle}-${index}`;
};

// ========== 解析Markdown标题并注入锚点 ==========
const parseAndInjectAnchors = async () => {
  if (!articleDetail.value.content || !articleContentRef.value) return [];

  // 步骤1：解析Markdown标题
  const lines = articleDetail.value.content.split('\n');
  const titles = [];
  let inCodeBlock = false;
  let titleIndex = 0;

  lines.forEach((line) => {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) return;

    const titleMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (titleMatch) {
      const level = titleMatch[1].length;
      const titleText = titleMatch[2].trim();
      if (!titleText) return;

      const anchorId = generateAnchorId(titleText, titleIndex);
      titles.push({
        title: titleText,
        id: anchorId,
        level: level,
        tagName: `H${level}`,
        indent: level - 1
      });
      titleIndex++;
    }
  });

  // 步骤2：等待MdPreview完全渲染（延长至500ms，确保DOM生成）
  await new Promise(resolve => setTimeout(resolve, 500));

  // 步骤3：为标题标签手动添加ID（强制注入，避免渲染丢失）
  const contentEl = articleContentRef.value.querySelector('.article-content-text');
  if (!contentEl) return titles;

  const headingElements = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headingElements.forEach((el, idx) => {
    if (idx < titles.length) {
      el.id = titles[idx].id;
      // 确保标题元素可被聚焦（解决滚动失效）
      el.tabIndex = -1;
    }
  });

  // ========== 新增：获取目录的初始位置和宽度（需在DOM渲染后） ==========
  await nextTick();
  if (dirRef.value) {
    const rect = dirRef.value.getBoundingClientRect();
    dirOffsetTop.value = rect.top + window.scrollY; // 距离页面顶部的绝对距离
    dirWidth.value = rect.width; // 初始宽度
  }

  return titles;
};

// ========== 新增：监听滚动事件，控制目录悬浮 ==========
const handleScroll = () => {
  const scrollTop = window.scrollY;
  // 判断是否滚动到目录顶部
  isDirFixed.value = scrollTop >= dirOffsetTop.value - 20; // 20px偏移量，提前悬浮
};

onMounted(async () => {
  await getArticleDetailById();
  await updateAdjacentArticles();
  window.addEventListener('resize', handleResize);
  handleResize();
  // ========== 新增：添加滚动监听 ==========
  window.addEventListener('scroll', handleScroll);
});

// 根据ID查找文章信息
async function getArticleDetailById() {
  try {
    const res = await articleInfoById(route.params.id);
    if (!res.data) {
      ElMessage.warning('没有更多的文章了');
      await router.push({ path: '/' });
      return;
    }
    res.data.createTime = res.data.createTime.split(' ')[0];
    res.data.updateTime = res.data.updateTime.split(' ')[0];
    articleDetail.value = res.data;
    loading.value = true;

    await nextTick();
    await highlightCodeBlocks();
    titles.value = await parseAndInjectAnchors(); // 替换原fetchMarkdownTitles
    initScrollListener();
  } catch (error) {
    ElMessage.error('加载文章失败');
    console.error('文章加载错误:', error);
  }
}

// 查找上一篇/下一篇文章ID
const findPreviousPublishedArticle = async () => {
  let prevId = articleId.value - 1;
  while (prevId > 0) {
    try {
      const res = await articleInfoById(prevId);
      if (res.data && res.data.state === '已发布') return prevId;
    } catch (error) { console.log(`检查文章ID ${prevId} 出错:`, error); }
    prevId--;
  }
  return null;
};

const findNextPublishedArticle = async () => {
  let nextId = articleId.value + 1;
  const maxCheckCount = 100;
  let checkCount = 0;
  while (checkCount < maxCheckCount) {
    try {
      const res = await articleInfoById(nextId);
      if (res.data && res.data.state === '已发布') return nextId;
    } catch (error) { console.log(`检查文章ID ${nextId} 出错:`, error); }
    nextId++;
    checkCount++;
  }
  return null;
};

// 存储上一篇和下一篇ID
const previousArticleId = ref(null);
const nextArticleId = ref(null);
const updateAdjacentArticles = async () => {
  previousArticleId.value = await findPreviousPublishedArticle();
  nextArticleId.value = await findNextPublishedArticle();
};

// 评论相关
const comments = ref([]);
const loadComments = async () => {
  try {
    const result = await commentList(route.params.id);
    comments.value = result.data;
  } catch (error) {
    ElMessage.error('加载评论失败');
    console.error('评论加载错误:', error);
  }
};
watch(() => route.params.id, loadComments, { immediate: true });

// 字数统计
const countWords = (content) => {
  if (!content) return 0;
  const textWithoutHtml = content.replace(/<[^>]*>/g, '');
  const chineseCount = textWithoutHtml.match(/[\u4e00-\u9fa5\uff00-\uffff]/g)?.length || 0;
  const englishCount = textWithoutHtml.match(/[a-zA-Z0-9_-]+/g)?.length || 0;
  return chineseCount + englishCount;
};

// 点赞收藏计数
const likeCount = ref(0);
const collectCount = ref(0);
const loadLikeAndCollectCount = async () => {
  try {
    const [likeResult, collectResult] = await Promise.all([
      articleLikeListService(route.params.id),
      articleCollectListService(route.params.id)
    ]);
    likeCount.value = likeResult.data.length;
    collectCount.value = collectResult.data.length;
  } catch (error) {
    console.error('加载点赞收藏数据错误:', error);
  }
};
loadLikeAndCollectCount();

// 锚点目录相关
const isVisible = ref(true);
let scrollHandler = null;
const titles = ref([]);
const currentIndex = ref(0);
const articleContentRef = ref(null);

// ========== 终极修复：滚动定位函数（原生锚点 + 平滑滚动） ==========
const handleAnchorClick = async (anchor, idx) => {
  await nextTick();
  const targetEl = document.getElementById(anchor.id);
  if (!targetEl || !articleContentRef.value) return;

  // 方案1：原生scrollIntoView（强制滚动，优先级最高）
  targetEl.scrollIntoView({
    behavior: 'smooth',
    block: 'start', // 对齐到顶部（可改为'center'居中）
    inline: 'nearest'
  });

  // 方案2：备用方案（手动滚动，解决scrollIntoView失效情况）
  setTimeout(() => {
    const container = articleContentRef.value;
    const targetTop = targetEl.getBoundingClientRect().top - container.getBoundingClientRect().top;
    container.scrollTo({
      top: container.scrollTop + targetTop - 20, // 20px偏移
      behavior: 'smooth'
    });
  }, 100);

  currentIndex.value = idx;
};

// ========== 滚动监听（实时更新当前标题） ==========
const initScrollListener = () => {
  if (scrollHandler) {
    articleContentRef.value?.removeEventListener('scroll', scrollHandler);
  }

  scrollHandler = () => {
    if (!articleContentRef.value || titles.value.length === 0) return;

    const containerTop = articleContentRef.value.getBoundingClientRect().top;
    let activeIndex = 0;

    // 遍历所有标题，找到当前可视区域的标题
    titles.value.forEach((title, idx) => {
      const el = document.getElementById(title.id);
      if (el) {
        const elTop = el.getBoundingClientRect().top - containerTop;
        if (elTop - 50 <= articleContentRef.value.scrollTop) {
          activeIndex = idx;
        }
      }
    });

    currentIndex.value = activeIndex;
  };

  articleContentRef.value?.addEventListener('scroll', scrollHandler);
  // 初始化执行一次
  scrollHandler();
};

// 窗口大小监听
const handleResize = () => {
  isVisible.value = window.innerWidth > 900;
  // ========== 新增：窗口大小变化时重新计算目录位置和宽度 ==========
  if (dirRef.value) {
    const rect = dirRef.value.getBoundingClientRect();
    dirOffsetTop.value = rect.top + window.scrollY;
    dirWidth.value = rect.width;
  }
};

// 组件卸载清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (scrollHandler && articleContentRef.value) {
    articleContentRef.value.removeEventListener('scroll', scrollHandler);
  }
  // ========== 新增：移除滚动监听 ==========
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="login-container">
    <el-container>
      <el-header></el-header>
      <div class="all-container">
        <!-- 左边博客文章 -->
        <el-aside>
          <div class="left-article">
            <div class="head_title" :style="`background-image: url('${articleDetail.coverImg}')`">
              <div class="head_title_text">
                <div class="title">{{ articleDetail.title }}</div>
                <div class="statistics">
                  <div>字数统计:{{ countWords(articleDetail.content) }}</div>
                </div>
                <div class="statistics">
                  <div>访问量:0</div>
                  <div>评论数:{{ comments.length }}</div>
                  <div>点赞量:{{ likeCount }}</div>
                  <div>收藏量:{{ collectCount }}</div>
                </div>
                <div class="time">
                  <div>发布：{{ articleDetail.createTime }}</div>
                  <div>更新：{{ articleDetail.updateTime }}</div>
                </div>
              </div>
            </div>

            <!-- 文章内容容器（关键：移除max-height，保留position:relative） -->
            <div class="article-content" ref="articleContentRef">
              <MarkdownDisplay
                  :content="articleDetail.content"
                  :isHtml="false"
                  class="article-content-text"
              />
            </div>

            <div class="copyright">
              <div class="author"><strong>本文作者： 神名代理人</strong></div>
              <div class="link"><strong>本文链接： http://localhost:5173/homes/home</strong></div>
              <div class="license">
                <div><strong>版权声明： </strong></div>
                <div class="license_text">
                  本站所有文章除特别声明外，均采用
                  <a class="copyright_a" href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh" target="_blank">
                    CC BY - NC - SA 4.0
                  </a>
                  许可协议。转载请注明文章出处！
                </div>
              </div>
            </div>

            <div class="tipping">
              <el-tooltip class="box-item" effect="light" placement="top">
                <template #content>
                  <div class="qrCode">
                    <div>微信 <img src="@/assets/weixing.png" alt="微信二维码"></div>
                  </div>
                </template>
                <div class="tipping_text"><span>ヾ(≧▽≦*)o！</span></div>
              </el-tooltip>
            </div>

            <div class="goOn">
              <div v-if="previousArticleId">
                <el-link @click="$router.push(`/homes/articleComment/${previousArticleId}`)">上一篇</el-link>
              </div>
              <div v-if="nextArticleId">
                <el-link @click="$router.push(`/homes/articleComment/${nextArticleId}`)">下一篇</el-link>
              </div>
            </div>

            <Comment :articleId="articleId" v-if="loading" :key="articleId" />
          </div>
        </el-aside>

        <!-- 右边用户栏和目录 -->
        <el-main>
          <div class="right-userLogo">
            <home-right />
            <!-- 文章目录组件：新增ref="dirRef"，动态绑定样式实现悬浮 -->
            <div
                ref="dirRef"
                class="anchor-directory"
                v-if="isVisible && titles.length"
                :style="{
                position: isDirFixed ? 'fixed' : 'static',
                top: isDirFixed ? '55px' : 'auto', // 悬浮时距离顶部20px
                right: isDirFixed ? 'auto' : 'auto', // 对齐原位置的右侧
                width: isDirFixed ? `${dirWidth}px` : 'auto', // 保持原宽度
                zIndex: isDirFixed ? 999 : 'auto', // 悬浮时提高层级
                //隐藏下方滑动栏
                overflowX: 'hidden'

              }"
            >
              <div class="directory-title">文章目录</div>
              <div class="directory-content">
                <ul class="heading-list">
                  <li
                      class="heading-item"
                      v-for="(anchor, index) in titles"
                      :key="anchor.id"
                      :class="[`level-${anchor.tagName.toLowerCase()}`, currentIndex === index ? 'active' : '']"
                      @click="handleAnchorClick(anchor, index)"
                  >
                    {{ anchor.title }}
                  </li>
                </ul>
              </div>
            </div>
            <div class="anchor-directory empty-tip" v-if="isVisible && !titles.length">
              暂无目录
            </div>
          </div>
        </el-main>
      </div>
    </el-container>
  </div>
  <div style="width: 100%">
    <Footer />
  </div>
</template>

<style scoped lang="scss">
// 全局样式
.login-container {
  width: 100%;
  min-height: 100vh;
  background-color: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  box-sizing: border-box;

  .el-container {
    width: 80%;
    display: flex;
    flex-direction: column;
    gap: 20px;

    .all-container {
      display: flex;
      gap: 20px;
      flex: 1;
    }
  }
}

// 左侧文章区域
.el-aside {
  width: 75%;
  flex: none;

  .left-article {
    background-color: var(--card-bg);
    border-radius: 15px;
    padding: 20px;
    box-sizing: border-box;
  }
}

// 右侧目录区域
.el-main {
  width: 25%;
  flex: none;
  padding: 0;

  .right-userLogo {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

// 文章标题区域
.head_title {
  width: 100%;
  height: 20rem;
  border-radius: 10px;
  background-size: cover;
  background-position: center;
  margin-bottom: 20px;
  position: relative;

  .head_title_text {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
    background: linear-gradient(transparent, rgba(0,0,0,0.7));
    color: white;

    .title {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 15px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }

    .statistics {
      display: flex;
      gap: 15px;
      margin-bottom: 8px;
      font-size: 0.9rem;

      div {
        background-color: rgba(255,255,255,0.2);
        padding: 5px 10px;
        border-radius: 4px;
      }
    }

    .time {
      display: flex;
      gap: 15px;
      font-size: 0.8rem;
      opacity: 0.9;
    }
  }
}

// 文章内容容器（关键修改：删除max-height，保留overflow-y: auto和position:relative）
.article-content {
  width: 100%;
  margin-bottom: 20px;
  overflow-y: auto; // 仅当内容超过视口时显示滚动条，否则高度自适应
  scroll-behavior: smooth !important; // 强制平滑滚动
  position: relative; // 关键：作为定位基准

  // 滚动条样式优化
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
    &:hover {
      background: #999;
    }
  }
}

// 文章内容文本样式
.article-content-text {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--text);

  h1, h2, h3, h4, h5, h6 {
    margin: 20px 0 15px 0;
    font-weight: bold;
    scroll-margin-top: 20px; // 关键：锚点滚动偏移（兼容现代浏览器）
  }

  h1 { font-size: 1.8rem; }
  h2 { font-size: 1.6rem; }
  h3 { font-size: 1.4rem; }
  h4 { font-size: 1.2rem; }
  h5 { font-size: 1.1rem; }
  h6 { font-size: 1rem; }

  p { margin: 10px 0; }
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 20px auto;
    border-radius: 8px;
  }

  pre {
    margin: 15px 0;
    padding: 10px;
    border-radius: 6px;
    background: #f5f5f5;
    overflow-x: auto;
  }

  code {
    font-family: 'Consolas', 'Monaco', monospace;
  }
}

// 版权信息样式
.copyright {
  font-size: 0.8rem;
  padding: 15px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  margin-bottom: 20px;

  .author, .link {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
  }

  .license {
    display: flex;
    gap: 10px;
    align-items: flex-start;

    @media (max-width: 900px) {
      flex-direction: column;
      gap: 5px;
    }
  }

  .copyright_a {
    color: var(--el-color-primary);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

// 打赏区域
.tipping {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;

  .tipping_text {
    background-color: #C0A46B;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
    font-weight: bold;
    font-size: 0.9rem;

    &:hover {
      background-color: #fc7444;
    }
  }
}

// 上下篇导航
.goOn {
  display: flex;
  justify-content: space-between;
  padding: 15px 0;
  border-top: 1px dashed #eee;
  margin-bottom: 20px;

  .el-link {
    color: var(--el-text-color-secondary);
    &:hover {
      color: var(--el-color-primary);
    }
  }
}

// 目录样式
.anchor-directory {
  background-color: var(--bg);
  border: 2px solid #ccc;
  border-radius: 15px;
  padding: 15px;
  animation: directoryEnter 0.5s ease forwards;
  opacity: 0;
  transform: translateY(20px);
  // 新增：添加过渡效果，悬浮时更平滑
  transition: all 0.3s ease;

  .directory-title {
    font-size: 1.1rem;
    font-weight: bold;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
    position: relative;
    padding-left: 15px;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 4px;
      background-color: #1890ff;
      border-radius: 2px;
    }
  }

  .directory-content {
    max-height: 500px;

    .heading-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .heading-item {
      padding: 8px 10px;
      margin-bottom: 5px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: all 0.2s;

      &:hover {
        background-color: #f5f7fa;
        transform: translateX(2px);
      }

      &.active {
        background-color: #e6f7ff;
        color: #1890ff;
        font-weight: 500;
      }

      &.level-h1 { padding-left: 10px; }
      &.level-h2 { padding-left: 20px; }
      &.level-h3 { padding-left: 30px; }
      &.level-h4 { padding-left: 40px; }
      &.level-h5 { padding-left: 50px; }
      &.level-h6 { padding-left: 60px; }
    }
  }

  .empty-tip {
    text-align: center;
    padding: 20px;
    color: #999;
    font-size: 0.9rem;
  }
}

// 目录进入动画
@keyframes directoryEnter {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 移动端适配
@media screen and (max-width: 900px) {
  .login-container .el-container {
    width: 95%;
  }

  .all-container {
    flex-direction: column !important;
  }

  .el-aside, .el-main {
    width: 100% !important;
  }

  .el-main {
    display: none;
  }

  // 移除移动端的max-height限制（原本就已删除，此处保留注释仅作提示）
  .article-content {
    // max-height: none !important; 【核心修改点2：此样式已无必要，可删除】
  }

  .head_title {
    height: 15rem;
  }

  .head_title_text .title {
    font-size: 2rem;
  }
}
</style>