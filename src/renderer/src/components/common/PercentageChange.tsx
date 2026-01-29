import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatPercent } from '../../lib/formatters'

interface PercentageChangeProps {
  value: number | null
  showIcon?: boolean
}

export function PercentageChange({ value, showIcon = true }: PercentageChangeProps) {
  if (value === null || value === undefined) return <span className="text-muted">—</span>

  const isPositive = value > 0
  const isNegative = value < 0
  const className = isPositive ? 'text-positive' : isNegative ? 'text-negative' : 'text-muted'

  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {showIcon && isPositive && <TrendingUp size={14} />}
      {showIcon && isNegative && <TrendingDown size={14} />}
      {showIcon && !isPositive && !isNegative && <Minus size={14} />}
      {formatPercent(value)}
    </span>
  )
}
