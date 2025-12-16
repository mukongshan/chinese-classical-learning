/**
 * 从 res/chinese-poetry-master 下各中文子目录提取前 50 首诗词，写入
 * - public/data/poems.json   （正文全集合）
 * - public/data/index.json   （索引：id/title/author/tag/file/idx）
 *
 * 规则：
 * - tag = 子目录名称（如 “全唐诗” / “宋词” / “楚辞” 等）
 * - 每个子目录累计 50 条（按文件顺序、文件内顺序）
 * - 兼容字段：title | rhythmic | chapter 作为标题；paragraphs | content 作为正文
 *
 * 使用：
 *   node scripts/extract-poems.js
 */

import fs from 'fs/promises'
import path from 'path'

const ROOT = process.cwd()
const LIMIT = 1000
const RES_ROOT = path.join(ROOT, 'res', 'chinese-poetry-master')
const OUT_DIR = path.join(ROOT, 'public', 'data')
const OUT_POEMS = path.join(OUT_DIR, 'poems.json')
const OUT_INDEX = path.join(OUT_DIR, 'index.json')

// 可忽略的目录
const IGNORE_DIRS = new Set(['images', 'loader', 'rank', 'strains'])

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

function normalizePoem(raw, tag, id) {
  const title = raw.title || raw.rhythmic || raw.chapter || '未命名'
  const author = raw.author || '佚名'
  const content = raw.paragraphs || raw.content || raw.chapter || []
  return { id, title, author, tag, content }
}

async function readJsonFile(file) {
  const buf = await fs.readFile(file, 'utf-8')
  return JSON.parse(buf)
}

async function collectFromDir(dirName) {
  const dirPath = path.join(RES_ROOT, dirName)
  const entries = await fs.readdir(dirPath)
  const jsonFiles = entries.filter(f => f.endsWith('.json'))
  const poems = []

  for (const file of jsonFiles) {
    if (poems.length >= LIMIT) break
    const full = path.join(dirPath, file)
    try {
      const data = await readJsonFile(full)
      for (let i = 0; i < data.length && poems.length < LIMIT; i++) {
        const id = `${dirName}-${file}-${i}`
        poems.push(normalizePoem(data[i], dirName, id))
      }
    } catch (e) {
      console.warn(`跳过文件 ${full}，原因：${e.message}`)
    }
  }
  return poems
}

async function main() {
  await ensureDir(OUT_DIR)
  const subdirs = await fs.readdir(RES_ROOT)
  const allPoems = []

  for (const dir of subdirs) {
    const stat = await fs.stat(path.join(RES_ROOT, dir))
    if (!stat.isDirectory()) continue
    if (IGNORE_DIRS.has(dir)) continue
    // 仅处理中文命名子目录
    if (!/[\u4e00-\u9fa5]/.test(dir)) continue

    console.log(`提取目录: ${dir}`)
    const poems = await collectFromDir(dir)
    allPoems.push(...poems)
  }

  // 写 poems.json
  await fs.writeFile(OUT_POEMS, JSON.stringify(allPoems, null, 2), 'utf-8')

  // 写 index.json（重新生成）
  const index = allPoems.map((p, idx) => ({
    id: p.id,
    title: p.title,
    author: p.author,
    tag: p.tag,
    file: '/data/poems.json',
    idx,
  }))
  await fs.writeFile(OUT_INDEX, JSON.stringify(index, null, 2), 'utf-8')

  console.log(`完成：共 ${allPoems.length} 条，输出：`)
  console.log(`- ${OUT_POEMS}`)
  console.log(`- ${OUT_INDEX}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

