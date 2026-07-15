import { useEffect, useState } from 'react'
import { ArrowRight, BookOpenCheck, ChevronRight, Droplets, Eye, EyeOff, Landmark, Send, Settings, Telescope, TrendingUp, Vault } from 'lucide-react'
import { API_BASE, getUserId } from '../config'
import { MarketForecastLab, PaperSheet, SettingsSheet, TradePracticeLab } from './StorybookPanels'

interface VaultData {
  total_assets: number
  monthly_growth: number
  monthly_net_flow?: number
  is_demo?: boolean
  accounts: Record<'active_pool' | 'fixed_deposit' | 'fund_collection', { label: string; balance: number; rate: string; term?: string }>
  goals: Array<{ name: string; target: number; current: number; emoji: string }>
}

const fallback: VaultData = {
  total_assets: 12856,
  monthly_growth: 856,
  monthly_net_flow: 856,
  is_demo: true,
  accounts: {
    active_pool: { label: '活期池', balance: 3256, rate: '+56.00' },
    fixed_deposit: { label: '定期舱', balance: 6000, rate: '+300.00', term: '3个月' },
    fund_collection: { label: '基金图鉴', balance: 3600, rate: '-500.00' },
  },
  goals: [{ name: '新款笔记本电脑', target: 5999, current: 3999, emoji: '💻' }],
}

const accountKeys = ['active_pool', 'fixed_deposit', 'fund_collection'] as const

