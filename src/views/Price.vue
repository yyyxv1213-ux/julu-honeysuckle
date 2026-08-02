<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import regression from 'regression'
import axios from 'axios'
import priceData from '../data/prices.json'
import { getStorage, setStorage } from '../utils/storage'

const STORAGE_RANGE = 'price_range'
const range = ref(getStorage(STORAGE_RANGE, '12')) // 查看最近 N 个月

const chartEl = ref(null)
let chart = null

/* ---- 天气：open-meteo 免费 API（无需 key）+ Agnes AI 解读 ---- */
const weather = ref(null)
const weatherLoading = ref(false)
const weatherAdvice = ref('')
const adviceLoading = ref(false)

const AGNES_KEY = import.meta.env.VITE_AGNES_API_KEY || ''
const AGNES_URL = import.meta.env.VITE_AGNES_API_URL || 'https://api.agnes-ai.cn/v1/chat/completions'
const AGNES_MODEL = import.meta.env.VITE_AGNES_MODEL || 'agnes-2.0-flash'
// 巨鹿县坐标
const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=37.22&longitude=115.04' +
  '&current=temperature_2m,relative_humidity_2m,precipitation,weather_code' +
  '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
  '&timezone=Asia%2FShanghai&forecast_days=3'

const WMO_TEXT = {
  0: '晴', 1: '大致晴朗', 2: '局部多云', 3: '阴',
  45: '雾', 48: '雾凇', 51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨',
  61: '小雨', 63: '中雨', 65: '大雨', 71: '小雪', 73: '中雪', 75: '大雪',
  80: '小阵雨', 81: '中阵雨', 82: '强阵雨', 95: '雷雨', 96: '雷雨伴冰雹'
}

async function loadWeather() {
  weatherLoading.value = true
  try {
    const resp = await axios.get(WEATHER_URL, { timeout: 15000 })
    const d = resp.data
    const today = d.daily.time[0]
    weather.value = {
      temp: Math.round(d.current.temperature_2m),
      humidity: Math.round(d.current.relative_humidity_2m),
      precip: d.current.precipitation,
      codeText: WMO_TEXT[d.current.weather_code] || '未知',
      todayMax: Math.round(d.daily.temperature_2m_max[0]),
      todayMin: Math.round(d.daily.temperature_2m_min[0]),
      rainProb: d.daily.precipitation_probability_max[0],
      days: d.daily.time.map((t, i) => ({
        date: t.slice(5),
        max: Math.round(d.daily.temperature_2m_max[i]),
        min: Math.round(d.daily.temperature_2m_min[i]),
        rain: d.daily.precipitation_probability_max[i]
      }))
    }
  } catch (e) {
    weather.value = null
  }
  weatherLoading.value = false
}

async function askWeatherAdvice() {
  if (!weather.value || !AGNES_KEY) return
  adviceLoading.value = true
  weatherAdvice.value = ''
  try {
    const w = weather.value
    const prompt =
      '你是巨鹿县金银花种植气象顾问。当前天气：气温' + w.temp + '℃，湿度' + w.humidity +
      '%，天气' + w.codeText + '，今日' + w.todayMin + '~' + w.todayMax + '℃，降水概率' +
      w.rainProb + '%。未来三天：' + w.days.map(d => d.date + ' ' + d.min + '~' + d.max + '℃ 降水' + d.rain + '%').join('；') +
      '。请用简洁的要点给出：1) 当前天气对金银花田间管理（采摘/晾晒/防病）的影响；2) 未来三天农事建议。不超过200字。'
    const resp = await axios.post(
      AGNES_URL,
      {
        model: AGNES_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.4,
        stream: false
      },
      {
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + AGNES_KEY },
        timeout: 60000
      }
    )
    weatherAdvice.value = resp.data?.choices?.[0]?.message?.content || '（AI 未返回内容）'
  } catch (e) {
    weatherAdvice.value = '（AI 解读失败，可稍后重试）'
  }
  adviceLoading.value = false
}

const months = priceData.months
const prices = priceData.price

