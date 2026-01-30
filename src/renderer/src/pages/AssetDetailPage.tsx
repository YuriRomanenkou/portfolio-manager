import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Toolbar } from '../components/layout/Toolbar'
import { CurrencyDisplay } from '../components/common/CurrencyDisplay'
import { PercentageChange } from '../components/common/PercentageChange'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { usePortfolioStore } from '../stores/portfolioStore'
import { useSettingsStore } from '../stores/settingsStore'
import { ASSET_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from '../lib/constants'
import { formatCurrency, formatDate, formatNumber, formatShortDate } from '../lib/formatters'
import type {
  Transaction,
  PriceHistory,
  CreateTransactionInput,
  TransactionType
} from '../../../shared/types'

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { assets, fetchAssets, fetchTransactions, createTransaction, deleteTransaction } =
    usePortfolioStore()
  const { displayCurrency } = useSettingsStore()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddTransaction, setShowAddTransaction] = useState(false)

  // Transaction form
  const [txType, setTxType] = useState<TransactionType>('buy')
  const [txQuantity, setTxQuantity] = useState('')
  const [txPrice, setTxPrice] = useState('')
  const [txTotal, setTxTotal] = useState('')
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])
  const [txNotes, setTxNotes] = useState('')
  const mouseDownOnOverlay = useRef(false)

  const asset = assets.find((a) => a.id === Number(id))

  useEffect(() => {
    if (!id) return
    const loadData = async () => {
      setLoading(true)
      await fetchAssets()
      const txs = await fetchTransactions(Number(id))
      setTransactions(txs)

      try {
        const history = await window.api.prices.getHistory(Number(id))
        setPriceHistory(history)
      } catch {
        // ignore
      }

      setLoading(false)
    }
    loadData()
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!asset) {
    return (
      <>
        <Toolbar title="Актив не найден" />
        <div className="page-content">
          <div className="empty-state">
            <h3>Актив не найден</h3>
            <button className="btn btn-primary" onClick={() => navigate('/assets')}>
              К списку активов
            </button>
          </div>
        </div>
      </>
    )
  }

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    const input: CreateTransactionInput = {
      asset_id: asset.id,
      type: txType,
      quantity: txQuantity ? parseFloat(txQuantity) : undefined,
      price_per_unit: txPrice ? parseFloat(txPrice) : undefined,
      total_value: parseFloat(txTotal) || 0,
      currency: 'USD',
      date: txDate,
      notes: txNotes || undefined
    }

    await createTransaction(input)
    const txs = await fetchTransactions(asset.id)
    setTransactions(txs)
    setShowAddTransaction(false)
    setTxQuantity('')
    setTxPrice('')
    setTxTotal('')
    setTxNotes('')
  }

  const handleDeleteTx = async (txId: number) => {
    if (confirm('Удалить транзакцию?')) {
      await deleteTransaction(txId)
      const txs = await fetchTransactions(asset.id)
      setTransactions(txs)
    }
  }

  const chartData = [...priceHistory]
    .reverse()
    .map((p) => ({
      date: formatShortDate(p.date),
      price: displayCurrency === 'USD' ? p.price_usd : (p.price_amd ?? p.price_usd)
    }))

  return (
    <>
      <Toolbar title={asset.name} />
      <div className="page-content">
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/assets')}
          style={{ marginBottom: 16 }}
        >
          <ArrowLeft size={16} /> Назад
        </button>

        {/* Asset info */}
        <div className="stats-grid">
          <div className="card">
            <div className="card-title">Текущая стоимость</div>
            <div className="card-value">
              <CurrencyDisplay
                valueUsd={asset.total_value_usd}
                valueAmd={asset.total_value_amd}
              />
            </div>
          </div>
          <div className="card">
            <div className="card-title">Прибыль / Убыток</div>
            <div className={`card-value ${(asset.gain_loss_usd ?? 0) >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(asset.gain_loss_usd, 'USD')}
            </div>
            <PercentageChange value={asset.gain_loss_percent} />
          </div>
          <div className="card">
            <div className="card-title">Детали</div>
            <div style={{ fontSize: 14 }}>
              <div>
                Тип: <span className={`badge badge-${asset.asset_type}`}>{ASSET_TYPE_LABELS[asset.asset_type]}</span>
              </div>
              {asset.ticker && <div style={{ marginTop: 4 }}>Тикер: <strong>{asset.ticker}</strong></div>}
              {asset.quantity !== null && (
                <div style={{ marginTop: 4 }}>Количество: <strong>{formatNumber(asset.quantity)}</strong></div>
              )}
              {asset.purchase_price !== null && (
                <div style={{ marginTop: 4 }}>Цена покупки: <strong>{formatCurrency(asset.purchase_price, 'USD')}</strong></div>
              )}
              {asset.purchase_date && (
                <div style={{ marginTop: 4 }}>Дата покупки: {formatDate(asset.purchase_date)}</div>
              )}
              {asset.adjusted_purchase_price !== null && asset.purchase_price !== null &&
                Math.abs(asset.adjusted_purchase_price - asset.purchase_price) > 0.01 && (
                <div style={{ marginTop: 8, padding: '6px 8px', background: 'var(--color-warning-light)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                  Скорр. цена покупки: <strong>{formatCurrency(asset.adjusted_purchase_price, 'USD')}</strong>
                  {asset.split_factor !== null && (
                    <span className="text-muted"> (коэфф. {asset.split_factor.toFixed(4)})</span>
                  )}
                  <div style={{ color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Учтены сплиты/эмиссии с даты покупки
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price chart */}
        {chartData.length > 0 && (
          <div className="chart-container">
            <div className="chart-header">
              <span className="chart-title">История цены</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                <XAxis dataKey="date" fontSize={12} stroke="#9aa0a6" />
                <YAxis
                  fontSize={12}
                  stroke="#9aa0a6"
                  tickFormatter={(v) => formatCurrency(v, displayCurrency)}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value, displayCurrency), 'Цена']}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#1a73e8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Transactions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 500 }}>Транзакции</h3>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAddTransaction(true)}
          >
            <Plus size={16} /> Добавить
          </button>
        </div>

        {/* Add transaction dialog */}
        {showAddTransaction && (
          <div
            className="modal-overlay"
            onMouseDown={(e) => { mouseDownOnOverlay.current = e.target === e.currentTarget }}
            onMouseUp={(e) => {
              if (mouseDownOnOverlay.current && e.target === e.currentTarget) {
                setShowAddTransaction(false)
              }
              mouseDownOnOverlay.current = false
            }}
          >
            <div className="modal">
              <div className="modal-header">
                <span className="modal-title">Новая транзакция</span>
                <button className="btn-icon" onClick={() => setShowAddTransaction(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddTransaction}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Тип</label>
                    <select
                      className="form-select"
                      value={txType}
                      onChange={(e) => setTxType(e.target.value as TransactionType)}
                    >
                      {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Количество</label>
                      <input
                        className="form-input"
                        type="number"
                        step="any"
                        value={txQuantity}
                        onChange={(e) => setTxQuantity(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Цена за единицу</label>
                      <input
                        className="form-input"
                        type="number"
                        step="any"
                        value={txPrice}
                        onChange={(e) => setTxPrice(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Общая сумма (USD)</label>
                      <input
                        className="form-input"
                        type="number"
                        step="any"
                        value={txTotal}
                        onChange={(e) => setTxTotal(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Дата</label>
                      <input
                        className="form-input"
                        type="date"
                        value={txDate}
                        onChange={(e) => setTxDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Заметки</label>
                    <textarea
                      className="form-textarea"
                      value={txNotes}
                      onChange={(e) => setTxNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddTransaction(false)}
                  >
                    Отмена
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Добавить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {transactions.length === 0 ? (
          <div className="empty-state" style={{ padding: 20 }}>
            <p className="text-muted">Нет транзакций</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Тип</th>
                  <th className="text-right">Количество</th>
                  <th className="text-right">Цена</th>
                  <th className="text-right">Сумма</th>
                  <th>Заметки</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{formatDate(tx.date)}</td>
                    <td>{TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}</td>
                    <td className="text-right">{formatNumber(tx.quantity)}</td>
                    <td className="text-right">{formatCurrency(tx.price_per_unit, tx.currency)}</td>
                    <td className="text-right">{formatCurrency(tx.total_value, tx.currency)}</td>
                    <td className="text-muted">{tx.notes ?? '—'}</td>
                    <td>
                      <button
                        className="btn-icon"
                        onClick={() => handleDeleteTx(tx.id)}
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Notes */}
        {asset.notes && (
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-title">Заметки</div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{asset.notes}</p>
          </div>
        )}
      </div>
    </>
  )
}
