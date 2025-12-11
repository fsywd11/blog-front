<template>
  <div class="editor-container">
    <!-- 模式切换工具栏 -->
    <div class="mode-switch">
      <el-radio-group v-model="editorMode" size="small">
        <el-radio label="edit">纯编辑</el-radio>
        <el-radio label="preview">纯预览</el-radio>
        <el-radio label="split">编辑/预览</el-radio>
      </el-radio-group>
    </div>

    <!-- 编辑器与预览区域容器 -->
    <div class="editor-preview-wrapper" :class="editorMode">
      <!-- 编辑区域（纯编辑/分栏模式显示） -->
      <div class="edit-area" v-show="editorMode !== 'preview'">
        <quill-editor
            theme="snow"
            v-model:content="editorContent"
            contentType="html"
            :options="editorOptions"
            @update:content="handleContentChange"
            :disabled="loading || editorMode === 'preview'"
        />
      </div>

      <!-- 预览区域（纯预览/分栏模式显示） -->
      <div class="preview-area" v-show="editorMode !== 'edit'">
        <div class="preview-content" v-html="previewHtml"></div>
      </div>
    </div>

    <!-- 可选：Markdown 提示 -->
    <div v-if="showMarkdownTip" class="markdown-tip">
      <el-tag size="small" type="info">支持 Markdown 语法</el-tag>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, computed, onMounted, onUnmounted } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import ImageUploader from 'quill-image-uploader'
import Quill from 'quill'
import { useTokenStore } from '@/stores/token.js'
import { ElMessage } from 'element-plus'
// 新增：Markdown 解析、代码高亮、剪贴板
import { marked } from 'marked'
import hljs from 'highlight.js'
import ClipboardJS from 'clipboard'
import 'highlight.js/styles/github.css' // 代码高亮样式
// 可选：引入更多代码语言支持（按需添加）
// import hljsDefineVue from 'highlight.js/lib/languages/vue'

// 注册图片上传模块
Quill.register('modules/imageUploader', ImageUploader)

// 定义Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  customOptions: {
    type: Object,
    default: () => ({})
  },
  height: {
    type: [String, Number],
    default: 500 // 调整高度适配分栏
  },
  loading: {
    type: Boolean,
    default: false
  },
  showMarkdownTip: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: '请输入内容（支持 Markdown 语法）...'
  }
})

// 定义Emits
const emit = defineEmits(['update:modelValue', 'content-change'])

// Token存储
const tokenStore = useTokenStore()

// 编辑器内容
const editorContent = ref(props.modelValue)
// 编辑器模式：edit(纯编辑) / preview(纯预览) / split(分栏)
const editorMode = ref('edit')
// 剪贴板实例
let clipboardInstance = null

// 监听父组件传入值变化
watch(
    () => props.modelValue,
    (newVal) => {
      editorContent.value = newVal || ''
    },
    { immediate: true }
)

// 配置 marked + highlight.js
onMounted(() => {
  // 配置 marked 渲染（代码高亮）
  marked.setOptions({
    highlight: (code, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        // 有指定语言则高亮对应语言
        return hljs.highlight(code, { language: lang }).value
      }
      // 无指定语言则自动识别
      return hljs.highlightAuto(code).value
    },
    breaks: true, // 换行符转换为 <br>
    gfm: true // 支持 GitHub 风格的 Markdown
  })

  // 初始化剪贴板（代码复制功能）
  clipboardInstance = new ClipboardJS('.copy-btn', {
    text: (trigger) => {
      // 获取对应代码块的内容
      return trigger.previousElementSibling.textContent
    }
  })

  // 剪贴板成功/失败回调
  clipboardInstance.on('success', () => {
    ElMessage.success('代码复制成功')
  })
  clipboardInstance.on('error', () => {
    ElMessage.error('代码复制失败')
  })
})

// 组件卸载时销毁剪贴板实例
onUnmounted(() => {
  if (clipboardInstance) {
    clipboardInstance.destroy()
  }
})

// 解析后的预览 HTML（添加代码复制按钮）
const previewHtml = computed(() => {
  if (!editorContent.value) {
    return '<div class="empty-preview">暂无内容</div>'
  }

  // 第一步：解析 Markdown 为 HTML
  let html = marked.parse(editorContent.value)

  // 第二步：为代码块添加复制按钮（替换<pre>标签）
  html = html.replace(
      /<pre><code class="(.*?)">([\s\S]*?)<\/code><\/pre>/g,
      '<div class="code-block-wrapper"><pre><code class="$1">$2</code></pre><button class="copy-btn" data-clipboard-snippet>复制代码</button></div>'
  )

  return html
})

