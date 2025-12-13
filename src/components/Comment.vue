<script setup lang="js">
import {commentAddService, commentList} from "@/api/comment.js";
import {ElMessage} from "element-plus";
import {onMounted, ref, watch} from "vue";
import {ChatLineSquare} from "@element-plus/icons-vue";
// 评论相关数据
const comments = ref([]);
import userImg from '@/assets/用户.svg'

const props = defineProps({
  articleId: {
    type: Number,
    required: true
  },
  // 是否显示头部添加框
  isShowHeader: {
    type: Boolean,
    default: true
  },
  // 评论类型
  type: Number,
  // 点赞类型
  likeType: Number
})

const CommentList = async () => {
  let result = await commentList(props.articleId);
  comments.value = result.data;
};

watch(() => props.articleId, () => {
  CommentList();
}, {immediate: true});

onMounted(() => {
  CommentList();
});

const commentModel = ref({
  articleId: props.articleId,
  content: '',
})

//清空模型的数据
const clearData = () => {
  commentModel.value.articleId = props.articleId  // 修复：保留文章ID
  commentModel.value.content = ''
  commentModel.value.id = ''
}

// 提交评论的方法
const submitComment = async () => {
  if (commentModel.value.content === '') {
    ElMessage.warning('评论内容不能为空');
    return;
  }

  let result = await commentAddService(commentModel.value);
  ElMessage.success(result.data ? result.data : '已收下您的点评');
  await CommentList();
  clearData();  // 移到这里，确保只有提交成功后才清空
};

// 处理键盘事件
const handleKeyDown = (e) => {
  // 如果按下的是Enter键
  if (e.key === 'Enter') {
    // 如果没有按下Shift键，则提交评论
    if (!e.shiftKey) {
      e.preventDefault(); // 阻止默认行为（换行）
      submitComment();
    }
    // 如果按下Shift+Enter，则保留默认换行行为
  }
};
</script>

<template>
  <div class="comment-title">
    <span><el-icon><ChatLineSquare /></el-icon>评论({{ comments.length }})</span>
  </div>
  <el-form class="comment-input" :model="commentModel">
    <!-- 添加@keydown事件监听 -->
    <textarea
        class="textarea"
        v-model="commentModel.content"
        placeholder="留下你的精彩评论吧！按Enter提交，Shift+Enter换行"
        @keydown="handleKeyDown"
    />
    <el-button type="primary" @click="submitComment">提交评论</el-button>
  </el-form>
  <!-- 评论列表 -->
  <div class="comment-list">
    <div v-for="(comment, index) in comments" :key="index">
      <div class="comment">
        <div class="comment-header">
          <img class="comment-icon" :src=userImg alt="用户头像"/>
          <div class="comment-username">
            <p>{{ comment.username }}</p>
          </div>
          <p class="comment-time">{{ comment.createTime }}</p>
        </div>
        <div class="comment-text">
          <p>{{ comment.content }}</p>
        </div>
      </div>
    </div>
    <!-- 修复：正确处理空状态 -->
    <div v-if="comments.length === 0">
      <el-empty description="暂时没有评论"/>
    </div>
    <el-divider v-if="comments.length !== 0">
      --没有更多啦--
    </el-divider>
  </div>
</template>

<style scoped lang="scss">
.comment-title {
  display: flex;
  align-items: center;
  font-size: 1.5em;
  font-weight: bold;
  margin: 2rem 0;

  span {
    margin-left: 0.5rem;
  }
}

.comment-input {
  margin-bottom: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  .textarea {
    background-color: var(--textarea-color);
    color: var(--text);
    resize: none;
    padding: 0.5rem;
    width: 100%;
    height: 20em;
    border-radius: 0.5em;
    line-height: 1.5em;
    border: 1px solid var(--el-border-color);
    margin-bottom: 10px;
    background-image: var(--textarea-bg);
    background-repeat: no-repeat;
    background-position: right center;
    background-size: contain;
    background-attachment: scroll;
  }
}

.comment-list {
  padding: 20px;
  border: 1px solid var(--el-border-color);
  border-radius: 15px;
  width: 100%;
  height: auto;

  .comment {
    padding: 10px;
    border-radius: 15px;
    border: 1px solid var(--el-border-color);
    margin-bottom: 5px;
    transition: all 0.3s ease;
    &:hover {
      cursor: pointer;
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
  }

  .comment-username {
    display: flex;
    align-items: center;
  }


  .comment-time  {
    margin-left: 40px;
  }

  .comment-text {
    border: 1px solid var(--el-border-color);
    border-radius: 15px;
    padding: 10px;
    background-color: rgba(220, 216, 216, 0.43);
  }
}

.comment-header {
  display: flex;
  flex-direction: row;

  .comment-icon {
    width: 30px;
    height: 30px;
    border-radius: 45px;
    border: 1px solid #393333;
  }
}


</style>
