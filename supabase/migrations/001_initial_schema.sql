-- ============================================================
-- ExportFlow — Initial Database Schema
-- Multi-tenant SaaS for Automobile Exporters
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- ORGANIZATIONS (Multi-tenant root)
-- ============================================================
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  logo_url text,
  base_currency text not null default 'USD' check (base_currency in ('USD', 'INR')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- USERS (linked to auth.users and organizations)
-- ============================================================
create table users (
  id uuid primary key default uuid_generate_v4(),
  auth_id uuid unique not null references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'exporter_staff' check (role in ('platform_admin', 'exporter_admin', 'exporter_staff', 'buyer')),
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_users_org on users(organization_id);
create index idx_users_auth on users(auth_id);

-- ============================================================
-- BUYERS (Importers / Customers)
-- ============================================================
create table buyers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_name text not null,
  contact_person text not null,
  email text not null,
  phone text,
  country text not null,
  trade_terms text not null default 'FOB' check (trade_terms in ('FOB', 'CIF', 'CNF')),
  notes text,
  is_active boolean not null default true,
  auth_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_buyers_org on buyers(organization_id);

-- ============================================================
-- PRODUCTS (Product Catalog)
-- ============================================================
create table products (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  product_name text not null,
  category text not null,
  size text not null,
  weight_per_unit numeric(10,2) not null default 0,
  units_per_container integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_org on products(organization_id);

-- ============================================================
-- PIPELINES (Deal Pipelines — 1 per container)
-- ============================================================
create table pipelines (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  buyer_id uuid not null references buyers(id) on delete cascade,
  deal_number text unique not null,
  stage text not null default 'INQUIRY',
  trade_terms text not null default 'FOB' check (trade_terms in ('FOB', 'CIF', 'CNF')),
  currency text not null default 'USD' check (currency in ('USD', 'INR')),
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_pipelines_org on pipelines(organization_id);
create index idx_pipelines_buyer on pipelines(buyer_id);
create index idx_pipelines_stage on pipelines(stage);

-- ============================================================
-- PIPELINE ITEMS (Products in a deal)
-- ============================================================
create table pipeline_items (
  id uuid primary key default uuid_generate_v4(),
  pipeline_id uuid not null references pipelines(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null default 0,
  weight_per_unit numeric(10,2) not null default 0,
  total_weight numeric(10,2) generated always as (quantity * weight_per_unit) stored,
  created_at timestamptz not null default now()
);

create index idx_pipeline_items_pipeline on pipeline_items(pipeline_id);

-- ============================================================
-- QUOTES (Pricing quotes with versioning)
-- ============================================================
create table quotes (
  id uuid primary key default uuid_generate_v4(),
  pipeline_id uuid not null references pipelines(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  version integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'sent', 'revised', 'accepted', 'rejected')),
  total_value numeric(12,2) not null default 0,
  currency text not null default 'USD',
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index idx_quotes_pipeline on quotes(pipeline_id);

-- ============================================================
-- QUOTE ITEMS (Line items in a quote)
-- ============================================================
create table quote_items (
  id uuid primary key default uuid_generate_v4(),
  quote_id uuid not null references quotes(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null default 0,
  price_per_unit numeric(10,2) not null default 0,
  total_price numeric(12,2) generated always as (quantity * price_per_unit) stored
);

create index idx_quote_items_quote on quote_items(quote_id);

-- ============================================================
-- PROFORMA INVOICES
-- ============================================================
create table proforma_invoices (
  id uuid primary key default uuid_generate_v4(),
  pipeline_id uuid not null references pipelines(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  pi_number text unique not null,
  buyer_id uuid not null references buyers(id),
  total_value numeric(12,2) not null default 0,
  currency text not null default 'USD',
  trade_terms text not null default 'FOB',
  status text not null default 'draft' check (status in ('draft', 'sent', 'confirmed')),
  created_at timestamptz not null default now()
);

create index idx_pi_pipeline on proforma_invoices(pipeline_id);

-- ============================================================
-- PROFORMA INVOICE ITEMS
-- ============================================================
create table proforma_invoice_items (
  id uuid primary key default uuid_generate_v4(),
  pi_id uuid not null references proforma_invoices(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null default 0,
  price_per_unit numeric(10,2) not null default 0,
  total_price numeric(12,2) generated always as (quantity * price_per_unit) stored
);

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================
create table purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  pipeline_id uuid not null references pipelines(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  po_number text unique not null,
  supplier_name text not null,
  buying_rate numeric(10,2) not null default 0,
  currency text not null default 'USD',
  total_value numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'sent', 'confirmed')),
  created_at timestamptz not null default now()
);

create index idx_po_pipeline on purchase_orders(pipeline_id);

-- ============================================================
-- PURCHASE ORDER ITEMS
-- ============================================================
create table purchase_order_items (
  id uuid primary key default uuid_generate_v4(),
  po_id uuid not null references purchase_orders(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null default 0,
  buying_price numeric(10,2) not null default 0,
  total_price numeric(12,2) generated always as (quantity * buying_price) stored
);

-- ============================================================
-- EXPENSE TEMPLATES (Org-level defaults)
-- ============================================================
create table expense_templates (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  expense_name text not null,
  expense_type text not null check (expense_type in ('fixed', 'variable', 'percentage')),
  default_value numeric(12,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_expense_templates_org on expense_templates(organization_id);

-- ============================================================
-- DEAL EXPENSES (Per-deal costs)
-- ============================================================
create table deal_expenses (
  id uuid primary key default uuid_generate_v4(),
  pipeline_id uuid not null references pipelines(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  expense_name text not null,
  expense_type text not null check (expense_type in ('fixed', 'variable', 'percentage')),
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index idx_deal_expenses_pipeline on deal_expenses(pipeline_id);

-- ============================================================
-- SHIPMENTS (Container tracking)
-- ============================================================
create table shipments (
  id uuid primary key default uuid_generate_v4(),
  pipeline_id uuid not null references pipelines(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  status text not null default 'CONTAINER_PACKED' check (status in ('CONTAINER_PACKED', 'CONTAINER_LOADED', 'SHIPMENT_DISPATCHED', 'ON_VESSEL', 'ARRIVED_AT_PORT', 'DELIVERED')),
  container_number text,
  vessel_name text,
  port_of_loading text,
  port_of_discharge text,
  estimated_arrival timestamptz,
  actual_arrival timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_shipments_pipeline on shipments(pipeline_id);

-- ============================================================
-- DOCUMENTS (File uploads: BL, photos, etc.)
-- ============================================================
create table documents (
  id uuid primary key default uuid_generate_v4(),
  pipeline_id uuid not null references pipelines(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  document_type text not null check (document_type in ('BL', 'PI', 'PO', 'PACKING_LIST', 'CONTAINER_PHOTO', 'OTHER')),
  file_name text not null,
  file_url text not null,
  uploaded_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index idx_documents_pipeline on documents(pipeline_id);

-- ============================================================
-- NOTIFICATIONS (Log of all notifications)
-- ============================================================
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references users(id),
  buyer_id uuid references buyers(id),
  pipeline_id uuid references pipelines(id),
  type text not null check (type in ('email', 'whatsapp')),
  subject text not null,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_org on notifications(organization_id);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
alter table organizations enable row level security;
alter table users enable row level security;
alter table buyers enable row level security;
alter table products enable row level security;
alter table pipelines enable row level security;
alter table pipeline_items enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table proforma_invoices enable row level security;
alter table proforma_invoice_items enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
alter table expense_templates enable row level security;
alter table deal_expenses enable row level security;
alter table shipments enable row level security;
alter table documents enable row level security;
alter table notifications enable row level security;

-- Helper function to get user's organization
create or replace function get_user_org_id()
returns uuid as $$
  select organization_id from users where auth_id = auth.uid()
$$ language sql security definer stable;

-- Helper function to get user's role
create or replace function get_user_role()
returns text as $$
  select role from users where auth_id = auth.uid()
$$ language sql security definer stable;

-- Organizations: users can view their own org
create policy "Users can view own org"
  on organizations for select
  using (id = get_user_org_id());

create policy "Admins can update own org"
  on organizations for update
  using (id = get_user_org_id() and get_user_role() = 'exporter_admin');

-- Allow insert during signup (no RLS check needed)
create policy "Allow org creation during signup"
  on organizations for insert
  with check (true);

-- Users: can view colleagues in same org
create policy "Users can view org members"
  on users for select
  using (organization_id = get_user_org_id());

create policy "Allow user creation during signup"
  on users for insert
  with check (true);

-- Buyers: org-scoped access
create policy "Org members can view buyers"
  on buyers for select
  using (organization_id = get_user_org_id());

create policy "Org members can manage buyers"
  on buyers for all
  using (organization_id = get_user_org_id());

-- Products: org-scoped
create policy "Org members can view products"
  on products for select
  using (organization_id = get_user_org_id());

create policy "Org members can manage products"
  on products for all
  using (organization_id = get_user_org_id());

-- Pipelines: org-scoped
create policy "Org members can view pipelines"
  on pipelines for select
  using (organization_id = get_user_org_id());

create policy "Org members can manage pipelines"
  on pipelines for all
  using (organization_id = get_user_org_id());

-- Pipeline Items: via pipeline's org
create policy "Access pipeline items"
  on pipeline_items for all
  using (
    pipeline_id in (select id from pipelines where organization_id = get_user_org_id())
  );

-- Quotes: org-scoped
create policy "Org members can view quotes"
  on quotes for select
  using (organization_id = get_user_org_id());

create policy "Org members can manage quotes"
  on quotes for all
  using (organization_id = get_user_org_id());

-- Quote Items: via quote
create policy "Access quote items"
  on quote_items for all
  using (
    quote_id in (select id from quotes where organization_id = get_user_org_id())
  );

-- Proforma Invoices: org-scoped
create policy "Org PI access"
  on proforma_invoices for all
  using (organization_id = get_user_org_id());

-- PI Items
create policy "Access PI items"
  on proforma_invoice_items for all
  using (
    pi_id in (select id from proforma_invoices where organization_id = get_user_org_id())
  );

-- Purchase Orders: org-scoped
create policy "Org PO access"
  on purchase_orders for all
  using (organization_id = get_user_org_id());

-- PO Items
create policy "Access PO items"
  on purchase_order_items for all
  using (
    po_id in (select id from purchase_orders where organization_id = get_user_org_id())
  );

-- Expense Templates: org-scoped
create policy "Org expense templates"
  on expense_templates for all
  using (organization_id = get_user_org_id());

-- Deal Expenses: org-scoped
create policy "Org deal expenses"
  on deal_expenses for all
  using (organization_id = get_user_org_id());

-- Shipments: org-scoped
create policy "Org shipments"
  on shipments for all
  using (organization_id = get_user_org_id());

-- Documents: org-scoped
create policy "Org documents"
  on documents for all
  using (organization_id = get_user_org_id());

-- Notifications: org-scoped
create policy "Org notifications"
  on notifications for all
  using (organization_id = get_user_org_id());
