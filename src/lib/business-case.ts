import { CONVERSION_RATES, INTENSITY_WEIGHTS } from './signal-score'

/**
 * Business Case Calculation Library
 *
 * Generates revenue projections for brands based on campaign demand signals.
 * Answers: "If a brand responded to this campaign, how much could they make?"
 */

export interface CampaignData {
  // Lobby counts by intensity
  neatIdeaCount: number
  probablyBuyCount: number
  takeMyMoneyCount: number

  // Pledge counts
  supportCount: number
  intentCount: number
  intentVerifiedCount: number

  // Price ceiling data
  priceCeilings: number[]

  // Campaign quality metric
  signalScore: number
  completenessScore: number
}

export interface ScenarioProjection {
  customers: number
  revenue: number
  margin: number // percentage
}

export interface ConversionRates {
  neatIdea: number
  probablyBuy: number
  takeMyMoney: number
}

export interface PriceInsights {
  avgPriceCeiling: number
  medianPriceCeiling: number
  priceRange: { min: number; max: number }
  suggestedPricePoint: number
}

export interface BreakEvenAnalysis {
  unitsSold: number
  revenueNeeded: number
  timeToBreakEven: string
}

export interface BusinessCaseResult {
  // Market sizing
  totalDemandSignals: number
  weightedDemand: number

  // Revenue projections (3 scenarios)
  conservative: ScenarioProjection
  moderate: ScenarioProjection
  optimistic: ScenarioProjection

  // Pricing insights
  avgPriceCeiling: number
  medianPriceCeiling: number
  priceRange: { min: number; max: number }
  suggestedPricePoint: number

  // Conversion estimates
  conversionRates: {
    neatIdea: number
    probablyBuy: number
    takeMyMoney: number
  }
  estimatedCustomers: number

  // Confidence metrics
  confidenceLevel: 'low' | 'medium' | 'high' | 'very_high'
  confidenceScore: number
  dataSufficiency: string

  // Break-even analysis
  breakEven: BreakEvenAnalysis
}

/**
 * Calculate comprehensive business case for a campaign
 */
export function calculateBusinessCase(data: CampaignData): BusinessCaseResult {
  // Market sizing
  const totalLobbies = data.neatIdeaCount + data.probablyBuyCount + data.takeMyMoneyCount
  const totalDemandSignals = totalLobbies + data.supportCount + data.intentCount
  const weightedDemand =
    data.neatIdeaCount * INTENSITY_WEIGHTS.NEAT_IDEA +
    data.probablyBuyCount * INTENSITY_WEIGHTS.PROBABLY_BUY +
    data.takeMyMoneyCount * INTENSITY_WEIGHTS.TAKE_MY_MONEY

  // Price insights
  const priceInsights = calculatePriceInsights(data.priceCeilings)

  // Scenario-specific conversion rates
  const scenarioConversionRates = {
    conservative: {
      neatIdea: 0.02, // 2%
      probablyBuy: 0.15, // 15%
      takeMyMoney: 0.45, // 45%
    },
    moderate: {
      neatIdea: 0.05, // 5%
      probablyBuy: 0.25, // 25%
      takeMyMoney: 0.65, // 65%
    },
    optimistic: {
      neatIdea: 0.1, // 10%
      probablyBuy: 0.4, // 40%
      takeMyMoney: 0.8, // 80%
    },
  }

  // Calculate projections for each scenario
  const conservative = calculateScenarioProjection(
    data,
    scenarioConversionRates.conservative,
    priceInsights.medianPriceCeiling
  )
  const moderate = calculateScenarioProjection(
    data,
    scenarioConversionRates.moderate,
    priceInsights.medianPriceCeiling
  )
  const optimistic = calculateScenarioProjection(
    data,
    scenarioConversionRates.optimistic,
    priceInsights.medianPriceCeiling
  )

  // Confidence metrics
  const { confidenceLevel, confidenceScore } = calculateConfidence(data, priceInsights)

  // Break-even analysis (based on moderate scenario)
  const breakEven = calculateBreakEven(moderate, priceInsights.medianPriceCeiling)

  return {
    // Market sizing
    totalDemandSignals,
    weightedDemand,

    // Revenue projections
    conservative,
    moderate,
    optimistic,

    // Pricing insights
    avgPriceCeiling: priceInsights.avgPriceCeiling,
    medianPriceCeiling: priceInsights.medianPriceCeiling,
    priceRange: priceInsights.priceRange,
    suggestedPricePoint: priceInsights.suggestedPricePoint,

    // Conversion estimates
    conversionRates: scenarioConversionRates.moderate,
    estimatedCustomers: moderate.customers,

    // Confidence
    confidenceLevel,
    confidenceScore,
    dataSufficiency:
      data.priceCeilings.length > 20
        ? 'Sufficient data for reliable projections'
        : 'Need more price ceiling data for confidence',

    // Break-even
    breakEven,
  }
}

/**
 * Calculate price insights from pledge ceiling data
 */
