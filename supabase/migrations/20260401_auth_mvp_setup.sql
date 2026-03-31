-- MotoPOS MVP auth and database access setup
-- Assumption: one authenticated owner account per shop deployment.
-- If you later add multiple staff accounts, introduce shop/user ownership columns
-- before loosening sign-up or sharing a database across multiple stores.

-- Supabase Auth configuration checklist:
-- 1. Enable Email auth in Authentication > Providers.
-- 2. Set the site URL to your deployed app URL.
-- 3. Add these redirect URLs:
--    - http://localhost:3000/reset-password
--    - https://your-production-domain/reset-password

alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

drop policy if exists "Authenticated users can read products" on public.products;
drop policy if exists "Authenticated users can insert products" on public.products;
drop policy if exists "Authenticated users can update products" on public.products;
drop policy if exists "Authenticated users can delete products" on public.products;

create policy "Authenticated users can read products"
on public.products for select
using (auth.role() = 'authenticated');

create policy "Authenticated users can insert products"
on public.products for insert
with check (auth.role() = 'authenticated');

create policy "Authenticated users can update products"
on public.products for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete products"
on public.products for delete
using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can read sales" on public.sales;
drop policy if exists "Authenticated users can insert sales" on public.sales;
drop policy if exists "Authenticated users can update sales" on public.sales;
drop policy if exists "Authenticated users can delete sales" on public.sales;

create policy "Authenticated users can read sales"
on public.sales for select
using (auth.role() = 'authenticated');

create policy "Authenticated users can insert sales"
on public.sales for insert
with check (auth.role() = 'authenticated');

create policy "Authenticated users can update sales"
on public.sales for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete sales"
on public.sales for delete
using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can read sale items" on public.sale_items;
drop policy if exists "Authenticated users can insert sale items" on public.sale_items;
drop policy if exists "Authenticated users can update sale items" on public.sale_items;
drop policy if exists "Authenticated users can delete sale items" on public.sale_items;

create policy "Authenticated users can read sale items"
on public.sale_items for select
using (auth.role() = 'authenticated');

create policy "Authenticated users can insert sale items"
on public.sale_items for insert
with check (auth.role() = 'authenticated');

create policy "Authenticated users can update sale items"
on public.sale_items for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete sale items"
on public.sale_items for delete
using (auth.role() = 'authenticated');
