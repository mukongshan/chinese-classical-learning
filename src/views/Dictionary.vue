<template>
  <div class="dictionary-page">
    <NavBar />
    <div class="page-container">
      <div class="dictionary-layout">
        <!-- 左侧主要内容区 -->
        <div class="dictionary-main">
          <!-- 查询输入核心区 -->
          <div class="search-section">
            <div class="search-box-container">
              <input
                v-model="searchKeyword"
                type="text"
                class="dictionary-input"
                placeholder="输入文言文字词如(庖丁、鸿鹄)"
                @keyup.enter="performSearch"
                @input="handleInput"
              />
              <button class="dictionary-search-btn" @click="performSearch">
                <span class="search-icon">🔍</span>
                查询
              </button>
            </div>
          </div>

          <!-- 查询结果展示区 -->
          <div v-if="searchResult" class="result-section">
            <h2 class="result-word">{{ searchResult.word }}</h2>
            
            <!-- 释义模块 -->
            <div class="meaning-section">
              <h3 class="section-title">【释义】</h3>
              <div class="meanings-list">
                <div 
                  v-for="(meaning, index) in searchResult.meanings" 
                  :key="index"
                  class="meaning-item"
                >
                  <div class="meaning-type">{{ meaning.type }}：</div>
                  <div class="meaning-content">{{ meaning.content }}</div>
                </div>
              </div>
            </div>

            <!-- 例句模块 -->
            <div v-if="searchResult.examples && searchResult.examples.length > 0" class="examples-section">
              <h3 class="section-title">【例句】</h3>
              <div class="examples-list">
                <div 
                  v-for="(example, index) in searchResult.examples" 
                  :key="index"
                  class="example-item"
                >
                  {{ example }}
                </div>
              </div>
            </div>

            <!-- 出处模块 -->
            <div v-if="searchResult.source" class="source-section">
              <h3 class="section-title">【出处】</h3>
              <p class="source-content">{{ searchResult.source }}</p>
            </div>
          </div>

          <!-- 无结果提示 -->
          <div v-else-if="hasSearched && !searchResult" class="no-result">
            <p class="no-result-text">未找到相关内容，换个词试试～</p>
            <div class="suggestions">
              <span class="suggestions-title">热门推荐：</span>
              <span 
                v-for="word in popularWords" 
                :key="word"
                class="suggestion-word"
                @click="searchWord(word)"
              >
                {{ word }}
              </span>
            </div>
          </div>

          <!-- 初始提示 -->
          <div v-else class="initial-hint">
            <p>请输入文言文字词进行查询</p>
          </div>
        </div>

        <!-- 右侧历史记录区 -->
        <div class="history-section">
          <div class="history-header">
            <h3 class="history-title">查询历史</h3>
            <button 
              v-if="history.length > 0" 
              class="clear-btn"
              @click="clearHistory"
            >
              🗑️ 清空
            </button>
          </div>
          <div v-if="history.length > 0" class="history-list">
            <div 
              v-for="(item, index) in history" 
              :key="index"
              class="history-item"
              @click="searchWord(item)"
            >
              {{ item }}
            </div>
          </div>
          <div v-else class="history-empty">
            <p>暂无查询记录</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import NavBar from '../components/NavBar.vue'
import { searchDictionaryLazy, addDictionaryHistory, getDictionaryHistory, clearDictionaryHistory as clearDictHistory } from '../utils/dictionaryLoader'

const searchKeyword = ref('')
const searchResult = ref(null)
const hasSearched = ref(false)
const history = ref([])

const popularWords = ['之', '乎', '者', '也', '逝者如斯夫', '庖丁', '鸿鹄']

/**
 * 处理输入框输入事件
 * TODO: 可以在这里实现实时联想功能（输入时显示匹配的词条）
 */
const handleInput = () => {
  // 可以在这里实现实时联想功能
}

/**
 * 执行词典查询
 * 查询成功后自动添加到历史记录
 */
const performSearch = async () => {
  if (!searchKeyword.value.trim()) return
  
  hasSearched.value = true  // 标记已执行过搜索
  const result = await searchDictionaryLazy(searchKeyword.value.trim())
  searchResult.value = result
  
  // 如果查询成功，添加到历史记录
  if (result) {
    history.value = await addDictionaryHistory(searchKeyword.value.trim())
  }
}

