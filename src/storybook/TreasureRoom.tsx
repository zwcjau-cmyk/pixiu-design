import { useEffect, useMemo, useState } from 'react'
import { Bell, BookOpen, ChevronLeft, ChevronRight, Trophy } from 'lucide-react'
import { API_BASE, getUserId } from '../config'
import { PaperSheet } from './StorybookPanels'

type ShelfItem = { name: string; img: string; price?: string; date?: string }
type LedgerRecord = { date: string; category: string; amount: number; type: 'income' | 'expense'; description: string }

const shelfItems: ShelfItem[] = [
  { name: '蓝晶目标石', img: '/images/item2.png' },
  { name: '忍住没买药水', img: '/images/item1.png' },
  { name: '月光账本', img: '/images/item3.png' },
  { name: '第一桶金宝箱', img: '/images/item4.png' },
]

const week = ['一', '二', '三', '四', '五', '六', '日']

const julyMockRecords: LedgerRecord[] = [
  { date: '2026-07-01', category: '生活费', amount: 3000, type: 'income', description: '妈妈转了七月生活费' },
  { date: '2026-07-01', category: '餐饮', amount: 22, type: 'expense', description: '食堂午饭+酸奶' },
  { date: '2026-07-02', category: '餐饮', amount: 18, type: 'expense', description: '早餐豆浆油条' },
  { date: '2026-07-02', category: '交通', amount: 6, type: 'expense', description: '公交去图书馆' },
  { date: '2026-07-03', category: '学习', amount: 68, type: 'expense', description: '打印资料和买笔记本' },
  { date: '2026-07-03', category: '餐饮', amount: 25, type: 'expense', description: '奶茶+午饭' },
  { date: '2026-07-04', category: '餐饮', amount: 42, type: 'expense', description: '和同学吃麻辣烫' },
  { date: '2026-07-04', category: '娱乐', amount: 35, type: 'expense', description: '周末电影票' },
  { date: '2026-07-05', category: '购物', amount: 128, type: 'expense', description: '换季 T 恤' },
  { date: '2026-07-05', category: '餐饮', amount: 20, type: 'expense', description: '食堂晚饭' },
  { date: '2026-07-06', category: '餐饮', amount: 16, type: 'expense', description: '食堂午饭' },
  { date: '2026-07-06', category: '交通', amount: 8, type: 'expense', description: '地铁返校' },
  { date: '2026-07-07', category: '餐饮', amount: 23, type: 'expense', description: '午饭+水果' },
  { date: '2026-07-08', category: '兼职', amount: 500, type: 'income', description: '家教课时费到账' },
  { date: '2026-07-08', category: '餐饮', amount: 19, type: 'expense', description: '食堂晚饭' },
  { date: '2026-07-09', category: '购物', amount: 56, type: 'expense', description: '日用品补货' },
  { date: '2026-07-09', category: '餐饮', amount: 18, type: 'expense', description: '早餐+午饭' },
  { date: '2026-07-10', category: '餐饮', amount: 32, type: 'expense', description: '外卖黄焖鸡' },
  { date: '2026-07-10', category: '其他', amount: 30, type: 'expense', description: '话费充值' },
  { date: '2026-07-11', category: '餐饮', amount: 45, type: 'expense', description: '和室友烧烤 AA' },
  { date: '2026-07-11', category: '娱乐', amount: 39, type: 'expense', description: '桌游馆' },
  { date: '2026-07-12', category: '餐饮', amount: 28, type: 'expense', description: '早午餐' },
  { date: '2026-07-12', category: '交通', amount: 12, type: 'expense', description: '地铁去市区' },
  { date: '2026-07-13', category: '购物', amount: 88, type: 'expense', description: '防晒和洗面奶' },
  { date: '2026-07-13', category: '餐饮', amount: 24, type: 'expense', description: '食堂午晚饭' },
  { date: '2026-07-14', category: '餐饮', amount: 18, type: 'expense', description: '食堂午饭' },
  { date: '2026-07-14', category: '学习', amount: 45, type: 'expense', description: '课程资料包' },
  { date: '2026-07-15', category: '兼职', amount: 300, type: 'income', description: '社团活动补贴' },
  { date: '2026-07-15', category: '餐饮', amount: 21, type: 'expense', description: '午饭+酸奶' },
  { date: '2026-07-16', category: '餐饮', amount: 17, type: 'expense', description: '食堂午饭' },
  { date: '2026-07-16', category: '交通', amount: 6, type: 'expense', description: '公交去兼职' },
  { date: '2026-07-17', category: '餐饮', amount: 34, type: 'expense', description: '外卖晚饭' },
  { date: '2026-07-18', category: '购物', amount: 76, type: 'expense', description: '运动袜和洗衣液' },
  { date: '2026-07-18', category: '餐饮', amount: 26, type: 'expense', description: '奶茶+面包' },
  { date: '2026-07-19', category: '娱乐', amount: 52, type: 'expense', description: '密室逃脱 AA' },
  { date: '2026-07-19', category: '餐饮', amount: 20, type: 'expense', description: '食堂晚饭' },
  { date: '2026-07-20', category: '其他', amount: 30, type: 'expense', description: '话费充值' },
  { date: '2026-07-20', category: '餐饮', amount: 18, type: 'expense', description: '食堂午饭' },
  { date: '2026-07-21', category: '奖学金', amount: 800, type: 'income', description: '学院竞赛奖励' },
  { date: '2026-07-21', category: '餐饮', amount: 22, type: 'expense', description: '食堂午晚饭' },
  { date: '2026-07-22', category: '学习', amount: 99, type: 'expense', description: '线上课程月卡' },
  { date: '2026-07-22', category: '餐饮', amount: 19, type: 'expense', description: '早餐+午饭' },
  { date: '2026-07-23', category: '餐饮', amount: 37, type: 'expense', description: '和同学吃烤鱼' },
  { date: '2026-07-23', category: '交通', amount: 10, type: 'expense', description: '地铁往返' },
  { date: '2026-07-24', category: '购物', amount: 64, type: 'expense', description: '文具和收纳盒' },
  { date: '2026-07-24', category: '餐饮', amount: 25, type: 'expense', description: '午饭+水果' },
  { date: '2026-07-25', category: '餐饮', amount: 48, type: 'expense', description: '朋友聚餐 AA' },
  { date: '2026-07-25', category: '娱乐', amount: 45, type: 'expense', description: 'KTV AA' },
  { date: '2026-07-26', category: '餐饮', amount: 20, type: 'expense', description: '食堂晚饭' },
  { date: '2026-07-26', category: '交通', amount: 8, type: 'expense', description: '公交出门' },
  { date: '2026-07-27', category: '购物', amount: 120, type: 'expense', description: '护肤品补货' },
  { date: '2026-07-27', category: '餐饮', amount: 18, type: 'expense', description: '食堂午饭' },
  { date: '2026-07-28', category: '餐饮', amount: 24, type: 'expense', description: '午饭+酸奶' },
  { date: '2026-07-28', category: '学习', amount: 36, type: 'expense', description: '打印复习资料' },
  { date: '2026-07-29', category: '餐饮', amount: 31, type: 'expense', description: '外卖盖饭' },
  { date: '2026-07-30', category: '餐饮', amount: 19, type: 'expense', description: '食堂午饭' },
  { date: '2026-07-30', category: '其他', amount: 30, type: 'expense', description: '校园网充值' },
  { date: '2026-07-31', category: '餐饮', amount: 52, type: 'expense', description: '月底聚餐 AA' },
  { date: '2026-07-31', category: '交通', amount: 12, type: 'expense', description: '地铁去商场' },
]

