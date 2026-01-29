import React, { useEffect, useState } from 'react'
import { Plus, Filter } from 'lucide-react'
import { Toolbar } from '../components/layout/Toolbar'
import { AssetTable } from '../components/assets/AssetTable'
import { AddAssetDialog } from '../components/assets/AddAssetDialog'
import { EditAssetDialog } from '../components/assets/EditAssetDialog'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { usePortfolioStore } from '../stores/portfolioStore'
import { useUiStore } from '../stores/uiStore'
import { ASSET_TYPE_LABELS } from '../lib/constants'
import type { AssetType } from '../../../shared/types'

export function AssetsPage() {
  const { assets, loading, fetchAssets } = usePortfolioStore()
  const { openAddAssetDialog } = useUiStore()
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all')

  useEffect(() => {
    fetchAssets()
  }, [])

  const filteredAssets =
    filterType === 'all' ? assets : assets.filter((a) => a.asset_type === filterType)

  const assetTypes = [...new Set(assets.map((a) => a.asset_type))]

  return (
    <>
      <Toolbar title="Активы" />
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button className="btn btn-primary" onClick={openAddAssetDialog}>
            <Plus size={16} />
            Добавить актив
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <Filter size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <select
              className="currency-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as AssetType | 'all')}
            >
              <option value="all">Все типы</option>
              {assetTypes.map((type) => (
                <option key={type} value={type}>
                  {ASSET_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && assets.length === 0 ? (
          <LoadingSpinner />
        ) : (
          <AssetTable assets={filteredAssets} />
        )}
      </div>

      <AddAssetDialog />
      <EditAssetDialog />
    </>
  )
}
