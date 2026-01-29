import React, { useEffect } from 'react'
import { TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react'
import { Toolbar } from '../components/layout/Toolbar'
import { NetWorthChart } from '../components/charts/NetWorthChart'
import { AllocationPieChart } from '../components/charts/AllocationPieChart'
import { usePortfolioStore } from '../stores/portfolioStore'
import { useSettingsStore } from '../stores/settingsStore'
import { CurrencyDisplay } from '../components/common/CurrencyDisplay'
import { PercentageChange } from '../components/common/PercentageChange'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { formatCurrency } from '../lib/formatters'

export function DashboardPage() {
  const {
    assets,
    loading,
    totalValueUsd,
    totalValueAmd,
    totalGainLoss,
    assetCount,
    byType,
    snapshots,
    fetchAssets,
    fetchSnapshots
  } = usePortfolioStore()

  const { displayCurrency } = useSettingsStore()

  useEffect(() => {
    fetchAssets()
    fetchSnapshots()
  }, [])

  // Show loading spinner while data is being fetched
  if (loading && assets.length === 0) {
    return (
      <>
        <Toolbar title="Обзор портфеля" />
        <div className="page-content">
          <LoadingSpinner />
        </div>
      </>
    )
  }

  const gainLossPercent =
    totalValueUsd > 0 && totalGainLoss !== 0
      ? (totalGainLoss / (totalValueUsd - totalGainLoss)) * 100
      : null

  const allocationData = Object.entries(byType).map(([type, data]) => ({
    type,
    value: displayCurrency === 'USD' ? data.value_usd : data.value_usd * (totalValueAmd / (totalValueUsd || 1)),
    percentage: data.percentage
  }))

  return (
    <>
      <Toolbar title="Обзор портфеля" />
      <div className="page-content">
        <div className="stats-grid">
              <div className="card">
                <div className="card-title">
                  <DollarSign size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Общая стоимость
                </div>
                <div className="card-value">
                  {formatCurrency(
                    displayCurrency === 'USD' ? totalValueUsd : totalValueAmd,
                    displayCurrency
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-title">
                  {totalGainLoss >= 0 ? (
                    <TrendingUp size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  ) : (
                    <TrendingDown size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  )}
                  Прибыль / Убыток
                </div>
                <div className={`card-value ${totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(totalGainLoss, 'USD')}
                </div>
                <div style={{ marginTop: 4 }}>
                  <PercentageChange value={gainLossPercent} />
                </div>
              </div>

              <div className="card">
                <div className="card-title">
                  <Wallet size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Количество активов
                </div>
                <div className="card-value">{assetCount}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {Object.keys(byType).length} типов
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <NetWorthChart snapshots={snapshots} />
              <AllocationPieChart data={allocationData} />
            </div>

            {/* Top assets */}
            {assets.length > 0 && (
              <div className="card" style={{ marginTop: 24 }}>
                <div className="card-title">Топ активы по стоимости</div>
                <table>
                  <thead>
                    <tr>
                      <th>Актив</th>
                      <th className="text-right">Стоимость</th>
                      <th className="text-right">Доля</th>
                      <th className="text-right">Изменение</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...assets]
                      .sort((a, b) => (b.total_value_usd ?? 0) - (a.total_value_usd ?? 0))
                      .slice(0, 5)
                      .map((asset) => {
                        const share = totalValueUsd > 0
                          ? ((asset.total_value_usd ?? 0) / totalValueUsd) * 100
                          : 0
                        return (
                          <tr key={asset.id}>
                            <td style={{ fontWeight: 500 }}>{asset.name}</td>
                            <td className="text-right">
                              <CurrencyDisplay
                                valueUsd={asset.total_value_usd}
                                valueAmd={asset.total_value_amd}
                              />
                            </td>
                            <td className="text-right">{share.toFixed(1)}%</td>
                            <td className="text-right">
                              <PercentageChange value={asset.gain_loss_percent} />
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}
      </div>
    </>
  )
}
