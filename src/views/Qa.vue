<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { nextTick } from 'vue'
import { marked } from 'marked'
import faqData from '../data/faq.json'
import { chatWithAgnes, chatWithLocalFaq } from '../utils/chatApi.js'
import { getStorage, setStorage } from '../utils/storage'

const STORAGE_KEY = 'qa_messages'
const faqList = faqData.faqs || []
const quickQuestions = faqList.map(f => f.question).slice(0, 4)

// 从 localStorage 恢复聊天记录
const messages = ref(getStorage(STORAGE_KEY, []))
const input = ref('')
const sending = ref(false)
const scrollRef = ref(null)

async function scrollToBottom() {
  await nextTick()
  if (scrollRef.value) scrollRef.value.scrollTop = scrollRef.value.scrollHeight
}

function pushMessage(role, content) {
  messages.value.push({ role, content })
  scrollToBottom()
}

async function send() {
  const text = input.value.trim()
  if (!text || sending.value) return
  input.value = ''
  pushMessage('user', text)
  sending.value = true
  pushMessage('assistant', '…')

  const last = messages.value[messages.value.length - 1]
  try {
    const reply = await chatWithAgnes(text)
    last.content = reply
  } catch (e) {
    // API 失败 → 本地 FAQ 兜底
    const fallback = chatWithLocalFaq(text, faqList)
    last.content = fallback
  }
  sending.value = false
  setStorage(STORAGE_KEY, messages.value)
  scrollToBottom()
}

function askQuick(q) {
  input.value = q
  send()
}

// 持久化消息列表（防抖）
let saveTimer = null
watch(messages, (val) => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    setStorage(STORAGE_KEY, val)
  }, 300)
}, { deep: true })
</script>

<template>
  <div class="page-wrap">
    <div class="page-title">智能问答</div>
    <div class="page-desc">金银花产业知识问答 · 由 Agnes 大模型驱动，API 不可用时自动切换本地知识库</div>

    <div class="stat-card chat-card">
      <div class="chat-toolbar">
        <span class="quick-label">快捷提问：</span>
        <el-tag
          v-for="q in quickQuestions"
          :key="q"
          class="quick-tag"
          effect="plain"
          @click="askQuick(q)"
        >{{ q }}</el-tag>
      </div>

      <div ref="scrollRef" class="chat-body">
        <el-empty
          v-if="messages.length === 0"
          description="您好！我是金银花产业智能助手，可以问我关于种植、烘干、价格、政策、病虫害防治等问题。"
        />
        <div v-for="(m, i) in messages" :key="i" :class="['msg', m.role]">
          <div class="msg-avatar">{{ m.role === 'user' ? '我' : 'AI' }}</div>
          <div class="msg-bubble">
            <div v-if="m.role === 'assistant' && m.content === '…'" class="typing">
              <span></span><span></span><span></span>
            </div>
            <div
              v-else-if="m.role === 'assistant'"
              class="md-body"
              v-html="marked.parse(m.content)"
            ></div>
            <div v-else class="md-body">{{ m.content }}</div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <el-input
          v-model="input"
          type="textarea"
          :rows="2"
          placeholder="输入问题，如：金银花采摘后如何烘干？"
          @keydown.enter.exact.prevent="send"
        />
        <el-button type="primary" :loading="sending" @click="send" class="send-btn">
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-card {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  /* 使用视口高度，留出 header + 页面标题区域 */
  height: calc(100vh - 200px);
  min-height: 420px;
  max-height: 820px;
}
.chat-toolbar { margin-bottom: 12px; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.quick-label { font-size: 14px; color: #666; }
.quick-tag { cursor: pointer; font-size: 13.5px; }
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 8px;
  background: #fafbfa;
  border-radius: 8px;
  border: 1px solid #eee;
  min-height: 0;
}
.msg { display: flex; gap: 12px; margin-bottom: 16px; }
.msg.user { flex-direction: row-reverse; }
.msg-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 600;
  flex-shrink: 0;
}
.msg.user .msg-avatar { background: #2c6b48; color: #fff; }
.msg.assistant .msg-avatar { background: #d4a94e; color: #fff; }
.msg-bubble {
  max-width: 78%;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 15px;
  line-height: 1.75;
}
.msg.user .msg-bubble { background: #2c6b48; color: #fff; border-radius: 10px 2px 10px 10px; }
.msg.assistant .msg-bubble { background: #fff; border: 1px solid #eee; border-radius: 2px 10px 10px 10px; }
.chat-input { display: flex; gap: 10px; margin-top: 14px; align-items: flex-end; }
.send-btn { height: 58px; width: 96px; background: #2c6b48; border-color: #2c6b48; font-size: 15px; }
.typing span {
  display: inline-block; width: 7px; height: 7px;
  border-radius: 50%; background: #999;
  margin-right: 4px;
  animation: blink 1.2s infinite;
}
.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }

@media (max-width: 640px) {
  .chat-card { height: calc(100vh - 180px); min-height: 340px; }
}
</style>
