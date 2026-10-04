// Run a .sql file against the database (the file manages its own transaction).
// Run: pnpm dotenv -e .env.local -- pnpm tsx scripts/run-sql.ts db/foundation.sql
import { readFileSync } from 'node:fs'
import postgres from 'postgres'

const file = process.argv[2]
if (!file) {
    console.error('Usage: tsx scripts/run-sql.ts <file.sql>')
    process.exit(1)
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!url) {
    console.error('DIRECT_URL or DATABASE_URL must be set')
    process.exit(1)
}

const sql = postgres(url, { prepare: false, max: 1 })

sql.unsafe(readFileSync(file, 'utf8'))
    .then(() => console.log(`Applied ${file}`))
    .catch((err) => {
        console.error(`Failed: ${err.message}`)
        process.exitCode = 1
    })
    .finally(() => sql.end())
