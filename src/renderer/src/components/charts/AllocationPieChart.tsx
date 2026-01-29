import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ASSET_TYPE_LABELS, CHART_COLORS } from '../../lib/constants'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCurrency } from '../../lib/formatters'

interface AllocationData {
  type: string
  value: number
  percentage: number
}

interface AllocationPieChartProps {
  data: AllocationData[]
}

export function AllocationPieChart({ data }: AllocationPieChartProps) {
  const { displayCurrency } = useSettingsStore()

  if (data.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-header">
          <span className="chart-title">Распределение активов</span>
        </div>
        <div className="empty-state" style={{ padding: 40 }}>
          <p>Добавьте активы для отображения распределения</p>
        </div>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: ASSET_TYPE_LABELS[d.type as keyof typeof ASSET_TYPE_LABELS] ?? d.type,
    value: d.value,
    percentage: d.percentage
  }))

  return (
    <div className="chart-container">
      <div className="chart-header">
        <span className="chart-title">Распределение активов</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={60}
            paddingAngle={2}
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value, displayCurrency)}
          />
          <Legend
            formatter={(value: string, entry: any) => {
              const item = chartData.find((d) => d.name === value)
              return `${value} (${item?.percentage.toFixed(1)}%)`
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
