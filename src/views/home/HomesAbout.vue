<script setup lang="js">

// 定义技能数据
import Footer from "@/components/footer.vue";

const skills = [
  { name: 'Vue3', level: 90, iconClass: 'icon-vue',url:'https://ts3.tc.mm.bing.net/th/id/ODF.Npfb3Lt5Kweeqbn0AaNM8Q?w=32&h=32&qlt=90&pcl=fffffa&o=6&pid=1.2' },
  { name: 'SpringBoot', level: 85, iconClass: 'icon-spring',url:'https://ts2.tc.mm.bing.net/th/id/ODF.hxEDTd8GeFouQsOTBqzEqg?w=32&h=32&qlt=90&pcl=fffffa&o=6&pid=1.2' },
  { name: 'JavaScript', level: 88, iconClass: 'icon-js',url:'https://www.runoob.com/wp-content/uploads/2013/07/js-logo.png' },
  { name: 'Java', level: 82, iconClass: 'icon-java',url:'https://ts2.tc.mm.bing.net/th/id/ODF.w7IaAaWhPYmAcSNIT_w_KA?w=32&h=32&qlt=90&pcl=fffffa&o=6&pid=1.2' },
  { name: 'MySQL', level: 78, iconClass: 'icon-mysql',url:'https://ts2.tc.mm.bing.net/th/id/ODF.YzDy8NI4GHUFJZhS5YKQKg?w=32&h=32&qlt=90&pcl=fffffa&o=6&pid=1.2' },
  {name: 'HTML5', level: 90, iconClass: 'icon-html5',url:'https://www.runoob.com/wp-content/uploads/2013/06/image-icon.png' },
  { name: 'CSS3', level: 80, iconClass: 'icon-css3',url:'https://www.runoob.com/wp-content/uploads/2013/07/css-logo.png' },
];

// 定义联系方式
const contacts = [
  { type: 'email', title: '邮箱', detail: 's13628419482@qq.com', iconClass: 'icon-email' },
  { type: 'github', title: 'GitHub', detail: 'github.com/username', iconClass: 'icon-github' },
  { type: 'wechat', title: '微信', detail: 'wechat_id', iconClass: 'icon-wechat' }
];

</script>

<template>
  <div class="about-page">
    <!-- 头部视差区域 -->
    <header class="header-parallax">
      <div class="parallax-bg" ref="parallaxBg"></div>
      <div class="header-content">
        <h1 class="title">关于我</h1>
        <p class="subtitle">探索技术与生活的平衡点</p>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="main-content">
      <!-- 个人简介卡片 -->
      <div class="profile-card">
        <div class="card-header">
          <img src="https://img.cdn1.vip/i/68d51682be70a_1758795394.webp" alt="博主照片" class="profile-image">
          <h2 class="card-title">fsy</h2>
          <p class="card-subtitle">全栈开发者 | 技术博主</p>
        </div>
        <div class="card-body">
          <p>热爱技术的探索者，专注于 Vue3 和 SpringBoot 技术栈的应用与分享,拥有多年软件开发经验，致力于通过博客记录技术成长历程，分享实用开发技巧。</p>
        </div>
      </div>

      <!-- 技术栈 -->
      <div class="tech-stack">
        <h2 class="section-title">我的技术栈</h2>
        <div class="skills-container">
          <div class="skill-item" v-for="skill in skills" :key="skill.name">
            <div class="skill-icon" :class="skill.iconClass">
              <img :src="skill.url" alt="图" class="skill-icon-img"/>
            </div>
            <div class="skill-info">
              <h3 class="skill-name">{{ skill.name }}</h3>
              <div class="skill-progress">
                <div class="progress-bar" :style="{ width: skill.level + '%' }"></div>
              </div>
              <span class="skill-level">{{ skill.level }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 博客简介 -->
      <div class="blog-info">
        <h2 class="section-title">关于博客</h2>
        <div class="blog-description">
          <p>这是一个基于 Vue3 和 SpringBoot 构建的个人技术博客，旨在分享软件开发经验、技术见解和项目实践。</p>
          <p>博客采用前后端分离架构，前端使用 Vue3 + Element Plus，后端使用 SpringBoot + MyBatis，实现了文章管理、分类浏览、评论互动等功能。</p>
          <div class="tech-details">
            <div class="tech-column">
              <h3 class="tech-title">前端技术</h3>
              <ul class="tech-list">
                <li>Vue3 + Composition API</li>
                <li>Element Plus UI 组件库</li>
                <li>Vue Router 路由管理</li>
                <li>Vuex 状态管理</li>
                <li>Axios 前后端通信</li>
              </ul>
            </div>
            <div class="tech-column">
              <h3 class="tech-title">后端技术</h3>
              <ul class="tech-list">
                <li>SpringBoot 快速开发框架</li>
                <li>MyBatis 持久层框架</li>
                <li>Spring Security 权限管理</li>
                <li>MySQL 数据库</li>
                <li>Redis 缓存</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 联系我 -->
      <div class="contact-me">
        <h2 class="section-title">联系我</h2>
        <div class="contact-container">
          <div class="contact-item" v-for="contact in contacts" :key="contact.type">
            <div class="contact-icon" :class="contact.iconClass"></div>
            <div class="contact-info">
              <h3 class="contact-title">{{ contact.title }}</h3>
              <p class="contact-detail">{{ contact.detail }}</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 页脚 -->
    <div style="width: 100%">
      <Footer/>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 基础样式 */
.about-page {
  font-family: 'Inter', sans-serif;
  line-height: 1.6;
  color: #333;
  overflow-x: hidden;
}

/* 视差头部（增强深度感） */
.header-parallax {
  position: relative;
  height: 450px;
  overflow: hidden;
}

.parallax-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 120%;
  background: url('@/assets/【哲风壁纸】二次元-动漫-彩色.png') center/cover no-repeat;
  z-index: -1;
  transition: transform 0.1s linear;
  filter: brightness(0.8); /* 增强文字可读性 */
}