// 编辑器配置
const editorOptions = computed(() => {
  const defaultOptions = {
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ header: 1 }, { header: 2 }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      imageUploader: {
        upload: (file) => {
          return new Promise((resolve, reject) => {
            const formData = new FormData()
            formData.append('file', file)
            const xhr = new XMLHttpRequest()
            xhr.open('POST', 'http://localhost:8080/upload', true)
            xhr.setRequestHeader('Authorization', tokenStore.token)
            xhr.onload = () => {
              if (xhr.status === 200) {
                try {
                  const response = JSON.parse(xhr.responseText)
                  resolve(response.data)
                } catch (error) {
                  ElMessage.error('图片上传失败')
                  reject(new Error('图片上传失败'))
                }
              } else {
                ElMessage.error('图片上传失败')
                reject(new Error('图片上传失败'))
              }
            }
            xhr.onerror = () => {
              ElMessage.error('图片上传失败')
              reject(new Error('图片上传失败'))
            }
            xhr.send(formData)
          })
        }
      }
    },
    theme: 'snow',
    formats: [
      'bold', 'italic', 'underline', 'strike',
      'blockquote', 'code-block',
      'header', 'list', 'bullet',
      'link', 'image',
      'clean', 'align', 'color', 'background',
      'size', 'font'
    ],
    placeholder: props.placeholder
  }

  return { ...defaultOptions, ...props.customOptions }
})

// 内容变化回调
const handleContentChange = () => {
  emit('update:modelValue', editorContent.value)
  emit('content-change', editorContent.value)
}
</script>

<style lang="scss" scoped>
.editor-container {
  width: 100%;
  height: v-bind(height + 'px');
  padding: 10px;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;

  // 模式切换工具栏样式
  .mode-switch {
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
  }

  // 编辑器与预览区域容器
  .editor-preview-wrapper {
    width: 100%;
    height: calc(100% - 40px);
    overflow: hidden;

    // 纯编辑模式
    &.edit {
      .edit-area {
        width: 100%;
        height: 100%;
      }
    }

    // 纯预览模式
    &.preview {
      .preview-area {
        width: 100%;
        height: 100%;
      }
    }

    // 分栏模式
    &.split {
      display: flex;
      gap: 10px;

      .edit-area,
      .preview-area {
        flex: 1;
        height: 100%;
      }
    }
  }

  // 编辑区域样式
  .edit-area {
    height: 100%;
    overflow: hidden;

    :deep(.ql-editor) {
      min-height: calc(100% - 40px);
      max-height: calc(100% - 40px);
      white-space: pre-wrap;
      color: #000000;
      overflow-y: auto;
    }

    :deep(.ql-toolbar) {
      border-bottom: 1px solid #e5e7eb;
      border-radius: 4px 4px 0 0;
    }

    :deep(.ql-container) {
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 4px 4px;
      height: 100%;
    }

    :deep(.ql-editor.ql-blank::before) {
      color: #999;
      font-style: normal;
    }
  }

  // 预览区域样式
  .preview-area {
    height: 100%;
    padding: 15px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    overflow-y: auto;
    background: #fff;
    box-sizing: border-box;

    .preview-content {
      width: 100%;
      color: #333;
      line-height: 1.6;

      // 空内容提示
      .empty-preview {
        color: #999;
        text-align: center;
        padding: 20px;
      }

      // Markdown 样式适配
      h1, h2, h3, h4, h5, h6 {
        margin: 16px 0;
        font-weight: 600;
      }

      p {
        margin: 8px 0;
      }

      blockquote {
        margin: 16px 0;
        padding: 8px 16px;
        border-left: 4px solid #e5e7eb;
        background: #f9fafb;
        color: #666;
      }

      ul, ol {
        margin: 8px 0 8px 24px;
      }

      img {
        max-width: 100%;
        border-radius: 4px;
      }

      a {
        color: #165dff;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      // 代码块容器（包含复制按钮）
      .code-block-wrapper {
        position: relative;
        margin: 16px 0;

        // 复制按钮样式
        .copy-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 4px 8px;
          font-size: 12px;
          border: none;
          border-radius: 4px;
          background: #165dff;
          color: #fff;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;

          &:hover {
            opacity: 1;
          }
        }

        // 代码块样式
        pre {
          margin: 0;
          padding: 16px;
          border-radius: 4px;
          background: #f6f8fa;
          overflow-x: auto;

          code {
            font-size: 14px;
            line-height: 1.5;
          }
        }
      }
    }
  }

  .markdown-tip {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    background: #fff;
    padding: 0 4px;
  }
}

// 加载状态遮罩
:deep(.ql-editor[contenteditable="false"]) {
  background-color: rgba(245, 245, 245, 0.5);
  cursor: not-allowed;
}
</style>