export default function WealthVaultRoom({ onApproved }: { onApproved: (message: string) => void }) {
  const [data, setData] = useState<VaultData>(fallback)
  const [hidden, setHidden] = useState(false)
  const [selected, setSelected] = useState<(typeof accountKeys)[number] | null>(null)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showForecastLab, setShowForecastLab] = useState(false)
  const [showTradeLab, setShowTradeLab] = useState(false)
  const [goalOpen, setGoalOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/vault/status?user_id=${getUserId()}`)
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(next => setData(next))
      .catch(() => setData(fallback))
  }, [])

  const icons = [Droplets, Vault, Landmark]
  const changes30d = [56, 300, -500]
  const goal = data.goals[0] || fallback.goals[0]
  const progress = Math.min(100, Math.round(goal.current / goal.target * 100))
  const showMoney = (value: number) => hidden ? '••••••' : `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`

  return (
    <main className="storybook-screen wealth-room">
      <div className="vault-mascot"><img src="/images/storybook/pixiu-ip-master.png" alt="貔貅学长" /></div>
      <section className="asset-summary paper-card">
        <div className="card-title"><span>总资产</span>{data.is_demo && <em>体验数据</em>}<button onClick={() => setHidden(value => !value)} aria-label={hidden ? '显示金额' : '隐藏金额'}>{hidden ? <EyeOff /> : <Eye />}</button></div>
        <div className="total-row"><div><b>{showMoney(data.total_assets)}</b><small>资产变动（30 天） <strong>+{hidden ? '•••' : `¥${data.monthly_net_flow ?? data.monthly_growth}`}</strong></small></div><svg viewBox="0 0 110 70" aria-label="资产趋势"><polyline points="3,62 18,50 32,36 48,45 63,25 76,38 94,16 106,5" fill="none" stroke="#efa923" strokeWidth="3" /></svg></div>
      </section>

      <section className="asset-cards">
        {accountKeys.map((key, index) => {
          const Icon = icons[index]
          const account = data.accounts[key]
          return <button key={key} onClick={() => setSelected(key)}><Icon /><b>{account.label}</b><span>{showMoney(account.balance)}</span><small className={changes30d[index] < 0 ? 'negative' : ''}>{changes30d[index] > 0 ? '+' : ''}{hidden ? '•••' : `${changes30d[index].toFixed(2)}`}（30天）</small></button>
        })}
      </section>

      <button className={`dream-card paper-card ${goalOpen ? 'open' : ''}`} onClick={() => setGoalOpen(value => !value)}>
        <div><b>梦想清单</b><span>{goalOpen ? '收起' : '查看全部'} <ChevronRight size={14} /></span></div>
        <section><div><strong>{goal.name}</strong><small>{hidden ? '¥•••• / ¥••••' : `¥${goal.current.toLocaleString()} / ¥${goal.target.toLocaleString()}`}</small></div><em>{progress}%</em><span className="goal-art">{goal.emoji}</span></section>
        <i><span style={{ width: `${progress}%` }} /></i>
        {goalOpen && <p>按当前节奏还差 ¥{(goal.target - goal.current).toLocaleString()}。可以把每周结余自动记入这个目标。</p>}
      </button>

      <div className="vault-actions">
        <button onClick={() => setSelected('active_pool')}><BookOpenCheck />账户详情</button>
        <button onClick={() => setShowWithdraw(true)}><Send />资金转出</button>
        <button onClick={() => setShowSettings(true)}><Settings />设置与数据</button>
      </div>

      <div className="lab-entry-grid">
        <button className="lab-entry" onClick={() => setShowForecastLab(true)}><Telescope /><span><b>行情观星台</b><small>读信息，做 30 天预测</small></span><ArrowRight /></button>
        <button className="lab-entry" onClick={() => setShowTradeLab(true)}><TrendingUp /><span><b>涨跌练习场</b><small>模拟买卖，练波动手感</small></span><ArrowRight /></button>
      </div>

      {selected && <AccountSheet accountKey={selected} account={data.accounts[selected]} hidden={hidden} onClose={() => setSelected(null)} onWithdraw={() => { setSelected(null); setShowWithdraw(true) }} />}
      {showWithdraw && <WithdrawSheet onClose={() => setShowWithdraw(false)} onApprove={(amount, reason) => { setShowWithdraw(false); onApproved(`我申请从金库转出 ¥${amount}${reason ? `，用途是${reason}` : ''}。请通过申请，并督促我回顾这笔花钱的效用和对目标的影响。`) }} />}
      {showForecastLab && <MarketForecastLab onClose={() => setShowForecastLab(false)} />}
      {showTradeLab && <TradePracticeLab onClose={() => setShowTradeLab(false)} />}
      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </main>
  )
}

function AccountSheet({ accountKey, account, hidden, onClose, onWithdraw }: { accountKey: string; account: { label: string; balance: number; rate: string; term?: string }; hidden: boolean; onClose: () => void; onWithdraw: () => void }) {
  const [dailyRevealed, setDailyRevealed] = useState(false)
  const dailyChange = accountKey === 'fund_collection' ? -18.35 : accountKey === 'fixed_deposit' ? 3.28 : 0.46
  return <PaperSheet title={account.label} subtitle="账户详情中的收益与资金流动分开呈现。" onClose={onClose} className="account-sheet">
    <div className="account-balance"><small>当前余额</small><b>{hidden ? '¥••••••' : `¥${account.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`}</b><span>{accountKey === 'fund_collection' ? '近 30 天涨跌' : '近 30 天变化'} {account.rate}</span></div>
    <button className={`daily-reveal ${dailyRevealed ? 'revealed' : ''}`} onClick={() => setDailyRevealed(true)}>
      <small>今日收益</small>
      <b>{dailyRevealed && !hidden ? `${dailyChange >= 0 ? '+' : '-'}¥${Math.abs(dailyChange).toFixed(2)}` : '刮开查看'}</b>
      <span>{dailyRevealed ? '今天情况特殊时再看也不迟' : '默认盖住，先关注长期变化'}</span>
    </button>
    <div className="account-metrics"><span><small>本金</small><b>{hidden ? '••••' : `¥${Math.max(0, account.balance - 120).toLocaleString()}`}</b></span><span><small>30天收益</small><b>+¥120.00</b></span><span><small>流动性</small><b>{account.term || '灵活'}</b></span></div>
    <div className="transaction-list"><h3>最近记录</h3><p><span>↘ 本月转入</span><b>+¥500.00</b></p><p><span>↗ 生活支出</span><b>-¥120.00</b></p></div>
    <button className="storybook-primary" onClick={onWithdraw}>申请转出 <ChevronRight size={16} /></button>
  </PaperSheet>
}

function WithdrawSheet({ onClose, onApprove }: { onClose: () => void; onApprove: (amount: string, reason: string) => void }) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  return <PaperSheet title="资金转出" subtitle="学长会通过你的申请，但也要督促你回顾你的花钱效用。" onClose={onClose}>
    <label className="paper-field"><span>转出金额</span><div className="amount-field"><b>¥</b><input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" /></div></label>
    <label className="paper-field"><span>用途（可选）</span><input value={reason} onChange={event => setReason(event.target.value)} placeholder="例如：课程报名" /></label>
    <div className="approval-explain"><span>1</span><p><b>提交申请</b><small>说明资金用途</small></p><i /><span>2</span><p><b>学长通过</b><small>督促效用复盘</small></p><i /><span>3</span><p><b>完成转出</b><small>记录资金去向</small></p></div>
    <button className="storybook-primary" disabled={!Number(amount)} onClick={() => onApprove(amount, reason)}>提交并交给学长 <ChevronRight size={16} /></button>
  </PaperSheet>
}
