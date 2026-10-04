import Link from 'next/link'
import { redirect } from 'next/navigation'
import ModerationActions from '@/components/ModerationActions'
import { TierBadge } from '@/components/ReviewCard'
import { getPendingReviews } from '@/db/queries/reviews'
import { currentProfile } from '@/lib/auth'

export default async function ModerationPage() {
    const profile = await currentProfile()
    if (!profile?.isModerator) redirect('/')

    const pending = await getPendingReviews()

    return (
        <main className="max-w-2xl mx-auto p-8 flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Moderation queue <span className="text-gray-500 font-normal">({pending.length})</span></h1>

            {pending.length === 0 && <p className="text-gray-500">Nothing waiting.</p>}

            {pending.map((r) => (
                <article key={r.id} className="border rounded p-4 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Link href={`/film/${r.film.tmdbId}`} className="font-medium hover:underline">
                            {r.film.title}{r.film.year && ` (${r.film.year})`}
                        </Link>
                        <Link href={`/u/${r.author.handle}`} className="hover:underline">@{r.author.handle}</Link>
                        <TierBadge tier={r.author.tier} />
                        <span className="font-semibold">{r.rating}/10</span>
                        <span className="text-gray-500 ml-auto">
                            {r.body.trim().split(/\s+/).length} words · {r.submittedAt.toLocaleDateString('en-GB')}
                        </span>
                    </div>
                    <p className="whitespace-pre-line text-gray-800">{r.body}</p>
                    <ModerationActions reviewId={r.id} />
                </article>
            ))}
        </main>
    )
}
