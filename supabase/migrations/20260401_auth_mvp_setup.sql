-- MotoPOS MVP auth and database access setup
-- Per-account isolation using owner_id. Each authenticated account only sees its own rows.

-- Supabase Auth configuration checklist:
-- 1. Enable Email auth in Authentication > Providers.
-- 2. Set the site URL to your deployed app URL.
-- 3. Add these redirect URLs:
--    - http://localhost:3000/reset-password
--    - https://your-production-domain/reset-password

alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

-- Per-owner isolation
alter table public.products add column if not exists owner_id uuid;
alter table public.sales add column if not exists owner_id uuid;
alter table public.sale_items add column if not exists owner_id uuid;

alter table public.products alter column owner_id set default auth.uid();
alter table public.sales alter column owner_id set default auth.uid();
alter table public.sale_items alter column owner_id set default auth.uid();

create index if not exists products_owner_id_idx on public.products (owner_id);
create index if not exists sales_owner_id_idx on public.sales (owner_id);
create index if not exists sale_items_owner_id_idx on public.sale_items (owner_id);

drop policy if exists "Authenticated users can read products" on public.products;
drop policy if exists "Authenticated users can insert products" on public.products;
drop policy if exists "Authenticated users can update products" on public.products;
drop policy if exists "Authenticated users can delete products" on public.products;

create policy "Authenticated users can read products"
on public.products for select
using (owner_id = auth.uid());

create policy "Authenticated users can insert products"
on public.products for insert
with check (owner_id = auth.uid());

create policy "Authenticated users can update products"
on public.products for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Authenticated users can delete products"
on public.products for delete
using (owner_id = auth.uid());

drop policy if exists "Authenticated users can read sales" on public.sales;
drop policy if exists "Authenticated users can insert sales" on public.sales;
drop policy if exists "Authenticated users can update sales" on public.sales;
drop policy if exists "Authenticated users can delete sales" on public.sales;

create policy "Authenticated users can read sales"
on public.sales for select
using (owner_id = auth.uid());

create policy "Authenticated users can insert sales"
on public.sales for insert
with check (owner_id = auth.uid());

create policy "Authenticated users can update sales"
on public.sales for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Authenticated users can delete sales"
on public.sales for delete
using (owner_id = auth.uid());

drop policy if exists "Authenticated users can read sale items" on public.sale_items;
drop policy if exists "Authenticated users can insert sale items" on public.sale_items;
drop policy if exists "Authenticated users can update sale items" on public.sale_items;
drop policy if exists "Authenticated users can delete sale items" on public.sale_items;

create policy "Authenticated users can read sale items"
on public.sale_items for select
using (owner_id = auth.uid());

create policy "Authenticated users can insert sale items"
on public.sale_items for insert
with check (owner_id = auth.uid());

create policy "Authenticated users can update sale items"
on public.sale_items for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Authenticated users can delete sale items"
on public.sale_items for delete
using (owner_id = auth.uid());
