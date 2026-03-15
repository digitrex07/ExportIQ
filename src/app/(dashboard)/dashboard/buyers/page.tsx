'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Plus, Search, Edit, Users as UsersIcon } from 'lucide-react'
import type { Buyer } from '@/lib/types/database'

export default function BuyersPage() {
    const [buyers, setBuyers] = useState<Buyer[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [form, setForm] = useState({
        company_name: '', contact_person: '', email: '', phone: '',
        country: '', trade_terms: 'FOB', notes: '',
    })

    useEffect(() => { fetchBuyers() }, [])

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
            .order('company_name')

        if (!error && buyersData) {
            setBuyers(buyersData as Buyer[])
        }
        setLoading(false)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data: profile } = await supabase
            .from('users')
            .select('organization_id')
            .eq('auth_id', user.id)
            .single()

        if (!profile) { setLoading(false); return }

        // Needs to have an auth_id for the buyer so they can log in
        // (In a real app, this would trigger an email invite. Here we create a dummy auth user)
        const password = Math.random().toString(36).slice(-8)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: form.email,
            password: password,
        })

        let buyerAuthId = authData?.user?.id || user.id // fallback to exporter id if auth creation fails for demo

        const { error } = await supabase.from('buyers').insert({
            organization_id: profile.organization_id,
            auth_id: buyerAuthId,
            company_name: form.company_name,
            contact_person: form.contact_person,
            email: form.email,
            phone: form.phone,
            country: form.country,
            trade_terms: form.trade_terms,
            notes: form.notes,
            is_active: true
        })

        if (!error) {
            setShowModal(false)
            setForm({ company_name: '', contact_person: '', email: '', phone: '', country: '', trade_terms: 'FOB', notes: '' })
            fetchBuyers()
        } else {
            console.error('Error creating buyer:', error)
            setLoading(false)
        }
    }

    const filtered = buyers.filter(b =>
        b.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h2>Buyers</h2>
                    <p>Manage your import customers and partners</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Buyer</button>
            </div>

            <div style={{ marginBottom: 'var(--space-6)', position: 'relative', maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input type="text" className="form-input" placeholder="Search buyers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: '36px' }} />
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr><th>Company</th><th>Contact</th><th>Email</th><th>Country</th><th>Trade Terms</th><th>Added</th></tr>
                        </thead>
                        <tbody>
                            {filtered.length > 0 ? filtered.map(b => (
                                <tr key={b.id}>
                                    <td style={{ fontWeight: 600 }}>{b.company_name}</td>
                                    <td>{b.contact_person}</td>
                                    <td>{b.email}</td>
                                    <td>{b.country}</td>
                                    <td><span className="badge badge-muted">{b.trade_terms}</span></td>
                                    <td>{formatDate(b.created_at)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                                    {loading ? 'Loading...' : 'No buyers found. Add your first buyer to get started.'}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Buyer</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="buyer-company">Company Name</label>
                                    <input id="buyer-company" className="form-input" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} required />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="buyer-contact">Contact Person</label>
                                        <input id="buyer-contact" className="form-input" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="buyer-country">Country</label>
                                        <input id="buyer-country" className="form-input" placeholder="e.g. UAE, Kenya..." value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="buyer-email">Email</label>
                                        <input id="buyer-email" type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="buyer-phone">Phone</label>
                                        <input id="buyer-phone" className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="buyer-terms">Trade Terms</label>
                                    <select id="buyer-terms" className="form-input form-select" value={form.trade_terms} onChange={e => setForm({ ...form, trade_terms: e.target.value })}>
                                        <option value="FOB">FOB</option><option value="CIF">CIF</option><option value="CNF">CNF</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="buyer-notes">Notes</label>
                                    <textarea id="buyer-notes" className="form-input form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Buyer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
