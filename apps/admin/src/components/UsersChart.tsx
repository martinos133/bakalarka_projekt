'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'

interface UserChartRow {
  date: string
  registrations: number
  companies: number
}

const periods = [
  { key: '3m', label: '3 mesiace' },
  { key: '30d', label: '30 dní' },
  { key: '7d', label: '7 dní' },
] as const

/** Paleta odlíšená od zlatej „Štatistiky inzerátov“ (sky / indigo) */
const COL_REG = '#38bdf8'
const COL_COMP = '#a5b4fc'

export default function UsersChart() {
  const [period, setPeriod] = useState<'7d' | '30d' | '3m'>('3m')
  const [data, setData] = useState<UserChartRow[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRegistrations, setTotalRegistrations] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const chartData = await api.getUserChartData(period)
        setData(chartData)
        const sum = chartData.reduce(
          (acc: number, item: { registrations: number }) => acc + item.registrations,
          0,
        )
        setTotalRegistrations(sum)
      } catch (error) {
        console.error('Error loading user chart data:', error)
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
        <div className="flex h-72 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500/25 border-t-sky-400" />
            Načítavanie grafu…
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Štatistika používateľov</h3>
          <p className="mt-0.5 text-sm text-muted">
            Nových registrácií v období:{' '}
            <span className="font-medium text-sky-300">{totalRegistrations.toLocaleString('sk-SK')}</span>
          </p>
        </div>
        <div className="flex rounded-xl bg-white/[0.06] p-0.5">
          {periods.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key as typeof period)}
              className={`
                rounded-[10px] px-4 py-1.5 text-xs font-medium transition-all duration-200
                ${
                  period === p.key
                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/25'
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
            <linearGradient id="usersChartGradReg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COL_REG} stopOpacity={0.28} />
              <stop offset="100%" stopColor={COL_REG} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="usersChartGradComp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COL_COMP} stopOpacity={0.22} />
              <stop offset="100%" stopColor={COL_COMP} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.06)" vertical={false} />
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
            cursor={{ stroke: 'rgba(56,189,248,0.12)' }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', color: '#9ca3af', paddingTop: '12px' }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="registrations"
            name="Registrácie"
            stroke={COL_REG}
            strokeWidth={2}
            fill="url(#usersChartGradReg)"
            dot={false}
            activeDot={{ r: 4, fill: COL_REG, stroke: '#0c4a6e', strokeWidth: 2 }}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="companies"
            name="Firmy"
            stroke={COL_COMP}
            strokeWidth={2}
            fill="url(#usersChartGradComp)"
            dot={false}
            activeDot={{ r: 4, fill: COL_COMP, stroke: '#312e81', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
