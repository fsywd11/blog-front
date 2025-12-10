<template>
  <div class="editor-container">
    <quill-editor
        theme="snow"
        v-model:content="editorContent"
        contentType="html"
        :options="editorOptions"
        @update:content="handleContentChange"
        :disabled="loading"
    />
    <!-- 可选：Markdown 提示 -->
    <div v-if="showMarkdownTip" class="markdown-tip">
      <el-tag size="small" type="info">支持 Markdown 语法</el-tag>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, computed } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import ImageUploader from 'quill-image-uploader'
import Quill from 'quill'
import { useTokenStore } from '@/stores/token.js'
import { ElMessage } from 'element-plus'

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
    default: 340
  },
  loading: {
    type: Boolean,
    default: false
  },
  showMarkdownTip: {
    type: Boolean,
    default: true
  }
})

// 定义Emits
const emit = defineEmits(['update:modelValue', 'content-change'])

// Token存储
const tokenStore = useTokenStore()

// 编辑器内容
const editorContent = ref(props.modelValue)

// 监听父组件传入值变化
watch(
    () => props.modelValue,
    (newVal) => {
      editorContent.value = newVal || ''
    },
    { immediate: true }
)

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
            xhr.open('POST', '/api/upload', true)
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
    placeholder: props.placeholder || '请输入内容（支持 Markdown 语法）...'
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

  :deep(.ql-editor) {
    min-height: 200px;
    max-height: calc(v-bind(height + 'px') - 60px);
    white-space: pre-wrap;
    color: #000000;
  }

  :deep(.ql-toolbar) {
    border-bottom: 1px solid #e5e7eb;
  }

  :deep(.ql-container) {
    border: 1px solid #e5e7eb;
    border-top: none;
  }

  :deep(.ql-editor.ql-blank::before) {
    color: #999;
    font-style: normal;
  }
}

.markdown-tip {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}

// 加载状态遮罩
:deep(.ql-editor[contenteditable="false"]) {
  background-color: rgba(245, 245, 245, 0.5);
  cursor: not-allowed;
}
</style>