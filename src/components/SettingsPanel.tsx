import { useRef, useState } from 'react'
import { Database, FileSpreadsheet, Link2, Loader2, ShieldCheck, Trash2, X } from 'lucide-react'
import { API_BASE, getUserId } from '../config'

interface ImportRecord {
  date: string
  type: 'expense' | 'income'
  category: string
  amount: number
  description: string
}

interface Props {
  onClose: () => void
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"' && line[index + 1] === '"') {
      current += '"'
      index += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current.trim())
  return cells
}

function parseCsv(content: string): ImportRecord[] {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim())
  if (lines.length < 2) throw new Error('CSV 中没有可导入的账单记录')

  const headers = parseCsvLine(lines[0]).map(header => header.toLowerCase())
  const findColumn = (...names: string[]) => headers.findIndex(header => names.includes(header))
  const dateIndex = findColumn('date', '日期', '交易日期')
  const typeIndex = findColumn('type', '类型', '收支类型')
  const categoryIndex = findColumn('category', '分类', '类别')
  const amountIndex = findColumn('amount', '金额', '交易金额')
  const descriptionIndex = findColumn('description', '备注', '说明', '交易说明')

  if (dateIndex < 0 || amountIndex < 0) {
    throw new Error('CSV 至少需要“日期/date”和“金额/amount”两列')
  }

  return lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line)
    const rawType = typeIndex >= 0 ? cells[typeIndex]?.toLowerCase() : 'expense'
    const type = ['income', '收入', '入账'].includes(rawType) ? 'income' : 'expense'
    const amount = Math.abs(Number((cells[amountIndex] || '').replace(/[¥￥,]/g, '')))
    const date = cells[dateIndex]?.replace(/\//g, '-')

    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(date || '') || !Number.isFinite(amount) || amount <= 0) {
      throw new Error(`第 ${index + 2} 行的日期或金额格式不正确`)
    }

    return {
      date,
      type,
      category: categoryIndex >= 0 ? cells[categoryIndex] || '其他' : '其他',
      amount,
      description: descriptionIndex >= 0 ? cells[descriptionIndex] || '' : '',
    }
  })
}

export default function SettingsPanel({ onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [records, setRecords] = useState<ImportRecord[]>([])
  const [fileName, setFileName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleFile(file?: File) {
    if (!file) return
    try {
      const parsed = parseCsv(await file.text())
      setRecords(parsed)
      setFileName(file.name)
      setMessage(`已读取 ${parsed.length} 条记录，请确认后导入`)
    } catch (error) {
      setRecords([])
      setFileName('')
      setMessage(error instanceof Error ? error.message : '账单解析失败')
    }
  }

  async function confirmImport() {
    if (!records.length || loading) return
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/expense/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: getUserId(), records }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.detail || result.message || '导入失败')
      setMessage(`导入完成：新增 ${result.imported_count} 条，跳过 ${result.skipped_count} 条重复记录`)
      setRecords([])
      setFileName('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '导入失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  async function clearFinanceData() {
    if (!window.confirm('确认清除当前浏览器对应的账单、金库和宝物架数据吗？此操作不可撤销。')) return
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/user/finance-data?user_id=${getUserId()}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('清除失败')
      localStorage.removeItem('pixiu_user_id_v2')
      sessionStorage.clear()
      window.location.reload()
    } catch {
      setMessage('数据清除失败，请稍后再试')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="relative w-[344px] max-h-[76vh] overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <button aria-label="关闭设置" onClick={onClose} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low">
          <X size={16} />
        </button>

        <h2 id="settings-title" className="text-lg font-bold text-on-surface">设置与数据</h2>
        <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">当前无需注册，数据使用本浏览器生成的随机编号进行隔离。</p>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-primary" />
              <h3 className="text-sm font-bold">导入账单</h3>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">支持 CSV。字段至少包含日期和金额，也可包含类型、分类与备注。</p>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" aria-hidden="true" tabIndex={-1} className="hidden" onChange={event => handleFile(event.target.files?.[0])} />
            <button onClick={() => fileInputRef.current?.click()} className="mt-3 w-full rounded-xl bg-primary-container py-2.5 text-sm font-medium text-primary">
              选择 CSV 文件
            </button>
            {fileName && <p className="mt-2 truncate text-xs text-on-surface-variant">{fileName}</p>}
            {records.length > 0 && (
              <div className="mt-2 rounded-xl bg-white p-2 text-xs text-on-surface-variant">
                {records.slice(0, 3).map((record, index) => (
                  <p key={`${record.date}-${index}`}>{record.date} · {record.category} · {record.type === 'income' ? '+' : '-'}¥{record.amount}</p>
                ))}
                {records.length > 3 && <p>另有 {records.length - 3} 条…</p>}
              </div>
            )}
            {records.length > 0 && (
              <button disabled={loading} onClick={confirmImport} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-white disabled:opacity-50">
                {loading && <Loader2 size={14} className="animate-spin" />}确认导入
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
            <div className="flex items-center gap-2">
              <Link2 size={18} className="text-secondary" />
              <h3 className="text-sm font-bold">账单同步</h3>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">微信、支付宝和银行卡同步需要各平台正式授权，当前版本不读取任何账户密码。</p>
            <div className="mt-2 flex gap-2">
              {['微信', '支付宝', '银行卡'].map(channel => (
                <span key={channel} className="rounded-full bg-white px-2.5 py-1.5 text-xs text-outline">{channel} · 待接入</span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
            <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-secondary" /><h3 className="text-sm font-bold">隐私说明</h3></div>
            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">账单文件在你确认前只在本机解析；商品图片确认上传后会用于识别并生成宝物贴纸。请勿上传包含身份证、银行卡号或他人隐私的图片。</p>
          </div>

          <div className="rounded-2xl border border-error/15 bg-error-container/30 p-4">
            <div className="flex items-center gap-2"><Database size={18} className="text-error" /><h3 className="text-sm font-bold">当前浏览器数据</h3></div>
            <button disabled={loading} onClick={clearFinanceData} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-error/20 bg-white py-2.5 text-sm font-medium text-error disabled:opacity-50">
              <Trash2 size={14} />清除财务数据
            </button>
          </div>
        </div>

        {message && <p aria-live="polite" className="mt-3 rounded-xl bg-primary-container/40 p-2.5 text-xs leading-relaxed text-on-surface">{message}</p>}
      </section>
    </div>
  )
}
