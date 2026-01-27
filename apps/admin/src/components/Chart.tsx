'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'

interface ChartData {
  date: string
  advertisements: number
  active: number
}

export default function Chart() {
  const [period, setPeriod] = useState<'7d' | '30d' | '3m'>('3m')
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalAdvertisements, setTotalAdvertisements] = useState(0)
  const [totalVisitors, setTotalVisitors] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const chartData = await api.getChartData(period)
        setData(chartData)
        
        // Vypočítame celkové hodnoty
        const totalAds = chartData.reduce((sum, item) => sum + item.advertisements, 0)
        setTotalAdvertisements(totalAds)
        // Návštevníci zatiaľ nie sú implementované, takže 0
        setTotalVisitors(0)
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
    return date.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' })
  }

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6 border border-dark">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Načítavanie dát...</div>
        </div>
      </div>
    )
  }

  return (
      <div className="bg-card rounded-lg p-6 border border-dark">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Návštevníci a Inzeráty</h3>
          <p className="text-sm text-gray-400">
            Celkové inzeráty: {totalAdvertisements.toLocaleString('sk-SK')} • Celkoví návštevníci: {totalVisitors.toLocaleString('sk-SK')}
          </p>
        </div>
        <div className="flex space-x-2">
          {(['3m', '30d', '7d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark text-gray-400 hover:bg-cardHover hover:text-white'
                }
              `}
            >
              {p === '3m' ? 'Posledné 3 mesiace' : p === '30d' ? 'Posledných 30 dní' : 'Posledných 7 dní'}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#888"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            yAxisId="left"
            stroke="#888"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#888"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(28,28,28)',
              border: '1px solid rgb(10,10,10)',
              borderRadius: '8px',
              color: '#fff',
            }}
            labelFormatter={(label) => formatDate(label)}
          />
          <Legend
            wrapperStyle={{ color: '#fff' }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="advertisements"
            name="Inzeráty"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="active"
            name="Aktívne"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
