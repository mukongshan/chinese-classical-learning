<template>
  <!-- 顶部导航栏组件 -->
  <nav class="navbar">
    <div class="navbar-content">
      <!-- 首页导航链接 -->
      <router-link 
        to="/" 
        class="nav-item"
        :class="{ active: isHome }"
      >
        首页
      </router-link>
      
      <!-- 诗词库导航链接（包括详情页） -->
      <router-link 
        to="/poetry" 
        class="nav-item"
        :class="{ active: isPoetry }"
      >
        诗词库
      </router-link>
      
      <!-- 文言文词典导航链接 -->
      <router-link 
        to="/dictionary" 
        class="nav-item"
        :class="{ active: isDictionary }"
      >
        文言文词典
      </router-link>
      
      <!-- 我的页面导航链接 -->
      <router-link 
        to="/profile" 
        class="nav-item"
        :class="{ active: isProfile }"
      >
        我的
      </router-link>
    </div>
  </nav>
</template>

<script setup>
/**
 * 导航栏组件 NavBar.vue
 * 功能：提供全站导航，高亮当前页面
 */

import { computed } from 'vue'
import { useRoute } from 'vue-router'

// 获取当前路由信息
const route = useRoute()

/**
 * 计算属性：判断当前路由是否为首页
 * 精确匹配路径 '/'
 */
const isHome = computed(() => route.path === '/')

/**
 * 计算属性：判断当前路由是否为诗词相关页面
 * 使用 startsWith 匹配 '/poetry' 开头的所有路径（包括详情页）
 */
const isPoetry = computed(() => route.path.startsWith('/poetry'))

/**
 * 计算属性：判断当前路由是否为词典页面
 * 精确匹配路径 '/dictionary'
 */
const isDictionary = computed(() => route.path === '/dictionary')

/**
 * 计算属性：判断当前路由是否为我的页面
 * 精确匹配路径 '/profile'
 */
const isProfile = computed(() => route.path === '/profile')
</script>

<style scoped>
/* 导航栏样式在全局样式文件 main.css 中定义 */
</style>

