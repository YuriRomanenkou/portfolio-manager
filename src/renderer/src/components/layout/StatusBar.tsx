import React from 'react'
import { usePortfolioStore } from '../../stores/portfolioStore'

export function StatusBar() {
  const { lastUpdated, assetCount, loading } = usePortfolioStore()

  return (
    <div className="statusbar">
      <span>
        <span className={`statusbar-dot${loading ? ' offline' : ''}`} />{' '}
        {loading ? 'Обновление...' : 'Подключено'}
      </span>
      {lastUpdated && <span>Последнее обновление: {lastUpdated}</span>}
      <span>Активов: {assetCount}</span>
    </div>
  )
}
