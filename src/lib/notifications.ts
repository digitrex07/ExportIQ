/* ============================================================
   ExportFlow — Notification Services (Stubbed)
   ============================================================ */

interface EmailPayload {
  to: string
  subject: string
  html: string
}

interface WhatsAppPayload {
  to: string
  message: string
}

/**
 * Send email notification via SendGrid
 * Currently stubbed — replace SENDGRID_API_KEY in .env.local
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY

  if (!apiKey || apiKey.startsWith('SG.dummy')) {
    console.log('[EMAIL STUB] Would send email:', {
      to: payload.to,
      subject: payload.subject,
    })
    return true
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: payload.to }] }],
        from: { email: 'noreply@exportflow.com', name: 'ExportFlow' },
        subject: payload.subject,
        content: [{ type: 'text/html', value: payload.html }],
      }),
    })

    return response.ok
  } catch (error) {
    console.error('[EMAIL ERROR]', error)
    return false
  }
}

/**
 * Send WhatsApp notification via WhatsApp Business API
 * Currently stubbed — replace WHATSAPP_API_KEY in .env.local
 */
export async function sendWhatsApp(payload: WhatsAppPayload): Promise<boolean> {
  const apiKey = process.env.WHATSAPP_API_KEY
  const phoneId = process.env.WHATSAPP_PHONE_ID

  if (!apiKey || apiKey.startsWith('dummy')) {
    console.log('[WHATSAPP STUB] Would send message:', {
      to: payload.to,
      message: payload.message.substring(0, 100) + '...',
    })
    return true
  }

  try {
    const response = await fetch(
      'https://graph.facebook.com/v17.0/' + phoneId + '/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: payload.to,
          type: 'text',
          text: { body: payload.message },
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('[WHATSAPP ERROR]', error)
    return false
  }
}

// ---- Notification Templates ----

export function notifyQuoteSent(buyerEmail: string, dealNumber: string) {
  return sendEmail({
    to: buyerEmail,
    subject: 'New Quote for Deal ' + dealNumber + ' — ExportFlow',
    html: '<h2>New Quote Available</h2><p>A new quote has been generated for deal <strong>' + dealNumber + '</strong>. Please log in to your buyer portal to review.</p>',
  })
}

export function notifyPIGenerated(buyerEmail: string, piNumber: string) {
  return sendEmail({
    to: buyerEmail,
    subject: 'Proforma Invoice ' + piNumber + ' — ExportFlow',
    html: '<h2>Proforma Invoice Ready</h2><p>Your proforma invoice <strong>' + piNumber + '</strong> is ready for download in your buyer portal.</p>',
  })
}

export function notifyShipmentUpdate(buyerEmail: string, dealNumber: string, status: string) {
  return sendEmail({
    to: buyerEmail,
    subject: 'Shipment Update — ' + dealNumber,
    html: '<h2>Shipment Status Update</h2><p>Your shipment for deal <strong>' + dealNumber + '</strong> has been updated to: <strong>' + status + '</strong>.</p>',
  })
}

export function notifyBLUploaded(buyerEmail: string, dealNumber: string) {
  return sendEmail({
    to: buyerEmail,
    subject: 'Bill of Lading Uploaded — ' + dealNumber,
    html: '<h2>BL Available</h2><p>The Bill of Lading for deal <strong>' + dealNumber + '</strong> has been uploaded. Please log in to your buyer portal to download.</p>',
  })
}

export function notifyPaymentReminder(buyerEmail: string, dealNumber: string, amount: string) {
  return sendEmail({
    to: buyerEmail,
    subject: 'Payment Reminder — ' + dealNumber,
    html: '<h2>Payment Reminder</h2><p>This is a reminder that payment of <strong>' + amount + '</strong> is pending for deal <strong>' + dealNumber + '</strong>.</p>',
  })
}
