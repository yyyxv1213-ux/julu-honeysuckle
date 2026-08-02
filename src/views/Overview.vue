<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import industry from '../data/industry.json'
import { getStorage } from '../utils/storage'

const cards = ref(industry.cards)
const varieties = ref(industry.varieties)
const towns = ref(industry.towns)
const annual = ref(industry.annual)

/* 数字滚动动画 */
const displayValues = ref(cards.value.map(() => '0'))
let rafId = 0
onMounted(() => {
  cards.value.forEach((c, i) => {
    const target = parseFloat(c.value)
    const decimals = (String(c.value).split('.')[1] || '').length
    const start = performance.now()
    const dur = 900
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      displayValues.value[i] = (target * eased).toFixed(decimals)
      if (p < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
  })
})

let trendChart = null
let townChart = null
let pieChart = null

function initTrend() {
  const el = document.getElementById('trend-chart')
  if (!el) return
  trendChart = echarts.init(el)
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['种植面积(万亩)', '年产量(万吨)'],
      top: 8,
      textStyle: { fontSize: 13 }
    },
    grid: { left: 55, right: 35, top: 50, bottom: 30 },
    xAxis: {
      type: 'category',
      data: annual.value.map(a => a.year),
      axisLabel: { fontSize: 13 }
    },
    yAxis: [
      { type: 'value', name: '万亩', nameTextStyle: { fontSize: 12 }, axisLabel: { fontSize: 12 } },
      { type: 'value', name: '万吨', nameTextStyle: { fontSize: 12 }, axisLabel: { fontSize: 12 } }
    ],
    series: [
      {
        name: '种植面积(万亩)',
        type: 'bar',
        data: annual.value.map(a => a.area),
        itemStyle: { color: '#2c6b48', borderRadius: [4, 4, 0, 0] },
        barWidth: 32
      },
      {
        name: '年产量(万吨)',
        type: 'line',
        yAxisIndex: 1,
        data: annual.value.map(a => a.output),
        itemStyle: { color: '#d4a94e' },
        lineStyle: { width: 3 }
      }
    ]
  })
}

function initTowns() {
  const el = document.getElementById('town-chart')
  if (!el) return
  const sorted = [...towns.value].sort((a, b) => a.area - b.area)
  townChart = echarts.init(el)
  townChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: p => p[0].name + '<br/>种植面积：' + p[0].value + ' 万亩'
    },
    grid: { left: 90, right: 45, top: 12, bottom: 30 },
    xAxis: {
      type: 'value', name: '万亩',
      nameTextStyle: { fontSize: 13 },
      axisLabel: { fontSize: 12 }
    },
    yAxis: {
      type: 'category',
      data: sorted.map(t => t.name),
      axisLabel: { fontSize: 13 }
    },
    series: [
      {
        type: 'bar',
        data: sorted.map(t => t.area),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#a8c8b0' },
            { offset: 1, color: '#2c6b48' }
          ]),
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true, position: 'right',
          formatter: '{c} 万亩',
          fontSize: 13
        }
      }
    ]
  })
}

function initPie() {
  const el = document.getElementById('pie-chart')
  if (!el) return
  pieChart = echarts.init(el)
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}：{c}（{d}%）' },
    legend: {
      bottom: 8,
      textStyle: { fontSize: 13 }
    },
    series: [
      {
        type: 'pie',
        radius: ['38%', '64%'],
        center: ['50%', '42%'],
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { formatter: '{b}\n{d}%', fontSize: 13 },
        data: varieties.value.map(v => ({ name: v.name, value: parseFloat(v.share) }))
      }
    ]
  })
}

function resizeCharts() {
  trendChart?.resize()
  townChart?.resize()
  pieChart?.resize()
}

onMounted(() => {
  initTrend()
  initTowns()
  initPie()
  window.addEventListener('resize', resizeCharts)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  trendChart?.dispose()
  townChart?.dispose()
  pieChart?.dispose()
})
</script>

<template>
  <div class="page-wrap">
    <div class="page-title">巨鹿金银花产业概览</div>
    <div class="page-desc">数据整理自巨鹿县政府公开报告与新闻稿件（模拟数据，仅供参考）</div>

    <!-- 数据卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6" v-for="(c, i) in cards" :key="c.label">
        <div class="stat-card card-pad">
          <div class="card-label">{{ c.label }}</div>
          <div class="card-value">
            {{ displayValues[i] }}<span class="card-unit">{{ c.unit }}</span>
          </div>
          <div class="card-trend">{{ c.trend }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 趋势图 + 品种饼图 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :md="16">
        <div class="stat-card chart-card">
          <div class="chart-title">近五年种植面积与产量趋势</div>
          <div id="trend-chart" class="chart-box"></div>
        </div>
      </el-col>
      <el-col :xs="24" :md="8">
        <div class="stat-card chart-card">
          <div class="chart-title">主要品种占比</div>
          <div id="pie-chart" class="chart-box"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 乡镇分布 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :span="24">
        <div class="stat-card chart-card">
          <div class="chart-title">主产乡镇种植面积分布（万亩）</div>
          <div id="town-chart" class="chart-box tall"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.stat-row { margin-bottom: 16px; }
.card-pad { padding: 18px 20px; }
.card-label { font-size: 14px; color: #8a7f6a; margin-bottom: 8px; }
.card-value { font-size: 26px; font-weight: 700; color: #2e3d33; line-height: 1.1; }
.card-unit { font-size: 15px; font-weight: 400; color: #8a8578; margin-left: 4px; }
.card-trend { font-size: 13px; color: #d4a94e; margin-top: 8px; }
.chart-row { margin-bottom: 16px; }
.chart-card { padding: 18px 20px; }
.chart-title { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 12px; }
.chart-box {
  width: 100%;
  height: 340px;
}
.chart-box.tall {
  height: 360px;
}

@media (min-width: 1200px) {
  .chart-box { height: 400px; }
  .chart-box.tall { height: 420px; }
}

@media (max-width: 640px) {
  .chart-box { height: 260px; }
  .chart-box.tall { height: 280px; }
  .card-value { font-size: 28px; }
}
</style>
