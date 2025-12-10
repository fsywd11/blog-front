<script setup lang="js">
import { ref, computed } from 'vue';
import Footer from "@/components/footer.vue";
import {photoListService} from "@/api/photo.js";
import {articleCateListService} from "@/api/article.js";

// 模拟图片数据
const photos = ref([]);
const loadedMap = ref({});

const photoList =async () => {
  const result =await photoListService();
  photos.value = result.data;
}
photoList();

// 分类列表
const categories = ref([]);
// 回显文章分类列表选择
const articleCategoryList = async () => {
  let result = await articleCateListService();
  categories.value = result.data;
}
articleCategoryList();

// 当前分类名
const currentCategory = ref('all');

// 模态框状态
const modalOpen = ref(false);
const currentPhoto = ref({});
const currentIndex = ref(0);

// 计算属性：过滤后的照片
const filteredPhotos = computed(() => {
  if (currentCategory.value === 'all') {
    return photos.value;
  }
  return photos.value.filter(photo => photo.categoryName === currentCategory.value);
});

const markLoaded = (id) => {
  loadedMap.value[id] = true;
};

// 过滤照片
const filterPhotos = (category) => {
  currentCategory.value = category.categoryName;
};

// 打开模态框
const openModal = (photo) => {
  currentPhoto.value = photo;
  currentIndex.value = filteredPhotos.value.findIndex(p => p.id === photo.id);
  modalOpen.value = true;
  document.body.style.overflow = 'hidden'; // 防止背景滚动
};

// 关闭模态框
const closeModal = () => {
  modalOpen.value = false;
  document.body.style.overflow = ''; // 恢复背景滚动
};

// 上一张照片
const prevPhoto = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    currentPhoto.value = filteredPhotos.value[currentIndex.value];
  }
};

// 下一张照片
const nextPhoto = () => {
  if (currentIndex.value < filteredPhotos.value.length - 1) {
    currentIndex.value++;
    currentPhoto.value = filteredPhotos.value[currentIndex.value];
  }
};

// 图片下载功能
const downloadImage = (url) => {
  try {
    // 处理文件名
    let fileName = currentPhoto.value.title
        ? currentPhoto.value.title.replace(/[^a-zA-Z0-9_]/g, '_')
        : `photo_${currentPhoto.value.id}`;
    fileName += '.jpg';

    // 创建a标签直接下载（不经过fetch，避免CORS）
    const link = document.createElement('a');
    // 直接使用原URL（部分浏览器可能仍会拦截）
    link.href = url;
    link.download = fileName; // 强制指定文件名和格式
    link.target = '_blank'; // 新窗口打开（避免某些浏览器拦截）

    document.body.appendChild(link);
    link.click();

    // 清理
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  } catch (error) {
    console.error('下载失败:', error);
    alert('图片下载失败，可能由于浏览器安全限制，请右键保存图片');
  }
};
</script>


<template>
  <!-- 页面标题 -->
  <div class="photo-header">
    <div class="container header-row">
      <div>
        <h1 class="page-title">我的相册</h1>
        <p class="page-description">记录生活中的美好瞬间</p>
      </div>
    </div>
  </div>
  <div class="photo-album-container">
    <!-- 分类筛选 -->
    <div class="album-filter">
      <div class="container">
        <div class="filter-buttons">
          <button class="filter-btn" :class="{ active: currentCategory === 'all' }" @click="currentCategory = 'all'">
            全部
          </button>
          <button v-for="category in categories" :key="category.id" class="filter-btn"
                  :class="{ active: currentCategory === category.categoryName }"
                  @click="filterPhotos(category)">
            {{ category.categoryName }}
          </button>
        </div>
      </div>
    </div>

    <!-- 相册网格 -->
    <div class="album-grid">
      <div class="container">
        <div class="photos-container">
          <div v-for="photo in filteredPhotos" :key="photo.id" class="photo-item" @click="openModal(photo)">
            <div class="photo-wrapper" :class="{ loaded: loadedMap[photo.id] }">
              <div class="photo-surface">
                <img
                    :src="photo.thumbnailUrl"
                    :alt="photo.title"
                    class="photo-image"
                    loading="lazy"
                    decoding="async"
                    @load="markLoaded(photo.id)"
                />
              </div>
              <div class="photo-overlay">
                <div class="photo-info">
                  <h3 class="photo-title">{{ photo.title }}</h3>
                  <p class="photo-category">{{ photo.categoryName }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredPhotos.length === 0" class="empty-state">
            <i class="fa fa-image"></i>
            <p>没有找到照片</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览模态框 -->
    <div class="photo-modal" :class="{ 'active': modalOpen }" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="close-modal" @click="closeModal">
          <i class="fa fa-times"></i>
        </button>

        <!-- 下载按钮 -->
        <button class="download-btn" @click="downloadImage(currentPhoto.url)">
          <i class="fa fa-download"></i> 下载图片
        </button>

        <div class="modal-header">
          <h2 class="modal-title">{{ currentPhoto.title }}</h2>
          <p class="modal-category">{{ currentPhoto.categoryName }}</p>
        </div>

        <div class="modal-body">
          <div class="photo-viewer">
            <img :src="currentPhoto.url" :alt="currentPhoto.title" class="modal-image" />
          </div>

          <div class="photo-description">
            <p v-html="currentPhoto.description"></p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="prev-btn" @click="prevPhoto" :disabled="currentIndex === 0">
            <i class="fa fa-angle-left"></i> 上一张
          </button>
          <button class="next-btn" @click="nextPhoto" :disabled="currentIndex === filteredPhotos.length - 1">
            下一张 <i class="fa fa-angle-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
  <div style="width: 100%">
    <Footer/>
  </div>
</template>


<style scoped lang="scss">
.photo-album-container{
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  transition: background-color 0.3s ease;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

/* 页面标题样式 */
.photo-header {
  padding: 52px 0 32px 0;
  text-align: center;
  background: var(--card-bg);
  transition: background-color 0.3s ease;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text);
  transition: color 0.3s ease;
}

.page-description {
  font-size: 14px;
  color: var(--muted);
  max-width: 800px;
  margin: 0 auto;
  transition: color 0.3s ease;
}

/* 分类筛选样式 */
.album-filter {
  padding: 16px 0;
  background-color: var(--card-bg);
  box-shadow: 0 1px 3px var(--shadow);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.filter-btn {
  background-color: rgba(0, 0, 0, 0);
  color: var(--muted);
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.filter-btn.active {
  background-color: var(--accent);
  color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

/* 相册网格样式 */
.album-grid {
  padding: 32px 0;
  background: transparent;
}

.photos-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
}

@media (min-width: 576px) {
  .photos-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 768px) {
  .photos-container {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1024px) {
  .photos-container {
    grid-template-columns: repeat(5, 1fr);
  }
}

.photo-item {
  cursor: pointer;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.06), 0 10px 10px rgba(0, 0, 0, 0.04);
  background: var(--card-bg);
  transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
}

.photo-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.1);
}

.photo-wrapper {
  position: relative;
  overflow: hidden;
  aspect-ratio: 4/3;
  background: var(--bg);
  transition: background-color 0.3s ease;
}

.photo-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(0,0,0,0.05) 100%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.35s ease;
}

