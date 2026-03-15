'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { STAGE_LABELS, STAGE_COLORS, formatDate, formatCurrency } from '@/lib/utils'
import { Plus, Search, Filter, Eye } from 'lucide-react'
import type { Pipeline, Buyer } from '@/lib/types/database'

export default function DealsPage() {
    const [deals, setDeals] = useState<(Pipeline & { buyer: Buyer })[]>([])
    const [buyers, setBuyers] = useState<Buyer[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [newDeal, setNewDeal] = useState({
        buyer_id: '',
        trade_terms: 'FOB',
        currency: 'USD',
        notes: '',
    })

    useEffect(() => {
        fetchDeals()
        fetchBuyers()
    }, [])

    const fetchDeals = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from('users')
            .select('organization_id')
            .eq('auth_id', user.id)
            .single()

        if (!profile) return

        const { data: pipelines, error } = await supabase
            .from('pipelines')
            .select('*, buyer:buyers(*)')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })

        if (!error && pipelines) {
            setDeals(pipelines as unknown as (Pipeline & { buyer: Buyer })[])
        }
        setLoading(false)
    }

    const fetchBuyers = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from('users')
            .select('organization_id')
            .eq('auth_id', user.id)
            .single()

        if (!profile) return

        const { data: buyersData, error } = await supabase
            .from('buyers')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .eq('is_active', true)
            .order('company_name')

        if (!error && buyersData) {
            setBuyers(buyersData as Buyer[])
        }
    }

    const handleCreateDeal = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data: profile } = await supabase
            .from('users')
            .select('id, organization_id')
            .eq('auth_id', user.id)
            .single()

        if (!profile) { setLoading(false); return }

        // Generate deal number
        const { count } = await supabase.from('pipelines').select('*', { count: 'exact', head: true })
        const dealNumber = `EXP-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

        const { error } = await supabase.from('pipelines').insert({
            organization_id: profile.organization_id,
            buyer_id: newDeal.buyer_id,
            deal_number: dealNumber,
            trade_terms: newDeal.trade_terms,
            currency: newDeal.currency,
            notes: newDeal.notes,
            created_by: profile.id,
            stage: 'INQUIRY'
        })

        if (!error) {
            setShowModal(false)
            setNewDeal({ buyer_id: '', trade_terms: 'FOB', currency: 'USD', notes: '' })
            fetchDeals()
        } else {
            console.error('Error creating deal:', error)
            setLoading(false)
        }
    }

    const filteredDeals = deals.filter(deal =>
        deal.deal_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.buyer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return <div className="empty-state"><p>Loading deals...</p></div>
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h2>Deal Pipeline</h2>
                    <p>Manage your export deals from inquiry to closure</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={16} />
                        New Deal
                    </button>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 'var(--space-6)', position: 'relative', maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search deals or buyers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                />
            </div>

            {/* Deals Table */}
            <div className="card">
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Deal Number</th>
                                <th>Buyer</th>
                                <th>Country</th>
                                <th>Trade Terms</th>
                                <th>Currency</th>
                                <th>Stage</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDeals.length > 0 ? filteredDeals.map((deal) => (
                                <tr key={deal.id}>
                                    <td style={{ fontWeight: 600 }}>{deal.deal_number}</td>
                                    <td>{deal.buyer?.company_name || 'N/A'}</td>
                                    <td>{deal.buyer?.country || '—'}</td>
                                    <td><span className="badge badge-muted">{deal.trade_terms}</span></td>
                                    <td>{deal.currency}</td>
                                    <td>
                                        <span className={`badge ${STAGE_COLORS[deal.stage] || 'badge-muted'}`}>
                                            {STAGE_LABELS[deal.stage] || deal.stage}
                                        </span>
                                    </td>
                                    <td>{formatDate(deal.created_at)}</td>
                                    <td>
                                        <Link href={`/dashboard/deals/${deal.id}`} className="btn btn-ghost btn-sm">
                                            <Eye size={14} />
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                                        <p style={{ color: 'var(--color-text-muted)' }}>No deals found. Create your first deal to start.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Deal Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Create New Deal</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateDeal}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="deal-buyer">Buyer</label>
                                    <select
                                        id="deal-buyer"
                                        className="form-input form-select"
                                        value={newDeal.buyer_id}
                                        onChange={(e) => setNewDeal({ ...newDeal, buyer_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a buyer...</option>
                                        {buyers.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.company_name} — {b.country}
                                            </option>
                                        ))}
                                    </select>
                                    {buyers.length === 0 && (
                                        <p className="form-hint">
                                            No buyers found. <Link href="/dashboard/buyers">Add a buyer first</Link>.
                                        </p>
                                    )}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="deal-terms">Trade Terms</label>
                                        <select
                                            id="deal-terms"
                                            className="form-input form-select"
                                            value={newDeal.trade_terms}
                                            onChange={(e) => setNewDeal({ ...newDeal, trade_terms: e.target.value })}
                                        >
                                            <option value="FOB">FOB</option>
                                            <option value="CIF">CIF</option>
                                            <option value="CNF">CNF</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="deal-currency">Currency</label>
                                        <select
                                            id="deal-currency"
                                            className="form-input form-select"
                                            value={newDeal.currency}
                                            onChange={(e) => setNewDeal({ ...newDeal, currency: e.target.value })}
                                        >
                                            <option value="USD">USD</option>
                                            <option value="INR">INR</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="deal-notes">Notes</label>
                                    <textarea
                                        id="deal-notes"
                                        className="form-input form-textarea"
                                        placeholder="Additional notes about this deal..."
                                        value={newDeal.notes}
                                        onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Deal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
