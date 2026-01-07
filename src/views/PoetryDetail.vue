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

            <!-- 精读 / 练习模式工具栏 -->
            <div class="poetry-tools">
                <div class="poetry-mode-buttons">
                    <button class="mode-btn" :class="{ active: isFillMode }" @click="toggleFillMode">
                        填空模式
                    </button>
                    <button class="mode-btn" :class="{ active: isSegmentMode }" :disabled="!isSegmentDemoSupported"
                        :title="isSegmentDemoSupported ? '' : '断句模式仅支持《生于忧患，死于安乐》'" @click="toggleSegmentMode">
                        断句模式
                    </button>
                </div>
                <div class="mode-tip" v-if="isFillMode">
                    提示：输入框处为被隐藏的句子内容，输入后会实时判断正误。
                </div>
                <div class="mode-tip" v-if="isSegmentMode">
                    提示：断句模式仅展示《生于忧患，死于安乐》的断句示例。
                </div>
            </div>

            <!-- 诗词正文展示区 -->
            <div class="poetry-content">
                <div class="poetry-text">
                    <p v-for="(line, index) in renderedLines" :key="index" class="poetry-line">
                        <!-- 普通精读模式：逐字悬停释义 -->
                        <template v-if="!isFillMode && !isSegmentMode">
                            <span v-for="(char, cIndex) in splitToChars(line)" :key="cIndex" class="poetry-char"
                                :class="{ 'has-dict': !!dictIndex[char] }" @mouseenter="onCharEnter(char, $event)"
                                @mouseleave="onCharLeave" @click="onCharClick(char, $event)">
                                {{ char }}
                            </span>
                        </template>

                        <!-- 填空模式：整句替换为横线 -->
                        <template v-else-if="isFillMode">
                            <template v-if="isFillLineTarget(index)">
                                <span class="fill-line fill-line-target">
                                    <input v-model="fillInputs[String(index)]" class="fill-line-input"
                                        :class="getFillLineState(index)" :style="{ width: getFillLineWidth(line) }"
                                        type="text" autocomplete="off" spellcheck="false" :aria-label="'默写：' + line" />
                                </span>
                            </template>
                            <template v-else>
                                <span class="fill-line">{{ line }}</span>
                            </template>
                        </template>

                        <!-- 断句模式：去标点 + 高亮 -->
                        <template v-else>
                            <span class="segment-line">
                                <span v-if="line === ''" class="segment-gap"></span>
                                <template v-else>{{ line }}</template>
                            </span>
                        </template>
                    </p>
                </div>
            </div>

            <!-- 字词悬停释义卡片 -->
            <div v-if="tooltipVisible && currentEntry" class="dict-tooltip" :style="tooltipStyle"
                @mouseenter="onTooltipEnter" @mouseleave="onTooltipLeave">
                <div class="dict-tooltip-header">
                    <span class="dict-word">{{ currentEntry.word }}</span>
                    <span class="dict-pinyin" v-if="currentPinyin">
                        {{ currentPinyin }}
                    </span>
                </div>
                <ul class="dict-meanings">
                    <li v-for="(line, i) in currentMeanings" :key="i">
                        {{ i + 1 }}. {{ line }}
                    </li>
                </ul>
                <div v-if="currentExample" class="dict-example">
                    {{ currentExample }}
                </div>
            </div>

            <!-- 注释解析区 -->
            <div v-if="poem.notes && poem.notes.length > 0" class="notes-section">
                <h3 class="section-title">【注释】</h3>
                <div class="notes-content">
                    <div v-for="(note, index) in poem.notes" :key="index" class="note-item">
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
                    <div v-for="rec in recommendations" :key="rec.id" class="recommendation-card"
                        @click="goToPoem(rec.id)">
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

    <!-- 浮动聊天窗口 · 右侧可收起 -->
    <div class="chat-floating" :class="{ collapsed: !chatOpen }">
        <div class="chat-floating-header">
            <div class="chat-floating-title">
                <span class="dot"></span>
                <span>与古人对话</span>
            </div>
            <button class="chat-toggle-btn" @click="toggleChat">
                {{ chatOpen ? '收起' : '展开' }}
            </button>
        </div>

        <div v-if="chatOpen" class="chat-box">
            <div class="chat-messages" ref="chatScrollRef">
                <div v-for="(msg, idx) in chatMessages" :key="idx" class="chat-message" :class="msg.role">
                    <span class="chat-role">{{ msg.role === 'user' ? '我' : '千问' }}</span>
                    <p class="chat-text">{{ msg.content }}</p>
                </div>
                <div v-if="sending" class="chat-message assistant typing">
                    <span class="chat-role">千问</span>
                    <p class="chat-text">正在生成回复...</p>
                </div>
            </div>
            <div class="chat-input-area">
                <textarea v-model="chatInput" class="chat-input" placeholder="想和古人聊聊什么？比如：这首诗的意境是什么？" rows="3" />
                <button class="chat-send-btn" :disabled="sending || !chatInput.trim()" @click="sendChat">
                    {{ sending ? '发送中…' : '发送' }}
                </button>
            </div>
            <p class="chat-tip">首次对话会附带本诗的题目、作者、朝代和正文。</p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import { getPoemByIdLazy, loadIndex } from '../utils/dataLoader'
