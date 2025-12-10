<!--前台组件-->

<script lang="js" setup>
import {ref,computed, onMounted, onUnmounted, watch} from 'vue';
//import useUserInfoStore from '@/stores/userInfo.js';
import {
  HomeFilled,
  Files,
  Avatar,
  User,
  SwitchButton,
  Close,
  Clock,
  DocumentCopy,
  IceCreamRound,
  Fries,
  Postcard,
  Link,
  PictureFilled,
  Operation, ArrowUpBold, Headset, Moon, Sunny
} from '@element-plus/icons-vue';
import {useRouter,useRoute} from 'vue-router';
import {useTokenStore} from "@/stores/token.js"
import useUserInfoStore from "@/stores/userInfo.js";
import {ElMessage, ElMessageBox, ElTooltip} from "element-plus";
import {userInfoServices} from "@/api/user.js";
import {articleListController} from "@/api/article.js";
import articleInfoStore from "@/stores/ArticleInfo.js";
import MoveMenu from "@/components/MoveMenu.vue";
import commentInfoStore from '@/stores/CommentInfo.js'
import {commentCountService} from "@/api/comment.js";
import SvgIcon from "@/components/SvgIcon.vue";
const route = useRoute();
const activeMenu = ref(route.path)
//调用函数,获取所有文章详细信息
const userInfoStore = useUserInfoStore();
const tokenStore = useTokenStore();
const mobileMenuVisible = ref(false);
// 调用函数，获取用户详细信息,异步调用，导致组件先加载，后加载getUserInfo
const getUserInfo = async () => {
  try {
    // 调用接口
    if (tokenStore) {
      let result = await userInfoServices();
      // 数据存储到pinia中
      userInfoStore.setInfo(result.data);
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
}
onMounted(() => {
  if (tokenStore.token === '') {
    return;
  }
  getUserInfo();
})

//得到评论总数
const commentInfo = commentInfoStore();
const CommentList = async () => {
  let result = await commentCountService();
  commentInfo.setInfo(result.data);
};
CommentList();

const articleManage = articleInfoStore();
const getArticleInfo = async () => {
  //调用接口
  let result = await articleListController();
  articleManage.setInfo(result.data);
};

getArticleInfo();

//const userInfoStore = useUserInfoStore();
const router = useRouter();

// 用于记录上一次滚动的位置
const lastScrollTop = ref(0);
// 用于标记是否向下滚动
const isScrollingDown = ref(false);

const handleScroll = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  isScrollingDown.value = scrollTop > lastScrollTop.value;
  //重新记录上一次滚动的位置
  lastScrollTop.value = scrollTop;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

const handleCommand = (command) => {
  if (command === 'logout') {
    //退出登录
    ElMessageBox.confirm(
        '你确认要退出登录吗?',
        '温馨提示',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )
        .then(async () => {
          //退出登录
          //1.清空pinia中存储的token以及个人信息
          tokenStore.removeToken()
          userInfoStore.removeInfo()
          //清空浏览器缓存
          if ('caches' in window) {
            caches.keys().then((cacheNames) => {
              cacheNames.forEach((cacheName) => {
                caches.delete(cacheName)
              })
            })
          }

          //2.跳转到主页面
          await router.push('/')
          ElMessage({
            type: 'success',
            message: '退出登录成功'
          })
        })
        .catch(() => {
          ElMessage({
            type: 'info',
            message: '用户取消了退出登录'
          })
        })
  } else {
    //路由
    router.push('/homes/' + command)
  }
}

// 定义响应式状态
const isShow = ref(true)

// 创建定时器引用
let timer = null

// 组件挂载后启动定时器
onMounted(() => {
  timer = setTimeout(() => {
    isShow.value = false
  }, 4000)
})

// 组件卸载前清除定时器
onUnmounted(() => {
  clearTimeout(timer)
})

const isMobile = ref(window.innerWidth <= 1200);
const drawer = ref(false);
// 监听窗口尺寸变化
watch(() => window.innerWidth, (newWidth) => {
  isMobile.value = newWidth <= 1200;
  if (!isMobile.value) {
    // 切换到桌面端时关闭移动端菜单
    mobileMenuVisible.value = false;
  }
});

const allArticles = computed(() => articleManage.info) // 假设articleInfo是存储文章的数组

// 搜索相关状态
const searchQuery = ref('')
const filteredArticles = ref([])
const showResults = ref(false)
const loading = ref(false)


// 处理输入实时搜索
const handleInput = () => {
  if (searchQuery.value.trim() === '') {
    filteredArticles.value = []
    showResults.value = false
    return
  }

  // 执行模糊搜索（不区分大小写）
  filteredArticles.value = allArticles.value.filter(article => {
    return article.title.toLowerCase().includes(searchQuery.value.toLowerCase().trim())
  })
  loading.value = true
  showResults.value = true
}

// 处理搜索按钮点击
const handleSearch = () => {
  if (searchQuery.value.trim() === '') return
  handleInput() // 复用输入处理逻辑
}

// 监听点击外部关闭结果面板
watch(searchQuery, (newVal) => {
  if (newVal === '') {
    showResults.value = false
    searchQuery.value = ''
  }
})

// 点击外部关闭结果面板的逻辑
document.addEventListener('click', (e) => {
  const searchContainer = document.querySelector('.search-container')
  if (!searchContainer?.contains(e.target)) {
    showResults.value = false
    searchQuery.value = ''
  }
})

import {darkStore} from "@/stores/darkInfo.js";
const darkstore = darkStore();
// 主题切换
 const isDark = ref(darkstore.isDark)
</script>

<template>
  <div class="el-alter">
    <transition name="slide-up-down">
      <el-alert title="欢迎来到我的个人博客" effect="light" v-show="isShow"/>
    </transition>
    <transition name="slide-up-down">
      <el-alert title="部分网页还未完善" effect="light" v-show="isShow"/>
    </transition>
  </div>
  <el-container class="layout-container">
    <div class="common-layout">
      <!-- 导航栏 -->
      <el-menu
          class="nav-bar"
          mode="horizontal"
          router
          :style="{ transform: isScrollingDown ? 'translateY(-100%)' : 'translateY(0)' }"
          :default-active="activeMenu"
      >
         <span class="menu-icon" @click="drawer = !drawer">
            <el-icon><Operation /></el-icon>
          </span>
        <div class="left-container" >
          <div class="desktop-menu" v-if="!mobileMenuVisible">
            <el-tooltip placement="bottom">
              <div class="logo" @click="router.push('/')">
                My-blog
              </div>
              <template #content>
              点击返回首页
              </template>
            </el-tooltip>
          <el-menu-item index="/homes/home">
            <el-icon>
              <HomeFilled/>
            </el-icon>
            首页
          </el-menu-item>
            <el-sub-menu index="1" popper-class="custom-submenu-popper" >
              <template #title>
                <el-icon>
                  <Files/>
                </el-icon>
                归档
              </template>
              <el-menu-item index="/homes/timeline">
                <el-icon>
                  <Clock/>
                </el-icon>
                时间轴
              </el-menu-item>
              <el-menu-item index="/homes/category">
                <el-icon>
                  <DocumentCopy/>
                </el-icon>
                分类
              </el-menu-item>
            </el-sub-menu>
            <el-sub-menu index="2"  popper-class="custom-submenu-popper" >
              <template #title>
                <el-icon>
                  <IceCreamRound/>
                </el-icon>
                其他
              </template>
                <el-menu-item index="/tree-hole">
                  <el-icon>
                    <Fries/>
                  </el-icon>
                  树洞
                </el-menu-item>
                <el-menu-item index="/message">
                  <el-icon>
                    <Postcard/>
                  </el-icon>
                  留言板
                </el-menu-item>
              <el-menu-item index="/homes/music">
                <el-icon><Headset /></el-icon>
                音乐
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item index="/homes/friendLink">
              <el-icon>
                <Link/>
              </el-icon>
              友链
            </el-menu-item>
          <el-menu-item index="/homes/about">
            <el-icon>
              <Avatar/>
            </el-icon>
            关于
          </el-menu-item>
            <el-menu-item index="/homes/photo">
              <el-icon>
                <PictureFilled/>
              </el-icon>
              相册
            </el-menu-item>
        </div>
        </div>
        <div class="right-container">
          <div class="theme-toggle">
            <el-switch
                v-model="isDark"
                size="large"
                inline-prompt
                :active-icon="Moon"
                :inactive-icon="Sunny"
                active-color="#30354d"
                inactive-color="#f7d046"
                @change="darkstore.toggleDark()"
            />
            <span class="theme-label">{{ isDark ? '夜间' : '日间' }}</span>
          </div>
          <div class="input-wrapper">
            <button class="icon">
              <SvgIcon icon-class="icon-sousuo"
                       style=" width: 40px;height: 40px;"></SvgIcon>
            </button>
            <input type="text" name="text" class="input" placeholder="文章搜索.."
                   v-model="searchQuery"
                   @input="handleInput"
                   @keyup.enter="handleSearch"/>

            <!-- 搜索结果区域 -->
            <div class="search-results" v-if="showResults">
              <!-- 加载动画 - 在加载状态时显示 -->
              <div class="loading" v-if="isLoading">
                <div class="spinner"></div>
                <p>正在搜索...</p>
              </div>

              <!-- 搜索结果 - 加载完成后显示 -->
              <template v-else>
                <div v-if="filteredArticles.length" class="result-list">
                  <div class="result-item" v-for="article in filteredArticles" :key="article.id"
                       @click="$router.push(`/homes/articleComment/${article.id}`)">
                    {{ article.title }}
                  </div>
                </div>
                <div v-else class="no-results">
                  没有找到匹配的文章
                </div>
              </template>
            </div>
          </div>

          <template v-if="tokenStore.token===''">
            <el-menu-item index="/homes/login">
              <el-tooltip placement="bottom">
                <div class="custom-login">
                  登录
                </div>
                <template #content>
                  点击登录
                </template>
              </el-tooltip>

            </el-menu-item>
          </template>
          <template v-else>
            <el-dropdown placement="bottom-end" @command="handleCommand">
                    <span class="el-dropdown__box">
                        <el-avatar :src="userInfoStore.info.userPic?userInfoStore.info.userPic:null"/>
                    </span>
              <!--下拉菜单，command:条目被点击后会转发，在事件函数上可以声明一个参数，接收条目对应的指令-->
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logined" :icon="User">个人主页</el-dropdown-item>
                  <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </div>
      </el-menu>
      <!-- 中间区域 -->
      <el-main style="padding: 0;margin: 0;">
        <router-view></router-view>
      </el-main>
      <!-- 页脚 -->
    </div>
  </el-container>
  <el-drawer
      v-model="drawer"
      :with-header="true"
      size="50%"
      direction="ltr"
      :show-close="false"
      class="drawer-panel"
  >
    <template #header>
      <span style="font-size: 1.2rem">导航</span>
      <el-button :icon="Close" style="background: none;font-size: 1.5rem;width: 30px;border: none"
                 @click="drawer = false"/>
    </template>
    <template #default>
      <MoveMenu @update:closeDrawer="drawer = false"/>
    </template>
  </el-drawer>
  <el-backtop :visibility-height="0" :bottom="30">
    <div
        style="
        height: 100%;
        width: 100%;
        background-color: rgba(255,255,255,0);
        text-align: center;
        line-height: 40px;
        color: #1989fa;
      "
    >
      <el-icon><ArrowUpBold /></el-icon>
    </div>
  </el-backtop>
</template>

<style scoped lang="scss">

.el-alter {
  /*从右边划入的动画*/
  display: flex;
  width: 300px;
  position: fixed;
  top: 70px;
  right: 0;
  z-index: 1000;
  flex-direction: column;
  /*内部每一个组件的距离*/
  gap: 10px;

  .el-alert {
    height: 60px;
    width: 100%;
    background-color: var(--card-bg);
    color: var(--text);
    border-radius: 10px;
    box-shadow: 0 2px 4px var(--shadow);
  }

  .slide-up-down-enter-from,
  .slide-up-down-leave-to {
    transform: translateY(-100%); /* 进入前从下方隐藏，退出后滑到上方隐藏 */
    opacity: 0;
  }

  .slide-up-down-enter-to,
  .slide-up-down-leave-from {
    transform: translateY(0); /* 进入后到达目标位置，退出前在目标位置 */
    opacity: 1;
  }

  .slide-up-down-enter-active,
  .slide-up-down-leave-active {
    transition: all 0.6s ease; /* 过渡时间和曲线 */
    position: absolute; /* 确保动画期间元素定位稳定 */
  }
}

.common-layout {
  height: 100%;
  width: 100%;
}

.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--nav-bg);
  backdrop-filter: blur(10px); /* 添加模糊效果 */
  -webkit-backdrop-filter: blur(10px); /* Safari 兼容性 */
  border-bottom: 1px solid var(--border);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  z-index: 1000;
  transition: transform 0.3s ease; /* 添加过渡效果 */
  .menu-icon  {
    display: none;
  }
  .desktop-menu {
    display: flex;
    align-items: center;
    width: 100%;
    height: 56px;
    @media screen and (max-width: 1200px) {
      display: none !important; /* 移动端隐藏桌面菜单 */
    }
  }


  @media screen and (max-width: 1200px) {
    .menu-icon {
      display: block;
      font-size: 20px;
      font-weight: bold;
      margin: 10px;
      cursor: pointer;
    }
  }


  .left-container {
    height: 100%;
    display: flex;
    /*放于导航栏的左边*/
    align-items: center;

    .logo {
      font-size: 20px;
      font-weight: bold;
      cursor: pointer;
      width: 100%;
      height: 100%;
      line-height: 56px; /* 与导航栏高度一致 */
      padding: 0 20px;
      color: var(--text);
    }
    .el-menu-item {
      height: 100%;
      line-height: 56px; /* 与导航栏高度一致 */
      padding: 0 20px;
      position: relative; /* 为伪元素定位 */

      /* 移除原来的border-bottom，改为在hover时使用伪元素 */
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background-color: var(--accent);
        transition: width 0.3s ease; /* 控制宽度变化的动画 */
      }
      //
      &:hover::after {
        width: 100%; /* 鼠标悬停时宽度从0增长到100% */
      }
      &.is-active {
        color: var(--text);
      }
      &:hover {
        color: var(--text);
        background-color: rgba(255, 255, 255, 0);
      }
    }

    .el-sub-menu{
      .el-menu-item {
        height: 100%;
        line-height: 56px; /* 与导航栏高度一致 */
        position: relative; /* 为伪元素定位 */
        &.is-active {
          color: var(--text);
        }
        &:hover {
          background-color: rgba(255, 255, 255, 0);
        }
      }
      :hover{
        background-color: rgba(255, 255, 255, 0);
      }
    }
  }

  .right-container {
    height: 100%;
    display: flex;
    align-items: center;
    margin-right: 10px;

    .el-menu-item {
      height: 100%;
      line-height: 56px; /* 与导航栏高度一致 */
      padding: 0 20px;
      position: relative; /* 为伪元素定位 */
      color: var(--text);

      &.is-active {
        color: var(--text);
      }
      &:hover {
        color: var(--text);
        background-color: rgba(255, 255, 255, 0);
      }
    }

    .custom-login {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: var(--text);
      &:hover {
        background-color: rgba(170, 163, 170, 0.56);
      }
    }
  }
}

