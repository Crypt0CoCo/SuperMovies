import { pgTable, pgEnum, uuid, text, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

// PROVISIONAL: everything below smoke_test was written without access to the
// live database (see scripts/verify-db.ts). Reconcile with `drizzle-kit pull`
// before running `pnpm db:push`, or push may alter/drop the real tables.

export const smokeTest = pgTable('smoke_test', {
    id: uuid('id').primaryKey().defaultRandom(),
    note: text('note').notNull(),
    createdAt: timestamp('created_at', {
        withTimezone: true
    }).defaultNow().notNull()
})

export const reviewStatus = pgEnum('review_status', ['pending', 'approved', 'rejected'])
// Tier values are a guess; they only affect TS types, rows render whatever string is stored.
export const tier = pgEnum('tier', ['newcomer', 'regular', 'critic'])

// id matches auth.users.id; rows are created by the on_auth_user_created trigger.
export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey(),
    handle: text('handle').notNull().unique(),
    tier: tier('tier').notNull(),
})

export const films = pgTable('films', {
    id: uuid('id').primaryKey().defaultRandom(),
    tmdbId: integer('tmdb_id').notNull().unique(),
    title: text('title').notNull(),
    year: integer('year'),
    posterPath: text('poster_path'),
})

export const reviews = pgTable('reviews', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => profiles.id),
    filmId: uuid('film_id').notNull().references(() => films.id),
    rating: integer('rating').notNull(),
    body: text('body').notNull(),
    status: reviewStatus('status').notNull().default('pending'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
    uniqueIndex('reviews_one_per_film').on(t.userId, t.filmId),
])

// Append-only: never UPDATE or DELETE. Corrections are new rows with negative deltas.
// Only the columns read so far are declared.
export const reputationEvents = pgTable('reputation_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => profiles.id),
    delta: integer('delta').notNull(),
})
