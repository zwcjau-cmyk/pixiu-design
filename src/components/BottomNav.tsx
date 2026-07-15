interface BottomNavProps {
  activeTab: number
  onTabChange: (tab: number) => void
}

const tabs = [
  { img: '/images/藏宝阁.png', label: '藏宝阁', px: 24, float: false },
  { img: '/images/貔貅空间.png', label: '貔貅空间', px: 24, float: false },
  { img: '/images/财富金库.png', label: '财富金库', px: 24, float: false },
]

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="relative flex items-end justify-around px-4 py-2 pb-6 bg-surface-container-low border-t border-outline-variant/30">
      {tabs.map((tab, index) => {
        const isActive = activeTab === index
        return (
          <button
            key={index}
            onClick={() => onTabChange(index)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 min-w-[72px] ${
              isActive
                ? 'bg-primary-container text-primary scale-105'
                : 'text-on-surface-variant hover:text-primary'
            } ${tab.float ? 'relative z-10' : ''}`}
          >
            <div className={`relative ${isActive ? 'animate-bounce-in' : ''} ${tab.float ? '-mt-5' : ''}`}>
              <img
                src={tab.img}
                alt={tab.label}
                style={{ width: tab.px, height: tab.px }}
                className={`object-contain transition-all duration-300 ${
                  isActive ? 'opacity-100' : 'opacity-60'
                }`}
              />
              {isActive && !tab.float && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
            <span className={`text-xs font-medium transition-all duration-300 ${
              isActive ? 'font-bold' : ''
            }`}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
