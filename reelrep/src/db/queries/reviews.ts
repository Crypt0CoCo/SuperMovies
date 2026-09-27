import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { films, profiles, reviews } from '@/db/schema'

// One shape for every review list, so ReviewCard can render any of them
const reviewFields = {
    id: reviews.id,
    rating: reviews.rating,
    body: reviews.body,
    status: reviews.status,
    submittedAt: reviews.submittedAt,
    author: { handle: profiles.handle, tier: profiles.tier },
    film: { tmdbId: films.tmdbId, title: films.title, year: films.year },
}

const reviewsWithJoins = () =>
    db.select(reviewFields)
        .from(reviews)
        .innerJoin(profiles, eq(reviews.userId, profiles.id))
        .innerJoin(films, eq(reviews.filmId, films.id))

export type ReviewRow = Awaited<ReturnType<typeof getRecentApprovedReviews>>[number]

export function getApprovedReviewsForFilm(tmdbId: number) {
    return reviewsWithJoins()
        .where(and(eq(films.tmdbId, tmdbId), eq(reviews.status, 'approved')))
        .orderBy(desc(reviews.submittedAt))
}

// All statuses: callers filter to 'approved' unless the viewer is the author
export function getReviewsByProfile(profileId: string) {
    return reviewsWithJoins()
        .where(eq(reviews.userId, profileId))
        .orderBy(desc(reviews.submittedAt))
}

export function getRecentApprovedReviews(limit: number) {
    return reviewsWithJoins()
        .where(eq(reviews.status, 'approved'))
        .orderBy(desc(reviews.submittedAt))
        .limit(limit)
}
