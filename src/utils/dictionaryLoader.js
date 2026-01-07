/**
 * 懒加载文言文词典
 * 数据来源：public/data/dictionary.json
 *
 * 支持两种结构：
 * 1) 已规范化：{ word, meanings: [{type, content}], examples, source }
 * 2) 原始结构：{ word, explain: { pinyin: [lines...] }, url? }
 *    会在这里自动规范化为 type=拼音, content=行文本合并。
 */

const DICT_URL = '/data/dictionary.json'

let dictCache = null

function stripHtml(text) {
    if (!text) return ''
    return String(text)
        .replace(/<[^>]*>/g, '')
        .replace(/\s+\n/g, '\n')
        .trim()
}

async function fetchDict() {
    if (dictCache) return dictCache
    const res = await fetch(DICT_URL)
    if (!res.ok) throw new Error('加载词典失败')
    const raw = await res.json()
    dictCache = raw.map(normalizeEntry)
    return dictCache
}

function normalizeEntry(entry) {
    // 已经是规范格式
    if (entry.meanings) return entry

    const meanings = []
    if (entry.explain && typeof entry.explain === 'object') {
        Object.entries(entry.explain).forEach(([pinyin, lines]) => {
            if (Array.isArray(lines) && lines.length > 0) {
                meanings.push({
                    type: pinyin,
                    content: stripHtml(lines.join('\n'))
                })
            }
        })
    }
    return {
        word: entry.word,
        meanings,
        examples: entry.examples || [],
        source: entry.url || ''
    }
}

export async function searchDictionaryLazy(keyword) {
    if (!keyword) return null
    const data = await fetchDict()
    const hit = data.find(item => item.word === keyword)
    return hit || null
}

export async function getDictionaryHistory() {
    const saved = localStorage.getItem('dictionaryHistory')
    return saved ? JSON.parse(saved) : []
}

export async function addDictionaryHistory(word) {
    if (!word) return
    const history = await getDictionaryHistory()
    const idx = history.indexOf(word)
    if (idx > -1) history.splice(idx, 1)
    history.unshift(word)
    if (history.length > 10) history.pop()
    localStorage.setItem('dictionaryHistory', JSON.stringify(history))
    return history
}

export async function clearDictionaryHistory() {
    localStorage.setItem('dictionaryHistory', JSON.stringify([]))
}

