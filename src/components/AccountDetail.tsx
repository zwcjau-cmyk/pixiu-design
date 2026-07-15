import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, ArrowDownRight, ArrowUpRight, Loader2, RefreshCw } from 'lucide-react'
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
  is_demo?: boolean
  data_updated_at?: string
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
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function loadAccount() {
    setLoading(true)
    setError('')
    fetch(`${API_BASE}/api/vault/account/${accountId}?user_id=${getUserId()}`)
      .then(res => {
        if (!res.ok) throw new Error('账户详情加载失败')
        return res.json()
      })
      .then(d => {
        if (!d.success) throw new Error(d.message || '账户详情加载失败')
        setData(d)
        setLoading(false)
      })
      .catch((loadError) => {
        setData(null)
        setError(loadError instanceof Error ? loadError.message : '账户详情加载失败')
        setLoading(false)
      })
  }

  useEffect(() => { loadAccount() }, [accountId])

  async function handleWithdraw() {
    const amount = Number(withdrawAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('请输入大于 0 的转出金额')
      return
    }
    if (data && amount > data.balance) {
      setError(`转出金额不能超过当前余额 ¥${data.balance.toFixed(2)}`)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/vault/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId, amount, reason: withdrawReason, user_id: getUserId() }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.message || '申请提交失败')
      setShowWithdraw(false)
      onWithdraw(result.apply_message)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '申请提交失败')
    } finally {
      setSubmitting(false)
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
        <p className="text-sm text-on-surface-variant">{error || '账户详情加载失败'}</p>
        <button onClick={loadAccount} className="flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-sm font-medium text-primary"><RefreshCw size={14} />重新加载</button>
        <button onClick={onBack} className="text-primary text-sm">返回金库</button>
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
              {data.is_demo && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">体验数据</span>}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xl font-bold text-on-surface">¥{data.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary-container/60 rounded-full">
                <TrendingUp size={12} className="text-secondary" />
                <span className="text-xs text-secondary font-medium">本月收益 {data.monthly_profit >= 0 ? '+' : ''}¥{data.monthly_profit}</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-on-surface-variant/80">收益为体验口径，不含转入转出；以页面更新时间为准。</p>
            {data.data_updated_at && <p className="mt-0.5 text-xs text-on-surface-variant/70">数据更新：{data.data_updated_at}</p>}
          </div>
          <img src="/images/2D卡通资金池设计 (2).png" alt="资金池" className="w-20 h-20 object-contain" />
        </div>

        {/* 本金与收益摘要 */}
        <div className="flex items-center gap-3 mt-3 px-3 py-2.5 bg-surface-container-low rounded-xl">
          <div className="flex-1 text-center">
            <p className="text-xs text-on-surface-variant">本金</p>
            <p className="text-sm font-bold text-on-surface">¥{data.principal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-px h-8 bg-outline-variant/30" />
          <div className="flex-1 text-center">
            <p className="text-xs text-on-surface-variant">累计收益</p>
            <p className="text-sm font-bold text-secondary">+¥{(data.balance - data.principal).toFixed(2)}</p>
          </div>
          <div className="w-px h-8 bg-outline-variant/30" />
          <div className="flex-1 text-center">
            <p className="text-xs text-on-surface-variant">{accountId === 'fund_collection' ? '近一月涨跌' : '参考年化'}</p>
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
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  买入：{product.buy_date.replace(/-/g, '/')}
                  {product.maturity_date && ` · 到期：${product.maturity_date.replace(/-/g, '/')}`}
                  {product.code && ` · ${product.code}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-bold text-on-surface">¥{product.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-secondary">{product.rate}</p>
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
                  <p className="text-xs text-on-surface">{tx.description}</p>
                  <p className="text-xs text-on-surface-variant">{tx.date}</p>
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
            <p className="text-xs leading-relaxed text-on-surface-variant">学长会通过你的申请，但也要督促你回顾你的花钱效用。</p>
            {error && <p aria-live="polite" className="rounded-lg bg-error-container/50 px-3 py-2 text-xs text-error">{error}</p>}
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
                disabled={submitting}
                className="flex-1 py-2.5 bg-primary rounded-xl text-sm text-white font-medium disabled:opacity-50"
              >
                {submitting ? '提交中…' : '提交申请'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
