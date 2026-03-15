'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const supabase = createClient()
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) throw signInError

            // Fetch user role to route correctly
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('email', email)
                .single()

            if (userData?.role === 'buyer') {
                router.push('/portal')
            } else {
                router.push('/dashboard')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to login')
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container animate-slide-up">
                <div className="auth-card">
                    <div className="auth-brand">
                        <div className="auth-brand-icon">EF</div>
                        <h1>Welcome Back</h1>
                        <p>Sign in to your ExportFlow account</p>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                className="form-input"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '12px' }}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup">Create one</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
