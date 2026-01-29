export interface ExchangeRateResponse {
  [currency: string]: number
}

// Frankfurter API - ECB rates (no key needed, no limits)
// Doesn't include AMD, so we use it for major currencies
export async function getFrankfurterRates(
  base: string = 'USD',
  targets: string[] = ['EUR', 'GBP', 'JPY', 'CHF', 'RUB']
): Promise<ExchangeRateResponse> {
  try {
    const symbols = targets.join(',')
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${base}&to=${symbols}`
    )

    if (!response.ok) return {}

    const data = await response.json()
    return data.rates || {}
  } catch (error) {
    console.error('Frankfurter API error:', error)
    return {}
  }
}

// ExchangeRate-API for AMD and other currencies (no key, 150+ currencies)
export async function getExchangeRateApiRates(
  base: string = 'USD'
): Promise<ExchangeRateResponse> {
  try {
    const response = await fetch(
      `https://open.er-api.com/v6/latest/${base}`
    )

    if (!response.ok) return {}

    const data = await response.json()
    return data.rates || {}
  } catch (error) {
    console.error('ExchangeRate-API error:', error)
    return {}
  }
}

export async function getUsdToAmdRate(): Promise<number | null> {
  const rates = await getExchangeRateApiRates('USD')
  return rates['AMD'] ?? null
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number | null> {
  if (from === to) return amount

  const rates = await getExchangeRateApiRates(from)
  const rate = rates[to]

  if (!rate) return null

  return amount * rate
}
