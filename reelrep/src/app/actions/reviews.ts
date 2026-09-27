'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/db'
import { reviews } from '@/db/schema'
import { upsertFilm } from '@/db/queries/films'
import { currentProfile } from '@/lib/auth'
import { getFilmById } from '@/lib/tmdb'

export type ReviewState = { error: string | null }

const MIN_WORDS = 80

const ReviewInput = z.object({
    tmdbId: z.coerce.number().int().positive('Invalid film'),
    rating: z.coerce.number().int().min(1, 'Rating must be 1-10').max(10, 'Rating must be 1-10'),
    body: z.string().trim().min(1, 'Review cannot be empty'),
})

// Drizzle wraps driver errors in DrizzleQueryError, so the Postgres error may be on .cause
function isUniqueViolation(err: unknown, constraint: string) {
    for (const e of [err, (err as { cause?: unknown })?.cause]) {
        const pg = e as { code?: string; constraint_name?: string } | undefined
        if (pg?.code === '23505' && pg.constraint_name === constraint) return true
    }
    return false
}

export async function submitReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
    const profile = await currentProfile()
    if (!profile) return { error: 'You need to be signed in to write a review.' }

    const parsed = ReviewInput.safeParse({
        tmdbId: formData.get('tmdbId'),
        rating: formData.get('rating'),
        body: formData.get('body'),
    })
    if (!parsed.success) return { error: parsed.error.issues[0].message }
    const { tmdbId, rating, body } = parsed.data

    const words = body.split(/\s+/).length
    if (words < MIN_WORDS) return { error: `Reviews need at least ${MIN_WORDS} words. Yours has ${words}.` }

    // Film details come from TMDB, not the form, so the client can't spoof titles
    const tmdbFilm = await getFilmById(tmdbId)
    if (!tmdbFilm) return { error: 'Film not found.' }

    try {
        const film = await upsertFilm(tmdbFilm)
        await db.insert(reviews).values({
            userId: profile.id,
            filmId: film.id,
            rating,
            body,
            status: 'pending',
            submittedAt: new Date(),
        })
    } catch (err) {
        if (isUniqueViolation(err, 'reviews_one_per_film')) return { error: 'You have already reviewed this film.' }
        throw err
    }

    // redirect() throws, so it must stay outside the try/catch
    redirect(`/film/${tmdbId}?submitted=1`)
}
