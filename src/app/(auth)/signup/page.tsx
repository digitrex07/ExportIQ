'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        fullName: '',
        companyName: '',
        email: '',
        password: '',
        confirmPassword: '',
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        try {
            const supabase = createClient()

            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            })

            if (authError) throw authError
            if (!authData.user) throw new Error('Failed to create account')

            // 2. Create Organization
            const slug = formData.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .insert({
                    name: formData.companyName,
                    slug: slug,
                    base_currency: 'USD'
                })
                .select()
                .single()

            if (orgError) throw orgError

            // 3. Create User Profile
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    auth_id: authData.user.id,
                    organization_id: orgData.id,
                    email: formData.email,
                    full_name: formData.fullName,
                    role: 'exporter_admin'
                })

            if (profileError) throw profileError

            // 4. Create Default Expense Templates
            await supabase.from('expense_templates').insert([
                { organization_id: orgData.id, expense_name: 'Freight (Ocean)', expense_type: 'variable', default_value: 0 },
                { organization_id: orgData.id, expense_name: 'Customs Clearance', expense_type: 'fixed', default_value: 150 },
                { organization_id: orgData.id, expense_name: 'Local Transport', expense_type: 'variable', default_value: 0 },
                { organization_id: orgData.id, expense_name: 'Insurance', expense_type: 'percentage', default_value: 0.5 },
                { organization_id: orgData.id, expense_name: 'Agent Commission', expense_type: 'fixed', default_value: 0 },
            ])

            // Success! Route to dashboard
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred during signup')
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container animate-slide-up">
                <div className="auth-card">
                    <div className="auth-brand">
                        <div className="auth-brand-icon">EF</div>
                        <h1>Create Account</h1>
                        <p>Set up your export management platform</p>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSignup}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="fullName">Full Name</label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                className="form-input"
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="companyName">Company Name</label>
                            <input
                                id="companyName"
                                name="companyName"
                                type="text"
                                className="form-input"
                                placeholder="Your Export Company"
                                value={formData.companyName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="signup-email">Email Address</label>
                            <input
                                id="signup-email"
                                name="email"
                                type="email"
                                className="form-input"
                                placeholder="you@company.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="signup-password">Password</label>
                                <input
                                    id="signup-password"
                                    name="password"
                                    type="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="confirmPassword">Confirm</label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '12px' }}
                            disabled={loading}
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already have an account?{' '}
                        <Link href="/login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