.el-dropdown__box {
  display: flex;
  align-items: center;

  &:active,
  &:focus {
    outline: none;
  }
}

.custom-submenu-popper {
border: 1px solid #e0e0e0 !important;
border-radius: 6px !important;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;

/* 菜单项样式 */
.el-menu-item {
  color: #333 !important;

  &:hover {
    background-color: #eee !important;
    color: #824af1 !important;
  }

  &.is-active {
    background-color: #f0eef8 !important;
    color: #824af1 !important;
  }
}
}

.el-menu--horizontal .el-menu-item:not(.is-disabled):focus,
.el-menu--horizontal .el-menu-item:not(.is-disabled):hover {
  background-color: transparent !important; /* 取消背景色变化 */
  /*color: inherit !important; !* 取消文字颜色变化，继承父元素颜色 *!*/
  outline: none; /* 移除聚焦时的轮廓线 */
}

.input-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  position: relative;
}

.input {
  border-style: none;
  height: 50px;
  width: 50px;
  padding: 10px 40px 10px 10px;
  outline: none;
  border-radius: 50%;
  transition: 0.5s ease-in-out;
  background-color: rgba(0, 0, 0, 0);
  color: var(--text);
}

.input::placeholder,
.input {
  font-family: "Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande",
  "Lucida Sans", Arial, sans-serif;
  font-size: 17px;
}

