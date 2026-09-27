'use client'

import { useActionState } from 'react'
import { submitReview, type ReviewState } from '@/app/actions/reviews'

export default function ReviewForm({ tmdbId }: { tmdbId: number }) {
    const [state, formAction, pending] = useActionState<ReviewState, FormData>(submitReview, { error: null })

    return (
        <form action={formAction} className="flex flex-col gap-3">
            <input type="hidden" name="tmdbId" value={tmdbId} />
            <label className="flex items-center gap-2">
                Rating
                <select name="rating" defaultValue="7" className="border rounded px-2 py-1">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>
            </label>
            <textarea
                name="body"
                required
                rows={10}
                placeholder="At least 80 words"
                className="border rounded p-2"
            />
            {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
            <button type="submit" disabled={pending} className="self-start bg-black text-white rounded px-4 py-2 disabled:opacity-50">
                {pending ? 'Submitting…' : 'Submit review'}
            </button>
        </form>
    )
}
