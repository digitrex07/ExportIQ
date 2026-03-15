/* ============================================================
   ExportFlow — Database TypeScript Types
   ============================================================ */

export type UserRole = 'platform_admin' | 'exporter_admin' | 'exporter_staff' | 'buyer'

export type PipelineStage =
    | 'INQUIRY'
    | 'PRODUCT_SELECTED'
    | 'PRICE_PENDING'
    | 'QUOTE_SENT'
    | 'NEGOTIATION'
    | 'QUOTE_REVISED'
    | 'QUOTE_ACCEPTED'
    | 'PI_GENERATED'
    | 'PO_CREATED'
    | 'PROCUREMENT'
    | 'CONTAINER_PACKED'
    | 'CONTAINER_LOADED'
    | 'SHIPMENT_DISPATCHED'
    | 'ON_VESSEL'
    | 'ARRIVED_AT_PORT'
    | 'BL_UPLOADED'
    | 'PAYMENT_PENDING'
    | 'PAYMENT_RECEIVED'
    | 'BL_SURRENDERED'
    | 'DEAL_CLOSED'

export type TradeTerms = 'FOB' | 'CIF' | 'CNF'
export type Currency = 'USD' | 'INR'
export type ExpenseType = 'fixed' | 'variable' | 'percentage'

export type ShipmentStatus =
    | 'CONTAINER_PACKED'
    | 'CONTAINER_LOADED'
    | 'SHIPMENT_DISPATCHED'
    | 'ON_VESSEL'
    | 'ARRIVED_AT_PORT'
    | 'DELIVERED'

export interface Organization {
    id: string
    name: string
    slug: string
    logo_url?: string
    base_currency: Currency
    created_at: string
    updated_at: string
}

export interface User {
    id: string
    auth_id: string
    organization_id: string
    email: string
    full_name: string
    role: UserRole
    avatar_url?: string
    is_active: boolean
    created_at: string
}

export interface Buyer {
    id: string
    organization_id: string
    company_name: string
    contact_person: string
    email: string
    phone?: string
    country: string
    trade_terms: TradeTerms
    notes?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface Product {
    id: string
    organization_id: string
    product_name: string
    category: string
    size: string
    weight_per_unit: number
    units_per_container?: number
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface Pipeline {
    id: string
    organization_id: string
    buyer_id: string
    deal_number: string
    stage: PipelineStage
    trade_terms: TradeTerms
    currency: Currency
    notes?: string
    created_by: string
    created_at: string
    updated_at: string
    // Joined fields
    buyer?: Buyer
    quotes?: Quote[]
    proforma_invoice?: ProformaInvoice
    purchase_order?: PurchaseOrder
    shipment?: Shipment
}

export interface PipelineItem {
    id: string
    pipeline_id: string
    product_id: string
    quantity: number
    weight_per_unit: number
    total_weight: number
    created_at: string
    // Joined
    product?: Product
}

export interface Quote {
    id: string
    pipeline_id: string
    organization_id: string
    version: number
    status: 'draft' | 'sent' | 'revised' | 'accepted' | 'rejected'
    total_value: number
    currency: Currency
    notes?: string
    created_by: string
    created_at: string
    items?: QuoteItem[]
}

export interface QuoteItem {
    id: string
    quote_id: string
    product_id: string
    quantity: number
    price_per_unit: number
    total_price: number
    product?: Product
}

export interface ProformaInvoice {
    id: string
    pipeline_id: string
    organization_id: string
    pi_number: string
    buyer_id: string
    total_value: number
    currency: Currency
    trade_terms: TradeTerms
    status: 'draft' | 'sent' | 'confirmed'
    created_at: string
    items?: ProformaInvoiceItem[]
    buyer?: Buyer
}

export interface ProformaInvoiceItem {
    id: string
    pi_id: string
    product_id: string
    quantity: number
    price_per_unit: number
    total_price: number
    product?: Product
}

export interface PurchaseOrder {
    id: string
    pipeline_id: string
    organization_id: string
    po_number: string
    supplier_name: string
    buying_rate: number
    currency: Currency
    total_value: number
    status: 'draft' | 'sent' | 'confirmed'
    created_at: string
    items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
    id: string
    po_id: string
    product_id: string
    quantity: number
    buying_price: number
    total_price: number
    product?: Product
}

export interface ExpenseTemplate {
    id: string
    organization_id: string
    expense_name: string
    expense_type: ExpenseType
    default_value?: number
    is_active: boolean
    created_at: string
}

export interface DealExpense {
    id: string
    pipeline_id: string
    organization_id: string
    expense_name: string
    expense_type: ExpenseType
    amount: number
    created_at: string
}

export interface Shipment {
    id: string
    pipeline_id: string
    organization_id: string
    status: ShipmentStatus
    container_number?: string
    vessel_name?: string
    port_of_loading?: string
    port_of_discharge?: string
    estimated_arrival?: string
    actual_arrival?: string
    notes?: string
    created_at: string
    updated_at: string
}

export interface Document {
    id: string
    pipeline_id: string
    organization_id: string
    document_type: 'BL' | 'PI' | 'PO' | 'PACKING_LIST' | 'CONTAINER_PHOTO' | 'OTHER'
    file_name: string
    file_url: string
    uploaded_by: string
    created_at: string
}

export interface Notification {
    id: string
    organization_id: string
    user_id?: string
    buyer_id?: string
    pipeline_id?: string
    type: 'email' | 'whatsapp'
    subject: string
    message: string
    status: 'pending' | 'sent' | 'failed'
    sent_at?: string
    created_at: string
}

// Analytics types
export interface DealProfitAnalysis {
    pipeline_id: string
    deal_number: string
    buyer_name: string
    revenue: number
    cost: number
    expenses: number
    profit: number
    margin: number
}

export interface MonthlyAnalytics {
    month: string
    revenue: number
    profit: number
    deals_closed: number
    containers_shipped: number
}
