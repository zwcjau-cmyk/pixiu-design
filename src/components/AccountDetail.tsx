import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react'
import { API_BASE, getUserId } from '../config'

interface Product {
  name: string
  amount: number
  buy_date: string
  rate: string
  maturity_date?: string
  code?: string
}

interface Transaction {
  type: 'in' | 'out'
  amount: number
  date: string
  description: string
}

interface AccountData {
  success: boolean
  account_id: string
  label: string
  balance: number
  rate: string
  term?: string
  principal: number
  monthly_profit: number
  products: Product[]
  transactions: Transaction[]
}

interface Props {
  accountId: string
  onBack: () => void
  onWithdraw: (message: string) => void
}

export default function AccountDetail({ accountId, onBack, onWithdraw }: Props) {
  const [data, setData] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawReason, setWithdrawReason] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/api/vault/account/${accountId}?user_id=${getUserId()}`)
      .then(res => res.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [accountId])

  async function handleWithdraw() {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) return
    const res = await fetch(`${API_BASE}/api/vault/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_id: accountId,
        amount: Number(withdrawAmount),
        reason: withdrawReason,
        user_id: getUserId(),
      }),
    })
    const result = await res.json()
    if (result.success) {
      setShowWithdraw(false)
      onWithdraw(result.apply_message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    )
  }

  if (!data || !data.success) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-on-surface-variant">加载失败</p>
        <button onClick={onBack} className="text-primary text-sm">返回</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-surface-container-high/50 via-surface to-surface overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-3 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-primary mb-3"
        >
          <ArrowLeft size={16} />
          <span>返回</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-4 rounded-full bg-primary" />
              <h2 className="text-lg font-bold text-on-surface tracking-tight">{data.label}</h2>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xl font-bold text-on-surface">¥{data.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary-container/60 rounded-full">
                <TrendingUp size={12} className="text-secondary" />
                <span className="text-[11px] text-secondary font-medium">本月 +¥{data.monthly_profit}</span>
              </div>
            </div>
            <p className="text-[10px] text-on-surface-variant/70 mt-1">收益按月初更新，非每日更新</p>
          </div>
          <img src="/images/2D卡通资金池设计 (2).png" alt="资金池" className="w-20 h-20 object-contain" />
        </div>

        {/* 本金与收益摘要 */}
        <div className="flex items-center gap-3 mt-3 px-3 py-2.5 bg-surface-container-low rounded-xl">
          <div className="flex-1 text-center">
            <p className="text-[10px] text-on-surface-variant">本金</p>
            <p className="text-sm font-bold text-on-surface">¥{data.principal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-px h-8 bg-outline-variant/30" />
          <div className="flex-1 text-center">
            <p className="text-[10px] text-on-surface-variant">累计收益</p>
            <p className="text-sm font-bold text-secondary">+¥{(data.balance - data.principal).toFixed(2)}</p>
          </div>
          <div className="w-px h-8 bg-outline-variant/30" />
          <div className="flex-1 text-center">
            <p className="text-[10px] text-on-surface-variant">年化利率</p>
            <p className="text-sm font-bold text-primary">{data.rate}</p>
          </div>
        </div>
      </div>

      {/* 产品明细 */}
      <div className="px-4 pb-3">
        <h3 className="text-sm font-bold text-on-surface mb-2">📋 产品明细</h3>
        <div className="space-y-2">
          {data.products.map((product, idx) => (
            <div key={idx} className="flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border border-outline-variant/15 shadow-sm">
              <div>
                <p className="text-[12px] font-medium text-on-surface">{product.name}</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  买入：{product.buy_date.replace(/-/g, '/')}
                  {product.maturity_date && ` · 到期：${product.maturity_date.replace(/-/g, '/')}`}
                  {product.code && ` · ${product.code}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-bold text-on-surface">¥{product.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-secondary">{product.rate}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 交易明细 */}
      <div className="px-4 pb-3">
        <h3 className="text-sm font-bold text-on-surface mb-2">📝 交易记录</h3>
        <div className="space-y-1.5">
          {data.transactions.map((tx, idx) => (
            <div key={idx} className="flex items-center justify-between px-3 py-2 bg-surface-container-low/60 rounded-xl">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${tx.type === 'in' ? 'bg-secondary-container/60' : 'bg-error-container/60'}`}>
                  {tx.type === 'in'
                    ? <ArrowDownRight size={12} className="text-secondary" />
                    : <ArrowUpRight size={12} className="text-error" />
                  }
                </div>
                <div>
                  <p className="text-[11px] text-on-surface">{tx.description}</p>
                  <p className="text-[9px] text-on-surface-variant">{tx.date}</p>
                </div>
              </div>
              <span className={`text-[12px] font-bold ${tx.type === 'in' ? 'text-secondary' : 'text-error'}`}>
                {tx.type === 'in' ? '+' : '-'}¥{tx.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 转出按钮 */}
      <div className="px-4 pb-6 mt-auto">
        {!showWithdraw ? (
          <button
            onClick={() => setShowWithdraw(true)}
            className="w-full py-3 bg-gradient-to-r from-primary/90 to-primary rounded-xl text-white text-sm font-medium shadow-sm active:scale-[0.98] transition-transform"
          >
            转出
          </button>
        ) : (
          <div className="p-4 bg-white rounded-2xl border border-outline-variant/20 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-on-surface">申请转出</h4>
            <p className="text-[10px] text-on-surface-variant">转出需要向貔貅学长提交申请哦~</p>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="转出金额"
              className="w-full px-3 py-2 border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              placeholder="转出原因（可选）"
              className="w-full px-3 py-2 border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowWithdraw(false)}
                className="flex-1 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface-variant"
              >
                取消
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 py-2.5 bg-primary rounded-xl text-sm text-white font-medium"
              >
                提交申请
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
