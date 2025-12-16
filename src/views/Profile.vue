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
              <div 
                v-for="fav in favorites" 
                :key="fav.id"
                class="favorite-item"
                @click="goToPoem(fav.id)"
              >
                <div class="fav-title">{{ fav.title }}</div>
                <div class="fav-author">{{ fav.author }}</div>
                <div class="fav-preview">{{ fav.preview }}</div>
                <button 
                  class="remove-fav-btn"
                  @click.stop="removeFavorite(fav.id)"
                >
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
              <div 
                v-for="(item, index) in history.slice(0, 5)" 
                :key="index"
                class="timeline-item"
                @click="goToPoem(item.id)"
              >
                <div class="timeline-title">{{ item.title }}</div>
                <div class="timeline-time">{{ formatTime(item.time) }}</div>
              </div>
            </div>
            <div v-else class="empty-state">
              <p>暂无学习记录</p>
            </div>
            <button 
              v-if="history.length > 0"
              class="clear-history-btn"
              @click="clearHistory"
            >
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
                  <input 
                    v-if="!isEditing"
                    v-model="profile.nickname"
                    type="text"
                    readonly
                    class="form-input"
                  />
                  <input 
                    v-else
                    v-model="editProfile.nickname"
                    type="text"
                    class="form-input"
                  />
                </div>
                <div class="form-item">
                  <label>个性签名</label>
                  <input 
                    v-if="!isEditing"
                    v-model="profile.signature"
                    type="text"
                    readonly
                    class="form-input"
                    :placeholder="profile.signature || '填写个性签名'"
                  />
                  <input 
                    v-else
                    v-model="editProfile.signature"
                    type="text"
                    class="form-input"
                    placeholder="填写个性签名"
                  />
                </div>
                <div class="form-item">
                  <label>注册时间</label>
                  <div class="form-text">{{ profile.registerTime }}</div>
                </div>
                <div class="form-actions">
                  <button 
                    v-if="!isEditing"
                    class="edit-btn"
                    @click="startEdit"
                  >
                    编辑
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

        <!-- 设置与帮助 -->
        <div class="function-card">
          <div class="card-header">
            <span class="card-icon">⚙️</span>
            <h3 class="card-title">设置与帮助</h3>
          </div>
          <div class="card-content">
            <div class="settings-section">
              <div class="setting-item">
                <label>主题切换</label>
                <div class="toggle-switch" @click="toggleTheme">
                  <div class="toggle-slider" :class="{ active: isDarkMode }"></div>
                </div>
                <span class="toggle-label">{{ isDarkMode ? '夜间' : '日间' }}</span>
              </div>
              <div class="setting-item">
                <label>字体大小</label>
                <div class="font-size-buttons">
                  <button 
                    v-for="size in fontSizes" 
                    :key="size.value"
                    class="font-size-btn"
                    :class="{ active: currentFontSize === size.value }"
                    @click="setFontSize(size.value)"
                  >
                    {{ size.label }}
                  </button>
                </div>
              </div>
              <div class="setting-item">
                <label>关于我们</label>
                <button class="about-btn" @click="showAbout = true">
                  查看版本信息
                </button>
              </div>
              <div class="setting-item">
                <label>反馈建议</label>
                <button class="feedback-btn" @click="showFeedback">
                  我要反馈
                </button>
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

      <!-- 关于弹窗 -->
      <div v-if="showAbout" class="modal-overlay" @click="showAbout = false">
        <div class="modal-content" @click.stop>
          <h3>关于我们</h3>
          <p>古诗词学习网致力于传承和弘扬中华优秀传统文化，为广大诗词爱好者提供便捷的学习平台。</p>
          <p><strong>版本号：</strong>v1.0.0</p>
          <p><strong>开发团队：</strong>人机交互课程项目组</p>
          <button class="modal-close-btn" @click="showAbout = false">关闭</button>
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
const showAbout = ref(false)
const isDarkMode = ref(false)
const currentFontSize = ref('medium')

const fontSizes = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' }
]

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
  editProfile.value = {
    nickname: profile.value.nickname,
    signature: profile.value.signature
  }
}

const saveProfile = () => {
  profile.value.nickname = editProfile.value.nickname
  profile.value.signature = editProfile.value.signature
  isEditing.value = false
  localStorage.setItem('profile', JSON.stringify(profile.value))
}

const cancelEdit = () => {
  isEditing.value = false
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
  if (confirm('确定要清空学习轨迹吗？')) {
    localStorage.setItem('history', JSON.stringify([]))
    history.value = []
  }
}

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('darkMode', isDarkMode.value)
  // 这里可以添加主题切换逻辑
}

const setFontSize = (size) => {
  currentFontSize.value = size
  localStorage.setItem('fontSize', size)
  document.documentElement.style.fontSize = size === 'small' ? '14px' : size === 'large' ? '18px' : '16px'
}

const showFeedback = () => {
  alert('感谢您的反馈！我们会认真考虑您的建议。')
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
  
  // 加载设置
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode) {
    isDarkMode.value = savedDarkMode === 'true'
  }
  
  const savedFontSize = localStorage.getItem('fontSize')
  if (savedFontSize) {
    currentFontSize.value = savedFontSize
    setFontSize(savedFontSize)
  }
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

/* 设置 */
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--light-gray);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item label {
  font-size: var(--font-size-body);
  color: var(--text-color);
  font-weight: bold;
}

.toggle-switch {
  width: 50px;
  height: 26px;
  background: var(--medium-gray);
  border-radius: 13px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.toggle-slider {
  width: 22px;
  height: 22px;
  background: var(--white);
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
}

.toggle-slider.active {
  left: 26px;
  background: var(--primary-color);
}

.toggle-switch.active {
  background: var(--primary-color);
}

.toggle-label {
  font-size: var(--font-size-small);
  color: #666;
  margin-left: 10px;
}

.font-size-buttons {
  display: flex;
  gap: 8px;
}

.font-size-btn {
  padding: 6px 15px;
  border: 2px solid var(--medium-gray);
  background: var(--white);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: var(--font-family);
  font-size: var(--font-size-small);
}

.font-size-btn.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: var(--white);
}

.font-size-btn:hover {
  border-color: var(--primary-color);
}

.about-btn,
.feedback-btn {
  padding: 8px 20px;
  background: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: var(--font-family);
  font-size: var(--font-size-small);
}

.about-btn:hover,
.feedback-btn:hover {
  background: #1e3028;
  transform: scale(0.97);
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

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 30px;
  max-width: 500px;
  width: 90%;
}

.modal-content h3 {
  font-size: var(--font-size-subtitle);
  color: var(--primary-color);
  margin-bottom: 20px;
}

.modal-content p {
  margin-bottom: 15px;
  line-height: 1.8;
  color: var(--text-color);
}

.modal-close-btn {
  width: 100%;
  padding: 10px;
  background: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s ease;
}

.modal-close-btn:hover {
  background: #1e3028;
}

@media (max-width: 1200px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>

