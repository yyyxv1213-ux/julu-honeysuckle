<script setup>
import { useRoute } from 'vue-router'
import { computed, ref, onMounted, onUnmounted } from 'vue'

const route = useRoute()
const activeMenu = computed(() => route.path)

const isCollapse = ref(false)
let isMobile = false

function onResize() {
  const shouldCollapse = window.innerWidth < 768
  if (shouldCollapse !== isMobile) {
    isMobile = shouldCollapse
    isCollapse.value = shouldCollapse
  }
}

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <el-container class="app-layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="app-aside" :class="{ 'is-collapsed': isCollapse }">
      <div class="brand">
        <span class="brand-icon">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <ellipse cx="9.5" cy="14" rx="5.5" ry="8" fill="#f2e7c9" stroke="#c99b3f" stroke-width="1.2" transform="rotate(-18 9.5 14)"/>
            <ellipse cx="16.5" cy="14" rx="5.5" ry="8" fill="#f6f1e6" stroke="#c99b3f" stroke-width="1.2" transform="rotate(18 16.5 14)"/>
            <path d="M13 3 C13 7 13 10 13 13" stroke="#2e3d33" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M13 8 C10.5 8 9 6.5 8.5 4.5 M13 9 C15.5 9 17 7.5 17.5 5.5" stroke="#2e3d33" stroke-width="1.2" stroke-linecap="round" fill="none"/>
          </svg>
        </span>
        <div class="brand-text">
          <div class="brand-name" v-show="!isCollapse">太行薪火 金银花开</div>
        </div>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        :collapse="isCollapse"
        class="app-menu"
      >
        <el-menu-item index="/">
          <el-icon><DataBoard /></el-icon><span>产业概览</span>
        </el-menu-item>
        <el-menu-item index="/price">
          <el-icon><TrendCharts /></el-icon><span>价格分析与预测</span>
        </el-menu-item>
        <el-menu-item index="/pest">
          <el-icon><Camera /></el-icon><span>病虫害识别</span>
        </el-menu-item>
        <el-menu-item index="/qa">
          <el-icon><ChatDotRound /></el-icon><span>智能问答</span>
        </el-menu-item>
        <el-menu-item index="/policy">
          <el-icon><Document /></el-icon><span>政策资讯</span>
        </el-menu-item>
        <el-menu-item index="/tools">
          <el-icon><Tools /></el-icon><span>农户工具</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="app-body">
      <el-header class="app-header">
        <div class="header-left">
          <el-button class="collapse-btn" text circle size="small" @click="isCollapse = !isCollapse">
            <el-icon v-if="isCollapse"><Expand /></el-icon>
            <el-icon v-else><Fold /></el-icon>
          </el-button>
          <div class="header-title">{{ route.meta.title || '太行薪火 金银花开 产业指挥服务平台' }}</div>
        </div>
        <div class="header-extra">数据整理于公开资料 · 持续更新</div>
      </el-header>
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
}
.app-aside {
  background: #2e3d33;
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: var(--el-aside-width, 220px);
  min-width: 170px;
  transition: width 0.25s ease, min-width 0.25s ease;
}
.app-aside.is-collapsed {
  min-width: 64px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 18px 12px;
  color: #fff;
  flex-shrink: 0;
}
.app-aside.is-collapsed .brand {
  padding: 18px 8px 12px;
  justify-content: center;
}
.brand-text { display: flex; align-items: center; }
.brand-icon { font-size: 26px; flex-shrink: 0; }
.brand-name { font-size: 16px; font-weight: 700; letter-spacing: 0.08em; white-space: nowrap; }
.app-menu {
  border-right: none;
  background: transparent;
  --el-menu-text-color: rgba(255, 255, 255, 0.82);
  --el-menu-hover-bg-color: rgba(255, 255, 255, 0.1);
  --el-menu-active-color: #e8c37a;
  --el-menu-bg-color: transparent;
  --el-menu-font-size: 15px;
  flex: 1;
}
.app-menu :deep(.el-menu-item.is-active) {
  background: rgba(201, 155, 63, 0.16);
  border-left: 3px solid #c99b3f;
}
.app-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.app-header {
  background: #fbf7ee;
  border-bottom: 1px solid #e5dcc8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  flex-shrink: 0;
  padding: 0 20px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.collapse-btn {
  color: #2e3d33;
  flex-shrink: 0;
}
.collapse-btn:hover {
  color: #c99b3f;
  background: rgba(46, 61, 51, 0.08) !important;
}
.header-title { font-size: 20px; font-weight: 600; color: #2e3d33; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.header-extra { font-size: 13px; color: #a09178; }
.app-main {
  background: transparent;
  padding: 20px;
  flex: 1;
}

/* 页面切换：淡入 + 轻微上浮 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
