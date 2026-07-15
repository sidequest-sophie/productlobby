/**
 * Simple env-driven feature flag gate.
 *
 * Features listed here are not yet backed by real data/logic and are kept
 * behind a flag so they 404 in production until they're genuinely built.
 * Enable a feature by adding its flag name to the comma-separated
 * ENABLED_FEATURES env var, e.g. `ENABLED_FEATURES=donations,press-kit`.
 *
 * Default: nothing enabled.
 */

function getEnabledFeatures(): Set<string> {
  const raw = process.env.ENABLED_FEATURES || ''
  return new Set(
    raw
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean)
  )
}

export function isFeatureEnabled(flag: string): boolean {
  return getEnabledFeatures().has(flag)
}
