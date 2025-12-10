<!--后台组件-->
<script lang="js" setup>
import {
  Management,
  Promotion,
  UserFilled,
  User,
  Crop,
  EditPen,
  SwitchButton,
  CaretBottom, ChatLineRound,
  Coin, Histogram, Grid, ChatLineSquare, Link, PictureFilled, Postcard
} from '@element-plus/icons-vue'
import fsy from '@/assets/fsy.png'
import {userInfoServices} from '@/api/user.js'
import useUserInfoStore from '@/stores/userInfo.js'
import {useTokenStore} from '@/stores/token.js'

const tokenStore = useTokenStore();
const userInfoStore = useUserInfoStore();
//调用函数,获取用户详细信息
const getUserInfo = async () => {
  //调用接口
  let result = await userInfoServices();
  //数据存储到pinia中
  userInfoStore.setInfo(result.data);
}

getUserInfo();
import {watch } from 'vue'  // 确保导入watch
import {useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from "element-plus";
const router = useRouter();
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
    router.push('/user/' + command)
  }
}

const backHome = () => {
  router.push('/')
}

// 新增导入
import { useTagsViewStore } from '@/stores/tagsView.js'

// 新增store实例
const tagsViewStore = useTagsViewStore()

// 监听路由变化，添加标签
watch(
    () => router.currentRoute.value,
    (newRoute) => {
      // 排除首页等不需要显示的路由
      if (newRoute.path !== '/') {
        tagsViewStore.setTagsItem({
          title: newRoute.meta.title || newRoute.name,
          path: newRoute.path,
          name: newRoute.name
        })
      }
    },
    { immediate: true }
)

// 标签页操作方法
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
  tagsViewStore.delTagsItem(index)
}

const goToTag = (path) => {
  router.push(path)
}


import Loading from '@/components/Loading.vue' // 确保路径正确
import { useLoadingStore } from '@/stores/loading'

// 初始化加载状态 store
const loadingStore = useLoadingStore()

// 监听路由变化控制加载状态
watch(
    () => router.currentRoute.value,
    (newRoute, oldRoute) => {
      // 路由开始切换时显示加载
      if (newRoute.path !== oldRoute?.path) {
        loadingStore.setLoading(true)
      }

      // 延迟隐藏加载（确保组件渲染完成）
      const timer = setTimeout(() => {
        loadingStore.setLoading(false)
        clearTimeout(timer)
      }, 300)
    },
    { immediate: true }
)

</script>

