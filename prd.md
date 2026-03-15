Product Requirements Document (PRD)
Product Name
ExportFlow (working name)
Product Type
Multi-tenant SaaS platform for exporters to manage export deal pipelines, container shipments, documents, communication, and profitability analysis.
Initial industry focus: Automobile export (tyres, tubes, flaps, tools, repair kits).

1. Product Objective
Export businesses currently rely on fragmented tools:
Excel
Email
WhatsApp
Manual documents
Accounting software
The goal of ExportFlow is to centralize the entire export workflow into one platform:
Inquiry → Quote → Negotiation → PI → Procurement → Shipment → BL → Payment → Analytics

2. Target Users
Primary Users
Exporters / Trading companies.
Secondary Users
Buyers (customers importing products).
Admin Roles
Exporter company staff.
3. User Roles
1. Platform Admin
Manages SaaS platform (future phase).
2. Exporter Admin
Company owner / manager.
Permissions:

Manage deals
Create PO
Upload BL
View analytics
Configure expenses
Manage products
3. Exporter Staff
Operational users.
Permissions:

Manage pipelines
Send quotes
Upload shipment updates
4. Buyer
Customer importing products.
Permissions:

View quotes
Confirm quantities
Download documents
Track shipment
4. Core System Architecture
System is multi-tenant.
Each exporter has:

Organization
   ├ Users
   ├ Buyers
   ├ Products
   ├ Pipelines (Deals)
   ├ PIs
   ├ POs
   ├ Shipments
   ├ Expenses
   └ Analytics
5. Key Modules
Module 1 — Buyer Inquiry System
Buyer Inquiry Form
Fields:
Buyer company name
Country
Contact person
Email
Phone
Trade terms (FOB / CIF / CNF)
Notes
Action:
Creates a Deal Pipeline.

Module 2 — Product Management
Exporter defines product catalog.
Example:

Product	Category	Variant
Tyre	Tyre	295/80
Tube	Tube	16.9
Flap	Flap	16.9
Tools	Tools	Kit
Attributes:
product_name
category
size
weight_per_unit
units_per_container (optional)
Module 3 — Product Selection by Buyer
Buyer login portal.
Buyer selects:

product
size
quantity
System calculates:
Estimated container weight
Container capacity indicator:
26.3 / 28 tons used
Module 4 — Pricing Workflow
Admin reviews buyer request.
Admin sets:

price_per_kg
currency (USD / INR)
System generates quotation.
Status flow:

PRODUCT_SELECTED
PRICE_PENDING
QUOTE_SENT
NEGOTIATION
QUOTE_REVISED
QUOTE_ACCEPTED
Quote revision history stored.
Module 5 — Negotiation System
Buyers can:
Request price change
Send comments
Admin can:
Revise price
Send updated quote
Each revision saved as:
Quote Version 1
Quote Version 2
Quote Version 3
Module 6 — Automated Follow-Up Engine
Triggers follow-ups for:
Quote response
PI confirmation
Advance payment
Final payment
Channels:
Email
WhatsApp
Follow-up rules:
Day 2
Day 4
Day 7
Day 10
Day 14
Admin configurable.
Module 7 — Proforma Invoice Generator
After quote acceptance.
System generates PI automatically.

Fields:

PI number
Buyer
Product list
Quantity
Price
Total value
Currency
Trade terms
Formats:
PDF
Email attachment
PI sent automatically to buyer.
Module 8 — Purchase Order System
Admin generates PO.
Fields:

Supplier
Buying rate
Product
Quantity
Purpose:
Connects cost vs sales.

Module 9 — Expense Management
Admin defines Expense Templates.
Example template:

Expense	Type
Freight	Variable
Clearing	Fixed
Port Charges	Fixed
Bank Charges	Percentage
Agent Commission	Percentage
Admin can modify per deal.
Module 10 — Profit & Loss Engine
Calculates automatically.
Revenue:

PI Value
Costs:
PO Value
Freight
Expenses
Output:
Deal Profit
Profit Margin
Module 11 — Container Shipment Tracking
Each pipeline = 1 container.
Shipment stages:

Container Packed
Container Loaded
Shipment Dispatched
On Vessel
Arrived at Port
Admin uploads:
container photos
shipment documents
System notifies buyer.
Module 12 — BL Management
Admin uploads Bill of Lading.
System actions:

Send BL copy to buyer
Trigger payment follow-ups
Once payment confirmed:
BL surrendered
Deal closed
Module 13 — Buyer Portal
Buyer dashboard includes:
Deal status
Product selection
Quote history
PI download
BL download
Shipment tracking
Communication history
Module 14 — Analytics Dashboard
Exporter dashboard.
Customer Analytics
Most profitable buyers
Revenue per buyer
Margin per buyer
Product Analytics
Fast moving sizes
Slow moving sizes
Category share
Container Analytics
Profit per container
Average margin
Financial Analytics
Monthly revenue
Monthly profit
Cashflow
Module 15 — Container Loading Optimizer
System calculates:
Total container weight
Remaining capacity
Example:
Tyre 295/80 → 450 pcs
Tube → 350 pcs
Flap → 250 pcs

Total weight = 26.3 tons
Remaining capacity = 1.7 tons
6. Notifications System
Notifications sent for:
Quote sent
Quote revision
PI generated
Shipment updates
BL uploaded
Payment reminder
Channels:
Email
WhatsApp
7. Multi-Currency Support
Supported currencies:
USD
INR
Analytics normalized in base currency.

8. Multi-Tenant Architecture
Each exporter has isolated data.
Tables include:

organization_id
for tenancy.
9. Suggested Tech Stack
Frontend
Next.js
Database :
Supabase
Auth
Supabase
Storage
Supabase Storage
Messaging
WhatsApp API
SendGrid
Hosting
AWS / GCP
10. Key Database Entities
Core tables:
organizations
users
buyers
products
product_variants
pipelines
quotes
quote_versions
pi
po
expenses
shipments
documents
notifications
analytics
11. MVP Scope
First version should include:
✔ Buyer inquiry
✔ Product selection
✔ Pricing workflow
✔ Quote revisions
✔ PI generation
✔ PO generation
✔ Expense templates
✔ Shipment updates
✔ BL upload
✔ Email notifications
✔ Basic analytics


13. Success Metrics
Platform success measured by:
Containers managed per month
Revenue per exporter
Customer retention
Deal closure rate




