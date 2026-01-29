import { net } from 'electron'
import { PriceData, TickerSearchResult } from '../../shared/types'

const CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'
const SEARCH_URL = 'https://query1.finance.yahoo.com/v1/finance/search'

function yahooFetch(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const request = net.request(url)
    request.setHeader('User-Agent', 'Mozilla/5.0')
    let body = ''

    request.on('response', (response) => {
      response.on('data', (chunk) => {
        body += chunk.toString()
      })
      response.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch {
          reject(new Error(`Failed to parse response from ${url}`))
        }
      })
      response.on('error', reject)
    })

    request.on('error', reject)
    request.end()
  })
}

export async function getStockPrice(ticker: string): Promise<PriceData | null> {
  try {
    const url = `${CHART_URL}/${encodeURIComponent(ticker)}?interval=1d&range=1d`
    const data = await yahooFetch(url)

    const result = data?.chart?.result?.[0]
    if (!result) return null

    const meta = result.meta
    const price = meta?.regularMarketPrice
    if (!price) return null

    const prevClose = meta.chartPreviousClose ?? meta.previousClose
    let changePercent: number | null = null
    if (prevClose && prevClose > 0) {
      changePercent = ((price - prevClose) / prevClose) * 100
    }

    return {
      price_usd: price,
      price_amd: null,
      change_24h_percent: changePercent,
      source: 'yahoo',
      updated_at: new Date().toISOString()
    }
  } catch (error) {
    console.error(`Yahoo Finance error for ${ticker}:`, error)
    return null
  }
}

export async function getStockPrices(
  tickers: string[]
): Promise<Map<string, PriceData>> {
  const result = new Map<string, PriceData>()

  for (const ticker of tickers) {
    const price = await getStockPrice(ticker)
    if (price) {
      result.set(ticker, price)
    }
  }

  return result
}

/**
 * Fetch the split/dilution-adjusted close price at a specific date.
 * Yahoo chart API returns adjusted prices by default, accounting for
 * stock splits and secondary offerings that dilute share value.
 */
export async function getHistoricalAdjustedPrice(
  ticker: string,
  dateStr: string
): Promise<{ adjustedClose: number; rawClose: number; splitFactor: number } | null> {
  try {
    const date = new Date(dateStr)
    // period1 = start of that day, period2 = +3 days (to ensure we get at least one trading day)
    const period1 = Math.floor(date.getTime() / 1000)
    const period2 = period1 + 3 * 86400

    const url =
      `${CHART_URL}/${encodeURIComponent(ticker)}` +
      `?period1=${period1}&period2=${period2}&interval=1d&events=splits`

    const data = await yahooFetch(url)
    const result = data?.chart?.result?.[0]
    if (!result) return null

    const closes = result.indicators?.quote?.[0]?.close
    const adjCloses = result.indicators?.adjclose?.[0]?.adjclose

    if (!closes || closes.length === 0) return null

    // Find first valid trading day
    let rawClose: number | null = null
    let adjustedClose: number | null = null

    for (let i = 0; i < closes.length; i++) {
      if (closes[i] != null) {
        rawClose = closes[i]
        adjustedClose = adjCloses?.[i] ?? rawClose
        break
      }
    }

    if (rawClose === null || adjustedClose === null) return null

    // splitFactor: how much the raw price was adjusted
    // If splitFactor < 1, shares were split (diluted) since that date
    const splitFactor = adjustedClose / rawClose

    return { adjustedClose, rawClose, splitFactor }
  } catch (error) {
    console.error(`Yahoo historical price error for ${ticker} at ${dateStr}:`, error)
    return null
  }
}

export async function searchTickers(query: string): Promise<TickerSearchResult[]> {
  try {
    const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`
    const data = await yahooFetch(url)

    return (data.quotes || [])
      .filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
      .slice(0, 10)
      .map((q: any) => ({
        symbol: q.symbol,
        name: (q.longname || q.shortname || q.symbol) as string,
        type: q.quoteType === 'ETF' ? 'etf' : 'stock',
        exchange: q.exchange
      }))
  } catch (error) {
    console.error('Yahoo search error:', error)
    return []
  }
}
