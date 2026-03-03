 'use client'
 
 import { useEffect, useMemo, useRef, useState } from 'react'
 import { Calendar } from 'lucide-react'
 import { DayPicker, type DateRange } from 'react-day-picker'
 import { sk } from 'date-fns/locale'
 import { format } from 'date-fns'
 
 import 'react-day-picker/dist/style.css'
 
 type CommonProps = {
   label?: string
   className?: string
   disabled?: boolean
   minDate?: Date
 }
 
 type SingleProps = CommonProps & {
   mode: 'single'
   value: Date | undefined
   onChange: (value: Date | undefined) => void
 }
 
 type RangeProps = CommonProps & {
   mode: 'range'
   value: DateRange | undefined
   onChange: (value: DateRange | undefined) => void
 }
 
 type Props = SingleProps | RangeProps
 
 export default function DatePicker(props: Props) {
   const { label, className = '', disabled, minDate } = props
   const [open, setOpen] = useState(false)
   const rootRef = useRef<HTMLDivElement>(null)
 
   useEffect(() => {
     const onDown = (e: MouseEvent) => {
       if (!rootRef.current) return
       if (!rootRef.current.contains(e.target as Node)) setOpen(false)
     }
     document.addEventListener('mousedown', onDown)
     return () => document.removeEventListener('mousedown', onDown)
   }, [])
 
   const displayValue = useMemo(() => {
     if (props.mode === 'single') {
       return props.value ? format(props.value, 'dd.MM.yyyy', { locale: sk }) : ''
     }
     const from = props.value?.from
     const to = props.value?.to
     if (!from && !to) return ''
     if (from && !to) return `${format(from, 'dd.MM.yyyy', { locale: sk })} –`
     if (from && to) {
       return `${format(from, 'dd.MM.yyyy', { locale: sk })} – ${format(to, 'dd.MM.yyyy', { locale: sk })}`
     }
     return ''
   }, [props])
 
   const handleSelect = (next: Date | DateRange | undefined) => {
     if (props.mode === 'single') {
       props.onChange(next as Date | undefined)
       setOpen(false)
     } else {
       const range = next as DateRange | undefined
       props.onChange(range)
       if (range?.from && range?.to) setOpen(false)
     }
   }
 
   return (
     <div ref={rootRef} className={`w-full ${className}`}>
       {label && (
         <label className="block text-sm font-medium text-gray-700 mb-2">
           {label}
         </label>
       )}
 
       <button
         type="button"
         disabled={disabled}
         onClick={() => setOpen((v) => !v)}
         className={`w-full flex items-center justify-between gap-3 border rounded-lg px-4 py-2 text-left transition-colors ${
           disabled
             ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
             : 'bg-white text-gray-900 border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1dbf73] focus:border-transparent'
         }`}
       >
         <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
           {displayValue || 'Vyberte dátum'}
         </span>
         <Calendar className="w-4 h-4 text-gray-500" />
       </button>
 
       {open && (
         <div className="relative">
           <div className="absolute z-50 mt-2 w-full sm:w-[360px] bg-white border border-gray-200 rounded-xl shadow-xl p-3">
             <DayPicker
               mode={props.mode}
               selected={props.value as any}
               onSelect={handleSelect as any}
               locale={sk}
               weekStartsOn={1}
               showOutsideDays
               disabled={minDate ? { before: minDate } : undefined}
               classNames={{
                 months: 'flex flex-col',
                 month: 'space-y-4',
                 caption: 'flex items-center justify-between px-2',
                 caption_label: 'text-sm font-semibold text-gray-900',
                 nav: 'flex items-center gap-1',
                 nav_button:
                   'h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700',
                 table: 'w-full border-collapse',
                 head_row: 'flex',
                 head_cell: 'w-9 text-[11px] font-medium text-gray-500 text-center',
                 row: 'flex w-full mt-1',
                 cell: 'w-9 h-9 text-center text-sm relative',
                 day: 'w-9 h-9 rounded-md hover:bg-gray-50 text-gray-900 aria-selected:bg-[#1dbf73] aria-selected:text-white',
                 day_today: 'ring-1 ring-[#1dbf73] ring-offset-2',
                 day_outside: 'text-gray-300',
                 day_disabled: 'text-gray-300 opacity-50',
                 day_range_start: 'aria-selected:bg-[#1dbf73] aria-selected:text-white',
                 day_range_end: 'aria-selected:bg-[#1dbf73] aria-selected:text-white',
                 day_range_middle: 'aria-selected:bg-[#1dbf73]/15 aria-selected:text-gray-900 rounded-none',
               }}
             />
           </div>
         </div>
       )}
     </div>
   )
 }
