'use client'

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

  const confirmClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-gray-100'
      : variant === 'success'
        ? 'bg-green-600 hover:bg-green-700 text-gray-100'
        : 'bg-primary hover:opacity-90 text-gray-100'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="bg-card border border-dark rounded-xl shadow-xl w-full max-w-md overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="p-6">
          <h2 id="confirm-dialog-title" className="text-lg font-semibold text-gray-200 mb-2">
            {title}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-dark border border-card hover:bg-cardHover transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
