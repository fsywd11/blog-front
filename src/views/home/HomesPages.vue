<script setup lang="js">
import {ref, onMounted, onUnmounted} from 'vue';
import categoryManageStore from '@/stores/categoryInfo.js';
import {articleCateListService, articleInfoServices} from '@/api/article';
import Wave from '@/components/Wave.vue';
import HomeRight from '@/components/homeRight.vue';
import Footer from "@/components/footer.vue";
import CarouselImage from "@/components/CarouselImage.vue";
import articleInfoStore from "@/stores/ArticleInfo.js";
import 'es6-promise/auto';
import SvgIcon from '@/components/SvgIcon.vue';
import {commentList} from "@/api/comment.js";
// 新增：导入点赞相关API
import {
  articleAddCollect,
  articleAddLike, articleCollectListService, articleDeleteCollect,
  articleDeleteLike, articleLikeListService,
  articleListByArticleId,
  articleListByCollectId
} from "@/api/likeCollect.js";

const isLoading = ref(true);
// 要显示的完整文字数组
const fullTexts = [
  '只要我戏不散，大唐就不会亡！',
  '人生如戏，全靠演技！',
  '生活不止眼前的苟且，还有诗和远方！',
  '一天是不良人，一辈子都是!',
  '世界在遗忘我！',
  '欲买桂花同载酒，只可惜故人何日再见',
  '我已解明了一切！！！',
  '天行健，君子以自强不息！'
];
// 用于存储当前显示的文字
const displayedText = ref('');
// 每个字符显示的间隔时间（毫秒）
const intervalTime = 250;
// 存储文章分类数据
const categorys = ref([]);

// 获取文章封面类型
const categoryInfoStore = categoryManageStore();
const fetchCategories = () => {
  articleCateListService().then(result => {
    categorys.value = result.data;
    categoryInfoStore.setInfo(result.data);
  }).catch(error => {
    console.error('Failed to fetch categories:', error);
  });
};

fetchCategories();


const articleManage = articleInfoStore();

// 当前显示的句子索引
const currentTextIndex = ref(0);
// 定时器 ID
let textInterval;

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

// 根据文章的 categoryId 找到文章分类名字
const getCategoryName = (categoryId) => {
  const category = categorys.value.find(({id}) => id === categoryId);
  return category ? category.categoryName : '未知分类';
};

// 显示文字
const showText = () => {
  let index = 0;
  const currentText = fullTexts[currentTextIndex.value];
  textInterval = setInterval(() => {
    if (index < currentText.length) {
      displayedText.value += currentText[index];
      index++;
    } else {
      clearInterval(textInterval);
      // 文字显示完后开始消失
      setTimeout(() => {
        hideText();
      }, 1000);
    }
  }, intervalTime);
};

// 隐藏文字
const hideText = () => {
  let index = displayedText.value.length;
  textInterval = setInterval(() => {
    if (index > 0) {
      displayedText.value = displayedText.value.slice(0, -1);
      index--;
    } else {
      clearInterval(textInterval);
      // 文字消失完后显示下一句
      currentTextIndex.value = (currentTextIndex.value + 1) % fullTexts.length;
      showText();
    }
  }, intervalTime);
};

// 定义图片数组
// 当前显示图片的索引
const currentImageIndex = ref(0);
// 当前显示的图片
const currentImage = ref('');
// 图片数组 - 只包含已发布文章的图片
const imageArray = ref([]);
// 定时切换图片,图片切换时间
let imageInterval;

// 分页条数据模型
const pageNum = ref(1); // 当前页
const total = ref(20); // 总条数
const pageSize = ref(10); // 每页条数

// 当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
  pageNum.value = num;
  ArticleList();
};

const articles = ref([]);
// 存储文章评论数量的映射
const articleCommentsCount = ref({});