// 最近 N 个月的数据
const visibleData = computed(() => {
  const n = parseInt(range.value)
  const start = Math.max(0, months.length - n) // n 超长（如"全部"999）时从 0 开始
  return months.slice(start).map((m, i) => ({ month: m, price: prices[start + i] }))
})

// 回归预测：基于全部历史做线性回归，预测下 3 个月
const prediction = computed(() => {
  const data = months.map((m, i) => [i, prices[i]])
  const result = regression.linear(data)
  const lastIdx = months.length
  return [1, 2, 3].map(k => {
    const y = result.predict(lastIdx + k)[1]
    return { month: nextMonth(months[months.length - 1], k), price: Math.round(y * 10) / 10 }
  })
})

function nextMonth(lastMonth, k) {
  const [y, m] = lastMonth.split('-').map(Number)
  const total = y * 12 + (m - 1) + k
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  return ny + '-' + String(nm).padStart(2, '0')
}

function render() {
  if (!chartEl.value) return
  if (!chart) chart = echarts.init(chartEl.value)
  const v = visibleData.value
  const pred = prediction.value
  const allMonths = [...v.map(d => d.month), ...pred.map(p => p.month)]
  const allPrices = [...v.map(d => d.price), ...pred.map(p => p.price)]
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['历史价格', '预测价格'],
      top: 8,
      textStyle: { fontSize: 13 }
    },
    grid: { left: 55, right: 35, top: 50, bottom: 45 },
    xAxis: {
      type: 'category',
      data: allMonths,
      axisLabel: { rotate: 40, fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      name: '元/公斤',
      nameTextStyle: { fontSize: 13 },
      axisLabel: { fontSize: 12 }
    },
    series: [
      {
        name: '历史价格',
        type: 'line',
        data: [...v.map(d => d.price), ...pred.map(() => null)],
        smooth: true,
        itemStyle: { color: '#2c6b48' },
        lineStyle: { width: 2.5 },
        areaStyle: { color: 'rgba(44,107,72,0.08)' }
      },
      {
        name: '预测价格',
        type: 'line',
        data: [...v.map(() => null), ...pred.map(p => p.price)],
        smooth: true,
        lineStyle: { type: 'dashed', width: 2.5, color: '#d4a94e' },
        itemStyle: { color: '#d4a94e' }
      }
    ]
  })
}

function resizeChart() {
  chart?.resize()
}

onMounted(() => {
  render()
  loadWeather()
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
})

// 持久化时间范围选择
watch(range, (val) => {
  setStorage(STORAGE_RANGE, val)
}, { immediate: true })
</script>

