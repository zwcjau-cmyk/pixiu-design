import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, BookOpen, ChevronRight, Lightbulb, Loader2, X } from 'lucide-react'
import ScriptBook from './ScriptBook'
import {
  PRESET_SCRIPTS,
  createCustomScript,
  fetchActiveScript,
  fetchAvailableScripts,
  type ScriptSummary,
  type SelectedScript,
} from '../data/scripts'

interface ScriptLibraryProps {
  onBack: () => void
  onSelectScript: (script: SelectedScript) => void
  onCreateCustom?: () => void
}

const SCENE = '/images/script-library/script-library-bg-with-pixiu-v1.png'
const CUSTOM_LOGO = '/images/script-library/custom-script-logo-v2.png'

const BOOK_SLOTS = [
  { gridColumn: 1, gridRow: 1 },
  { gridColumn: 2, gridRow: 1 },
  { gridColumn: 3, gridRow: 1 },
  { gridColumn: 1, gridRow: 2 },
  { gridColumn: 2, gridRow: 2 },
  { gridColumn: 3, gridRow: 2 },
  { gridColumn: 2, gridRow: 3 },
  { gridColumn: 3, gridRow: 3 },
]

export default function ScriptLibrary({ onBack, onSelectScript }: ScriptLibraryProps) {
  const [scripts, setScripts] = useState<ScriptSummary[]>(PRESET_SCRIPTS)
  const [loading, setLoading] = useState(true)
  const [activeScript, setActiveScript] = useState<{ id: string; name: string; progress: number } | null>(null)
  const [drawer, setDrawer] = useState<'records' | 'tip' | null>(null)
  const [pendingScript, setPendingScript] = useState<SelectedScript | null>(null)
  const [customOpen, setCustomOpen] = useState(false)
  const [customIdeal, setCustomIdeal] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [customExtra, setCustomExtra] = useState('')
  const [customError, setCustomError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const [available, active] = await Promise.all([fetchAvailableScripts(), fetchActiveScript()])
    setActiveScript(active)
    setScripts(available.map((script) => active?.id === script.id
      ? { ...script, status: 'active', progress: active.progress }
      : { ...script, status: 'available' }))
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function chooseScript(script: SelectedScript) {
    if (script.resume) {
      onSelectScript(script)
      return
    }
    if (activeScript && activeScript.id !== script.id) {
      setPendingScript(script)
      return
    }
    onSelectScript(script)
  }

  function submitCustomScript(event: FormEvent) {
    event.preventDefault()
    if (!customIdeal.trim() || !customRole.trim()) {
      setCustomError('请先填写理想的剧本和你的角色。')
      return
    }
    const script = createCustomScript({
      idealScript: customIdeal.trim(),
      roleDescription: customRole.trim(),
      extra: customExtra.trim(),
    })
    setScripts(previous => [script, ...previous])
    setCustomOpen(false)
    setCustomIdeal('')
    setCustomRole('')
    setCustomExtra('')
    setCustomError('')
    onSelectScript({
      id: script.id,
      name: script.name,
      customPrompt: script.customPrompt,
      roleDescription: script.roleDescription,
    })
  }

  return (
    <main className="script-library-page">
      <img src={SCENE} alt="" className="script-library-scene" aria-hidden />

      <header className="script-library-header">
        <button type="button" className="script-library-back" onClick={onBack} aria-label="返回貔貅空间">
          <ArrowLeft size={22} />
        </button>
        <div className="script-library-heading">
          <h1>剧情书架</h1>
          <p>选择你的故事，开启理财之旅</p>
        </div>
        <button type="button" className="script-library-records" onClick={() => setDrawer('records')}>
          <BookOpen size={18} />
          <span>我的记录</span>
        </button>
      </header>

      <div className="script-library-plaque">我的剧本库</div>

      <section className="script-shelf" aria-label="我的剧本库">
        {loading ? (
          <div className="script-shelf-loading"><Loader2 size={22} className="animate-spin" /></div>
        ) : (
          scripts.slice(0, BOOK_SLOTS.length).map((script, index) => (
            <ScriptBook key={script.id} script={script} onSelect={chooseScript} style={BOOK_SLOTS[index]} />
          ))
        )}
      </section>

      <button type="button" className="script-custom-entry" onClick={() => setCustomOpen(true)} aria-label="创建自定义剧本">
        <img src={CUSTOM_LOGO} alt="自定义剧本" />
      </button>

      <button type="button" className="script-tip-card" onClick={() => setDrawer('tip')}>
        <span className="script-tip-icon"><Lightbulb size={18} /></span>
        <span className="script-tip-copy">
          <strong>小贴士</strong>
          <span>选择适合你的故事，收获专属的理财成长吧！</span>
        </span>
        <ChevronRight size={20} />
      </button>

      {drawer && (
        <div className="script-sheet-mask" onClick={() => setDrawer(null)}>
          <section className="script-sheet" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header>
              <h2>{drawer === 'records' ? '我的记录' : '剧本玩法说明'}</h2>
              <button type="button" onClick={() => setDrawer(null)} aria-label="关闭"><X size={18} /></button>
            </header>
            {drawer === 'records' ? (
              activeScript ? (
                <div className="script-current-record">
                  <div><strong>{activeScript.name}</strong><span>进行中 · {Math.round(activeScript.progress)}%</span></div>
                  <button type="button" onClick={() => onSelectScript({
                    id: activeScript.id,
                    name: activeScript.name,
                    resume: true,
                    progress: activeScript.progress,
                  })}>继续剧情</button>
                </div>
              ) : <p className="script-sheet-empty">还没有进行中的剧本，先从书架挑选一个故事吧。</p>
            ) : (
              <div className="script-sheet-tip">
                <p>不同剧本会改变对话体验，但不会改变真实账户数据。</p>
                <p>剧情进度来自记账、预算、存款等现实行动，不代表真实投资收益。</p>
                <button type="button" onClick={() => setDrawer(null)}>我知道了</button>
              </div>
            )}
          </section>
        </div>
      )}

      {pendingScript && (
        <div className="script-sheet-mask">
          <section className="script-confirm" role="alertdialog" aria-modal="true">
            <h2>切换剧本？</h2>
            <p>当前正在进行“{activeScript?.name}”。切换后会激活“{pendingScript.name}”，请确认是否继续。</p>
            <div>
              <button type="button" onClick={() => setPendingScript(null)}>取消</button>
              <button type="button" onClick={() => onSelectScript(pendingScript)}>确认切换</button>
            </div>
          </section>
        </div>
      )}

      {customOpen && (
        <div className="script-sheet-mask" onClick={() => setCustomOpen(false)}>
          <form className="script-custom-dialog" role="dialog" aria-modal="true" aria-label="自定义剧本" onSubmit={submitCustomScript} onClick={(event) => event.stopPropagation()}>
            <header>
              <h2>自定义剧本</h2>
              <button type="button" onClick={() => setCustomOpen(false)} aria-label="关闭"><X size={18} /></button>
            </header>
            <label>
              <span>理想的剧本 <em>必填</em></span>
              <textarea value={customIdeal} onChange={event => setCustomIdeal(event.target.value)} placeholder="例如：我想要一个校园创业逆袭剧本，主线是从第一笔小生意攒到启动资金。" />
            </label>
            <label>
              <span>我的角色 <em>必填</em></span>
              <textarea value={customRole} onChange={event => setCustomRole(event.target.value)} placeholder="例如：大二学生，预算有限，想成为能自己掌控现金流的小老板。" />
            </label>
            <label>
              <span>补充设定</span>
              <textarea value={customExtra} onChange={event => setCustomExtra(event.target.value)} placeholder="可选：喜欢的风格、希望避开的情节、目标金额等。" />
            </label>
            {customError && <p className="script-custom-error">{customError}</p>}
            <button type="submit">生成剧本并开始</button>
          </form>
        </div>
      )}
    </main>
  )
}
