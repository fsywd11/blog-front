<script setup lang="js">
import HomeRight from '@/components/homeRight.vue';
import Footer from "@/components/footer.vue";
import {ChatLineSquare, Loading} from "@element-plus/icons-vue";
import {ref} from "vue";
// 引入封装后的编辑器
import QuillEditor from '@/components/QuillEditor.vue';
// Markdown 解析 + 代码高亮
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css'; // 可选：代码高亮样式
import {MessageAddService, MessageListService} from "@/api/message.js";
import {ElMessage} from "element-plus";

// 初始化 marked 配置（代码高亮 + 安全解析）
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true, // 支持换行符
  gfm: true, // 支持 GitHub 风格的 Markdown
  sanitize: true // 防止 XSS 攻击
});

// 控制抽屉显示
const visibleDrawer = ref(false)
// 加载状态（列表/提交）
const loading = ref({
  list: false, // 列表加载
  submit: false // 提交加载
});

// 留言数据模型
const messageModel = ref({
  content: ''
});
const messages = ref([]);

// 留言编辑器配置（移除图片，保留 Markdown 常用格式）
const commentEditorOptions = {
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline','strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ]
  },
  placeholder: '请输入留言（支持 Markdown 语法，如 **加粗**、`代码` 等）...'
};

// 解析 Markdown 为 HTML（带高亮）
const parseMarkdown = (content) => {
  if (!content) return '';
  return marked.parse(content);
};

// 添加留言
const addMessage = async (messageData) => {
  // 非空校验
  const pureContent = messageData.content.trim();
  if (!pureContent) {
    ElMessage.warning('留言内容不能为空！');
    return;
  }
  // 长度校验
  if (pureContent.length > 1000) {
    ElMessage.warning('留言内容不能超过1000字！');
    return;
  }

  try {
    loading.value.submit = true;
    await MessageAddService(messageData);
    visibleDrawer.value = false;
    ElMessage.success("感谢留言!_!");
    // 清空编辑器
    messageModel.value.content = '';
    // 重新加载列表
    await MessageList();
  } catch (error) {
    ElMessage.error('留言提交失败：' + (error.message || '网络异常'));
  } finally {
    loading.value.submit = false;
  }
};

// 获取留言列表
const MessageList = async () => {
  try {
    loading.value.list = true;
    const result = await MessageListService();
    messages.value = result.data || [];
  } catch (error) {
    ElMessage.error('获取留言列表失败：' + (error.message || '网络异常'));
    messages.value = [];
  } finally {
    loading.value.list = false;
  }
};

// 初始化加载列表
MessageList();
</script>

<template>
  <!-- 内容区域 -->
  <div class="login-container">
    <el-container>
      <!-- 头部栏 -->
      <el-header></el-header>
      <div class="all-container">
        <!-- 左边留言板 -->
        <el-aside>
          <div class="left-article">
            <div class="comment-title">
              <span>留言板</span>
              <el-button
                  class="button-get"
                  @click="visibleDrawer = true"
                  :disabled="loading.submit"
              >
                留言
              </el-button>
            </div>
            <el-divider></el-divider>
            <div class="message">
              <span>欢迎访问留言板板块！</span>
              <span>留言板是一个方便与其他用户交流、分享观点和意见的平台。通过留言板，您可以：</span>
              <span>1、留下自己的留言：无论是对特定主题的讨论、对某篇文章的评论，还是向其他用户提问，您都可以在留言板上发表自己的留言。</span>
              <span>2、回复其他用户：看到其他用户的留言后，您可以进行回复和互动，分享自己的观点，提供帮助或者表达共鸣。</span>
              <span>3、进行在线交流：留言板不仅是一个留言的平台，还是一个与其他用户进行实时交流的地方。您可以通过留言与他人进行私聊，分享更多的讨论和信息。</span>
              <span>支持：普通文档，markdown</span>
            </div>
            <div class="comment-title">
              <span><el-icon><ChatLineSquare/></el-icon>留言列表</span>
            </div>

            <!-- 留言列表标题 -->
            <div class="comment-title">
              <span>
                <el-icon><ChatLineSquare/></el-icon>
                留言列表
                <!-- 列表加载状态 -->
                <el-icon v-if="loading.list" class="loading-icon">
                  <Loading spin />
                </el-icon>
              </span>
            </div>

            <!-- 留言列表 -->
            <div class="comment-list">
              <!-- 加载中占位 -->
              <div v-if="loading.list" class="list-loading">
                <el-skeleton :rows="3" animated />
              </div>

              <!-- 留言项 -->
              <div
                  v-for="(message, index) in messages"
                  :key="index"
                  class="comment"
                  v-else
              >
                <div class="comment-header">
                  <img class="comment-icon" src="@/assets/用户.svg" alt="用户头像"/>
                  <div class="comment-username">
                    <p style="color: rgba(44,42,42,0.65)">{{ message.username }}</p>
                  </div>
                  <p class="comment-time" style="color: rgba(44,42,42,0.65)">{{ message.createTime }}</p>
                </div>
                <!-- Markdown 渲染内容 -->
                <div
                    class="comment-text markdown-content"
                    v-html="parseMarkdown(message.content)"
                ></div>
              </div>

              <!-- 空状态 -->
              <div v-if="!loading.list && messages.length === 0" class="empty-comment">
                <el-empty description="暂时没有留言，快来抢占沙发吧！"/>
              </div>

              <!-- 无更多提示 -->
              <el-divider v-if="!loading.list && messages.length > 0">
                -- 没有更多啦 --
              </el-divider>
            </div>
          </div>
        </el-aside>

        <!-- 右边组件 -->
        <el-main>
          <div class="right-userLogo">
            <home-right/>
          </div>
        </el-main>
      </div>
    </el-container>

    <div style="width: 100%;margin-top: 10px">
      <Footer/>
    </div>

    <!-- 留言抽屉 -->
    <el-drawer
        v-model="visibleDrawer"
        :with-header="false"
        direction="rtl"
        size="50%"
        :disabled="loading.submit"
    >
      <el-form :model="messageModel" class="comment-form">
        <el-form-item label="留言内容" label-width="80px">
          <!-- 封装的编辑器组件 -->
          <QuillEditor
              v-model="messageModel.content"
              :height="400"
              :custom-options="commentEditorOptions"
              :loading="loading.submit"
              show-markdown-tip
          />
        </el-form-item>
        <div class="form-btn-group">
          <el-button
              type="warning"
              @click="visibleDrawer = false"
              :disabled="loading.submit"
          >
            取消
          </el-button>
          <el-button
              type="primary"
              @click="addMessage(messageModel)"
              :loading="loading.submit"
          >
            {{ loading.submit ? '提交中...' : '提交留言' }}
          </el-button>
        </div>
      </el-form>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
