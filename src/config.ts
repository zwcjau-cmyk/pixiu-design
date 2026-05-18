// API 基础路径：生产环境直接调后端，开发环境走 Vite 代理
export const API_BASE = import.meta.env.VITE_API_BASE || ''

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
