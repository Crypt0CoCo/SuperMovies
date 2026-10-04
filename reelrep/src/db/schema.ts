import { pgTable, pgEnum, uuid, text, integer, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

// Mirrors db/foundation.sql, which is the source of truth (it also holds the
// triggers, checks and RLS that Drizzle doesn't model). Change the SQL first,
// then this file. Never run `db:push`.

export const reviewStatus = pgEnum('review_status', ['pending', 'approved', 'rejected'])
// Keep in sync with TIER_THRESHOLDS in src/lib/reputation.ts
export const tier = pgEnum('tier', ['bronze', 'silver', 'gold', 'critic'])
export const repSource = pgEnum('rep_source', ['review', 'correction'])

// id matches auth.users.id; rows are created by the on_auth_user_created trigger.
export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey(),
    handle: text('handle').notNull().unique(),
    tier: tier('tier').notNull().default('bronze'),
    // Cache of SUM(reputation_events.delta), recomputed in approveReview
    repScore: integer('rep_score').notNull().default(0),
    isModerator: boolean('is_moderator').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const films = pgTable('films', {
    id: uuid('id').primaryKey().defaultRandom(),
    tmdbId: integer('tmdb_id').notNull().unique(),
    title: text('title').notNull(),
    year: integer('year'),
    posterPath: text('poster_path'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reviews = pgTable('reviews', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => profiles.id),
    filmId: uuid('film_id').notNull().references(() => films.id),
    rating: integer('rating').notNull(),
    body: text('body').notNull(),
    status: reviewStatus('status').notNull().default('pending'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
    qualityGrade: integer('quality_grade'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    moderatorId: uuid('moderator_id').references(() => profiles.id),
    rejectionReason: text('rejection_reason'),
}, (t) => [
    uniqueIndex('reviews_one_per_film').on(t.userId, t.filmId),
])

// Append-only (enforced by a DB trigger): corrections are new rows with negative deltas.
export const reputationEvents = pgTable('reputation_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => profiles.id),
    source: repSource('source').notNull(),
    delta: integer('delta').notNull(),
    refId: uuid('ref_id'),
    epochWeek: text('epoch_week').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
