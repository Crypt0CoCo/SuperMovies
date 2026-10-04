import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'

export async function getProfileByHandle(handle: string) {
    const [row] = await db.select().from(profiles).where(eq(profiles.handle, handle)).limit(1)
    return row ?? null
}

