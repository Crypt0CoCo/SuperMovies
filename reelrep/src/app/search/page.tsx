import Link from 'next/link'
import { searchFilms, posterUrl } from '@/lib/tmdb'

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const { q = '' } = await searchParams
    const query = q.trim()
    const results = query ? await searchFilms(query) : []

    return (
        <main className="max-w-2xl mx-auto p-8 flex flex-col gap-6">
            <form className="flex gap-2">
                <input name="q" defaultValue={query} placeholder="Search films" className="flex-1 border rounded px-3 py-2" />
                <button type="submit" className="bg-black text-white rounded px-4 py-2">Search</button>
            </form>

            {query && results.length === 0 && <p>No films found for “{query}”.</p>}

            <ul className="flex flex-col gap-3">
                {results.map((film) => {
                    const poster = posterUrl(film.posterPath, 'w92')
                    return (
                        <li key={film.tmdbId}>
                            <Link href={`/film/${film.tmdbId}`} className="flex items-center gap-3 hover:underline">
                                {poster
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={poster} alt="" width={46} height={69} className="rounded" />
                                    : <div className="w-[46px] h-[69px] bg-gray-200 rounded" />}
                                <span>{film.title}{film.year && ` (${film.year})`}</span>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </main>
    )
}
