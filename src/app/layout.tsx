import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ExportFlow — Export Deal Pipeline Management',
  description: 'Multi-tenant SaaS platform for exporters to manage export deal pipelines, container shipments, documents, and profitability analysis.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
