/**
 * Merge class names (simple implementation without clsx dep)
 */
export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ')
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number, currency: 'USD' | 'INR' = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Generate a deal number like EXP-2024-0001
 */
export function generateDealNumber(count: number): string {
  const year = new Date().getFullYear()
  return 'EXP-' + year + '-' + String(count + 1).padStart(4, '0')
}

/**
 * Generate PI number like PI-2024-0001
 */
export function generatePINumber(count: number): string {
  const year = new Date().getFullYear()
  return 'PI-' + year + '-' + String(count + 1).padStart(4, '0')
}

/**
 * Generate PO number like PO-2024-0001
 */
export function generatePONumber(count: number): string {
  const year = new Date().getFullYear()
  return 'PO-' + year + '-' + String(count + 1).padStart(4, '0')
}

/**
 * Calculate container weight utilization
 */
export function calculateContainerUtilization(
  totalWeight: number,
  maxWeight: number = 28
): { used: number; remaining: number; percentage: number } {
  return {
    used: totalWeight,
    remaining: Math.max(0, maxWeight - totalWeight),
    percentage: Math.min(100, (totalWeight / maxWeight) * 100),
  }
}

/**
 * Pipeline stage display labels
 */
export const STAGE_LABELS: Record<string, string> = {
  INQUIRY: 'Inquiry',
  PRODUCT_SELECTED: 'Product Selected',
  PRICE_PENDING: 'Price Pending',
  QUOTE_SENT: 'Quote Sent',
  NEGOTIATION: 'Negotiation',
  QUOTE_REVISED: 'Quote Revised',
  QUOTE_ACCEPTED: 'Quote Accepted',
  PI_GENERATED: 'PI Generated',
  PO_CREATED: 'PO Created',
  PROCUREMENT: 'Procurement',
  CONTAINER_PACKED: 'Container Packed',
  CONTAINER_LOADED: 'Container Loaded',
  SHIPMENT_DISPATCHED: 'Dispatched',
  ON_VESSEL: 'On Vessel',
  ARRIVED_AT_PORT: 'At Port',
  BL_UPLOADED: 'BL Uploaded',
  PAYMENT_PENDING: 'Payment Pending',
  PAYMENT_RECEIVED: 'Payment Received',
  BL_SURRENDERED: 'BL Surrendered',
  DEAL_CLOSED: 'Closed',
  DELIVERED: 'Delivered',
}

/**
 * Stage color mapping for badges
 */
export const STAGE_COLORS: Record<string, string> = {
  INQUIRY: 'badge-info',
  PRODUCT_SELECTED: 'badge-info',
  PRICE_PENDING: 'badge-warning',
  QUOTE_SENT: 'badge-primary',
  NEGOTIATION: 'badge-warning',
  QUOTE_REVISED: 'badge-warning',
  QUOTE_ACCEPTED: 'badge-success',
  PI_GENERATED: 'badge-success',
  PO_CREATED: 'badge-primary',
  PROCUREMENT: 'badge-primary',
  CONTAINER_PACKED: 'badge-info',
  CONTAINER_LOADED: 'badge-info',
  SHIPMENT_DISPATCHED: 'badge-primary',
  ON_VESSEL: 'badge-primary',
  ARRIVED_AT_PORT: 'badge-success',
  BL_UPLOADED: 'badge-success',
  PAYMENT_PENDING: 'badge-warning',
  PAYMENT_RECEIVED: 'badge-success',
  BL_SURRENDERED: 'badge-success',
  DEAL_CLOSED: 'badge-muted',
  DELIVERED: 'badge-success',
}
