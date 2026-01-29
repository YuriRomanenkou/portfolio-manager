import { AssetWithPrice, Recommendation, RiskProfile, PortfolioBreakdown } from '../../shared/types'

const IDEAL_ALLOCATIONS: Record<RiskProfile, Record<string, number>> = {
  aggressive: {
    crypto: 30,
    stock: 40,
    etf: 10,
    bond: 5,
    cash: 5,
    real_estate: 10
  },
  moderate: {
    crypto: 15,
    stock: 30,
    etf: 15,
    bond: 15,
    cash: 10,
    real_estate: 15
  },
  conservative: {
    crypto: 5,
    stock: 20,
    etf: 10,
    bond: 30,
    cash: 20,
    real_estate: 15
  }
}

export function generateRecommendations(
  assets: AssetWithPrice[],
  riskProfile: RiskProfile
): Recommendation[] {
  const recommendations: Recommendation[] = []
  const totalValue = assets.reduce((sum, a) => sum + (a.total_value_usd ?? 0), 0)

  if (totalValue === 0) {
    recommendations.push({
      id: 'no-assets',
      type: 'info',
      title: 'Начните формировать портфель',
      description: 'Добавьте ваши активы, чтобы получить персональные рекомендации по управлению портфелем.',
      priority: 1
    })
    return recommendations
  }

  // Calculate current allocation
  const allocation: Record<string, number> = {}
  for (const asset of assets) {
    const value = asset.total_value_usd ?? 0
    const type = asset.asset_type
    allocation[type] = (allocation[type] ?? 0) + value
  }

  const allocationPercent: Record<string, number> = {}
  for (const [type, value] of Object.entries(allocation)) {
    allocationPercent[type] = (value / totalValue) * 100
  }

  // Rule: Crypto > 40%
  if ((allocationPercent['crypto'] ?? 0) > 40) {
    recommendations.push({
      id: 'crypto-high',
      type: 'warning',
      title: 'Высокая доля криптовалют',
      description: `Криптовалюты составляют ${(allocationPercent['crypto']).toFixed(1)}% портфеля. Рассмотрите снижение доли до ${IDEAL_ALLOCATIONS[riskProfile].crypto ?? 15}% для уменьшения волатильности.`,
      priority: 1
    })
  }

  // Rule: Single asset > 30%
  for (const asset of assets) {
    const assetPercent = ((asset.total_value_usd ?? 0) / totalValue) * 100
    if (assetPercent > 30) {
      recommendations.push({
        id: `concentration-${asset.id}`,
        type: 'warning',
        title: `Высокая концентрация: ${asset.name}`,
        description: `${asset.name} составляет ${assetPercent.toFixed(1)}% портфеля. Высокая концентрация увеличивает риск. Рассмотрите диверсификацию.`,
        priority: 2
      })
    }
  }

  // Rule: Cash < 10%
  const cashPercent = allocationPercent['cash'] ?? 0
  if (cashPercent < 10) {
    recommendations.push({
      id: 'low-cash',
      type: 'suggestion',
      title: 'Низкий денежный резерв',
      description: `Денежные средства составляют ${cashPercent.toFixed(1)}% портфеля. Рекомендуется поддерживать минимум 10% в ликвидных средствах как подушку безопасности.`,
      priority: 3
    })
  }

  // Rule: No bonds
  if (!allocation['bond'] && riskProfile !== 'aggressive') {
    recommendations.push({
      id: 'no-bonds',
      type: 'suggestion',
      title: 'Добавьте облигации для стабильности',
      description: `В вашем портфеле нет облигаций. Для профиля "${riskProfile === 'moderate' ? 'Умеренный' : 'Консервативный'}" рекомендуется ${IDEAL_ALLOCATIONS[riskProfile].bond}% в облигациях.`,
      priority: 4
    })
  }

  // Rule: No diversification (< 3 types)
  const activeTypes = Object.keys(allocation).length
  if (activeTypes < 3) {
    recommendations.push({
      id: 'low-diversification',
      type: 'suggestion',
      title: 'Низкая диверсификация',
      description: `Ваш портфель включает только ${activeTypes} тип(а) активов. Рассмотрите расширение в другие классы активов для снижения рисков.`,
      priority: 3
    })
  }

  // Rule: Heavy in risky assets for conservative profile
  if (riskProfile === 'conservative') {
    const riskyPercent = (allocationPercent['crypto'] ?? 0) + (allocationPercent['stock'] ?? 0)
    if (riskyPercent > 50) {
      recommendations.push({
        id: 'too-risky-conservative',
        type: 'warning',
        title: 'Портфель слишком рискованный',
        description: `Акции и криптовалюты составляют ${riskyPercent.toFixed(1)}% портфеля. Для консервативного профиля рекомендуется не более 25% в рисковых активах.`,
        priority: 1
      })
    }
  }

  // Sort by priority
  recommendations.sort((a, b) => a.priority - b.priority)

  return recommendations
}

export function getIdealAllocation(riskProfile: RiskProfile): Record<string, number> {
  return IDEAL_ALLOCATIONS[riskProfile]
}

export function getRiskScore(assets: AssetWithPrice[]): number {
  const totalValue = assets.reduce((sum, a) => sum + (a.total_value_usd ?? 0), 0)
  if (totalValue === 0) return 0

  const riskWeights: Record<string, number> = {
    crypto: 9,
    stock: 6,
    etf: 4,
    bond: 2,
    cash: 1,
    real_estate: 3,
    vehicle: 3,
    collectible: 7,
    electronics: 5,
    other: 5
  }

  let weightedSum = 0
  for (const asset of assets) {
    const value = asset.total_value_usd ?? 0
    const weight = riskWeights[asset.asset_type] ?? 5
    weightedSum += (value / totalValue) * weight
  }

  return Math.round(weightedSum * 10) / 10 // 1-10 scale
}
