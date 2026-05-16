import { useState, useRef, useEffect } from 'react'
import { Star, Trophy, ShoppingBag, X, Camera, Loader2 } from 'lucide-react'

// Calendar data for current month
const calendarDays = [
  // Week labels
  { label: '一' }, { label: '二' }, { label: '三' }, { label: '四' }, { label: '五' }, { label: '六' }, { label: '日' },
]

// 静态兜底日历数据（2026年5月，星期四开始）
const defaultCalendarData: (null | { day: number; income: number; expense: number; sticker: string })[] = [
  // Row 1 (May 2026 starts on Friday, 0=Mon)
  null, null, null, null,
  { day: 1, income: 0, expense: 0, sticker: '' },
  { day: 2, income: 0, expense: 0, sticker: '' },
  { day: 3, income: 0, expense: 0, sticker: '' },
  // Row 2
  { day: 4, income: 0, expense: 0, sticker: '' },
  { day: 5, income: 0, expense: 0, sticker: '' },
  { day: 6, income: 0, expense: 0, sticker: '' },
  { day: 7, income: 0, expense: 0, sticker: '' },
  { day: 8, income: 0, expense: 0, sticker: '' },
  { day: 9, income: 0, expense: 0, sticker: '' },
  { day: 10, income: 0, expense: 0, sticker: '' },
  // Row 3
  { day: 11, income: 0, expense: 0, sticker: '' },
  { day: 12, income: 0, expense: 0, sticker: '' },
  { day: 13, income: 0, expense: 0, sticker: '' },
  { day: 14, income: 0, expense: 0, sticker: '' },
  { day: 15, income: 0, expense: 0, sticker: '' },
  { day: 16, income: 0, expense: 0, sticker: '' },
  { day: 17, income: 0, expense: 0, sticker: '' },
  // Row 4
  { day: 18, income: 0, expense: 0, sticker: '' },
  { day: 19, income: 0, expense: 0, sticker: '' },
  { day: 20, income: 0, expense: 0, sticker: '' },
  { day: 21, income: 0, expense: 0, sticker: '' },
  { day: 22, income: 0, expense: 0, sticker: '' },
  { day: 23, income: 0, expense: 0, sticker: '' },
  { day: 24, income: 0, expense: 0, sticker: '' },
  // Row 5
  { day: 25, income: 0, expense: 0, sticker: '' },
  { day: 26, income: 0, expense: 0, sticker: '' },
  { day: 27, income: 0, expense: 0, sticker: '' },
  { day: 28, income: 0, expense: 0, sticker: '' },
  { day: 29, income: 0, expense: 0, sticker: '' },
  { day: 30, income: 0, expense: 0, sticker: '' },
  { day: 31, income: 0, expense: 0, sticker: '' },
]

const savedItems = [
  { name: 'Puma运动鞋', price: '¥676', img: '/images/item4.png', date: '5月13日' },
  { name: '金色礼服', price: '¥2,655', img: '/images/item3.png', date: '5月11日' },
  { name: '星星人盲盒', price: '¥61', img: '/images/item2.png', date: '5月8日' },
  { name: '杨枝甘露', price: '¥26', img: '/images/item1.png', date: '5月4日' },
]

const levelInfo = {
  currentLevel: 5,
  title: '金算盘',
  xp: 2840,
  nextXp: 3500,
  streak: 23,
  badges: ['🏆', '💎', '🌟', '🔥', '📚'],
}

