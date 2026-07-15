import type { CSSProperties } from 'react'
import type { ScriptSummary, SelectedScript } from '../data/scripts'

const BOOK_COVER = '/images/script-library/script-book-blank-master-v2.png'

interface ScriptBookProps {
  script: ScriptSummary
  style?: CSSProperties
  onSelect: (script: SelectedScript) => void
}

export default function ScriptBook({ script, style, onSelect }: ScriptBookProps) {
  return (
    <button
      type="button"
      className="script-book"
      style={style}
      onClick={() => onSelect({
        id: script.id,
        name: script.name,
        resume: script.status === 'active',
        progress: script.progress,
        customPrompt: script.customPrompt,
        roleDescription: script.roleDescription,
      })}
      aria-label={`选择剧本 ${script.name}`}
    >
      <img src={BOOK_COVER} alt="" className="script-book-cover" draggable={false} />
      <span className="script-book-title">{script.name}</span>
      {script.status === 'active' && (
        <span className="script-book-active" aria-label={`当前进度 ${script.progress ?? 0}%`}>
          {Math.round(script.progress ?? 0)}%
        </span>
      )}
    </button>
  )
}