// 基础样式
.login-container {
  min-height: 100vh;
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
        border: 2px solid var(--border);

        .message {
          border-radius: 0.4rem;
          height: auto;
          width: 100%;
          padding: 10px;
          background-color: rgba(74, 70, 70, 0.07);
          display: flex;
          flex-direction: column;
          span {
            color: #787575;
            margin: 5px;
          }
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
}

// 留言表单样式
.comment-form {
  padding: 20px;

  .form-btn-group {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }
}

// 加载状态样式
.loading-icon {
  margin-left: 8px;
  font-size: 16px;
}

.list-loading {
  padding: 20px;
  width: 100%;
}

// 留言列表样式
.comment-title {
  display: flex;
  align-items: center;
  font-size: 1.5em;
  font-weight: bold;
  margin: 2rem 0;
  justify-content: space-between;

  span {
    margin-left: 0.5rem;
    display: flex;
    align-items: center;
  }

  .button-get {
    border-radius: 5px;
    padding: 17px;
    cursor: pointer;
    color: white;
    background-color: rgb(222, 161, 30);
    &:hover {
      background-color: #d48806;
    }
    &:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  }
}

.comment-list {
  display: flex;
  flex-direction: column;
  padding: 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 15px;
  width: 100%;
  height: auto;
  gap: 15px;

  .comment {
    padding: 15px;
    border-radius: 15px;
    border: 1px solid var(--el-border-color);
    transition: all 0.3s ease;
    &:hover {
      cursor: default;
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
  }

  .empty-comment {
    padding: 40px 0;
    text-align: center;
  }
}

.comment-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;

  .comment-icon {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1px solid #393333;
    margin-right: 10px;
  }

  .comment-username {
    flex: 1;
    font-weight: 500;
  }

  .comment-time {
    font-size: 12px;
  }
}

// Markdown 内容样式
.markdown-content {
  border: 1px solid var(--el-border-color);
  border-radius: 15px;
  padding: 15px;
  background-color: rgba(220, 216, 216, 0.1);
  line-height: 1.8;

  // Markdown 基础样式
  & > p {
    margin: 0 0 10px 0;
  }

  & > pre {
    background-color: #24292e;
    color: #fff;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 10px 0;
  }

  & > code {
    background-color: #f6f8fa;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', monospace;
  }

  & > pre > code {
    background: none;
    padding: 0;
  }

  & > ul, & > ol {
    margin: 10px 0 10px 20px;
  }

  & > blockquote {
    border-left: 4px solid #dfe2e5;
    padding: 0 15px;
    color: #6a737d;
    margin: 10px 0;
  }

  & > h1, & > h2 {
    margin: 15px 0 10px 0;
    padding-bottom: 5px;
    border-bottom: 1px solid #eee;
  }

  & > a {
    color: #0366d6;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  & > img {
    max-width: 100%;
    border-radius: 8px;
    margin: 10px 0;
  }
}

// 响应式适配
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

// 其他原有样式（省略重复部分）
.copyright, .article-content, .head_title, .tipping, .qrCode, .goOn {
  // 保留原有样式
}
</style>