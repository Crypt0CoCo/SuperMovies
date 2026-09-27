import { notFound } from 'next/navigation'
import ReviewCard, { TierBadge } from '@/components/ReviewCard'
import { getProfileByHandle } from '@/db/queries/profiles'
import { getReviewsByProfile } from '@/db/queries/reviews'
import { currentProfile } from '@/lib/auth'

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
    const { handle } = await params
    const profile = await getProfileByHandle(decodeURIComponent(handle))
    if (!profile) notFound()

    const [viewer, allReviews] = await Promise.all([currentProfile(), getReviewsByProfile(profile.id)])
    const isOwn = viewer?.id === profile.id
    const approved = allReviews.filter((r) => r.status === 'approved')
    const unpublished = allReviews.filter((r) => r.status !== 'approved')

    return (
        <main className="max-w-2xl mx-auto p-8 flex flex-col gap-8">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">@{profile.handle}</h1>
                <TierBadge tier={profile.tier} />
                <span className="text-gray-600 ml-auto">{profile.repScore} rep</span>
            </div>

            {isOwn && unpublished.length > 0 && (
                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold">Awaiting or declined <span className="text-gray-500 font-normal">(only you can see these)</span></h2>
                    {unpublished.map((r) => <ReviewCard key={r.id} review={r} showFilm showStatus />)}
                </section>
            )}

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold">Reviews</h2>
                {approved.length === 0
                    ? <p className="text-gray-500">No approved reviews yet.</p>
                    : approved.map((r) => <ReviewCard key={r.id} review={r} showFilm />)}
            </section>
        </main>
    )
}
