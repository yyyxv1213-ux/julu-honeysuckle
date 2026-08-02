<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import pestsData from '../data/pests.json'
import { getStorage, setStorage } from '../utils/storage'

const pests = pestsData.pests
const keyword = ref('')
const uploading = ref(false)
const previewUrl = ref('')
const result = ref(null)

const STORAGE_KEY = 'pest_last_result'

const AGNES_KEY = import.meta.env.VITE_AGNES_API_KEY || ''
const AGNES_URL = import.meta.env.VITE_AGNES_API_URL || 'https://apihub.agnes-ai.com/v1/chat/completions'
const AGNES_MODEL = import.meta.env.VITE_AGNES_MODEL || 'agnes-2.0-flash'

// 挂载时恢复上次识别结果
onMounted(() => {
  const saved = getStorage(STORAGE_KEY, null)
  if (saved) {
    result.value = saved
    previewUrl.value = saved.previewUrl || ''
  }
})

// 前端压缩图片：最长边 800px + JPEG 质量 75，避免大图 base64 超长导致 API 超时
function compressImage(base64, maxSize = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('图片解析失败'))
    img.src = base64
  })
}

// Agnes 多模态识别：上传图片 → AI 识别病虫害 → 匹配图鉴给出防治建议
// 用 fetch（Agnes 网关对 XHR 偶发省略 CORS 头，fetch 更稳），失败自动重试一次
async function recognizeWithAgnes(base64) {
  if (!AGNES_KEY) throw new Error('未配置 VITE_AGNES_API_KEY')
  const body = {
    model: AGNES_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '你是金银花病虫害专家。请识别这张图片中金银花的病虫害，只输出 JSON，格式：{"name":"病虫害名称","type":"病害或虫害","symptom":"症状描述","confidence":"置信度百分比"}。若图片中的金银花健康正常、无病虫害迹象，输出{"name":"正常","type":"健康","symptom":"植株生长正常，叶片和花蕾健康，未发现病虫害迹象。","confidence":"置信度百分比"}。若图片中不是金银花而是其他内容（如人物、风景、其他植物等），输出{"name":"非金银花","type":"其他","symptom":"图片内容为【具体描述】而非金银花，请上传金银花叶片或花蕾的清晰照片。","confidence":"置信度百分比"}。若实在无法判断图片内容，输出{"name":"未知","type":"","symptom":"无法识别","confidence":"0"}。'
          },
          { type: 'image_url', image_url: { url: base64 } }
        ]
      }
    ],
    max_tokens: 8192,
    temperature: 0.3,
    stream: false
  }

  const call = async () => {
    const resp = await fetch(AGNES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + AGNES_KEY },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000)
    })
    if (!resp.ok) throw new Error('Agnes HTTP ' + resp.status)
    return resp.json()
  }

  let data
  try {
    data = await call()
  } catch (e) {
    // 网络/CORS 偶发失败 → 重试一次
    data = await call()
  }

  // 推理模型可能把 token 全消耗在 reasoning 上导致 content 为空 → 提高 token 重试一次
  let content = data?.choices?.[0]?.message?.content
  if (!content) {
    body.max_tokens = 16384
    data = await call()
    content = data?.choices?.[0]?.message?.content
  }
  if (!content) throw new Error('Agnes 返回内容为空')
  const m = content.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('Agnes 返回格式异常')
  return JSON.parse(m[0])
}

// 本地兜底识别：根据文件名/类型关键词匹配图鉴；API 不可用时使用
function localMatch(name) {
  const n = (name || '').toLowerCase()
  const hit = pests.find(p => n.includes(p.name) || p.name.includes(n.slice(0, 2)))
  return hit || null
}

function handleFile(file) {
  const isImg = /\.(jpg|jpeg|png|webp)$/i.test(file.name)
  if (!isImg) {
    ElMessage.warning('请上传 jpg/png/webp 图片')
    return false
  }
  if (file.size > 4 * 1024 * 1024) {
    ElMessage.warning('图片不能超过 4MB')
    return false
  }
  return true
}