.photo-wrapper.loaded::after {
  opacity: 1;
}

.photo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease, filter 0.35s ease;
  filter: saturate(1.02);
}

.photo-item:hover .photo-image {
  transform: scale(1.03);
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.58), rgba(0, 0, 0, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: flex-end;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.photo-info {
  padding: 14px;
  color: #fff;
}

.photo-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 2px;
}

.photo-category {
  font-size: 12px;
  color: #e2e8f0;
}

/* 空状态样式 */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 32px 0;
  color: var(--muted);
  transition: color 0.3s ease;
}

:global(body.dark) .photo-album-container {
  background: var(--bg);
}

:global(body.dark) .photo-header {
  background: var(--card-bg);
}

:global(body.dark) .page-title {
  color: #f5f7fb;
}

:global(body.dark) .page-description {
  color: #c7cbd6;
}

:global(body.dark) .album-filter {
  background-color: #151824;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

:global(body.dark) .filter-btn {
  color: #cfd3dc;
}

:global(body.dark) .filter-btn:hover {
  background-color: #23273a;
  color: #fff;
}

:global(body.dark) .filter-btn.active {
  background-color: #409eff;
  color: #fff;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.35);
}

:global(body.dark) .photo-item {
  background: #111217;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.18);
}

:global(body.dark) .photo-wrapper {
  background: #191b24;
}

:global(body.dark) .empty-state {
  color: #c7cbd6;
}

.empty-state i {
  font-size: 48px;
  color: #cbd5e1;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 16px;
  color: #64748b;
}

/* 模态框样式 */
.photo-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(10, 12, 20, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  z-index: 200;
}

.photo-modal.active {
  opacity: 1;
  visibility: visible;
}

.modal-content {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(22px) saturate(1.4);
  -webkit-backdrop-filter: blur(22px) saturate(1.4);
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: scale(0.95);
  transition: transform 0.3s ease;
  position: relative; /* 新增：为下载按钮提供定位上下文 */
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
}

.photo-modal.active .modal-content {
  transform: scale(1);
}

.close-modal {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s ease, background 0.2s ease;
  border-radius: 12px;
  padding: 6px 10px;
}

.close-modal:hover {
  transform: rotate(90deg);
  background: rgba(255, 255, 255, 0.26);
}

/* 下载按钮样式 */
.download-btn {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 6px 12px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  z-index: 10;
  transition: background 0.2s ease, transform 0.2s ease;
}

.download-btn:hover {
  background: rgba(255, 255, 255, 0.26);
  transform: translateX(-50%) translateY(-1px);
}

.download-btn i {
  margin-right: 6px;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #f5f7fb;
}

.modal-category {
  font-size: 14px;
  color: rgba(245, 247, 251, 0.75);
}

.modal-body {
  flex: 1;
  overflow: hidden;
  padding: 20px;
}

.photo-viewer {
  text-align: center;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
}

.photo-description {
  font-size: 14px;
  color: rgba(245, 247, 251, 0.86);
  line-height: 1.8;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
}

.prev-btn,
.next-btn {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  transition: background 0.2s ease, transform 0.2s ease;
}

.prev-btn:hover,
.next-btn:hover {
  background: rgba(255, 255, 255, 0.26);
  transform: translateY(-1px);
}

.prev-btn:disabled,
.next-btn:disabled {
  background: rgba(255, 255, 255, 0.12);
  cursor: not-allowed;
}

.prev-btn i {
  margin-right: 6px;
}

.next-btn i {
  margin-left: 6px;
}
</style>
