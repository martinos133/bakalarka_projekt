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
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    btnClass: 'btn-success',
  },
  default: {
    icon: HelpCircle,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
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
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-panel-sm"
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
        <div className="flex justify-end gap-2.5 px-6 pb-5 pt-2">
          <button type="button" onClick={onCancel} className="btn-ghost">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={cfg.btnClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
