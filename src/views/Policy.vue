<script setup>
import { ref, computed, watch } from 'vue'
import policyData from '../data/policies.json'
import { getStorage, setStorage } from '../utils/storage'

const STORAGE_KEY = 'policy_active_tag'
const items = policyData.items

// 从 localStorage 恢复上次选择的标签
const activeTag = ref(getStorage(STORAGE_KEY, '全部'))

const tags = computed(() => ['全部', ...new Set(items.map(i => i.tag))])

// 按日期降序（最新在前）
const sortedItems = computed(() =>
  [...items].sort((a, b) => (a.date < b.date ? 1 : -1))
)

const filtered = computed(() =>
  activeTag.value === '全部'
    ? sortedItems.value
    : sortedItems.value.filter(i => i.tag === activeTag.value)
)

const levelColor = {
  省级: 'success',
  市级: 'primary',
  县级: 'warning',
  行业: 'info'
}

// 持久化当前筛选标签
watch(activeTag, (val) => {
  setStorage(STORAGE_KEY, val)
})
</script>

<template>
  <div class="page-wrap">
    <div class="page-title">政策与资讯</div>
    <div class="page-desc">河北省 / 邢台市 / 巨鹿县金银花产业扶持政策与行业动态（人工整理，链接为公开来源）</div>

    <div class="tag-bar">
      <el-radio-group v-model="activeTag">
        <el-radio-button
          v-for="t in tags"
          :key="t"
          :value="t"
        >{{ t }}</el-radio-button>
      </el-radio-group>
    </div>

    <el-timeline class="policy-timeline">
      <el-timeline-item
        v-for="(item, i) in filtered"
        :key="i"
        :timestamp="item.date"
        placement="top"
        :type="levelColor[item.level] || 'primary'"
      >
        <el-card shadow="hover" class="policy-card">
          <div class="policy-head">
            <span class="policy-title">{{ item.title }}</span>
            <div class="policy-tags">
              <el-tag size="small" :type="levelColor[item.level] || 'primary'">{{ item.level }}</el-tag>
              <el-tag size="small" type="info" effect="plain">{{ item.tag }}</el-tag>
            </div>
          </div>
          <div class="policy-summary">{{ item.summary }}</div>
          <a :href="item.url" class="policy-link" target="_blank" rel="noopener">
            阅读原文 <el-icon><Right /></el-icon>
          </a>
        </el-card>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-if="filtered.length === 0" description="该分类下暂无资讯" />
  </div>
</template>

<style scoped>
.tag-bar { margin-bottom: 22px; }
.policy-timeline { padding-left: 8px; }
.policy-card { font-size: 15px; }
.policy-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.policy-title { font-size: 16px; font-weight: 600; color: #1f4d35; }
.policy-tags { display: flex; gap: 6px; }
.policy-summary { color: #555; line-height: 1.85; font-size: 14.5px; }
.policy-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 10px;
  font-size: 14px;
  color: #2c6b48;
  text-decoration: none;
}
.policy-link:hover { color: #d4a94e; }
</style>
