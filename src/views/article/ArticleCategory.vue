<script setup lang="js">
import {
  Edit,
  Delete,
  Plus,
  Refresh,
  Search
} from '@element-plus/icons-vue'
import { ref, watch, onMounted } from 'vue'
const categorys = ref([])
// 用于批量删除的选中项
const selectedIds = ref([])
// 全选状态
const isAllSelected = ref(false)
// 半选状态（部分选中）
const isIndeterminate = ref(false)
// 表格刷新标识（用于解决复选框UI同步问题）
const tableKey = ref(0)
// 加载状态
const loading = ref(false)
// 搜索关键词
const searchKeyword = ref('')
// 过滤后的分类数据
const filteredCategorys = ref([])

// 声明一个异步的函数
import {CateListService, articleCategoryAddService, articleCategoryUpdateService, articleCategoryDeleteService} from '@/api/article.js'
const ArticleCategoryList = async () => {
  loading.value = true
  try {
    let result = await CateListService()
    categorys.value = result.data || [];
    // 重新加载数据后清空选中状态
    selectedIds.value = []
    updateSelectionStatus()
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 监听搜索关键词变化，更新过滤后的分类数据
watch([searchKeyword, categorys], () => {
  if (!searchKeyword.value) {
    filteredCategorys.value = categorys.value
  } else {
    const keyword = searchKeyword.value.toLowerCase()
    filteredCategorys.value = categorys.value.filter(item => 
      item.categoryName.toLowerCase().includes(keyword) || 
      item.categoryAlias.toLowerCase().includes(keyword)
    )
  }
}, { immediate: true })

// 列表渲染，调用获取所有文章分类的函数
onMounted(() => {
  ArticleCategoryList()
})

// 控制添加分类弹窗
const dialogVisible = ref(false)

// 添加分类数据模型
const categoryModel = ref({
  categoryName: '',
  categoryAlias: ''
})

// 添加分类表单校验
const rules = {
  categoryName: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 10, message: '分类名称长度应在1-10个字符之间', trigger: 'blur' }
  ],
  categoryAlias: [
    { required: true, message: '请输入分类别名', trigger: 'blur' },
    { min: 1, max: 15, message: '分类别名长度应在1-15个字符之间', trigger: 'blur' }
  ]
}

// 表单引用，用于重置表单
const categoryFormRef = ref(null)

import {ElMessage, ElMessageBox} from "element-plus";
// 调用接口,添加表单
const addCategory = async ()=>{
  if (!categoryFormRef.value) return
  
  // 表单验证
  await categoryFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 调用接口
        let result = await articleCategoryAddService(categoryModel.value)
        ElMessage.success(result.data ? result.data : '添加成功')
        // 调用获取所有文章分类的函数
        await ArticleCategoryList()
        // 弹窗消失
        dialogVisible.value = false
      } catch (error) {
        console.error('添加分类失败:', error)
        ElMessage.error('添加分类失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }
  })
}

// 定义变量，控制弹窗的标题
const title = ref('')

const showDialog = (row)=>{
  dialogVisible.value = true
  title.value = '修改分类'
  // 数据拷贝
  categoryModel.value = {
    id: row.id,
    categoryName: row.categoryName,
    categoryAlias: row.categoryAlias
  }
}

// 编辑分类
const updateCategory = async ()=>{
  if (!categoryFormRef.value) return
  
  // 表单验证
  await categoryFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        let result = await articleCategoryUpdateService(categoryModel.value)
        ElMessage.success(result.data ? result.data : '修改成功')
        // 调用获取所有文章分类的函数
        await ArticleCategoryList()
        // 弹窗消失,隐藏弹窗
        dialogVisible.value = false
      } catch (error) {
        console.error('修改分类失败:', error)
        ElMessage.error('修改分类失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }
  })
}

// 清空模型的数据
const clearData = ()=>{
  categoryModel.value = {
    categoryName: '',
    categoryAlias: ''
  }
  // 重置表单校验状态
  if (categoryFormRef.value) {
    categoryFormRef.value.resetFields()
  }
}

// 重新加载数据
const refreshData = () => {
  ArticleCategoryList()
}