<template>
  <el-header class="header-container">
    <!-- 左侧区域：Logo + 导航 -->
    <div class="header-left">
      <!-- Logo -->
      <div class="header-logo">fsy-blog</div>
      
      <!-- 导航栏 -->
      <nav class="header-nav">
        <a href="/" class="nav-link" @click.prevent="backHome">
          <el-icon class="nav-icon"><Grid /></el-icon>
          <span class="nav-text">前台首页</span>
        </a>
      </nav>
    </div>

    <!-- 右侧用户区域：用户名 + 头像 + 下拉框 -->
    <div class="header-user-area">
      <strong class="username">{{ userInfoStore.info.username }}</strong>
      <el-dropdown placement="bottom-end" @command="handleCommand" class="user-dropdown">
        <span class="el-dropdown__box" role="button" tabindex="0">
          <el-avatar
              :src="userInfoStore.info.userPic ? userInfoStore.info.userPic : fsy"
              size="small"
          />
          <el-icon class="caret-icon"><CaretBottom/></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="info" :icon="User">基本资料</el-dropdown-item>
            <el-dropdown-item command="avatar" :icon="Crop">更换头像</el-dropdown-item>
            <el-dropdown-item command="resetPassword" :icon="EditPen">重置密码</el-dropdown-item>
            <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
  <el-container class="layout-container">
    <!-- 左侧菜单 -->
    <el-aside width="200px">
      <div class="el-aside__logo"></div>
      <el-menu active-text-color="#2129ff" background-color="#fff" text-color="black"
               router>
        <el-menu-item index="/article/category">
          <el-icon><Management/></el-icon>
          <span>文章分类</span>
        </el-menu-item>
        <el-menu-item index="/article/manage">
          <el-icon><Promotion/></el-icon>
          <span>文章管理</span>
        </el-menu-item>
        <el-menu-item index="/user/manage">
          <el-icon><UserFilled /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/roles/manage">
          <el-icon><User/></el-icon>
          <span>角色管理</span>
        </el-menu-item>
        <el-menu-item index="/permission/manage">
          <el-icon><Coin /></el-icon>
          <span>权限管理</span>
        </el-menu-item>
        <el-menu-item index="/comment/manage">
          <el-icon><ChatLineRound /></el-icon>
          <span>评论管理</span>
        </el-menu-item>
        <el-menu-item index="/treeholes/manage">
            <el-icon><ChatLineSquare /></el-icon>
          <span>树洞管理</span>
        </el-menu-item>
        <el-menu-item index="/message/manage">
          <el-icon><Postcard/></el-icon>
          <span>留言管理</span>
        </el-menu-item>
        <el-menu-item index="/friendLinks/manage">
          <el-icon><Link/></el-icon>
          <span>友链管理</span>
        </el-menu-item>
        <el-menu-item index="/photo/manage">
          <el-icon><PictureFilled/></el-icon>
          <span>相册管理</span>
        </el-menu-item>
        <el-sub-menu index="1">
          <template #title>
            <el-icon><Histogram /></el-icon>
            <span>组件</span>
          </template>
          <el-menu-item index="/calendar">
            <el-icon><Grid /></el-icon>
            <span>日历</span>
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="2">
          <template #title>
            <el-icon><UserFilled/></el-icon>
            <span>个人中心</span>
          </template>
          <el-menu-item index="/user/info">
            <el-icon><User/></el-icon>
            <span>基本资料</span>
          </el-menu-item>
          <el-menu-item index="/user/avatar">
            <el-icon><Crop/></el-icon>
            <span>更换头像</span>
          </el-menu-item>
          <el-menu-item index="/user/resetPassword">
            <el-icon><EditPen/></el-icon>
            <span>重置密码</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <!-- 右侧主区域 -->
    <el-container>
      <!-- 头部区域 -->
      <!-- 新增标签页区域 -->
      <el-tabs
          v-if="tagsViewStore.tagsList.length > 0"
          class="tags-container"
          v-model="router.currentRoute.value.path"
          type="card"
          closable
          @tab-click="goToTag"
          @tab-remove="handleClose"
      >
        <el-tab-pane
            v-for="(tag) in tagsViewStore.tagsList"
            :key="tag.path"
            :label="tag.title"
            :name="tag.path"
        >
          <template #label>
            <div class="tag-item" @click="goToTag(tag.path)">
              <span>{{ tag.title }}</span>
            </div>
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- 中间区域 -->
      <el-watermark content="Fsy-Blog">
      <el-main>
        <Loading />
        <router-view v-slot="{ Component, loading }">
          <template v-if="loading">
            <Loading />
          </template>
          <template v-else>
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </template>
        </router-view>
      </el-main>
      </el-watermark>
      <!-- 底部区域 -->
      <el-footer>个人博客后台 ©2025 Created by 不良人fsy</el-footer>
    </el-container>
  </el-container>
</template>

<style lang="scss" scoped>

