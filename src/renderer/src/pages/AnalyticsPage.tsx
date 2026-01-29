import React, { useEffect } from 'react'
import { Toolbar } from '../components/layout/Toolbar'
import { NetWorthChart } from '../components/charts/NetWorthChart'
import { AllocationPieChart } from '../components/charts/AllocationPieChart'
import { GainLossChart } from '../components/charts/GainLossChart'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { CurrencyDisplay } from '../components/common/CurrencyDisplay'
import { PercentageChange } from '../components/common/PercentageChange'
import { usePortfolioStore } from '../stores/portfolioStore'
import { useSettingsStore } from '../stores/settingsStore'
import { ASSET_TYPE_LABELS } from '../lib/constants'
import { formatCurrency } from '../lib/formatters'

export function AnalyticsPage() {
  const {
    assets,
    loading,
    totalValueUsd,
    totalValueAmd,
    byType,
    snapshots,
    fetchAssets,
    fetchSnapshots,
    fetchStats
  } = usePortfolioStore()

  const { displayCurrency } = useSettingsStore()

  useEffect(() => {
    fetchAssets()
    fetchSnapshots()
    fetchStats()
  }, [])

  const allocationData = Object.entries(byType).map(([type, data]) => ({
    type,
    value:
      displayCurrency === 'USD'
        ? data.value_usd
        : data.value_usd * (totalValueAmd / (totalValueUsd || 1)),
    percentage: data.percentage
  }))

  if (loading && assets.length === 0) {
    return (
      <>
        <Toolbar title="Аналитика" />
        <div className="page-content">
          <LoadingSpinner />
        </div>
      </>
    )
  }

  return (
    <>
      <Toolbar title="Аналитика" />
      <div className="page-content">
        {/* Net Worth over time */}
        <NetWorthChart snapshots={snapshots} />

        {/* Two column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <AllocationPieChart data={allocationData} />
          <GainLossChart assets={assets} />
        </div>

        {/* Breakdown by type */}
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-title">Разбивка по типам активов</div>
          <table>
            <thead>
              <tr>
                <th>Тип актива</th>
                <th className="text-right">Количество</th>
                <th className="text-right">Стоимость</th>
                <th className="text-right">Доля</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byType)
                .sort((a, b) => b[1].value_usd - a[1].value_usd)
                .map(([type, data]) => (
                  <tr key={type}>
                    <td>
                      <span className={`badge badge-${type}`}>
                        {ASSET_TYPE_LABELS[type as keyof typeof ASSET_TYPE_LABELS] ?? type}
                      </span>
                    </td>
                    <td className="text-right">{data.count}</td>
                    <td className="text-right">
                      {formatCurrency(
                        displayCurrency === 'USD'
                          ? data.value_usd
                          : data.value_usd * (totalValueAmd / (totalValueUsd || 1)),
                        displayCurrency
                      )}
                    </td>
                    <td className="text-right">{data.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Individual assets performance */}
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-title">Производительность активов</div>
          <table>
            <thead>
              <tr>
                <th>Актив</th>
                <th className="text-right">Стоимость</th>
                <th className="text-right">Прибыль/Убыток</th>
                <th className="text-right">Доходность</th>
                <th className="text-right">Доля портфеля</th>
              </tr>
            </thead>
            <tbody>
              {[...assets]
                .sort((a, b) => (b.total_value_usd ?? 0) - (a.total_value_usd ?? 0))
                .map((asset) => {
                  const share =
                    totalValueUsd > 0
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
                      <td className="text-right">
                        <CurrencyDisplay
                          valueUsd={asset.gain_loss_usd}
                          valueAmd={
                            asset.gain_loss_usd !== null
                              ? asset.gain_loss_usd *
                                (totalValueAmd / (totalValueUsd || 1))
                              : null
                          }
                          className={
                            (asset.gain_loss_usd ?? 0) >= 0
                              ? 'text-positive'
                              : 'text-negative'
                          }
                        />
                      </td>
                      <td className="text-right">
                        <PercentageChange value={asset.gain_loss_percent} />
                      </td>
                      <td className="text-right">{share.toFixed(1)}%</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
