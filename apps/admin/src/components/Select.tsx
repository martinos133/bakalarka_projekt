'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Vybrať...',
  className = '',
}: SelectProps) {
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
          bg-white/[0.04] border border-white/[0.06] rounded-xl
          px-3 py-2 text-sm transition-all cursor-pointer
          hover:border-white/[0.12] hover:bg-white/[0.06]
          ${open ? 'border-primary/50 bg-white/[0.06] shadow-[0_0_0_3px_rgba(36,99,235,0.1)]' : ''}
          ${selected ? 'text-white' : 'text-gray-500'}
        `}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1.5 w-full min-w-[180px] max-h-60 overflow-y-auto
            bg-[rgb(30,30,30)] border border-white/[0.08] rounded-xl shadow-xl shadow-black/40
            py-1 animate-in"
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
                  w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2
                  transition-colors duration-100
                  ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
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
