'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, STAGE_LABELS, STAGE_COLORS } from '@/lib/utils'
import {
    Handshake,
    Package,
    Ship,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    BarChart3,
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
    activeDeals: number
    totalBuyers: number
    shipmentsInTransit: number
    totalRevenue: number
}

interface RecentDeal {
    id: string
    deal_number: string
    stage: string
    created_at: string
    buyer: { company_name: string; country: string }
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        activeDeals: 0,
        totalBuyers: 0,
        shipmentsInTransit: 0,
        totalRevenue: 0,
    })
    const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDashboard = async () => {
            const supabase = createClient()
            try {
                // Get User Org
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: profile } = await supabase
                    .from('users')
                    .select('organization_id')
                    .eq('auth_id', user.id)
                    .single()

                if (!profile) return
                const orgId = profile.organization_id

                // Active Deals Count
                const { count: activeDeals } = await supabase
                    .from('pipelines')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', orgId)
                    .neq('stage', 'DEAL_CLOSED')

                // Total Buyers Count
                const { count: totalBuyers } = await supabase
                    .from('buyers')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', orgId)

                // Shipments in Transit
                const { count: shipmentsInTransit } = await supabase
                    .from('shipments')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', orgId)
                    .in('status', ['SHIPMENT_DISPATCHED', 'ON_VESSEL'])

                // Total Revenue (from confirmed PIs)
                const { data: pis } = await supabase
                    .from('proforma_invoices')
                    .select('total_value')
                    .eq('organization_id', orgId)
                    .eq('status', 'confirmed')

                const totalRevenue = pis?.reduce((sum, pi) => sum + Number(pi.total_value), 0) || 0

                setStats({
                    activeDeals: activeDeals || 0,
                    totalBuyers: totalBuyers || 0,
                    shipmentsInTransit: shipmentsInTransit || 0,
                    totalRevenue,
                })

                // Recent Deals
                const { data: deals } = await supabase
                    .from('pipelines')
                    .select('id, deal_number, stage, created_at, buyer:buyers(company_name, country)')
                    .eq('organization_id', orgId)
                    .order('created_at', { ascending: false })
                    .limit(5)

                if (deals) {
                    setRecentDeals(deals as any[])
                }
            } catch (error) {
                console.error('Error fetching dashboard:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboard()
    }, [])

    if (loading) {
        return (
            <div className="empty-state">
                <p className="empty-state-description">Loading dashboard...</p>
            </div>
        )
    }

    return (
        <div className="animate-fade-in">
            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="card stat-card">
                    <div className="stat-card-icon primary">
                        <Handshake size={22} />
                    </div>
                    <div className="stat-card-value">{stats.activeDeals}</div>
                    <div className="stat-card-label">Active Deals</div>
                    <div className="stat-card-change positive">
                        <ArrowUpRight size={12} />
                        Active pipeline
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-card-icon success">
                        <DollarSign size={22} />
                    </div>
                    <div className="stat-card-value">{formatCurrency(stats.totalRevenue)}</div>
                    <div className="stat-card-label">Total Revenue</div>
                    <div className="stat-card-change positive">
                        <ArrowUpRight size={12} />
                        From PIs
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-card-icon warning">
                        <Ship size={22} />
                    </div>
                    <div className="stat-card-value">{stats.shipmentsInTransit}</div>
                    <div className="stat-card-label">In Transit</div>
                    <div className="stat-card-change positive">
                        <ArrowUpRight size={12} />
                        Shipments
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-card-icon info">
                        <Package size={22} />
                    </div>
                    <div className="stat-card-value">{stats.totalBuyers}</div>
                    <div className="stat-card-label">Total Buyers</div>
                    <div className="stat-card-change positive">
                        <ArrowUpRight size={12} />
                        Registered
                    </div>
                </div>
            </div>

            {/* Recent Deals */}
            <div className="grid-2">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Deals</h3>
                        <Link href="/dashboard/deals" className="btn btn-ghost btn-sm">View All</Link>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {recentDeals.length > 0 ? (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Deal</th>
                                            <th>Buyer</th>
                                            <th>Stage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentDeals.map((deal) => (
                                            <tr key={deal.id}>
                                                <td>
                                                    <Link href={`/dashboard/deals/${deal.id}`} style={{ fontWeight: 500 }}>
                                                        {deal.deal_number}
                                                    </Link>
                                                </td>
                                                <td>
                                                    {deal.buyer?.company_name || 'N/A'}
                                                    <br />
                                                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                                        {deal.buyer?.country}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${STAGE_COLORS[deal.stage] || 'badge-muted'}`}>
                                                        {STAGE_LABELS[deal.stage] || deal.stage}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
                                <div className="empty-state-icon">
                                    <Handshake size={28} />
                                </div>
                                <p className="empty-state-title">No deals yet</p>
                                <p className="empty-state-description">
                                    Create your first deal to get started with your export pipeline.
                                </p>
                                <Link href="/dashboard/deals" className="btn btn-primary btn-sm">
                                    Create Deal
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Quick Actions</h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <Link href="/dashboard/deals" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                <Handshake size={16} />
                                New Deal
                            </Link>
                            <Link href="/dashboard/buyers" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                <Users size={16} />
                                Add Buyer
                            </Link>
                            <Link href="/dashboard/products" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                <Package size={16} />
                                Add Product
                            </Link>
                            <Link href="/dashboard/shipments" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                <Ship size={16} />
                                Track Shipment
                            </Link>
                            <Link href="/dashboard/analytics" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                <BarChart3 size={16} />
                                View Analytics
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
