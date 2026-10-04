import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { films } from '@/db/schema'
import type { TmdbFilm } from '@/lib/tmdb'

export async function upsertFilm(film: TmdbFilm) {
    const [row] = await db
        .insert(films)
        .values(film)
        .onConflictDoUpdate({
            target: films.tmdbId,
            set: { title: film.title, year: film.year, posterPath: film.posterPath },
        })
        .returning()
    return row
}

export async function getFilm(tmdbId: number) {
    const [row] = await db.select().from(films).where(eq(films.tmdbId, tmdbId)).limit(1)
    return row ?? null
}
