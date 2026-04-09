'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'

interface ChartData {
  date: string
  advertisements: number
  active: number
}

const periods = [
  { key: '3m', label: '3 mesiace' },
  { key: '30d', label: '30 dní' },
  { key: '7d', label: '7 dní' },
] as const

export default function Chart() {
  const [period, setPeriod] = useState<'7d' | '30d' | '3m'>('3m')
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalAdvertisements, setTotalAdvertisements] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const chartData = await api.getChartData(period)
        setData(chartData)
        const totalAds = chartData.reduce((sum: number, item: { advertisements: number }) => sum + item.advertisements, 0)
        setTotalAdvertisements(totalAds)
      } catch (error) {
        console.error('Error loading chart data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [period])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-72">
          <div className="flex items-center gap-2 text-muted text-sm">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Načítavanie grafu...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-white">Štatistika inzerátov</h3>
          <p className="text-sm text-muted mt-0.5">
            Celkový počet inzerátov: <span className="text-white font-medium">{totalAdvertisements.toLocaleString('sk-SK')}</span>
          </p>
        </div>
        <div className="flex bg-white/[0.06] rounded-xl p-0.5">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key as typeof period)}
              className={`
                px-4 py-1.5 rounded-[10px] text-xs font-medium transition-all duration-200
                ${period === p.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
                }
              `}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2463eb" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#2463eb" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="transparent"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            stroke="transparent"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="transparent"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(28,28,28)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '10px 14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
            itemStyle={{ color: '#d1d5db', fontSize: '12px' }}
            labelStyle={{ color: '#fff', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}
            labelFormatter={(label) => formatDate(label)}
            cursor={{ stroke: 'rgba(255,255,255,0.06)' }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', color: '#9ca3af', paddingTop: '12px' }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="advertisements"
            name="Inzeráty"
            stroke="#2463eb"
            strokeWidth={2}
            fill="url(#colorAds)"
            dot={false}
            activeDot={{ r: 4, fill: '#2463eb', stroke: '#fff', strokeWidth: 2 }}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="active"
            name="Aktívne"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#colorActive)"
            dot={false}
            activeDot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
