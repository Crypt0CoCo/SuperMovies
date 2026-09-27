// Read-only check that the Supabase database matches the Day 0 foundation.
// Run: pnpm dotenv -e .env.local -- pnpm tsx scripts/verify-db.ts
import postgres from 'postgres'

const TABLES = ['profiles', 'films', 'reviews', 'review_checks', 'votes', 'reputation_events']
const ENUMS = ['review_status', 'tier', 'rep_source']

const url = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!url) {
    console.error('DIRECT_URL or DATABASE_URL must be set')
    process.exit(1)
}

const sql = postgres(url, { prepare: false, max: 1 })

type Result = { name: string; pass: boolean; detail: string }
const results: Result[] = []

const missing = (expected: string[], found: string[]) => expected.filter((x) => !found.includes(x))

async function check(name: string, fn: () => Promise<{ pass: boolean; detail: string }>) {
    try {
        results.push({ name, ...(await fn()) })
    } catch (err) {
        results.push({ name, pass: false, detail: `query failed: ${(err as Error).message}` })
    }
}

async function main() {
    await check('1. Six tables exist in public', async () => {
        const rows = await sql<{ table_name: string }[]>`
            select table_name from information_schema.tables
            where table_schema = 'public' and table_name in ${sql(TABLES)}`
        const gone = missing(TABLES, rows.map((r) => r.table_name))
        return { pass: gone.length === 0, detail: gone.length ? `missing: ${gone.join(', ')}` : 'all present' }
    })

    await check('2. Three enums exist in public', async () => {
        const rows = await sql<{ typname: string }[]>`
            select t.typname from pg_type t
            join pg_namespace n on n.oid = t.typnamespace
            where n.nspname = 'public' and t.typtype = 'e' and t.typname in ${sql(ENUMS)}`
        const gone = missing(ENUMS, rows.map((r) => r.typname))
        return { pass: gone.length === 0, detail: gone.length ? `missing: ${gone.join(', ')}` : 'all present' }
    })

    await check('3. RLS enabled on all six tables', async () => {
        const rows = await sql<{ tablename: string; rowsecurity: boolean }[]>`
            select tablename, rowsecurity from pg_tables
            where schemaname = 'public' and tablename in ${sql(TABLES)}`
        const off = rows.filter((r) => !r.rowsecurity).map((r) => r.tablename)
        const absent = missing(TABLES, rows.map((r) => r.tablename))
        const problems = [
            off.length ? `RLS off: ${off.join(', ')}` : '',
            absent.length ? `table missing: ${absent.join(', ')}` : '',
        ].filter(Boolean)
        return { pass: problems.length === 0, detail: problems.join('; ') || 'enabled on all' }
    })

    await check('4. Unique index reviews_one_per_film exists', async () => {
        const rows = await sql<{ tablename: string; indexdef: string }[]>`
            select tablename, indexdef from pg_indexes
            where schemaname = 'public' and indexname = 'reviews_one_per_film'`
        if (rows.length === 0) return { pass: false, detail: 'index not found' }
        const { tablename, indexdef } = rows[0]
        const unique = indexdef.startsWith('CREATE UNIQUE INDEX')
        return {
            pass: unique && tablename === 'reviews',
            detail: !unique ? `exists but is NOT unique: ${indexdef}` : tablename !== 'reviews' ? `on wrong table: ${tablename}` : indexdef,
        }
    })

    await check('5. Trigger on_auth_user_created on auth.users', async () => {
        const rows = await sql<{ tgenabled: string; fn: string }[]>`
            select t.tgenabled, p.proname as fn from pg_trigger t
            join pg_class c on c.oid = t.tgrelid
            join pg_namespace n on n.oid = c.relnamespace
            join pg_proc p on p.oid = t.tgfoid
            where n.nspname = 'auth' and c.relname = 'users'
              and t.tgname = 'on_auth_user_created' and not t.tgisinternal`
        if (rows.length === 0) return { pass: false, detail: 'trigger not found' }
        const enabled = rows[0].tgenabled !== 'D'
        return { pass: enabled, detail: `${enabled ? 'enabled' : 'DISABLED'}, calls ${rows[0].fn}()` }
    })

    await check('6. profiles has a foreign key to auth.users', async () => {
        const rows = await sql<{ conname: string; def: string }[]>`
            select conname, pg_get_constraintdef(oid) as def from pg_constraint
            where contype = 'f'
              and conrelid = to_regclass('public.profiles')
              and confrelid = to_regclass('auth.users')`
        return rows.length
            ? { pass: true, detail: `${rows[0].conname}: ${rows[0].def}` }
            : { pass: false, detail: 'no FK from public.profiles to auth.users' }
    })
}

main()
    .finally(() => sql.end())
    .then(() => {
        console.log('\nDatabase verification\n')
        for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}\n      ${r.detail}`)
        const failed = results.filter((r) => !r.pass).length
        console.log(`\n${results.length - failed}/${results.length} checks passed${failed ? `, ${failed} failed` : ''}\n`)
        process.exit(failed ? 1 : 0)
    })
