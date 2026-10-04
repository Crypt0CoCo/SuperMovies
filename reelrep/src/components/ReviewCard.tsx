import Link from 'next/link'
import type { ReviewRow } from '@/db/queries/reviews'

export function TierBadge({ tier }: { tier: string }) {
    return <span className="text-xs uppercase tracking-wide border rounded px-1.5 py-0.5 text-gray-600">{tier}</span>
}

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
}

const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function ReviewCard({
    review,
    showFilm = false,
    showAuthor = false,
    showStatus = false,
}: {
    review: ReviewRow
    showFilm?: boolean
    showAuthor?: boolean
    showStatus?: boolean
}) {
    return (
        <article className="border-t pt-4 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold">{review.rating}/10</span>
                {showFilm && (
                    <Link href={`/film/${review.film.tmdbId}`} className="font-medium hover:underline">
                        {review.film.title}{review.film.year && ` (${review.film.year})`}
                    </Link>
                )}
                {showAuthor && (
                    <>
                        <Link href={`/u/${review.author.handle}`} className="hover:underline">@{review.author.handle}</Link>
                        <TierBadge tier={review.author.tier} />
                    </>
                )}
                {showStatus && (
                    <span className={`text-xs rounded px-1.5 py-0.5 ${STATUS_STYLES[review.status] ?? ''}`}>{review.status}</span>
                )}
                <time className="text-gray-500 ml-auto" dateTime={review.submittedAt.toISOString()}>
                    {formatDate(review.submittedAt)}
                </time>
            </div>
            <p className="whitespace-pre-line text-gray-800">{review.body}</p>
        </article>
    )
}
