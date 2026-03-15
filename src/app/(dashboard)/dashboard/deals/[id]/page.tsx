'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { STAGE_LABELS, STAGE_COLORS, formatDate, formatCurrency } from '@/lib/utils'
import {
    ArrowLeft, Plus, Send, Check, FileText, Ship as ShipIcon,
    DollarSign, Package, X, Edit, Trash2
} from 'lucide-react'
import Link from 'next/link'
import type { Pipeline, Buyer, Product, Quote, QuoteItem, ProformaInvoice, PurchaseOrder, Shipment, DealExpense } from '@/lib/types/database'

const PIPELINE_STAGES = [
    'INQUIRY', 'PRODUCT_SELECTED', 'PRICE_PENDING', 'QUOTE_SENT',
    'NEGOTIATION', 'QUOTE_ACCEPTED', 'PI_GENERATED', 'PO_CREATED',
    'CONTAINER_PACKED', 'SHIPMENT_DISPATCHED', 'ON_VESSEL',
    'BL_UPLOADED', 'PAYMENT_RECEIVED', 'DEAL_CLOSED'
]

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [deal, setDeal] = useState<Pipeline | null>(null)
    const [buyer, setBuyer] = useState<Buyer | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [pi, setPI] = useState<ProformaInvoice | null>(null)
    const [po, setPO] = useState<PurchaseOrder | null>(null)
    const [shipment, setShipment] = useState<Shipment | null>(null)
    const [expenses, setExpenses] = useState<DealExpense[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

    // Quote creation state
    const [showQuoteModal, setShowQuoteModal] = useState(false)
    const [quoteItems, setQuoteItems] = useState<{ product_id: string; quantity: number; price_per_unit: number }[]>([])

    useEffect(() => {
        fetchDealData()
    }, [id])

    const fetchDealData = async () => {
        setDeal({ id, buyer_id: 'b1', organization_id: 'o1', deal_number: 'EXP-2024-0012', stage: 'ON_VESSEL', trade_terms: 'FOB', currency: 'USD', created_at: new Date(Date.now() - 864000000).toISOString() } as Pipeline)
        setBuyer({ id: 'b1', company_name: 'Global Tyres LLC', contact_person: 'Ahmed Al-Fayed', email: 'ahmed@globaltyres.ae', phone: '+971 50 123 4567', country: 'UAE', trade_terms: 'FOB', is_active: true } as Buyer)
        setProducts([
            { id: '1', product_name: 'Premium Truck Tyre 295/80R22.5', size: '295/80R22.5' } as Product
        ])
        setQuotes([
            {
                id: 'q1', pipeline_id: id, version: 1, status: 'accepted', total_value: 45000, currency: 'USD', created_at: new Date(Date.now() - 432000000).toISOString(), items: [
                    { id: 'qi1', product_id: '1', quantity: 240, price_per_unit: 187.5, total_price: 45000, product: { product_name: 'Premium Truck Tyre 295/80R22.5', size: '295/80R22.5' } }
                ]
            } as any
        ])
        setPI({ id: 'pi1', pi_number: 'PI-EXP-2024-0012', pipeline_id: id, total_value: 45000, currency: 'USD', status: 'confirmed', trade_terms: 'FOB', created_at: new Date(Date.now() - 300000000).toISOString() } as ProformaInvoice)
        setPO({ id: 'po1', po_number: 'PO-EXP-2024-0012', pipeline_id: id, supplier_name: 'Factory A', total_value: 36000, currency: 'USD', status: 'confirmed' } as PurchaseOrder)
        setShipment({ id: 's1', pipeline_id: id, status: 'ON_VESSEL', container_number: 'MSKU8729104', vessel_name: 'MSC ANNA', port_of_loading: 'Jebel Ali', port_of_discharge: 'Mombasa' } as Shipment)
        setExpenses([
            { id: 'e1', pipeline_id: id, expense_name: 'Freight', expense_type: 'variable', amount: 3500 } as DealExpense,
            { id: 'e2', pipeline_id: id, expense_name: 'Port Charges', expense_type: 'fixed', amount: 150 } as DealExpense,
        ])
        setLoading(false)
    }

    const updateStage = async (newStage: string) => {
        setDeal(prev => prev ? { ...prev, stage: newStage as Pipeline['stage'] } : null)
    }

    const createQuote = async () => {
        if (quoteItems.length === 0) return

        alert('Quote created (Mock Mode)')
        setShowQuoteModal(false)
        setQuoteItems([])
    }

    const acceptQuote = async (quoteId: string) => {
        alert('Quote accepted (Mock Mode)')
        await updateStage('QUOTE_ACCEPTED')
    }

    const generatePI = async () => {
        alert('PI generated (Mock Mode)')
        await updateStage('PI_GENERATED')
    }

    const generatePO = async () => {
        alert('PO generated (Mock Mode)')
        await updateStage('PO_CREATED')
    }

    const addQuoteItem = () => {
        setQuoteItems([...quoteItems, { product_id: '', quantity: 0, price_per_unit: 0 }])
    }

    if (loading) {
        return <div className="empty-state"><p>Loading deal...</p></div>
    }

    if (!deal) {
        return <div className="empty-state"><p>Deal not found</p></div>
    }

    const currentStageIdx = PIPELINE_STAGES.indexOf(deal.stage)

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
                <Link href="/dashboard/deals" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)' }}>
                    <ArrowLeft size={14} />
                    Back to Deals
                </Link>
                <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
                    <div className="page-header-info">
                        <h2>{deal.deal_number}</h2>
                        <p>{buyer?.company_name} — {buyer?.country}</p>
                    </div>
                    <div className="page-header-actions">
                        <span className={`badge ${STAGE_COLORS[deal.stage]}`} style={{ fontSize: 'var(--text-sm)', padding: '6px 16px' }}>
                            {STAGE_LABELS[deal.stage]}
                        </span>
                    </div>
                </div>
            </div>

            {/* Pipeline Progress */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-body">
                    <div className="pipeline-stages">
                        {PIPELINE_STAGES.map((stage, idx) => (
                            <div key={stage} style={{ display: 'flex', alignItems: 'center' }}>
                                <button
                                    className={`pipeline-stage ${idx < currentStageIdx ? 'completed' : ''} ${idx === currentStageIdx ? 'current' : ''}`}
                                    onClick={() => updateStage(stage)}
                                    style={{ cursor: 'pointer', border: 'none' }}
                                >
                                    <span className="pipeline-stage-dot" />
                                    {STAGE_LABELS[stage]}
                                </button>
                                {idx < PIPELINE_STAGES.length - 1 && (
                                    <div className={`pipeline-connector ${idx < currentStageIdx ? 'completed' : ''}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                {['overview', 'quotes', 'pi', 'po', 'expenses', 'shipment'].map(tab => (
                    <button
                        key={tab}
                        className={`tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid-2">
                    <div className="card">
                        <div className="card-header"><h3 className="card-title">Deal Details</h3></div>
                        <div className="card-body">
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-item-label">Deal Number</span>
                                    <span className="detail-item-value">{deal.deal_number}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-item-label">Trade Terms</span>
                                    <span className="detail-item-value">{deal.trade_terms}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-item-label">Currency</span>
                                    <span className="detail-item-value">{deal.currency}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-item-label">Created</span>
                                    <span className="detail-item-value">{formatDate(deal.created_at)}</span>
                                </div>
                            </div>
                            {deal.notes && (
                                <div style={{ marginTop: 'var(--space-4)' }}>
                                    <span className="detail-item-label">Notes</span>
                                    <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>{deal.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header"><h3 className="card-title">Buyer Information</h3></div>
                        <div className="card-body">
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-item-label">Company</span>
                                    <span className="detail-item-value">{buyer?.company_name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-item-label">Contact</span>
                                    <span className="detail-item-value">{buyer?.contact_person}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-item-label">Email</span>
                                    <span className="detail-item-value">{buyer?.email}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-item-label">Phone</span>
                                    <span className="detail-item-value">{buyer?.phone || '—'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-item-label">Country</span>
                                    <span className="detail-item-value">{buyer?.country}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-item-label">Trade Terms</span>
                                    <span className="detail-item-value">{buyer?.trade_terms}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <div className="card-header"><h3 className="card-title">Actions</h3></div>
                        <div className="card-body" style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary" onClick={() => setShowQuoteModal(true)}>
                                <DollarSign size={16} /> Create Quote
                            </button>
                            {quotes.some(q => q.status === 'accepted') && !pi && (
                                <button className="btn btn-success" onClick={generatePI}>
                                    <FileText size={16} /> Generate PI
                                </button>
                            )}
                            {pi && !po && (
                                <button className="btn btn-primary" onClick={generatePO}>
                                    <FileText size={16} /> Generate PO
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'quotes' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                        <h3 style={{ fontWeight: 600 }}>Quote History</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowQuoteModal(true)}>
                            <Plus size={14} /> New Quote
                        </button>
                    </div>
                    {quotes.length > 0 ? quotes.map(quote => (
                        <div key={quote.id} className="card" style={{ marginBottom: 'var(--space-4)' }}>
                            <div className="card-header">
                                <div>
                                    <h3 className="card-title">Quote v{quote.version}</h3>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{formatDate(quote.created_at)}</p>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                                    <span className={`badge ${quote.status === 'accepted' ? 'badge-success' : quote.status === 'sent' ? 'badge-primary' : quote.status === 'revised' ? 'badge-warning' : 'badge-muted'}`}>
                                        {quote.status}
                                    </span>
                                    {quote.status !== 'accepted' && quote.status !== 'revised' && (
                                        <button className="btn btn-success btn-sm" onClick={() => acceptQuote(quote.id)}>
                                            <Check size={12} /> Accept
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="card-body" style={{ padding: 0 }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Quantity</th>
                                            <th>Price/Unit</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quote.items?.map((item: QuoteItem) => (
                                            <tr key={item.id}>
                                                <td>{item.product?.product_name} — {item.product?.size}</td>
                                                <td>{item.quantity}</td>
                                                <td>{formatCurrency(item.price_per_unit, deal?.currency as 'USD' | 'INR')}</td>
                                                <td style={{ fontWeight: 600 }}>{formatCurrency(item.total_price, deal?.currency as 'USD' | 'INR')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ padding: 'var(--space-4)', textAlign: 'right', fontWeight: 600 }}>
                                    Total: {formatCurrency(quote.total_value, deal?.currency as 'USD' | 'INR')}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="card">
                            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
                                <p className="empty-state-title">No quotes yet</p>
                                <p className="empty-state-description">Create a quote to send pricing to the buyer.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'pi' && (
                <div>
                    {pi ? (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Proforma Invoice — {pi.pi_number}</h3>
                                <span className={`badge ${pi.status === 'confirmed' ? 'badge-success' : 'badge-primary'}`}>{pi.status}</span>
                            </div>
                            <div className="card-body">
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-item-label">PI Number</span>
                                        <span className="detail-item-value">{pi.pi_number}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-item-label">Total Value</span>
                                        <span className="detail-item-value">{formatCurrency(pi.total_value, pi.currency as 'USD' | 'INR')}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-item-label">Trade Terms</span>
                                        <span className="detail-item-value">{pi.trade_terms}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-item-label">Created</span>
                                        <span className="detail-item-value">{formatDate(pi.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
                                <p className="empty-state-title">No PI generated</p>
                                <p className="empty-state-description">Accept a quote first to generate a Proforma Invoice.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'po' && (
                <div>
                    {po ? (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Purchase Order — {po.po_number}</h3>
                                <span className={`badge ${po.status === 'confirmed' ? 'badge-success' : 'badge-primary'}`}>{po.status}</span>
                            </div>
                            <div className="card-body">
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-item-label">PO Number</span>
                                        <span className="detail-item-value">{po.po_number}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-item-label">Supplier</span>
                                        <span className="detail-item-value">{po.supplier_name}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-item-label">Total Value</span>
                                        <span className="detail-item-value">{formatCurrency(po.total_value, po.currency as 'USD' | 'INR')}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-item-label">Status</span>
                                        <span className="detail-item-value">{po.status}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
                                <p className="empty-state-title">No PO generated</p>
                                <p className="empty-state-description">Generate a PI first, then create a Purchase Order.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'expenses' && (
                <div>
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Deal Expenses</h3>
                        </div>
                        {expenses.length > 0 ? (
                            <div className="card-body" style={{ padding: 0 }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Expense</th>
                                            <th>Type</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses.map(exp => (
                                            <tr key={exp.id}>
                                                <td>{exp.expense_name}</td>
                                                <td><span className="badge badge-muted">{exp.expense_type}</span></td>
                                                <td>{formatCurrency(exp.amount, deal?.currency as 'USD' | 'INR')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ padding: 'var(--space-4)', textAlign: 'right', fontWeight: 600 }}>
                                    Total Expenses: {formatCurrency(expenses.reduce((s, e) => s + e.amount, 0), deal?.currency as 'USD' | 'INR')}
                                </div>
                            </div>
                        ) : (
                            <div className="card-body">
                                <p style={{ color: 'var(--color-text-muted)' }}>No expenses added to this deal yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'shipment' && (
                <div>
                    {shipment ? (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Shipment Tracking</h3>
                                <span className={`badge ${STAGE_COLORS[shipment.status] || 'badge-info'}`}>
                                    {STAGE_LABELS[shipment.status] || shipment.status}
                                </span>
                            </div>
                            <div className="card-body">
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-item-label">Container #</span>
                                        <span className="detail-item-value">{shipment.container_number || '—'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-item-label">Vessel</span>
                                        <span className="detail-item-value">{shipment.vessel_name || '—'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-item-label">Port of Loading</span>
                                        <span className="detail-item-value">{shipment.port_of_loading || '—'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-item-label">Port of Discharge</span>
                                        <span className="detail-item-value">{shipment.port_of_discharge || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
                                <p className="empty-state-title">No shipment created</p>
                                <p className="empty-state-description">Shipment will be created once the deal reaches the shipping stage.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Quote Creation Modal */}
            {showQuoteModal && (
                <div className="modal-overlay" onClick={() => setShowQuoteModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Create Quote</h3>
                            <button className="modal-close" onClick={() => setShowQuoteModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {quoteItems.map((item, idx) => (
                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', alignItems: 'end' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        {idx === 0 && <label className="form-label">Product</label>}
                                        <select
                                            className="form-input form-select"
                                            value={item.product_id}
                                            onChange={e => {
                                                const items = [...quoteItems]
                                                items[idx].product_id = e.target.value
                                                setQuoteItems(items)
                                            }}
                                        >
                                            <option value="">Select product...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.product_name} — {p.size}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        {idx === 0 && <label className="form-label">Qty</label>}
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={item.quantity || ''}
                                            onChange={e => {
                                                const items = [...quoteItems]
                                                items[idx].quantity = Number(e.target.value)
                                                setQuoteItems(items)
                                            }}
                                            min="1"
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        {idx === 0 && <label className="form-label">Price/Unit</label>}
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={item.price_per_unit || ''}
                                            onChange={e => {
                                                const items = [...quoteItems]
                                                items[idx].price_per_unit = Number(e.target.value)
                                                setQuoteItems(items)
                                            }}
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== idx))}
                                        style={{ marginBottom: '2px' }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <button className="btn btn-secondary btn-sm" onClick={addQuoteItem}>
                                <Plus size={14} /> Add Item
                            </button>

                            {quoteItems.length > 0 && (
                                <div style={{ marginTop: 'var(--space-4)', textAlign: 'right', fontWeight: 600 }}>
                                    Total: {formatCurrency(
                                        quoteItems.reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0),
                                        deal?.currency as 'USD' | 'INR'
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowQuoteModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={createQuote} disabled={quoteItems.length === 0}>
                                <Send size={14} /> Send Quote
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
