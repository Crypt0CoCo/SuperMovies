import { eq, sum } from 'drizzle-orm'
import { db } from '@/db'
import { profiles, reputationEvents } from '@/db/schema'

export async function getProfileByHandle(handle: string) {
    const [row] = await db.select().from(profiles).where(eq(profiles.handle, handle)).limit(1)
    return row ?? null
}

// Reputation is derived from the append-only event log, never stored
export async function getRepScore(profileId: string) {
    const [row] = await db
        .select({ total: sum(reputationEvents.delta).mapWith(Number) })
        .from(reputationEvents)
        .where(eq(reputationEvents.userId, profileId))
    return row?.total ?? 0
}
