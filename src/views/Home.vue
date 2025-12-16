<template>
  <div class="home-page">
    <NavBar />
    <div class="page-container">
      <!-- 中部核心功能区 -->
      <div class="main-content">
        <!-- 左侧分类入口 -->
        <div class="category-panel">
          <h3 class="category-title">顶层分类</h3>
          <div class="category-list">
            <div 
              v-for="category in categories" 
              :key="category.id"
              class="category-item"
              @click="goToCategory(category.id)"
            >
              {{ category.name }}
            </div>
          </div>
        </div>

        <!-- 中间搜索核心区 -->
        <div class="search-panel">
          <div class="search-box-wrapper">
            <input
              v-model="searchKeyword"
              type="text"
              class="search-input"
              placeholder="搜索诗词 / 文言文"
              @keyup.enter="handleSearch"
              @focus="isFocused = true"
              @blur="isFocused = false"
            />
            <button class="search-btn" @click="handleSearch">
              <span class="search-icon">🔍</span>
            </button>
          </div>
          <div v-if="searchResults.length > 0" class="search-results">
            <div 
              v-for="result in searchResults" 
              :key="result.id"
              class="result-item"
              @click="goToPoem(result.id)"
            >
              <div class="result-title">{{ result.title }}</div>
              <div class="result-author">{{ result.author }}</div>
            </div>
          </div>
        </div>

        <!-- 右侧热门内容预览 -->
        <div class="preview-panel">
          <h3 class="preview-title">热门推荐</h3>
          <div class="preview-list">
            <div 
              v-for="poem in popularPoems" 
              :key="poem.id"
              class="preview-card"
              @click="goToPoem(poem.id)"
            >
              <div class="card-title">{{ poem.title }}</div>
              <div class="card-author">{{ poem.author }}</div>
              <div class="card-preview">
                {{ poem.content[0] }}...
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部品牌区 -->
      <div class="footer-section">
        <p class="slogan">以诗为舟，渡向千年文脉</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 首页组件 Home.vue
 *
 * 功能：
 * 1. 展示顶层分类导航（唐诗、宋词等）
 * 2. 全局搜索（懒加载真实数据）
 * 3. 热门推荐（索引前几条）
 */

import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import { getPopularPoemsLazy, searchPoemsLazy, loadIndex } from '../utils/dataLoader'
import { categories } from '../utils/data.js'

const router = useRouter()

const searchKeyword = ref('')
const isFocused = ref(false)
const popularPoems = ref([])
const searchResults = ref([])
const loadingSearch = ref(false)

watch(searchKeyword, async (val) => {
  if (!val) {
    searchResults.value = []
    return
  }
  loadingSearch.value = true
  try {
    const list = await searchPoemsLazy(val)
    searchResults.value = list.slice(0, 5)
  } finally {
    loadingSearch.value = false
  }
})

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: '/poetry',
      query: { search: searchKeyword.value }
    })
  }
}

const goToCategory = (categoryId) => {
  router.push({
    path: '/poetry',
    query: { category: categoryId }
  })
}

const goToPoem = (id) => {
  router.push(`/poetry/${id}`)
}

onMounted(async () => {
  // 预加载索引，加快后续搜索
  loadIndex().catch(() => {})
  popularPoems.value = await getPopularPoemsLazy(4)
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}

.main-content {
  display: grid;
  grid-template-columns: 22% 50% 25%;
  gap: 30px;
  margin-bottom: 40px;
}

/* 左侧分类面板 */
.category-panel {
  background: var(--light-gray);
  border-radius: var(--border-radius);
  padding: 20px;
  height: fit-content;
}

.category-title {
  font-size: var(--font-size-body);
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 20px;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.category-item {
  color: var(--primary-color);
  font-size: var(--font-size-body);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.category-item:hover {
  text-decoration: underline;
  background: rgba(46, 70, 59, 0.1);
}

/* 中间搜索面板 */
.search-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-box-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  flex: 1;
  height: 50px;
  padding: 12px 20px;
  border: 2px solid var(--medium-gray);
  border-radius: var(--border-radius);
  font-size: var(--font-size-body);
  font-family: var(--font-family);
  background: var(--white);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(46, 70, 59, 0.1);
}

.search-btn {
  height: 50px;
  width: 50px;
  background: var(--primary-color);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.search-btn:hover {
  background: #1e3028;
  transform: scale(0.97);
}

.search-icon {
  font-size: 20px;
  color: var(--white);
}

.search-results {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.result-item {
  padding: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.result-item:hover {
  background: var(--light-gray);
}

.result-title {
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 5px;
}

.result-author {
  color: var(--text-color);
  font-size: var(--font-size-small);
}

/* 右侧预览面板 */
.preview-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-title {
  font-size: var(--font-size-body);
  font-weight: bold;
  color: var(--primary-color);
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-card {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.preview-card:hover {
  transform: scale(1.02);
  opacity: 0.9;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.card-title {
  font-size: var(--font-size-body);
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.card-author {
  font-size: var(--font-size-body);
  color: var(--primary-color);
  margin-bottom: 12px;
}

.card-preview {
  font-size: var(--font-size-small);
  color: var(--text-color);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 底部品牌区 */
.footer-section {
  text-align: center;
  padding: 30px 0;
  margin-top: 60px;
}

.slogan {
  font-size: var(--font-size-body);
  color: var(--primary-color);
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .category-panel {
    order: 2;
  }
  
  .search-panel {
    order: 1;
  }
  
  .preview-panel {
    order: 3;
  }
  
  .preview-list {
    flex-direction: row;
    overflow-x: auto;
  }
  
  .preview-card {
    min-width: 250px;
  }
}
</style>

