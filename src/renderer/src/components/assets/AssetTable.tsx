import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Wallet } from 'lucide-react'
import type { AssetWithPrice } from '../../../../shared/types'
import { ASSET_TYPE_LABELS } from '../../lib/constants'
import { CurrencyDisplay } from '../common/CurrencyDisplay'
import { PercentageChange } from '../common/PercentageChange'
import { formatNumber } from '../../lib/formatters'
import { useUiStore } from '../../stores/uiStore'
import { usePortfolioStore } from '../../stores/portfolioStore'

interface AssetTableProps {
  assets: AssetWithPrice[]
}

export function AssetTable({ assets }: AssetTableProps) {
  const navigate = useNavigate()
  const { openEditAssetDialog } = useUiStore()
  const { deleteAsset } = usePortfolioStore()

  if (assets.length === 0) {
    return (
      <div className="empty-state">
        <Wallet />
        <h3>Нет активов</h3>
        <p>Добавьте ваш первый актив для начала отслеживания портфеля</p>
      </div>
    )
  }

  const handleDelete = async (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation()
    if (confirm(`Удалить актив "${name}"?`)) {
      await deleteAsset(id)
    }
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Название</th>
            <th>Тип</th>
            <th className="text-right">Количество</th>
            <th className="text-right">Стоимость</th>
            <th className="text-right">Прибыль/Убыток</th>
            <th className="text-right">Изменение</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr
              key={asset.id}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/assets/${asset.id}`)}
            >
              <td>
                <div style={{ fontWeight: 500 }}>{asset.name}</div>
                {asset.ticker && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {asset.ticker}
                  </div>
                )}
              </td>
              <td>
                <span className={`badge badge-${asset.asset_type}`}>
                  {ASSET_TYPE_LABELS[asset.asset_type]}
                </span>
              </td>
              <td className="text-right">{formatNumber(asset.quantity)}</td>
              <td className="text-right">
                <CurrencyDisplay
                  valueUsd={asset.total_value_usd}
                  valueAmd={asset.total_value_amd}
                />
              </td>
              <td className="text-right">
                <CurrencyDisplay
                  valueUsd={asset.gain_loss_usd}
                  valueAmd={asset.gain_loss_usd !== null ? (asset.gain_loss_usd * (asset.total_value_amd ?? 0)) / (asset.total_value_usd || 1) : null}
                  className={
                    (asset.gain_loss_usd ?? 0) >= 0 ? 'text-positive' : 'text-negative'
                  }
                />
              </td>
              <td className="text-right">
                <PercentageChange value={asset.gain_loss_percent} />
              </td>
              <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                <button
                  className="btn-icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    openEditAssetDialog(asset.id)
                  }}
                  title="Редактировать"
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="btn-icon"
                  onClick={(e) => handleDelete(e, asset.id, asset.name)}
                  title="Удалить"
                  style={{ color: 'var(--color-danger)' }}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
