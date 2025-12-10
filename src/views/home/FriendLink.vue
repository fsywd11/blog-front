<script setup lang="js">
import { ref, reactive} from 'vue';
import {FriendLinksAddService, FriendLinksListService} from "@/api/friendLinks.js";
import Footer from "@/components/footer.vue";
import {ElMessage} from "element-plus";

// 模拟数据 - 友链列表
const friendLinks = ref([]);
const fridenLinksList=async ()=>{
  const result = await FriendLinksListService();
  friendLinks.value = result.data;
}
fridenLinksList();

const previewImage=ref(false);

// 表单数据
const formData = reactive({
  name: '',
  url: '',
  imageUrl: '',
  description: '',
  passed:false
});

const submitForm = async () => {
 const result =await FriendLinksAddService(formData);
  ElMessage.success(result.data? result.data :'申请成功');
  showAddForm.value = false;
  await fridenLinksList();
}

// 模态框控制
const showAddForm = ref(false);

const closeForm = () => {
  showAddForm.value = false;
};

const clearDate=() => {
  formData.name = '';
  formData.url = '';
  formData.imageUrl = '';
  formData.description = '';
  formData.passed = false;
};


const openLink = (url) => {
  // 格式化URL，确保包含协议
  const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
  console.log('尝试打开链接:', formattedUrl); // 调试日志
  window.open(formattedUrl, '_blank');
};

const backgroundImage = ref('https://s.panlai.com/zb_users/upload/2025/04/20250425102713174554803319683.jpg-arthumbs');
</script>

<template>
  <!-- 页面头部 -->
  <header class="header" :style="{backgroundImage: `url('${backgroundImage}')`}">
    <h1 class="title">我的友情链接</h1>
    <p class="subtitle">分享优质资源，共同成长</p>
  </header>
  <div class="friend-links-container">
    <!-- 搜索和添加按钮 -->
    <div class="toolbar">
      <button
          @click="showAddForm = true;clearDate()"
          class="add-button"
      >
        <i class="fa fa-plus-circle"></i> 申请友链
      </button>
    </div>

    <!-- 友链列表 -->
    <div class="links-grid">
      <div
          v-for="link in friendLinks"
          :key="link.id"
          class="link-card"
          @click="openLink(link.url)"
      >
        <div class="card-inner">
          <div class="card-front">
            <div class="link-image-container">
              <img
                  :src="link.imageUrl"
                  :alt="link.name"
                  class="link-image"
              >
            </div>
            <h3 class="link-name">{{ link.name }}</h3>
            <p class="link-desc">{{ link.description }}</p>
            <div class="link-stats">
              <span class="link-date">
                <i class="fa fa-calendar"></i> {{ link.createTime }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态提示 -->
      <div
          v-if="friendLinks.filter(link => link.passed).length === 0"
          class="empty-state"
      >
        <div class="empty-icon">
          <i class="fa fa-link"></i>
        </div>
        <h3 class="empty-title">暂无友链</h3>
        <p class="empty-text">目前还没有已通过审核的友情链接，快来申请吧！</p>
      </div>
    </div>

    <!-- 申请友链表单 -->
    <div v-if="showAddForm" class="overlay">
      <div class="form-container">
        <div class="form-header">
          <h3>申请友链</h3>
          <button @click="closeForm" class="close-button">
            <i class="fa fa-times"></i>
          </button>
        </div>
        <form @submit.prevent="submitForm" class="link-form">
          <div class="form-group">
            <label for="name">网站名称:</label>
            <input
                type="text"
                id="name"
                v-model="formData.name"
                required
                class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="url">网站URL:</label>
            <input
                type="url"
                id="url"
                v-model="formData.url"
                required
                class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="imageUrl">图标URL:</label>
            <input
                type="url"
                id="imageUrl"
                v-model="formData.imageUrl"
                required
                class="form-input"
            >
          </div>
          <div class="form-group">
            <el-button @click="previewImage = !previewImage" type="warning">图片预览</el-button>
            <img v-if="previewImage" :src="formData.imageUrl" class="preview-image" alt="图片预览">
          </div>
          <div class="form-group">
            <label for="description">网站描述:</label>
            <textarea
                id="description"
                v-model="formData.description"
                rows="3"
                class="form-textarea"
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="submit-button">
              <i class="fa fa-check"></i> 申请
            </button>
            <button @click="closeForm" class="cancel-button">
              <i class="fa fa-times"></i> 取消
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  <div style="width: 100%">
    <Footer/>
  </div>
</template>


<style scoped lang="scss">
/* 基础样式 */
.friend-links-container {
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  padding: 56px;
  width: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  text-align: center;
  margin-bottom: 40px;
}

.title {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 1.2rem;
  color: #666;
}

.toolbar {
  display: flex;
  justify-content: right;
  align-items: center;
  margin-bottom: 30px;
}
.preview-image{
  width: 100%;
  height: 200px;
  object-fit: cover;
  background-repeat: no-repeat;
}

.add-button {
  background-color: #c89f1b;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.3s;
  &:hover {
    background-color: rgba(208, 160, 28, 0.72);
  }
}

.add-button i {
  margin-right: 8px;
}

/* 友链卡片样式 */
.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.link-card {
  perspective: 1000px;
  height: 320px;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.8s;
}

.link-card:hover .card-inner {
  cursor: pointer;
  transform: scale(1.05);
}

.card-front {
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.card-front {
  background-color: var(--card-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.link-image-container {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 15px;
  border: 2px solid #eee;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.link-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.link-card:hover .link-image {
  transform: scale(1.1);
}

.link-name {
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  text-align: center;
}

.link-desc {
  color: #666;
  font-size: 0.95rem;
  text-align: center;
  margin-bottom: 20px;
  flex-grow: 1;
}

.link-stats {
  width: 100%;
  display: flex;
  justify-content: center;
  font-size: 0.9rem;
  color: #999;
}

.link-date {
  display: flex;
  align-items: center;
}

.link-date i {
  margin-right: 5px;
}

/* 表单样式 */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.form-container {
  background-color: var(--card-bg);
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 25px rgba(0,0,0,0.2);
  overflow: hidden;
}

.form-header {
  padding: 20px;
  background-color: #dca130;
  color: var(--text);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: transform 0.3s;
  &:hover {
    //旋转
    transform: rotate(180deg);
  }
}

.link-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text);
}

.form-input, .form-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  outline: none;
  transition: border-color 0.3s;
}

.form-input:focus, .form-textarea:focus {
  border-color:  #dca130;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 25px;
}

.submit-button, .cancel-button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.submit-button {
  background-color:  #dca130;
  color: white;
}

.submit-button:hover {
  background-color: rgba(220, 161, 48, 0.86);
}

.cancel-button {
  background-color: #ddd;
  color: #333;
}

.cancel-button:hover {
  background-color: #ccc;
}

/* 空状态样式 */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  background-color: #f8f9fa;
  border-radius: 15px;
  margin-top: 20px;

  .empty-icon {
    font-size: 48px;
    color: #dca130;
    margin-bottom: 20px;
  }

  .empty-title {
    font-size: 24px;
    color: #333;
    margin-bottom: 10px;
  }

  .empty-text {
    color: #666;
    margin-bottom: 25px;
  }

  .empty-button {
    background-color: #dca130;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
      background-color: rgba(220, 161, 48, 0.86);
    }

    i {
      margin-right: 8px;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 15px;
  }

  .links-grid {
    grid-template-columns: 1fr;
  }

  .form-container {
    max-width: 90%;
  }
}
</style>