import { useState, useRef, useEffect } from 'react'
import { Send, ArrowLeft, Sparkles, Loader2 } from 'lucide-react'

interface Message {
  type: 'agent' | 'user'
  content: string
  time: string
  imageUrl?: string
}

function getTimeStr() {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

interface ScriptModeProps {
  onBack: () => void
}

const PRESET_SCRIPTS = [
  {
    id: 'super_star_01',
    name: '女明星的逆袭之路',
    icon: '⭐',
    desc: '从素人到顶流，你的每一分储蓄都是星途投资！',
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    id: 'boy_band_01',
    name: '重生之嫁给男团队长',
    icon: '💕',
    desc: '和霸总队长一起攒婚礼基金，甜到上头！',
    color: 'from-pink-400 to-rose-500',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
  },
]

export default function ScriptMode({ onBack }: ScriptModeProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'agent',
      content: '✨ 欢迎进入剧情模式！我是你的剧本导演貔貅学长～\n\n选择一个剧本开始你的冒险吧！你的每一笔省钱和存钱都会化为剧情的推进力！',
      time: getTimeStr(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const [scriptInfo, setScriptInfo] = useState<{name: string; progress: number} | null>(null)
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [scriptSelected, setScriptSelected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 加载剧本进度
  useEffect(() => {
    fetch('/api/script/progress/web_user')
      .then(res => res.json())
      .then(data => {
        if (data.script_name) {
          setScriptInfo({ name: data.script_name, progress: data.progress_percent || 0 })
          setScriptSelected(true)
        }
      })
      .catch(() => {})
  }, [])

  async function selectScript(scriptId: string, scriptName: string) {
    setScriptSelected(true)
    setLoading(true)

    // 发送选择剧本的消息
    const userMsg: Message = { type: 'user', content: `我要玩「${scriptName}」！`, time: getTimeStr() }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch('/api/script/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `我选择剧本「${scriptName}」（script_id: ${scriptId}），请开始第一章的剧情！用剧本设定的角色来跟我对话。`,
          user_id: 'web_user',
          session_id: sessionId,
        }),
      })
      const data = await res.json()

      let imageUrl = data.image_url || undefined
      let content = data.reply || ''

      if (!imageUrl) {
        const urlMatch = content.match(/(https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|webp)[^\s"'<>]*)/i)
        if (urlMatch) {
          imageUrl = urlMatch[1]
        }
      }

      const agentMsg: Message = { type: 'agent', content, time: getTimeStr(), imageUrl }
      setMessages(prev => [...prev, agentMsg])

      // 刷新进度
      fetch('/api/script/progress/web_user')
        .then(r => r.json())
        .then(d => {
          if (d.script_name) setScriptInfo({ name: d.script_name, progress: d.progress_percent || 0 })
        })
        .catch(() => {})
    } catch {
      const errorMsg: Message = { type: 'agent', content: '剧本加载中遇到了一些问题...请稍后再试 😅', time: getTimeStr() }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: Message = { type: 'user', content: text.trim(), time: getTimeStr() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/script/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          user_id: 'web_user',
          session_id: sessionId,
        }),
      })
      const data = await res.json()
      
      let imageUrl = data.image_url || undefined
      let content = data.reply || ''
      
      if (!imageUrl) {
        const urlMatch = content.match(/(https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|webp)[^\s"'<>]*)/i)
        if (urlMatch) {
          imageUrl = urlMatch[1]
        }
      }

      const agentMsg: Message = { type: 'agent', content, time: getTimeStr(), imageUrl }
      setMessages(prev => [...prev, agentMsg])

      // 刷新进度
      fetch('/api/script/progress/web_user')
        .then(r => r.json())
        .then(d => {
          if (d.script_name) setScriptInfo({ name: d.script_name, progress: d.progress_percent || 0 })
        })
        .catch(() => {})
    } catch {
      const errorMsg: Message = { type: 'agent', content: '剧情导演暂时开小差了...请稍后再试 😅', time: getTimeStr() }
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

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#2C1810]/5 via-surface to-surface">
      {/* 图片预览弹窗 */}
      {previewImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewImg(null)}
        >
          <img src={previewImg} alt="漫画" className="max-w-[90%] max-h-[80%] rounded-2xl shadow-2xl" />
        </div>
      )}

      {/* Header */}
      <div className="relative px-4 pt-2 pb-3">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a0a2e]/90 via-[#2d1b4e]/80 to-[#4a1942]/70 p-4 shadow-lg">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-2 right-4 w-10 h-10 rounded-full bg-purple-400/40 blur-sm" />
            <div className="absolute bottom-3 left-6 w-6 h-6 rounded-full bg-pink-300/30 blur-sm" />
            <div className="absolute top-4 left-1/4 w-4 h-4 rounded-full bg-yellow-300/40 blur-sm" />
          </div>

          <div className="relative flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
            >
              <ArrowLeft size={16} className="text-white" />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg">
              <img src="/images/script-avatar.png" alt="剧情Agent" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-base text-white leading-tight flex items-center gap-1">
                <Sparkles size={14} className="text-yellow-300" />
                剧情模式
              </h1>
              <p className="text-[11px] text-white/70 mt-0.5">
                {scriptInfo ? `${scriptInfo.name} · ${scriptInfo.progress}%` : '选择一个剧本开始冒险'}
              </p>
            </div>
          </div>

          {scriptInfo && (
            <div className="mt-3 relative">
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-300 to-pink-400 rounded-full transition-all duration-700"
                  style={{ width: `${scriptInfo.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 px-4 py-2 space-y-3 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.type === 'agent' && (
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm">
                <img src="/images/script-avatar.png" alt="剧情Agent" className="w-full h-full object-cover" />
              </div>
            )}
            <div className={`max-w-[78%] flex flex-col gap-1.5`}>
              <div
                className={`px-3 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                  msg.type === 'user'
                    ? 'bg-[#e8d5f5] text-[#2C2420] rounded-tr-sm'
                    : 'bg-white text-on-surface rounded-tl-sm border border-outline-variant/20'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className={`text-[10px] mt-1 opacity-60 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.time}
                </div>
              </div>
              {/* 内联漫画图片 */}
              {msg.imageUrl && (
                <div
                  className="cursor-pointer rounded-xl overflow-hidden border border-outline-variant/20 shadow-sm"
                  onClick={() => setPreviewImg(msg.imageUrl!)}
                >
                  <img
                    src={msg.imageUrl}
                    alt="剧情漫画"
                    className="w-full rounded-xl"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="px-2 py-1 bg-gradient-to-r from-purple-50 to-pink-50 text-[10px] text-purple-600 text-center">
                    点击查看大图
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 剧本选择标签 - 在欢迎消息后且未选择剧本时显示 */}
        {!scriptSelected && !loading && (
          <div className="flex flex-col gap-2 ml-10">
            {PRESET_SCRIPTS.map(script => (
              <button
                key={script.id}
                onClick={() => selectScript(script.id, script.name)}
                className={`w-full text-left p-3 rounded-2xl ${script.bgColor} border ${script.borderColor} shadow-sm hover:shadow-md transition-all active:scale-[0.98]`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{script.icon}</span>
                  <span className="font-medium text-[13px] text-on-surface">{script.name}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1 ml-7">{script.desc}</p>
              </button>
            ))}
            <div className="text-[10px] text-center text-outline-variant mt-1">
              或者直接告诉我，你想创建什么剧本~
            </div>
          </div>
        )}

        {loading && (
          <div className="flex gap-2 flex-row">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm">
              <img src="/images/script-avatar.png" alt="剧情Agent" className="w-full h-full object-cover" />
            </div>
            <div className="px-4 py-3 bg-white rounded-2xl rounded-tl-sm border border-outline-variant/20 shadow-sm">
              <Loader2 size={16} className="animate-spin text-purple-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-3 pt-1">
        <div className="flex items-center gap-2 bg-surface-container rounded-2xl px-4 py-2.5 border border-purple-200/50 shadow-sm">
          <input
            type="text"
            placeholder="告诉导演你的省钱/存钱行动..."
            className="flex-1 bg-transparent outline-none text-sm text-on-surface placeholder:text-outline-variant"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
