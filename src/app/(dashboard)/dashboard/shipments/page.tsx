'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { STAGE_LABELS, STAGE_COLORS, formatDate } from '@/lib/utils'
import { Ship, Search, Edit, Anchor, MapPin } from 'lucide-react'
import Link from 'next/link'
import type { Shipment, Pipeline } from '@/lib/types/database'

const SHIPMENT_STAGES = [
    'CONTAINER_PACKED', 'CONTAINER_LOADED', 'SHIPMENT_DISPATCHED',
    'ON_VESSEL', 'ARRIVED_AT_PORT', 'DELIVERED'
]

type ShipmentWithDeal = Shipment & { pipeline: Pipeline & { buyer: { company_name: string } } }

export default function ShipmentsPage() {
    const [shipments, setShipments] = useState<ShipmentWithDeal[]>([])
    const [loading, setLoading] = useState(true)
    const [editShipment, setEditShipment] = useState<ShipmentWithDeal | null>(null)
    const [editForm, setEditForm] = useState({
        status: '', container_number: '', vessel_name: '',
        port_of_loading: '', port_of_discharge: '',
    })

    useEffect(() => { fetchShipments() }, [])

    const fetchShipments = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from('users')
            .select('organization_id')
            .eq('auth_id', user.id)
            .single()

        if (!profile) return

        const { data: shipmentsData, error } = await supabase
            .from('shipments')
            .select('*, pipeline:pipelines(deal_number, buyer:buyers(company_name))')
            .eq('organization_id', profile.organization_id)
            .order('updated_at', { ascending: false })

        if (!error && shipmentsData) {
            setShipments(shipmentsData as unknown as ShipmentWithDeal[])
        }
        setLoading(false)
    }

    const openEdit = (s: ShipmentWithDeal) => {
        setEditShipment(s)
        setEditForm({
            status: s.status,
            container_number: s.container_number || '',
            vessel_name: s.vessel_name || '',
            port_of_loading: s.port_of_loading || '',
            port_of_discharge: s.port_of_discharge || '',
        })
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editShipment) return

        const supabase = createClient()

        const { error } = await supabase
            .from('shipments')
            .update({
                status: editForm.status,
                container_number: editForm.container_number,
                vessel_name: editForm.vessel_name,
                port_of_loading: editForm.port_of_loading,
                port_of_discharge: editForm.port_of_discharge,
            })
            .eq('id', editShipment.id)

        if (!error) {
            // Also update deal stage if shipment status changes
            await supabase
                .from('pipelines')
                .update({ stage: editForm.status })
                .eq('id', editShipment.pipeline_id)

            setEditShipment(null)
            fetchShipments()
        } else {
            console.error('Error updating shipment:', error)
        }
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h2>Shipments</h2>
                    <p>Track container shipments and delivery status</p>
                </div>
            </div>

            {loading ? (
                <div className="empty-state"><p>Loading shipments...</p></div>
            ) : shipments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {shipments.map(s => {
                        const stageIdx = SHIPMENT_STAGES.indexOf(s.status)
                        return (
                            <div key={s.id} className="card">
                                <div className="card-header">
                                    <div>
                                        <h3 className="card-title">{s.pipeline?.deal_number}</h3>
                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                            {s.pipeline?.buyer?.company_name} • Container: {s.container_number || 'TBD'}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                                        <span className={`badge ${STAGE_COLORS[s.status] || 'badge-info'}`}>{STAGE_LABELS[s.status] || s.status}</span>
                                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}><Edit size={14} /> Update</button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="pipeline-stages">
                                        {SHIPMENT_STAGES.map((stage, idx) => (
                                            <div key={stage} style={{ display: 'flex', alignItems: 'center' }}>
                                                <div className={`pipeline-stage ${idx < stageIdx ? 'completed' : ''} ${idx === stageIdx ? 'current' : ''}`}>
                                                    <span className="pipeline-stage-dot" />
                                                    {STAGE_LABELS[stage] || stage}
                                                </div>
                                                {idx < SHIPMENT_STAGES.length - 1 && (
                                                    <div className={`pipeline-connector ${idx < stageIdx ? 'completed' : ''}`} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="detail-grid" style={{ marginTop: 'var(--space-4)' }}>
                                        <div className="detail-item">
                                            <span className="detail-item-label"><Anchor size={12} style={{ display: 'inline', marginRight: '4px' }} />Vessel</span>
                                            <span className="detail-item-value">{s.vessel_name || '—'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-item-label"><MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />Route</span>
                                            <span className="detail-item-value">{s.port_of_loading || '—'} → {s.port_of_discharge || '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon"><Ship size={28} /></div>
                        <p className="empty-state-title">No shipments yet</p>
                        <p className="empty-state-description">Shipments are created automatically when deals progress to the shipping stage.</p>
                    </div>
                </div>
            )}

            {editShipment && (
                <div className="modal-overlay" onClick={() => setEditShipment(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Update Shipment — {editShipment.pipeline?.deal_number}</h3>
                            <button className="modal-close" onClick={() => setEditShipment(null)}>✕</button>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="ship-status">Status</label>
                                    <select id="ship-status" className="form-input form-select" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                                        {SHIPMENT_STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s] || s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="ship-container">Container Number</label>
                                    <input id="ship-container" className="form-input" value={editForm.container_number} onChange={e => setEditForm({ ...editForm, container_number: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="ship-vessel">Vessel Name</label>
                                    <input id="ship-vessel" className="form-input" value={editForm.vessel_name} onChange={e => setEditForm({ ...editForm, vessel_name: e.target.value })} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="ship-pol">Port of Loading</label>
                                        <input id="ship-pol" className="form-input" value={editForm.port_of_loading} onChange={e => setEditForm({ ...editForm, port_of_loading: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="ship-pod">Port of Discharge</label>
                                        <input id="ship-pod" className="form-input" value={editForm.port_of_discharge} onChange={e => setEditForm({ ...editForm, port_of_discharge: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setEditShipment(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Update Shipment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
