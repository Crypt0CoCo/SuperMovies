'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, sum } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { profiles, reputationEvents, reviews } from '@/db/schema'
import { currentProfile } from '@/lib/auth'
import { currentEpochWeek, pointsFor, tierFor, type Grade } from '@/lib/reputation'

async function requireModerator() {
    const profile = await currentProfile()
    if (!profile?.isModerator) throw new Error('Not a moderator')
    return profile
}

const ApproveInput = z.object({
    reviewId: z.uuid(),
    grade: z.union([z.literal(1), z.literal(2), z.literal(3)]),
})

const RejectInput = z.object({
    reviewId: z.uuid(),
    reason: z.string().trim().min(1, 'A reason is required'),
})

export async function approveReview(reviewId: string, grade: number) {
    const moderator = await requireModerator()
    const input = ApproveInput.parse({ reviewId, grade })

    await db.transaction(async (tx) => {
        // Only a pending review can be approved. The status check in the WHERE makes this
        // idempotent even under double-submits: the second UPDATE waits on the row lock,
        // then matches nothing once the first commits, so no second reputation event.
        const [review] = await tx
            .update(reviews)
            .set({ status: 'approved', qualityGrade: input.grade, decidedAt: new Date(), moderatorId: moderator.id })
            .where(and(eq(reviews.id, input.reviewId), eq(reviews.status, 'pending')))
            .returning({ userId: reviews.userId })
        if (!review) return

        // Lock the author's profile so concurrent approvals for the same author
        // compute rep_score one after another instead of from stale sums
        await tx.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, review.userId)).for('update')

        // Append-only: reputation_events is never updated or deleted
        await tx.insert(reputationEvents).values({
            userId: review.userId,
            source: 'review',
            delta: pointsFor(input.grade as Grade),
            refId: input.reviewId,
            epochWeek: currentEpochWeek(),
        })

        const [{ total }] = await tx
            .select({ total: sum(reputationEvents.delta).mapWith(Number) })
            .from(reputationEvents)
            .where(eq(reputationEvents.userId, review.userId))
        const repScore = total ?? 0
        await tx.update(profiles).set({ repScore, tier: tierFor(repScore) }).where(eq(profiles.id, review.userId))
    })

    revalidatePath('/mod')
}

export async function rejectReview(reviewId: string, reason: string) {
    const moderator = await requireModerator()
    const input = RejectInput.parse({ reviewId, reason })

    await db.transaction(async (tx) => {
        await tx
            .update(reviews)
            .set({ status: 'rejected', rejectionReason: input.reason, decidedAt: new Date(), moderatorId: moderator.id })
            .where(and(eq(reviews.id, input.reviewId), eq(reviews.status, 'pending')))
    })

    revalidatePath('/mod')
}
