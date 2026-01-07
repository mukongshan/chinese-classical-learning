<template>
    <div class="profile-page">
        <NavBar />
        <div class="page-container">
            <!-- 功能卡片区 -->
            <div class="cards-grid">
                <!-- 我的收藏 -->
                <div class="function-card">
                    <div class="card-header">
                        <span class="card-icon">📜</span>
                        <h3 class="card-title">我的收藏</h3>
                    </div>
                    <div class="card-content">
                        <div v-if="favorites.length === 0" class="empty-state">
                            <p>暂无收藏，快去发现喜欢的诗词吧~</p>
                        </div>
                        <div v-else class="favorites-list">
                            <div v-for="fav in favorites" :key="fav.id" class="favorite-item" @click="goToPoem(fav.id)">
                                <div class="fav-title">{{ fav.title }}</div>
                                <div class="fav-author">{{ fav.author }}</div>
                                <div class="fav-preview">{{ fav.preview }}</div>
                                <button class="remove-fav-btn" @click.stop="removeFavorite(fav.id)">
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 学习轨迹 -->
                <div class="function-card">
                    <div class="card-header">
                        <span class="card-icon">✍️</span>
                        <h3 class="card-title">学习轨迹</h3>
                    </div>
                    <div class="card-content">
                        <div class="stats-section">
                            <div class="stat-item">
                                <span class="stat-number">{{ todayCount }}</span>
                                <span class="stat-label">今日浏览</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">{{ totalHours }}</span>
                                <span class="stat-label">累计学习(小时)</span>
                            </div>
                        </div>
                        <div v-if="history.length > 0" class="history-timeline">
                            <div v-for="(item, index) in history.slice(0, 5)" :key="index" class="timeline-item"
                                @click="goToPoem(item.id)">
                                <div class="timeline-title">{{ item.title }}</div>
                                <div class="timeline-time">{{ formatTime(item.time) }}</div>
                            </div>
                        </div>
                        <div v-else class="empty-state">
                            <p>暂无学习记录</p>
                        </div>
                        <button v-if="history.length > 0" class="clear-history-btn" @click="clearHistory">
                            🗑️ 清空轨迹
                        </button>
                    </div>
                </div>

                <!-- 个人资料 -->
                <div class="function-card">
                    <div class="card-header">
                        <span class="card-icon">👤</span>
                        <h3 class="card-title">个人资料</h3>
                    </div>
                    <div class="card-content">
                        <div class="profile-section">
                            <div class="avatar-section">
                                <div class="avatar">+</div>
                            </div>
                            <div class="profile-form">
                                <div class="form-item">
                                    <label>昵称</label>
                                    <input v-if="!isEditing" v-model="profile.nickname" type="text" readonly
                                        class="form-input" />
                                    <input v-else v-model="editProfile.nickname" type="text" class="form-input"
                                        placeholder="请输入昵称" />
                                    <p v-if="isEditing && nicknameError" class="form-error">
                                        {{ nicknameError }}
                                    </p>
                                </div>
                                <div class="form-item">
                                    <label>个性签名</label>
                                    <input v-if="!isEditing" v-model="profile.signature" type="text" readonly
                                        class="form-input" :placeholder="profile.signature || '填写个性签名'" />
                                    <input v-else v-model="editProfile.signature" type="text" class="form-input"
                                        placeholder="填写个性签名" />
                                </div>
                                <div class="form-item">
                                    <label>注册时间</label>
                                    <div class="form-text">{{ profile.registerTime }}</div>
                                </div>
                                <div class="form-actions">
                                    <button v-if="!isEditing" class="edit-btn" @click="startEdit">
                                        编辑资料
                                    </button>
                                    <template v-else>
                                        <button class="save-btn" @click="saveProfile">保存</button>
                                        <button class="cancel-btn" @click="cancelEdit">取消</button>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 底部信息区 -->
            <div class="footer-info">
                <p class="copyright">© 2025 古诗词学习网 · 传承文脉</p>
                <p class="version">v1.0.0</p>
            </div>

            <!-- 站内确认弹窗：清空学习轨迹（避免浏览器 confirm 弹窗） -->
            <div v-if="showClearHistoryConfirm" class="confirm-overlay" role="dialog" aria-modal="true"
                aria-label="清空学习轨迹确认" @click.self="cancelClearHistory">
                <div class="confirm-dialog">
                    <h3 class="confirm-title">清空学习轨迹</h3>
                    <p class="confirm-desc">确定要清空学习轨迹吗？此操作不可撤销。</p>
                    <div class="confirm-actions">
                        <button class="confirm-btn secondary" type="button" @click="cancelClearHistory">取消</button>
                        <button class="confirm-btn primary" type="button" @click="confirmClearHistory">确定</button>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import { getPoemByIdLazy } from '../utils/dataLoader'

