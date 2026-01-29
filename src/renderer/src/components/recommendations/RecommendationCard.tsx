import React from 'react'
import { AlertTriangle, Lightbulb, Info } from 'lucide-react'
import type { Recommendation } from '../../../../shared/types'

const icons = {
  warning: AlertTriangle,
  suggestion: Lightbulb,
  info: Info
}

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const Icon = icons[recommendation.type]

  return (
    <div className={`recommendation-card ${recommendation.type}`}>
      <div className={`recommendation-icon ${recommendation.type}`}>
        <Icon size={16} />
      </div>
      <div>
        <div className="recommendation-title">{recommendation.title}</div>
        <div className="recommendation-text">{recommendation.description}</div>
      </div>
    </div>
  )
}
