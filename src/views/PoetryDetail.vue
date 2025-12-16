<template>
  <div class="poetry-detail-page">
    <NavBar />
    <div v-if="poem" class="page-container">
      <!-- 诗词信息标题栏 -->
      <div class="poetry-header">
        <h1 class="poetry-title">{{ poem.title }}</h1>
        <div class="poetry-info">
          <span>作者：{{ poem.author }}</span>
          <span>朝代：{{ poem.dynasty }}</span>
        </div>
        <div class="poetry-actions">
          <button class="action-btn" @click="toggleFavorite">
            {{ isFavorite ? '★ 已收藏' : '☆ 收藏' }}
          </button>
        </div>
      </div>

      <!-- 诗词正文展示区 -->
      <div class="poetry-content">
        <div class="poetry-text">
          <p v-for="(line, index) in poem.content" :key="index" class="poetry-line">
            {{ line }}
          </p>
        </div>
      </div>

      <!-- 注释解析区 -->
      <div v-if="poem.notes && poem.notes.length > 0" class="notes-section">
        <h3 class="section-title">【注释】</h3>
        <div class="notes-content">
          <div 
            v-for="(note, index) in poem.notes" 
            :key="index"
            class="note-item"
          >
            <span class="note-number">{{ index + 1 }}.</span>
            <span class="note-text">{{ note }}</span>
          </div>
        </div>
      </div>

      <!-- 赏析延伸区 -->
      <div v-if="poem.appreciation" class="appreciation-section">
        <h3 class="section-title" @click="toggleAppreciation">
          【诗词赏析】
          <span class="toggle-icon">{{ showAppreciation ? '▼' : '▶' }}</span>
        </h3>
        <div v-show="showAppreciation" class="appreciation-content">
          <p>{{ poem.appreciation }}</p>
        </div>
      </div>

      <!-- 相关推荐区 -->
      <div class="recommendations-section">
        <h3 class="section-title">相关推荐</h3>
        <div class="recommendations-list">
          <div 
            v-for="rec in recommendations" 
            :key="rec.id"
            class="recommendation-card"
            @click="goToPoem(rec.id)"
          >
            <div class="rec-title">{{ rec.title }}</div>
            <div class="rec-author">{{ rec.author }}</div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="loading-state">
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import { getPoemById, getAllPoems } from '../utils/data.js'

const route = useRoute()
const router = useRouter()
const poem = ref(null)
const showAppreciation = ref(true)
const isFavorite = ref(false)

const recommendations = computed(() => {
  const all = getAllPoems()
  return all.filter(p => p.id !== poem.value?.id).slice(0, 4)
})

/**
 * 切换赏析区域的显示/隐藏状态
 */
const toggleAppreciation = () => {
  showAppreciation.value = !showAppreciation.value
}

/**
 * 切换收藏状态
 * 同时更新localStorage中的收藏列表
 */
const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value
  
  // 从localStorage读取收藏列表
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
  
  if (isFavorite.value) {
    // 添加到收藏：如果不存在则添加
    if (!favorites.includes(poem.value.id)) {
      favorites.push(poem.value.id)
    }
  } else {
    // 取消收藏：从数组中移除
    const index = favorites.indexOf(poem.value.id)
    if (index > -1) {
      favorites.splice(index, 1)
    }
  }
  
  // 保存到localStorage
  localStorage.setItem('favorites', JSON.stringify(favorites))
  
  // 记录学习轨迹（访问历史）
  recordHistory()
}

/**
 * 记录学习轨迹（访问历史）
 * 将当前诗词信息保存到localStorage，用于"我的"页面展示
 */
const recordHistory = () => {
  const history = JSON.parse(localStorage.getItem('history') || '[]')
  const record = {
    id: poem.value.id,
    title: poem.value.title,
    author: poem.value.author,
    time: new Date().toISOString()  // 使用ISO格式便于后续格式化显示
  }
  
  // 避免重复：如果已存在，先移除
  const existingIndex = history.findIndex(h => h.id === record.id)
  if (existingIndex > -1) {
    history.splice(existingIndex, 1)
  }
  
  // 添加到数组开头（最新的在前面）
  history.unshift(record)
  
  // 只保留最近50条记录，避免数据过多
  if (history.length > 50) {
    history.pop()
  }
  
  // 保存到localStorage
  localStorage.setItem('history', JSON.stringify(history))
}

const goToPoem = (id) => {
  router.push(`/poetry/${id}`)
}

onMounted(() => {
  const id = route.params.id
  poem.value = getPoemById(id)
  
  if (!poem.value) {
    router.push('/poetry')
    return
  }
  
  // 检查是否已收藏
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
  isFavorite.value = favorites.includes(id)
  
  // 记录访问历史
  recordHistory()
})
</script>

<style scoped>
.poetry-detail-page {
  min-height: 100vh;
}

.poetry-header {
  background: var(--medium-gray);
  padding: 30px;
  border-radius: var(--border-radius);
  margin-bottom: 30px;
  text-align: center;
}

.poetry-title {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 15px;
}

.poetry-info {
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: var(--font-size-body);
  color: var(--primary-color);
  margin-bottom: 15px;
}

.poetry-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.action-btn {
  padding: 8px 20px;
  background: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-body);
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #1e3028;
  transform: scale(0.97);
}

.poetry-content {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 40px;
  margin-bottom: 30px;
  width: 75%;
  margin-left: auto;
  margin-right: auto;
}

.poetry-text {
  text-align: center;
}

.poetry-line {
  font-size: 22px;
  line-height: 2.5;
  color: var(--text-color);
  margin-bottom: 10px;
}

.notes-section,
.appreciation-section {
  background: #F0F0F0;
  border-radius: var(--border-radius);
  padding: 30px;
  margin-bottom: 30px;
  width: 75%;
  margin-left: auto;
  margin-right: auto;
}

.section-title {
  font-size: var(--font-size-subtitle);
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-icon {
  font-size: 14px;
  color: #666;
}

.notes-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.note-item {
  display: flex;
  gap: 10px;
  line-height: 1.8;
  font-size: var(--font-size-body);
  color: var(--text-color);
}

.note-number {
  color: var(--primary-color);
  font-weight: bold;
}

.note-text {
  flex: 1;
}

.appreciation-content {
  font-size: var(--font-size-body);
  color: var(--text-color);
  line-height: 1.8;
  padding: 15px;
  background: var(--white);
  border-radius: 8px;
  border-left: 3px solid var(--primary-color);
}

.recommendations-section {
  background: rgba(238, 238, 238, 0.7);
  border-radius: var(--border-radius);
  padding: 30px;
  margin-top: 40px;
}

.recommendations-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.recommendation-card {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.recommendation-card:hover {
  transform: scale(1.05);
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.rec-title {
  font-size: var(--font-size-body);
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.rec-author {
  font-size: var(--font-size-small);
  color: var(--text-color);
}

.loading-state {
  text-align: center;
  padding: 100px 20px;
  color: #999;
}

@media (max-width: 768px) {
  .poetry-content,
  .notes-section,
  .appreciation-section {
    width: 100%;
  }
  
  .poetry-line {
    font-size: 18px;
  }
  
  .recommendations-list {
    grid-template-columns: 1fr;
  }
}
</style>

