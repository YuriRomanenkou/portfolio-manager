import { format, parseISO, isValid } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CURRENCY_SYMBOLS } from './constants'

export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'USD'
): string {
  if (value === null || value === undefined) return '—'

  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  const absValue = Math.abs(value)

  let formatted: string
  if (absValue >= 1_000_000) {
    formatted = `${(value / 1_000_000).toFixed(2)}M`
  } else if (absValue >= 1_000) {
    formatted = value.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  } else if (absValue >= 1) {
    formatted = value.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  } else {
    formatted = value.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    })
  }

  return `${symbol}${formatted}`
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6
  })
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return dateStr
    return format(date, 'd MMM yyyy', { locale: ru })
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return dateStr
    return format(date, 'd MMM yyyy, HH:mm', { locale: ru })
  } catch {
    return dateStr
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return dateStr
    return format(date, 'dd.MM', { locale: ru })
  } catch {
    return dateStr
  }
}
