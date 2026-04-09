'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

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
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Vybrať...',
  className = '',
}: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
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

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          w-full flex items-center justify-between gap-2
          bg-dark-100 border border-white/10 rounded-lg
          px-4 py-2.5 text-sm transition-all cursor-pointer
          hover:border-white/20
          ${open ? 'border-accent/50 shadow-[0_0_0_3px_rgba(201,169,110,0.1)]' : ''}
          ${selected ? 'text-white' : 'text-white/40'}
        `}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-white/40 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1.5 w-full max-h-60 overflow-y-auto
            bg-dark-100 border border-white/10 rounded-xl shadow-2xl shadow-black/50
            py-1"
          style={{ animation: 'slideDown 0.15s ease-out' }}
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
                  w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2
                  transition-colors duration-100
                  ${isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                  }
                `}
              >
                <span className="truncate">{opt.label}</span>
                {isActive && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
