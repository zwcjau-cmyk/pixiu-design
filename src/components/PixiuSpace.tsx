import { useState, useRef, useEffect, type ComponentPropsWithoutRef } from 'react'
import { Send, Sparkles, Loader2, Settings } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import ScriptMode from './ScriptMode'
import SettingsPanel from './SettingsPanel'
import { API_BASE, getUserId } from '../config'

interface Message {
  type: 'agent' | 'user'
  content: string
  time: string
}

const quickReplies = [
  {
    emoji: '💰',
    text: '省钱诊断',
    query: '请帮我做一次省钱诊断。请参考我近三个月的支出数据（大约最近90天），完成以下三件事：\n\n消费习惯总结：按类别（如餐饮、购物、出行、娱乐、订阅服务等）汇总我的消费分布，找出消费最高的几个领域，并对比各月趋势，看看整体消费是上升还是下降了。\n\n节省成效评估：根据我三个月的消费结构变化，判断我的支出是否在收敛、是否处于一个健康的支出状态。\n\n可削减建议：找出我可能存在的非必要支出或被动消耗（例如：频率偏高的冲动消费、可替代的高价选项、重复类型消费），给出2-3条具体可执行的省钱建议。',
  },
  {
    emoji: '📊',
    text: '预算规划',
    query: '请根据我近一个月（最近30天）的收支数据，帮我完成预算规划。先检查数据是否足够；如果记录少于7天或缺少收入数据，请明确说明局限并先给我补录建议，不要假装得出精确结论。\n\n请按以下步骤来：\n\n现状诊断：分析收入水平和支出结构，按类别汇总，计算储蓄率，并说明计算口径。\n\n预算制定/调整：根据我的实际情况推荐月度预算分配，不要机械套用50/30/20法则；对比实际执行，指出超支和结余。\n\n优先级建议：结合我的目标，给出下一阶段最值得调整的1-2个类别和可执行动作。',
  },
  {
    emoji: '📡',
    text: '理财播报',
    query: '请帮我做一次理财播报，重点关注资产状况和市场动态，不分析早餐等日常小额消费。\n\n第一部分：持仓概览。列出活期池、定期舱、基金图鉴的余额，严格区分资产变动、转入转出和投资收益。\n\n第二部分：市场信息。只使用能够确认来源和日期的信息；列出信息时间与来源。如果没有可靠的实时信息，请明确说不知道，不要编造行情。\n\n第三部分：风险教育。结合流动性、投资期限和波动风险解释当前结构可能受到的影响。不要直接替我作出买卖决定，也不要推荐具体产品；如果需要个性化判断，先询问我的风险承受能力、资金用途和计划持有期限。',
  },
]