import { searchDictionaryLazy } from '../utils/dictionaryLoader'

// 通义千问 API Key：仅尝试读取本地配置（已在 .gitignore），不存在则为空
const DASHSCOPE_API_KEY = ''

const route = useRoute()
const router = useRouter()
const poem = ref(null)
const showAppreciation = ref(true)
const isFavorite = ref(false)

const recommendations = computed(() => recommendList.value)
const recommendList = ref([])

// ====== 诗文内容与模式状态 ======
const originalLines = ref([])

// 填空模式 & 断句模式状态
const isFillMode = ref(false)
const isSegmentMode = ref(false)
// 填空：整句默写目标行
const fillLineTargets = ref([]) // number[]
// 断句：以句号为单位的整句索引
const segmentSentenceTargets = ref([]) // { lineIndex, segIndex }

// 填空：用户输入
const fillInputs = ref({}) // { [key: string]: string }

// 断句：仅支持《生于忧患，死于安乐》固定展示
const isSegmentDemoSupported = computed(() => {
    const title = poem.value?.title || ''
    return title.includes('生于忧患') && title.includes('死于安乐')
})

const segmentDemoLines = [
    // 第一段
    '舜发于/畎亩之中，傅说举于/版筑之间，胶鬲举于/鱼盐之中，管夷吾/举于士，孙叔敖/举于海，百里奚/举于市。故/天将降大任于/是人也，必先/苦其心志，劳/其筋骨，饿/其体肤，空乏/其身，行/拂乱其所为，所以/动心忍性，曾益/其所不能。',
    '',
    // 第二段
    '人/恒过，然后/能改；困于/心，衡于/虑，而后/作；征于/色，发于/声，而后/喻。入/则无法家拂士，出/则无敌国外患者，国/恒亡。然后/知/生于忧患/而死于安乐也。',
]

// 聊天相关
const chatMessages = ref([])
const chatInput = ref('')
const sending = ref(false)
const chatScrollRef = ref(null)
const hasSentInitial = ref(false)
const chatOpen = ref(false)

// 根据模式生成当前渲染的行
const renderedLines = computed(() => {
    if (!originalLines.value || originalLines.value.length === 0) {
        return []
    }

    if (isFillMode.value) {
        // 填空模式用输入框渲染，这里直接返回原文
        return originalLines.value
    }

    if (isSegmentMode.value) {
        // 断句模式：仅支持《生于忧患，死于安乐》，并按固定两段展示
        return isSegmentDemoSupported.value ? segmentDemoLines : originalLines.value
    }

    return originalLines.value
})

const isFillTarget = (lineIndex) =>
    fillLineTargets.value.includes(lineIndex)

