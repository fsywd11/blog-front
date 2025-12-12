<template>
  <div class="article-preview-container" :style="{ height: containerHeight }">
    <!-- 纯预览组件 MdPreview -->
    <MdPreview
        class="md-editor-dark"
        :editorId="previewEditorId"
        :modelValue="handleContent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps } from 'vue';
import { MdPreview } from 'md-editor-v3';
// 引入预览组件专属样式（体积更小）
import 'md-editor-v3/lib/preview.css';
import DOMPurify from 'dompurify';
import {PropType} from "vue"

// 定义Props并完善TypeScript类型
const props = defineProps({
  content: {
    type: String,
    default: '',
  },
  isHtml: {
    type: Boolean,
    default: false,
  },
  height: {
    type: [String, Number] as PropType<string | number>,
    default: 'auto',
  },
});

// 预览编辑器唯一ID（避免多个组件冲突）
const previewEditorId = ref(`md-preview-${Date.now()}-${Math.random().toString(36).slice(2)}`);

// 处理内容：XSS过滤 + 空内容提示 + 格式判断
const handleContent = computed(() => {
  if (!props.content) {
    // 空内容提示（使用HTML）
    return '<div class="article-empty-tip">暂无文章内容</div>';
  }

  // DOMPurify过滤XSS
  const sanitizedContent = DOMPurify.sanitize(props.content);

  // isHtml为true时直接返回过滤后的HTML，否则返回Markdown文本
  return props.isHtml ? sanitizedContent : sanitizedContent;
});

// 容器高度处理：数字转px，其他值直接使用
const containerHeight = computed(() => {
  return typeof props.height === 'number' ? `${props.height}px` : props.height || 'auto';
});
</script>

<style lang="scss" scoped>
.article-preview-container {
  width: 100%;
  overflow: auto;
  box-sizing: border-box;

  // 预览组件的根容器样式（按需调整）
  :deep(.md-preview) {
    height: 100%;
    box-sizing: border-box;
  }

  // 预览内容区域样式（按需调整内边距）
  :deep(.md-preview-content) {
    padding: 0; // 如需内边距可改为 16px
    box-sizing: border-box;
  }
  // 空内容提示样式
  :deep(.article-empty-tip) {
    color: #999;
    text-align: center;
    padding: 60px 0;
    font-size: 14px;
  }
}

.md-editor-dark {
  --md-bk-color: var(--bg) !important;
}
</style>