const router = useRouter()

const favorites = ref([])
const history = ref([])
const isEditing = ref(false)
const nicknameError = ref('')
const showClearHistoryConfirm = ref(false)

const profile = ref({
    nickname: '诗词爱好者',
    signature: '',
    registerTime: '2025-01-01'
})

const editProfile = ref({
    nickname: '',
    signature: ''
})

const todayCount = computed(() => {
    const today = new Date().toDateString()
    return history.value.filter(item => {
        const itemDate = new Date(item.time).toDateString()
        return itemDate === today
    }).length
})

const totalHours = computed(() => {
    // 简化计算，假设每篇诗词阅读5分钟
    return Math.round((history.value.length * 5) / 60)
})

const startEdit = () => {
    isEditing.value = true
    nicknameError.value = ''
    editProfile.value = {
        nickname: profile.value.nickname,
        signature: profile.value.signature
    }
}

const saveProfile = () => {
    const trimmedName = editProfile.value.nickname.trim()
    if (!trimmedName) {
        nicknameError.value = '昵称不能为空'
        return
    }
    nicknameError.value = ''
    profile.value.nickname = editProfile.value.nickname
    profile.value.signature = editProfile.value.signature
    isEditing.value = false
    localStorage.setItem('profile', JSON.stringify(profile.value))

}

const cancelEdit = () => {
    isEditing.value = false
    nicknameError.value = ''
}

const removeFavorite = (id) => {
    const favIds = JSON.parse(localStorage.getItem('favorites') || '[]')
    const index = favIds.indexOf(id)
    if (index > -1) {
        favIds.splice(index, 1)
        localStorage.setItem('favorites', JSON.stringify(favIds))
        loadFavorites()
    }
}

const clearHistory = () => {
    showClearHistoryConfirm.value = true
}

const cancelClearHistory = () => {
    showClearHistoryConfirm.value = false
}

const confirmClearHistory = () => {
    localStorage.setItem('history', JSON.stringify([]))
    history.value = []
    showClearHistoryConfirm.value = false
}

const goToPoem = (id) => {
    router.push(`/poetry/${id}`)
}

const formatTime = (timeStr) => {
    const time = new Date(timeStr)
    const now = new Date()
    const diff = now - time
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) {
        return `${minutes}分钟前`
    } else if (hours < 24) {
        return `${hours}小时前`
    } else if (days < 7) {
        return `${days}天前`
    } else {
        return time.toLocaleDateString('zh-CN')
    }
}

const loadFavorites = () => {
    const favIds = JSON.parse(localStorage.getItem('favorites') || '[]')
    favorites.value = []
    Promise.all(favIds.map(async (id) => {
        const poem = await getPoemByIdLazy(id)
        if (poem) {
            favorites.value.push({
                id: poem.id,
                title: poem.title,
                author: poem.author,
                preview: poem.content?.[0] || ''
            })
        }
    }))
}

onMounted(() => {
    // 加载收藏
    loadFavorites()

    // 加载历史记录
    const savedHistory = JSON.parse(localStorage.getItem('history') || '[]')
    history.value = savedHistory

    // 加载个人资料
    const savedProfile = localStorage.getItem('profile')
    if (savedProfile) {
        profile.value = JSON.parse(savedProfile)
    }
})
</script>

<style scoped>
.profile-page {
    min-height: 100vh;
}

.cards-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 25px;
    margin-bottom: 40px;
}

.function-card {
    background: var(--white);
    border-radius: var(--border-radius);
    padding: 25px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
}

.function-card:hover {
    transform: scale(1.03);
    opacity: 0.92;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--light-gray);
}

.card-icon {
    font-size: 24px;
}

.card-title {
    font-size: var(--font-size-subtitle);
    font-weight: bold;
    color: var(--primary-color);
}

.card-content {
    min-height: 200px;
}

/* 收藏列表 */
.favorites-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    max-height: 300px;
    overflow-y: auto;
}

