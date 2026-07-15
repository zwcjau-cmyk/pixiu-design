import { useEffect, useState } from 'react'
import { BookOpen, ChartNoAxesCombined, ChevronRight, Coins, MessageCircleMore, SlidersHorizontal } from 'lucide-react'
import { ApprovalMailbox, RoomChatOverlay, type ChatMessage } from './StorybookPanels'

const prompts: Record<string, string> = {
  diagnosis: '请根据我近三个月的记录做一次省钱诊断，先说明数据是否足够，再给我 2—3 条具体建议。',
  budget: '请根据我近一个月的收支记录帮我规划预算，不要机械套用固定比例，并说明计算口径。',
  broadcast: '请做一次理财播报：先看资产结构，再说明可靠的市场信息与风险教育，不替我作出买卖决定。',
}

export default function PixiuRoom({
  pendingMessage,
  onConsumed,
  onOpenScriptLibrary,
}: {
  pendingMessage?: string | null
  onConsumed?: () => void
  onOpenScriptLibrary: () => void
}) {
  const [panel, setPanel] = useState<'script' | 'approval' | 'chat' | null>(null)
  const [chatSeed, setChatSeed] = useState<ChatMessage[]>([{ role: 'assistant', content: '嗨！今天想聊点什么？记账、预算、理财都可以找我。' }])

  function openChat(text?: string) {
    setChatSeed([{ role: 'assistant', content: '我在呢。我们先把事情说清楚，再一起做决定。' }, ...(text ? [{ role: 'user' as const, content: text }] : [])])
    setPanel('chat')
  }

  useEffect(() => {
    if (pendingMessage) {
      openChat(pendingMessage)
      onConsumed?.()
    }
  }, [pendingMessage])

  const tools = [
    { icon: Coins, label: '省钱诊断', action: () => openChat(prompts.diagnosis) },
    { icon: SlidersHorizontal, label: '预算规划', action: () => openChat(prompts.budget) },
    { icon: ChartNoAxesCombined, label: '理财播报', action: () => openChat(prompts.broadcast) },
  ]

  return (
    <main className="storybook-screen pixiu-room">
      <div className="room-topbar">
        <button className="profile-chip" onClick={() => openChat()}><span className="tiny-ip"><img src="/images/storybook/pixiu-ip-master.png" alt="" /></span><span><b>学长小助手</b><small>Lv.12　<i /> 在线</small></span><ChevronRight size={15} /></button>
        <button className="story-chip" onClick={onOpenScriptLibrary}><BookOpen size={17} /><span>剧情</span></button>
        <button className="request-chip" onClick={() => setPanel('approval')}>转出申请 <em>2</em></button>
      </div>

      <section className="hero-speech">
        <button className="hero-chat-intro" onClick={() => openChat()}>
          <MessageCircleMore size={18} />
          <span><b>嗨！今天想聊点什么？</b><small>记账、预算、理财都可以找我哦～</small></span>
        </button>
        <div className="hero-quick-tools">
          {tools.map(({ icon: Icon, label, action }) => <button key={label} onClick={action}><Icon /><b>{label}</b></button>)}
        </div>
      </section>

      <div className="pixiu-character" aria-label="貔貅学长"><img src="/images/storybook/pixiu-ip-master.png" alt="貔貅学长" /></div>

      <button className="chat-launcher" onClick={() => openChat()}><span>给学长发消息吧…</span><b><ChevronRight /></b></button>

      {panel === 'chat' && <RoomChatOverlay key={chatSeed.map(item => item.content).join('|')} initialMessages={chatSeed} onClose={() => setPanel(null)} />}
      {panel === 'approval' && <ApprovalMailbox onClose={() => setPanel(null)} onOpenChat={openChat} />}
    </main>
  )
}
