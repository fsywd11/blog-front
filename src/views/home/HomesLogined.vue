<script setup>
import HomeRight from '@/components/homeRight.vue';
import Footer from "@/components/footer.vue";
import UserInfo from "@/views/user/UserInfo.vue";
import UserAvatar from "@/views/user/UserAvatar.vue";
import UserResetPassword from "@/views/user/UserResetPassword.vue";
import {userInfoServices} from "@/api/user.js";
import useUserInfoStore from "@/stores/userInfo.js";
import { ref, watch } from 'vue';

const userInfoStore = useUserInfoStore();
const isUserInfoLoaded = ref(false);

// 调用函数，获取用户详细信息,异步调用，导致组件先加载，后加载getUserInfo
const getUserInfo = async () => {
  try {
    // 调用接口
    let result = await userInfoServices();
    // 数据存储到pinia中
    userInfoStore.setInfo(result.data);
    isUserInfoLoaded.value = true;
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
}

getUserInfo();

watch(() => userInfoStore.info, (newInfo) => {
  if (newInfo) {
    isUserInfoLoaded.value = true;
  }
});
</script>

<template>
  <!--  内容区域 -->
  <div class="login-container">
    <!-- 新增的方框 -->
    <el-container>
      <!-- 头部栏 -->
      <el-header>
      </el-header>
      <div class="all-container">
        <!-- 左边博客文章 -->
        <el-aside>
          <div class="left-article">
            <div class="left-welcome">
              <h1>个人博客主页</h1>
            </div>
            <div class="left-content" v-if="isUserInfoLoaded">
              <UserAvatar/>
            </div>
            <div class="left-content" v-if="isUserInfoLoaded">
              <UserInfo/>
            </div>
            <div class="left-content" v-if="isUserInfoLoaded">
              <UserResetPassword/>
            </div>
          </div>
        </el-aside>
        <!-- 右边博客头像和小组件显示 -->
        <el-main>



        </el-main>
      </div>
    </el-container>
    <div style="width: 100%">
      <Footer/>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 内容位置 */
.login-container {
  height: auto;
  position: relative;
  display: flex;
  flex-direction: column; /* 设置为垂直排列 */
  justify-content: center;
  align-items: center;
  background-color: var(--bg);

  .el-container {
    width: 80%;
    display: flex;
    margin: 10px;

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
      width: 70%;

      .left-article {
        padding: 10px;
        background-color: var(--card-bg);
        height: auto;
        border-radius: 15px;
        border: 2px solid var(--border);
      }

      .left-welcome {
        margin-top: 20px;
        padding: 2px;
        background-color: var(--bg);
        height: auto;
        border-radius: 15px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid rgba(0, 0, 0, 0.1);
      }

      .left-content {
        margin-top: 20px;
        border-radius: 15px;
        padding: 2px;
        overflow: hidden;
      }
    }
  }

  .el-main {
    margin: 0;
    padding: 0;
    width: 30%;

    .right-userLogo {
      padding: 0 10px 0 20px;
      overflow: hidden;
    }
  }
}

@media screen and (max-width: 900px) {
  .login-container .el-container {
    width: 100%;
  }

  .login-container .el-container .el-aside {
    width: 100%;
  }


  .login-container .el-container .el-main {
    display: none;
  }
}
</style>