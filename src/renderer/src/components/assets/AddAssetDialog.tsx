import React, { useState, useCallback, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { AssetType, CreateAssetInput, TickerSearchResult } from '../../../../shared/types'
import { ASSET_TYPE_OPTIONS, isTradeableAsset, isManualValueAsset, isCashAsset } from '../../lib/constants'
import { usePortfolioStore } from '../../stores/portfolioStore'
import { useUiStore } from '../../stores/uiStore'

export function AddAssetDialog() {
  const { addAssetDialogOpen, closeAddAssetDialog } = useUiStore()
  const { createAsset } = usePortfolioStore()

  const [assetType, setAssetType] = useState<AssetType>('crypto')
  const [name, setName] = useState('')
  const [ticker, setTicker] = useState('')
  const [apiId, setApiId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [valueCurrency, setValueCurrency] = useState('USD')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [notes, setNotes] = useState('')
  const [currencyCode, setCurrencyCode] = useState('USD')
  const [searchResults, setSearchResults] = useState<TickerSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()
  const mouseDownOnOverlay = useRef(false)

  const resetForm = useCallback(() => {
    setName('')
    setTicker('')
    setApiId('')
    setQuantity('')
    setEstimatedValue('')
    setValueCurrency('USD')
    setPurchasePrice('')
    setPurchaseDate('')
    setNotes('')
    setCurrencyCode('USD')
    setSearchResults([])
  }, [])

  useEffect(() => {
    if (!addAssetDialogOpen) resetForm()
  }, [addAssetDialogOpen, resetForm])

  const handleTickerSearch = (query: string) => {
    setTicker(query)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    if (query.length < 2) {
      setSearchResults([])
      return
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await window.api.prices.searchTicker(query, assetType)
        setSearchResults(results)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  const handleSelectTicker = (result: TickerSearchResult) => {
    setTicker(result.symbol)
    if (!name) setName(result.name)
    if (result.type === 'crypto' && result.exchange) {
      const id = result.exchange.replace('CoinGecko ID: ', '')
      setApiId(id)
    }
    setSearchResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)

    const input: CreateAssetInput = {
      name: name.trim(),
      asset_type: assetType,
      ticker: ticker || undefined,
      api_id: apiId || undefined,
      quantity: quantity ? parseFloat(quantity) : undefined,
      estimated_value: estimatedValue ? parseFloat(estimatedValue) : undefined,
      value_currency: valueCurrency || undefined,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
      purchase_date: purchaseDate || undefined,
      notes: notes || undefined,
      currency_code: isCashAsset(assetType) ? currencyCode : undefined
    }

    await createAsset(input)
    setSubmitting(false)
    closeAddAssetDialog()
  }

  if (!addAssetDialogOpen) return null

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    mouseDownOnOverlay.current = e.target === e.currentTarget
  }

  const handleOverlayMouseUp = (e: React.MouseEvent) => {
    if (mouseDownOnOverlay.current && e.target === e.currentTarget) {
      closeAddAssetDialog()
    }
    mouseDownOnOverlay.current = false
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Добавить актив</span>
          <button className="btn-icon" onClick={closeAddAssetDialog}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Тип актива</label>
              <select
                className="form-select"
                value={assetType}
                onChange={(e) => {
                  setAssetType(e.target.value as AssetType)
                  resetForm()
                }}
              >
                {ASSET_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Название</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  assetType === 'crypto' ? 'Bitcoin' :
                  assetType === 'stock' ? 'Apple Inc.' :
                  assetType === 'cash' ? 'Наличные USD' :
                  'Название актива'
                }
                required
              />
            </div>

            {/* Tradeable assets: ticker search */}
            {isTradeableAsset(assetType) && (
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">
                  {assetType === 'crypto' ? 'Тикер / Поиск монеты' : 'Тикер'}
                </label>
                <input
                  className="form-input"
                  value={ticker}
                  onChange={(e) => handleTickerSearch(e.target.value)}
                  placeholder={assetType === 'crypto' ? 'BTC' : 'AAPL'}
                />
                {searchResults.length > 0 && (
                  <div className="ticker-search-results">
                    {searchResults.map((r, i) => (
                      <div
                        key={i}
                        className="ticker-search-item"
                        onClick={() => handleSelectTicker(r)}
                      >
                        <span>
                          <span className="ticker-symbol">{r.symbol}</span>{' '}
                          <span className="ticker-name">{r.name}</span>
                        </span>
                        {r.exchange && (
                          <span className="text-muted" style={{ fontSize: 12 }}>
                            {r.exchange}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {searching && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-disabled)', marginTop: 4 }}>
                    Поиск...
                  </div>
                )}
              </div>
            )}

            {/* Tradeable: quantity + purchase price */}
            {isTradeableAsset(assetType) && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Количество</label>
                  <input
                    className="form-input"
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Цена покупки (USD)</label>
                  <input
                    className="form-input"
                    type="number"
                    step="any"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {/* Cash: amount + currency */}
            {isCashAsset(assetType) && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Сумма</label>
                  <input
                    className="form-input"
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Валюта</label>
                  <select
                    className="form-select"
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                  >
                    <option value="USD">USD — Доллар</option>
                    <option value="AMD">AMD — Драм</option>
                    <option value="EUR">EUR — Евро</option>
                    <option value="GBP">GBP — Фунт</option>
                    <option value="RUB">RUB — Рубль</option>
                    <option value="JPY">JPY — Иена</option>
                  </select>
                </div>
              </div>
            )}

            {/* Manual value assets */}
            {isManualValueAsset(assetType) && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Оценочная стоимость</label>
                  <input
                    className="form-input"
                    type="number"
                    step="any"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Валюта оценки</label>
                  <select
                    className="form-select"
                    value={valueCurrency}
                    onChange={(e) => setValueCurrency(e.target.value)}
                  >
                    <option value="USD">USD</option>
                    <option value="AMD">AMD</option>
                    <option value="EUR">EUR</option>
                    <option value="RUB">RUB</option>
                  </select>
                </div>
              </div>
            )}

            {/* Manual value: purchase price */}
            {isManualValueAsset(assetType) && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Цена покупки</label>
                  <input
                    className="form-input"
                    type="number"
                    step="any"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Дата покупки</label>
                  <input
                    className="form-input"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Date for tradeable */}
            {isTradeableAsset(assetType) && (
              <div className="form-group">
                <label className="form-label">Дата покупки</label>
                <input
                  className="form-input"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Заметки</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Дополнительная информация..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeAddAssetDialog}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !name.trim()}>
              {submitting ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
