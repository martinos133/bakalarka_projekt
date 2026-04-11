'use client'

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

/** Pevná nepriehľadná plocha výberu (rovnaká ako v admine) */
const POPUP_SURFACE = '#2D2421'

interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  /** Pre spojenie s `<label htmlFor>` */
  id?: string
}

type PanelPos = { top: number; left: number; width: number }

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Vybrať...',
  className = '',
  id,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const [panelPos, setPanelPos] = useState<PanelPos | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const measurePanel = useCallback(() => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPanelPos({
      top: r.bottom + 6,
      left: r.left,
      width: Math.max(r.width, 180),
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setPanelPos(null)
      return
    }
    measurePanel()
    window.addEventListener('scroll', measurePanel, true)
    window.addEventListener('resize', measurePanel)
    return () => {
      window.removeEventListener('scroll', measurePanel, true)
      window.removeEventListener('resize', measurePanel)
    }
  }, [open, measurePanel])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t) || portalRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open && listRef.current) {
      const active = listRef.current.querySelector('[data-active="true"]')
      if (active) {
        active.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [open])

  const selected = options.find((o) => o.value === value)

  const panel =
    open &&
    panelPos &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={portalRef}
        className="z-[200] overflow-hidden rounded-xl border border-accent/25 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(201,169,110,0.12)] ring-1 ring-[#0a0a0a]"
        style={{
          position: 'fixed',
          top: panelPos.top,
          left: panelPos.left,
          width: panelPos.width,
          backgroundColor: POPUP_SURFACE,
          animation: 'slideDown 0.15s ease-out',
        }}
      >
        <div
          ref={listRef}
          className="max-h-60 overflow-y-auto py-1"
          style={{ backgroundColor: POPUP_SURFACE }}
        >
          {options.map((opt) => {
            const isActive = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                data-active={isActive}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`
                    w-full text-left px-3 py-2.5 text-sm flex items-center justify-between gap-2
                    transition-colors duration-100 border-l-2
                    ${isActive
                      ? 'border-accent bg-popupRowActive text-accent font-medium'
                      : 'border-transparent text-gray-300 hover:border-accent/25 hover:bg-popupRowHover hover:text-white'
                    }
                  `}
              >
                <span className="truncate">{opt.label}</span>
                {isActive && <Check className="w-4 h-4 flex-shrink-0 text-accent" strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      </div>,
      document.body,
    )

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          w-full flex items-center justify-between gap-2
          bg-popup border border-white/10 rounded-xl
          px-3 py-2 text-sm transition-all cursor-pointer
          hover:border-white/[0.14] hover:bg-popupHover
          ${open ? 'border-accent/55 bg-popupHover shadow-[0_0_0_3px_rgba(201,169,110,0.14)]' : ''}
          ${selected && !open ? 'ring-1 ring-accent/15' : ''}
          ${selected ? 'text-white' : 'text-gray-500'}
        `}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${open ? 'rotate-180 text-accent' : 'text-gray-400'}`}
        />
      </button>

      {panel}
    </div>
  )
}
