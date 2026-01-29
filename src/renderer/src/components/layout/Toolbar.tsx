import React from 'react'
import { RefreshCw, Download } from 'lucide-react'
import { usePortfolioStore } from '../../stores/portfolioStore'
import { useSettingsStore } from '../../stores/settingsStore'
import type { DisplayCurrency } from '../../../../shared/types'

export function Toolbar({ title }: { title: string }) {
  const { refreshPrices, loading } = usePortfolioStore()
  const { displayCurrency, setDisplayCurrency } = useSettingsStore()

  const handleExportCSV = async () => {
    try {
      await window.api.export.csv()
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <div className="toolbar">
      <span className="toolbar-title">{title}</span>

      <button
        className="btn btn-secondary"
        onClick={() => refreshPrices()}
        disabled={loading}
      >
        <RefreshCw size={16} className={loading ? 'spinning' : ''} />
        Обновить
      </button>

      <select
        className="currency-select"
        value={displayCurrency}
        onChange={(e) => setDisplayCurrency(e.target.value as DisplayCurrency)}
      >
        <option value="USD">USD ($)</option>
        <option value="AMD">AMD (֏)</option>
      </select>

      <button className="btn-icon" onClick={handleExportCSV} title="Экспорт CSV">
        <Download size={18} />
      </button>
    </div>
  )
}
