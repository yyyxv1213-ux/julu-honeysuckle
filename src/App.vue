<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<template>
  <el-container class="app-layout">
    <el-aside width="220px" class="app-aside">
      <div class="brand">
        <span class="brand-icon">🌿</span>
        <div class="brand-text">
          <div class="brand-name">太行薪火 金银花开</div>
        </div>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
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
        <div class="header-title">{{ route.meta.title || '太行薪火 金银花开 产业指挥服务平台' }}</div>
        <div class="header-extra">数据整理于公开资料 · AI 功能由 Agnes 提供</div>
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
  background: linear-gradient(180deg, #1f4d35 0%, #2c6b48 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: auto;
  min-width: 170px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 18px 12px;
  color: #fff;
  flex-shrink: 0;
}
.brand-text { display: flex; align-items: center; }
.brand-icon { font-size: 26px; flex-shrink: 0; }
.brand-name { font-size: 19px; font-weight: 700; letter-spacing: 0.08em; white-space: nowrap; }
.app-menu {
  border-right: none;
  background: transparent;
  --el-menu-text-color: rgba(255,255,255,0.82);
  --el-menu-hover-bg-color: rgba(255,255,255,0.12);
  --el-menu-active-color: #ffd666;
  --el-menu-bg-color: transparent;
  --el-menu-font-size: 15px;
  flex: 1;
}
.app-menu :deep(.el-menu-item.is-active) {
  background: rgba(255,255,255,0.10);
  border-right: 3px solid #ffd666;
}
.app-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.app-header {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  flex-shrink: 0;
  padding: 0 20px;
}
.header-title { font-size: 20px; font-weight: 600; color: #1f4d35; }
.header-extra { font-size: 13px; color: #999; }
.app-main {
  background: #f5f7f5;
  padding: 20px;
  flex: 1;
}

/* 页面切换淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
