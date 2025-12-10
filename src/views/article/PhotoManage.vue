<script setup lang="js">
import {
  Edit,
  Delete
} from '@element-plus/icons-vue'

import { ref } from 'vue'

//文章分类数据模型
const categorys = ref([])

//用户搜索时选中的分类id
const categoryId = ref('')

//文章列表数据模型
const photos = ref([])

//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(3)//每页条数

//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
  pageSize.value = size
  photoList()
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
  pageNum.value = num
  photoList()
}

import {articleCateListService} from '@/api/article.js'

//回显文章分类列表选择
const articleCategoryList = async () => {
  let result = await articleCateListService();
  categorys.value = result.data;

}
articleCategoryList()

const photoTitle=ref('')

//获取文章分页列表数据
const photoList = async () => {
  let params = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    title: photoTitle.value ? photoTitle.value : null,
    categoryId: categoryId.value ? categoryId.value : null,
  }
  let result = await photoPageListService(params)
  //获取文章分页列表数据
  photos.value = result.data.items;
  total.value = result.data.total;
}

photoList();

import {Quill, QuillEditor} from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import ImageUploader from 'quill-image-uploader';
Quill.register('modules/imageUploader', ImageUploader);

// 配置quill编辑器选项
const editorOptions = {
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline','strike'],        // 加粗、斜体、下划线、删除线
      ['blockquote', 'code-block'],                   // 引用、代码块
      [{ 'header': 1 }, { 'header': 2 }],             // 标题
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],  // 有序列表、无序列表
      ['link', 'image'],                             // 链接、图片
      ['clean']                                      // 清除格式
    ],
    imageUploader: {
      upload: (file) => {
        return new Promise((resolve, reject) => {
          const formData = new FormData();
          formData.append('file', file);
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/upload', true);
          xhr.setRequestHeader('Authorization', tokenStore.token);
          xhr.onload = () => {
            console.log('服务器响应状态码:', xhr.status);
            console.log('服务器响应内容:', xhr.responseText);
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response.data);
              } catch (error) {
                console.error('响应数据解析失败:', error);
                ElMessage.error('图片上传失败');
                reject(new Error('图片上传失败'));
              }
            } else {
              ElMessage.error('图片上传失败');
              reject(new Error('图片上传失败'));
            }
          };
          xhr.onerror = () => {
            ElMessage.error('图片上传失败');
            console.error('请求出错');
            reject(new Error('图片上传失败'));
          };
          console.log('开始发送上传请求');
          xhr.send(formData);
        });
      }
    }
  },
  // 保留空格和换行
  theme: 'snow',
  formats: [
    'bold', 'italic', 'underline', 'strike',
    'blockquote', 'code-block',
    'header', 'list', 'bullet',
    'link', 'image',
    'clean',
    'align', 'color', 'background',
    'size', 'font'
  ]
};

//控制抽屉是否显示
const visibleDrawer = ref(false)

//添加表单数据模型
const photoModel = ref({
  title: '',
  categoryId: '',
  url: '',
  thumbnailUrl: '',
  description: ''
})

import {useTokenStore} from '@/stores/token.js'
import {ElMessage, ElMessageBox} from "element-plus";
const tokenStore = useTokenStore()


//添加文章
const addphoto = async () => {
  // 如果表单数据为空，则弹出不能为空的ElMessage
  if (photoModel.value.title === '' || photoModel.value.categoryId === '' || photoModel.value.url === '' ||
      photoModel.value.thumbnailUrl === ''||photoModel.value.description === '') {
    ElMessage.warning('不能为空')
    return
  }
  // 调用接口
  let result = await photoAddService(photoModel.value)
  ElMessage.success(result.data ? result.data : '添加成功')
  // 关闭抽屉
  visibleDrawer.value = false
  // 刷新当前列表
  await photoList();
}

import {photoAddService, photoDeleteService, photoPageListService, photoUpdateService} from "@/api/photo.js";
const photoDelete =  (row) => {
  // 提示用户，确认框
  ElMessageBox.confirm(
      '你确认要删除该分类信息吗?',
      '温馨提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
  )
      .then(async () => {
        // 调用接口
        await photoDeleteService(row.id)
        ElMessage({
          type:'success',
          message: '删除成功'
        })
        // 刷新列表
        await photoList();
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '用户取消了删除'
        })
      })
}

// 定义变量，控制抽屉的标题
const title = ref('')


const showDialog = (row)=>{
  // 抽屉的显示
  visibleDrawer.value = true
  title.value = '编辑相册'
  // 数据拷贝
  photoModel.value.title = row.title
  photoModel.value.categoryId = row.categoryId
  photoModel.value.url = row.url
  photoModel.value.thumbnailUrl = row.thumbnailUrl
  photoModel.value.description = row.description
  // 扩展id属性，将来需要传递给后台，完成分类的修改
  photoModel.value.id = row.id
}

// 更新文章
const updatephoto = async ()=>{
  let result = await photoUpdateService(photoModel.value)
  ElMessage.success(result.data? result.data :'修改成功');
  // 关闭抽屉
  visibleDrawer.value = false
  // 刷新当前列表
  await photoList();
}

// 清空模型的数据
const clearData = ()=>{
  photoModel.value.title = ''
  photoModel.value.categoryId = ''
  photoModel.value.url = ''
  photoModel.value.thumbnailUrl = ''
  photoModel.value.description = ' '
  // 扩展id属性，将来需要传递给后台，完成分类的修改
  photoModel.value.id = ''
}
</script>

