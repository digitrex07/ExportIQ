'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Plus, Receipt, Edit, Trash2 } from 'lucide-react'
import type { ExpenseTemplate } from '@/lib/types/database'

export default function ExpensesPage() {
    const [templates, setTemplates] = useState<ExpenseTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ expense_name: '', expense_type: 'fixed', default_value: '' })

    useEffect(() => { fetchTemplates() }, [])

    const fetchTemplates = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from('users')
            .select('organization_id')
            .eq('auth_id', user.id)
            .single()

        if (!profile) return

        const { data: templatesData, error } = await supabase
            .from('expense_templates')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .order('expense_name')

        if (!error && templatesData) {
            setTemplates(templatesData as ExpenseTemplate[])
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

        const { error } = await supabase.from('expense_templates').insert({
            organization_id: profile.organization_id,
            expense_name: form.expense_name,
            expense_type: form.expense_type,
            default_value: form.default_value ? Number(form.default_value) : null,
            is_active: true
        })

        if (!error) {
            setShowModal(false)
            setForm({ expense_name: '', expense_type: 'fixed', default_value: '' })
            fetchTemplates()
        } else {
            console.error('Error creating expense template:', error)
            setLoading(false)
        }
    }

    const toggleActive = async (id: string, isActive: boolean) => {
        const supabase = createClient()
        await supabase
            .from('expense_templates')
            .update({ is_active: !isActive })
            .eq('id', id)

        setTemplates(templates.map(t => t.id === id ? { ...t, is_active: !isActive } : t))
    }

    const typeColors: Record<string, string> = {
        fixed: 'badge-primary',
        variable: 'badge-warning',
        percentage: 'badge-info',
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h2>Expense Templates</h2>
                    <p>Configure default expense categories for your deals</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Template</button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr><th>Expense Name</th><th>Type</th><th>Default Value</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {templates.length > 0 ? templates.map(t => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 600 }}>{t.expense_name}</td>
                                    <td><span className={`badge ${typeColors[t.expense_type]}`}>{t.expense_type}</span></td>
                                    <td>{t.default_value ? (t.expense_type === 'percentage' ? `${t.default_value}%` : formatCurrency(t.default_value)) : '—'}</td>
                                    <td><span className={`badge ${t.is_active ? 'badge-success' : 'badge-muted'}`}>{t.is_active ? 'Active' : 'Inactive'}</span></td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(t.id, t.is_active)}>
                                            {t.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                                    {loading ? 'Loading...' : 'No expense templates. Add templates to auto-populate deal expenses.'}
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
                            <h3 className="modal-title">Add Expense Template</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="exp-name">Expense Name</label>
                                    <input id="exp-name" className="form-input" placeholder="e.g. Freight, Port Charges" value={form.expense_name} onChange={e => setForm({ ...form, expense_name: e.target.value })} required />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="exp-type">Type</label>
                                        <select id="exp-type" className="form-input form-select" value={form.expense_type} onChange={e => setForm({ ...form, expense_type: e.target.value })}>
                                            <option value="fixed">Fixed</option>
                                            <option value="variable">Variable</option>
                                            <option value="percentage">Percentage</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="exp-value">Default Value</label>
                                        <input id="exp-value" type="number" step="0.01" className="form-input" placeholder="Optional" value={form.default_value} onChange={e => setForm({ ...form, default_value: e.target.value })} />
                                        <p className="form-hint">{form.expense_type === 'percentage' ? 'Enter as percentage (e.g. 2.5)' : 'Enter amount'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Template</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
