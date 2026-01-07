<template>
    <div class="home-page">
        <NavBar />
        <div class="home-container">
            <!-- 顶部欢迎与简介 -->
            <section class="hero">
                <div class="hero-content">
                    <div class="hero-text">
                        <h1 class="hero-title">与千年诗文，相遇当下</h1>
                        <p class="hero-subtitle">
                            一处兼具检索、精读与练习的诗文小站，帮助你在碎片时间里，温柔地走近古典中文。
                        </p>
                    </div>
                </div>
            </section>

            <!-- 中部三栏核心区 -->
            <div class="main-content">
                <!-- 左侧学习入口 -->
                <aside class="side-panel">
                    <h3 class="side-title">快速开始</h3>
                    <div class="side-grid">
                        <button class="side-entry" type="button" @click="goToCategory('tang')">
                            <span class="side-entry-label">唐诗小集</span>
                            <span class="side-entry-desc">经典篇目入门</span>
                        </button>
                        <button class="side-entry" type="button" @click="goToCategory('song')">
                            <span class="side-entry-label">宋词夜读</span>
                            <span class="side-entry-desc">细品婉约豪放</span>
                        </button>
                        <button class="side-entry" type="button" @click="goToCategory('yuan')">
                            <span class="side-entry-label">元曲拾遗</span>
                            <span class="side-entry-desc">散曲杂剧速览</span>
                        </button>
                        <button class="side-entry" type="button" @click="goToCategory('pre-qin')">
                            <span class="side-entry-label">先秦阅读</span>
                            <span class="side-entry-desc">诗经/诸子速读</span>
                        </button>
                        <button class="side-entry" type="button" @click="goToDictionary">
                            <span class="side-entry-label">查一查字词</span>
                            <span class="side-entry-desc">生僻字一键释义</span>
                        </button>
                    </div>
                </aside>

                <!-- 中间搜索与模块入口 -->
                <section class="search-panel">
                    <div class="search-card">
                        <div class="search-box-wrapper">
                            <input v-model="searchKeyword" type="text" class="search-input"
                                placeholder="试着搜：静夜思 / 李白 / 明月几时有" @keyup.enter="handleSearch" @focus="isFocused = true"
                                @blur="isFocused = false" aria-label="搜索诗词或文言文" />
                            <button class="search-btn" type="button" :disabled="!searchKeyword.trim()"
                                @click="handleSearch">
                                <span class="search-icon">🔍</span>
                            </button>
                        </div>
                        <p class="search-hint">
                            输入诗题、作者或片段内容，按回车或点击右侧按钮开始搜索。
                        </p>
                        <div v-if="loadingSearch" class="search-status">
                            正在搜索相关诗词…
                        </div>
                        <div v-if="!loadingSearch && searchResults.length > 0" class="search-results">
                            <div v-for="result in searchResults" :key="result.id" class="result-item"
                                @click="goToPoem(result.id)">
                                <div class="result-title">{{ result.title }}</div>
                                <div class="result-author">{{ result.author }}</div>
                            </div>
                        </div>
                    </div>

                    <div class="modules-row">
                        <div class="module-card" @click="goToPoetryLibrary">
                            <h3 class="module-title">诗词精读</h3>
                            <p class="module-desc">
                                按篇浏览、进入详情后可开启填空与断句练习，适合系统梳理一首诗。
                            </p>
                        </div>
                        <div class="module-card" @click="goToProfile">
                            <h3 class="module-title">我的学习</h3>
                            <p class="module-desc">
                                查看收藏与学习轨迹，了解自己近期读过哪些作品。
                            </p>
                        </div>
                    </div>
                </section>

                <!-- 右侧今日一诗 -->
                <aside class="preview-panel" v-if="popularPoems.length">
                    <h3 class="preview-title">今日一诗</h3>
                    <div class="preview-card featured-card" @click="goToPoem(popularPoems[0].id)">
                        <div class="card-title">{{ popularPoems[0].title }}</div>
                        <div class="card-author">{{ popularPoems[0].author }}</div>
                        <div class="card-preview">
                            {{ popularPoems[0].content[0] }}…
                        </div>
                    </div>
                    <h4 class="preview-subtitle">最多收藏</h4>
                    <div class="preview-list">
                        <button v-for="poem in popularPoems.slice(1)" :key="poem.id" type="button" class="preview-pill"
                            @click="goToPoem(poem.id)">
                            <span class="pill-title">{{ poem.title }}</span>
                            <span class="pill-author">{{ poem.author }}</span>
                        </button>
                    </div>
                </aside>
            </div>

            <!-- 底部品牌区 -->
            <footer class="footer-section">
                <p class="slogan">以诗为舟，渡向千年文脉</p>
            </footer>
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

const router = useRouter()

const searchKeyword = ref('')
const isFocused = ref(false)
const popularPoems = ref([])
const searchResults = ref([])
const loadingSearch = ref(false)

watch(
    searchKeyword,
    async (val) => {
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
    }
)

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

const goToDictionary = () => {
    router.push('/dictionary')
}

const goToPoetryLibrary = () => {
    router.push('/poetry')
}

const goToProfile = () => {
    router.push('/profile')
}

const goToPoem = (id) => {
    router.push(`/poetry/${id}`)
}