import {useTokenStore} from '@/stores/token.js'
const tokenStore = useTokenStore();
// 获取文章分页列表数据
const ArticleList = () => {
  let params = {
    pageNum: pageNum.value,
    pageSize: pageSize.value
  };

  articleInfoServices(params)
      .then(result => {
        // 获取文章分页列表数据，并过滤只显示状态为"已发布"的文章
        const allArticles = result.data.items;
        const publishedArticles = allArticles.filter(article => article.state === '已发布');
        articles.value = publishedArticles;
        total.value = publishedArticles.length; // 更新总数为已发布文章的数量
        isLoading.value = false; // 数据加载完成隐藏骨架屏
        articleManage.setInfo(publishedArticles);
        
        // 更新背景图片数组，只包含已发布文章的图片
        imageArray.value = publishedArticles.filter(article => article.coverImg);
        
        // 初始化背景图片轮播
        if (Array.isArray(imageArray.value) && imageArray.value.length > 0) {
          currentImage.value = imageArray.value[currentImageIndex.value].coverImg;
          // 清除可能存在的旧定时器
          if (imageInterval) clearInterval(imageInterval);
          // 设置新的定时器
          imageInterval = setInterval(() => {
            currentImageIndex.value = (currentImageIndex.value + 1) % imageArray.value.length;
            currentImage.value = imageArray.value[currentImageIndex.value].coverImg;
          }, 10000); // 每10秒切换一次图片
        }

        articles.value.forEach(article => {
          articleCommentsCount.value[article.id] = 0;
          fetchCommentsCount(article.id);
          article.likeCount = 0;
        });
        if(tokenStore.token){
          // 加载点赞数据
          //判断当前用户是否已点赞
          fetchAllLikeData();
          // 加载收藏数据
          //判断当前用户是否已收藏
          fetchAllCollectData();
          // 初始化评论数量
        }
        allCollect();
        allLike();
      })
      .catch(error => {
        console.error('Failed to fetch article list:', error);
      });
};

// 获取评论数量
const fetchCommentsCount = async (articleId) => {
  try {
    let result = await commentList(articleId);
    // 更新评论数量
    articleCommentsCount.value = {
      ...articleCommentsCount.value,
      [articleId]: result.data.length
    };
  } catch (error) {
    console.error('Failed to fetch comments:', error);
  }
};

// 生命周期钩子
onMounted(() => {
  showText();
  ArticleList();
});

onUnmounted(() => {
  clearInterval(textInterval);
  clearInterval(imageInterval);
});

// 获取所有文章的点赞数据（数量+状态）
const fetchAllLikeData = async () => {
  for (const article of articles.value) {
    await getLikeData(article);
  }
};

// 获取单篇文章的点赞数据
const getLikeData = async (article) => {
  try {
    // 获取点赞列表（用于计算数量）
    const result = await articleListByArticleId(article.id);
    article.likeCount = result.data.length;
  } catch (error) {
    console.error(`获取文章点赞数据失败`, error);
  }
};

const fetchAllCollectData=async () => {
  for (const article of articles.value) {
    await getCollectData(article);
  }
};

const getCollectData = async (article) => {
  try {
    // 获取收藏列表（用于计算数量）
    const result = await articleListByCollectId(article.id);
    article.collectCount = result.data.length;
  } catch (error) {
    console.error(`获取文章收藏数据失败`, error);
  }
};

const likeAdd =async (article) => {
  await articleAddLike(article.id);
  await getLikeData(article);
  await allLike();
};


const likeDelete =async (article) => {
  await articleDeleteLike(article.id);
  await getLikeData(article);
  await allLike();
};

const collectAdd =async (article) => {
  await articleAddCollect(article.id);
  await getCollectData(article);
  await allCollect();
};

const collectDelete =async (article) => {
  await articleDeleteCollect(article.id);
  await getCollectData(article);
  await allCollect();
};

const allLike=async () => {
  for (const article of articles.value) {
    const result = await articleLikeListService(article.id);
    article.allLike=result.data.length;
  }
};

const allCollect=async () => {
  for (const article of articles.value) {
    const result = await articleCollectListService(article.id);
    article.allCollect=result.data.length;
  }
};



let end = '_';
const dropClick = () => {
  window.scrollTo({
    top: 850,
    behavior: 'smooth'
  });
};
</script>

<template>
  <!-- 背景图片 -->
  <div class="image-wrapper">
    <!-- 图片 -->
    <transition name="fade" mode="out-in">
      <img v-lazy="currentImage" alt="首页图片" class="limit-img-size" :key="currentImage">
    </transition>
    <!-- 文字显示区域 -->
    <div class="text-container">“{{ displayedText }}{{end}}”</div>
  </div>
  <div class="blank-container">
