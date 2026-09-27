import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'

export async function currentProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1)
    return profile ?? null
}
