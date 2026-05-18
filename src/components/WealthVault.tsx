import { useState, useEffect } from 'react'
import { Droplets, Lock, BookOpen, ChevronRight, TrendingUp } from 'lucide-react'
import AccountDetail from './AccountDetail'
import { API_BASE, getUserId } from '../config'

const defaultGoals = [
  { name: 'AirPods Pro', progress: 72, amount: '¥1,295/¥1,799', emoji: '🎧' },
  { name: '毕业旅行基金', progress: 45, amount: '¥2,250/¥5,000', emoji: '✈️' },
  { name: '新款iPad', progress: 28, amount: '¥980/¥3,499', emoji: '📱' },
]

const ACCOUNT_IDS = ['active_pool', 'fixed_deposit', 'fund_collection'] as const

const defaultAssetCards = [
  {
    icon: Droplets,
    title: '活期池',
    amount: '¥3,428.50',
    subtitle: '年化 1.8%',
    color: 'from-[#87CEEB]/20 to-[#B0E0E6]/10',
    iconColor: 'text-[#4A90D9]',
    borderColor: 'border-[#87CEEB]/30',
  },
  {
    icon: Lock,
    title: '定期舱',
    amount: '¥8,000.00',
    subtitle: '90天 · 年化 3.2%',
    color: 'from-amber-warm/10 to-gold/5',
    iconColor: 'text-amber-warm',
    borderColor: 'border-amber-warm/20',
  },
  {
    icon: BookOpen,
    title: '基金图鉴',
    amount: '¥2,150.80',
    subtitle: '本月 +2.3%',
    color: 'from-sage/15 to-secondary/5',
    iconColor: 'text-sage',
    borderColor: 'border-sage/30',
  },
]

interface VaultData {
  total_assets: number
  monthly_growth: number
  accounts: {
    active_pool: { label: string; balance: number; rate: string }
    fixed_deposit: { label: string; balance: number; rate: string; term: string }
    fund_collection: { label: string; balance: number; rate: string }
  }
  goals: Array<{ name: string; target: number; current: number; emoji: string }>
}

export default function WealthVault({ isActive, onSwitchToAgent }: { isActive?: boolean; onSwitchToAgent?: (message: string) => void }) {
  const [vaultData, setVaultData] = useState<VaultData | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)

  function loadVaultData() {
    fetch(`${API_BASE}/api/vault/status?user_id=${getUserId()}`)
      .then(res => res.json())
      .then(data => setVaultData(data))
      .catch(() => {})
  }

  useEffect(() => { loadVaultData() }, [])

  // 每次切换到此 tab 时刷新
  useEffect(() => {
    if (isActive) loadVaultData()
  }, [isActive])

  const totalAssets = vaultData ? `¥${vaultData.total_assets.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : '¥13,579.30'
  const monthlyGrowth = vaultData ? `本月 +¥${vaultData.monthly_growth}` : '本月 +¥856'

  const assetCards = vaultData
    ? [
        {
          icon: Droplets,
          title: vaultData.accounts.active_pool.label,
          amount: `¥${vaultData.accounts.active_pool.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
          subtitle: `年化 ${vaultData.accounts.active_pool.rate}`,
          color: 'from-[#87CEEB]/20 to-[#B0E0E6]/10',
          iconColor: 'text-[#4A90D9]',
          borderColor: 'border-[#87CEEB]/30',
        },
        {
          icon: Lock,
          title: vaultData.accounts.fixed_deposit.label,
          amount: `¥${vaultData.accounts.fixed_deposit.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
          subtitle: `${vaultData.accounts.fixed_deposit.term} · 年化 ${vaultData.accounts.fixed_deposit.rate}`,
          color: 'from-amber-warm/10 to-gold/5',
          iconColor: 'text-amber-warm',
          borderColor: 'border-amber-warm/20',
        },
        {
          icon: BookOpen,
          title: vaultData.accounts.fund_collection.label,
          amount: `¥${vaultData.accounts.fund_collection.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
          subtitle: `本月 ${vaultData.accounts.fund_collection.rate}`,
          color: 'from-sage/15 to-secondary/5',
          iconColor: 'text-sage',
          borderColor: 'border-sage/30',
        },
      ]
    : defaultAssetCards

  const goals = vaultData
    ? vaultData.goals.map(g => ({
        name: g.name,
        progress: Math.round((g.current / g.target) * 100),
        amount: `¥${g.current.toLocaleString('zh-CN')}/¥${g.target.toLocaleString('zh-CN')}`,
        emoji: g.emoji,
      }))
    : defaultGoals

  // 如果选中了某个账户，显示详情子页面
  if (selectedAccount) {
    return (
      <AccountDetail
        accountId={selectedAccount}
        onBack={() => setSelectedAccount(null)}
        onWithdraw={(message) => {
          setSelectedAccount(null)
          if (onSwitchToAgent) onSwitchToAgent(message)
        }}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-surface-container-high/50 via-surface to-surface px-4 py-3 space-y-4 overflow-y-auto">
      {/* Total assets summary */}
      <div className="flex items-start justify-between px-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 rounded-full bg-primary" />
            <h2 className="text-lg font-bold text-on-surface tracking-tight">总资产</h2>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xl font-bold text-on-surface font-body">{totalAssets}</p>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary-container/60 rounded-full">
              <TrendingUp size={12} className="text-secondary" />
              <span className="text-[11px] text-secondary font-medium">{monthlyGrowth}</span>
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant/70 mt-1">理财类产品都以月初的收益计算，并不是每日更新。</p>
        </div>
        <img src="/images/2D卡通资金池设计 (2).png" alt="资金池" className="w-16 h-16 object-contain" />
      </div>

      {/* Asset classification cards */}
      <div className="space-y-2.5">
        {assetCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div
              key={idx}
              onClick={() => setSelectedAccount(ACCOUNT_IDS[idx])}
              className={`flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r ${card.color} border ${card.borderColor} hover:shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.98]`}
            >
              <div className={`w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center ${card.iconColor} shadow-sm`}>
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-on-surface">{card.title}</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">{card.subtitle}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-on-surface">{card.amount}</p>
              </div>
              <ChevronRight size={16} className="text-outline-variant" />
            </div>
          )
        })}
      </div>

      {/* Goals section */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-bold text-on-surface">🎯 梦想清单</h3>
          <span className="text-[11px] text-primary font-medium">查看全部</span>
        </div>
        <div className="space-y-2.5">
          {goals.map((goal, idx) => (
            <div
              key={idx}
              className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{goal.emoji}</span>
                  <span className="text-sm font-medium text-on-surface">{goal.name}</span>
                </div>
                <span className="text-[11px] text-on-surface-variant">{goal.amount}</span>
              </div>
              <div className="relative h-2 bg-beige rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-700"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-on-surface-variant mt-1 text-right">
                {goal.progress}% 已完成
              </p>
            </div>
          ))}
        </div>
      </div>


    </div>
  )
}
