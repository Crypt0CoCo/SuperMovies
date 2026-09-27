const BASE = 'https://api.themoviedb.org/3'

export type TmdbFilm = {
    tmdbId: number
    title: string
    year: number | null
    posterPath: string | null
}

type RawFilm = {
    id: number
    title: string
    release_date?: string
    poster_path: string | null
}

const toFilm = (f: RawFilm): TmdbFilm => ({
    tmdbId: f.id,
    title: f.title,
    // release_date can be "" for unreleased films
    year: f.release_date ? Number(f.release_date.slice(0, 4)) : null,
    posterPath: f.poster_path,
})

const tmdbFetch = (path: string) =>
    fetch(`${BASE}${path}`, {
        headers: {Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`},
        next: {revalidate: 86400},
    })

export async function searchFilms(query: string): Promise<TmdbFilm[]> {
    const res = await tmdbFetch(`/search/movie?query=${encodeURIComponent(query)}&include_adult=false`)
    if (!res.ok) throw new Error(`TMDB ${res.status}`)
    const data: {results: RawFilm[]} = await res.json()
    return data.results.map(toFilm)
}

export async function getFilmById(tmdbId: number): Promise<TmdbFilm | null> {
    const res = await tmdbFetch(`/movie/${tmdbId}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`TMDB ${res.status}`)
    return toFilm(await res.json())
}

export function posterUrl(path: string | null, size = 'w200') {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : null
}
