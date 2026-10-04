import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReviewCard from '@/components/ReviewCard'
import ReviewForm from '@/components/ReviewForm'
import { getFilm } from '@/db/queries/films'
import { getApprovedReviewsForFilm } from '@/db/queries/reviews'
import { currentProfile } from '@/lib/auth'
import { getFilmById, posterUrl } from '@/lib/tmdb'

export default async function FilmPage({
    params,
    searchParams,
}: {
    params: Promise<{ tmdbId: string }>
    searchParams: Promise<{ submitted?: string }>
}) {
    const { tmdbId: raw } = await params
    const { submitted } = await searchParams
    const tmdbId = Number(raw)
    if (!Number.isInteger(tmdbId) || tmdbId <= 0) notFound()

    // Films are only stored once reviewed, so fall back to TMDB
    const film = (await getFilm(tmdbId)) ?? (await getFilmById(tmdbId))
    if (!film) notFound()

    const [profile, approved] = await Promise.all([currentProfile(), getApprovedReviewsForFilm(tmdbId)])
    const average = approved.length
        ? (approved.reduce((total, r) => total + r.rating, 0) / approved.length).toFixed(1)
        : null
    const poster = posterUrl(film.posterPath)

    return (
        <main className="max-w-2xl mx-auto p-8 flex flex-col gap-6">
            <div className="flex gap-4">
                {poster && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={poster} alt={`${film.title} poster`} width={200} height={300} className="rounded" />
                )}
                <div>
                    <h1 className="text-2xl font-bold">{film.title}</h1>
                    {film.year && <p className="text-gray-600">{film.year}</p>}
                    {average && (
                        <p className="mt-2">
                            <span className="text-xl font-semibold">{average}</span>/10
                            <span className="text-gray-500"> from {approved.length} review{approved.length === 1 ? '' : 's'}</span>
                        </p>
                    )}
                </div>
            </div>

            {submitted && <p className="text-green-700">Review submitted. It will appear once approved.</p>}

            {profile
                ? <ReviewForm tmdbId={tmdbId} />
                : <p><Link href="/login" className="underline">Sign in</Link> to write a review.</p>}

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold">Reviews</h2>
                {approved.length === 0
                    ? <p className="text-gray-500">No approved reviews yet.</p>
                    : approved.map((r) => <ReviewCard key={r.id} review={r} showAuthor />)}
            </section>
        </main>
    )
}