// 单个删除分类
const deleteCategory = (row)=>{
  // 提示用户，确认框
  ElMessageBox.confirm(
      `确定要删除分类「${row.categoryName}」吗？删除后不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
  )
      .then(async () => {
        loading.value = true
        try {
          // 调用接口
          await articleCategoryDeleteService(row.id)
          ElMessage({
            type: 'success',
            message: '删除成功'
          })
          // 从选中列表中移除已删除项
          const index = selectedIds.value.indexOf(row.id)
          if (index !== -1) {
            selectedIds.value.splice(index, 1)
          }
          // 刷新列表
          await ArticleCategoryList();
        } catch (error) {
          console.error('删除分类失败:', error)
          ElMessage.error('删除分类失败，请稍后重试')
        } finally {
          loading.value = false
        }
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '已取消删除操作'
        })
      })
}

// 批量删除分类（循环调用单个删除接口）
const batchDeleteCategories = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要删除的分类')
    return
  }

  ElMessageBox.confirm(
      `你确认要删除选中的${selectedIds.value.length}个分类吗?`,
      '温馨提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
  )
      .then(async () => {
        try {
          let successCount = 0
          const failIds = []

          // 循环调用单个删除接口
          for (const id of selectedIds.value) {
            try {
              await articleCategoryDeleteService(id)
              successCount++
            } catch (error) {
              failIds.push(id)
              console.error(`删除ID为${id}的分类失败:`, error)
            }
          }

          // 关闭加载提示
          ElMessage.closeAll()

          // 显示结果消息
          if (failIds.length === 0) {
            ElMessage({
              type: 'success',
              message: `全部${selectedIds.value.length}个分类删除成功`
            })
          } else {
            ElMessage({
              type: 'warning',
              message: `成功删除${successCount}个分类，${failIds.length}个分类删除失败`
            })
          }

          // 刷新列表
          await ArticleCategoryList();
        } catch (error) {
          // 关闭加载提示
          ElMessage.closeAll()

          // 显示错误消息
          ElMessage({
            type: 'error',
            message: '批量删除过程中发生错误'
          })
          console.error('批量删除错误:', error)
        }
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '用户取消了删除'
        })
      })
}

// 更新选择状态（全选、半选）
const updateSelectionStatus = () => {
  const total = categorys.value.length;
  const selected = selectedIds.value.length;

  // 防止数据为空时误判
  if (total === 0) {
    isAllSelected.value = false;
    isIndeterminate.value = false;
    return;
  }

  if (selected === 0) {
    isAllSelected.value = false;
    isIndeterminate.value = false;
  } else if (selected === total) {
    isAllSelected.value = true;
    isIndeterminate.value = false;
  } else {
    isAllSelected.value = false;
    isIndeterminate.value = true;
  }
}

// 处理行点击，切换选中状态
const handleRowClick = (row) => {
  const index = selectedIds.value.indexOf(row.id);
  if (index === -1) {
    // 未选中则添加到选中列表
    selectedIds.value = [...selectedIds.value, row.id];
  } else {
    // 已选中则从列表中移除
    selectedIds.value = selectedIds.value.filter(id => id !== row.id);
  }
  updateSelectionStatus();
}

// 处理单选
const handleSelectionChange = (row, selected) => {
  if (selected) {
    // 确保不重复添加
    if (!selectedIds.value.includes(row.id)) {
      selectedIds.value = [...selectedIds.value, row.id]
    }
  } else {
    // 移除选中项（更严谨的写法）
    selectedIds.value = selectedIds.value.filter(id => id !== row.id)
  }
  updateSelectionStatus()
}

// 处理全选
const handleAllSelectionChange = (checked) => {
  if (checked) {
    // 全选：添加所有id
    selectedIds.value = categorys.value.map(item => item.id)
  } else {
    // 取消全选：清空数组
    selectedIds.value = []
  }
  // 强制表格刷新，解决子复选框UI同步问题
  tableKey.value++
  // 更新选择状态
  updateSelectionStatus()
}

// 监听数据变化，更新选择状态
watch([() => categorys.value, () => selectedIds.value], () => {
  updateSelectionStatus()
}, { deep: true })
</script>
<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <h2 class="title">文章分类管理</h2>
        <div class="header-actions">
          <!-- 搜索框 -->
          <el-input
            v-model="searchKeyword"
            placeholder="搜索分类名称或别名"
            prefix-icon="Search"
            clearable
            class="search-input"
          />
          
          <!-- 批量删除按钮 -->
          <el-button
              type="danger"
              :icon="Delete"
              @click="batchDeleteCategories"
              :disabled="selectedIds.length === 0"
              class="mr-2 action-button"
              :loading="loading"
          >
            批量删除 ({{ selectedIds.length }})
          </el-button>
          
          <!-- 刷新按钮 -->
          <el-button
            :icon="Refresh"
            @click="refreshData"
            class="mr-2"
            :loading="loading"
          >刷新</el-button>
          
          <!-- 添加分类按钮 -->
          <el-button 
            type="primary" 
            :icon="Plus"
            @click="dialogVisible = true, title='添加分类', clearData()"
            :loading="loading"
          >添加分类</el-button>
        </div>
      </div>
    </template>
    
    <!-- 表格区域 -->
    <div class="table-wrapper">
      <!-- 表格添加key属性用于强制刷新 -->
      <el-table 
        :data="filteredCategorys" 
        style="width: 100%" 
        :key="tableKey"
        :row-style="{ height: '50px' }"
        :header-row-style="{ background: '#fafafa', fontWeight: 'bold' }"
        :loading="loading"
        stripe
        @row-click="(row) => $event.target.tagName !== 'INPUT' && $event.target.tagName !== 'LABEL' && handleRowClick(row)"
      >
        <!-- 复选框列 - 全选功能 -->
        <el-table-column width="55">
          <template #header>
            <el-checkbox
                v-model="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="handleAllSelectionChange"
                :disabled="categorys.length === 0"
            >
            </el-checkbox>
          </template>
          <template #default="{ row }">
            <el-checkbox
                :checked="selectedIds.includes(row.id)"
                @change="(checked) => handleSelectionChange(row, checked)"
            >
            </el-checkbox>
          </template>
        </el-table-column>

        <el-table-column label="序号" width="80" type="index" :index="(index) => index + 1"></el-table-column>
        <el-table-column label="分类名称" prop="categoryName" show-overflow-tooltip></el-table-column>
        <el-table-column label="分类别名" prop="categoryAlias" show-overflow-tooltip></el-table-column>
        <el-table-column label="创建时间" width="180" prop="createTime" show-overflow-tooltip></el-table-column>
        <el-table-column label="更新时间" width="180" prop="updateTime" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button 
                :icon="Edit" 
                size="small"
                type="primary" 
                @click="showDialog(row)"
                class="action-btn-edit"
                :loading="loading"
              ></el-button>
              <el-button 
                :icon="Delete" 
                size="small"
                type="danger" 
                @click="deleteCategory(row)"
                class="action-btn-delete"
                :loading="loading"
              ></el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无分类数据" image-size="120" />
        </template>
      </el-table>
      
      <!-- 统计信息 -->
      <div class="table-footer" v-if="categorys.length > 0">
        <span class="total-count">共 {{ categorys.length }} 个分类，当前显示 {{ filteredCategorys.length }} 个</span>
      </div>
    </div>
    
    <!-- 添加分类弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="title" 
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form 
        ref="categoryFormRef"
        :model="categoryModel" 
        :rules="rules" 
        label-width="100px" 
        style="padding-right: 20px"
        :size="'default'"
      >
        <el-form-item label="分类名称" prop="categoryName">
          <el-input 
            v-model="categoryModel.categoryName" 
            placeholder="请输入分类名称"
            show-word-limit
            maxlength="10"
          ></el-input>
        </el-form-item>
        <el-form-item label="分类别名" prop="categoryAlias">
          <el-input 
            v-model="categoryModel.categoryAlias" 
            placeholder="请输入分类别名"
            show-word-limit
            maxlength="15"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="title === '添加分类' ? addCategory() : updateCategory()"
            :loading="loading"
          >确认</el-button>
        </div>
      </template>
    </el-dialog>
  </el-card>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 24px;
  background-color: #f5f7fa;
  border-radius: 8px;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;

    .title {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .search-input {
      width: 280px;
      transition: width 0.3s;
      
      &:focus-within {
        width: 320px;
      }
    }
    
    /* 按钮样式 */
    :deep(.el-button) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: var(--el-transition-duration-fast);
    }
  }

  .mr-2 {
    margin-right: 8px;
  }

  .table-wrapper {
    background: #ffffff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  :deep(.el-table) {
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  :deep(.el-table__row) {
    transition: background-color 0.2s ease;
    
    &:hover {
      background-color: #fafafa !important;
    }
    
    &.el-table__row--striped {
      background-color: #fafafa;
      
      &:hover {
        background-color: #f0f0f0 !important;
      }
    }
  }

  :deep(.el-table__header th) {
    background-color: #fafafa;
    font-weight: 600;
    color: #606266;
    border-bottom: 1px solid #ebeef5;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .action-btn-edit,
  .action-btn-delete {
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.05);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
  }

  .table-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
    color: #909399;
    font-size: 13px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  :deep(.el-dialog__header) {
    padding: 20px 24px 16px;
    border-bottom: 1px solid #ebeef5;
  }

  :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }

  :deep(.el-dialog__body) {
    padding: 24px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
  }

  :deep(.el-input__inner) {
    border-radius: 4px;
    transition: all 0.3s;
  }

  :deep(.el-input__inner:focus) {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
}

// 加载状态动画优化
:deep(.el-loading-spinner .circular) {
  animation: rotate 1.2s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>


