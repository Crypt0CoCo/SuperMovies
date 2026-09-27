import {db} from '@/db'
import {smokeTest} from '@/db/schema'
import { searchFilms } from '@/lib/tmdb'
import { createClient } from '@/lib/supabase/server'

export default async function Smoke() {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    await db.insert(smokeTest).values({note: `hit at ${new Date().toISOString()}`})
    const rows = await db.select().from(smokeTest).limit(5)
    const films = await searchFilms('batman')
    return (
        <pre className="p-8 text-xs">
            {JSON.stringify({user: user?.email ?? null, rows: rows.length, films: films.slice(0,3)}, null, 2)}
        </pre>
    )
}