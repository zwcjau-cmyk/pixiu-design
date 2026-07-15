import { Archive, Landmark } from 'lucide-react'

const tabs = [
  { icon: Archive, label: '藏宝阁' },
  { img: '/images/storybook/pixiu-ip-master.png', label: '貔貅空间' },
  { icon: Landmark, label: '财富金库' },
]

export default function StorybookNav({ active, onChange }: { active: number; onChange: (tab: number) => void }) {
  return (
    <nav className="storybook-nav" aria-label="主要功能">
      {tabs.map((tab, index) => (
        <button
          type="button"
          key={tab.label}
          className={active === index ? 'is-active' : ''}
          onClick={() => onChange(index)}
          aria-current={active === index ? 'page' : undefined}
        >
          <span className="storybook-nav-icon">
            {'img' in tab && tab.img ? <img src={tab.img} alt="" /> : 'icon' in tab && tab.icon ? <tab.icon aria-hidden="true" /> : null}
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
