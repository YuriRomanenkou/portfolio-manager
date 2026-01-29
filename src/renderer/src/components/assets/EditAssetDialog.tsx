import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { AssetWithPrice, UpdateAssetInput } from '../../../../shared/types'
import { ASSET_TYPE_LABELS, isTradeableAsset, isManualValueAsset, isCashAsset } from '../../lib/constants'
import { usePortfolioStore } from '../../stores/portfolioStore'
import { useUiStore } from '../../stores/uiStore'

export function EditAssetDialog() {
  const { editAssetDialogOpen, editAssetId, closeEditAssetDialog } = useUiStore()
  const { assets, updateAsset } = usePortfolioStore()

  const asset = assets.find((a) => a.id === editAssetId)

  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [valueCurrency, setValueCurrency] = useState('USD')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (asset) {
      setName(asset.name)
      setQuantity(asset.quantity?.toString() ?? '')
      setEstimatedValue(asset.estimated_value?.toString() ?? '')
      setValueCurrency(asset.value_currency ?? 'USD')
      setPurchasePrice(asset.purchase_price?.toString() ?? '')
      setPurchaseDate(asset.purchase_date ?? '')
      setNotes(asset.notes ?? '')
    }
  }, [asset])

  if (!editAssetDialogOpen || !asset) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const input: UpdateAssetInput = {
      id: asset.id,
      name: name.trim(),
      quantity: quantity ? parseFloat(quantity) : undefined,
      estimated_value: estimatedValue ? parseFloat(estimatedValue) : undefined,
      value_currency: valueCurrency,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
      purchase_date: purchaseDate || undefined,
      notes: notes || undefined
    }

    await updateAsset(input)
    setSubmitting(false)
    closeEditAssetDialog()
  }

  return (
    <div className="modal-overlay" onClick={closeEditAssetDialog}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Редактировать: {asset.name}</span>
          <button className="btn-icon" onClick={closeEditAssetDialog}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Тип</label>
              <div className={`badge badge-${asset.asset_type}`}>
                {ASSET_TYPE_LABELS[asset.asset_type]}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Название</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {(isTradeableAsset(asset.asset_type) || isCashAsset(asset.asset_type)) && (
              <div className="form-group">
                <label className="form-label">
                  {isCashAsset(asset.asset_type) ? 'Сумма' : 'Количество'}
                </label>
                <input
                  className="form-input"
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            )}

            {isManualValueAsset(asset.asset_type) && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Оценочная стоимость</label>
                  <input
                    className="form-input"
                    type="number"
                    step="any"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Валюта</label>
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

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Цена покупки (USD)</label>
                <input
                  className="form-input"
                  type="number"
                  step="any"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
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

            <div className="form-group">
              <label className="form-label">Заметки</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeEditAssetDialog}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
