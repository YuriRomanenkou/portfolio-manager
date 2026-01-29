import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import type { AssetWithPrice } from '../../../../shared/types'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCurrency } from '../../lib/formatters'

interface GainLossChartProps {
  assets: AssetWithPrice[]
}

export function GainLossChart({ assets }: GainLossChartProps) {
  const { displayCurrency } = useSettingsStore()

  const data = assets
    .filter((a) => a.gain_loss_usd !== null)
    .map((a) => ({
      name: a.name.length > 12 ? a.name.substring(0, 12) + '...' : a.name,
      value: a.gain_loss_usd!,
      percent: a.gain_loss_percent
    }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-header">
          <span className="chart-title">Прибыль / Убыток по активам</span>
        </div>
        <div className="empty-state" style={{ padding: 40 }}>
          <p>Укажите цену покупки активов для отображения прибыли/убытка</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <div className="chart-header">
        <span className="chart-title">Прибыль / Убыток по активам</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
          <XAxis
            type="number"
            fontSize={12}
            stroke="#9aa0a6"
            tickFormatter={(v) => formatCurrency(v, displayCurrency)}
          />
          <YAxis type="category" dataKey="name" fontSize={12} stroke="#9aa0a6" width={100} />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value, displayCurrency), 'Прибыль/Убыток']}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.value >= 0 ? '#34a853' : '#ea4335'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
