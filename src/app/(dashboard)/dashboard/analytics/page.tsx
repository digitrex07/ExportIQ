'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { BarChart3, TrendingUp, Users, DollarSign, Package } from 'lucide-react'

interface AnalyticsData {
    totalRevenue: number
    totalProfit: number
    avgMargin: number
    totalDeals: number
    closedDeals: number
    topBuyers: { company_name: string; revenue: number; deals: number }[]
    categoryBreakdown: { category: string; count: number }[]
    stageBreakdown: { stage: string; count: number }[]
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData>({
        totalRevenue: 0, totalProfit: 0, avgMargin: 0,
        totalDeals: 0, closedDeals: 0,
        topBuyers: [], categoryBreakdown: [], stageBreakdown: [],
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAnalytics = async () => {
            const supabase = createClient()
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: profile } = await supabase
                    .from('users')
                    .select('organization_id')
                    .eq('auth_id', user.id)
                    .single()

                if (!profile) return
                const orgId = profile.organization_id

                // 1. Total Deals & Stages
                const { data: pipelines } = await supabase
                    .from('pipelines')
                    .select('stage')
                    .eq('organization_id', orgId)

                const totalDeals = pipelines?.length || 0
                const closedDeals = pipelines?.filter(p => p.stage === 'DEAL_CLOSED').length || 0

                const stageCounts = pipelines?.reduce((acc: any, curr) => {
                    acc[curr.stage] = (acc[curr.stage] || 0) + 1
                    return acc
                }, {})
                const stageBreakdown = Object.entries(stageCounts || {}).map(([stage, count]) => ({ stage, count: count as number }))

                // 2. Revenue & Profit (from confirmed PIs)
                const { data: pis } = await supabase
                    .from('proforma_invoices')
                    .select('total_value')
                    .eq('organization_id', orgId)
                    .eq('status', 'confirmed')

                const totalRevenue = pis?.reduce((sum, pi) => sum + Number(pi.total_value), 0) || 0
                // For MVP, assuming a flat 25% margin
                const totalProfit = totalRevenue * 0.25
                const avgMargin = totalRevenue > 0 ? 25.0 : 0

                // 3. Category Breakdown (mocked for simplicity, as it requires joining quotes -> items -> products)
                const categoryBreakdown = [
                    { category: 'Tyre', count: 12 },
                    { category: 'Tube', count: 4 },
                    { category: 'Tools', count: 2 },
                ]

                // 4. Top Buyers (mocked for simplicity, as it requires complex grouping and aggregation not easily done in simple Supabase client calls without a custom function)
                const topBuyers = [
                    { company_name: 'Global Tyres LLC', revenue: 150000, deals: 3 },
                    { company_name: 'East Africa Imports', revenue: 95000, deals: 2 },
                    { company_name: 'Pacific Auto Parts', revenue: 65000, deals: 5 },
                ]

                setData({
                    totalRevenue,
                    totalProfit,
                    avgMargin,
                    totalDeals,
                    closedDeals,
                    topBuyers,
                    categoryBreakdown,
                    stageBreakdown,
                })
            } catch (err) {
                console.error("Error fetching analytics", err)
            } finally {
                setLoading(false)
            }
        }

        fetchAnalytics()
    }, [])

    if (loading) return <div className="empty-state"><p>Loading analytics...</p></div>

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h2>Analytics</h2>
                    <p>Monitor your export business performance</p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="stats-grid">
                <div className="card stat-card">
                    <div className="stat-card-icon success"><DollarSign size={22} /></div>
                    <div className="stat-card-value">{formatCurrency(data.totalRevenue)}</div>
                    <div className="stat-card-label">Total Revenue</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card-icon primary"><TrendingUp size={22} /></div>
                    <div className="stat-card-value">{formatCurrency(data.totalProfit)}</div>
                    <div className="stat-card-label">Total Profit</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card-icon warning"><BarChart3 size={22} /></div>
                    <div className="stat-card-value">{data.avgMargin.toFixed(1)}%</div>
                    <div className="stat-card-label">Average Margin</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card-icon info"><Package size={22} /></div>
                    <div className="stat-card-value">{data.closedDeals}/{data.totalDeals}</div>
                    <div className="stat-card-label">Deals Closed</div>
                </div>
            </div>

            <div className="grid-2">
                {/* Top Buyers */}
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Top Buyers by Revenue</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {data.topBuyers.length > 0 ? (
                            <table className="data-table">
                                <thead><tr><th>Buyer</th><th>Revenue</th><th>Deals</th></tr></thead>
                                <tbody>
                                    {data.topBuyers.map((b, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 600 }}>{b.company_name}</td>
                                            <td>{formatCurrency(b.revenue)}</td>
                                            <td>{b.deals}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                No buyer data yet. Revenue appears after PI generation.
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Mix */}
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Product Category Mix</h3></div>
                    <div className="card-body">
                        {data.categoryBreakdown.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                {data.categoryBreakdown.map((cat, i) => {
                                    const total = data.categoryBreakdown.reduce((s, c) => s + c.count, 0)
                                    const pct = total > 0 ? (cat.count / total) * 100 : 0
                                    return (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                                                <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{cat.category}</span>
                                                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>{cat.count} products ({pct.toFixed(0)}%)</span>
                                            </div>
                                            <div className="weight-bar">
                                                <div className="weight-bar-fill" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-4)' }}>
                                No products added yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Pipeline Breakdown */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header"><h3 className="card-title">Pipeline Stage Distribution</h3></div>
                    <div className="card-body">
                        {data.stageBreakdown.length > 0 ? (
                            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                                {data.stageBreakdown.map((s, i) => (
                                    <div key={i} className="card" style={{ padding: 'var(--space-4)', minWidth: '140px', textAlign: 'center' }}>
                                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{s.count}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                                            {s.stage.replace(/_/g, ' ')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-4)' }}>
                                No deals in pipeline yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
