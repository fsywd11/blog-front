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

// 代码高亮处理函数
const highlightCodeBlocks = () => {
  // 等待DOM更新后执行
  nextTick(() => {
    // 查找文章内容中的所有代码块（pre标签）
    const codeBlocks = document.querySelectorAll('.article-content-text pre');
    codeBlocks.forEach(block => {
      // 为每个代码块应用高亮
      hljs.highlightElement(block);
    });
  });
};

// 监听路由变化
watch(() => route.params.id, async (newId) => {
  articleId.value = Number(newId);
  await getArticleDetailById();
  await updateAdjacentArticles(); // 路由变化时重新查找上下篇已发布文章
});

onMounted(async () => {
  await getArticleDetailById();
  await updateAdjacentArticles(); // 初始化时查找上下篇已发布文章
  highlightCodeBlocks(); // 初始加载后高亮
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
    // 处理时间格式
    res.data.createTime = res.data.createTime.split(' ')[0];
    res.data.updateTime = res.data.updateTime.split(' ')[0];
    articleDetail.value = res.data;
    loading.value = true;

    // 文章加载完成后重新提取目录和高亮代码
    await nextTick(() => {
      extractHeadings();
      resetDirectoryPosition();
      highlightCodeBlocks(); // 加载完成后高亮
      initDirectoryObserver(); // 初始化目录动画观察器
    });
  } catch (error) {
    ElMessage.error('加载文章失败');
    console.error('文章加载错误:', error);
  }
}

// 查找上一篇已发布的文章ID
const findPreviousPublishedArticle = async () => {
  let prevId = articleId.value - 1;
  while (prevId > 0) {
    try {
      const res = await articleInfoById(prevId);
      if (res.data && res.data.state === '已发布') {
        return prevId;
      }
    } catch (error) {
      console.log(`检查文章ID ${prevId} 时出错:`, error);
    }
    prevId--;
  }
  return null;
};

// 查找下一篇已发布的文章ID
const findNextPublishedArticle = async () => {
  let nextId = articleId.value + 1;
  // 设置一个合理的上限，避免无限循环
  const maxCheckCount = 100;
  let checkCount = 0;

  while (checkCount < maxCheckCount) {
    try {
      const res = await articleInfoById(nextId);
      if (res.data && res.data.state === '已发布') {
        return nextId;
      }
    } catch (error) {
      console.log(`检查文章ID ${nextId} 时出错:`, error);
    }
    nextId++;
    checkCount++;
  }
  return null;
};

// 存储上一篇和下一篇已发布文章的ID
const previousArticleId = ref(null);
const nextArticleId = ref(null);

// 更新上一篇和下一篇文章的ID
const updateAdjacentArticles = async () => {
  previousArticleId.value = await findPreviousPublishedArticle();
  nextArticleId.value = await findNextPublishedArticle();
};

// 评论相关数据
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

watch(() => route.params.id, () => {
  loadComments();
}, { immediate: true });

// 去除HTML标签并统计字数
const countWords = (content) => {
  if (!content) return 0;

  // 去除HTML标签
  const textWithoutHtml = content.replace(/<[^>]*>/g, '');

  // 处理中文和全角字符
  const chineseChars = textWithoutHtml.match(/[\u4e00-\u9fa5\uff00-\uffff]/g);
  const chineseCount = chineseChars ? chineseChars.length : 0;

  // 处理英文单词
  const englishWords = textWithoutHtml.match(/[a-zA-Z0-9_-]+/g);
  const englishCount = englishWords ? englishWords.length : 0;

  return chineseCount + englishCount;
};

// 点赞和收藏计数
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
const headings = ref([]);
const activeHeadingId = ref('');
const isVisible = ref(true);
const directoryRef = ref(null); // 目录元素引用
const directoryTop = ref(0); // 目录初始顶部位置
const directoryWidth = ref(0); // 目录宽度
const directoryEntered = ref(false); // 目录是否已进入视口
let scrollHandler = null;
let directoryObserver = null;

// 提取标题
const extractHeadings = () => {
  // 清空现有目录
  headings.value = [];

  // 查找文章内容容器
  const contentEl = document.querySelector('.article-content-text');
  if (!contentEl) {
    console.warn('未找到文章内容容器');
    return;
  }

  // 提取所有标题标签
  const headingElements = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headingElements.length === 0) {
    console.log('未找到标题元素');
    return;
  }

  // 处理每个标题
  headings.value = Array.from(headingElements).map((el, index) => {
    // 确保标题有唯一ID
    let id = el.id;
    if (!id) {
      id = `heading-${articleId.value}-${index}`;
      el.id = id;
    }

    return {
      id,
      text: el.innerText.trim(),
      tag: el.tagName,
      element: el
    };
  });

  // 初始化滚动监听
  initScrollListener();
};

