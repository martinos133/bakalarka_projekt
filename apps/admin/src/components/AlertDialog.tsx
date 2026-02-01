'use client'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="bg-card border border-dark rounded-xl shadow-xl w-full max-w-md overflow-hidden"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
      >
        <div className="p-6">
          <h2 id="alert-dialog-title" className="text-lg font-semibold text-gray-200 mb-2">
            {title}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-100 bg-primary hover:opacity-90 transition-colors"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
