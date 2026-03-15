'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard,
    Handshake,
    Users,
    Package,
    Ship,
    Receipt,
    BarChart3,
    LogOut,
    Bell,
    Settings,
    ChevronDown,
} from 'lucide-react'

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Deals', href: '/dashboard/deals', icon: Handshake },
    { label: 'Buyers', href: '/dashboard/buyers', icon: Users },
    { label: 'Products', href: '/dashboard/products', icon: Package },
    { label: 'Shipments', href: '/dashboard/shipments', icon: Ship },
    { label: 'Expenses', href: '/dashboard/expenses', icon: Receipt },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useState<{ full_name: string; email: string; role: string } | null>(null)
    const [orgName, setOrgName] = useState('')

    useEffect(() => {
        const fetchUserAndOrg = async () => {
            const supabase = createClient()
            try {
                // 1. Get authenticated user
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
                if (authError || !authUser) {
                    router.push('/login')
                    return
                }

                // 2. Get user profile and org details
                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('*, organizations(name)')
                    .eq('auth_id', authUser.id)
                    .single()

                if (profileError || !profile) {
                    throw new Error('Profile not found')
                }

                setUser(profile)
                setOrgName(profile.organizations?.name || 'My Organization')
            } catch (error) {
                console.error('Error fetching user context:', error)
                router.push('/login')
            }
        }

        fetchUserAndOrg()
    }, [router])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    const getPageTitle = () => {
        const current = navItems.find(item =>
            pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard')
        )
        return current?.label || 'Dashboard'
    }

    const initials = user?.full_name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'EF'

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">EF</div>
                    <div>
                        <h1>ExportFlow</h1>
                        <span>{orgName || 'Loading...'}</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Main Menu</div>
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href ||
                                (pathname.startsWith(item.href) && item.href !== '/dashboard')
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                                >
                                    <Icon />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Settings</div>
                        <Link href="/dashboard/settings" className="sidebar-link">
                            <Settings />
                            Settings
                        </Link>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="sidebar-link" style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}>
                        <LogOut />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="dashboard-main">
                <header className="header">
                    <div className="header-left">
                        <div>
                            <h2 className="header-title">{getPageTitle()}</h2>
                        </div>
                    </div>
                    <div className="header-right">
                        <button className="header-icon-btn">
                            <Bell size={18} />
                        </button>
                        <div className="header-avatar" title={user?.full_name || ''}>
                            {initials}
                        </div>
                    </div>
                </header>

                <main className="dashboard-content">
                    {children}
                </main>
            </div>
        </div>
    )
}