.favorite-item {
    padding: 15px;
    background: var(--light-gray);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.favorite-item:hover {
    background: rgba(46, 70, 59, 0.1);
}

.fav-title {
    font-weight: bold;
    color: var(--primary-color);
    margin-bottom: 5px;
}

.fav-author {
    font-size: var(--font-size-small);
    color: var(--text-color);
    margin-bottom: 5px;
}

.fav-preview {
    font-size: var(--font-size-small);
    color: #666;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.remove-fav-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    font-size: 18px;
    transition: all 0.3s ease;
}

.remove-fav-btn:hover {
    color: var(--primary-color);
}

/* 统计信息 */
.stats-section {
    display: flex;
    gap: 30px;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--light-gray);
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-number {
    font-size: 28px;
    font-weight: bold;
    color: var(--primary-color);
    margin-bottom: 5px;
}

.stat-label {
    font-size: var(--font-size-small);
    color: #666;
}

/* 时间轴 */
.history-timeline {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 15px;
    max-height: 200px;
    overflow-y: auto;
}

.timeline-item {
    padding: 12px;
    background: var(--light-gray);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.timeline-item:hover {
    background: rgba(46, 70, 59, 0.1);
}

.timeline-title {
    font-weight: bold;
    color: var(--primary-color);
    margin-bottom: 5px;
}

.timeline-time {
    font-size: var(--font-size-small);
    color: #666;
}

.clear-history-btn {
    width: 100%;
    padding: 8px;
    background: none;
    border: 1px solid var(--primary-color);
    color: var(--primary-color);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.3s ease;
}

.clear-history-btn:hover {
    background: var(--primary-color);
    color: var(--white);
}

.confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 16px;
}

.confirm-dialog {
    width: min(420px, 100%);
    background: var(--white);
    border-radius: var(--border-radius);
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}

.confirm-title {
    font-size: var(--font-size-subtitle);
    margin-bottom: 10px;
    color: var(--primary-color);
}

.confirm-desc {
    font-size: var(--font-size-body);
    color: var(--text-color);
    margin-bottom: 16px;
}

.confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.confirm-btn {
    height: 40px;
    padding: 0 18px;
    border-radius: var(--border-radius);
    font-size: var(--font-size-body);
    font-family: var(--font-family);
    cursor: pointer;
}

.confirm-btn.primary {
    background: var(--primary-color);
    color: var(--white);
    border: none;
}

.confirm-btn.secondary {
    background: var(--white);
    color: var(--primary-color);
    border: 2px solid var(--medium-gray);
}

/* 个人资料 */
.profile-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.avatar-section {
    display: flex;
    justify-content: center;
}

.avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--light-gray);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    color: #999;
    cursor: pointer;
    transition: all 0.3s ease;
}

.avatar:hover {
    background: var(--medium-gray);
}

.profile-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.form-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-item label {
    font-size: var(--font-size-small);
    color: var(--primary-color);
    font-weight: bold;
}

.form-input {
    padding: 10px;
    border: 1px solid var(--medium-gray);
    border-radius: 6px;
    font-family: var(--font-family);
    font-size: var(--font-size-body);
}

.form-input:focus {
    outline: none;
    border-color: var(--primary-color);
}

.form-input[readonly] {
    background: var(--light-gray);
    cursor: not-allowed;
}

.form-text {
    color: #666;
    font-size: var(--font-size-body);
}

.form-actions {
    display: flex;
    gap: 10px;
}

.edit-btn,
.save-btn,
.cancel-btn {
    padding: 8px 20px;
    border: none;
    border-radius: var(--border-radius);
    font-family: var(--font-family);
    font-size: var(--font-size-body);
    cursor: pointer;
    transition: all 0.3s ease;
}

.edit-btn,
.save-btn {
    background: var(--primary-color);
    color: var(--white);
}

.cancel-btn {
    background: var(--medium-gray);
    color: var(--text-color);
}

.edit-btn:hover,
.save-btn:hover {
    background: #1e3028;
    transform: scale(0.97);
}

.cancel-btn:hover {
    background: #ddd;
}


.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #999;
    font-size: var(--font-size-small);
}

/* 底部信息 */
.footer-info {
    text-align: center;
    padding: 30px 0;
    background: rgba(238, 238, 238, 0.6);
    border-radius: var(--border-radius);
}

.copyright {
    font-size: var(--font-size-body);
    color: var(--primary-color);
    margin-bottom: 8px;
}

.version {
    font-size: var(--font-size-small);
    color: #666;
}

/* 表单错误提示 */
.form-error {
    font-size: var(--font-size-small);
    color: #c0392b;
}

@media (max-width: 1200px) {
    .cards-grid {
        grid-template-columns: 1fr;
    }
}
</style>
