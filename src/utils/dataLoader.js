/**
 * 懒加载诗词数据工具
 *
 * 数据来源：public/data/index.json （仅元数据）
 *           public/data/poems-tang-0.json / poems-song-0.json （正文片段）
 *
 * 通过 fetch 动态加载，首屏只请求索引，后续按需加载正文并缓存。
 */

const INDEX_URL = '/data/index.json'

// 简单缓存，避免重复请求
const cache = {
  index: null,
  files: new Map(), // fileUrl -> json
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`加载失败：${url}`)
  return res.json()
}

export async function loadIndex() {
  if (cache.index) return cache.index
  const data = await fetchJson(INDEX_URL)
  cache.index = data
  return data
}

async function loadFile(fileUrl) {
  if (cache.files.has(fileUrl)) return cache.files.get(fileUrl)
  const data = await fetchJson(fileUrl)
  cache.files.set(fileUrl, data)
  return data
}

export async function getPoemByIdLazy(id) {
  const index = await loadIndex()
  const meta = index.find(item => item.id === id)
  if (!meta) return null
  const file = await loadFile(meta.file)
  const raw = file[meta.idx]
  if (!raw) return null
  return normalizePoem(raw, meta)
}

export async function searchPoemsLazy(keyword) {
  if (!keyword) return []
  const lower = keyword.toLowerCase()
  const index = await loadIndex()

  const hits = index.filter(item =>
    (item.title && item.title.toLowerCase().includes(lower)) ||
    (item.author && item.author.toLowerCase().includes(lower))
  )

  const results = await Promise.all(hits.map(async meta => {
    const file = await loadFile(meta.file)
    const raw = file[meta.idx]
    return raw ? normalizePoem(raw, meta) : null
  }))

  return results.filter(Boolean)
}

export async function getPopularPoemsLazy(limit = 4) {
  const index = await loadIndex()
  const slice = index.slice(0, limit)
  const results = await Promise.all(slice.map(async meta => {
    const file = await loadFile(meta.file)
    const raw = file[meta.idx]
    return raw ? normalizePoem(raw, meta) : null
  }))
  return results.filter(Boolean)
}

export async function getPoemsByCategoryLazy(categoryId) {
  const index = await loadIndex()
  const filtered = categoryId && categoryId !== 'all'
    ? index.filter(item => matchCategory(item, categoryId))
    : index

  // 仅返回元数据列表，列表页可按需再取正文
  return filtered
}

export function matchCategory(item, categoryId) {
  if (!categoryId || categoryId === 'all') return true
  if (categoryId === 'tang') return item.dynasty === '唐'
  if (categoryId === 'song') return item.dynasty === '宋'
  return true
}

function normalizePoem(raw, meta) {
  return {
    id: meta.id,
    title: meta.title || raw.title || raw.rhythmic || '未命名',
    author: meta.author || raw.author || '佚名',
    dynasty: meta.dynasty || raw.dynasty || '',
    content: raw.paragraphs || raw.content || [],
    rhythmic: raw.rhythmic,
  }
}

