/**
 * 智能问答 API 封装
 * - chatWithAgnes: 调用 Agnes AI Chat API（OpenAI 兼容格式，agnes-2.0-flash），失败抛错
 * - chatWithLocalFaq: 本地 FAQ 关键词匹配兜底，永远可用
 * API Key 通过 Vite 环境变量注入（.env 文件，不提交到仓库）
 */
import axios from 'axios'

const API_KEY = import.meta.env.VITE_AGNES_API_KEY || ''
const API_URL = import.meta.env.VITE_AGNES_API_URL || 'https://api.agnes-ai.cn/v1/chat/completions'
const MODEL = import.meta.env.VITE_AGNES_MODEL || 'agnes-2.0-flash'

const SYSTEM_PROMPT =
  '你是一位专注巨鹿县金银花产业的农业专家，熟悉金银花种植、烘干加工、病虫害防治、市场行情与扶持政策。' +
  '请用简体中文回答，语言通俗易懂，面向种植户。回答尽量结构化（可用列表、编号），不要超过600字。' +
  '若问题与金银花/中药材/农业无关，礼貌说明你只擅长金银花产业问题。'

export async function chatWithAgnes(question) {
  if (!API_KEY) throw new Error('未配置 VITE_AGNES_API_KEY')

  const resp = await axios.post(
    API_URL,
    {
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: question }
      ],
      temperature: 0.6,
      max_tokens: 2048,
      stream: false
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + API_KEY
      },
      timeout: 60000
    }
  )

  const content = resp.data?.choices?.[0]?.message?.content
  if (!content) throw new Error('Agnes 返回内容为空')
  return content
}

/** 本地 FAQ 关键词匹配（离线兜底） */
export function chatWithLocalFaq(question, faqList) {
  const q = question.toLowerCase()
  let best = null
  let bestScore = 0
  for (const item of faqList) {
    const keywords = item.keywords || []
    let score = 0
    for (const kw of keywords) {
      if (q.includes(kw.toLowerCase())) score++
    }
    if (score > bestScore) {
      bestScore = score
      best = item
    }
  }
  if (best && bestScore > 0) {
    return best.answer + '\n\n>（本地知识库回答 · 已离线兜底）'
  }
  return (
    '抱歉，我暂时没有找到与「' + question + '」直接相关的知识条目。\n\n' +
    '你可以尝试问：\n' +
    '- 金银花怎么烘干？\n' +
    '- 金银花什么时候采收？\n' +
    '- 有哪些补贴政策？\n' +
    '- 白粉病怎么防治？\n\n' +
    '（当前为本地知识库模式；配置 Agnes API Key 后可使用 AI 自由问答）'
  )
}