// 初始化目录进入视口观察器
const initDirectoryObserver = () => {
  // 先清除已有的观察器
  if (directoryObserver) {
    directoryObserver.disconnect();
  }

  // 只有当目录存在且未显示过时才创建观察器
  if (directoryRef.value && !directoryEntered.value) {
    directoryObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          directoryEntered.value = true;
          directoryObserver.disconnect();
        }
      });
    }, { threshold: 0.1 }); // 当10%进入视口时触发

    directoryObserver.observe(directoryRef.value);
  }
};

// 初始化滚动监听
const initScrollListener = () => {
  // 移除旧的监听
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler);
  }

  // 记录目录初始位置和宽度
  resetDirectoryPosition();

  // 创建新地滚动处理函数
  scrollHandler = () => {
    // 处理目录固定定位
    handleDirectoryPosition();

    // 处理标题激活状态
    handleHeadingActivation();
  };

  // 添加新的监听
  window.addEventListener('scroll', scrollHandler);
  // 立即执行一次以设置初始状态
  scrollHandler();
};

// 重置目录位置 - 关键函数：重新计算目录初始位置
const resetDirectoryPosition = () => {
  if (directoryRef.value) {
    // 先将目录恢复到自然位置
    directoryRef.value.style.position = 'static';
    directoryRef.value.style.top = 'auto';
    directoryRef.value.style.width = 'auto';

    // 重新计算位置和宽度
    const rect = directoryRef.value.getBoundingClientRect();
    directoryTop.value = rect.top + window.scrollY;
    directoryWidth.value = rect.width;
  }
};

// 处理目录定位 - 确保目录始终在视口内
const handleDirectoryPosition = () => {
  if (!directoryRef.value) return;

  const scrollY = window.scrollY;
  const directoryEl = directoryRef.value;

  // 当滚动超过目录初始位置时，固定目录
  if (scrollY >= directoryTop.value - 20) { // 20px偏移量
    directoryEl.style.position = 'fixed';
    directoryEl.style.top = '20px';
    directoryEl.style.width = `${directoryWidth.value}px`;
    directoryEl.style.zIndex = '100'; // 确保在其他内容上方
  } else {
    // 恢复默认定位
    directoryEl.style.position = 'static';
    directoryEl.style.top = 'auto';
    directoryEl.style.width = 'auto';
    directoryEl.style.zIndex = '10';
  }
};

// 处理标题激活状态
const handleHeadingActivation = () => {
  const scrollPosition = window.scrollY + 150; // 调整偏移量更符合阅读习惯

  // 从底部向上检查哪个标题在可视区域
  for (let i = headings.value.length - 1; i >= 0; i--) {
    const heading = headings.value[i];
    if (!heading.element) continue;

    const offsetTop = heading.element.offsetTop;
    if (scrollPosition >= offsetTop) {
      activeHeadingId.value = heading.id;
      break;
    }
  }
};

// 监听文章内容变化 - 当文章内容改变时重新初始化目录和高亮
watch(
    () => articleDetail.value.content,
    () => {
      // 内容变化后重新提取目录并重置位置
      nextTick(() => {
        extractHeadings();
        resetDirectoryPosition();
        highlightCodeBlocks(); // 内容变化时重新高亮
        initDirectoryObserver(); // 重新初始化观察器
      });
    }
);

// 监听窗口大小变化
const handleResize = () => {
  const newVisible = window.innerWidth > 900;
  isVisible.value = newVisible;

  // 窗口大小变化时重新计算目录位置和宽度
  if (newVisible && directoryRef.value) {
    resetDirectoryPosition();
    handleDirectoryPosition();
    // 窗口大小改变后重新检查可见性
    initDirectoryObserver();
  }
};

