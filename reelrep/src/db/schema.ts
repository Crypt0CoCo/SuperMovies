import { pgTable, pgEnum, uuid, text, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

// PROVISIONAL: profiles, films and reviews were written without access to the
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

// id matches auth.users.id; rows are created by the on_auth_user_created trigger.
export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey(),
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