const isSegmentTarget = (lineIndex) =>
    segmentSentenceTargets.value.some((s) => s.lineIndex === lineIndex)

// ====== 字词悬停释义相关 ======
const dictIndex = ref({}) // { [word]: normalizedEntry }
const tooltipVisible = ref(false)
const tooltipStyle = ref({ top: '0px', left: '0px' })
const currentEntry = ref(null)
const currentWord = ref('')
const tooltipTimer = ref(null)

const currentPinyin = computed(() => {
    if (!currentEntry.value || !currentEntry.value.meanings?.length) return ''
    return currentEntry.value.meanings[0].type || ''
})

const currentMeanings = computed(() => {
    if (!currentEntry.value || !currentEntry.value.meanings?.length) return []
    const lines = currentEntry.value.meanings[0].content
        .split('\n')
        .map((t) => t.replace(/<[^>]+>/g, '').trim())
        .filter(Boolean)
    // 只取前 1-2 条简化释义
    return lines.slice(0, 2)
})

const currentExample = computed(() => {
    if (!currentEntry.value || !currentEntry.value.examples?.length) return ''
    return currentEntry.value.examples[0]
})

const splitToChars = (line) => {
    if (!line) return []
    return Array.from(line)
}

const onCharEnter = (char, event) => {
    // 仅对已命中词典的字显示悬停效果
    const entry = dictIndex.value[char]
    if (!entry) return

    currentEntry.value = entry
    currentWord.value = char
    positionTooltip(event)
    clearTimeout(tooltipTimer.value)
    tooltipVisible.value = true
}

const onCharLeave = () => {
    // 延迟关闭，避免抖动
    clearTimeout(tooltipTimer.value)
    tooltipTimer.value = setTimeout(() => {
        tooltipVisible.value = false
    }, 250)
}

const onTooltipEnter = () => {
    clearTimeout(tooltipTimer.value)
}

const onTooltipLeave = () => {
    onCharLeave()
}

// 移动端轻点也可触发
const onCharClick = (char, event) => {
    const entry = dictIndex.value[char]
    if (!entry) return
    currentEntry.value = entry
    currentWord.value = char
    positionTooltip(event)
    tooltipVisible.value = true
}

const positionTooltip = (event) => {
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const rect = event.target.getBoundingClientRect()

    let top = rect.top + window.scrollY - 10
    let left = rect.right + 10 + window.scrollX

    // 如果靠近顶部，放到下方
    if (rect.top < 120) {
        top = rect.bottom + window.scrollY + 10
    }

    // 如果靠近右侧边缘，往左移
    const tooltipWidth = 300
    if (left + tooltipWidth > viewportWidth + window.scrollX - 10) {
        left = rect.left + window.scrollX - tooltipWidth - 10
    }

    // 简单的底部边界处理
    const tooltipHeight = 200
    if (top + tooltipHeight > viewportHeight + window.scrollY - 10) {
        top = viewportHeight + window.scrollY - tooltipHeight - 10
    }

    tooltipStyle.value = {
        top: `${top}px`,
        left: `${left}px`
    }
}

// 预加载当前诗文中出现的生僻字词
const preloadDictionaryForPoem = async () => {
    if (!originalLines.value || originalLines.value.length === 0) return
    const text = originalLines.value.join('')
    const chars = Array.from(
        new Set(text.replace(/[^\u4e00-\u9fa5]/g, ''))
    )

    const index = {}
    for (const ch of chars) {
        const entry = await searchDictionaryLazy(ch)
        if (entry) {
            index[ch] = entry
        }
    }
    dictIndex.value = index
}

// ====== 模式切换逻辑 ======
const toggleFillMode = () => {
    if (!poem.value) return

    if (!isFillMode.value) {
        // 若断句模式已开启，则关闭并提示
        if (isSegmentMode.value) {
            // alert('已为你关闭「断句模式」，当前进入「填空模式」。')
            isSegmentMode.value = false
            segmentSentenceTargets.value = []
        }
        generateFillTargets()
        fillInputs.value = {}
        isFillMode.value = true
    } else {
        isFillMode.value = false
        fillLineTargets.value = []
        fillInputs.value = {}
    }
}

