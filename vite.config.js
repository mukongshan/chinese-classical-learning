/**
 * Vite 构建工具配置文件
 * 用于配置开发服务器、构建选项和插件
 */

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 插件配置：使用 Vue 3 单文件组件支持
  plugins: [vue()],
  
  // 开发服务器配置
  server: {
    port: 3000,      // 开发服务器端口号
    open: true       // 启动时自动在浏览器中打开
  }
})

