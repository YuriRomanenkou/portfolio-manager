import React, { useEffect, useState } from 'react'
import { Toolbar } from '../components/layout/Toolbar'
import { RecommendationCard } from '../components/recommendations/RecommendationCard'
import { RiskAssessment } from '../components/recommendations/RiskAssessment'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { usePortfolioStore } from '../stores/portfolioStore'
import type { Recommendation } from '../../../shared/types'

export function RecommendationsPage() {
  const { assets, fetchAssets, byType, totalValueUsd } = usePortfolioStore()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [idealAllocation, setIdealAllocation] = useState<Record<string, number>>({})
  const [riskScore, setRiskScore] = useState(0)
  const [riskProfile, setRiskProfile] = useState('moderate')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchAssets()
      try {
        const data = await window.api.recommendations.get()
        setRecommendations(data.recommendations)
        setIdealAllocation(data.idealAllocation)
        setRiskScore(data.riskScore)
        setRiskProfile(data.riskProfile)
      } catch (error) {
        console.error('Failed to load recommendations:', error)
      }
      setLoading(false)
    }
    load()
  }, [])

  // Build current allocation percentages
  const currentAllocation: Record<string, number> = {}
  for (const [type, data] of Object.entries(byType)) {
    currentAllocation[type] = data.percentage
  }

  return (
    <>
      <Toolbar title="Рекомендации" />
      <div className="page-content">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <RiskAssessment
              riskScore={riskScore}
              riskProfile={riskProfile}
              currentAllocation={currentAllocation}
              idealAllocation={idealAllocation}
            />

            <h3 style={{ fontSize: 16, fontWeight: 500, margin: '24px 0 16px' }}>
              Рекомендации ({recommendations.length})
            </h3>

            {recommendations.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <p className="text-muted">
                  Нет рекомендаций. Ваш портфель хорошо сбалансирован!
                </p>
              </div>
            ) : (
              recommendations.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))
            )}
          </>
        )}
      </div>
    </>
  )
}
