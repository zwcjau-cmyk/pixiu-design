import { useState, useEffect } from 'react'
import { Droplets, Lock, BookOpen, ChevronRight, TrendingUp, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import AccountDetail from './AccountDetail'
import { API_BASE, getUserId } from '../config'

const ACCOUNT_IDS = ['active_pool', 'fixed_deposit', 'fund_collection'] as const

interface VaultData {
  total_assets: number
  monthly_growth: number
  monthly_net_flow?: number
  is_demo?: boolean
  data_updated_at?: string
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function loadVaultData() {
    setLoading(true)
    setError('')
    fetch(`${API_BASE}/api/vault/status?user_id=${getUserId()}`)
      .then(res => {
        if (!res.ok) throw new Error('金库暂时无法连接')
        return res.json()
      })
      .then(data => setVaultData(data))
      .catch(() => {
        setVaultData(null)
        setError('金库数据加载失败。为避免误导，当前不会显示模拟余额。')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadVaultData() }, [])

  // 每次切换到此 tab 时刷新
  useEffect(() => {
    if (isActive) loadVaultData()
  }, [isActive])

  if (loading && !vaultData) {
    return <div className="flex h-full items-center justify-center"><Loader2 size={24} className="animate-spin text-primary" aria-label="正在加载金库" /></div>
  }

  if (!vaultData || error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <AlertCircle size={28} className="text-error" />
        <p className="text-sm leading-relaxed text-on-surface-variant">{error || '金库数据暂时不可用'}</p>
        <button onClick={loadVaultData} className="flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-sm font-medium text-primary"><RefreshCw size={14} />重新加载</button>
      </div>
    )
  }

  const totalAssets = `¥${vaultData.total_assets.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
  const assetChange = vaultData.monthly_net_flow ?? vaultData.monthly_growth
  const monthlyGrowth = `资产变动 ${assetChange >= 0 ? '+' : ''}¥${assetChange}`

  const assetCards = [
        {
          icon: Droplets,
          title: vaultData.accounts.active_pool.label,
          amount: `¥${vaultData.accounts.active_pool.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
          subtitle: `参考年化 ${vaultData.accounts.active_pool.rate} · 灵活取用`,
          color: 'from-[#87CEEB]/20 to-[#B0E0E6]/10',
          iconColor: 'text-[#4A90D9]',
          borderColor: 'border-[#87CEEB]/30',
        },
        {
          icon: Lock,
          title: vaultData.accounts.fixed_deposit.label,
          amount: `¥${vaultData.accounts.fixed_deposit.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
          subtitle: `${vaultData.accounts.fixed_deposit.term} · 参考年化 ${vaultData.accounts.fixed_deposit.rate}`,
          color: 'from-amber-warm/10 to-gold/5',
          iconColor: 'text-amber-warm',
          borderColor: 'border-amber-warm/20',
        },
        {
          icon: BookOpen,
          title: vaultData.accounts.fund_collection.label,
          amount: `¥${vaultData.accounts.fund_collection.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
          subtitle: `近一月涨跌 ${vaultData.accounts.fund_collection.rate} · 净值波动`,
          color: 'from-sage/15 to-secondary/5',
          iconColor: 'text-sage',
          borderColor: 'border-sage/30',
        },
      ]

  const goals = vaultData.goals.map(g => ({
        name: g.name,
        progress: Math.round((g.current / g.target) * 100),
        amount: `¥${g.current.toLocaleString('zh-CN')}/¥${g.target.toLocaleString('zh-CN')}`,
        emoji: g.emoji,
      }))

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
            {vaultData.is_demo && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">体验数据</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xl font-bold text-on-surface font-body">{totalAssets}</p>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary-container/60 rounded-full">
              <TrendingUp size={12} className="text-secondary" />
              <span className="text-xs text-secondary font-medium">{monthlyGrowth}</span>
            </div>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-on-surface-variant/80">资产变动包含转入、转出与收益，不等同于投资收益。</p>
          {vaultData.data_updated_at && <p className="mt-0.5 text-xs text-on-surface-variant/70">数据更新：{vaultData.data_updated_at}</p>}
        </div>
        <img src="/images/2D卡通资金池设计 (2).png" alt="资金池" className="w-16 h-16 object-contain" />
      </div>

      {/* Asset classification cards */}
      <div className="space-y-2.5">
        {assetCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <button
              type="button"
              key={idx}
              onClick={() => setSelectedAccount(ACCOUNT_IDS[idx])}
              className={`flex w-full items-center gap-3 p-3.5 text-left rounded-xl bg-gradient-to-r ${card.color} border ${card.borderColor} hover:shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.98]`}
            >
              <div className={`w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center ${card.iconColor} shadow-sm`}>
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-on-surface">{card.title}</p>
                <p className="mt-0.5 text-xs text-on-surface-variant">{card.subtitle}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-on-surface">{card.amount}</p>
              </div>
              <ChevronRight size={16} className="text-outline-variant" />
            </button>
          )
        })}
      </div>

      {/* Goals section */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-bold text-on-surface">🎯 梦想清单</h3>
          <span className="text-xs text-on-surface-variant">{goals.length} 个目标</span>
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
                <span className="text-xs text-on-surface-variant">{goal.amount}</span>
              </div>
              <div className="relative h-2 bg-beige rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-700"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-on-surface-variant">
                {goal.progress}% 已完成
              </p>
            </div>
          ))}
        </div>
      </div>


    </div>
  )
}