const toggleSegmentMode = () => {
    if (!poem.value) return
    if (!isSegmentDemoSupported.value) return

    if (!isSegmentMode.value) {
        // 若填空模式已开启，则关闭并提示
        if (isFillMode.value) {
            // alert('已为你关闭「填空模式」，当前进入「断句模式」。')
            isFillMode.value = false
            fillLineTargets.value = []
            fillInputs.value = {}
        }
        isSegmentMode.value = true
    } else {
        isSegmentMode.value = false
        segmentSentenceTargets.value = []
    }
}

const isFillLineTarget = (lineIndex) => fillLineTargets.value.includes(lineIndex)

const normalizeFillText = (text) => {
    if (!text) return ''
    // 默写判定：忽略空白与常见标点，避免“带不带标点”影响体验
    return stripPunctuation(String(text)).replace(/\s+/g, '')
}

const getFillLineState = (lineIndex) => {
    const rawInput = (fillInputs.value[String(lineIndex)] || '').trim()
    if (!rawInput) return ''
    const correct = normalizeFillText(originalLines.value?.[lineIndex] || '')
    const input = normalizeFillText(rawInput)
    if (!correct) return ''
    return input === correct ? 'correct' : 'wrong'
}

const getFillLineWidth = (line) => {
    const pureLength = normalizeFillText(line).length
    const clamped = Math.min(Math.max(pureLength, 8), 26)
    return `${clamped}em`
}

// 生成填空目标小句（随机选取 20%～40%）
const generateFillTargets = () => {
    const lines = originalLines.value || []
    const candidates = [] // { lineIndex, length }

    lines.forEach((line, lineIndex) => {
        if (!line) return
        const pureLength = stripPunctuation(line).replace(/\s+/g, '').length
        if (pureLength >= 6) {
            candidates.push({ lineIndex, length: pureLength })
        }
    })

    if (candidates.length === 0) {
        fillLineTargets.value = []
        return
    }

    const ratio = 0.25
    const targetCount = Math.max(1, Math.floor(candidates.length * ratio))
    const shuffled = [...candidates].sort(() => Math.random() - 0.5)
    fillLineTargets.value = shuffled.slice(0, targetCount).map((c) => c.lineIndex)
}

// 通用：去除标点（用于长度计算 / 断句展示）
const stripPunctuation = (text) =>
    text.replace(/[，。、“”‘’？！；：,.!?、;:…—\-《》【】（）()「」『』【】]/g, '')

// 将一行拆分为“以句号为结束”的整句（用于断句）
const splitLineForSegment = (line) => {
    const result = []
    let buffer = ''
    for (const ch of Array.from(line)) {
        buffer += ch
        if (ch === '。') {
            result.push({ text: buffer, hasPunc: true })
            buffer = ''
        }
    }
    if (buffer) {
        result.push({ text: buffer, hasPunc: false })
    }
    return result
}

// 生成断句目标整句（约 20%，优先长句）
const generateSegmentTargets = () => {
    const lines = originalLines.value || []
    const candidates = [] // { lineIndex, segIndex, length }

    lines.forEach((line, lineIndex) => {
        const segments = splitLineForSegment(line)
        segments.forEach((seg, segIndex) => {
            if (!seg.hasPunc) return // 只选真正以句号结尾的整句
            const pureLength = stripPunctuation(seg.text).length
            if (pureLength >= 6) {
                candidates.push({ lineIndex, segIndex, length: pureLength })
            }
        })
    })

    if (candidates.length === 0) {
        segmentSentenceTargets.value = []
        return
    }

    // 按长度从大到小排序，优先选长句
    candidates.sort((a, b) => b.length - a.length)
    const ratio = 0.2
    const targetCount = Math.max(1, Math.floor(candidates.length * ratio))
    segmentSentenceTargets.value = candidates.slice(0, targetCount)
}

