import { useState, useRef, useEffect } from 'react'
import { Send, ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import { API_BASE, getUserId } from '../config'
import { PRESET_SCRIPTS, type SelectedScript } from '../data/scripts'

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
  initialScript?: SelectedScript | null
  customPrompt?: string
}

export default function ScriptMode({ onBack, initialScript, customPrompt }: ScriptModeProps) {
  const scriptStorageId = initialScript?.id || (customPrompt ? 'custom_draft' : 'unselected')
  const storageKey = (key: string) => `script_mode:${getUserId()}:${scriptStorageId}:${key}`

  // 从 sessionStorage 恢复状态（刷新页面会清空 sessionStorage）
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem(storageKey('messages'))
    if (saved) {
      try { return JSON.parse(saved) } catch { /* ignore */ }
    }
    return [{
      type: 'agent',
      content: '✨ 欢迎进入剧情模式！我是你的剧本导演貔貅学长～\n\n选择一个剧本开始你的冒险吧！你的每一笔省钱和存钱都会化为剧情的推进力！',
      time: getTimeStr(),
    }]
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => {
    const saved = sessionStorage.getItem(storageKey('session_id'))
    if (saved) return saved
    const id = crypto.randomUUID()
    sessionStorage.setItem(storageKey('session_id'), id)
    return id
  })
  const [scriptInfo, setScriptInfo] = useState<{name: string; progress: number} | null>(() => {
    const saved = sessionStorage.getItem(storageKey('script_info'))
    if (saved) { try { return JSON.parse(saved) } catch { /* ignore */ } }
    return null
  })
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [scriptSelected, setScriptSelected] = useState(() => {
    return sessionStorage.getItem(storageKey('script_selected')) === 'true'
  })
  const [activeScriptId, setActiveScriptId] = useState<string | null>(() => {
    return sessionStorage.getItem(storageKey('script_active_id')) || null
  })
  const [generatingImage, setGeneratingImage] = useState(false)
  const [welcomeSentAt, setWelcomeSentAt] = useState(() => {
    const saved = sessionStorage.getItem(storageKey('welcome_sent_at'))
    return saved ? Number(saved) : 0
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const autoSelectTriggeredRef = useRef(false)

  // 持久化消息到 sessionStorage
  useEffect(() => {
    sessionStorage.setItem(storageKey('messages'), JSON.stringify(messages))
  }, [messages])

  // 持久化剧本选择状态
  useEffect(() => {
    sessionStorage.setItem(storageKey('script_selected'), String(scriptSelected))
    if (scriptInfo) sessionStorage.setItem(storageKey('script_info'), JSON.stringify(scriptInfo))
    if (activeScriptId) sessionStorage.setItem(storageKey('script_active_id'), activeScriptId)
  }, [scriptSelected, scriptInfo, activeScriptId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (autoSelectTriggeredRef.current) return
    if (initialScript?.id && initialScript.name) {
      autoSelectTriggeredRef.current = true
      if (initialScript.resume) {
        setScriptSelected(true)
        setActiveScriptId(initialScript.id)
        setScriptInfo({ name: initialScript.name, progress: initialScript.progress ?? 0 })
        return
      }
      if (activeScriptId === initialScript.id && scriptSelected) return
      selectScript(initialScript.id, initialScript.name)
    } else if (customPrompt?.trim()) {
      autoSelectTriggeredRef.current = true
      sendMessage(customPrompt.trim())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 再次进入时的欢迎语（已选剧本、非首次进入、10分钟限制）
  const hasShownWelcomeRef = useRef(false)
  useEffect(() => {
    if (scriptSelected && scriptInfo && !hasShownWelcomeRef.current && !loading) {
      // 如果最后一条消息正在生成中（content为空），不打招呼
      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.type === 'agent' && !lastMsg.content) return
      hasShownWelcomeRef.current = true
      const now = Date.now()
      const tenMinutes = 10 * 60 * 1000
      // 检查是否是从其他 tab 切换回来（messages 已从 sessionStorage 恢复）
      const savedMessages = sessionStorage.getItem(storageKey('messages'))
      const isReentry = savedMessages && JSON.parse(savedMessages).length > 1
      if (isReentry && (now - welcomeSentAt > tenMinutes)) {
        setMessages(prev => [...prev, {
          type: 'agent',
          content: `你好，欢迎进入剧情模式。你已经选择了「${scriptInfo.name}」剧本，请继续你的冒险吧。`,
          time: getTimeStr(),
        }])
        setWelcomeSentAt(now)
        sessionStorage.setItem(storageKey('welcome_sent_at'), String(now))
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function buildScriptStartPrompt(scriptId: string, scriptName: string) {
    if (initialScript?.id === scriptId && initialScript.customPrompt) {
      return `我创建并选择了自定义剧本「${scriptName}」（script_id: ${scriptId}）。请根据以下设定生成第一章，并用这个角色设定跟我对话。\n\n${initialScript.customPrompt}`
    }
    return `我选择剧本「${scriptName}」（script_id: ${scriptId}），请开始第一章的剧情！用剧本设定的角色来跟我对话。`
  }

  async function selectScript(scriptId: string, scriptName: string) {
    setScriptSelected(true)
    setActiveScriptId(scriptId)
    setScriptInfo({ name: scriptName, progress: initialScript?.progress ?? 0 })
    setLoading(true)

    // 发送选择剧本的消息
    const userMsg: Message = { type: 'user', content: `我要玩「${scriptName}」！`, time: getTimeStr() }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch(`${API_BASE}/api/script/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: buildScriptStartPrompt(scriptId, scriptName),
          user_id: getUserId(),
          session_id: sessionId,
        }),
      })

      let agentContent = ''
      let imageUrl: string | undefined

      // 始终按 SSE 流式解析
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

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
                if (data.generating_image) {
                  setGeneratingImage(true)
                }
                if (data.done && data.image_url) {
                  imageUrl = data.image_url
                  setGeneratingImage(false)
                }
                if (data.done && !data.image_url) {
                  setGeneratingImage(false)
                }
              } catch { /* 忽略不完整的 SSE 事件 */ }
            }
          }
        }
      }

      // 流式结束后处理图片
      if (imageUrl) {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...updated[updated.length - 1], imageUrl }
          return updated
        })
      } else {
        const urlMatch = agentContent.match(/(https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|webp)[^\s"'<>]*)/i)
        if (urlMatch) {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...updated[updated.length - 1], imageUrl: urlMatch[1] }
            return updated
          })
        }
      }

      // 刷新进度
      fetch(`${API_BASE}/api/script/progress/${encodeURIComponent(getUserId())}`)
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
      const res = await fetch(`${API_BASE}/api/script/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          user_id: getUserId(),
          session_id: sessionId,
        }),
      })

      let agentContent = ''
      let imageUrl: string | undefined

      // 始终按 SSE 流式解析
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

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
                if (data.generating_image) {
                  setGeneratingImage(true)
                }
                if (data.done && data.image_url) {
                  imageUrl = data.image_url
                  setGeneratingImage(false)
                }
                if (data.done && !data.image_url) {
                  setGeneratingImage(false)
                }
              } catch { /* 忽略不完整的 SSE 事件 */ }
            }
          }
        }
      }

      // 流式结束后处理图片
      if (imageUrl) {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...updated[updated.length - 1], imageUrl }
          return updated
        })
      } else {
        const urlMatch = agentContent.match(/(https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|webp)[^\s"'<>]*)/i)
        if (urlMatch) {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...updated[updated.length - 1], imageUrl: urlMatch[1] }
            return updated
          })
        }
      }

      // 刷新进度
      fetch(`${API_BASE}/api/script/progress/${encodeURIComponent(getUserId())}`)
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
              aria-label="返回貔貅空间"
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
              <p className="text-xs text-white/70 mt-0.5">
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
                {msg.content ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : msg.type === 'agent' ? (
                  <div className="flex items-center gap-1 py-1">
                    <span className="w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : null}
                <div className={`text-xs mt-1 opacity-60 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.time}
                </div>
              </div>
              {/* 内联漫画图片 */}
              {msg.imageUrl && (
                <button
                  type="button"
                  aria-label="查看剧情漫画大图"
                  className="cursor-pointer rounded-xl overflow-hidden border border-outline-variant/20 shadow-sm"
                  onClick={() => setPreviewImg(msg.imageUrl!)}
                >
                  <img
                    src={msg.imageUrl}
                    alt="剧情漫画"
                    className="w-full rounded-xl"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="px-2 py-1 bg-gradient-to-r from-purple-50 to-pink-50 text-xs text-purple-600 text-center">
                    点击查看大图
                  </div>
                </button>
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
                <p className="text-xs text-on-surface-variant mt-1 ml-7">{script.desc}</p>
              </button>
            ))}
            <div className="text-xs text-center text-outline-variant mt-1">
              剧情用于激励；进度以实际记账、预算和存款行动为准。也可以直接告诉我你想创建什么剧本。
            </div>
          </div>
        )}

        {loading && messages[messages.length - 1]?.type !== 'agent' && (
          <div className="flex gap-2 flex-row">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm">
              <img src="/images/script-avatar.png" alt="剧情Agent" className="w-full h-full object-cover" />
            </div>
            <div className="px-4 py-3 bg-white rounded-2xl rounded-tl-sm border border-outline-variant/20 shadow-sm">
              <Loader2 size={16} className="animate-spin text-purple-500" />
            </div>
          </div>
        )}

        {generatingImage && (
          <div className="flex gap-2 flex-row ml-10">
            <div className="px-3 py-2 bg-purple-50 rounded-xl border border-purple-100 shadow-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-purple-500" />
              <span className="text-[12px] text-purple-600">正在为你绘制剧情插画...</span>
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
            aria-label="发送剧情消息"
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