<!--下拉箭头-->
    <div class="arrow-drop">
      <div class="arrow-wrapper bounce-arrow">
        <div class="custom-arrow" @click="dropClick()"></div>
      </div>
    </div>
    <div style="z-index: 1">
      <Wave/>
    </div>
  </div>
  <!--  内容区域-->
  <div class="image-container">
    <!-- 新增的方框 -->
    <el-container>
      <!-- 左边博客文章 -->
      <el-aside width="75%">
        <div class="left-article">
          <div class="left-article-welcome">
            <h1 style="text-align: center;">禁止发无关评论，人机评论，违者永久封禁！！！</h1>
          </div>
          <el-divider>
            推荐
          </el-divider>
          <!--轮播图-->
          <CarouselImage/>
          <el-divider>
            文章
          </el-divider>
          <!-- 骨架屏占位，即文章在未加载出来时显示-->
          <el-skeleton
              v-show="isLoading"
              :rows="3"
              :items="5"
              class="article-skeleton"
          >
          </el-skeleton>
          <!-- 循环渲染多篇文章 -->
          <div class="el-card "  v-show="!isLoading"  v-for="(article, index) in articles" :key="article.id">
            <div :class="['article-layout', { 'image-left': index % 2 === 0, 'image-right': index % 2 === 1 }]">
              <div class="article-image-wrapper" @click="$router.push(`/homes/articleComment/${article.id}`)">
                <img v-lazy="article.coverImg" alt="文章图片" class="articlePage">
                <!-- 使用 getCategoryName 函数获取分类名 -->
                <div class="article-category">{{ getCategoryName(article.categoryId) }}</div>
              </div>
              <div class="articleContent">
                <div class="article-title-wrapper">
                  <span style="font-family: Verdana, sans-serif;font-size: 1.2em;font-weight: 600;">
                    {{article.title }}
                  </span>
                </div>
                <div class="article-stats-wrapper">
                  <span>
                     <SvgIcon iconClass="icon-pinglun" @click="$router.push(`/homes/articleComment/${article.id}`)" style=" width: 1.5em;height: 1.5em; vertical-align: -0.3em;"/>
                    评论: {{ articleCommentsCount[article.id] || 0 }}

                    <!-- 点赞图标及点击事件 -->
                     <SvgIcon
                         @click="article.likeCount===0 ? likeAdd(article) : likeDelete(article) "
                         icon-class="icon-dianzan"
                         :className="article.likeCount===1 ? 'icon-dianzan-active' : 'svg-icon'"
                         style=" width: 2.2em;height: 2.2em; vertical-align: -0.65em; cursor: pointer;"
                     />
                    点赞: {{ article.allLike || 0 }}

                     <SvgIcon
                         @click="article.collectCount===0 ? collectAdd(article) : collectDelete(article) "
                         iconClass="icon-shoucang2"
                         :className="article.collectCount===1 ? 'icon-shoucang-active' : 'svg-icon'"
                         style=" width: 1.5em;height: 1.5em; vertical-align: -0.3em;"/>
                    收藏: {{ article.allCollect || 0 }}
                  </span>
                </div>
                <div class="article-summary-wrapper">
                  <div v-html="getShortContent(article.content)"></div>
                </div>
                <div class="article-time-wrapper">
                  <span>发布于:{{ article.createTime }}&nbsp;&nbsp;更新于:{{ article.updateTime }}</span>
                </div>
              </div>
            </div>
          </div>
          <el-divider>
            --到达页面底部啦--
          </el-divider>
          <!-- 分页条 -->
          <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize"
                         layout="prev, pager, next" background :total="total"
                         @current-change="onCurrentChange" style="margin-top: 20px; justify-content: center"/>
        </div>
      </el-aside>
      <!-- 右边博客头像和小组件显示 -->
      <el-main>
        <div class="right-userLogo">
          <!-- 这里可以添加博客头像和小组件内容 -->
          <home-right/>
        </div>
      </el-main>
    </el-container>
    <div style="width: 100%">
      <Footer/>
    </div>
  </div>
