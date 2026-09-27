import ReviewCard from '@/components/ReviewCard'
import { getRecentApprovedReviews } from '@/db/queries/reviews'

export default async function Home() {
    const recent = await getRecentApprovedReviews(20)

    return (
        <main className="max-w-2xl mx-auto p-8 flex flex-col gap-8">
            <form action="/search" className="flex gap-2">
                <input name="q" placeholder="Search films to review" className="flex-1 border rounded px-3 py-2" />
                <button type="submit" className="bg-black text-white rounded px-4 py-2">Search</button>
            </form>

            <section className="flex flex-col gap-4">
                <h1 className="font-semibold">Recent reviews</h1>
                {recent.length === 0
                    ? <p className="text-gray-500">No approved reviews yet.</p>
                    : recent.map((r) => <ReviewCard key={r.id} review={r} showFilm showAuthor />)}
            </section>
        </main>
    )
}
