'use client'

import { use, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error: authError } = use(searchParams)
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
    const [error, setError] = useState<string | null>(authError === 'auth' ? 'That sign-in link was invalid or expired.' : null)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setStatus('sending')
        setError(null)
        const { error } = await createClient().auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (error) {
            setError(error.message)
            setStatus('idle')
        } else {
            setStatus('sent')
        }
    }

    if (status === 'sent') {
        return <main className="max-w-sm mx-auto p-8">Check {email} for a sign-in link.</main>
    }

    return (
        <main className="max-w-sm mx-auto p-8">
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <h1 className="text-xl font-bold">Sign in</h1>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="border rounded px-3 py-2"
                />
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button type="submit" disabled={status === 'sending'} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
                    {status === 'sending' ? 'Sending…' : 'Email me a link'}
                </button>
            </form>
        </main>
    )
}