function getTimeStr() {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

// 刷新页面一律显示初始问候（不区分新老用户）
function getGreeting(): string {
  return `叮咚——我是貔貅学长，你的大学生理财搭子。\n\n我可以帮你记账、看懂支出、规划预算，也会提醒你区分“资产变动”和“投资收益”。建议只供学习和决策参考，最后怎么安排资金由你决定。\n\n今天想先做哪件事：记一笔账、看看预算，还是聊聊你的储蓄目标？`
}

interface PixiuSpaceProps {
  isActive?: boolean
  pendingMessage?: string | null
  onMessageConsumed?: () => void
}

export default function PixiuSpace({ isActive, pendingMessage, onMessageConsumed }: PixiuSpaceProps) {
  const [inScriptMode, setInScriptMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'agent',
      content: getGreeting(),
      time: getTimeStr(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasBeenActiveRef = useRef(true) // 初始就在貔貅空间，不需要问候
  const wasActiveRef = useRef(isActive)
  const lastGreetingTimeRef = useRef<number>(0) // 上次问候的时间戳
  const hasUserSentMessageRef = useRef(false) // 自上次问候后用户是否发过消息

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 从其他 tab 切回来时，追加一句普通问候（带冷却和状态判断）
  useEffect(() => {
    const prevActive = wasActiveRef.current
    wasActiveRef.current = isActive
    // 之前不在当前 tab，现在切回来了，且不是首次挂载
    if (isActive && !prevActive && hasBeenActiveRef.current) {
      const now = Date.now()
      const cooldown = 10 * 60 * 1000 // 10 分钟冷却
      const withinCooldown = now - lastGreetingTimeRef.current < cooldown
      // 条件：不在加载中（正在回复）、冷却期内已问候过且用户没发新消息则跳过
      if (loading) {
        // 正在回复用户问题，不打断
      } else if (withinCooldown && !hasUserSentMessageRef.current) {
        // 10分钟内已问候过，且用户期间没发消息，不重复问候
      } else {
        const returnGreetings = [
          '回来啦～有什么需要学长帮忙的吗？',
          '嗯？又回来找学长了？说吧，啥事～',
          '哟，想学长了？说说看今天想聊什么 ✨',
          '学长一直在～有什么我能帮到你的？',
        ]
        const greeting = returnGreetings[Math.floor(Math.random() * returnGreetings.length)]
        setMessages(prev => [...prev, { type: 'agent', content: greeting, time: getTimeStr() }])
        lastGreetingTimeRef.current = now
        hasUserSentMessageRef.current = false
      }
    }
    if (isActive) {
      hasBeenActiveRef.current = true
    }
  }, [isActive, loading])

  // 处理来自其他组件的 pendingMessage（如转出申请）
  useEffect(() => {
    if (pendingMessage && !loading) {
      sendMessage(pendingMessage)
      onMessageConsumed?.()
    }
  }, [pendingMessage])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    hasUserSentMessageRef.current = true
    const userMsg: Message = { type: 'user', content: text.trim(), time: getTimeStr() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          user_id: getUserId(),
          session_id: sessionId,
        }),
      })

      // 始终按 SSE 流式解析（后端统一返回 SSE）
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let agentContent = ''

      setMessages(prev => [...prev, { type: 'agent', content: '', time: getTimeStr() }])

      if (reader) {
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.token) {
                  agentContent += data.token
                  setMessages(prev => {
                    const updated = [...prev]
                    updated[updated.length - 1] = { ...updated[updated.length - 1], content: agentContent }
                    return updated
                  })
                }
              } catch { /* 忽略不完整的 SSE 事件 */ }
            }
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, { type: 'agent', content: '抱歉，学长暂时开小差了...请稍后再试 😅', time: getTimeStr() }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // 如果处于剧本模式，渲染 ScriptMode 组件
  if (inScriptMode) {
    return <ScriptMode onBack={() => setInScriptMode(false)} />
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-primary-container/40 via-surface to-surface">
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {/* Header illustration area */}
      <div className="relative px-4 pt-2 pb-3">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#FFF3E0] via-[#FFE8CC] to-[#FFDCBE] p-4 shadow-sm">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 right-4 w-12 h-12 rounded-full bg-amber-warm/40" />
            <div className="absolute bottom-3 left-6 w-8 h-8 rounded-full bg-sage/30" />
            <div className="absolute top-6 left-1/3 w-6 h-6 rounded-full bg-gold/30" />
          </div>
          
          <div className="relative flex items-center gap-3">
            <div className="animate-float w-14 h-14 rounded-full bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2] flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/images/pixiu-avatar.png" alt="貔貅学长" className="w-12 h-12 object-contain" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-lg text-on-primary-container leading-tight">
                貔貅学长
              </h1>
              <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                <Sparkles size={12} className="text-amber-warm" />
                <span>你的专属理财伙伴 · 在线</span>
              </p>
            </div>
            <div className="flex flex-col items-end">
              <div className="px-2 py-0.5 bg-secondary-container rounded-full">
                <span className="text-xs text-secondary font-medium">Lv.5 金算盘</span>
              </div>
              <button
                aria-label="打开设置与数据"
                onClick={() => setShowSettings(true)}
                className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/60 text-primary transition-colors hover:bg-white"
              >
                <Settings size={14} />
              </button>
            </div>
          </div>

          <button
            type="button"
            className="mt-3 w-full p-2 bg-white/60 rounded-xl backdrop-blur-sm cursor-pointer hover:bg-white/80 transition-colors active:scale-[0.98]"
            onClick={() => setInScriptMode(true)}
          >
            <p className="text-xs text-primary text-center font-medium">
              📖 点击进入剧情模式 →
            </p>
          </button>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 px-4 py-2 space-y-3 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2 animate-slide-up ${
              msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
            style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
          >
            {msg.type === 'agent' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2] flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                <img src="/images/貔貅空间.png" alt="貔貅" className="w-7 h-7 object-contain" />
              </div>
            )}
            <div
              className={`max-w-[72%] px-3 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                msg.type === 'user'
                  ? 'bg-primary text-on-primary rounded-tr-sm'
                  : 'bg-white text-on-surface rounded-tl-sm border border-outline-variant/20'
              }`}
            >
              {msg.type === 'agent' ? (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-sm">
                  {msg.content ? (
                    <ReactMarkdown components={{
                      table: ({ children, ...props }: ComponentPropsWithoutRef<'table'>) => (
                        <div className="overflow-x-auto my-2 -mx-1">
                          <table className="min-w-full text-[12px] border-collapse border border-gray-200 rounded" {...props}>{children}</table>
                        </div>
                      ),
                      thead: ({ children, ...props }: ComponentPropsWithoutRef<'thead'>) => (
                        <thead className="bg-gray-50" {...props}>{children}</thead>
                      ),
                      th: ({ children, ...props }: ComponentPropsWithoutRef<'th'>) => (
                        <th className="px-2 py-1.5 border border-gray-200 text-left font-medium text-gray-700 whitespace-nowrap" {...props}>{children}</th>
                      ),
                      td: ({ children, ...props }: ComponentPropsWithoutRef<'td'>) => (
                        <td className="px-2 py-1 border border-gray-200 text-gray-600 whitespace-nowrap" {...props}>{children}</td>
                      ),
                    }}>{msg.content}</ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-1 py-1">
                      <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
              ) : (
                msg.content
              )}
              <div className={`text-xs mt-1 opacity-60 ${
                msg.type === 'user' ? 'text-right' : 'text-left'
              }`}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.type !== 'agent' && (
          <div className="flex gap-2 flex-row">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2] flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
              <img src="/images/pixiu-avatar.png" alt="貔貅" className="w-7 h-7 object-contain" />
            </div>
            <div className="px-4 py-3 bg-white rounded-2xl rounded-tl-sm border border-outline-variant/20 shadow-sm">
              <Loader2 size={16} className="animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      <div className="px-4 py-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {quickReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={async () => {
                // 用户看到的是短文本，实际发送详细 query
                hasUserSentMessageRef.current = true
                const userMsg: Message = { type: 'user', content: `${reply.emoji} ${reply.text}`, time: getTimeStr() }
                setMessages(prev => [...prev, userMsg])
                setLoading(true)
                try {
                  const res = await fetch(`${API_BASE}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      message: reply.query,
                      user_id: getUserId(),
                      session_id: sessionId,
                    }),
                  })
                  const reader = res.body?.getReader()
                  const decoder = new TextDecoder()
                  let agentContent = ''
                  setMessages(prev => [...prev, { type: 'agent', content: '', time: getTimeStr() }])
                  if (reader) {
                    let buffer = ''
                    while (true) {
                      const { done, value } = await reader.read()
                      if (done) break
                      buffer += decoder.decode(value, { stream: true })
                      const lines = buffer.split('\n')
                      buffer = lines.pop() || ''
                      for (const line of lines) {
                        if (line.startsWith('data: ')) {
                          try {
                            const data = JSON.parse(line.slice(6))
                            if (data.token) {
                              agentContent += data.token
                              setMessages(prev => {
                                const updated = [...prev]
                                updated[updated.length - 1] = { ...updated[updated.length - 1], content: agentContent }
                                return updated
                              })
                            }
                          } catch { /* 忽略不完整的 SSE 事件 */ }
                        }
                      }
                    }
                  }
                } catch {
                  setMessages(prev => [...prev, { type: 'agent', content: '抱歉，学长暂时开小差了...请稍后再试 😅', time: getTimeStr() }])
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-surface-container-high rounded-full text-xs font-medium text-primary whitespace-nowrap hover:bg-primary-container transition-colors duration-200 shadow-sm border border-outline-variant/20 disabled:opacity-50"
            >
              <span>{reply.emoji}</span>
              <span>{reply.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="px-4 pb-3 pt-1">
        <div className="flex items-center gap-2 bg-surface-container rounded-2xl px-4 py-2.5 border border-outline-variant/30 shadow-sm">
          <input
            type="text"
            placeholder="和学长聊聊吧..."
            className="flex-1 bg-transparent outline-none text-sm text-on-surface placeholder:text-outline-variant"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            aria-label="发送消息"
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            <Send size={14} className="text-on-primary" />
          </button>
        </div>
      </div>
    </div>
  )
}
