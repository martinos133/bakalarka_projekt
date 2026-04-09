'use client'

import { AlertCircle } from 'lucide-react'

interface AlertDialogProps {
  open: boolean
  title: string
  message: string
  buttonLabel?: string
  onClose: () => void
}

export default function AlertDialog({
  open,
  title,
  message,
  buttonLabel = 'OK',
  onClose,
}: AlertDialogProps) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel-sm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-orange-400" />
            </div>
            <div className="min-w-0">
              <h2 id="alert-dialog-title" className="text-base font-semibold text-white mb-1">
                {title}
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end px-6 pb-5 pt-2">
          <button type="button" onClick={onClose} className="btn-primary">
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
