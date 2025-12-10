<script setup>
import { ref } from 'vue';
import { ElCarousel, ElCarouselItem } from 'element-plus';
import { articleListController } from "@/api/article.js";

// 1. 移除HTML标签的工具函数
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ''); // 匹配并移除所有HTML标签
};

const getShortContent = (content) => {
  const newcontent = stripHtml(content);
  return newcontent.slice(0, 20) + '...';
};
//轮播图随机显示图片
const articles = ref([]);
const getArticle = async () => {
  // 调用接口
  let result = await articleListController();
  articles.value = result.data;
};
getArticle();

</script>
<template>
  <el-carousel :interval="4000" arrow="always" height="250px" class="el-carousel">
    <el-carousel-item v-for="(item, index) in articles.slice(0, 3)" :key="index" @click="$router.push(`/homes/articleComment/${item.id}`)">
      <img v-lazy="item.coverImg" alt="Carousel Image" class="carousel-image" />
      <div class="carousel-text-one">
        {{ item.title }} <!-- 这里假设 item 有一个 title 属性，你可以根据实际情况修改 -->
      </div>
      <div class="carousel-text-two">
        {{ item.createTime }} <!-- 这里假设 item 有一个 author 属性，你可以根据实际情况修改 -->
      </div>
      <div class="carousel-text-three">
        {{ getShortContent(item.content)}} <!-- 这里假设 item 有一个 content 属性，你可以根据实际情况修改 -->
      </div>
    </el-carousel-item>
  </el-carousel>
</template>

<style scoped>
.el-carousel {
  height: 200px;
  border-radius: 15px;
  /*鼠标啊*/
  cursor: pointer;
}

.carousel-image {
  width: 100%;
  height: 250px;
  object-fit: cover;
}

.carousel-text-one,
.carousel-text-two,
.carousel-text-three {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  text-align: center;
  z-index: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
}

.carousel-text-one {
  top: 20%;
  line-height: 30px;
  font-size: 30px;
  font-weight: bold;
}

.carousel-text-two {
  top: 40%;
  font-size: 16px;
  font-weight: bold;
}

.carousel-text-three {
  top: 60%;
  font-size: 20px;
  font-weight: bold;
}
</style>