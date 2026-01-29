import React, { useEffect } from 'react'
import { Download, FileJson } from 'lucide-react'
import { Toolbar } from '../components/layout/Toolbar'
import { useSettingsStore } from '../stores/settingsStore'
import { RISK_PROFILE_LABELS } from '../lib/constants'
import type { DisplayCurrency, RiskProfile } from '../../../shared/types'

export function SettingsPage() {
  const {
    displayCurrency,
    updateIntervalMinutes,
    riskProfile,
    fetchSettings,
    setDisplayCurrency,
    setUpdateInterval,
    setRiskProfile
  } = useSettingsStore()

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleExportCSV = async () => {
    try {
      await window.api.export.csv()
    } catch (error) {
      console.error('Export CSV failed:', error)
    }
  }

  const handleExportJSON = async () => {
    try {
      await window.api.export.json()
    } catch (error) {
      console.error('Export JSON failed:', error)
    }
  }

  return (
    <>
      <Toolbar title="Настройки" />
      <div className="page-content" style={{ maxWidth: 600 }}>
        {/* Display Currency */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Валюта отображения</div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Выберите основную валюту для отображения стоимости портфеля
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['USD', 'AMD'] as DisplayCurrency[]).map((c) => (
              <button
                key={c}
                className={`btn ${displayCurrency === c ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDisplayCurrency(c)}
              >
                {c === 'USD' ? '$ USD' : '֏ AMD'}
              </button>
            ))}
          </div>
        </div>

        {/* Update Interval */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Интервал обновления цен</div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Как часто автоматически обновлять цены активов
          </p>
          <select
            className="form-select"
            value={updateIntervalMinutes}
            onChange={(e) => setUpdateInterval(parseInt(e.target.value))}
            style={{ maxWidth: 200 }}
          >
            <option value="5">Каждые 5 минут</option>
            <option value="15">Каждые 15 минут</option>
            <option value="30">Каждые 30 минут</option>
            <option value="60">Каждый час</option>
            <option value="360">Каждые 6 часов</option>
          </select>
        </div>

        {/* Risk Profile */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Профиль риска</div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Ваш инвестиционный профиль для персонализированных рекомендаций
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(RISK_PROFILE_LABELS).map(([key, label]) => (
              <button
                key={key}
                className={`btn ${riskProfile === key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRiskProfile(key as RiskProfile)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Экспорт данных</div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Экспортируйте данные портфеля в файл
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              <Download size={16} /> Экспорт CSV
            </button>
            <button className="btn btn-secondary" onClick={handleExportJSON}>
              <FileJson size={16} /> Экспорт JSON
            </button>
          </div>
        </div>

        {/* About */}
        <div className="card">
          <div className="card-title">О приложении</div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Portfolio Manager v1.0.0
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Десктоп-приложение для управления персональным инвестиционным портфелем.
            Отслеживание активов, аналитика и рекомендации.
          </p>
        </div>
      </div>
    </>
  )
}
