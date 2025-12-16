/**
 * 路由配置文件
 * 定义应用的所有路由规则，包括路径、组件映射和路由名称
 */

import { createRouter, createWebHistory } from 'vue-router'
// 导入所有页面组件
import Home from '../views/Home.vue'
import PoetryLibrary from '../views/PoetryLibrary.vue'
import PoetryDetail from '../views/PoetryDetail.vue'
import Dictionary from '../views/Dictionary.vue'
import Profile from '../views/Profile.vue'

/**
 * 路由配置数组
 * 每个路由对象包含：
 * - path: 路由路径（URL）
 * - name: 路由名称（用于编程式导航）
 * - component: 对应的Vue组件
 */
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home  // 首页：分类导航、搜索、热门推荐
  },
  {
    path: '/poetry',
    name: 'PoetryLibrary',
    component: PoetryLibrary  // 诗词库：诗词列表、搜索、分类筛选
  },
  {
    path: '/poetry/:id',  // 动态路由，:id 为诗词ID参数
    name: 'PoetryDetail',
    component: PoetryDetail  // 诗词详情页：正文、注释、赏析
  },
  {
    path: '/dictionary',
    name: 'Dictionary',
    component: Dictionary  // 文言文词典：查询、释义、历史记录
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile  // 我的页面：收藏、学习轨迹、个人资料、设置
  }
]

/**
 * 创建路由实例
 * - createWebHistory: 使用HTML5 History模式（需要服务器配置支持）
 * - routes: 路由配置数组
 */
const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