.header-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  text-shadow: 0 3px 8px rgba(0, 0, 0, 0.3); /* 增强文字立体感 */
  padding: 0 20px;
}

.title {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 1s forwards 0.3s;
}

.subtitle {
  font-size: 1.6rem;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 1s forwards 0.6s;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 主体内容（增强悬浮感） */
.main-content {
  max-width: 1200px;
  margin: -80px auto 0; /* 增大上浮距离，增强层次感 */
  padding: 0 20px 80px;
  position: relative;
  z-index: 1;
}

/* 个人简介卡片（毛玻璃+精致阴影） */
.profile-card {
  background: var(--glass-color); /* 半透明白色 */
  backdrop-filter: blur(10px); /* 毛玻璃效果 */
  border-radius: 16px;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.08); /* 柔和阴影 */
  padding: 40px;
  margin-bottom: 40px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* 平滑过渡 */
  border: 1px solid rgba(255, 255, 255, 0.1); /* 微妙边框 */
}

.profile-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12); /* 悬浮时加深阴影 */
}

.card-header {
  text-align: center;
  margin-bottom: 20px;
}

.profile-image {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 15px;
  border: 5px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  cursor: pointer;
}

.profile-card:hover .profile-image {
  transform: scale(1.05); /* 头像轻微放大 */
}

.card-title {
  font-size: 1.9rem;
  margin-bottom: 5px;
  color: #2c3e50;
}

.card-subtitle {
  color: #666;
  font-size: 1.1rem;
  letter-spacing: 0.5px; /* 增加字母间距 */
}

.card-body {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #555;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

/* 技术栈部分（增强卡片质感） */
.tech-stack {
  margin-bottom: 50px;
}

.section-title {
  font-size: 2rem;
  margin-bottom: 30px;
  position: relative;
  display: inline-block;
  color: #2c3e50;
  font-weight: 600;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 50%;
  height: 3px;
  background: #409eff;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.section-title:hover::after {
  width: 70%; /* 标题悬停时下划线变长 */
}

.skills-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.skill-item {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border-left: 4px solid transparent; /* 左侧预留边框位置 */
  cursor: pointer;
}

.skill-item:hover {
  transform: translateY(-5px);
  border-left-color: #409eff; /* 悬浮时显示左侧主题色边框 */
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.09);
}

.skill-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  margin-right: 20px;
 .skill-icon-img {
   width: 100%;
   height: 100%;
   object-position: center;
   object-fit: contain;
 }
}

