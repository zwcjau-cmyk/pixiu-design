import { useState, useEffect } from 'react'
import PixiuSpace from './components/PixiuSpace'
import WealthVault from './components/WealthVault'
import TreasurePavilion from './components/TreasurePavilion'
import BottomNav from './components/BottomNav'

function App() {
  const initialTab = 1
  const [activeTab, setActiveTab] = useState(initialTab)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date()
    return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
  })

  // 每分钟更新状态栏时间
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`)
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // 转出申请：切到貔貅空间并预填消息
  function handleSwitchToAgent(message: string) {
    setPendingMessage(message)
    setActiveTab(1) // 切到貔貅空间
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#E8DDD4] p-4">
      {/* Phone mockup frame */}
      <div className="relative w-[390px] h-[844px] bg-surface rounded-[44px] shadow-2xl overflow-hidden border-[8px] border-[#2C2420] flex flex-col">
        {/* Status bar */}
        <div className="flex items-center justify-between px-8 pt-3 pb-1 bg-surface">
          <span className="text-xs font-medium text-on-surface-variant">{currentTime}</span>
          <div className="w-[80px] h-[24px] bg-[#2C2420] rounded-full mx-auto" />
          <div className="flex items-center gap-1">
            <div className="w-4 h-2.5 border border-on-surface-variant rounded-sm relative">
              <div className="absolute inset-0.5 bg-on-surface-variant rounded-[1px]" />
            </div>
          </div>
        </div>

        {/* Content area - 用 display 控制显隐，避免组件卸载丢失状态 */}
        <div className="flex-1 overflow-hidden relative">
          <div className="h-full overflow-y-auto overflow-x-hidden" style={{ display: activeTab === 0 ? 'block' : 'none' }}>
            <TreasurePavilion isActive={activeTab === 0} />
          </div>
          <div className="h-full overflow-y-auto overflow-x-hidden" style={{ display: activeTab === 1 ? 'flex' : 'none', flexDirection: 'column' }}>
            <PixiuSpace isActive={activeTab === 1} pendingMessage={pendingMessage} onMessageConsumed={() => setPendingMessage(null)} />
          </div>
          <div className="h-full overflow-y-auto overflow-x-hidden" style={{ display: activeTab === 2 ? 'block' : 'none' }}>
            <WealthVault isActive={activeTab === 2} onSwitchToAgent={handleSwitchToAgent} />
          </div>
        </div>

        {/* Bottom navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  )
}

export default App
