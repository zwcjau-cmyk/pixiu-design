import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronRight, FileSpreadsheet, Send, ShieldCheck, X } from 'lucide-react'
import { API_BASE, getUserId } from '../config'

export function PaperSheet({ title, subtitle, children, onClose, className = '' }: {
  title: string
  subtitle?: string
  children: React.ReactNode
  onClose: () => void
  className?: string
}) {
  return (
    <div className="storybook-backdrop" onClick={onClose}>
      <section className={`paper-sheet ${className}`} role="dialog" aria-modal="true" aria-label={title} onClick={event => event.stopPropagation()}>
        <span className="paper-tape" aria-hidden="true" />
        <button className="round-icon sheet-close" onClick={onClose} aria-label="关闭"><X size={18} /></button>
        <h2>{title}</h2>
        {subtitle && <p className="sheet-subtitle">{subtitle}</p>}
        {children}
      </section>
    </div>
  )
}

export interface ChatMessage { role: 'assistant' | 'user'; content: string }

export function ChatSheet({ initialMessages, onClose }: { initialMessages: ChatMessage[]; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())

  async function send(text: string) {
    const clean = text.trim()
    if (!clean || loading) return
    setMessages(previous => [...previous, { role: 'user', content: clean }])
    setInput('')
    setLoading(true)
    let answer = ''
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clean, user_id: getUserId(), session_id: sessionId }),
      })
      if (!response.ok) throw new Error('服务暂时不可用')
      setMessages(previous => [...previous, { role: 'assistant', content: '' }])
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.token) {
              answer += data.token
              setMessages(previous => [...previous.slice(0, -1), { role: 'assistant', content: answer }])
            }
          } catch { /* 等待完整事件 */ }
        }
      }
    } catch {
      setMessages(previous => [...previous, { role: 'assistant', content: '信号暂时断开啦。你的内容还在输入框里，等服务恢复后可以再试一次。' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="storybook-full-panel">
      <header>
        <button onClick={onClose}><ArrowLeft size={18} />返回房间</button>
        <div><strong>貔貅学长</strong><small><i /> 在线陪伴</small></div>
        <img src="/images/storybook/pixiu-ip-master.png" alt="貔貅学长" />
      </header>
      <div className="storybook-chat-log">
        {messages.map((message, index) => (
          <div key={index} className={`chat-bubble ${message.role}`}>{message.content || '正在翻账本…'}</div>
        ))}
      </div>
      <form className="storybook-chat-form" onSubmit={event => { event.preventDefault(); send(input) }}>
        <input value={input} onChange={event => setInput(event.target.value)} placeholder="把你的想法告诉学长…" />
        <button disabled={loading} aria-label="发送"><Send size={18} /></button>
      </form>
    </div>
  )
}

export function RoomChatOverlay({ initialMessages, onClose }: { initialMessages: ChatMessage[]; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const seedRequested = useRef(false)

  async function requestAnswer(text: string, appendUser = true) {
    const clean = text.trim()
    if (!clean || loading) return
    if (appendUser) setMessages(previous => [...previous, { role: 'user', content: clean }])
    setInput('')
    setLoading(true)
    let answer = ''
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clean, user_id: getUserId(), session_id: sessionId }),
      })
      if (!response.ok) throw new Error('服务暂时不可用')
      setMessages(previous => [...previous, { role: 'assistant', content: '' }])
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.token) {
              answer += data.token
              setMessages(previous => [...previous.slice(0, -1), { role: 'assistant', content: answer }])
            }
          } catch { /* 等待完整事件 */ }
        }
      }
    } catch {
      setMessages(previous => [...previous, { role: 'assistant', content: '信号暂时断开啦。你刚才的话我已经看到了，等服务恢复后再试一次吧。' }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const seed = initialMessages.at(-1)
    if (!seedRequested.current && seed?.role === 'user') {
      seedRequested.current = true
      requestAnswer(seed.content, false)
    }
  }, [])

  return (
    <section className="room-chat-layer" aria-label="与貔貅学长聊天">
      <div className="room-chat-heading"><span><i /> 学长正在听</span><button onClick={onClose} aria-label="收起聊天"><X size={17} /></button></div>
      <div className="room-chat-log">
        {messages.map((message, index) => (
          <div key={index} className={`room-chat-message ${message.role}`}>
            {message.role === 'assistant' && <span className="room-chat-avatar"><img src="/images/storybook/pixiu-ip-master.png" alt="貔貅学长" /></span>}
            <p>{message.content || '正在翻账本…'}</p>
          </div>
        ))}
      </div>
      <form className="room-chat-form" onSubmit={event => { event.preventDefault(); requestAnswer(input) }}>
        <input value={input} onChange={event => setInput(event.target.value)} placeholder="直接告诉学长：午饭花了 18 元…" autoFocus />
        <button disabled={loading} aria-label="发送消息"><Send size={18} /></button>
      </form>
    </section>
  )
}

