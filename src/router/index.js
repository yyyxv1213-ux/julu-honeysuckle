import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'overview', component: () => import('../views/Overview.vue'), meta: { title: '产业概览', icon: 'DataBoard' } },
  { path: '/price', name: 'price', component: () => import('../views/Price.vue'), meta: { title: '价格分析与预测', icon: 'TrendCharts' } },
  { path: '/pest', name: 'pest', component: () => import('../views/Pest.vue'), meta: { title: '病虫害识别', icon: 'Camera' } },
  { path: '/qa', name: 'qa', component: () => import('../views/Qa.vue'), meta: { title: '智能问答', icon: 'ChatDotRound' } },
  { path: '/policy', name: 'policy', component: () => import('../views/Policy.vue'), meta: { title: '政策资讯', icon: 'Document' } },
  { path: '/tools', name: 'tools', component: () => import('../views/Tools.vue'), meta: { title: '农户工具', icon: 'Calculator' } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.afterEach((to) => {
  document.title = (to.meta.title ? to.meta.title + ' | ' : '') + '太行薪火 金银花开 产业指挥服务平台'
})

export default router
