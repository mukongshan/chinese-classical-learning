/**
 * 构建数据索引与精简数据文件
 *
 * 将 res/ 下的大数据集抽取出一小部分，生成：
 * - public/data/poems-tang-0.json   （唐诗子集）
 * - public/data/poems-song-0.json   （宋词子集）
 * - public/data/dictionary.json     （文言文词典子集）
 * - public/data/index.json          （索引，仅元数据）
 *
 * 便于前端懒加载，首屏轻量。
 */
import fs from 'fs/promises'
import path from 'path'

const ROOT = process.cwd()
const PUBLIC_DATA_DIR = path.join(ROOT, 'public', 'data')

const TANG_SRC = path.join(ROOT, 'res', 'chinese-poetry-master', '全唐诗', 'poet.tang.0.json')
const SONG_SRC = path.join(ROOT, 'res', 'chinese-poetry-master', '宋词', 'ci.song.0.json')
const DICT_SRC = path.join(ROOT, 'res', 'ancient_chinese-master', 'dict', 'out_file', 'ancient_chinese.json')

const TANG_OUT = 'poems-tang-0.json'
const SONG_OUT = 'poems-song-0.json'
const DICT_OUT = 'dictionary.json'
const INDEX_OUT = 'index.json'

// 抽取数量，避免文件过大
const TANG_LIMIT = 20000
const SONG_LIMIT = 20000
const DICT_LIMIT = 10000

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function readJson(file) {
  const buf = await fs.readFile(file, 'utf-8')
  return JSON.parse(buf)
}

async function writeJson(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8')
}

async function build() {
  await ensureDir(PUBLIC_DATA_DIR)

  const tangRaw = await readJson(TANG_SRC)
  const songRaw = await readJson(SONG_SRC)
  const dictRaw = await readJson(DICT_SRC)

  const tangSlice = tangRaw.slice(0, TANG_LIMIT).map((item, idx) => ({
    ...item,
    dynasty: '唐',
    id: item.id || `tang-0-${idx}`,
  }))

  const songSlice = songRaw.slice(0, SONG_LIMIT).map((item, idx) => ({
    ...item,
    dynasty: '宋',
    title: item.title || item.rhythmic || `宋词-${idx + 1}`,
    id: item.id || `song-0-${idx}`,
  }))

  const dictSlice = dictRaw.slice(0, DICT_LIMIT)

  const tangFileUrl = `/data/${TANG_OUT}`
  const songFileUrl = `/data/${SONG_OUT}`

  const index = [
    ...tangSlice.map((item, idx) => ({
      id: item.id,
      title: item.title,
      author: item.author,
      dynasty: '唐',
      file: tangFileUrl,
      idx,
    })),
    ...songSlice.map((item, idx) => ({
      id: item.id,
      title: item.title,
      author: item.author,
      dynasty: '宋',
      file: songFileUrl,
      idx,
    })),
  ]

  await Promise.all([
    writeJson(path.join(PUBLIC_DATA_DIR, TANG_OUT), tangSlice),
    writeJson(path.join(PUBLIC_DATA_DIR, SONG_OUT), songSlice),
    writeJson(path.join(PUBLIC_DATA_DIR, DICT_OUT), dictSlice),
    writeJson(path.join(PUBLIC_DATA_DIR, INDEX_OUT), index),
  ])

  console.log('数据构建完成：')
  console.log(`- ${TANG_OUT}  (${tangSlice.length})`)
  console.log(`- ${SONG_OUT}  (${songSlice.length})`)
  console.log(`- ${DICT_OUT}  (${dictSlice.length})`)
  console.log(`- ${INDEX_OUT}  (${index.length} 索引项)`)
}

build().catch(err => {
  console.error(err)
  process.exit(1)
})

