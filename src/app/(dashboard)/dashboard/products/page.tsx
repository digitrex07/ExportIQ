'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Plus, Search, Package } from 'lucide-react'
import type { Product } from '@/lib/types/database'

const CATEGORIES = ['Tyre', 'Tube', 'Flap', 'Tools', 'Repair Kit', 'Other']

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [form, setForm] = useState({
        product_name: '', category: 'Tyre', size: '', weight_per_unit: '',
        units_per_container: '',
    })

    useEffect(() => { fetchProducts() }, [])

    const fetchProducts = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from('users')
            .select('organization_id')
            .eq('auth_id', user.id)
            .single()

        if (!profile) return

        const { data: productsData, error } = await supabase
            .from('products')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .order('product_name')

        if (!error && productsData) {
            setProducts(productsData as Product[])
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

        const { error } = await supabase.from('products').insert({
            organization_id: profile.organization_id,
            product_name: form.product_name,
            category: form.category,
            size: form.size,
            weight_per_unit: Number(form.weight_per_unit) || 0,
            units_per_container: Number(form.units_per_container) || 0,
            is_active: true
        })

        if (!error) {
            setShowModal(false)
            setForm({ product_name: '', category: 'Tyre', size: '', weight_per_unit: '', units_per_container: '' })
            fetchProducts()
        } else {
            console.error('Error creating product:', error)
            setLoading(false)
        }
    }

    const toggleActive = async (id: string, isActive: boolean) => {
        const supabase = createClient()
        await supabase
            .from('products')
            .update({ is_active: !isActive })
            .eq('id', id)

        setProducts(products.map(p => p.id === id ? { ...p, is_active: !isActive } : p))
    }

    const filtered = products.filter(p =>
        p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.size.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h2>Products</h2>
                    <p>Manage your product catalog for export</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Product</button>
            </div>

            <div style={{ marginBottom: 'var(--space-6)', position: 'relative', maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input type="text" className="form-input" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: '36px' }} />
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr><th>Product</th><th>Category</th><th>Size</th><th>Weight/Unit (kg)</th><th>Units/Container</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {filtered.length > 0 ? filtered.map(p => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                                    <td><span className="badge badge-primary">{p.category}</span></td>
                                    <td>{p.size}</td>
                                    <td>{p.weight_per_unit} kg</td>
                                    <td>{p.units_per_container || '—'}</td>
                                    <td>
                                        <span className={`badge ${p.is_active ? 'badge-success' : 'badge-muted'}`}>
                                            {p.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(p.id, p.is_active)}>
                                            {p.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                                    {loading ? 'Loading...' : 'No products found. Add products to your catalog.'}
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
                            <h3 className="modal-title">Add Product</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="prod-name">Product Name</label>
                                        <input id="prod-name" className="form-input" placeholder="e.g. Tyre 295/80" value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="prod-cat">Category</label>
                                        <select id="prod-cat" className="form-input form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="prod-size">Size / Variant</label>
                                    <input id="prod-size" className="form-input" placeholder="e.g. 295/80R22.5" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} required />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="prod-weight">Weight per Unit (kg)</label>
                                        <input id="prod-weight" type="number" step="0.01" className="form-input" value={form.weight_per_unit} onChange={e => setForm({ ...form, weight_per_unit: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="prod-units">Units per Container</label>
                                        <input id="prod-units" type="number" className="form-input" placeholder="Optional" value={form.units_per_container} onChange={e => setForm({ ...form, units_per_container: e.target.value })} />
                                        <p className="form-hint">Leave empty if variable</p>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