// 根据原句生成填空占位符行（以逗号 / 分号 / 句号等为单位）
const makeFillPlaceholder = (line, lineIndex) => {
    if (!line) return ''
    const segments = splitLineForFill(line)
    if (!segments.length) return line

    const isTargetSeg = (segIndex) =>
        fillSegmentTargets.value.some(
            (s) => s.lineIndex === lineIndex && s.segIndex === segIndex
        )

    return segments
        .map((seg, segIndex) => {
            if (!seg.hasPunc || !isTargetSeg(segIndex)) {
                return seg.text
            }
            const lastChar = seg.text[seg.text.length - 1]
            const body = seg.text.slice(0, -1)
            const underline = '＿'.repeat(body.length || 2)
            return `${underline}${lastChar}`
        })
        .join('')
}

const makeSegmentLine = (line, lineIndex) => {
    if (!line) return ''
    // 整行命中则整行去标点，避免高亮块内残留逗号/引号等
    if (isSegmentTarget(lineIndex)) {
        return stripPunctuation(line)
    }
    return line
}

// 显示某一行的原句（仅对断句模式下的目标行生效）
const showOriginalLine = (index) => {
    if (!isSegmentTarget(index)) return
    segmentSentenceTargets.value = segmentSentenceTargets.value.filter(
        (item) => item.lineIndex !== index
    )
}

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

// 构造首轮上下文
const buildPoemContext = () => {
    if (!poem.value) return ''
    const content = Array.isArray(poem.value.content)
        ? poem.value.content.join(' / ')
        : ''
    return `诗题：${poem.value.title}；作者：${poem.value.author}；朝代：${poem.value.dynasty}；正文：${content}`
}

const sendChat = async () => {
    if (!chatInput.value.trim() || sending.value) return
    if (DASHSCOPE_API_KEY === 'YOUR_DASHSCOPE_API_KEY') {
        window.alert('请先在 PoetryDetail.vue 中填写通义千问 API Key')
        return
    }

    const userMessage = chatInput.value.trim()
    chatMessages.value.push({ role: 'user', content: userMessage })
    chatInput.value = ''
    sending.value = true

    const systemPrompt = '你是通晓中国古典诗词的学者，请结合提供的诗文信息进行解读或对话，口吻亲和、简洁。'
    const initialContext = buildPoemContext()

    const payload = {
        model: 'qwen-plus',
        messages: [
            { role: 'system', content: systemPrompt },
            ...(hasSentInitial.value
                ? []
                : [{ role: 'user', content: `诗文信息：${initialContext}` }]),
            ...chatMessages.value.map(m => ({ role: m.role, content: m.content })),
        ]
    }

    try {
        const resp = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
            },
            body: JSON.stringify(payload),
        })

        const data = await resp.json()
        const reply = data?.choices?.[0]?.message?.content || '抱歉，没有获取到回复，请稍后再试。'
        chatMessages.value.push({ role: 'assistant', content: reply })
        hasSentInitial.value = true
    } catch (err) {
        chatMessages.value.push({ role: 'assistant', content: '请求失败，请检查网络或稍后再试。' })
    } finally {
        sending.value = false
        requestAnimationFrame(() => {
            if (chatScrollRef.value) {
                chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
            }
        })
    }
}

const toggleChat = () => {
    chatOpen.value = !chatOpen.value
    requestAnimationFrame(() => {
        if (chatOpen.value && chatScrollRef.value) {
            chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
        }
    })
}

