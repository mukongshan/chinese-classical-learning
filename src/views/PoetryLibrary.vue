<template>
    <div class="poetry-library-page">
        <NavBar />
        <div class="page-container">
            <!-- 搜索栏 -->
            <div class="library-header">
                <div class="search-wrapper">
                    <input v-model="searchKeyword" type="text" class="library-search-input" placeholder="搜索诗词..."
                        @keyup.enter="performSearch" aria-label="搜索诗词" />
                    <button class="library-search-btn" type="button"
                        :disabled="!searchKeyword.trim() && activeCategory === 'all'" @click="performSearch">
                        搜索
                    </button>
                </div>
                <p class="search-hint">
                    支持按诗题、作者或内容关键词搜索，或通过下方分类快速浏览。
                </p>
                <div class="filter-tabs">
                    <div v-for="category in categories" :key="category.id" class="filter-tab"
                        :class="{ active: activeCategory === category.id }" @click="filterByCategory(category.id)">
                        {{ category.name }}
                    </div>
                </div>
            </div>

            <!-- 诗词列表 -->
            <div class="poetry-list" :aria-busy="loading" aria-live="polite">
                <div v-for="poem in displayedPoems" :key="poem.id" class="poetry-card" @click="goToDetail(poem.id)">
                    <div class="poetry-card-header">
                        <h3 class="poetry-card-title">{{ poem.title }}</h3>
                        <div class="poetry-card-meta">
                            <span class="poetry-author">{{ poem.author }}</span>
                            <span class="poetry-dynasty">{{ poem.dynasty }}</span>
                        </div>
                    </div>
                    <div class="poetry-card-content">
                        <p v-for="(line, index) in poem.content.slice(0, 3)" :key="index">
                            {{ line }}
                        </p>
                        <span v-if="poem.content.length > 3" class="more-indicator">...</span>
                    </div>
                </div>
            </div>

            <!-- 空状态 -->
            <div v-if="!loading && displayedPoems.length === 0" class="empty-state">
                <p>未找到符合条件的诗词，可以尝试：</p>
                <ul>
                    <li>简化或更换关键词</li>
                    <li>切换上方的分类标签</li>
                </ul>
            </div>

            <!-- 加载状态 -->
            <div v-if="loading" class="loading-state">
                <p>正在加载诗词，请稍候…</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import { categories } from '../utils/data.js'
import { loadIndex, getPoemsByCategoryLazy, searchPoemsLazy, getPoemByIdLazy, dynastyFromTag } from '../utils/dataLoader'

const route = useRoute()
const router = useRouter()

const searchKeyword = ref(route.query.search || '')
const activeCategory = ref(route.query.category || 'all')
const allIndex = ref([])
const displayedPoems = ref([])
const loading = ref(false)

const loadDetails = async (metas, limit = 50) => {
    // 为列表页取正文前几句，便于预览
    const slice = metas.slice(0, limit)
    const results = await Promise.all(slice.map(async meta => {
        const poem = await getPoemByIdLazy(meta.id)
        return poem || {
            id: meta.id,
            title: meta.title,
            author: meta.author,
            dynasty: meta.dynasty || dynastyFromTag(meta.tag) || '',
            content: [],
        }
    }))
    return results
}

const performSearch = async () => {
    loading.value = true
    try {
        if (searchKeyword.value.trim()) {
            displayedPoems.value = await searchPoemsLazy(searchKeyword.value)
        } else if (activeCategory.value && activeCategory.value !== 'all') {
            const metas = await getPoemsByCategoryLazy(activeCategory.value)
            displayedPoems.value = await loadDetails(metas)
        } else {
            // 默认展示索引前 50 条
            displayedPoems.value = await loadDetails(allIndex.value)
        }
    } finally {
        loading.value = false
    }
}

const filterByCategory = async (categoryId) => {
    activeCategory.value = categoryId
    await performSearch()
}

const goToDetail = (id) => {
    router.push(`/poetry/${id}`)
}

watch(
    () => route.query.search,
    val => {
        searchKeyword.value = val || ''
    }
)

onMounted(async () => {
    allIndex.value = await loadIndex()
    await performSearch()
})
</script>

<style scoped>
.poetry-library-page {
    min-height: 100vh;
}

.library-header {
    margin-bottom: 30px;
}

.search-wrapper {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.search-hint {
    font-size: var(--font-size-small);
    color: #777;
    margin-bottom: 16px;
}

.library-search-input {
    flex: 1;
    height: 45px;
    padding: 12px 20px;
    border: 2px solid var(--medium-gray);
    border-radius: var(--border-radius);
    font-size: var(--font-size-body);
    font-family: var(--font-family);
    background: var(--white);
}

.library-search-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(46, 70, 59, 0.1);
}

.library-search-btn {
    height: 45px;
    padding: 0 30px;
    background: var(--primary-color);
    color: var(--white);
    border: none;
    border-radius: var(--border-radius);
    font-size: var(--font-size-body);
    font-family: var(--font-family);
    cursor: pointer;
    transition: all 0.3s ease;
}

.library-search-btn:hover {
    background: #1e3028;
    transform: scale(0.97);
}

.filter-tabs {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
}

.filter-tab {
    padding: 8px 20px;
    background: var(--white);
    border: 2px solid var(--medium-gray);
    border-radius: var(--border-radius);
    color: var(--primary-color);
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: var(--font-size-body);
}

.filter-tab:hover {
    border-color: var(--primary-color);
    background: rgba(46, 70, 59, 0.05);
}

.filter-tab.active {
    background: var(--primary-color);
    color: var(--white);
    border-color: var(--primary-color);
}

.poetry-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 25px;
}

.poetry-card {
    background: var(--white);
    border-radius: var(--border-radius);
    padding: 25px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.poetry-card:hover {
    transform: scale(1.02);
    opacity: 0.9;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.poetry-card-header {
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--light-gray);
}

.poetry-card-title {
    font-size: var(--font-size-subtitle);
    font-weight: bold;
    color: var(--text-color);
    margin-bottom: 8px;
}

.poetry-card-meta {
    display: flex;
    gap: 15px;
    font-size: var(--font-size-small);
}

.poetry-author {
    color: var(--primary-color);
}

.poetry-dynasty {
    color: #666;
}

.poetry-card-content {
    color: var(--text-color);
    line-height: 1.8;
    font-size: var(--font-size-body);
}

.poetry-card-content p {
    margin-bottom: 8px;
}

.more-indicator {
    color: #999;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #999;
    font-size: var(--font-size-body);
}

.empty-state ul {
    list-style: disc;
    margin: 12px auto 0;
    padding-left: 20px;
    max-width: 360px;
    text-align: left;
}

.loading-state {
    text-align: center;
    padding: 40px 20px;
    color: #666;
    font-size: var(--font-size-body);
}

@media (max-width: 768px) {
    .poetry-list {
        grid-template-columns: 1fr;
    }
}
</style>
