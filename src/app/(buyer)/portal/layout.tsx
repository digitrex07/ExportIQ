'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Package, FileText, Ship, Handshake } from 'lucide-react'
import type { Buyer } from '@/lib/types/database'

export default function BuyerPortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [buyer, setBuyer] = useState<Buyer | null>(null)
    const [orgName, setOrgName] = useState('')

    useEffect(() => {
        const fetchBuyerProfile = async () => {
            const supabase = createClient()
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser()
                if (authError || !user) {
                    router.push('/login')
                    return
                }

                const { data: profile, error: profileError } = await supabase
                    .from('buyers')
                    .select('*, organizations(name)')
                    .eq('auth_id', user.id)
                    .single()

                if (profileError || !profile) {
                    throw new Error('Profile not found')
                }

                setBuyer(profile as Buyer)
                setOrgName((profile as any).organizations?.name || 'Exporter Organization')
            } catch (error) {
                console.error('Error fetching buyer profile:', error)
                router.push('/login')
            }
        }

        fetchBuyerProfile()
    }, [router])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="buyer-layout">
            <header className="buyer-header">
                <div className="buyer-header-brand">
                    <div className="buyer-header-brand-icon">EF</div>
                    <div>
                        <h2>ExportFlow</h2>
                        <span>Buyer Portal{orgName ? ` — ${orgName}` : ''}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <Link href="/portal" className="btn btn-ghost btn-sm"><Handshake size={14} /> My Deals</Link>
                    <button onClick={handleLogout} className="btn btn-ghost btn-sm"><LogOut size={14} /> Sign Out</button>
                </div>
            </header>

            <main className="buyer-content">
                {children}
            </main>
        </div>
    )
}
