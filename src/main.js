/**
 * 应用程序入口文件
 * 负责初始化Vue应用、注册路由和加载全局样式
 */

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/main.css'

// 创建Vue应用实例
const app = createApp(App)

// 注册路由
app.use(router)

// 挂载应用到DOM元素 #app
app.mount('#app')