function onUpload(raw) {
  const file = raw.raw || raw.file || raw
  if (!handleFile(file)) return
  // 清空上一轮识别结果，避免新照片识别期间显示旧结果
  result.value = null
  setStorage(STORAGE_KEY, null)
  uploading.value = true
  const reader = new FileReader()
  reader.onload = async e => {
    const base64 = e.target.result
    previewUrl.value = base64
    try {
      // 压缩图片（最长边 800px / JPEG 75），避免大图导致 API 超时
      const compressed = await compressImage(base64)
      // 优先 Agnes 多模态识别
      const ai = await recognizeWithAgnes(compressed)
      const hit = pests.find(p => p.name === ai.name) || localMatch(ai.name)
      result.value = {
        name: ai.name || '未知',
        confidence: ai.confidence || '—',
        type: ai.type || '—',
        symptom: hit ? hit.symptom : (ai.symptom || '暂无症状描述。'),
        prevention: hit ? hit.prevention : '请在下方图鉴中搜索相近症状获取防治建议。',
        from: '在线识别',
        previewUrl: compressed // 保存压缩后图片，供下次进入页面恢复预览
      }
      setStorage(STORAGE_KEY, result.value)
    } catch (err) {
      // API 失败 → 本地图鉴兜底
      const match = localMatch(file.name)
      if (match) {
        result.value = {
          name: match.name,
          confidence: '约 85%',
          type: match.type,
          symptom: match.symptom,
          prevention: match.prevention,
          from: '本地图鉴匹配（在线识别暂不可用）',
          previewUrl: ''
        }
      } else {
        result.value = {
          name: '暂未识别',
          confidence: '—',
          type: '—',
        symptom: '未能识别图片内容，也未匹配到本地图鉴条目。',
        prevention: '请在图鉴中搜索相近症状，或稍后重试。',
          from: '本地兜底',
          previewUrl: ''
        }
      }
      setStorage(STORAGE_KEY, result.value)
    }
    uploading.value = false
  }
  reader.readAsDataURL(file)
  return false
}

const filtered = computed(() => {
  const k = keyword.value.trim()
  if (!k) return pests
  return pests.filter(p =>
    p.name.includes(k) || p.symptom.includes(k) || p.prevention.includes(k)
  )
})

onUnmounted(() => {
  // 清除持久化结果（页面卸载时）
  // 不移除，保留上次识别结果便于用户查看
})
</script>