export default function TreasurePavilion({ isActive }: { isActive?: boolean }) {
  const [selectedItem, setSelectedItem] = useState<typeof savedItems[0] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{success: boolean; message: string; sticker_url?: string; product_name?: string; product_price?: number} | null>(null)
  const [dynamicItems, setDynamicItems] = useState<Array<{name: string; price: string; img: string; date: string}>>([])
  const [calendarData, setCalendarData] = useState(defaultCalendarData)
  const [monthlyExpense, setMonthlyExpense] = useState(575)
  const [dayDetail, setDayDetail] = useState<{
    date: string;
    records: Array<{category: string; amount: number; description: string; type: string}>;
    day_income: number;
    day_expense: number;
    day_balance: number;
    cumulative_balance: number;
  } | null>(null)
  const [loadingDay, setLoadingDay] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 加载数据的函数
  function loadData() {
    fetch('/api/sticker/shelf')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.items && data.items.length > 0) {
          const mapped = data.items.map((item: { name: string; price: number; sticker_url: string; date: string }) => ({
            name: item.name,
            price: `¥${item.price}`,
            img: item.sticker_url,
            date: item.date,
          }))
          setDynamicItems(mapped)
        }
      })
      .catch(() => {})

    fetch('/api/expense/summary')
      .then(res => res.json())
      .then(data => {
        if (data.records && data.records.length > 0) {
          const now = new Date()
          const currentYear = now.getFullYear()
          const currentMonth = now.getMonth()

          const dayMap: Record<number, { income: number; expense: number }> = {}
          data.records.forEach((r: { date: string; amount: number; type: string }) => {
            const d = new Date(r.date)
            if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
              const day = d.getDate()
              if (!dayMap[day]) dayMap[day] = { income: 0, expense: 0 }
              if (r.type === 'expense') dayMap[day].expense += r.amount
              else dayMap[day].income += r.amount
            }
          })
          
          const updated = defaultCalendarData.map(cell => {
            if (!cell) return null
            const extra = dayMap[cell.day]
            if (extra) {
              return {
                ...cell,
                income: extra.income,
                expense: extra.expense,
                sticker: extra.income > 0 ? '💰' : (extra.expense > 0 ? '' : cell.sticker),
              }
            }
            return cell
          })
          setCalendarData(updated)
        }
        if (data.monthly_summary) {
          setMonthlyExpense(data.monthly_summary.total_expense || 575)
        }
      })
      .catch(() => {})
  }

  // 初始加载
  useEffect(() => { loadData() }, [])

  // 每次切换到此 tab 时刷新数据
  useEffect(() => {
    if (isActive) loadData()
  }, [isActive])

  // 点击日期加载明细
  function loadDayDetail(day: number) {
    const year = 2026
    const month = 5
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setLoadingDay(true)
    fetch(`/api/expense/day/${dateStr}`)
      .then(res => res.json())
      .then(data => {
        setDayDetail(data)
        setLoadingDay(false)
      })
      .catch(() => setLoadingDay(false))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadResult(null)

    try {
      // 转 base64
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        
        const res = await fetch('/api/sticker/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64 }),
        })
        const data = await res.json()
        
        setUploadResult(data)
        
        if (data.success) {
          // 添加到动态列表
          const now = new Date()
          const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`
          setDynamicItems(prev => [{
            name: data.product_name,
            price: `¥${data.product_price}`,
            img: data.sticker_url,
            date: dateStr,
          }, ...prev])
        }
        
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setUploadResult({ success: false, message: '上传失败，请重试' })
      setUploading(false)
    }
    
    // 清空 input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const allItems = [...dynamicItems, ...savedItems]

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-surface-container-high/30 via-surface to-surface px-4 py-3 space-y-4 overflow-y-auto">
      {/* Modal for sticker preview */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative bg-white rounded-3xl p-6 mx-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-low"
            >
              <X size={16} className="text-on-surface-variant" />
            </button>
            <div className="flex flex-col items-center gap-3">
              <div className="w-48 h-48 rounded-2xl border-4 border-dashed border-primary/30 bg-primary-container/20 flex items-center justify-center p-4">
                <img
                  src={selectedItem.img}
                  alt={selectedItem.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-lg font-bold text-on-surface">{selectedItem.name}</h3>
              <p className="text-sm text-primary font-bold">{selectedItem.price}</p>
              <p className="text-xs text-on-surface-variant">
                {selectedItem.date}，你忍住了！💪
              </p>
              <div className="px-4 py-2 bg-secondary-container rounded-full">
                <span className="text-xs font-medium text-secondary">🏆 省钱贴纸 +1</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Calendar section */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/15">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-on-surface">📅 2026年5月</h3>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-error-container/60 rounded-full">
            <span className="text-[10px] text-error font-medium">支出 ¥{monthlyExpense}</span>
          </div>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {calendarDays.map((d, i) => (
            <div key={i} className="text-center text-[10px] text-on-surface-variant font-medium py-1">
              {d.label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((cell, idx) => (
            <div
              key={idx}
              onClick={() => cell && loadDayDetail(cell.day)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-[11px] ${
                cell ? 'cursor-pointer active:scale-95 transition-transform' : ''
              } ${
                cell
                  ? cell.income > 0
                    ? 'bg-secondary-container/40'
                    : cell.expense > 50
                    ? 'bg-error-container/30'
                    : cell.sticker
                    ? 'bg-primary-container/30'
                    : 'bg-surface-container-low'
                  : ''
              }`}
            >
              {cell && (
                <>
                  <span className="text-on-surface font-medium">{cell.day}</span>
                  {cell.sticker && (
                    <span className="absolute -top-0.5 -right-0.5 text-[9px]">{cell.sticker}</span>
                  )}
                  {cell.expense > 0 && (
                    <span className="text-[8px] text-error/70">-{cell.expense}</span>
                  )}
                  {cell.income > 0 && (
                    <span className="text-[8px] text-secondary">+{cell.income}</span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Day detail modal */}
      {(dayDetail || loadingDay) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setDayDetail(null)}
        >
          <div
            className="relative bg-white rounded-3xl p-5 mx-6 shadow-2xl w-[340px] max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDayDetail(null)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-low"
            >
              <X size={16} className="text-on-surface-variant" />
            </button>

            {loadingDay ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : dayDetail ? (
              <div className="space-y-4">
                {/* 日期标题 */}
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-primary" />
                  <h3 className="text-base font-bold text-on-surface">
                    {dayDetail.date.replace(/^\d{4}-/, '').replace('-', '月')}日
                  </h3>
                </div>

                {/* 当天汇总 */}
                <div className="flex items-center gap-3 px-3 py-2.5 bg-surface-container-low rounded-xl">
                  {dayDetail.day_expense > 0 && (
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-on-surface-variant">支出</p>
                      <p className="text-sm font-bold text-error">-¥{dayDetail.day_expense}</p>
                    </div>
                  )}
                  {dayDetail.day_income > 0 && (
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-on-surface-variant">收入</p>
                      <p className="text-sm font-bold text-secondary">+¥{dayDetail.day_income}</p>
                    </div>
                  )}
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-on-surface-variant">当日结余</p>
                    <p className={`text-sm font-bold ${dayDetail.day_balance >= 0 ? 'text-secondary' : 'text-error'}`}>
                      {dayDetail.day_balance >= 0 ? '+' : ''}¥{dayDetail.day_balance}
                    </p>
                  </div>
                </div>

                {/* 累计结余 */}
                <div className="flex items-center justify-between px-3 py-2 bg-primary-container/30 rounded-xl">
                  <span className="text-[11px] text-on-surface-variant">本月累计结余</span>
                  <span className={`text-sm font-bold ${dayDetail.cumulative_balance >= 0 ? 'text-secondary' : 'text-error'}`}>
                    {dayDetail.cumulative_balance >= 0 ? '+' : ''}¥{dayDetail.cumulative_balance}
                  </span>
                </div>

                {/* 收支明细列表 */}
                {dayDetail.records.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-on-surface-variant font-medium">收支明细</p>
                    {dayDetail.records.map((record, idx) => (
                      <div key={idx} className="flex items-center justify-between px-3 py-2 bg-surface-container-low/60 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px]">
                            {record.type === 'income' ? '💰' : record.category === '餐饮' ? '🍜' : record.category === '交通' ? '🚌' : record.category === '购物' ? '🛍️' : record.category === '娱乐' ? '🎬' : '📝'}
                          </span>
                          <div>
                            <p className="text-[12px] text-on-surface font-medium">{record.description || record.category}</p>
                            <p className="text-[10px] text-on-surface-variant">{record.category}</p>
                          </div>
                        </div>
                        <span className={`text-[12px] font-bold ${record.type === 'income' ? 'text-secondary' : 'text-error'}`}>
                          {record.type === 'income' ? '+' : '-'}¥{record.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-[12px] text-on-surface-variant">今天没有收支记录 ✨</p>
                    <p className="text-[10px] text-on-surface-variant/60 mt-1">可以去跟貔貅学长聊聊今天花了什么~</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Streak & Level section */}
      <div className="bg-gradient-to-br from-[#FFF3E0] to-[#FFECD2] rounded-2xl p-4 shadow-sm border border-amber-warm/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2] flex items-center justify-center shadow-sm overflow-hidden">
              <img src="/images/藏宝阁.png" alt="貔貅学长" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">连续打卡 {levelInfo.streak} 天</p>
              <p className="text-[11px] text-on-surface-variant">坚持就是胜利！🔥</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-white/60 rounded-lg">
            <Star size={12} className="text-gold fill-gold" />
            <span className="text-xs font-bold text-on-surface">Lv.{levelInfo.currentLevel}</span>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-on-surface-variant">{levelInfo.title}</span>
            <span className="text-[11px] text-on-surface-variant">{levelInfo.xp}/{levelInfo.nextXp} XP</span>
          </div>
          <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-warm via-gold to-amber-warm rounded-full transition-all duration-1000"
              style={{ width: `${(levelInfo.xp / levelInfo.nextXp) * 100}%` }}
            />
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-on-surface-variant">徽章：</span>
          {levelInfo.badges.map((badge, idx) => (
            <div key={idx} className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center text-sm shadow-sm">
              {badge}
            </div>
          ))}
        </div>
      </div>

      {/* Virtual shelf - saved items */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-primary" />
            <h3 className="text-sm font-bold text-on-surface">忍住没买の宝物架</h3>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary-container/60 rounded-full">
            <ShoppingBag size={10} className="text-secondary" />
            <span className="text-[10px] text-secondary font-medium">已省 ¥3,236</span>
          </div>
        </div>

        {/* Upload result toast */}
        {uploadResult && (
          <div className={`mb-2 p-2.5 rounded-xl text-xs font-medium ${
            uploadResult.success 
              ? 'bg-secondary-container/60 text-secondary' 
              : 'bg-error-container/60 text-error'
          }`}>
            {uploadResult.message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          {/* Upload button card */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-surface-container-low rounded-xl border-2 border-dashed border-primary/30 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95 flex flex-col items-center justify-center min-h-[140px]"
          >
            {uploading ? (
              <>
                <Loader2 size={24} className="text-primary animate-spin mb-2" />
                <p className="text-xs text-on-surface-variant text-center">识别中...</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center mb-2">
                  <Camera size={18} className="text-primary" />
                </div>
                <p className="text-xs font-medium text-primary text-center">拍照/上传</p>
                <p className="text-[10px] text-on-surface-variant text-center mt-0.5">忍住没买？拍下来！</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {allItems.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedItem(item)}
              className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95"
            >
              <div className="w-full h-16 mb-1.5 flex items-center justify-center">
                <img src={item.img} alt={item.name} className="h-14 w-14 object-contain" />
              </div>
              <p className="text-xs font-medium text-on-surface text-center truncate">{item.name}</p>
              <p className="text-[11px] text-primary font-bold text-center mt-0.5">{item.price}</p>
              <p className="text-[10px] text-on-surface-variant text-center mt-1">
                {item.date}，你忍住了！💪
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-2" />
    </div>
  )
}