onMounted(async () => {
    // 预加载索引，加快后续搜索
    loadIndex().catch(() => { })
    popularPoems.value = await getPopularPoemsLazy(4)
})
</script>

<style scoped>
.home-page {
    min-height: 100vh;
}

/* 首页专用容器，比普通页面更宽 */
.home-container {
  display: flex;
  flex-direction: column;
    margin-top: 70px;
    min-height: calc(100vh - 70px);
    padding: 40px 60px 50px;
    max-width: 1400px;
    margin-left: auto;
    margin-right: auto;
}

.hero {
    margin-bottom: 50px;
    padding: 0 20px;
}

.hero-content {
    max-width: 100%;
    display: flex;
    justify-content: center;
}

.hero-text {
    max-width: 700px;
    text-align: center;
}

.hero-tag {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(46, 70, 59, 0.06);
    color: var(--primary-color);
    font-size: var(--font-size-small);
    margin-bottom: 10px;
}

.hero-title {
    font-size: 28px;
    font-weight: bold;
    color: var(--text-color);
    margin-bottom: 10px;
}

.hero-subtitle {
    font-size: var(--font-size-body);
    color: #555;
}

.main-content {
    display: grid;
    grid-template-columns: 240px 1fr 280px;
    gap: 40px;
    margin-bottom: 50px;
    padding: 0 20px;
}

/* 左侧入口面板 */
.side-panel {
    background: var(--light-gray);
    border-radius: var(--border-radius);
    padding: 20px;
    height: fit-content;
    position: sticky;
    top: 90px;
}

.side-title {
    font-size: var(--font-size-body);
    font-weight: bold;
    color: var(--primary-color);
    margin-bottom: 14px;
}

.side-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.side-entry {
    width: 100%;
    text-align: left;
    border: none;
    background: var(--white);
    border-radius: 8px;
    padding: 10px 12px;
    cursor: pointer;
    transition: box-shadow 0.2s ease, transform 0.1s ease, background-color 0.2s ease;
}

.side-entry:hover {
    background: #f3f3f3;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.side-entry-label {
    display: block;
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--primary-color);
}

.side-entry-desc {
    display: block;
    margin-top: 4px;
    font-size: var(--font-size-small);
    color: #666;
}

/* 中间搜索与模块 */
.search-panel {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.search-card {
    background: var(--white);
    border-radius: var(--border-radius);
    padding: 18px 18px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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
    transition: background-color 0.2s ease, transform 0.1s ease;
}

.search-btn:hover {
    background: #1e3028;
}

.search-btn:disabled {
    background: var(--medium-gray);
    cursor: not-allowed;
}

.search-icon {
    font-size: 20px;
    color: var(--white);
}

.search-hint {
    font-size: var(--font-size-small);
    color: #777;
}

.search-status {
    font-size: var(--font-size-small);
    color: #666;
}

.search-results {
    background: var(--white);
    border-radius: var(--border-radius);
    padding: 15px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-top: 4px;
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

.modules-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

.module-card {
    background: rgba(245, 245, 245, 0.9);
    border-radius: var(--border-radius);
    padding: 14px 14px 12px;
    cursor: pointer;
    transition: background-color 0.2s ease, box-shadow 0.2s ease,
        transform 0.1s ease;
}

.module-card:hover {
    background: #f0f0f0;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.module-title {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--primary-color);
    margin-bottom: 6px;
}

.module-desc {
    font-size: var(--font-size-small);
    color: #666;
}

/* 右侧预览面板 */
.preview-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: sticky;
    top: 90px;
    height: fit-content;
}

.preview-title {
    font-size: var(--font-size-body);
    font-weight: bold;
    color: var(--primary-color);
}

.preview-subtitle {
    margin-top: 10px;
    font-size: var(--font-size-small);
    color: #666;
}

.preview-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
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

.featured-card {
    border-left: 3px solid var(--primary-color);
}

.preview-pill {
    width: 100%;
    border-radius: 999px;
    border: none;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.1s ease,
        box-shadow 0.2s ease;
}

.preview-pill:hover {
    background: #f3f3f3;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.pill-title {
    font-size: var(--font-size-small);
    color: var(--primary-color);
    font-weight: 600;
}

.pill-author {
    font-size: var(--font-size-small);
    color: #666;
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
  margin-top: auto;
}

.slogan {
    font-size: var(--font-size-body);
    color: var(--primary-color);
    font-style: italic;
}

/* 响应式设计 */
@media (max-width: 1400px) {
    .home-container {
        padding: 40px 40px 50px;
    }
}

@media (max-width: 1200px) {
    .home-container {
        padding: 30px 30px 40px;
    }

    .main-content {
        grid-template-columns: 200px 1fr 240px;
        gap: 30px;
        padding: 0 10px;
    }
}

@media (max-width: 1024px) {
    .main-content {
        grid-template-columns: 1fr;
        gap: 30px;
        padding: 0;
    }

    .side-panel,
    .preview-panel {
        position: static;
    }

    .search-panel {
        order: 1;
    }

    .side-panel {
        order: 2;
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

@media (max-width: 768px) {
    .home-container {
        padding: 24px 20px 30px;
    }

    .hero {
        padding: 0;
        margin-bottom: 30px;
    }

    .hero-title {
        font-size: 24px;
    }

    .main-content {
        gap: 24px;
    }

    .modules-row {
        grid-template-columns: 1fr;
    }
}
</style>
