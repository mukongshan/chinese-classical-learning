/**
 * 全局“考官模式”状态管理
 * 采用最轻量的响应式 store，避免引入 Vuex / Pinia
 */
import { ref } from 'vue'

// 是否开启考官模式
export const examMode = ref(false)

// 切换模式
export const toggleExamMode = () => {
  examMode.value = !examMode.value
}

// 显式设置模式（方便以后在页面中按需开启）
export const setExamMode = (value) => {
  examMode.value = !!value
}