function calculatePriceInsights(priceCeilings: number[]): PriceInsights {
  if (priceCeilings.length === 0) {
    return {
      avgPriceCeiling: 0,
      medianPriceCeiling: 0,
      priceRange: { min: 0, max: 0 },
      suggestedPricePoint: 0,
    }
  }

  const sorted = [...priceCeilings].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length
  const median = sorted[Math.floor(sorted.length / 2)]

  // Suggested price point: median at 85% (sweet spot between value capture and accessibility)
  const suggestedPricePoint = Math.round(median * 0.85 * 100) / 100

  return {
    avgPriceCeiling: Math.round(avg * 100) / 100,
    medianPriceCeiling: median,
    priceRange: { min, max },
    suggestedPricePoint,
  }
}

/**
 * Calculate revenue projection for a specific scenario
 */
function calculateScenarioProjection(
  data: CampaignData,
  conversions: { neatIdea: number; probablyBuy: number; takeMyMoney: number },
  avgPrice: number
): ScenarioProjection {
  const customers = Math.round(
    data.neatIdeaCount * conversions.neatIdea +
      data.probablyBuyCount * conversions.probablyBuy +
      data.takeMyMoneyCount * conversions.takeMyMoney +
      data.intentCount * 0.4 // Intent pledges at ~40% conversion across scenarios
  )

  const revenue = Math.round(customers * avgPrice)

  // Default margin assumption: 40% (can be customized per scenario)
  const margin = 40

  return {
    customers,
    revenue,
    margin,
  }
}

/**
 * Calculate confidence level based on data quality
 */
function calculateConfidence(
  data: CampaignData,
  priceInsights: PriceInsights
): { confidenceLevel: 'low' | 'medium' | 'high' | 'very_high'; confidenceScore: number } {
  let score = 0

  // Total signals (higher = more reliable)
  const totalSignals =
    data.neatIdeaCount + data.probablyBuyCount + data.takeMyMoneyCount +
    data.supportCount + data.intentCount
  if (totalSignals > 200) score += 30
  else if (totalSignals > 100) score += 20
  else if (totalSignals > 50) score += 10
  else score += 5

  // Price ceiling data quality (higher = better)
  const priceCeilingCount = data.priceCeilings.length
  if (priceCeilingCount > 50) score += 25
  else if (priceCeilingCount > 20) score += 20
  else if (priceCeilingCount > 10) score += 15
  else if (priceCeilingCount > 0) score += 10

  // Signal score tier (existing validation)
  if (data.signalScore > 75) score += 25
  else if (data.signalScore > 55) score += 20
  else if (data.signalScore > 35) score += 10
  else score += 5

  // Campaign completeness
  if (data.completenessScore > 80) score += 10
  else if (data.completenessScore > 60) score += 5
  else score += 2

  // Lobby intensity distribution (balanced = good)
  const totalLobbies = data.neatIdeaCount + data.probablyBuyCount + data.takeMyMoneyCount
  if (totalLobbies > 0) {
    const takeMoneyRatio = data.takeMyMoneyCount / totalLobbies
    if (takeMoneyRatio > 0.2) score += 5 // At least 20% strong signals
  }

  // Cap at 100
  const confidenceScore = Math.min(score, 100)

  let confidenceLevel: 'low' | 'medium' | 'high' | 'very_high'
  if (confidenceScore >= 80) confidenceLevel = 'very_high'
  else if (confidenceScore >= 60) confidenceLevel = 'high'
  else if (confidenceScore >= 40) confidenceLevel = 'medium'
  else confidenceLevel = 'low'

  return { confidenceLevel, confidenceScore }
}

/**
 * Calculate break-even point (simplified)
 */
function calculateBreakEven(
  scenario: ScenarioProjection,
  avgPrice: number
): BreakEvenAnalysis {
  // Assumptions
  const productionCostPerUnit = avgPrice * 0.35 // 35% COGS
  const fixedCosts = 5000 // £5k initial setup
  const marketingCosts = 2000 // £2k marketing

  const totalCosts = fixedCosts + marketingCosts + scenario.customers * productionCostPerUnit
  const unitsSold = Math.ceil(
    (fixedCosts + marketingCosts) / (avgPrice - productionCostPerUnit)
  )

  // Estimate time to break-even (assumes steady conversion over 3 months)
  let timeToBreakEven = '~3-4 months'
  if (scenario.customers > 500) timeToBreakEven = '~1-2 months'
  else if (scenario.customers < 50) timeToBreakEven = '~6+ months'

  return {
    unitsSold,
    revenueNeeded: Math.round(avgPrice * unitsSold),
    timeToBreakEven,
  }
}

/**
 * Calculate profit margin given production and operating costs
 */
export function calculateMargin(
  grossRevenue: number,
  productionCostPerUnit: number,
  unitsSold: number,
  fixedCosts: number = 0,
  variableCosts: number = 0
): number {
  const totalProductionCost = productionCostPerUnit * unitsSold
  const totalVariableCosts = variableCosts * unitsSold
  const totalCosts = totalProductionCost + totalVariableCosts + fixedCosts

  if (grossRevenue === 0) return 0
  return Math.round(((grossRevenue - totalCosts) / grossRevenue) * 100)
}
