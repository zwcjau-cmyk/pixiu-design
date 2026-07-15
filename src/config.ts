declare global {
  // Set by /pixiu-env.js in deployed environments.
  // Empty or missing value falls back to local/Railway defaults below.
  var __PIXIU_API_BASE__: string | undefined
}

const isLocalDevelopment = ['localhost', '127.0.0.1'].includes(globalThis.location?.hostname)
const runtimeApiBase = globalThis.__PIXIU_API_BASE__?.trim()

export const API_BASE = runtimeApiBase || (isLocalDevelopment
  ? 'http://localhost:8000'
  : 'https://web-production-f10bf.up.railway.app')

// 获取或生成用户唯一标识（持久化到 localStorage，每个浏览器唯一）
export function getUserId(): string {
  const key = 'pixiu_user_id_v2'
  let userId = localStorage.getItem(key)
  if (!userId) {
    userId = `user_${crypto.randomUUID().slice(0, 8)}`
    localStorage.setItem(key, userId)
  }
  return userId
}