<template>
  <div class="page-wrap">
    <div class="page-title">病虫害识别助手</div>
    <div class="page-desc">上传金银花叶片/花蕾图片，自动识别病虫害（无法识别时自动匹配本地图鉴）</div>

    <el-row :gutter="16">
      <el-col :xs="24" :md="10">
        <div class="stat-card upload-card">
          <div class="chart-title">图片上传识别</div>
          <el-upload
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept=".jpg,.jpeg,.png,.webp"
            :on-change="onUpload"
          >
            <div v-if="!previewUrl" class="upload-hint">
              <el-icon :size="42" color="#d4a94e"><UploadFilled /></el-icon>
              <div class="upload-text">拖拽图片到此处，或点击上传</div>
              <div class="upload-sub">支持 jpg/png/webp，≤4MB</div>
            </div>
            <img v-else :src="previewUrl" class="preview-img" />
          </el-upload>
          <div v-if="uploading" class="uploading">
            <el-icon class="is-loading" :size="22"><Loading /></el-icon>
            <div class="uploading-title">正在识别中…</div>
            <div class="uploading-tip">识别通常需要 15~60 秒，请耐心等待，勿重复上传</div>
          </div>

          <div v-if="result && result.name === '正常'" class="result-box healthy-box">
            <div class="healthy-icon"><el-icon :size="38"><CircleCheckFilled /></el-icon></div>
            <div class="healthy-title">金银花生长正常</div>
            <div class="healthy-desc">{{ result.symptom || '植株生长正常，未发现病虫害迹象。' }}</div>
            <div class="result-from">{{ result.from }} · 置信度 {{ result.confidence }}</div>
          </div>

          <div v-else-if="result && result.name === '非金银花'" class="result-box not-flower-box">
            <div class="not-flower-icon"><el-icon :size="38"><WarningFilled /></el-icon></div>
            <div class="not-flower-title">这不是金银花</div>
            <div class="not-flower-desc">{{ result.symptom || '请上传金银花叶片或花蕾的清晰照片。' }}</div>
            <div class="result-from">{{ result.from }} · 置信度 {{ result.confidence }}</div>
          </div>

          <div v-else-if="result" class="result-box">
            <div class="result-name">{{ result.name }}
              <span class="result-conf">{{ result.confidence }}</span>
            </div>
            <div class="result-from">{{ result.from }}</div>
            <el-descriptions :column="1" border size="small" class="result-desc">
              <el-descriptions-item label="类型">{{ result.type }}</el-descriptions-item>
              <el-descriptions-item label="症状">{{ result.symptom }}</el-descriptions-item>
              <el-descriptions-item label="防治建议">{{ result.prevention }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :md="14">
        <div class="stat-card gallery-card">
          <div class="gallery-head">
            <span class="chart-title">常见病虫害图鉴（{{ filtered.length }} 种）</span>
            <el-input
              v-model="keyword"
              placeholder="搜索病虫害名称或症状"
              clearable
              style="width: 220px"
              size="small"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </div>
          <el-empty v-if="filtered.length === 0" description="未找到匹配的病虫害" />
          <div v-else class="pest-grid">
            <el-card v-for="p in filtered" :key="p.name" shadow="hover" class="pest-card">
              <template #header>
                <div class="pest-head">
                  <span class="pest-name">{{ p.name }}</span>
                  <el-tag :type="p.type === '病害' ? 'danger' : 'warning'" size="small">
                    {{ p.type }}
                  </el-tag>
                  <span class="pest-season">{{ p.season }}</span>
                </div>
              </template>
              <div class="pest-symptom"><b>症状：</b>{{ p.symptom }}</div>
              <div class="pest-prevention"><b>防治：</b>{{ p.prevention }}</div>
            </el-card>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.upload-card, .gallery-card { padding: 18px 20px; }
.chart-title { font-size: 16px; font-weight: 600; color: #333; display: inline-block; }
.upload-hint { padding: 36px 0; text-align: center; }
.upload-text { margin-top: 14px; font-size: 15px; color: #666; }
.upload-sub { font-size: 13px; color: #999; margin-top: 6px; }
.preview-img { max-width: 100%; max-height: 280px; border-radius: 8px; display: block; margin: 0 auto; }
.uploading {
  text-align: center;
  color: #1f4d35;
  font-size: 14px;
  margin-top: 14px;
  padding: 14px;
  background: #f2f7f2;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.uploading-title { font-weight: 600; font-size: 14px; }
.uploading-tip { font-size: 12.5px; color: #8a8578; }
.result-box { margin-top: 16px; border-top: 1px solid #eee; padding-top: 14px; }
.healthy-box {
  border-top: none;
  background: linear-gradient(160deg, #eef7ee, #f8fdf8);
  border: 1px solid #cfe8cf;
  border-radius: 10px;
  padding: 22px 18px;
  text-align: center;
}
.healthy-icon { color: #2c6b48; }
.healthy-title { font-size: 20px; font-weight: 700; color: #2c6b48; margin-top: 8px; }
.healthy-desc { font-size: 14px; color: #555; margin-top: 8px; line-height: 1.8; }
.not-flower-box {
  border-top: none;
  background: linear-gradient(160deg, #fdf6ec, #fffaf2);
  border: 1px solid #e8d5b0;
  border-radius: 10px;
  padding: 22px 18px;
  text-align: center;
}
.not-flower-icon { color: #d4a94e; }
.not-flower-title { font-size: 20px; font-weight: 700; color: #b8860b; margin-top: 8px; }
.not-flower-desc { font-size: 14px; color: #555; margin-top: 8px; line-height: 1.8; }
.result-name { font-size: 20px; font-weight: 700; color: #1f4d35; }
.result-conf { font-size: 14px; color: #d4a94e; margin-left: 8px; font-weight: 400; }
.result-from { font-size: 12.5px; color: #999; margin: 4px 0 10px; }
.result-desc { margin-top: 4px; }
.gallery-card { min-height: 540px; }
.gallery-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px; }
.pest-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.pest-card { font-size: 14px; }
.pest-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pest-name { font-size: 16px; font-weight: 700; color: #1f4d35; }
.pest-season { font-size: 12.5px; color: #999; margin-left: auto; }
.pest-symptom, .pest-prevention { line-height: 1.8; color: #555; margin-bottom: 6px; }

@media (max-width: 640px) {
  .pest-grid { grid-template-columns: 1fr; }
}
</style>
