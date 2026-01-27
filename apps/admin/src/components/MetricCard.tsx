'use client'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  description?: string
  buttonText?: string
  onButtonClick?: () => void
  trend?: {
    value: string
    isPositive: boolean
  }
}

export default function MetricCard({
  title,
  value,
  subtitle,
  description,
  buttonText,
  onButtonClick,
  trend,
}: MetricCardProps) {
  return (
    <div className="bg-card rounded-lg p-6 border border-dark">
      <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-3xl font-bold text-white">{value}</p>
        {trend && (
          <div className={`flex items-center space-x-1 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            <svg
              className={`w-4 h-4 ${trend.isPositive ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            <span className="text-sm font-medium">{trend.value}</span>
          </div>
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-gray-300 mb-1">{subtitle}</p>
      )}
      {description && (
        <p className="text-xs text-gray-500 mb-4">{description}</p>
      )}
      {buttonText && (
        <button
          onClick={onButtonClick}
          className="text-sm text-blue-400 hover:text-blue-300 font-medium"
        >
          {buttonText} →
        </button>
      )}
    </div>
  )
}
