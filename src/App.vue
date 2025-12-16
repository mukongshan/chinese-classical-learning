<template>
  <!-- 根组件容器，所有页面内容通过 router-view 动态渲染 -->
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
/**
 * 根组件 App.vue
 * 作为整个应用的容器组件，通过 router-view 显示当前路由对应的页面组件
 */
</script>

<style scoped>
/* 根容器样式：确保全屏高度，设置米白色背景（新中式风格） */
#app {
  min-height: 100vh;
  background: #FAF9F6;
}
</style>

