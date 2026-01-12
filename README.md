# 古诗词学习网

一个基于 Vue3 的古诗词学习网站，提供诗词浏览、搜索、文言文词典查询等功能。

## 项目简介

这是南京大学软件学院人机交互课程项目，专注于良好的用户体验设计和界面构思。项目采用 Vue3 + Vite 构建，无需后端支持，所有数据存储在本地。

## 功能特性

### 🏠 首页
- 顶层分类导航
- 全局搜索功能
- 热门诗词推荐

### 📚 诗词库
- 诗词列表浏览
- 分类筛选
- 搜索功能
- 诗词详情页
- 收藏功能

### 📖 文言文词典
- 文言文字词查询
- 详细释义展示
- 例句和出处
- 查询历史记录

### 👤 我的
- 我的收藏管理
- 学习轨迹统计
- 个人资料编辑
- 关于我们和反馈

## 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **路由**: Vue Router 4
- **样式**: CSS3 

## 项目结构

```
chinese-classical-learning/
├── src/
│   ├── components/       # 公共组件
│   │   └── NavBar.vue   # 导航栏组件
│   ├── views/           # 页面组件
│   │   ├── Home.vue           # 首页
│   │   ├── PoetryLibrary.vue # 诗词库
│   │   ├── PoetryDetail.vue  # 诗词详情
│   │   ├── Dictionary.vue    # 文言文词典
│   │   └── Profile.vue        # 我的页面
│   ├── router/          # 路由配置
│   │   └── index.js
│   ├── styles/          # 全局样式
│   │   └── main.css
│   ├── utils/           # 工具函数
│   │   └── data.js      # 数据管理
│   ├── App.vue          # 根组件
│   └── main.js          # 入口文件
├── index.html           # HTML 模板
├── package.json         # 项目配置
├── vite.config.js       # Vite 配置
└── README.md           # 项目说明
```

## 安装和运行

### 安装依赖

```bash
npm install
```


### 运行

```bash
npm run preview
```
项目将在 `http://localhost:3000` 启动

## 设计特色

### 用户体验优化
- 响应式设计，适配不同屏幕尺寸
- 流畅的页面切换动画
- 直观的导航和搜索功能
- 本地存储，保存用户偏好和历史记录

## 注意事项

本项目使用了通义千问提供的接口，使用AI功能时需在 src\views\PoetryDetail.vue 中添加 DASHSCOPE_API_KEY。