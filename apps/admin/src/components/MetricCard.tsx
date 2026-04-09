'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

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
  icon?: React.ComponentType<{ className?: string }>
  iconColor?: string
}

const colorMap: Record<string, { bg: string; text: string }> = {
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400' },
  green:   { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-400' },
  orange:  { bg: 'bg-orange-500/10',  text: 'text-orange-400' },
  red:     { bg: 'bg-red-500/10',     text: 'text-red-400' },
  default: { bg: 'bg-primary/10',     text: 'text-primary' },
}

export default function MetricCard({
  title,
  value,
  subtitle,
  description,
  buttonText,
  onButtonClick,
  trend,
  icon: Icon,
  iconColor = 'default',
}: MetricCardProps) {
  const colors = colorMap[iconColor] || colorMap.default

  return (
    <div className="card p-5 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
          {Icon ? (
            <Icon className={`w-5 h-5 ${colors.text}`} />
          ) : (
            <div className={`w-2.5 h-2.5 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
          )}
        </div>
        {trend && (
          <div className={`pill ${trend.isPositive ? 'pill-green' : 'pill-red'}`}>
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      <p className="text-3xl font-bold text-white tracking-tight mb-1">
        {typeof value === 'number' ? value.toLocaleString('sk-SK') : value}
      </p>
      <p className="text-sm text-muted">{title}</p>

      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
      {description && (
        <p className="text-xs text-gray-600 mt-0.5">{description}</p>
      )}

      {buttonText && (
        <button
          onClick={onButtonClick}
          className="mt-4 text-sm text-primary hover:text-blue-300 font-medium transition-colors"
        >
          {buttonText} &rarr;
        </button>
      )}
    </div>
  )
}