/**
 * 点击历史记录项或推荐词条时执行搜索
 * @param {string} word - 要查询的词
 */
const searchWord = async (word) => {
  searchKeyword.value = word
  await performSearch()
}

/**
 * 添加查询词到历史记录
 * 历史记录保存在localStorage中，最多保留10条
 * @param {string} word - 查询的词
 */
/**
 * 清空查询历史记录
 * 需要用户确认后执行
 */
const clearHistory = async () => {
  if (confirm('确定要清空查询历史吗？')) {
    await clearDictHistory()
    history.value = []
  }
}

onMounted(async () => {
  history.value = await getDictionaryHistory()
})
</script>

<style scoped>
.dictionary-page {
  min-height: 100vh;
}

.dictionary-layout {
  display: grid;
  grid-template-columns: 1fr 25%;
  gap: 30px;
}

.dictionary-main {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* 搜索区域 */
.search-section {
  background: var(--white);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.search-box-container {
  display: flex;
  gap: 15px;
  align-items: center;
}

.dictionary-input {
  flex: 1;
  height: 55px;
  padding: 15px 20px;
  border: 2px solid var(--medium-gray);
  border-radius: var(--border-radius);
  font-size: var(--font-size-body);
  font-family: var(--font-family);
  background: var(--white);
  transition: all 0.3s ease;
}

.dictionary-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(46, 70, 59, 0.1);
}

.dictionary-search-btn {
  height: 55px;
  padding: 0 30px;
  background: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-body);
  font-family: var(--font-family);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.dictionary-search-btn:hover {
  background: #1e3028;
  transform: scale(0.97);
}

/* 结果区域 */
.result-section {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.result-word {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-color);
  text-align: center;
  margin-bottom: 30px;
}

.meaning-section,
.examples-section,
.source-section {
  margin-bottom: 25px;
}

.section-title {
  font-size: var(--font-size-subtitle);
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 15px;
}

.meanings-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.meaning-item {
  display: flex;
  gap: 10px;
  line-height: 1.8;
}

.meaning-type {
  font-weight: bold;
  color: var(--primary-color);
  min-width: 80px;
}

.meaning-content {
  flex: 1;
  color: var(--text-color);
}

.examples-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.example-item {
  padding: 12px;
  background: var(--light-gray);
  border-left: 3px solid var(--primary-color);
  border-radius: 4px;
  color: var(--text-color);
  line-height: 1.8;
}

.source-content {
  color: var(--text-color);
  line-height: 1.8;
  padding: 12px;
  background: var(--light-gray);
  border-radius: 4px;
}

/* 无结果提示 */
.no-result {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 60px 40px;
  text-align: center;
}

.no-result-text {
  font-size: var(--font-size-body);
  color: #999;
  margin-bottom: 20px;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.suggestions-title {
  color: #666;
}

.suggestion-word {
  padding: 6px 15px;
  background: var(--light-gray);
  border-radius: 20px;
  color: var(--primary-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.suggestion-word:hover {
  background: var(--primary-color);
  color: var(--white);
}

.initial-hint {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 60px 40px;
  text-align: center;
  color: #999;
}

/* 历史记录区域 */
.history-section {
  background: rgba(238, 238, 238, 0.7);
  border-radius: var(--border-radius);
  padding: 20px;
  height: fit-content;
  position: sticky;
  top: 90px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.history-title {
  font-size: var(--font-size-body);
  font-weight: bold;
  color: var(--primary-color);
}

.clear-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: var(--font-size-small);
  transition: all 0.3s ease;
}

.clear-btn:hover {
  opacity: 0.7;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  padding: 10px 15px;
  background: var(--white);
  border-radius: 6px;
  color: var(--primary-color);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: var(--font-size-body);
}

.history-item:hover {
  text-decoration: underline;
  background: rgba(46, 70, 59, 0.1);
}

.history-empty {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: var(--font-size-small);
}

@media (max-width: 1200px) {
  .dictionary-layout {
    grid-template-columns: 1fr;
  }
  
  .history-section {
    position: static;
  }
}
</style>