export function QuickLedgerSheet({ onClose, onSubmit }: { onClose: () => void; onSubmit: (message: string) => void }) {
  const [type, setType] = useState<'支出' | '收入'>('支出')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('餐饮')
  const [note, setNote] = useState('')
  return (
    <PaperSheet title="记一笔账" subtitle="写下来，钱的去向就会慢慢变清楚。" onClose={onClose}>
      <div className="segmented-control">
        {(['支出', '收入'] as const).map(item => <button key={item} onClick={() => setType(item)} className={type === item ? 'active' : ''}>{item}</button>)}
      </div>
      <label className="paper-field"><span>金额</span><div className="amount-field"><b>¥</b><input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" /></div></label>
      <label className="paper-field"><span>分类</span><select value={category} onChange={event => setCategory(event.target.value)}>{['餐饮', '购物', '出行', '学习', '娱乐', '工资', '其他'].map(item => <option key={item}>{item}</option>)}</select></label>
      <label className="paper-field"><span>备注</span><input value={note} onChange={event => setNote(event.target.value)} placeholder="比如：和室友吃火锅" /></label>
      <button className="storybook-primary" disabled={!Number(amount)} onClick={() => onSubmit(`请帮我记一笔${type}：${category} ¥${amount}${note ? `，备注：${note}` : ''}`)}>交给学长记账 <ChevronRight size={16} /></button>
    </PaperSheet>
  )
}

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [syncOpen, setSyncOpen] = useState(false)
  async function importCsv(file?: File) {
    if (!file) return
    const content = await file.text()
    const rows = content.split(/\r?\n/).filter(Boolean)
    setMessage(rows.length > 1 ? `已读取 ${rows.length - 1} 条记录。正式导入仍会经过字段校验与去重。` : '文件中没有可导入的记录。')
  }
  return (
    <PaperSheet title="设置与数据" subtitle="没有账号系统也可以管理自己的账单入口。" onClose={onClose} className="settings-sheet">
      <button className="settings-row" onClick={() => inputRef.current?.click()}><FileSpreadsheet /><span><b>导入账单</b><small>CSV 文件在确认前只在本机读取</small></span><ChevronRight /></button>
      <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={event => importCsv(event.target.files?.[0])} />
      <button className="settings-row" onClick={() => setSyncOpen(value => !value)}><span className="settings-emoji">🔗</span><span><b>账单同步</b><small>查看可接入渠道与授权说明</small></span><ChevronRight className={syncOpen ? 'rotate' : ''} /></button>
      {syncOpen && <div className="settings-expanded"><p>微信、支付宝与银行卡同步都需要平台正式授权；当前不读取账户密码。</p><div><span>微信 · 待接入</span><span>支付宝 · 待接入</span><span>银行卡 · 待接入</span></div></div>}
      <div className="settings-row static"><ShieldCheck /><span><b>隐私说明</b><small>请勿上传身份证、银行卡号等敏感信息</small></span></div>
      {message && <p className="paper-notice">{message}</p>}
    </PaperSheet>
  )
}

const scripts = [
  ['🎓', '毕业前的安全垫', '为求职、搬家与毕业过渡期攒出选择权。'],
  ['🧪', '技能升级实验室', '把课程、考试和学习工具放进可执行预算。'],
  ['⭐', '女明星的逆袭之路', '每一次忍住没买，都会转化成剧情推进力。'],
  ['💌', '重生之预算守护者', '在选择与诱惑里守住本章的目标。'],
] as const

export function ScriptShelf({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null)
  return (
    <PaperSheet title="剧情书架" subtitle="剧情负责激励，真实进度仍以记账、预算与存钱行动为准。" onClose={onClose} className="script-sheet">
      <div className="script-grid">
        {scripts.map((script, index) => <button key={script[1]} onClick={() => setSelected(index)} className={selected === index ? 'selected' : ''}><span>{script[0]}</span><b>{script[1]}</b><small>{script[2]}</small></button>)}
      </div>
      {selected !== null && <div className="chapter-card"><span>第一章</span><h3>{scripts[selected][1]}</h3><p>本章任务：完成一笔记账，并为目标留出今天的第一枚金币。</p><button className="storybook-primary">开始本章 <ChevronRight size={16} /></button></div>}
    </PaperSheet>
  )
}

export function ApprovalMailbox({ onClose, onOpenChat }: { onClose: () => void; onOpenChat: (text: string) => void }) {
  return (
    <PaperSheet title="转出申请箱" subtitle="学长会通过你的申请，但也要督促你回顾你的花钱效用。" onClose={onClose}>
      <div className="approval-card"><span>待回顾</span><b>课程报名 · ¥899</b><small>从活期池转出 · 今天 14:20</small><button onClick={() => onOpenChat('请回顾我这笔课程报名 ¥899 的转出申请，并完成形式审批。')}>请学长回顾 <ChevronRight size={15} /></button></div>
      <div className="approval-card done"><span><Check size={13} /> 已通过</span><b>周末出行 · ¥260</b><small>学长提醒：转出后本月旅行预算还剩 ¥340</small></div>
    </PaperSheet>
  )
}