<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>相册管理</span>
        <div class="extra">
          <el-button type="primary" @click="visibleDrawer = true,title='添加相册',clearData()">添加相册</el-button>
        </div>
      </div>
    </template>
    <!-- 搜索表单 -->
    <el-form inline>
      <el-form-item label="图片标题：" style="width: 300px">
        <el-input v-model="photoTitle" placeholder="请输入图片标题">
        </el-input>
      </el-form-item>

      <el-form-item label="图片分类：" style="width: 300px">
        <el-select placeholder="请选择" v-model="categoryId">
          <el-option
              v-for="c in categorys"
              :key="c.id"
              :label="c.categoryName"
              :value="c.id">
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="photoList">搜索</el-button>
        <el-button @click="photoTitle='';categoryId=''">重置</el-button>
      </el-form-item>
    </el-form>
    <!-- 文章列表 -->
    <el-table :data="photos" style="width: 100%">
      <el-table-column label="编号" width="80" prop="id"></el-table-column>
      <el-table-column label="图片封面" width="150">
        <!-- 使用 v-slot 来获取当前行的数据 -->
        <template #default="{row}">
          <!-- 绑定头像的 URL 到 src 属性 -->
          <img :src="row.url" alt="图片封面"
               :style="{width: '100px', height: 'auto', objectFit: 'cover', borderRadius: '15%'}">
        </template>
      </el-table-column>
      <el-table-column label="图片标题" width="100" prop="title"></el-table-column>
      <el-table-column label="图片分类" width="100" prop="categoryName"></el-table-column>
      <el-table-column
          label="图片预览地址"
          prop="thumbnailUrl"
          width="200"
      >
      <template #default="scope">
        <div class="fixed-width-cell">
          {{ scope.row.thumbnailUrl }}
        </div>
      </template>
      </el-table-column>
      <el-table-column
          label="图片描述"
          prop="description"
          width="200"
      >
        <template #default="scope">
          <div class="fixed-width-cell">
              <p v-html="scope.row.description"></p>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="发表时间" prop="createTime"></el-table-column>
      <el-table-column label="更新时间" prop="updateTime"></el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button :icon="Edit" circle plain type="primary" @click="showDialog(row)"></el-button>编辑
          <el-button :icon="Delete" circle plain type="danger" @click="photoDelete(row)"></el-button>删除
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="没有数据"/>
      </template>
    </el-table>
    <!-- 分页条 -->
    <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :page-sizes="[3, 5 ,10, 15]"
                   layout="jumper, total, sizes, prev, pager, next" background :total="total"
                   @size-change="onSizeChange"
                   @current-change="onCurrentChange" style="margin-top: 20px; justify-content: flex-end"/>
    <!-- 抽屉 -->
    <el-drawer v-model="visibleDrawer" :title="title" direction="rtl" size="50%">
      <!-- 添加文章表单 -->
      <el-form :model="photoModel" label-width="100px">
        <el-form-item label="图片标题">
          <el-input v-model="photoModel.title" placeholder="请输入标题"></el-input>
        </el-form-item>
        <el-form-item label="文章分类">
          <el-select placeholder="请选择" v-model="photoModel.categoryId">
            <el-option v-for="c in categorys" :key="c.id" :label="c.categoryName" :value="c.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="图片地址">
          <el-input v-model="photoModel.url" placeholder="请输入图片URL"></el-input>
        </el-form-item>
        <el-form-item label="图片预览地址">
          <el-input v-model="photoModel.thumbnailUrl" placeholder="请输入图片thumbnailUrl"></el-input>
        </el-form-item>
        <el-form-item label="图片描述">
          <div class="editor">
            <quill-editor
                theme="snow"
                v-model:content="photoModel.description"
                contentType="html"
                :options="editorOptions"
            >
            </quill-editor>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="title==='添加相册'? addphoto() : updatephoto()">确认</el-button>
          <el-button @click="visibleDrawer = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
  </el-card>
</template>

<style lang="scss" scoped>
.fixed-width-cell {
  width: 100%;  /* 继承单元格宽度 */
  white-space: nowrap;  /* 禁止换行 */
  overflow: hidden;  /* 溢出部分隐藏 */
  text-overflow: ellipsis;  /* 溢出显示省略号（可选） */
  padding: 4px 0;  /* 微调内边距，避免内容紧贴边框 */
}


.page-container {
  min-height: 100%;
  box-sizing: border-box;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

/* 抽屉样式 */
.avatar-uploader {
  :deep() {
    .avatar {
      width: 178px;
      height: 178px;
      display: block;
    }

    .el-upload {
      border: 1px dashed var(--el-border-color);
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: var(--el-transition-duration-fast);
    }

    .el-upload:hover {
      border-color: var(--el-color-primary);
    }

    .el-icon.avatar-uploader-icon {
      font-size: 28px;
      color: #8c939d;
      width: 178px;
      height: 178px;
      text-align: center;
    }
  }
}

.editor {
  width: 100%;
  .ql-editor {
    white-space: pre-wrap; /* 保留空格，自动换行 */
    min-height: 200px;
  }

  :deep(.ql-editor) {
    min-height: 200px;
    white-space: pre-wrap; /* 保留空格，自动换行 */
  }
}
</style>