onMounted(async () => {
    const id = route.params.id
    poem.value = await getPoemByIdLazy(id)

    if (!poem.value) {
        router.push('/poetry')
        return
    }

    // 初始化正文行
    originalLines.value = Array.isArray(poem.value.content)
        ? [...poem.value.content]
        : []

    // 预加载本篇诗文中会用到的词典字词
    preloadDictionaryForPoem()

    // 检查是否已收藏
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    isFavorite.value = favorites.includes(id)

    // 相关推荐：取索引前几条（过滤当前）
    const index = await loadIndex()
    recommendList.value = index
        .filter(item => item.id !== id)
        .slice(0, 4)
        .map(item => ({
            id: item.id,
            title: item.title,
            author: item.author,
        }))

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
    width: 92%;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
}

.poetry-text {
    text-align: center;
}

.poetry-line {
    position: relative;
    font-size: 22px;
    line-height: 2.5;
    color: var(--text-color);
    margin-bottom: 10px;
}

/* 精读 / 练习模式工具栏 */
.poetry-tools {
    width: 92%;
    max-width: 1200px;
    margin: 20px auto 10px;
    padding: 12px 24px;
    background: var(--white);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.poetry-mode-buttons {
    display: flex;
    justify-content: center;
    gap: 12px;
}

.mode-btn {
    padding: 6px 18px;
    font-size: var(--font-size-small);
    font-family: var(--font-family);
    color: var(--primary-color);
    background: transparent;
    border-radius: 999px;
    border: 1px solid var(--primary-color);
    cursor: pointer;
    transition: all 0.2s ease;
}

.mode-btn:hover {
    background: rgba(33, 71, 52, 0.04);
}

.mode-btn.active {
    background: var(--primary-color);
    color: var(--white);
}

.mode-tip {
    text-align: center;
    font-size: var(--font-size-small);
    color: #777;
}

/* 单字悬停样式 */
.poetry-char {
    display: inline-block;
    padding: 0 1px;
}

.poetry-char.has-dict {
    position: relative;
    color: var(--primary-color);
    cursor: pointer;
    text-decoration: underline dotted rgba(33, 71, 52, 0.5);
    text-underline-offset: 3px;
}

/* 填空模式样式 */
.fill-line {
    display: inline-block;
    letter-spacing: 0.06em;
}

.fill-line-target {
    display: block;
    width: 100%;
    text-align: center;
}

.fill-line-input {
    display: inline-block;
    max-width: 100%;
    border: none;
    border-bottom: 3px solid var(--medium-gray);
    background: transparent;
    padding: 4px 2px 2px;
    font-size: 22px;
    font-family: var(--font-family);
    letter-spacing: 0;
    outline: none;
    text-align: center;
    transition: border-bottom-color 0.15s ease, border-bottom-style 0.15s ease;
}

.fill-line-input::placeholder {
    color: var(--text-color);
    opacity: 0.35;
}

.fill-line-input:focus {
    border-bottom-color: var(--primary-color);
}

.fill-line-input.correct {
    border-bottom-color: var(--success-color);
    border-bottom-style: solid;
}

.fill-line-input.wrong {
    border-bottom-color: var(--danger-color);
    border-bottom-style: dashed;
}

.fill-input-wrap {
    display: inline-flex;
    align-items: baseline;
    gap: 2px;
}

.fill-input {
    border: none;
    border-bottom: 2px solid var(--medium-gray);
    border-radius: 0;
    padding: 0 2px;
    font-size: 18px;
    font-family: var(--font-family);
    outline: none;
    background: transparent;
    text-align: center;
}

.fill-input:focus {
    border-bottom-color: var(--primary-color);
}

.fill-input.correct {
    border-bottom-color: var(--success-color);
    border-bottom-style: solid;
}

.fill-input.wrong {
    border-bottom-color: var(--danger-color);
    border-bottom-style: dashed;
}

.fill-punc {
    letter-spacing: 0;
}

.fill-status {
    margin-left: 2px;
    font-size: 12px;
    letter-spacing: 0;
}

.fill-status.correct {
    color: var(--primary-color);
}

.fill-status.wrong {
    color: var(--text-color);
}



/* 断句模式样式 */
.segment-line {
    display: inline-block;
}

.segment-gap {
    display: block;
    height: 18px;
}

.segment-line.is-segment-target {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    margin: 0 -10px;
    background: #fffbe6;
    border-left: 3px solid var(--primary-color);
    border-radius: 4px;
}

.segment-label {
    margin-right: 8px;
    font-size: 12px;
    color: #6d8b7a;
}

.segment-show-original {
    margin-left: 10px;
    padding: 0 6px;
    font-size: 12px;
    color: var(--primary-color);
    background: transparent;
    border: none;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
}

.segment-show-original:hover {
    opacity: 0.8;
}

/* 字典释义卡片 */
.dict-tooltip {
    position: absolute;
    z-index: 50;
    width: 260px;
    max-width: 80vw;
    padding: 10px 12px;
    background: #f9f7f3;
    border-radius: 8px;
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
    border: 1px solid rgba(0, 0, 0, 0.04);
    box-sizing: border-box;
}

.dict-tooltip-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 6px;
}

.dict-word {
    font-size: 20px;
    font-weight: bold;
    color: var(--primary-color);
}

.dict-pinyin {
    font-size: 12px;
    color: #888;
}

.dict-meanings {
    margin: 0;
    padding-left: 18px;
    font-size: 13px;
    color: var(--text-color);
    line-height: 1.6;
}

.dict-meanings li {
    margin-bottom: 2px;
}

.dict-example {
    margin-top: 6px;
    padding: 6px 8px;
    font-size: 12px;
    color: #666;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 4px;
}

.notes-section,
.appreciation-section {
    background: #F0F0F0;
    border-radius: var(--border-radius);
    padding: 30px;
    margin-bottom: 30px;
    width: 92%;
    max-width: 1200px;
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

.chat-floating {
    position: fixed;
    top: 110px;
    right: 24px;
    width: 340px;
    max-height: calc(100vh - 150px);
    z-index: 1200;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    border-radius: 12px;
    background: var(--white);
    display: flex;
    flex-direction: column;
}

.chat-floating.collapsed {
    height: auto;
}

.chat-floating-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid var(--medium-gray);
}

.chat-floating-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--primary-color);
}

.dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--primary-color);
    display: inline-block;
}

.chat-toggle-btn {
    border: none;
    background: var(--light-gray);
    padding: 6px 10px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
}

.chat-box {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 12px 14px;
    height: 100%;
    max-height: calc(100vh - 220px);
}

.chat-messages {
    flex: 1;
    min-height: 200px;
    max-height: 320px;
    overflow-y: auto;
    background: var(--light-gray);
    border-radius: 10px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.chat-message {
    background: var(--white);
    border-radius: 10px;
    padding: 10px 12px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.chat-message.user {
    border-left: 3px solid var(--primary-color);
}

.chat-message.assistant {
    border-left: 3px solid #999;
}

.chat-message.typing {
    opacity: 0.7;
    font-style: italic;
}

.chat-role {
    display: block;
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
}

.chat-text {
    margin: 0;
    font-size: var(--font-size-body);
    color: var(--text-color);
    line-height: 1.6;
}

.chat-input-area {
    display: flex;
    gap: 10px;
}

.chat-input {
    flex: 1;
    border: 1px solid var(--medium-gray);
    border-radius: 10px;
    padding: 10px 12px;
    font-family: var(--font-family);
    font-size: var(--font-size-body);
    resize: vertical;
    min-height: 80px;
}

.chat-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(46, 70, 59, 0.1);
}

.chat-send-btn {
    width: 110px;
    border: none;
    border-radius: 10px;
    background: var(--primary-color);
    color: var(--white);
    font-size: var(--font-size-body);
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.1s ease;
}

.chat-send-btn:disabled {
    background: var(--medium-gray);
    cursor: not-allowed;
}

.chat-send-btn:not(:disabled):hover {
    background: #1e3028;
}

.chat-tip {
    font-size: 12px;
    color: #777;
}

@media (max-width: 1024px) {
    .chat-floating {
        right: 16px;
        width: min(90vw, 340px);
        top: auto;
        bottom: 16px;
        max-height: calc(70vh);
    }
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
    .poetry-tools {
        width: 100%;
        padding: 10px 16px;
    }

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
