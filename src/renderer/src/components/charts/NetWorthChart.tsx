import React, { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import type { PortfolioSnapshot } from '../../../../shared/types'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCurrency, formatShortDate } from '../../lib/formatters'

interface NetWorthChartProps {
  snapshots: PortfolioSnapshot[]
}

type Period = '7d' | '30d' | '90d' | '365d' | 'all'

export function NetWorthChart({ snapshots }: NetWorthChartProps) {
  const [period, setPeriod] = useState<Period>('30d')
  const { displayCurrency } = useSettingsStore()

  const periodDays: Record<Period, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '365d': 365,
    all: 99999
  }

  const filteredSnapshots = snapshots
    .slice(0, periodDays[period])
    .reverse()
    .map((s) => ({
      date: formatShortDate(s.date),
      value: displayCurrency === 'USD' ? s.total_value_usd : s.total_value_amd
    }))

  if (filteredSnapshots.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-header">
          <span className="chart-title">Стоимость портфеля</span>
        </div>
        <div className="empty-state" style={{ padding: 40 }}>
          <p>Нет данных для отображения. Данные появятся после обновления цен.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <div className="chart-header">
        <span className="chart-title">Стоимость портфеля</span>
        <div className="period-selector">
          {(['7d', '30d', '90d', '365d', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              className={`period-btn${period === p ? ' active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === 'all' ? 'Все' : p}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={filteredSnapshots}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
          <XAxis dataKey="date" fontSize={12} stroke="#9aa0a6" />
          <YAxis
            fontSize={12}
            stroke="#9aa0a6"
            tickFormatter={(v) => formatCurrency(v, displayCurrency)}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value, displayCurrency), 'Стоимость']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#1a73e8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
