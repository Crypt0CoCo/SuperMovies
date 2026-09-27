// Grant moderator rights to the profile belonging to an auth email.
// Run: pnpm dotenv -e .env.local -- pnpm tsx scripts/make-moderator.ts you@example.com
import postgres from 'postgres'

const email = process.argv[2]
if (!email) {
    console.error('Usage: tsx scripts/make-moderator.ts <email>')
    process.exit(1)
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!url) {
    console.error('DIRECT_URL or DATABASE_URL must be set')
    process.exit(1)
}

const sql = postgres(url, { prepare: false, max: 1 })

async function main() {
    const rows = await sql<{ handle: string }[]>`
        update public.profiles set is_moderator = true
        where id = (select id from auth.users where lower(email) = lower(${email}))
        returning handle`
    if (rows.length === 0) {
        console.error(`No profile found for ${email}. Has this address signed in at least once?`)
        process.exitCode = 1
    } else {
        console.log(`@${rows[0].handle} (${email}) is now a moderator`)
    }
}

main()
    .catch((err) => {
        console.error(`Failed: ${err.message}`)
        process.exitCode = 1
    })
    .finally(() => sql.end())