onMounted(() => {
  // 初始化窗口大小监听
  window.addEventListener('resize', handleResize);
  handleResize(); // 初始设置

  // 确保在文章加载完成后提取目录
  const articleObserver = new MutationObserver(() => {
    if (loading.value) {
      extractHeadings();
      resetDirectoryPosition();
      highlightCodeBlocks(); // 观察到内容加载完成时高亮
      initDirectoryObserver(); // 初始化目录动画
      articleObserver.disconnect();
    }
  });

  articleObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// 点击目录项滚动到对应位置
const scrollToHeading = (id) => {
  const element = document.getElementById(id);
  if (element) {
    // 平滑滚动到标题位置
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    });
    activeHeadingId.value = id;
  }
};

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler);
  }
  if (directoryObserver) {
    directoryObserver.disconnect();
  }
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
            <div class="article-content">
              <MarkdownDisplay :content="articleDetail.content" />
            </div>
            <div class="copyright">
              <div class="author">
                <strong>本文作者： 神名代理人</strong>
              </div>
              <div class="link">
                <strong>本文链接： http://localhost:5173/homes/home</strong>
              </div>
              <div class="license">
                <div>
                  <strong>版权声明： </strong>
                </div>
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
                    <div>
                      微信
                      <img src="@/assets/weixing.png" alt="微信二维码">
                    </div>
                  </div>
                </template>
                <div class="tipping_text">
                  <span>ヾ(≧▽≦*)o！</span>
                </div>
              </el-tooltip>
            </div>
            <div class="goOn">
              <!-- 上一篇 -->
              <div>
                <div v-if="previousArticleId">
                  <el-link @click="$router.push(`/homes/articleComment/${previousArticleId}`)">
                    上一篇
                  </el-link>
                </div>
              </div>
              <!-- 下一篇 -->
              <div>
                <div v-if="nextArticleId">
                  <el-link @click="$router.push(`/homes/articleComment/${nextArticleId}`)">
                    下一篇
                  </el-link>
                </div>
              </div>
            </div>
            <Comment :articleId="articleId" v-if="loading" :key="articleId" />
          </div>
        </el-aside>
        <!-- 右边用户栏和目录 -->
        <el-main>
          <div class="right-userLogo">
            <home-right />
            <!-- 目录添加进入动画类 -->
            <div
                v-if="isVisible"
                ref="directoryRef"
                class="anchor-directory"
                :class="{ 'directory-enter': directoryEntered }"
            >
              <div class="directory-title">文章目录</div>
              <div class="directory-content">
                <ul class="heading-list">
                  <li
                      v-for="heading in headings"
                      :key="heading.id"
                      :class="['heading-item', `level-${heading.tag.toLowerCase()}`, { 'active': activeHeadingId === heading.id }]"
                      @click="scrollToHeading(heading.id)"
                  >
                    {{ heading.text }}
                  </li>
                </ul>
                <div v-if="headings.length === 0" class="empty-tip">暂无目录</div>
              </div>
            </div>
          </div>
        </el-main>
      </div>
    </el-container>
    <div style="width: 100%">
      <Footer />
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 基础样式 */
.login-container {
  height: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--bg);
  overflow-wrap: break-word;
  word-break: break-all;

  .el-container {
    width: 80%;
    display: flex;

    .el-header {
      height: 50px;
      width: 100%;
      padding: 10px;
      border-radius: 15px;
    }

    .all-container {
      width: 100%;
      display: flex;
      flex-direction: row;
    }

    .el-aside {
      width: 75%;
      height: auto;
      overflow: visible;

      .left-article {
        padding: 10px;
        background-color: var(--card-bg);
        height: auto;
        border-radius: 15px;
      }
    }

    .el-main {
      margin: 0;
      padding: 0;
      width: 25%;

      .right-userLogo {
        padding: 0 10px 0 20px;
        overflow: visible;
      }
    }
  }
}

/* 版权信息样式 */
.copyright {
  font-size: 0.8em;
  margin: 1rem 0;
  padding: 1rem 2rem;
  border-radius: 0.625rem;
  border: 1px solid var(--el-border-color);

  .license {
    display: flex;

    & > div:nth-child(1) {
      @media screen and (max-width: 910px) {
        width: 100%;
        display: flex;
      }
    }

    @media screen and (max-width: 910px) {
      flex-direction: column;
    }
  }

  .license_text {
    display: flex;
    @media screen and (max-width: 910px) {
      width: 100%;
      margin-top: 0.5rem;
    }
  }

  .copyright_a {
    color: var(--el-text-color-secondary);

    &:hover {
      color: var(--el-color-primary);
      text-decoration: underline;
    }
  }

  & > div {
    margin: 1rem 0;
    display: flex;
    align-items: center;

    strong {
      margin: 0 0.5rem;
      font-weight: bold;
      word-break: break-all;
    }
  }
}

/* 文章内容样式 */
.article-content {
  margin-bottom: 20px;
  overflow: hidden;
  color: var(--text);

  .article-content-text {
    overflow-wrap: break-word;
    word-break: break-all;
    margin-top: 20px;
    padding: 2px;
    border-radius: 0.625rem;
  }
}

.article-content-text img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
  transition: transform 0.3s ease;
  object-fit: contain;
}

.article-content-text img:hover {
  transform: scale(1.1);
}