export function MarketForecastLab({ onClose }: { onClose: () => void }) {
  const [judgement, setJudgement] = useState('')
  const [neededInfo, setNeededInfo] = useState('')
  const [saved, setSaved] = useState(false)
  const clues = [
    '新能源车产业链近两周出现价格战降温信号，部分龙头公司主动控制促销节奏。',
    '上游锂盐价格仍处低位，但库存去化速度开始分化，市场对下半年需求判断不一致。',
    '政策端继续强调以旧换新和绿色消费，但出口端仍受海外关税与汇率波动影响。',
  ]

  function savePrediction() {
    const records = JSON.parse(localStorage.getItem('pixiu_market_predictions_v1') || '[]')
    const reviewDate = new Date()
    reviewDate.setDate(reviewDate.getDate() + 30)
    localStorage.setItem('pixiu_market_predictions_v1', JSON.stringify([
      {
        id: crypto.randomUUID(),
        industry: '新能源车产业链',
        judgement,
        neededInfo,
        createdAt: new Date().toISOString(),
        reviewAt: reviewDate.toISOString(),
      },
      ...records,
    ]))
    setSaved(true)
  }

  return (
    <PaperSheet title="行情观星台" subtitle="先形成判断，再把预测留到一个月后复盘。" onClose={onClose} className="decision-sheet market-forecast-sheet">
      <div className="market-case">
        <span>观察对象</span>
        <b>新能源车产业链 · 未来 30 天</b>
      </div>
      <div className="market-clues">
        {clues.map((clue, index) => <p key={clue}><b>{index + 1}</b>{clue}</p>)}
      </div>
      <label className="forecast-field">
        <span>你的判断</span>
        <textarea value={judgement} onChange={event => setJudgement(event.target.value)} placeholder="例如：我认为短期仍会震荡，除非销量和库存数据同时改善。" />
      </label>
      <label className="forecast-field">
        <span>还需要什么信息</span>
        <textarea value={neededInfo} onChange={event => setNeededInfo(event.target.value)} placeholder="例如：下月销量、库存变化、龙头公司毛利率、政策落地节奏。" />
      </label>
      <button className="storybook-primary" disabled={!judgement.trim()} onClick={savePrediction}>保存预测，30 天后复盘 <ChevronRight size={16} /></button>
      {saved && <p className="decision-feedback">已保存这次判断。一个月后可以拿真实走势回来复盘：判断对了什么，漏掉了什么。</p>}
      <small className="risk-note">这是判断训练，不构成投资建议，也不会连接真实交易。</small>
    </PaperSheet>
  )
}

export function TradePracticeLab({ onClose }: { onClose: () => void }) {
  const [choice, setChoice] = useState<'buy' | 'wait' | null>(null)
  const [round, setRound] = useState(0)
  const prices = [42, 47, 44, 53, 49, 58, 55]
  const visible = prices.slice(0, Math.min(4 + round, prices.length))
  function decide(next: 'buy' | 'wait') { setChoice(next); setRound(value => Math.min(value + 1, 3)) }
  return (
    <PaperSheet title="涨跌练习场" subtitle="只练买卖手感：看走势、做选择、体会波动。" onClose={onClose} className="decision-sheet">
      <div className="mini-chart" aria-label="模拟价格走势">
        <div className="chart-grid" />
        <svg viewBox="0 0 240 110" role="img"><polyline points={visible.map((value, index) => `${12 + index * 36},${98 - value}`).join(' ')} fill="none" stroke="#d99b27" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span>模拟标的 · 第 {round + 1} 回合</span><b>¥{visible.at(-1)}.00</b>
      </div>
      <div className="market-clue"><b>本回合线索</b><p>{round === 0 ? '价格连续震荡，但你还不知道自己的使用期限。' : round === 1 ? '短期上涨，波动也在加大。' : '市场回落，你的应急金仍不足三个月。'}</p></div>
      <div className="decision-actions"><button onClick={() => decide('wait')}>再观察</button><button onClick={() => decide('buy')}>模拟买入</button></div>
      {choice && <p className="decision-feedback">{choice === 'buy' ? '你选择了模拟买入。先写下买入理由，比猜涨跌更重要。' : '你选择了等待。等待也是一种有明确成本与理由的决策。'}</p>}
      <small className="risk-note">这是手感练习，不做行情预测，不构成投资建议，也不连接真实资金。</small>
    </PaperSheet>
  )
}
