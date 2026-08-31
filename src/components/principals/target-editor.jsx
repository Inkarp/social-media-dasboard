'use client'

import { Check, Loader2 } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import { saveTargetAction } from '@/app/principals/actions'
import { cn } from '@/lib/cn'
import { deriveQuarterTargets, QUARTERS, quarterMonths } from '@/lib/fy'

/**
 * Inline target editing.
 *
 * The yearly figure sits in the row and the quarter overrides appear beneath it
 * when the row is expanded — two places in the layout, one piece of state. Hence
 * a hook rather than a component: rendering a self-contained editor in both
 * positions would give a brand two yearly inputs that immediately disagree.
 *
 * Saves on blur when the value has actually changed, and on Enter. Entering a
 * year's plan means tabbing through 46 brands, so requiring a button press per
 * brand would double the work; tabbing past an untouched field costs nothing
 * because an unchanged value never triggers a write.
 */

/** @typedef {import('@/lib/fy').QuarterOverrides} QuarterOverrides */
/** @typedef {import('@/lib/fy').Quarter} QuarterKey */

const numberField = cn(
  'num rounded-control border border-hairline bg-bg/50 px-2 py-1.5 text-right',
  'text-base tabular-nums text-ink',
  'transition-colors duration-[120ms] ease-standard',
  'hover:border-teal focus:border-forest',
  'disabled:opacity-50',
)

/** @typedef {'idle' | 'saving' | 'saved' | 'error'} SaveState */
/** @typedef {Record<QuarterKey, string>} QuarterStrings */

/**
 * @param {QuarterOverrides} overrides
 * @returns {QuarterStrings}
 */
function toStrings(overrides) {
  return {
    1: overrides.q1 === null ? '' : String(overrides.q1),
    2: overrides.q2 === null ? '' : String(overrides.q2),
    3: overrides.q3 === null ? '' : String(overrides.q3),
    4: overrides.q4 === null ? '' : String(overrides.q4),
  }
}

/** @typedef {ReturnType<typeof useTargetEditor>} TargetEditorController */

/**
 * @param {string} principalId
 * @param {number} fy
 * @param {number} yearlyTarget
 * @param {QuarterOverrides} overrides
 */
export function useTargetEditor(principalId, fy, yearlyTarget, overrides) {
  const [yearly, setYearly] = useState(String(yearlyTarget))
  const [quarters, setQuarters] = useState(() => toStrings(overrides))
  const [state, setState] = useState(/** @type {SaveState} */ ('idle'))
  const [message, setMessage] = useState(/** @type {string | null} */ (null))
  const [isPending, startTransition] = useTransition()

  // What the database currently holds, so a blur that changed nothing is a no-op.
  const saved = useRef({ yearly: String(yearlyTarget), quarters: toStrings(overrides) })

  /** @param {{ yearly: string, quarters: QuarterStrings }} next */
  function commit(next) {
    const unchanged =
      next.yearly === saved.current.yearly &&
      QUARTERS.every((q) => next.quarters[q] === saved.current.quarters[q])
    if (unchanged) return

    const formData = new FormData()
    formData.set('principalId', principalId)
    formData.set('fy', String(fy))
    formData.set('yearlyTarget', next.yearly === '' ? '0' : next.yearly)
    for (const q of QUARTERS) formData.set(`q${q}`, next.quarters[q])

    setState('saving')
    setMessage(null)

    startTransition(async () => {
      const result = await saveTargetAction(formData)
      if (result.ok) {
        saved.current = { yearly: next.yearly, quarters: { ...next.quarters } }
        setState('saved')
        // An acknowledgement, not a status — it should not linger.
        setTimeout(() => setState('idle'), 1600)
      } else {
        setState('error')
        setMessage(result.error)
      }
    })
  }

  return {
    principalId,
    yearly,
    quarters,
    state,
    message,
    isPending,
    derived: deriveQuarterTargets(Number.parseInt(yearly, 10) || 0),
    setYearly,
    /**
     * @param {QuarterKey} quarter
     * @param {string} value
     */
    setQuarter: (quarter, value) => setQuarters((previous) => ({ ...previous, [quarter]: value })),
    commit: () => commit({ yearly, quarters }),
  }
}

/** Blur on Enter, which then triggers the save.
 * @param {import('react').KeyboardEvent<HTMLInputElement>} event
 */
function blurOnEnter(event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    event.currentTarget.blur()
  }
}

/** @param {{ editor: TargetEditorController }} props */
export function YearlyTargetInput({ editor }) {
  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor={`yearly-${editor.principalId}`}>
        Yearly target
      </label>
      <input
        id={`yearly-${editor.principalId}`}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={editor.yearly}
        disabled={editor.isPending}
        onChange={(event) => editor.setYearly(event.target.value)}
        onBlur={editor.commit}
        onKeyDown={blurOnEnter}
        className={cn(numberField, 'w-20')}
      />
      <span aria-live="polite" className="flex w-4 shrink-0 items-center">
        {editor.state === 'saving' && (
          <Loader2 aria-label="Saving" className="size-3.5 animate-spin text-muted" />
        )}
        {editor.state === 'saved' && <Check aria-label="Saved" className="size-3.5 text-forest" />}
      </span>
    </div>
  )
}

/** @param {{ editor: TargetEditorController }} props */
export function QuarterTargetInputs({ editor }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="label">Quarter overrides</p>

      <div className="flex flex-wrap gap-3">
        {QUARTERS.map((quarter) => (
          <div key={quarter} className="flex flex-col gap-1">
            <label
              htmlFor={`q${quarter}-${editor.principalId}`}
              className="text-xs text-muted"
            >
              Q{quarter} <span className="text-muted">{quarterMonths(quarter)}</span>
            </label>
            <input
              id={`q${quarter}-${editor.principalId}`}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={editor.quarters[quarter]}
              // The placeholder is the derived figure, so an empty box reads as
              // "this is what it will be" rather than "this is missing".
              placeholder={String(editor.derived[`q${quarter}`])}
              disabled={editor.isPending}
              onChange={(event) => editor.setQuarter(quarter, event.target.value)}
              onBlur={editor.commit}
              onKeyDown={blurOnEnter}
              className={cn(numberField, 'w-16')}
            />
          </div>
        ))}
      </div>

      <p className="max-w-prose text-sm text-muted">
        Leave a quarter empty to split the yearly target evenly, with the remainder falling in Q4.
        A number here overrides that — including zero.
      </p>

      {editor.state === 'error' && editor.message && (
        <p role="alert" className="text-sm text-danger">
          {editor.message}
        </p>
      )}
    </div>
  )
}