.header-container {
  background-color: #090b33;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #ffffff;
  padding: 0 20px !important; /* 增加左右内边距，避免贴边 */
  box-sizing: border-box;

  /* 左侧区域：Logo + 导航 */
  .header-left {
    display: flex;
    align-items: center;
    gap: 20px; /* Logo与导航栏之间的间距 */
  }

  /* Logo 样式 */
  .header-logo {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 1px;
  }

  /* 导航栏样式 */
  .header-nav {
    display: flex;
    align-items: center;
    height: 100%;
  }

  /* 导航链接样式 */
  .nav-link {
    display: flex;
    align-items: center;
    height: 50px; /* 与el-header高度完全一致 */
    padding: 0 16px;
    color: #ffffff;
    text-decoration: none;
    transition: background-color 0.3s ease;
    font-size: 14px;
    position: relative;
    box-sizing: border-box;
    border: none;

    &:hover {
      background-color: rgba(255, 255, 255, 0.08);
    }

    .nav-icon {
      font-size: 14px;
      margin-right: 8px;
    }

    .nav-text {
      font-size: 14px;
      font-weight: 500;
    }
  }

  /* 增加点击交互反馈 */
  .nav-link:active {
    background-color: rgba(255, 255, 255, 0.12);
  }

  /* 右侧用户区域：用户名 + 头像 + 下拉框 */
  .header-user-area {
    display: flex;
    align-items: center;
    gap: 12px; /* 用户名与头像之间的间距，可调整 */
  }

  /* 用户名样式 */
  .username {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap; /* 禁止用户名换行 */
    max-width: 120px; /* 限制最大宽度，避免过长溢出 */
    overflow: hidden;
    text-overflow: ellipsis; /* 溢出显示省略号 */
  }

  /* 下拉框样式优化 */
  .user-dropdown {
    display: flex;
    align-items: center;

    .el-dropdown__box {
      display: flex;
      align-items: center;
      padding: 2px 6px;
      border-radius: 20px; /* 圆角优化，更美观 */
      transition: background-color 0.2s;
      cursor: pointer;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1); /* hover 背景高亮 */
      }

      .el-avatar {
        width: 32px !important;
        height: 32px !important; /* 头像大小适配头部高度 */
        border: 1px solid rgba(255, 255, 255, 0.3); /* 边框点缀，提升辨识度 */
      }

      .caret-icon {
        color: #f1ebeb;
        margin-left: 6px; /* 缩小箭头与头像间距 */
        font-size: 14px;
      }
    }

    /* 下拉菜单样式优化（适配深色主题） */
    .el-dropdown-menu {
      min-width: 140px;
      background-color: #111449 !important; /* 深色下拉菜单，与头部主题一致 */
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      color: #ffffff !important;

      .el-dropdown-item {
        color: #ffffff !important;
        font-size: 13px;
        padding: 6px 16px !important;

        &:hover {
          background-color: rgba(255, 255, 255, 0.1) !important; /* hover 高亮 */
          color: #ffffff !important;
        }

        .el-icon {
          margin-right: 8px !important;
          font-size: 14px !important;
        }
      }
    }
  }
}


.tagList {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background-color: #ffffff;
}


.layout-container {
  background-color: white;
  height: calc(100vh - 60px);

  .el-aside {
    background-color: #ffffff;
    border-right: 1px solid #e6e6e6;
    box-shadow: 1px 0 3px rgba(0, 0, 0, 0.08);
    .el-menu {
      border-right: none;
    .el-menu-item {
      height: 40px !important;
      line-height: 40px !important;
    }

      //鼠标悬浮时的字体颜色
      .el-menu-item:hover {
        color: #2129ff;
      }
    }
  }

  .el-main{
    height: calc(80vh - 36px);
    position: relative; /* 新增 */
  }

  .el-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #666;
  }
}


// 新增标签页样式
.tags-container {
  border-bottom: 1px solid #e6e6e6;
  .tag-item {
    display: flex;
    align-items: center;
    gap: 4px;
    .close-icon {
      font-size: 12px;
      opacity: 0.7;
      &:hover {
        opacity: 1;
      }
    }
  }
  :deep(.el-tabs__nav-wrap::after)
  {
    height: 0 !important;
  }
  :deep( .el-tabs__item) {
    height: 34px;
    line-height: 34px;
    margin: 0 2px;
  }
  :deep(.el-tabs__append) {
    padding: 0 10px;
  }
}
</style>
