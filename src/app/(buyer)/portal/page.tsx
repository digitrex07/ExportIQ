'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { STAGE_LABELS, STAGE_COLORS, formatDate, formatCurrency } from '@/lib/utils'
import { Handshake, FileText, Ship, DollarSign, Eye } from 'lucide-react'
import Link from 'next/link'

interface BuyerDeal {
    id: string
    deal_number: string
    stage: string
    trade_terms: string
    currency: string
    created_at: string
}

export default function BuyerPortalPage() {
    const [deals, setDeals] = useState<BuyerDeal[]>([])
    const [loading, setLoading] = useState(true)
    const [buyerId, setBuyerId] = useState<string | null>(null)

    useEffect(() => {
        const fetchBuyerDeals = async () => {
            const supabase = createClient()
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: buyerData } = await supabase
                    .from('buyers')
                    .select('id')
                    .eq('auth_id', user.id)
                    .single()

                if (!buyerData) return
                setBuyerId(buyerData.id)

                const { data: pipelines, error } = await supabase
                    .from('pipelines')
                    .select('id, deal_number, stage, trade_terms, currency, created_at')
                    .eq('buyer_id', buyerData.id)
                    .order('created_at', { ascending: false })

                if (!error && pipelines) {
                    setDeals(pipelines as unknown as BuyerDeal[])
                }
            } catch (err) {
                console.error('Error fetching buyer deals:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchBuyerDeals()
    }, [])

    if (loading) return <div className="empty-state"><p>Loading your deals...</p></div>

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h2>My Deals</h2>
                    <p>View your export deals, quotes, and shipment status</p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 'var(--space-8)' }}>
                <div className="card stat-card">
                    <div className="stat-card-icon primary"><Handshake size={22} /></div>
                    <div className="stat-card-value">{deals.length}</div>
                    <div className="stat-card-label">Total Deals</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card-icon warning"><DollarSign size={22} /></div>
                    <div className="stat-card-value">{deals.filter(d => d.stage === 'QUOTE_SENT' || d.stage === 'NEGOTIATION').length}</div>
                    <div className="stat-card-label">Pending Quotes</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card-icon success"><Ship size={22} /></div>
                    <div className="stat-card-value">{deals.filter(d => ['SHIPMENT_DISPATCHED', 'ON_VESSEL', 'ARRIVED_AT_PORT'].includes(d.stage)).length}</div>
                    <div className="stat-card-label">In Transit</div>
                </div>
            </div>

            {/* Deals List */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">All Deals</h3>
                </div>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Deal Number</th>
                                <th>Trade Terms</th>
                                <th>Currency</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deals.length > 0 ? deals.map(deal => (
                                <tr key={deal.id}>
                                    <td style={{ fontWeight: 600 }}>{deal.deal_number}</td>
                                    <td><span className="badge badge-muted">{deal.trade_terms}</span></td>
                                    <td>{deal.currency}</td>
                                    <td>
                                        <span className={`badge ${STAGE_COLORS[deal.stage] || 'badge-muted'}`}>
                                            {STAGE_LABELS[deal.stage] || deal.stage}
                                        </span>
                                    </td>
                                    <td>{formatDate(deal.created_at)}</td>
                                    <td>
                                        <Link href={`/portal/deals/${deal.id}`} className="btn btn-ghost btn-sm">
                                            <Eye size={14} /> View
                                        </Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                                        <p style={{ color: 'var(--color-text-muted)' }}>No deals found. Your exporter will create deals for you.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