</template>

<style lang="scss" scoped>


/*图片位置*/
.image-wrapper {
  position: fixed;
  display: flex;
  width: 100%;
  overflow: hidden; /* 防止图片溢出容器 */

  /* 不同屏幕尺寸下背景图片容器的高度 */
  @media (min-width: 1200px) {
    height: 100vh;
  }
  @media (min-width: 992px) and (max-width: 1199px) {
    height: 400px;
  }
  @media (min-width: 768px) and (max-width: 991px) {
    height: 300px;
  }
  @media (max-width: 767px) {
    height: 200px;
  }

  /*图片*/
  .limit-img-size {
    width: 100%;
    height: 100%;
    object-fit: cover; /* 保持图片的纵横比并覆盖整个容器 */
    object-position: center; /* 图片居中显示 */
  }

  /*文字*/
  .text-container {
    position: absolute;
    width: auto;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 90%; /* 最大不超过父容器90%，防止溢出屏幕 */
    color: var(--bg);
    font-size: clamp(1.5rem, 5vw, 2.5rem);
    text-align: center;
    justify-content: center;
    align-content: center;
    z-index: 1;
    background: rgba(255, 255, 255, 0.5);
    padding: 0.5em;
    border-radius: 0.5em;
    white-space: nowrap; /* normal允许换行（原样式是nowrap不允许换行，会导致溢出） */
    line-height: 1.5;
    animation: titleScale 1s;
    font-family: "Fredericka the Great", Mulish, -apple-system, "PingFang SC", "Microsoft YaHei",
    sans-serif;

    text-shadow: 0 1px 0 hsl(174, 5%, 80%), 0 2px 0 hsl(174, 5%, 75%),
    0 3px 0 hsl(174, 5%, 70%), 0 4px 0 hsl(174, 5%, 66%),
    0 5px 0 hsl(174, 5%, 64%), 0 6px 0 hsl(174, 5%, 62%),
    0 7px 0 hsl(174, 5%, 61%), 0 8px 0 hsl(174, 5%, 60%),
    0 0 5px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.2),
    0 3px 5px rgba(0, 0, 0, 0.2), 0 5px 10px rgba(0, 0, 0, 0.2),
    0 10px 10px rgba(0, 0, 0, 0.2), 0 20px 20px rgba(0, 0, 0, 0.3);
    @media (max-width: 480px) {
      padding: 0.3em; /* 减小内边距，节省空间 */
      font-size: clamp(1.2rem, 4vw, 1.8rem); /* 进一步限制最小/最大字体 */
      line-height: 1.3; /* 减小行高，避免换行后占用过多高度 */
    }
  }
}

.blank-container {
  position: relative;
  display: flex;
  width: 100%;
  overflow: hidden; /* 防止图片溢出容器 */
  background-color: rgba(255, 255, 255, 0);

  /* 不同屏幕尺寸下背景图片容器的高度 */
  @media (min-width: 1200px) {
    height: 100vh;
  }
  @media (min-width: 992px) and (max-width: 1199px) {
    height: 400px;
  }
  @media (min-width: 768px) and (max-width: 991px) {
    height: 300px;
  }
  @media (max-width: 767px) {
    height: 200px;
  }

  .arrow-drop {
    position: absolute;
    bottom: 160px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
  }

  // 新增：箭头外层容器（仅负责上下位移）
  .arrow-wrapper {
    // 这个容器不旋转，只做垂直方向的动画位移
  }

  // 箭头本身（仅负责旋转和显示）
  .custom-arrow {
    width: 80px;
    height: 80px;
    border-right: 5px solid #409eff;
    border-bottom: 5px solid #409eff;
    transform: rotate(45deg); // 仅箭头旋转45度朝下
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: #66b1ff;
      transform: rotate(45deg) scale(1.1);
    }
  }

  // 动画作用于外层容器（无旋转，位移是纯垂直方向）
  .bounce-arrow {
    animation: bounce 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
  }

  // 关键：动画只控制Y轴位移（无旋转）
  @keyframes bounce {
    0% {
      transform: translateY(0);
      animation-timing-function: ease-out;
    }
    15% {
      transform: translateY(20px); // 纯垂直向下移动
      animation-timing-function: ease-in;
    }
    25% {
      transform: translateY(8px);
      animation-timing-function: ease-out;
    }
    35% {
      transform: translateY(10px);
      animation-timing-function: ease-in;
    }
    100% {
      transform: translateY(0);
    }
  }
}

