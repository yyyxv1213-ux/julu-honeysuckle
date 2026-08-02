<script setup>
import { ref, computed, watch } from 'vue'
import { getStorage, setStorage } from '../utils/storage'

/* ===== 持久化 key ===== */
const STORAGE_KEYS = {
  freshWeight: 'tool_fresh_weight',
  variety: 'tool_variety',
  area: 'tool_area',
  yieldPerMu: 'tool_yield_per_mu',
  price: 'tool_price',
  costPerMu: 'tool_cost_per_mu'
}

/* ===== 烘干参数计算器 ===== */
const freshWeight = ref(getStorage(STORAGE_KEYS.freshWeight, 100))
const variety = ref(getStorage(STORAGE_KEYS.variety, '巨花一号'))
const dryRatio = computed(() => {
  // 常见烘干折干率：巨花一号约 4.5:1，四季花约 5:1
  return variety.value === '巨花一号' ? 4.5 : 5.0
})
const dryWeight = computed(() => Math.round((freshWeight.value / dryRatio.value) * 10) / 10)

const dryTemp = computed(() => {
  // 经验公式：先低温排湿后高温定色
  return '前期 38–42℃（排湿 4–6h）→ 中期 50–55℃（定色）→ 后期 60–65℃（提香）'
})
const dryTime = computed(() => {
  const w = freshWeight.value
  if (w <= 50) return '约 16–20 小时'
  if (w <= 200) return '约 22–28 小时'
  return '约 30–36 小时（建议分批）'
})

/* ===== 收益计算器 ===== */
const area = ref(getStorage(STORAGE_KEYS.area, 5))
const yieldPerMu = ref(getStorage(STORAGE_KEYS.yieldPerMu, 120))
const price = ref(getStorage(STORAGE_KEYS.price, 148))
const costPerMu = ref(getStorage(STORAGE_KEYS.costPerMu, 3200))
const income = computed(() => Math.round(area.value * yieldPerMu.value * price.value))
const cost = computed(() => Math.round(area.value * costPerMu.value))
const profit = computed(() => income.value - cost.value)

/* ===== 持久化：输入变更时写入 localStorage ===== */
watch(freshWeight, v => setStorage(STORAGE_KEYS.freshWeight, v))
watch(variety, v => setStorage(STORAGE_KEYS.variety, v))
watch(area, v => setStorage(STORAGE_KEYS.area, v))
watch(yieldPerMu, v => setStorage(STORAGE_KEYS.yieldPerMu, v))
watch(price, v => setStorage(STORAGE_KEYS.price, v))
watch(costPerMu, v => setStorage(STORAGE_KEYS.costPerMu, v))
</script>

<template>
  <div class="page-wrap">
    <div class="page-title">农户实用工具</div>
    <div class="page-desc">烘干参数参考与收益估算 · 基于经验公式（仅供参考，实际以当地农技指导为准）</div>

    <el-row :gutter="16">
      <!-- 烘干计算器 -->
      <el-col :xs="24" :md="12">
        <div class="stat-card tool-card">
          <div class="chart-title">🌡️ 烘干参数参考</div>
          <el-form label-width="110px" class="tool-form">
            <el-form-item label="鲜货重量 (kg)">
              <el-input-number v-model="freshWeight" :min="1" :max="2000" :step="10" />
            </el-form-item>
            <el-form-item label="品种">
              <el-select v-model="variety">
                <el-option label="巨花一号（折干 4.5:1）" value="巨花一号" />
                <el-option label="四季金银花（折干 5:1）" value="四季金银花" />
              </el-select>
            </el-form-item>
          </el-form>

          <el-divider />

          <div class="result-grid">
            <div class="result-item">
              <div class="result-label">预计干货重量</div>
              <div class="result-value">{{ dryWeight }} <span class="result-unit">kg</span></div>
            </div>
            <div class="result-item">
              <div class="result-label">建议烘干时长</div>
              <div class="result-value small">{{ dryTime }}</div>
            </div>
          </div>
          <div class="result-tip">💡 {{ dryTemp }}</div>
        </div>
      </el-col>

      <!-- 收益计算器 -->
      <el-col :xs="24" :md="12">
        <div class="stat-card tool-card">
          <div class="chart-title">💰 收益估算</div>
          <el-form label-width="110px" class="tool-form">
            <el-form-item label="种植面积 (亩)">
              <el-input-number v-model="area" :min="0.5" :max="500" :step="0.5" />
            </el-form-item>
            <el-form-item label="亩产干货 (kg)">
              <el-input-number v-model="yieldPerMu" :min="20" :max="300" :step="5" />
            </el-form-item>
            <el-form-item label="干花价格 (元/kg)">
              <el-input-number v-model="price" :min="30" :max="500" :step="1" />
            </el-form-item>
            <el-form-item label="亩均成本 (元)">
              <el-input-number v-model="costPerMu" :min="500" :max="10000" :step="100" />
            </el-form-item>
          </el-form>

          <el-divider />

          <div class="result-grid three">
            <div class="result-item">
              <div class="result-label">毛收入</div>
              <div class="result-value">{{ income.toLocaleString() }} <span class="result-unit">元</span></div>
            </div>
            <div class="result-item">
              <div class="result-label">总成本</div>
              <div class="result-value">{{ cost.toLocaleString() }} <span class="result-unit">元</span></div>
            </div>
            <div class="result-item">
              <div class="result-label">预计收益</div>
              <div class="result-value" :class="{ loss: profit < 0 }">
                {{ profit.toLocaleString() }} <span class="result-unit">元</span>
              </div>
            </div>
          </div>
          <div class="result-tip">
            💡 折合亩均收益约 {{ Math.round(profit / area).toLocaleString() }} 元
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.tool-card { padding: 20px 22px; }
.chart-title { font-size: 17px; font-weight: 600; color: #1f4d35; margin-bottom: 14px; }
.tool-form { margin-top: 4px; }
.result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.result-grid.three { grid-template-columns: repeat(3, 1fr); }
.result-item {
  background: #f7f9f7;
  border-radius: 8px;
  padding: 16px 18px;
  text-align: center;
}
.result-label { font-size: 13px; color: #8a8578; margin-bottom: 6px; }
.result-value { font-size: 28px; font-weight: 700; color: #2c6b48; }
.result-value.small { font-size: 16px; line-height: 1.6; padding-top: 6px; }
.result-value.loss { color: #d9534f; }
.result-unit { font-size: 14px; font-weight: 400; color: #8a8578; }
.result-tip {
  margin-top: 12px;
  font-size: 13.5px;
  color: #8a8578;
  background: #faf6ec;
  border-radius: 8px;
  padding: 11px 14px;
  line-height: 1.75;
}
@media (max-width: 640px) {
  .result-grid.three { grid-template-columns: 1fr; }
}
</style>
