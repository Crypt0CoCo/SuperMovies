'use client'

import { useState, useTransition } from 'react'
import { approveReview, rejectReview } from '@/app/actions/moderation'

export default function ModerationActions({ reviewId }: { reviewId: string }) {
    const [pending, startTransition] = useTransition()
    // Stays true after success until the refreshed queue drops this review,
    // so a click in that gap can't fire a second action
    const [done, setDone] = useState(false)
    const [reason, setReason] = useState('')
    const [error, setError] = useState<string | null>(null)
    const disabled = pending || done

    const run = (action: () => Promise<void>) => {
        setError(null)
        startTransition(async () => {
            try {
                await action()
                setDone(true)
            } catch {
                setError('Action failed. Check you are still signed in as a moderator.')
            }
        })
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">Approve with grade:</span>
                {([1, 2, 3] as const).map((grade) => (
                    <button
                        key={grade}
                        type="button"
                        disabled={disabled}
                        onClick={() => run(() => approveReview(reviewId, grade))}
                        className="bg-green-700 text-white rounded px-3 py-1 disabled:opacity-50"
                    >
                        {grade}
                    </button>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={disabled}
                    placeholder="Reason for rejecting"
                    className="flex-1 border rounded px-2 py-1 text-sm"
                />
                <button
                    type="button"
                    disabled={disabled || !reason.trim()}
                    onClick={() => run(() => rejectReview(reviewId, reason))}
                    className="bg-red-700 text-white rounded px-3 py-1 disabled:opacity-50"
                >
                    Reject
                </button>
            </div>
            {pending && <p className="text-sm text-gray-500">Saving…</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    )
}
