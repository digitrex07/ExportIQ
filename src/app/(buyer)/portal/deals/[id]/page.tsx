'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { STAGE_LABELS, STAGE_COLORS, formatDate, formatCurrency } from '@/lib/utils'
import { ArrowLeft, FileText, Ship, Download, DollarSign, Package } from 'lucide-react'
import Link from 'next/link'
import type { Pipeline, Quote, QuoteItem, ProformaInvoice, Shipment } from '@/lib/types/database'

const PIPELINE_STAGES_BUYER = [
    'INQUIRY', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'PI_GENERATED',
    'CONTAINER_PACKED', 'SHIPMENT_DISPATCHED', 'ON_VESSEL',
    'ARRIVED_AT_PORT', 'BL_UPLOADED', 'DEAL_CLOSED'
]

export default function BuyerDealDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [deal, setDeal] = useState<Pipeline | null>(null)
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [pi, setPI] = useState<ProformaInvoice | null>(null)
    const [shipment, setShipment] = useState<Shipment | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()

            const { data: dealData } = await supabase.from('pipelines').select('*').eq('id', id).single()
            if (dealData) setDeal(dealData as Pipeline)

            const { data: quotesData } = await supabase
                .from('quotes')
                .select('*, items:quote_items(*, product:products(product_name, size))')
                .eq('pipeline_id', id)
                .order('version', { ascending: false })
            if (quotesData) setQuotes(quotesData as unknown as Quote[])

            const { data: piData } = await supabase.from('proforma_invoices').select('*').eq('pipeline_id', id).single()
            if (piData) setPI(piData as ProformaInvoice)

            const { data: shipData } = await supabase.from('shipments').select('*').eq('pipeline_id', id).single()
            if (shipData) setShipment(shipData as Shipment)

            setLoading(false)
        }

        fetchData()
    }, [id])

    if (loading) return <div className="empty-state"><p>Loading deal...</p></div>
    if (!deal) return <div className="empty-state"><p>Deal not found</p></div>

    const currentIdx = PIPELINE_STAGES_BUYER.indexOf(deal.stage)

    return (
        <div className="animate-fade-in">
            <Link href="/portal" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)' }}>
                <ArrowLeft size={14} /> Back to Deals
            </Link>

            <div className="page-header">
                <div className="page-header-info">
                    <h2>{deal.deal_number}</h2>
                    <p>Track your deal progress, quotes, and shipment</p>
                </div>
                <span className={`badge ${STAGE_COLORS[deal.stage]}`} style={{ fontSize: 'var(--text-sm)', padding: '6px 16px' }}>
                    {STAGE_LABELS[deal.stage]}
                </span>
            </div>

            {/* Progress Tracker */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-body">
                    <div className="pipeline-stages">
                        {PIPELINE_STAGES_BUYER.map((stage, idx) => (
                            <div key={stage} style={{ display: 'flex', alignItems: 'center' }}>
                                <div className={`pipeline-stage ${idx < currentIdx ? 'completed' : ''} ${idx === currentIdx ? 'current' : ''}`}>
                                    <span className="pipeline-stage-dot" />
                                    {STAGE_LABELS[stage] || stage.replace(/_/g, ' ')}
                                </div>
                                {idx < PIPELINE_STAGES_BUYER.length - 1 && (
                                    <div className={`pipeline-connector ${idx < currentIdx ? 'completed' : ''}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid-2">
                {/* Quotes */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title"><DollarSign size={16} style={{ display: 'inline', marginRight: '8px' }} />Quotes</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {quotes.length > 0 ? (
                            <div>
                                {quotes.map(q => (
                                    <div key={q.id} style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border-light)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                                            <span style={{ fontWeight: 600 }}>Quote v{q.version}</span>
                                            <span className={`badge ${q.status === 'accepted' ? 'badge-success' : q.status === 'sent' ? 'badge-primary' : 'badge-muted'}`}>{q.status}</span>
                                        </div>
                                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                                            {q.items?.map((item: QuoteItem, i: number) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                                                    <span>{item.product?.product_name} ({item.product?.size}) × {item.quantity}</span>
                                                    <span>{formatCurrency(item.total_price, q.currency as 'USD' | 'INR')}</span>
                                                </div>
                                            ))}
                                            <div style={{ fontWeight: 600, paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border-light)' }}>
                                                Total: {formatCurrency(q.total_value, q.currency as 'USD' | 'INR')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                No quotes yet. Your exporter will send pricing soon.
                            </div>
                        )}
                    </div>
                </div>

                {/* PI */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title"><FileText size={16} style={{ display: 'inline', marginRight: '8px' }} />Proforma Invoice</h3>
                    </div>
                    <div className="card-body">
                        {pi ? (
                            <div>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-item-label">PI Number</span>
                                        <span className="detail-item-value">{pi.pi_number}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-item-label">Amount</span>
                                        <span className="detail-item-value">{formatCurrency(pi.total_value, pi.currency as 'USD' | 'INR')}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-item-label">Trade Terms</span>
                                        <span className="detail-item-value">{pi.trade_terms}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-item-label">Status</span>
                                        <span className={`badge ${pi.status === 'confirmed' ? 'badge-success' : 'badge-primary'}`}>{pi.status}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                PI will be generated after quote acceptance.
                            </div>
                        )}
                    </div>
                </div>

                {/* Shipment Tracking */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header">
                        <h3 className="card-title"><Ship size={16} style={{ display: 'inline', marginRight: '8px' }} />Shipment</h3>
                    </div>
                    <div className="card-body">
                        {shipment ? (
                            <div>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-item-label">Container #</span>
                                        <span className="detail-item-value">{shipment.container_number || 'TBD'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-item-label">Vessel</span>
                                        <span className="detail-item-value">{shipment.vessel_name || 'TBD'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-item-label">Loading Port</span>
                                        <span className="detail-item-value">{shipment.port_of_loading || 'TBD'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-item-label">Discharge Port</span>
                                        <span className="detail-item-value">{shipment.port_of_discharge || 'TBD'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-item-label">Status</span>
                                        <span className={`badge ${STAGE_COLORS[shipment.status] || 'badge-info'}`}>
                                            {STAGE_LABELS[shipment.status] || shipment.status}
                                        </span>
                                    </div>
                                    {shipment.estimated_arrival && (
                                        <div className="detail-item">
                                            <span className="detail-item-label">ETA</span>
                                            <span className="detail-item-value">{formatDate(shipment.estimated_arrival)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                Shipment details will appear once the container is loaded.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
