import { useEffect, useState } from 'react'
import ScriptLibrary from '../components/ScriptLibrary'
import ScriptMode from '../components/ScriptMode'
import type { SelectedScript } from '../data/scripts'
import PixiuRoom from './PixiuRoom'
import StorybookNav from './StorybookNav'
import TreasureRoom from './TreasureRoom'
import WealthVaultRoom from './WealthVaultRoom'

type StorybookView = 'rooms' | 'script-library' | 'script-chat'

export default function StorybookApp() {
  const [active, setActive] = useState(1)
  const [view, setView] = useState<StorybookView>('rooms')
  const [selectedScript, setSelectedScript] = useState<SelectedScript | null>(null)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }))

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  function handleApproved(message: string) {
    setPendingMessage(message)
    setActive(1)
    setView('rooms')
  }

  return (
    <div className="storybook-canvas">
      <div className="storybook-app">
        {view === 'script-library' ? (
          <ScriptLibrary
            onBack={() => setView('rooms')}
            onSelectScript={(script) => {
              setSelectedScript(script)
              setView('script-chat')
            }}
            onCreateCustom={() => {
              setSelectedScript(null)
              setView('script-chat')
            }}
          />
        ) : view === 'script-chat' ? (
          <ScriptMode
            initialScript={selectedScript}
            customPrompt={selectedScript ? undefined : '我想创建一个自定义剧本，请引导我设定故事主题、主角身份和理财目标。'}
            onBack={() => setView('script-library')}
          />
        ) : (
          <>
            <div className="storybook-status"><span>{time}</span><i /><div><b /><b /><b /></div></div>
            <div className="storybook-content">
              <div className="storybook-tab" hidden={active !== 0}><TreasureRoom isActive={active === 0} /></div>
              <div className="storybook-tab" hidden={active !== 1}>
                <PixiuRoom
                  pendingMessage={pendingMessage}
                  onConsumed={() => setPendingMessage(null)}
                  onOpenScriptLibrary={() => setView('script-library')}
                />
              </div>
              <div className="storybook-tab" hidden={active !== 2}><WealthVaultRoom onApproved={handleApproved} /></div>
            </div>
            <StorybookNav active={active} onChange={setActive} />
          </>
        )}
      </div>
      <p className="prototype-label">绘本式 UI 独立提案 · 原版入口保持不变</p>
    </div>
  )
}
