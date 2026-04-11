'use client'

import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'success' | 'default'
}

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    btnClass: 'btn-danger',
  },
  success: {
    icon: CheckCircle2,
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    btnClass: 'btn-success',
  },
  default: {
    icon: HelpCircle,
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    btnClass: 'btn-primary',
  },
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Potvrdiť',
  cancelLabel = 'Zrušiť',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmDialogProps) {
  if (!open) return null

  const cfg = variantConfig[variant]
  const Icon = cfg.icon

  return (
    <div className="fixed inset-0 z-[60]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        aria-label={cancelLabel}
        onClick={onCancel}
      />
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-4 pb-8 sm:items-center sm:pb-4">
        <div
          className="modal-panel-sm pointer-events-auto w-full max-w-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
            </div>
            <div className="min-w-0">
              <h2 id="confirm-dialog-title" className="text-base font-semibold text-white mb-1">
                {title}
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2.5 px-6 pb-5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost !rounded-full border border-white/[0.1] bg-white/[0.06] px-5 hover:border-white/[0.14] hover:bg-white/[0.08]"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={`${cfg.btnClass} !rounded-full px-5 font-semibold`}>
            {confirmLabel}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
