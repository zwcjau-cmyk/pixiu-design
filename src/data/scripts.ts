import { API_BASE, getUserId } from '../config'

export type ScriptStatus = 'available' | 'active' | 'completed'

export interface ScriptSummary {
  id: string
  name: string
  theme?: string
  icon: string
  desc: string
  accent: string
  progress?: number
  status?: ScriptStatus
  customPrompt?: string
  roleDescription?: string
  bgColor?: string
  borderColor?: string
}

export interface SelectedScript {
  id: string
  name: string
  resume?: boolean
  progress?: number
  customPrompt?: string
  roleDescription?: string
}

export const PRESET_SCRIPTS: ScriptSummary[] = [
  {
    id: 'super_star_01',
    name: '顶流诞生：大明星爽文图鉴',
    theme: '娱乐圈逆袭',
    icon: '⭐',
    desc: '从素人到顶流，你的每一分储蓄都是星途投资！',
    accent: '#F59E0B',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    id: 'boy_band_02',
    name: '重生之嫁给男团队长',
    theme: '甜宠养成',
    icon: '💕',
    desc: '和霸总队长一起攒婚礼基金，甜到上头！',
    accent: '#EC4899',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
  },
  {
    id: 'actress_03',
    name: '女明星的逆袭：从校园到戛纳',
    theme: '演艺成长',
    icon: '🎬',
    desc: '从校园走到戛纳红毯，每一笔存款都是你的代表作。',
    accent: '#8B5CF6',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'immortal_04',
    name: '修仙问道：灵石传说',
    theme: '仙侠修真',
    icon: '🏔️',
    desc: '以灵石为媒，把现实存款炼成修仙进度。',
    accent: '#14B8A6',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  {
    id: 'graduation_buffer_05',
    name: '毕业前的安全垫',
    theme: '求职过渡',
    icon: '🎓',
    desc: '为求职、搬家和毕业过渡期攒下一份选择权。',
    accent: '#10B981',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  {
    id: 'skill_upgrade_06',
    name: '技能升级实验室',
    theme: '自我提升',
    icon: '🧪',
    desc: '把课程、考试和学习工具放进一份可执行预算。',
    accent: '#3B82F6',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
]

const CUSTOM_SCRIPTS_KEY = 'pixiu_custom_scripts_v1'

function getStoredCustomScripts(): ScriptSummary[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(CUSTOM_SCRIPTS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveStoredCustomScripts(scripts: ScriptSummary[]) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(CUSTOM_SCRIPTS_KEY, JSON.stringify(scripts))
}

export function createCustomScript(input: {
  idealScript: string
  roleDescription: string
  extra?: string
}): ScriptSummary {
  const titleSeed = input.idealScript.replace(/\s+/g, '').slice(0, 10)
  const script: ScriptSummary = {
    id: `custom_${Date.now()}`,
    name: titleSeed ? `${titleSeed}剧本` : '我的自定义剧本',
    theme: '自定义',
    icon: '✦',
    desc: input.roleDescription,
    accent: '#C17A50',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    status: 'available',
    customPrompt: [
      `理想剧本：${input.idealScript}`,
      `我的角色：${input.roleDescription}`,
      input.extra ? `补充设定：${input.extra}` : '',
    ].filter(Boolean).join('\n'),
    roleDescription: input.roleDescription,
  }
  saveStoredCustomScripts([script, ...getStoredCustomScripts()])
  return script
}

interface AvailableScript {
  script_id: string
  script_name: string
  theme?: string
  total_plots?: number
}

export async function fetchAvailableScripts(): Promise<ScriptSummary[]> {
  const customScripts = getStoredCustomScripts()
  try {
    const res = await fetch(`${API_BASE}/api/script/available`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: { scripts?: AvailableScript[] } = await res.json()
    if (!data.scripts?.length) return [...customScripts, ...PRESET_SCRIPTS]
    const remoteScripts = data.scripts.map((script) => {
      const fallback = PRESET_SCRIPTS.find((item) => item.id === script.script_id)
      return {
        id: script.script_id,
        name: script.script_name,
        theme: script.theme,
        icon: fallback?.icon ?? '📖',
        desc: fallback?.desc ?? `${script.theme ?? '剧本'} · 共 ${script.total_plots ?? 0} 个章节`,
        accent: fallback?.accent ?? '#8B5E3C',
        bgColor: fallback?.bgColor ?? 'bg-amber-50',
        borderColor: fallback?.borderColor ?? 'border-amber-200',
      }
    })
    return [...customScripts, ...remoteScripts]
  } catch {
    return [...customScripts, ...PRESET_SCRIPTS]
  }
}

interface ScriptProgress {
  active_script_id?: string | null
  script_name?: string | null
  progress_percent?: number
}

export async function fetchActiveScript(): Promise<{ id: string; name: string; progress: number } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/script/progress/${encodeURIComponent(getUserId())}`)
    if (!res.ok) return null
    const data: ScriptProgress = await res.json()
    if (!data.active_script_id || !data.script_name) return null
    return {
      id: data.active_script_id,
      name: data.script_name,
      progress: data.progress_percent ?? 0,
    }
  } catch {
    return null
  }
}
