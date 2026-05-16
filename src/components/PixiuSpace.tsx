import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Loader2 } from 'lucide-react'
import ScriptMode from './ScriptMode'

interface Message {
  type: 'agent' | 'user'
  content: string
  time: string
}

const quickReplies = [
  {
    emoji: '💰',
    text: '省钱诊断',
    query: '请帮我分析最近1个月的消费记录。我希望你完成以下三件事：\n\n消费习惯总结：按类别（如餐饮、购物、出行、娱乐、订阅服务等）汇总我的消费分布，找出消费最高的几个领域，并和上一个周期做同比对比，看看整体消费是上升还是下降了。\n\n节省成效评估：如果我之前有设定过省钱目标或调整过某类消费，请评估实际效果如何。如果没有历史目标，就根据我的消费结构，判断我是否处于一个健康的支出状态。\n\n可削减建议：找出我可能存在的非必要支出或被动消耗（例如：长期不用的会员/订阅、频率偏高的冲动消费、可替代的高价选项），给出2-3条具体可执行的省钱建议。',
  },
  {
    emoji: '📊',
    text: '预算规划',
    query: '请根据我近期的收入情况和历史支出结构，帮我完成预算规划（或更新已有规划）。\n\n请按以下步骤来：\n\n现状诊断：先分析我当前的收入水平和支出结构，计算出我目前的储蓄率，判断整体财务状态是"盈余/收支平衡/赤字"哪种。\n\n预算制定/调整：如果我还没有预算规划，请根据我的实际收支情况，推荐一套合理的月度预算分配方案（可以参考"50/30/20 法则"或根据我的实际情况灵活定制）；如果我已有预算规划，请对比我的实际执行情况，找出哪些类别超支了、哪些有结余，并给出具体的调整建议。\n\n优先级建议：根据我的财务目标（如攒钱、还款、投资等），帮我确定下一阶段最应该重点控制或优化的1-2个支出类别。',
  },
  {
    emoji: '📡',
    text: '理财播报',
    query: '请帮我做一次近期理财市场的简要扫描和投资建议评估，所有建议必须严格符合我的理财大逻辑：稳健、长期、赚长期的钱、目标是实现长期复利收益。\n\n第一部分：近期市场动态扫描（最近3-7天）\n\n请只关注以下三个维度，并点出"值得关注的变化或信号"：\n📈 股市：A股/港股/美股主要指数有无明显波动？是否出现趋势性转折信号？\n🥇 黄金：金价近期走势如何？是否有影响中长期走向的宏观因素出现？\n💼 基金：主流基金类型整体表现如何？有无值得关注的板块轮动迹象？\n⚠️ 特别说明：如果某个维度近期没有实质性值得关注的变化，请直接跳过。\n\n第二部分：我的理财调整建议（有则说，无则不说）\n\n结合第一部分的市场信号，评估我当前的投资组合是否需要调整。只有在出现明确的长期机会或风险信号时才给出调整建议；短期波动不作为建议依据。如果当前无需调整，请直接告知"暂无需调整，继续持有/定投即可"。',
  },
]

function getTimeStr() {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

const FIRST_VISIT_KEY = 'pixiu_first_visit_done'

function getGreeting(): string {
  const isFirstVisit = !localStorage.getItem(FIRST_VISIT_KEY)
  if (isFirstVisit) {
    localStorage.setItem(FIRST_VISIT_KEY, 'true')
    return `叮咚 —— 恭喜你，成功捕获一只大你两届的金融系野生学长。我是貔貅学长，也是你未来的首席财务大管家。\n别紧张，我可不是来教你过苦行僧日子的。我是来帮你把那些平时被奶茶、外卖和冲动消费吞噬的"能量"，全部转化为你实现梦想的燃料的！\n来，告诉我你的"野心"：你下定决心激活我，是想攒钱干票大的，还是想重组你的支出结构，或者干脆是想学理财早日退休？\n我还得先盘盘你的底子：目前每个月的子弹（收入）大概有多少？最大的吞金兽（日常开销大头）又是什么？\n放心，在学长这里，每一分钱都会成为你进阶的垫脚石！`
  }
  return '嗨～我是貔貅学长！今天想聊点什么呢？我可以帮你诊断花钱习惯、规划预算，或者一起完成理财剧本任务哦 ✨'
}

interface PixiuSpaceProps {
  pendingMessage?: string | null
  onMessageConsumed?: () => void
}

export default function PixiuSpace({ pendingMessage, onMessageConsumed }: PixiuSpaceProps) {
  const [inScriptMode, setInScriptMode] = useState(false)
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 处理来自其他组件的 pendingMessage（如转出申请）
  useEffect(() => {
    if (pendingMessage && !loading) {
      sendMessage(pendingMessage)
      onMessageConsumed?.()
    }
  }, [pendingMessage])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: Message = { type: 'user', content: text.trim(), time: getTimeStr() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          user_id: 'web_user',
          session_id: sessionId,
        }),
      })
      const data = await res.json()
      const agentMsg: Message = { type: 'agent', content: data.reply, time: getTimeStr() }
      setMessages(prev => [...prev, agentMsg])
    } catch {
      const errorMsg: Message = { type: 'agent', content: '抱歉，学长暂时开小差了...请稍后再试 😅', time: getTimeStr() }
      setMessages(prev => [...prev, errorMsg])
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
                <span className="text-[10px] text-secondary font-medium">Lv.5 金算盘</span>
              </div>
            </div>
          </div>

          <div
            className="mt-3 p-2 bg-white/60 rounded-xl backdrop-blur-sm cursor-pointer hover:bg-white/80 transition-colors active:scale-[0.98]"
            onClick={() => setInScriptMode(true)}
          >
            <p className="text-[11px] text-primary text-center font-medium">
              📖 点击进入剧情模式 →
            </p>
          </div>
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
              {msg.content}
              <div className={`text-[10px] mt-1 opacity-60 ${
                msg.type === 'user' ? 'text-right' : 'text-left'
              }`}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}
        {loading && (
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
              onClick={() => {
                // 用户看到的是短文本，实际发送详细 query
                const userMsg: Message = { type: 'user', content: `${reply.emoji} ${reply.text}`, time: getTimeStr() }
                setMessages(prev => [...prev, userMsg])
                setLoading(true)
                fetch('/api/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    message: reply.query,
                    user_id: 'web_user',
                    session_id: sessionId,
                  }),
                })
                  .then(res => res.json())
                  .then(data => {
                    const agentMsg: Message = { type: 'agent', content: data.reply, time: getTimeStr() }
                    setMessages(prev => [...prev, agentMsg])
                  })
                  .catch(() => {
                    const errorMsg: Message = { type: 'agent', content: '抱歉，学长暂时开小差了...请稍后再试 😅', time: getTimeStr() }
                    setMessages(prev => [...prev, errorMsg])
                  })
                  .finally(() => setLoading(false))
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