function getMonthRecords(year: number, month: number, records: LedgerRecord[]) {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`
  return records.filter(record => record.date.startsWith(prefix))
}

function summarize(records: LedgerRecord[]) {
  const income = records.filter(record => record.type === 'income').reduce((sum, record) => sum + record.amount, 0)
  const expense = records.filter(record => record.type === 'expense').reduce((sum, record) => sum + record.amount, 0)
  return { income, expense, balance: income - expense }
}

function formatSigned(value: number) {
  if (!value) return '0'
  return `${value > 0 ? '+' : '-'}${Math.abs(value)}`
}

function monthCells(year: number, month: number) {
  const first = new Date(year, month - 1, 1).getDay()
  const offset = first === 0 ? 6 : first - 1
  const days = new Date(year, month, 0).getDate()
  return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)]
}

export default function TreasureRoom({ isActive }: { isActive?: boolean }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState(now.getDate())
  const [panel, setPanel] = useState<'achievement' | 'gallery' | 'notice' | 'shelf' | 'month' | null>(null)
  const [cabinetSelected, setCabinetSelected] = useState(false)
  const julySummary = summarize(julyMockRecords)
  const [summary, setSummary] = useState({ ...julySummary, lastMonth: 856, budget: 68, isDemo: true })
  const [ledgerRecords, setLedgerRecords] = useState<LedgerRecord[]>(julyMockRecords)
  const [dynamicItems, setDynamicItems] = useState<ShelfItem[]>([])

  useEffect(() => {
    if (!isActive) return
    fetch(`${API_BASE}/api/expense/summary?user_id=${getUserId()}`)
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => {
        const records = Array.isArray(data.records) ? data.records.map((item: { date: string; category: string; amount: number; type: 'income' | 'expense'; description?: string }) => ({
          date: item.date,
          category: item.category,
          amount: Number(item.amount || 0),
          type: item.type,
          description: item.description || item.category,
        })) : []
        const nextRecords = records.length ? records : julyMockRecords
        setLedgerRecords(nextRecords)
        const monthRecords = getMonthRecords(year, month, nextRecords)
        const nextSummary = summarize(monthRecords.length ? monthRecords : julyMockRecords)
        setSummary(current => ({ ...current, ...nextSummary, isDemo: Boolean(data.is_demo) || !records.length }))
      })
      .catch(() => {})
  }, [isActive, year, month])

  useEffect(() => {
    if (!isActive) return
    fetch(`${API_BASE}/api/sticker/shelf?user_id=${getUserId()}`)
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => {
        const items = Array.isArray(data.items) ? data.items : []
        setDynamicItems(items.map((item: { name: string; price?: number; sticker_url: string; date?: string }) => ({
          name: item.name,
          price: typeof item.price === 'number' ? `¥${item.price}` : undefined,
          img: item.sticker_url.startsWith('http') ? item.sticker_url : `${API_BASE}${item.sticker_url}`,
          date: item.date,
        })))
      })
      .catch(() => {})
  }, [isActive])

  const cells = useMemo(() => monthCells(year, month), [year, month])
  function changeMonth(delta: number) {
    const date = new Date(year, month - 1 + delta, 1)
    setYear(date.getFullYear())
    setMonth(date.getMonth() + 1)
    setSelectedDay(1)
  }

  function openCabinet() {
    setCabinetSelected(true)
    window.setTimeout(() => setPanel('shelf'), 180)
  }

  function closeCabinet() {
    setPanel(null)
    setCabinetSelected(false)
  }

  const displayedShelfItems = dynamicItems.length ? dynamicItems : shelfItems
  const monthRecords = getMonthRecords(year, month, ledgerRecords)
  const visibleMonthRecords = monthRecords.length ? monthRecords : (year === 2026 && month === 7 ? julyMockRecords : [])
  const visibleMonthSummary = summarize(visibleMonthRecords)
  const recordsByDate = visibleMonthRecords.reduce<Record<string, LedgerRecord[]>>((grouped, record) => {
    grouped[record.date] = grouped[record.date] || []
    grouped[record.date].push(record)
    return grouped
  }, {})
  const selectedDate = `${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
  const selectedRecords = recordsByDate[selectedDate] || []
  const selectedSummary = summarize(selectedRecords)
  return (
    <main className="storybook-screen treasure-room">
      <header className="treasure-header">
        <div><span>🧰</span><h1>藏宝阁</h1><p>记录收支，收藏宝物，见证成长</p></div>
        <nav>
          <button onClick={() => setPanel('achievement')}><span><Trophy /></span>成就</button>
          <button onClick={() => setPanel('gallery')}><span><BookOpen /></span>图鉴</button>
          <button onClick={() => setPanel('notice')}><span><Bell /></span><em>3</em>通知</button>
        </nav>
      </header>

      <section className="chalk-summary">
        <img className="chalk-board-art" src="/images/storybook/components/monthly-summary-board.png" alt="" />
        <div className="chalk-content">
          <div className="chalk-title"><b>本月收支概览</b><span>{month}月1日－{month}月{new Date(year, month, 0).getDate()}日</span>{summary.isDemo && <em>体验</em>}</div>
          <div className="chalk-numbers"><span><small>收入</small><b>¥{summary.income.toLocaleString()}</b></span><span><small>支出</small><b>¥{summary.expense.toLocaleString()}</b></span><span><small>结余</small><b>¥{summary.balance.toLocaleString()}</b></span></div>
          <div className="chalk-balance"><span>月累计结余<b>¥{summary.balance.toLocaleString()} <ChevronRight /></b></span><span>较上月<strong>+{summary.lastMonth.toLocaleString()}</strong></span></div>
          <div className="chalk-budget"><span>预算执行进度</span><div><i><b style={{ width: `${summary.budget}%` }} /></i><strong>{summary.budget}%</strong></div></div>
        </div>
      </section>

      <button className={`treasure-cabinet ${cabinetSelected ? 'selected' : ''}`} onClick={openCabinet} aria-label="打开我的宝物柜">
        <img src="/images/storybook/components/treasure-cabinet.png" alt="装有元宝、点心和珍藏物的宝物柜" />
        <span>我的宝物柜 <em>{displayedShelfItems.length}件</em></span>
      </button>

      <div className="treasure-character"><img src="/images/storybook/pixiu-ip-master.png" alt="貔貅学长" /></div>

      <section className="desk-calendar">
        <img className="calendar-art" src="/images/storybook/components/desk-calendar.png" alt="" />
        <div className="calendar-content">
          <header><button onClick={() => changeMonth(-1)}><ChevronLeft /></button><b>{year}年{month}月</b><button onClick={() => changeMonth(1)}><ChevronRight /></button></header>
          <div className="calendar-grid">{week.map(day => <strong key={day}>{day}</strong>)}{cells.map((day, index) => day ? <button key={day} className={day === selectedDay ? 'selected' : ''} onClick={() => { setSelectedDay(day); setPanel('month') }}>{day}</button> : <i key={`blank-${index}`} />)}</div>
        </div>
      </section>

      {panel === 'achievement' && <PaperSheet title="成长成就" subtitle="每个成就都对应真实记录，不用连续打卡绑架自己。" onClose={() => setPanel(null)}><div className="badge-grid"><span>🏆<b>第一笔账</b></span><span>🌱<b>连续三天</b></span><span>💎<b>第一件宝物</b></span><span>🧭<b>预算新手</b></span></div></PaperSheet>}
      {panel === 'gallery' && <PaperSheet title="宝物图鉴" subtitle="按来源、月份和目标查看已经收藏的宝物。" onClose={() => setPanel(null)}><div className="gallery-grid">{displayedShelfItems.map(item => <button key={item.name}><img src={item.img} alt={item.name} /><b>{item.name}</b></button>)}</div></PaperSheet>}
      {panel === 'notice' && <PaperSheet title="阁中通知" onClose={() => setPanel(null)}><div className="notice-list"><p><b>预算提醒</b><span>本月餐饮预算已使用 72%</span></p><p><b>新成就</b><span>你刚刚点亮了「第一桶金」进度</span></p><p><b>复盘邀请</b><span>周日和学长一起看看本周收支吧</span></p></div></PaperSheet>}
      {panel === 'shelf' && <PaperSheet title={`我的宝物柜 · ${displayedShelfItems.length}件`} subtitle="点击宝物查看它对应的那次省钱或存钱行动。" onClose={closeCabinet}><div className="gallery-grid">{displayedShelfItems.map(item => <button key={item.name}><img src={item.img} alt={item.name} /><b>{item.name}</b><small>{item.date || '收藏于本月'}</small></button>)}</div></PaperSheet>}
      {panel === 'month' && <PaperSheet title={`${year}年${month}月收支记录`} subtitle="先看整月变化，再点日期查看当天明细。" onClose={() => setPanel(null)} className="month-ledger-sheet">
        <div className="month-ledger-summary">
          <span><small>收入</small><b className="positive">+¥{visibleMonthSummary.income.toLocaleString()}</b></span>
          <span><small>支出</small><b>-¥{visibleMonthSummary.expense.toLocaleString()}</b></span>
          <span><small>结余</small><b className={visibleMonthSummary.balance >= 0 ? 'positive' : ''}>¥{visibleMonthSummary.balance.toLocaleString()}</b></span>
        </div>
        <div className="month-ledger-calendar">
          {week.map(day => <strong key={day}>{day}</strong>)}
          {cells.map((day, index) => {
            if (!day) return <i key={`month-blank-${index}`} />
            const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const daySummary = summarize(recordsByDate[date] || [])
            const net = daySummary.income - daySummary.expense
            return (
              <button key={day} className={day === selectedDay ? 'selected' : ''} onClick={() => setSelectedDay(day)}>
                <b>{day}</b>
                <small className={net >= 0 ? 'positive' : ''}>{recordsByDate[date]?.length ? formatSigned(net) : ''}</small>
              </button>
            )
          })}
        </div>
        <div className="month-ledger-list">
          <section>
            <h3>{month}月{selectedDay}日 <span>收入 +¥{selectedSummary.income.toLocaleString()} · 支出 -¥{selectedSummary.expense.toLocaleString()}</span></h3>
            {selectedRecords.length ? selectedRecords.map((record, index) => (
              <p key={`${selectedDate}-${index}`}>
                <span><b>{record.description}</b><small>{record.category}</small></span>
                <strong className={record.type === 'income' ? 'positive' : ''}>{record.type === 'income' ? '+' : '-'}¥{record.amount.toLocaleString()}</strong>
              </p>
            )) : <p className="empty-day"><span><b>这一天还没有记录</b><small>可以从聊天里让学长帮你记一笔</small></span></p>}
          </section>
        </div>
      </PaperSheet>}
    </main>
  )
}
