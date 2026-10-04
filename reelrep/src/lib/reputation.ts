export const BASE_POINTS = 10

export const GRADE_MULTIPLIER = { 1: 1.0, 2: 1.5, 3: 2.5 } as const
export type Grade = keyof typeof GRADE_MULTIPLIER

// Ascending order matters: tierFor takes the last threshold the score reaches.
// Keep keys in sync with the `tier` enum in src/db/schema.ts
export const TIER_THRESHOLDS = { bronze: 0, silver: 100, gold: 400, critic: 1200 } as const
export type Tier = keyof typeof TIER_THRESHOLDS

export const pointsFor = (grade: Grade) => Math.round(BASE_POINTS * GRADE_MULTIPLIER[grade])

export function tierFor(score: number): Tier {
    let tier: Tier = 'bronze'
    for (const [name, min] of Object.entries(TIER_THRESHOLDS) as [Tier, number][]) {
        if (score >= min) tier = name
    }
    return tier
}

// ISO 8601 week, e.g. '2026-W40'. The week's Thursday decides the year,
// so 2027-01-01 (a Friday) is '2026-W53'.
export function currentEpochWeek(date = new Date()) {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1)
    const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7)
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