/* 代码块样式优化 */
.article-content-text {
  // 确保代码块显示正常
  pre {
    padding: 1em !important;
    background: #f5f5f5 !important;
    border-radius: 4px !important;
    overflow-x: auto !important;
    margin: 1em 0 !important;
    font-family: 'Consolas', 'Monaco', monospace !important;
  }

  // 代码语法高亮样式
  .hljs {
    color: #333 !important;
    line-height: 1.5 !important;

    .hljs-keyword { color: #0000ff !important; }
    .hljs-string { color: #008000 !important; }
    .hljs-comment { color: #808080 !important; }
    .hljs-number { color: #800000 !important; }
    .hljs-function { color: #795e26 !important; }
  }
}

/* 响应式样式 */
@media screen and (max-width: 900px) {
  .login-container .el-container {
    width: 100%;
  }
  .login-container .el-container .all-container {
    flex-direction: column;
  }

  .login-container .el-container .all-container .el-aside {
    width: 100%;
  }

  .login-container .el-container .all-container .el-main {
    display: none;
  }
}

/* 文章标题区域 */
.head_title {
  border-radius: 0.4rem;
  height: 20rem;
  width: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  .head_title_text {
    display: flex;
    flex-direction: column;
    align-items: self-start;
    color: white;
    font-size: 15px;
    padding: 5%;

    div div {
      background-color: rgba(255, 255, 255, 0.3);
      border-radius: 5px;
      margin: 5px;
      padding: 5px;
    }
    div {
      display: flex;
    }

    .title {
      font-size: 40px;
      margin: 10px 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
  }
}

/* 打赏区域样式 */
.tipping {
  display: flex;
  text-align: center;
  font-size: 0.86em;
  font-weight: bold;
  justify-content: center;
  align-items: center;
  margin: 1rem 0;

  .tipping_text {
    display: flex;
    color: white;
    background-color: #C0A46B;
    width: 20%;
    border: 1px solid var(--el-border-color);
    height: 2.5em;
    border-radius: 5px;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: background-color 0.3s ease;

    span {
      margin-left: 0.6em;
    }

    &:hover {
      background-color: #fc7444;
    }
  }

  @media screen and (max-width: 500px) {
    .tipping_text {
      width: 50%;
    }
  }
}

/* 二维码样式 */
.qrCode {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;

  div {
    display: flex;
    flex-direction: column-reverse;
    margin: 0 0.5rem;
    align-items: center;
    justify-content: center;
  }

  img {
    width: 9em;
    height: 9em;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
}

/* 上下篇导航 */
.goOn {
  display: flex;
  justify-content: space-between;
  margin: 1rem 0;
  padding: 1rem 0;
  border-top: 1px dashed #eee;

  div {
    display: flex;
    align-items: center;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: var(--el-color-primary);
    }

    .el-link {
      font-size: 0.9em;
    }
  }
}

/* 锚点目录样式 - 添加进入动画 */
.anchor-directory {
  margin-top: 20px;
  padding: 15px;
  background-color: var(--bg);
  border-radius: 15px;
  border: 2px solid #ccc;
  max-height: calc(100vh - 100px);
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); /* 使用缓动函数增强动画感 */

  // 进入视口后的动画状态
  &.directory-enter {
    opacity: 1;
    transform: translateY(0);
  }

  .directory-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
    color: var(--text);
    display: flex;
    align-items: center;

    &::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 16px;
      background-color: #1890ff;
      margin-right: 8px;
      border-radius: 2px;
    }
  }

  .directory-content {
    max-height: 500px;
    overflow-y: auto;
    padding-right: 5px;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: #ddd;
      border-radius: 3px;
    }
    &::-webkit-scrollbar-track {
      background-color: #f5f5f5;
      border-radius: 3px;
    }
  }

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
    transition: all 0.2s ease;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      background-color: #f5f7fa;
      transform: translateX(2px);
    }

    &.active {
      background-color: #e6f7ff;
      color: #1890ff;
      font-weight: 500;
    }

    &.level-h1 {
      padding-left: 10px;
      font-weight: 500;
    }
    &.level-h2 {
      padding-left: 20px;
      font-size: 13.5px;
    }
    &.level-h3 {
      padding-left: 30px;
      font-size: 13px;
      color: #555;
    }
    &.level-h4, &.level-h5, &.level-h6 {
      padding-left: 40px;
      font-size: 12.5px;
      color: #666;
    }
  }

  .empty-tip {
    text-align: center;
    padding: 20px 0;
    color: #999;
    font-size: 14px;
    background-color: var(--bg);
    border-radius: 6px;
  }
}

/* 移动端适配 */
@media screen and (max-width: 900px) {
  .anchor-directory {
    display: none;
  }
}

/* 加载状态 */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;

  .el-spinner {
    font-size: 24px;
  }
}
</style>




