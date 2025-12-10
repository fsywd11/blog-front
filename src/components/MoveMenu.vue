<script setup lang="ts">

import {
  Clock,
  DocumentCopy,
  Files,
  Fries, Headset,
  HomeFilled,
  IceCreamRound,
  Link, PictureFilled,
  Postcard, PriceTag, Shop, UserFilled
} from "@element-plus/icons-vue";
const emit = defineEmits(["update:closeDrawer"])

function isClose(){
  emit("update:closeDrawer")
}

</script>
<template>
  <div>
    <el-menu
        router
        style="width: 100%;border: none"
        class="menu"
    >
      <el-menu-item index="/" class="index" @click="isClose">
        <el-icon>
          <HomeFilled/>
        </el-icon>
        首页
      </el-menu-item>
      <el-sub-menu index="2">
        <template #title>
          <el-icon>
            <Files/>
          </el-icon>
          归档
        </template>
        <el-menu-item index="/homes/timeline" @click="isClose">
          <el-icon>
            <Clock/>
          </el-icon>
          时间轴
        </el-menu-item>
        <el-menu-item index="/homes/category" @click="isClose">
          <el-icon>
            <DocumentCopy/>
          </el-icon>
          分类
        </el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="3">
        <template #title>
          <el-icon>
            <IceCreamRound/>
          </el-icon>
          其他
        </template>
        <el-menu-item index="/tree-hole" @click="isClose">
          <el-icon>
            <Fries/>
          </el-icon>
          树洞
        </el-menu-item>
        <el-menu-item index="/message" @click="isClose">
          <el-icon>
            <Postcard/>
          </el-icon>
          留言板
        </el-menu-item>
        <el-menu-item index="/homes/music" @click="isClose">
          <el-icon><Headset /></el-icon>
          音乐
        </el-menu-item>
      </el-sub-menu>
      <el-menu-item index="/homes/friendLink/" @click="isClose">
        <el-icon>
          <Link/>
        </el-icon>
        友链
      </el-menu-item>
      <el-menu-item index="/homes/about" @click="isClose">
        <el-icon>
          <UserFilled/>
        </el-icon>
        关于
      </el-menu-item>
      <el-menu-item index="/homes/photo/" @click="isClose">
        <el-icon>
          <PictureFilled/>
        </el-icon>
        相册
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style scoped lang="scss">

</style>