/*内容位置*/
.image-container {
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column; /* 设置为垂直排列 */
  justify-content: center;
  align-items: center;
  background-color: var(--bg);

  .el-container {
    display: flex;
    width: 80%;
    margin: 10px;

    .el-aside {
      .left-article {
        padding: 10px;
        background-color:var(--card-bg);
        height: auto;
        border-radius: 15px;
      }

      .left-article-welcome {
        margin-top: 20px;
        padding: 10px;
        background-color: var(--card-bg);
        height: auto;
        border-radius: 15px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid rgba(0, 0, 0, 0.1);
      }

      .el-card {
        margin-bottom: 10px;
        display: flex;
        border-radius: 15px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        height: 250px; // 确保每个卡片高度一致
        flex-direction: row;
        .article-layout {
          display: flex;
          width: 100%;
        }

        /*从左往右*/
        .image-left {
          flex-direction: row;
        }

        /*从右往左*/
        .image-right {
          flex-direction: row-reverse;
        }

        .article-image-wrapper {
          position: relative;
          width: 50%;
          height: 100%;
          overflow: hidden; // 防止图片溢出容器
        }

        .articlePage {
          width: 100%;
          height: 100%;
          flex: 5;
          object-fit: cover;
          transition: transform 0.3s cubic-bezier(0, 1.51, 0.72, 1.8);// 添加过渡效果
          /*鼠标悬浮*/
          &:hover {
            cursor: pointer;
            transform: scale(1.1); // 鼠标悬浮时图片放大到1.1倍
          }
        }

        .article-category {
          position: absolute;
          top: 10px;
          left: 10px;
          color: #ebefef;
          padding: 5px 10px;
          border-radius: 5px;
          z-index: 1;
        }

        .articleContent {
          flex: 5;
          width: 50%;
          margin: 0;
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: var(--text);
          background-color: var(--bg);


        .article-title-wrapper {
          height: 20%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          span{
            &:hover{
              color: #2977ef;
              cursor: pointer;
            }
          }
        }

        .article-summary-wrapper {
          height: 60%;
          overflow: hidden;
          padding-right: 10px; /* 为滚动条留出空间 */
          text-overflow: ellipsis;
         /* white-space: nowrap;：防止文本换行，确保省略号生效。*/
        }

        .article-time-wrapper {
          height: 20%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .article-stats-wrapper {
          height: 20%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 14px;
          font-weight: bold;
        }
        }
      }

      @media screen and (max-width: 900px) {
        .el-card{
          .article-layout{
            flex-direction: column;
          }
          .article-image-wrapper{
            flex: 5;
            width: 100%;
            position: relative;
            height: 100%;
            overflow: hidden; // 防止图片溢出容器
          }

          .articleContent {
            flex: 5;
            margin: 0;
            width: 100%;
            padding: 10px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            .article-title-wrapper {
              flex: 0.25;
            }

            .article-summary-wrapper {
              flex: 0.25;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              max-height: 100%;
            }

            .article-time-wrapper {
              flex: 0.25;
            }

            .article-stats-wrapper {
              flex: 0.25;
            }
          }
          /*从左往右*/
          .image-left {
            flex-direction: column;
          }

          /*从右往左*/
          .image-right {
            flex-direction: column;
          }

          .articlePage {
            width: 100%;
            height: 100%;
            flex: 5;
            object-fit: cover;
          }
        }
      }
    }
  }

  .el-main {
    margin: 0;
    padding: 0;

    .right-userLogo {
      padding: 0 10px 0 20px;
      overflow: hidden;
    }
  }
}

@media screen and (max-width: 900px) {
  .image-container .el-container {
    width: 100%;
  }

  .image-container .el-container .el-aside {
    width: 100%;
  }

  .image-container .el-container .el-main {
    display: none;
  }
}
</style>