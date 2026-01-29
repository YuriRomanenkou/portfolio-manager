import React from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCurrency } from '../../lib/formatters'

interface CurrencyDisplayProps {
  valueUsd: number | null
  valueAmd: number | null
  className?: string
}

export function CurrencyDisplay({ valueUsd, valueAmd, className }: CurrencyDisplayProps) {
  const { displayCurrency } = useSettingsStore()
  const value = displayCurrency === 'USD' ? valueUsd : valueAmd
  return <span className={className}>{formatCurrency(value, displayCurrency)}</span>
}