<template>
  <div class="page-wrap">
    <div class="page-title">价格分析与预测</div>
    <div class="page-desc">历史价格基于公开行情模拟 · 预测采用线性回归（前端计算，仅供参考）</div>

    <el-row :gutter="16">
      <el-col :xs="24" :md="16">
        <div class="stat-card chart-card">
          <div class="chart-head">
            <span class="chart-title">金银花干花价格走势（元/公斤）</span>
            <el-radio-group v-model="range" size="small" @change="render">
              <el-radio-button :value="'6'">近6月</el-radio-button>
              <el-radio-button :value="'12'">近12月</el-radio-button>
              <el-radio-button :value="'24'">近24月</el-radio-button>
              <el-radio-button :value="'999'">全部</el-radio-button>
            </el-radio-group>
          </div>
          <div ref="chartEl" class="chart-box"></div>
        </div>
      </el-col>
      <el-col :xs="24" :md="8">
        <div class="stat-card predict-card">
          <div class="chart-title">未来三月价格预测</div>
          <div class="predict-badge">趋势预测</div>
          <div class="predict-item" v-for="p in prediction" :key="p.month">
            <span class="predict-month">{{ p.month }}</span>
            <span class="predict-price">{{ p.price }} 元/公斤</span>
          </div>
          <el-divider />
          <div class="predict-note">
            预测基于历史行情趋势线性外推，未考虑天气、政策、市场供需突变，实际成交请以市场为准。
          </div>
        </div>

        <!-- 天气面板：open-meteo 实时数据 + Agnes AI 解读 -->
        <div class="stat-card weather-card">
          <div class="chart-title">巨鹿天气 · 金银花农事参考</div>
          <div v-if="weatherLoading" class="weather-loading">天气加载中…</div>
          <div v-else-if="weather" class="weather-body">
            <div class="weather-now">
              <span class="weather-temp">{{ weather.temp }}°C</span>
              <span class="weather-code">{{ weather.codeText }}</span>
              <span class="weather-meta">湿度 {{ weather.humidity }}% · 降水 {{ weather.precip }}mm</span>
              <span class="weather-meta">今日 {{ weather.todayMin }}~{{ weather.todayMax }}℃ · 降水概率 {{ weather.rainProb }}%</span>
            </div>
            <div class="weather-days">
              <div class="weather-day" v-for="d in weather.days" :key="d.date">
                <span class="wd-date">{{ d.date }}</span>
                <span class="wd-temp">{{ d.min }}~{{ d.max }}℃</span>
                <span class="wd-rain">降水 {{ d.rain }}%</span>
              </div>
            </div>
            <el-button
              type="primary"
              size="small"
              :loading="adviceLoading"
              :disabled="!AGNES_KEY"
              @click="askWeatherAdvice"
              class="weather-advice-btn"
            >
              AI 解读天气与农事
            </el-button>
            <div v-if="adviceLoading" class="weather-advice loading">AI 分析中…</div>
            <div v-else-if="weatherAdvice" class="weather-advice">{{ weatherAdvice }}</div>
            <div v-if="!AGNES_KEY" class="weather-note">配置 VITE_AGNES_API_KEY 后可启用 AI 农事解读</div>
          </div>
          <div v-else class="weather-loading">天气数据加载失败（open-meteo 服务不可用）</div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.chart-card { padding: 16px 20px; }
.chart-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
.chart-title { font-size: 16px; font-weight: 600; color: #333; }
.chart-box {
  width: 100%;
  height: 420px;
}
.predict-card { padding: 20px 22px; }
.predict-badge {
  display: inline-block;
  font-size: 12.5px;
  color: #d4a94e;
  border: 1px solid #d4a94e;
  border-radius: 999px;
  padding: 2px 12px;
  margin: 6px 0 14px;
}
.predict-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 0;
  border-bottom: 1px dashed #eee;
}
.predict-month { font-size: 14.5px; color: #666; }
.predict-price { font-size: 18px; font-weight: 700; color: #1f4d35; }
.predict-note { font-size: 12.5px; color: #999; line-height: 1.7; }
.weather-card { padding: 20px 22px; margin-top: 16px; }
.weather-loading { font-size: 13.5px; color: #999; padding: 12px 0; }
.weather-now { display: flex; flex-direction: column; gap: 4px; padding: 6px 0 10px; }
.weather-temp { font-size: 36px; font-weight: 700; color: #1f4d35; line-height: 1.1; }
.weather-code { font-size: 16px; color: #d4a94e; font-weight: 600; }
.weather-meta { font-size: 13px; color: #666; }
.weather-days { display: flex; gap: 8px; margin: 10px 0 12px; flex-wrap: wrap; }
.weather-day {
  flex: 1;
  min-width: 95px;
  background: #f7f9f7;
  border-radius: 8px;
  padding: 10px 12px;
  text-align: center;
  font-size: 13px;
  color: #555;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.wd-date { font-weight: 600; }
.wd-rain { color: #2c6b48; }
.weather-advice-btn {
  margin: 2px 0 10px;
  background: #2c6b48;
  border-color: #2c6b48;
}
.weather-advice {
  font-size: 13.5px;
  line-height: 1.85;
  color: #333;
  background: #faf6ec;
  border-radius: 8px;
  padding: 11px 14px;
  white-space: pre-wrap;
}
.weather-advice.loading { color: #999; }
.weather-note { font-size: 12.5px; color: #999; margin-top: 6px; }

@media (min-width: 1200px) {
  .chart-box { height: 480px; }
}

@media (max-width: 640px) {
  .chart-box { height: 280px; }
  .weather-temp { font-size: 28px; }
}
</style>