.input::placeholder {
  color: var(--muted);
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  right: 0;
  cursor: pointer;
  width: 50px;
  height: 50px;
  outline: none;
  border-style: none;
  border-radius: 50%;
  pointer-events: painted;
  background-color: transparent;
  transition: 0.2s linear;
}

.icon:focus ~ .input,
.input:focus {
  box-shadow: none;
  width: 250px;
  border-radius: 0;
  background-color: transparent;
  border-bottom: 3px solid var(--accent);
  transition: all 500ms cubic-bezier(0, 0.11, 0.35, 2);
}

.search-results {
  background-color: var(--card-bg);
  box-shadow: 0 4px 12px var(--shadow);
  backdrop-filter: blur(10px);
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  border-top: none;
  border-radius: 0 0 4px 4px;
  z-index: 100;
  max-height: 300px;
  overflow: hidden;
}

.result-list {
  padding: 8px 0;
}

.result-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  &:hover{
    color: var(--accent);
    transform: scale(1.02);
  }
}

.no-results {
  padding: 16px;
}

/* 加载动画样式 */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  color: var(--muted);
}

/* 旋转动画 */
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0.5rem;
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 12px;

  .theme-label {
    font-size: 13px;
    color: var(--text);
  }
}

:global(body) {
  background-color: var(--bg);
  color: var(--text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

:global(.drawer-panel .el-drawer__header) {
  margin-bottom: 0;
  padding: 16px;
  background: #0f111a;
  color: #ffffff;
  border-bottom: 1px solid var(--border);
}

:global(.drawer-panel .el-drawer__body) {
  background: #0f111a;
  color: #ffffff;
  padding: 0;
}

:global(.drawer-panel .el-menu) {
  background: transparent;
  color: #ffffff;
  border-right: none;
}

:global(.drawer-panel .el-menu-item),
:global(.drawer-panel .el-sub-menu__title) {
  color: #ffffff;
}

:global(.drawer-panel .el-menu-item:hover),
:global(.drawer-panel .el-sub-menu__title:hover) {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

:global(.drawer-panel .el-menu-item.is-active) {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

:global(.drawer-panel .el-icon) {
  color: #ffffff;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>