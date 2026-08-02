/**
 * localStorage 持久化工具
 * 用法：
 *   import { getStorage, setStorage } from './storage'
 *   setStorage('qa_messages', messages.value)
 *   const saved = getStorage('qa_messages', [])
 */

const PREFIX = 'julu_honeysuckle_'

/**
 * 读取持久化数据
 * @param {string} key
 * @param {*} defaultValue 缺失时的默认值
 */
export function getStorage(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return defaultValue
    return JSON.parse(raw)
  } catch {
    return defaultValue
  }
}

/**
 * 写入持久化数据（自动 JSON.stringify）
 * @param {string} key
 * @param {*} value
 */
export function setStorage(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // localStorage 已满时静默忽略
  }
}

/**
 * 清除指定 key
 */
export function removeStorage(key) {
  localStorage.removeItem(PREFIX + key)
}

/**
 * 清除全部持久化数据
 */
export function clearAll() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(PREFIX)) keys.push(k)
  }
  keys.forEach(k => localStorage.removeItem(k))
}