.skill-info {
  flex: 1;
}

.skill-name {
  font-size: 1.25rem;
  margin-bottom: 10px;
  color: #333;
}

.skill-progress {
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05); /* 内阴影增强质感 */
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
}

/* 进度条添加光泽效果 */
.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 30%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
  animation: shine 2s infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}

/* 技术栈颜色优化 */
.icon-vue ~ .skill-info .progress-bar { background: #41b883; }
.icon-spring ~ .skill-info .progress-bar { background: #4bb543; }
.icon-js ~ .skill-info .progress-bar { background: #f0db4f; }
.icon-java ~ .skill-info .progress-bar { background: #c83636; }
.icon-mysql ~ .skill-info .progress-bar { background: #ef8037; }
.icon-html5 ~ .skill-info .progress-bar { background: #e34f26; }
.icon-css3 ~ .skill-info .progress-bar { background: #b313f3; }

.skill-level {
  display: block;
  margin-top: 8px;
  font-size: 0.9rem;
  color: #666;
  text-align: right;
  transition: color 0.3s ease;
}

.skill-item:hover .skill-level {
  color: #409eff; /* 悬浮时等级数字变色 */
}

/* 博客简介（增强区块感） */
.blog-info {
  margin-bottom: 50px;
}

.blog-description {
  background: var(--bg);
  border-radius: 16px;
  padding: 35px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.07);
  transition: box-shadow 0.3s ease;
}

.blog-description:hover {
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.09);
}

.blog-description p {
  margin-bottom: 20px;
  font-size: 1.1rem;
  line-height: 1.8;
  color: #555;
}

.tech-details {
  display: flex;
  flex-wrap: wrap; /* 适配小屏幕 */
  gap: 30px;
  margin-top: 30px;
}

.tech-column {
  flex: 1;
  min-width: 250px; /* 确保小屏幕显示正常 */
  background: var(--card-bg);
  border-radius: 10px;
  padding: 25px;
  transition: transform 0.3s ease;
}

.tech-column:hover {
  transform: translateY(-5px);
}

.tech-title {
  font-size: 1.3rem;
  margin-bottom: 15px;
  position: relative;
  padding-bottom: 10px;
  color: #333;
}

.tech-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 30%;
  height: 2px;
  background: #409eff;
  transition: width 0.3s ease;
}

.tech-column:hover .tech-title::after {
  width: 50%; /* 悬停时下划线变长 */
}

.tech-list {
  list-style: none;
  padding: 0;
}

.tech-list li {
  margin-bottom: 12px;
  padding-left: 25px;
  position: relative;
  transition: color 0.2s ease;
}

.tech-list li:hover {
  color: #409eff;
  cursor: pointer;
}

.tech-list li::before {
  content: '✦'; /* 更精致的列表符号 */
  position: absolute;
  left: 0;
  color: #409eff;
  font-size: 1rem;
}

/* 联系我（增强交互反馈） */
.contact-me {
  margin-bottom: 50px;
}

.contact-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.contact-item {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  display: flex;
  align-items: center;
  border: 1px solid transparent;
}

.contact-item:hover {
  transform: translateY(-6px) scale(1.02); /* 轻微放大+上浮 */
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  border-color: rgba(64, 158, 255, 0.2);
}

.contact-icon {
  width: 55px;
  height: 55px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 20px;
  flex-shrink: 0;
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
  transition: all 0.3s ease;
}

.contact-item:hover .contact-icon {
  background: #409eff;
  color: white; /* 悬浮时图标背景变色 */
  transform: scale(1.1); /* 图标轻微放大 */
  cursor: pointer;
}

.contact-title {
  font-size: 1.25rem;
  margin-bottom: 5px;
  color: #333;
}

.contact-detail {
  color: #666;
  transition: color 0.3s ease;
}

.contact-item:hover .contact-detail {
  color: #409eff; /* 悬浮时详情变色 */
}

/* 响应式优化 */
@media (max-width: 768px) {
  .title { font-size: 2.5rem; }
  .subtitle { font-size: 1.3rem; }
  .header-parallax { height: 350px; }
  .tech-details { flex-direction: column; }
  .skills-container { grid-template-columns: 1fr; }
}
</style>