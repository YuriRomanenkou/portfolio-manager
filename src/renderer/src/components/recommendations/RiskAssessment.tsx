import React from 'react'
import { ASSET_TYPE_LABELS, CHART_COLORS } from '../../lib/constants'

interface RiskAssessmentProps {
  riskScore: number
  riskProfile: string
  currentAllocation: Record<string, number>
  idealAllocation: Record<string, number>
}

const riskProfileLabels: Record<string, string> = {
  aggressive: 'Агрессивный',
  moderate: 'Умеренный',
  conservative: 'Консервативный'
}

function getRiskColor(score: number): string {
  if (score <= 3) return '#34a853'
  if (score <= 6) return '#fbbc04'
  return '#ea4335'
}

function getRiskLabel(score: number): string {
  if (score <= 3) return 'Низкий'
  if (score <= 6) return 'Средний'
  return 'Высокий'
}

export function RiskAssessment({
  riskScore,
  riskProfile,
  currentAllocation,
  idealAllocation
}: RiskAssessmentProps) {
  const allTypes = new Set([
    ...Object.keys(currentAllocation),
    ...Object.keys(idealAllocation)
  ])

  return (
    <div>
      {/* Risk meter */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Уровень риска</div>
        <div className="risk-meter">
          <div className="risk-bar">
            <div
              className="risk-fill"
              style={{
                width: `${(riskScore / 10) * 100}%`,
                background: getRiskColor(riskScore)
              }}
            />
          </div>
          <span className="risk-label" style={{ color: getRiskColor(riskScore) }}>
            {riskScore}/10
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span className="text-muted">
            Риск: <strong>{getRiskLabel(riskScore)}</strong>
          </span>
          <span className="text-muted">
            Профиль: <strong>{riskProfileLabels[riskProfile] ?? riskProfile}</strong>
          </span>
        </div>
      </div>

      {/* Allocation comparison */}
      <div className="card">
        <div className="card-title">Сравнение распределения</div>
        <div className="allocation-comparison">
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Текущее</h4>
            {Array.from(allTypes).map((type) => {
              const value = currentAllocation[type] ?? 0
              return (
                <div className="allocation-bar-container" key={`current-${type}`}>
                  <div className="allocation-bar-label">
                    <span>
                      {ASSET_TYPE_LABELS[type as keyof typeof ASSET_TYPE_LABELS] ?? type}
                    </span>
                    <span>{value.toFixed(1)}%</span>
                  </div>
                  <div className="allocation-bar">
                    <div
                      className="allocation-bar-fill"
                      style={{ width: `${Math.min(value, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>
              Идеальное ({riskProfileLabels[riskProfile]})
            </h4>
            {Array.from(allTypes).map((type) => {
              const value = idealAllocation[type] ?? 0
              return (
                <div className="allocation-bar-container" key={`ideal-${type}`}>
                  <div className="allocation-bar-label">
                    <span>
                      {ASSET_TYPE_LABELS[type as keyof typeof ASSET_TYPE_LABELS] ?? type}
                    </span>
                    <span>{value.toFixed(1)}%</span>
                  </div>
                  <div className="allocation-bar">
                    <div
                      className="allocation-bar-fill"
                      style={{
                        width: `${Math.min(value, 100)}%`,
                        background: '#34a853'
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
