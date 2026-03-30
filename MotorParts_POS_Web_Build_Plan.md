# MotorParts POS — Step-by-Step Web App Build Plan

> **Version:** 2.0 · **Date:** March 31, 2026
> **Reference PRD:** `MotorParts_POS_Web_PRD.md`
> **Agent Role:** Senior Full Stack Web Developer
> **Deployment:** Vercel

---

## Agent Directive

You are a **Senior Full Stack Web Developer** with 10+ years of experience building production-grade web applications. Before writing any code:

- Read the full PRD (`MotorParts_POS_Web_PRD.md`) and this build plan completely.
- Follow each step in exact order. Do not skip or reorder steps.
- Check off each step `[x]` as you complete it.
- After completing each **step**, stage and commit that step's changes with the provided commit message.
- After completing each **phase**, stage and commit a phase-summary commit with the provided message.
- Never leave the codebase in a broken or non-building state between commits.

### Code Quality Standards (Non-Negotiable)

**Readability**
- Use descriptive, full-word variable and function names. Never use `n`, `x`, `tmp`, or unexplained abbreviations.
- Functions do one thing only. If a function is longer than 40 lines, break it apart.
- Follow DRY (Don't Repeat Yourself) — extract repeated logic into shared utilities.
- Organize files by feature/responsibility, not by file type.
- Use consistent indentation: 2 spaces for TSX/TS files.

**Self-Documenting Code**
- Name things so clearly that comments explaining *what* are rarely needed.
- Write comments only to explain *why* — business logic, edge cases, or non-obvious decisions.
- Every exported function must be preceded by a JSDoc comment describing its purpose.

**Security**
- Never hardcode API keys, secrets, or credentials. Use Vercel environment variables and `process.env`.
- The `GEMINI_API_KEY` must only ever be used inside Next.js API Routes — never in client components.
- Validate and sanitize all user inputs before writing to IndexedDB or sending to any API.
- Prefix Supabase env vars with `NEXT_PUBLIC_` only — the anon key is safe to expose.
- Never commit `.env.local` to version control.

**UI Cleanliness**
- Reference all colors via CSS variables declared in `globals.css` — zero hardcoded hex values in components.
- Import all spacing and layout values from `src/theme/spacing.ts` — zero hardcoded pixel numbers in JSX.
- Every page must work correctly in both light mode and dark mode.
- Minimum click target: 44×44px for all interactive elements (WCAG AA).

### Commit Command Pattern

```bash
git add .
git commit -m "<provided commit message>"
```

Commit format: `type(scope): description`
Types: `feat`, `chore`, `test`, `style`, `perf`, `a11y`, `milestone`

---

## Progress Tracker

```
Phase 1  — Project Setup & Foundation       [ ] 2/6 steps complete
Phase 2  — Database Layer (IndexedDB/Dexie) [ ] 0/5 steps complete
Phase 3  — Theme & Design System            [ ] 0/4 steps complete
Phase 4  — Layout Shell & Navigation        [ ] 0/3 steps complete
Phase 5  — Inventory Management             [ ] 0/5 steps complete
Phase 6  — New Sale & Checkout              [ ] 0/5 steps complete
Phase 7  — Dashboard                        [ ] 0/4 steps complete
Phase 8  — Sale History                     [ ] 0/3 steps complete
Phase 9  — Supabase Cloud Sync              [ ] 0/4 steps complete
Phase 10 — AI Assistant                     [ ] 0/5 steps complete
Phase 11 — Barcode Scanner                  [ ] 0/2 steps complete
Phase 12 — PWA & Vercel Deployment          [ ] 0/3 steps complete
Phase 13 — Polish & QA                      [ ] 0/4 steps complete
```

---

## Phase 1 — Project Setup & Foundation

> **Goal:** A clean, running Next.js project with git, environment config, Tailwind, and folder structure in place before any feature code is written.

---

### Step 1.1 — Initialize the Next.js project

- [x] **Task:** Create a new Next.js project with TypeScript, Tailwind, and the App Router. Initialize git.

```bash
npx create-next-app@latest MotorPartsPOS \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --no-eslint \
  --import-alias "@/*"
cd MotorPartsPOS
git init
git add .
git commit -m "chore(init): initialize Next.js 14 project with TypeScript, Tailwind, and App Router"
```

**Verify:** Running `npm run dev` starts the dev server at `http://localhost:3000` without errors.

---

### Step 1.2 — Install all dependencies

- [x] **Task:** Install every package the project will need across all phases in one go.

```bash
# Database (offline-first)
npm install dexie

# Cloud & Auth
npm install @supabase/supabase-js

# AI
npm install @google/generative-ai

# Icons
npm install lucide-react

# Date formatting
npm install date-fns

# Barcode scanner (browser camera)
npm install html5-qrcode

# PWA support
npm install next-pwa
```

**Verify:** `npm list --depth=0` shows all packages with no unmet peer dependency errors.

> **Commit:**
```bash
git add .
git commit -m "chore(deps): install all project dependencies"
```

---

### Step 1.3 — Configure environment variables

- [ ] **Task:** Set up secure environment variable management so no secrets are ever hardcoded or exposed to the browser.

Create **`.env.local`** in the project root:

```env
# Supabase — NEXT_PUBLIC_ prefix exposes these safely to the browser client
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Gemini — NO NEXT_PUBLIC_ prefix: server-only, never exposed to browser
GEMINI_API_KEY=your_gemini_api_key_here
```

Add to **`.gitignore`** (append to the default Next.js `.gitignore`):

```
.env.local
.env*.local
```

**Security check:** Run `git status` and confirm `.env.local` does not appear as a tracked file.

> **Commit:**
```bash
git add .gitignore
git commit -m "chore(config): add environment variable config and confirm gitignore"
```

---

### Step 1.4 — Create the full folder structure

- [ ] **Task:** Create every directory and placeholder file the project will use. This makes the architecture visible and prevents import resolution errors later.

```bash
# App Router pages
mkdir -p src/app/dashboard
mkdir -p src/app/sale/new
mkdir -p src/app/inventory/new
mkdir -p "src/app/inventory/[id]"
mkdir -p src/app/history
mkdir -p "src/app/history/[id]"
mkdir -p src/app/ai
mkdir -p src/app/api/ai/chat

# Shared source directories
mkdir -p src/{components,database,services,context,hooks,theme,utils,styles}

# Placeholder files — pages
touch src/app/dashboard/page.tsx
touch src/app/sale/new/page.tsx
touch src/app/inventory/page.tsx
touch src/app/inventory/new/page.tsx
touch "src/app/inventory/[id]/page.tsx"
touch src/app/history/page.tsx
touch "src/app/history/[id]/page.tsx"
touch src/app/ai/page.tsx
touch src/app/api/ai/chat/route.ts

# Components
touch src/components/Button.tsx
touch src/components/Card.tsx
touch src/components/MetricCard.tsx
touch src/components/StockBadge.tsx
touch src/components/CartItem.tsx
touch src/components/AIChatBubble.tsx
touch src/components/Sidebar.tsx
touch src/components/TopBar.tsx
touch src/components/index.ts

# Database
touch src/database/db.ts
touch src/database/products.ts
touch src/database/sales.ts

# Services
touch src/services/supabase.ts
touch src/services/gemini.ts
touch src/services/sync.ts

# Context & hooks
touch src/context/AppContext.tsx
touch src/hooks/useSync.ts
touch src/hooks/useAI.ts
touch src/hooks/useTheme.ts

# Theme
touch src/theme/colors.ts
touch src/theme/typography.ts
touch src/theme/spacing.ts

# Utils
touch src/utils/generateId.ts
touch src/utils/formatCurrency.ts
touch src/utils/formatDate.ts
touch src/utils/validateInput.ts
```

**Verify:** The folder tree matches Section 9 of the PRD exactly.

> **Commit:**
```bash
git add .
git commit -m "chore(structure): scaffold full project folder and file structure"
```

---

### Step 1.5 — Write shared utility helpers

- [ ] **Task:** Implement the utility functions that every other module will depend on.

**`src/utils/generateId.ts`**
```ts
/**
 * Generates a cryptographically random UUID v4 using the browser's built-in API.
 * Used as the primary key for all local IndexedDB records.
 */
export function generateId(): string {
  return crypto.randomUUID();
}
```

**`src/utils/formatCurrency.ts`**
```ts
/**
 * Formats a number as Philippine Peso currency.
 * Example: 1234.5 → "₱1,234.50"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}
```

**`src/utils/formatDate.ts`**
```ts
import { format, formatDistanceToNow } from 'date-fns';

/** Formats an ISO 8601 string as a readable date. Example: "Mar 30, 2026" */
export function formatDisplayDate(isoString: string): string {
  return format(new Date(isoString), 'MMM d, yyyy');
}

/** Formats an ISO 8601 string as a time. Example: "9:41 AM" */
export function formatTime(isoString: string): string {
  return format(new Date(isoString), 'h:mm a');
}

/** Returns a relative time string. Example: "2 hours ago" */
export function formatRelativeTime(isoString: string): string {
  return formatDistanceToNow(new Date(isoString), { addSuffix: true });
}
```

**`src/utils/validateInput.ts`**
```ts
interface ProductFormValues {
  name: string;
  sku: string;
  category: string;
  sellingPrice: number | string;
  stockQty: number | string;
}

/**
 * Validates a product form and returns an error message string,
 * or null if all fields are valid.
 */
export function validateProductForm({ name, sku, category, sellingPrice, stockQty }: ProductFormValues): string | null {
  if (!name || name.trim().length === 0)         return 'Product name is required.';
  if (!sku || sku.trim().length === 0)           return 'SKU is required.';
  if (!category || category.trim().length === 0) return 'Category is required.';
  if (isNaN(Number(sellingPrice)) || Number(sellingPrice) <= 0) return 'Selling price must be a positive number.';
  if (isNaN(Number(stockQty)) || Number(stockQty) < 0)         return 'Stock quantity cannot be negative.';
  return null;
}

/**
 * Trims whitespace from a string value.
 * All user text inputs must pass through this before being written to the database.
 */
export function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}
```

> **Commit:**
```bash
git add .
git commit -m "feat(utils): add currency, date, UUID, and input validation helpers"
```

---

### Step 1.6 — Verify the project builds cleanly

- [ ] **Task:** Confirm the app starts and builds without TypeScript errors before writing any feature code.

Update `src/app/page.tsx` with a visible placeholder that does a client-side redirect:

```tsx
// src/app/page.tsx
import { redirect } from 'next/navigation';

/** Root route — redirect to dashboard on every visit. */
export default function RootPage() {
  redirect('/dashboard');
}
```

Update `src/app/dashboard/page.tsx` with a temporary placeholder:

```tsx
// src/app/dashboard/page.tsx — temporary placeholder, replaced in Phase 7
export default function DashboardPage() {
  return (
    <main className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[#1A1A2E]">MotorParts POS</h1>
        <p className="mt-2 text-sm text-[#666666]">Phase 1 complete — setup verified.</p>
      </div>
    </main>
  );
}
```

Run `npm run build` and confirm zero TypeScript errors and zero build failures.

> **Commit:**
```bash
git add .
git commit -m "chore(verify): confirm project builds cleanly before feature development"
```

> **Phase 1 complete — milestone commit:**
```bash
git commit --allow-empty -m "milestone(phase-1): project setup and foundation complete"
```

---

## Phase 2 — Database Layer (IndexedDB / Dexie)

> **Goal:** A fully working local database with all tables, migrations, and typed CRUD functions before any UI is built.

---

### Step 2.1 — Define the Dexie database and schema

- [ ] **Task:** Create the Dexie database class with all table definitions and version migrations.

**`src/database/db.ts`**
```ts
import Dexie, { Table } from 'dexie';

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand?: string;
  category: string;
  unit: string;
  selling_price: number;
  cost_price?: number;
  stock_qty: number;
  low_stock_threshold: number;
  image_url?: string;
  is_active: number;
  synced: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  sale_date: string;
  total_amount: number;
  discount_amount: number;
  payment_method: string;
  customer_name?: string;
  notes?: string;
  synced: number;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * MotorPartsDatabase wraps IndexedDB via Dexie.
 * All offline-first data is stored here. Supabase syncs in background.
 */
class MotorPartsDatabase extends Dexie {
  products!: Table<Product, string>;
  sales!: Table<Sale, string>;
  sale_items!: Table<SaleItem, string>;
  suppliers!: Table<Supplier, string>;

  constructor() {
    super('motorparts_pos');

    this.version(1).stores({
      products:   'id, sku, name, category, brand, is_active, stock_qty, synced',
      sales:      'id, sale_date, synced',
      sale_items: 'id, sale_id, product_id',
      suppliers:  'id, name',
    });
  }
}

export const db = new MotorPartsDatabase();
```

> **Commit:**
```bash
git add .
git commit -m "feat(database): add Dexie database class with all table definitions and index schema"
```

---

### Step 2.2 — Write product database functions

- [ ] **Task:** All CRUD operations for the `products` table.

**`src/database/products.ts`**
```ts
import { db, Product } from './db';
import { generateId } from '@/utils/generateId';
import { sanitizeText } from '@/utils/validateInput';

/** Returns all active products ordered alphabetically by name. */
export async function getAllProducts(): Promise<Product[]> {
  return db.products
    .where('is_active').equals(1)
    .sortBy('name');
}

/** Returns a single product by its ID, or undefined if not found. */
export async function getProductById(productId: string): Promise<Product | undefined> {
  return db.products.get(productId);
}

/** Returns a product matching a given SKU (barcode), or undefined. */
export async function getProductBySku(sku: string): Promise<Product | undefined> {
  return db.products
    .where('sku').equals(sanitizeText(sku))
    .filter(p => p.is_active === 1)
    .first();
}

/** Returns all products at or below their low stock threshold. */
export async function getLowStockProducts(): Promise<Product[]> {
  const allActive = await db.products.where('is_active').equals(1).toArray();
  return allActive
    .filter(p => p.stock_qty <= p.low_stock_threshold)
    .sort((a, b) => a.stock_qty - b.stock_qty);
}

/** Returns products whose name, brand, or SKU contains the search query (case-insensitive). */
export async function searchProducts(query: string): Promise<Product[]> {
  const lowerQuery = sanitizeText(query).toLowerCase();
  if (!lowerQuery) return getAllProducts();
  const allActive = await db.products.where('is_active').equals(1).toArray();
  return allActive.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    (p.brand ?? '').toLowerCase().includes(lowerQuery) ||
    p.sku.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Inserts a new product. Generates a UUID as the primary key.
 * Returns the new product's ID.
 */
export async function insertProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'synced'>): Promise<string> {
  const now = new Date().toISOString();
  const id  = generateId();
  await db.products.add({ ...productData, id, synced: 0, created_at: now, updated_at: now });
  return id;
}

/**
 * Updates an existing product by ID.
 * Always sets updated_at to the current timestamp and marks synced = 0.
 */
export async function updateProduct(productId: string, changes: Partial<Omit<Product, 'id' | 'created_at'>>): Promise<void> {
  await db.products.update(productId, { ...changes, synced: 0, updated_at: new Date().toISOString() });
}

/**
 * Soft-deletes a product by setting is_active = 0.
 * The record is retained for historical sale records.
 */
export async function softDeleteProduct(productId: string): Promise<void> {
  await updateProduct(productId, { is_active: 0 });
}

/**
 * Deducts a quantity from a product's stock.
 * Called inside the checkout transaction — do not call independently.
 */
export async function deductStock(productId: string, quantity: number): Promise<void> {
  const product = await getProductById(productId);
  if (!product) throw new Error(`Product ${productId} not found during stock deduction.`);
  const newQty = Math.max(0, product.stock_qty - quantity);
  await updateProduct(productId, { stock_qty: newQty });
}
```

> **Commit:**
```bash
git add .
git commit -m "feat(database): add product CRUD functions with search and soft-delete"
```

---

### Step 2.3 — Write sales database functions

- [ ] **Task:** All functions for the `sales` and `sale_items` tables, including the atomic checkout.

**`src/database/sales.ts`**
```ts
import { db, Sale, SaleItem } from './db';
import { generateId } from '@/utils/generateId';
import { sanitizeText } from '@/utils/validateInput';
import { deductStock } from './products';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface SaleInput {
  paymentMethod?: string;
  customerName?: string;
  notes?: string;
  discountAmount?: number;
}

/** Returns the most recent N sales, ordered newest first. */
export async function getRecentSales(limit = 10): Promise<Sale[]> {
  return db.sales.orderBy('sale_date').reverse().limit(limit).toArray();
}

/** Returns today's total revenue and transaction count from IndexedDB. */
export async function getTodaySalesSummary(): Promise<{ totalAmount: number; transactionCount: number }> {
  const todayPrefix = new Date().toISOString().split('T')[0];
  const todaySales  = await db.sales.where('sale_date').startsWith(todayPrefix).toArray();
  return {
    totalAmount:      todaySales.reduce((sum, s) => sum + s.total_amount, 0),
    transactionCount: todaySales.length,
  };
}

/** Returns all sale items for a given sale ID. */
export async function getSaleItems(saleId: string): Promise<SaleItem[]> {
  return db.sale_items.where('sale_id').equals(saleId).toArray();
}

/** Returns sales within a date range (ISO date strings: YYYY-MM-DD). */
export async function getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
  return db.sales
    .where('sale_date')
    .between(`${startDate}T00:00:00.000Z`, `${endDate}T23:59:59.999Z`, true, true)
    .reverse()
    .toArray();
}

/** Returns the top N selling products by quantity over the last N days. */
export async function getTopSellingProducts(numberOfDays = 30, limit = 5) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - numberOfDays);
  const recentSales = await db.sales
    .where('sale_date').above(cutoff.toISOString())
    .toArray();
  const recentSaleIds = new Set(recentSales.map(s => s.id));
  const recentItems   = await db.sale_items
    .filter(item => recentSaleIds.has(item.sale_id))
    .toArray();

  const aggregated = new Map<string, { name: string; totalSold: number }>();
  for (const item of recentItems) {
    const existing = aggregated.get(item.product_id);
    aggregated.set(item.product_id, {
      name:      item.product_name,
      totalSold: (existing?.totalSold ?? 0) + item.quantity,
    });
  }

  return [...aggregated.values()]
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, limit);
}

/**
 * Atomically completes a checkout: inserts a sale record, inserts all
 * line items, and deducts stock for each product.
 * Uses Dexie's transaction API so if any step fails, nothing is written.
 *
 * @returns The new sale's ID.
 */
export async function completeSale(saleData: SaleInput, cartItems: CartItem[]): Promise<string> {
  if (!cartItems || cartItems.length === 0) {
    throw new Error('Cannot complete a sale with an empty cart.');
  }

  const now          = new Date().toISOString();
  const saleId       = generateId();
  const subtotal     = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const finalTotal   = subtotal - (saleData.discountAmount ?? 0);

  await db.transaction('rw', db.sales, db.sale_items, db.products, async () => {
    await db.sales.add({
      id:              saleId,
      sale_date:       now,
      total_amount:    finalTotal,
      discount_amount: saleData.discountAmount ?? 0,
      payment_method:  sanitizeText(saleData.paymentMethod ?? 'cash'),
      customer_name:   saleData.customerName ? sanitizeText(saleData.customerName) : undefined,
      notes:           saleData.notes ? sanitizeText(saleData.notes) : undefined,
      synced:          0,
      created_at:      now,
      updated_at:      now,
    });

    for (const item of cartItems) {
      await db.sale_items.add({
        id:           `${saleId}-${item.productId}`,
        sale_id:      saleId,
        product_id:   item.productId,
        product_name: sanitizeText(item.productName),
        quantity:     item.quantity,
        unit_price:   item.unitPrice,
        subtotal:     item.unitPrice * item.quantity,
      });
      await deductStock(item.productId, item.quantity);
    }
  });

  return saleId;
}

/** Marks a sale as synced after it has been pushed to Supabase. */
export async function markSaleAsSynced(saleId: string): Promise<void> {
  await db.sales.update(saleId, { synced: 1 });
}
```

> **Commit:**
```bash
git add .
git commit -m "feat(database): add sales CRUD and atomic checkout transaction"
```

---

### Step 2.4 — Smoke test the database layer in a temporary test page

- [ ] **Task:** Temporarily create a `/test-db` page to confirm the full database layer works in the browser.

Create `src/app/test-db/page.tsx` with a "Run DB Test" button that calls `insertProduct`, `getAllProducts`, and `softDeleteProduct`, then logs results to an on-screen output div. Delete the file after verification.

**Verify:** Clicking "Run DB Test" shows `Smoke test passed: 1 product found — Smoke Test Filter` on screen.

> **Commit:**
```bash
git add .
git commit -m "test(database): verify product insert, query, and soft-delete in browser"
```

---

### Step 2.5 — Remove smoke test page

- [ ] **Task:** Delete `src/app/test-db/` completely.

```bash
rm -rf src/app/test-db
```

> **Commit:**
```bash
git add .
git commit -m "chore(cleanup): remove temporary database smoke test page"
```

> **Phase 2 complete — milestone commit:**
```bash
git commit --allow-empty -m "milestone(phase-2): IndexedDB database layer fully implemented and verified"
```

---

## Phase 3 — Theme & Design System

> **Goal:** A single source of truth for all colors, typography, and spacing so every page looks consistent.

---

### Step 3.1 — Declare CSS variables and configure Tailwind

- [ ] **Task:** Define all color tokens as CSS variables in `globals.css` and wire them to Tailwind.

**`src/styles/globals.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary:   #FFFFFF;
  --bg-secondary: #F5F5F5;
  --bg-surface:   #F8F8F8;
  --text-primary:    #121212;
  --text-secondary:  #666666;
  --text-on-accent:  #FFFFFF;
  --accent:       #1D9E75;
  --accent-dark:  #085041;
  --accent-navy:  #1A1A2E;
  --danger:       #E24B4A;
  --warning:      #EF9F27;
  --success:      #3B6D11;
  --border:       #E0E0E0;
  --divider:      #EEEEEE;
  --shadow:       rgba(0, 0, 0, 0.08);
  --stock-ok-bg:  #E1F5EE;
  --stock-ok-text:#085041;
  --stock-low-bg: #FCEBEB;
  --stock-low-text:#A32D2D;
  --ai-bubble-bg: #E1F5EE;
  --user-bubble-bg:#1A1A2E;
}

.dark {
  --bg-primary:    #121212;
  --bg-secondary:  #1F1F1F;
  --bg-surface:    #1C1C1E;
  --text-primary:  #E0E0E0;
  --text-secondary:#9E9E9E;
  --text-on-accent:#121212;
  --accent:        #64B5F6;
  --accent-dark:   #90CAF9;
  --accent-navy:   #2A2A3E;
  --danger:        #EF5350;
  --warning:       #FFB74D;
  --success:       #81C784;
  --border:        #2C2C2C;
  --divider:       #2C2C2C;
  --shadow:        rgba(0, 0, 0, 0.4);
  --stock-ok-bg:   #0D3321;
  --stock-ok-text: #81C784;
  --stock-low-bg:  #3B1212;
  --stock-low-text:#EF9A9A;
  --ai-bubble-bg:  #1B3A2B;
  --user-bubble-bg:#2A2A3E;
}
```

Extend `tailwind.config.ts` to expose CSS variables as Tailwind color utilities so you can write `bg-bg-primary`, `text-accent`, etc.:

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-primary':   'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-surface':   'var(--bg-surface)',
        'text-primary':    'var(--text-primary)',
        'text-secondary':  'var(--text-secondary)',
        'accent':          'var(--accent)',
        'accent-navy':     'var(--accent-navy)',
        'danger':          'var(--danger)',
        'warning':         'var(--warning)',
        'success':         'var(--success)',
        'border-color':    'var(--border)',
      },
    },
  },
  plugins: [],
};

export default config;
```

> **Commit:**
```bash
git add .
git commit -m "feat(theme): add CSS variable color tokens for light and dark mode"
```

---

### Step 3.2 — Implement typography and spacing constants

- [ ] **Task:** Define all font size, weight, and spacing constants as TypeScript exports.

**`src/theme/typography.ts`**
```ts
export const fontSizes = {
  caption: '12px', body: '14px', button: '15px',
  section: '16px', price: '16px', title: '20px', display: '24px',
} as const;

export const fontWeights = {
  regular: '400', medium: '500', semibold: '600', bold: '700',
} as const;
```

**`src/theme/spacing.ts`**
```ts
export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const RADIUS  = { sm: 6, md: 10, lg: 14, full: 9999 } as const;

export const LAYOUT = {
  sidebarWidth:    240,
  topBarHeight:    56,
  minClickTarget:  44,
  maxContentWidth: 1280,
} as const;
```

> **Commit:**
```bash
git add .
git commit -m "feat(theme): add typography scale and spacing constants"
```

---

### Step 3.3 — Create the theme context and useTheme hook

- [ ] **Task:** Provide dark mode toggling to all components without prop drilling.

**`src/context/AppContext.tsx`**
```tsx
'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppContextValue {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  cartItems: CartItem[];
  addItemToCart: (product: Product) => void;
  removeItemFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, newQuantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

// (import Product and CartItem types from database/db.ts)

const AppContext = createContext<AppContextValue | null>(null);

/** Provides global dark mode and cart state to all child components. */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cartItems, setCartItems]   = useState<CartItem[]>([]);

  // Apply dark class to <html> element on toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  function toggleDarkMode() {
    setIsDarkMode(previous => !previous);
  }

  function addItemToCart(product: Product) {
    setCartItems(previous => {
      const existingItem = previous.find(item => item.productId === product.id);
      if (existingItem) {
        return previous.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...previous, {
        productId:   product.id,
        productName: product.name,
        unitPrice:   product.selling_price,
        quantity:    1,
      }];
    });
  }

  function removeItemFromCart(productId: string) {
    setCartItems(previous => previous.filter(item => item.productId !== productId));
  }

  function updateCartItemQuantity(productId: string, newQuantity: number) {
    if (newQuantity <= 0) { removeItemFromCart(productId); return; }
    setCartItems(previous =>
      previous.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  }

  function clearCart() { setCartItems([]); }

  const cartTotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <AppContext.Provider value={{
      isDarkMode, toggleDarkMode,
      cartItems, addItemToCart, removeItemFromCart, updateCartItemQuantity, clearCart, cartTotal,
    }}>
      {children}
    </AppContext.Provider>
  );
}

/** Returns theme and cart state. Must be used inside AppProvider. */
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used inside AppProvider');
  return context;
}
```

> **Commit:**
```bash
git add .
git commit -m "feat(theme): add AppContext with dark mode toggle and cart state"
```

---

### Step 3.4 — Build reusable base UI components

- [ ] **Task:** Create the shared UI components every page will use. All must use CSS variable classes — no hardcoded hex values.

| Component | Description |
|---|---|
| `Button.tsx` | Primary (`bg-accent`), secondary, danger (`bg-danger`), and navy variants. `min-h-[44px]`. Loading and disabled states. |
| `Card.tsx` | `bg-bg-secondary`, `rounded-lg`, `p-4`, `border border-[var(--border)]`, subtle `shadow-sm`. |
| `MetricCard.tsx` | Card with a muted label above a large bold number. Used on Dashboard. |
| `StockBadge.tsx` | Color-coded pill: green (`--stock-ok-bg`) if OK, red (`--stock-low-bg`) if `stockQty <= lowStockThreshold`. |

Export all four from `src/components/index.ts`:

```ts
export { Button }     from './Button';
export { Card }       from './Card';
export { MetricCard } from './MetricCard';
export { StockBadge } from './StockBadge';
```

> **Commit:**
```bash
git add .
git commit -m "feat(components): add Button, Card, MetricCard, and StockBadge base components"
```

> **Phase 3 complete — milestone commit:**
```bash
git commit --allow-empty -m "milestone(phase-3): design system and base components complete"
```

---

## Phase 4 — Layout Shell & Navigation

> **Goal:** The persistent sidebar + top bar layout active on all pages, with placeholder page content.

---

### Step 4.1 — Build the Sidebar and TopBar components

- [ ] **Task:** Create the persistent navigation components.

**`src/components/Sidebar.tsx`** — implement:
- Fixed left sidebar, `w-[240px]`, `bg-accent-navy`, full-height
- Shop logo / name at the top
- Nav links using Next.js `<Link>`: Dashboard, New Sale, Inventory, AI Assistant
- Active link: `bg-white/10` highlight, `text-white`; inactive: `text-white/60`
- Lucide icons: `LayoutDashboard`, `ShoppingCart`, `Package`, `MessageCircle`
- On screens < 1024px: collapses to icon-only rail (48px wide) or hidden

**`src/components/TopBar.tsx`** — implement:
- Fixed top bar, full-width, `h-[56px]`, `bg-bg-primary`, `border-b border-[var(--border)]`
- Page title (passed as prop)
- Sync status dot (green = synced, orange = pending) — reads from `AppContext`
- Dark mode toggle button using `toggleDarkMode` from `useAppContext()`

> **Commit:**
```bash
git add .
git commit -m "feat(layout): add Sidebar and TopBar navigation components"
```

---

### Step 4.2 — Wire the layout shell into the root layout

- [ ] **Task:** Apply the sidebar + topbar layout to all pages via `src/app/layout.tsx`.

```tsx
// src/app/layout.tsx
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { Sidebar }     from '@/components/Sidebar';
import { TopBar }      from '@/components/TopBar';

export const metadata = { title: 'MotorParts POS', description: 'Motorcycle parts shop management' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg-primary text-text-primary">
        <AppProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <TopBar />
              <main className="flex-1 overflow-y-auto p-6 max-w-[1280px] w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
```

> **Commit:**
```bash
git add .
git commit -m "feat(layout): wire AppProvider and layout shell into root layout"
```

---

### Step 4.3 — Add placeholder pages with correct titles

- [ ] **Task:** Give each page a `<TopBar title="..." />` and a themed body before filling in real content.

For each of the 5 page files, add a minimal placeholder component that:
- Passes the correct page title to `<TopBar>`
- Renders a `bg-bg-secondary` card with a "Coming in Phase X" message

**Verify:** All 5 nav links work, correct title appears in the top bar, dark mode toggle switches themes on all pages.

> **Commit:**
```bash
git add .
git commit -m "feat(pages): add placeholder pages with themed layout and correct titles"
```

> **Phase 4 complete — milestone commit:**
```bash
git commit --allow-empty -m "milestone(phase-4): layout shell active on all pages"
```

---

## Phase 5 — Inventory Management

> **Goal:** Full product CRUD — list, search, add, edit, soft-delete — all wired to IndexedDB.

---

### Step 5.1 — Build the Inventory list page

- [ ] **Task:** Display all products with search and tab filters.

`src/app/inventory/page.tsx` must implement:
- Tab bar: **All Items · Low Stock · By Category** (active tab has accent underline)
- `<input>` search bar — calls `searchProducts()` on every keystroke with 200ms debounce
- Product table: name, SKU, category, stock qty, `<StockBadge />`
- Re-query IndexedDB on each tab focus using a `useEffect` with a `window visibilitychange` listener
- Clicking a row: `router.push('/inventory/' + item.id)`
- "+ Add Product" button (top-right): `router.push('/inventory/new')`

> **Commit:**
```bash
git add .
git commit -m "feat(inventory): implement product list page with search and tabs"
```

---

### Step 5.2 — Build the Add Product page

- [ ] **Task:** Form for adding a new product.

`src/app/inventory/new/page.tsx` must implement:
- Form fields: Name, Brand, SKU, Category (select), Unit (select), Selling Price, Cost Price, Stock Qty, Low Stock Threshold
- Validation: runs `validateProductForm()` before any database write; shows inline error text on failure
- Save: calls `insertProduct()` then `router.push('/inventory')`
- Cancel: `router.back()`

> **Commit:**
```bash
git add .
git commit -m "feat(inventory): implement Add Product page with validation"
```

---

### Step 5.3 — Build the Edit Product page

- [ ] **Task:** Form for editing or deleting an existing product.

`src/app/inventory/[id]/page.tsx` must implement:
- Pre-populate all fields by calling `getProductById(params.id)` on load
- Save: calls `updateProduct()` then `router.push('/inventory')`
- Delete: confirmation dialog (`window.confirm` or a modal) → `softDeleteProduct()` → `router.push('/inventory')`
- All text inputs use `sanitizeText()` before passing to database functions

> **Commit:**
```bash
git add .
git commit -m "feat(inventory): implement Edit Product page with soft-delete"
```

---

### Step 5.4 — Add category grouping to the By Category tab

- [ ] **Task:** Group the full product list into sections by category.

- "By Category" tab renders products in collapsible sections, grouped client-side by the `category` field
- Section headers styled in `bg-bg-secondary` with `text-text-secondary`, `font-semibold`

> **Commit:**
```bash
git add .
git commit -m "feat(inventory): add category section grouping"
```

---

### Step 5.5 — End-to-end inventory verification

- [ ] **Task:** Manual test of the full CRUD flow.

Checklist:
- [ ] Add a new product — appears in All Items
- [ ] Edit the product — changes reflected after returning to list
- [ ] Set stock to 3 — badge turns red, item appears in Low Stock tab
- [ ] Delete — disappears from list
- [ ] Search by name, brand, and SKU — correct results

> **Commit:**
```bash
git add .
git commit -m "test(inventory): verify full CRUD flow in browser"
```

> **Phase 5 complete — milestone commit:**
```bash
git commit --allow-empty -m "milestone(phase-5): inventory management fully implemented"
```

---

## Phase 6 — New Sale & Checkout

> **Goal:** Complete checkout flow — browse products, build a cart, charge, deduct stock, save the sale.

---

### Step 6.1 — Build the product browser on the New Sale page

- [ ] **Task:** Left/top section of the New Sale page — browse and add products.

`src/app/sale/new/page.tsx` left panel:
- Search bar + barcode scan button (stub for Phase 11)
- Product table or grid: name, brand, stock, price, "+ Add" button
- Clicking "+ Add" calls `addItemToCart(product)` from `useAppContext()`
- Products with `stock_qty === 0`: show "Out of stock" label, disable the add button

> **Commit:**
```bash
git add .
git commit -m "feat(sale): implement product browser and add-to-cart on New Sale page"
```

---

### Step 6.2 — Build the cart panel

- [ ] **Task:** Right panel of the New Sale page — cart, totals, charge button.

- Cart list: product name, qty controls (+/-), subtotal per row, remove (×) button
- Total amount displayed prominently
- Charge button: `bg-accent-navy`, full-width, label "Charge ₱{formatCurrency(cartTotal)}"
- Empty cart: button disabled, label "Add items to charge"

> **Commit:**
```bash
git add .
git commit -m "feat(sale): implement cart panel with quantity controls and charge button"
```

---

### Step 6.3 — Implement the checkout action

- [ ] **Task:** Wire the charge button to `completeSale()`.

```tsx
async function handleCharge() {
  setIsProcessing(true);
  try {
    const saleId = await completeSale(
      { paymentMethod: selectedPaymentMethod },
      cartItems
    );
    clearCart();
    setCompletedSaleId(saleId);
    setIsReceiptVisible(true);
  } catch (error) {
    setCheckoutError(error instanceof Error ? error.message : 'Checkout failed.');
  } finally {
    setIsProcessing(false);
  }
}
```

- Payment method selector above charge button: Cash · GCash · Maya (segmented control)
- `isProcessing` shows a loading spinner in the button while the transaction runs

> **Commit:**
```bash
git add .
git commit -m "feat(sale): implement checkout action with payment method and error handling"
```

---

### Step 6.4 — Build the receipt modal

- [ ] **Task:** Post-checkout receipt displayed in a dialog/modal overlay.

- Full-screen overlay or centered modal
- Shows: date/time, itemized list (name, qty, unit price, subtotal), total, payment method
- "Done" button: closes modal, ready for next sale
- "Print" button: calls `window.print()` — the modal content has a dedicated `@media print` stylesheet that shows only the receipt, hides sidebar and top bar

> **Commit:**
```bash
git add .
git commit -m "feat(sale): implement post-checkout receipt modal with browser print"
```

---

### Step 6.5 — End-to-end checkout verification

- [ ] **Task:** Test the full sale flow.

Checklist:
- [ ] Add 3 different products to cart with different quantities
- [ ] Increase and decrease quantities using the +/- controls
- [ ] Remove an item using the × button
- [ ] Select GCash as payment method
- [ ] Click Charge — receipt modal appears with correct totals
- [ ] Click Done — cart is cleared, ready for the next sale
- [ ] Open Inventory — stock quantities are correctly reduced

> **Commit:**
```bash
git add .
git commit -m "test(sale): verify end-to-end checkout flow in browser"
```

> **Phase 6 complete — milestone commit:**
```bash
git commit --allow-empty -m "milestone(phase-6): new sale and checkout fully implemented"
```

---

## Phase 7 — Dashboard

> **Goal:** Live business metrics and recent sales on the Dashboard page, all sourced from IndexedDB.

---

### Step 7.1 — Build the metric cards

- [ ] **Task:** 2×2 grid of summary metrics at the top of the Dashboard.

`src/app/dashboard/page.tsx` top section:
- Use `getTodaySalesSummary()` for today's revenue and transaction count
- Use `getLowStockProducts()` for the low stock count
- Use `getTopSellingProducts(30, 1)` for the top item name
- Render four `<MetricCard />` components in a responsive 2-column grid

> **Commit:**
```bash
git add .
git commit -m "feat(dashboard): implement metric card grid with live IndexedDB data"
```

---

### Step 7.2 — Build the low stock alert banner

- [ ] **Task:** Amber warning banner when any product stock is at or below its threshold.

- Query `getLowStockProducts()` on page load
- If `lowStockProducts.length > 0`: render amber banner listing all low-stock item names
- Banner links to `/inventory?tab=low-stock` for quick access

> **Commit:**
```bash
git add .
git commit -m "feat(dashboard): add low stock alert banner with link to inventory"
```

---

### Step 7.3 — Build the recent sales table

- [ ] **Task:** Last 10 transactions in a table below the metric cards.

- Calls `getRecentSales(10)` on page load
- Table columns: Date/time, items summary, amount, payment method
- Clicking a row: `router.push('/history/' + sale.id)`

> **Commit:**
```bash
git add .
git commit -m "feat(dashboard): implement recent sales table with clickable rows"
```

---

### Step 7.4 — Verify Dashboard end-to-end

- [ ] **Task:** Confirm all dashboard data is live and accurate.

Checklist:
- [ ] Complete a new sale → Today's Revenue and Transaction Count update immediately on Dashboard
- [ ] Set a product stock to 2 → Low Stock Count badge increments, banner appears
- [ ] Top item reflects the product with the most sales in the last 30 days
- [ ] Clicking a recent sale row navigates to the correct sale detail page

> **Commit:**
```bash
git add .
git commit -m "test(dashboard): verify all metrics reflect live IndexedDB data"
```

> **Phase 7 complete — milestone commit:**
```bash
git commit --allow-empty -m "milestone(phase-7): dashboard fully implemented and verified"
```

---

## Phase 8 — Sale History

> **Goal:** Browse, filter, and review all past sales.

---

### Step 8.1 — Build the Sale History list page

- [ ] **Task:** Filterable list of all sales.

`src/app/history/page.tsx`:
- Date filter: Today · This Week · This Month · Custom (HTML date inputs)
- Summary bar: total revenue for selected period
- Table of sales: total amount, item count, date/time, payment method
- Clicking a row: `router.push('/history/' + sale.id)`

> **Commit:**
```bash
git add .
git commit -m "feat(history): implement sale history list with date range filter"
```

---

### Step 8.2 — Build the Sale Detail page

- [ ] **Task:** Full itemized receipt view for a single sale.

`src/app/history/[id]/page.tsx`:
- Calls `getRecentSales()` and filters by `id`, plus `getSaleItems(id)` for line items
- Shows: date/time, payment method, itemized list (name, qty, unit price, subtotal), total
- "Print Receipt" button: `window.print()` with print stylesheet
- "← Back" link to `/history`

> **Commit:**
```bash
git add .
git commit -m "feat(history): implement sale detail page with itemized receipt view"
```

---

### Step 8.3 — Verify Sale History end-to-end

- [ ] **Task:** Confirm history correctly reflects all sales.

Checklist:
- [ ] All sales appear in the history list
- [ ] Date range filter shows correct results for Today, This Week, This Month
- [ ] Clicking a row shows the correct itemized sale detail
- [ ] Total revenue summary updates correctly based on selected date range

> **Commit:**
```bash
git add .
git commit -m "test(history): verify sale history list and detail pages"
```

> **Phase 8 complete — milestone commit:**
```bash
git commit --allow-empty -m "milestone(phase-8): sale history fully implemented and verified"
```

---

## Phase 9 — Supabase Cloud Sync

> **Goal:** All local data syncs silently to Supabase when internet is available.

---

### Step 9.1 — Set up the Supabase client

- [ ] **Task:** Initialize the Supabase client and create the matching tables in Supabase.

**`src/services/supabase.ts`**
```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

In the Supabase dashboard, create `products`, `sales`, and `sale_items` tables with columns matching the TypeScript interfaces in `src/database/db.ts`. Enable Row Level Security (RLS) — for MVP, allow all operations for authenticated users only.

> **Commit:**
```bash
git add .
git commit -m "feat(sync): add Supabase client initialization"
```

---

### Step 9.2 — Implement the sync service

- [ ] **Task:** Write the background sync function and register the online/offline event listener.

**`src/services/sync.ts`** — implement `syncPendingRecords()` and `registerSyncListener()` exactly as specified in PRD Section 6.2.

**`src/hooks/useSync.ts`**
```ts
'use client';
import { useEffect, useState } from 'react';
import { registerSyncListener, syncPendingRecords } from '@/services/sync';

/** Registers the sync listener on mount and triggers a sync on online events. */
export function useSync() {
  const [isSyncing, setIsSyncing]     = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    registerSyncListener();
    // Attempt a sync on initial page load if online
    if (navigator.onLine) {
      setIsSyncing(true);
      syncPendingRecords().then(() => {
        setLastSyncedAt(new Date());
        setIsSyncing(false);
      });
    }
  }, []);

  return { isSyncing, lastSyncedAt };
}
```

Wire `useSync()` into the root `layout.tsx` AppProvider so it runs on every page.

> **Commit:**
```bash
git add .
git commit -m "feat(sync): implement background Supabase sync with online/offline listener"
```

---

### Step 9.3 — Add sync status dot to the TopBar

- [ ] **Task:** Green = synced, orange = pending, animated pulse while syncing.

Pass `isSyncing` from `useSync()` via context and read it in `<TopBar />`. A green dot uses `bg-success`, orange uses `bg-warning`, and the pulsing animation uses Tailwind's `animate-pulse`.

> **Commit:**
```bash
git add .
git commit -m "feat(sync): add live sync status dot to TopBar"
```

---

### Step 9.4 — Verify sync end-to-end

- [ ] **Task:** Confirm IndexedDB records appear in Supabase within 5 seconds of reconnecting.

Checklist:
- [ ] Complete a sale offline (disable wifi) — data stays in IndexedDB, sync dot is orange
- [ ] Re-enable wifi — sync dot turns green within 5 seconds
- [ ] Open Supabase Table Editor — sale and sale_items rows are present
- [ ] No duplicate records on repeated syncs (upsert is idempotent)

> **Commit:**
```bash
git add .
git commit -m "test(sync): verify offline sale syncs to Supabase on reconnect"
```

> **Phase 9 complete — milestone commit:**
```bash
git commit --allow-empty -m "milestone(phase-9): Supabase sync fully implemented and verified"
```

---

## Phase 10 — AI Assistant

> **Goal:** A Gemini-powered chat interface that answers business questions with live shop data.

---

### Step 10.1 — Implement the Gemini API route

- [ ] **Task:** Create the secure server-side API route that calls Gemini.

`src/app/api/ai/chat/route.ts` — the route receives `{ userMessage, contextString }` in the request body, calls `askAI()`, and returns `{ reply }`. The `GEMINI_API_KEY` is only accessed here — never in client code.

**`src/services/gemini.ts`** — implement `buildContext()` (queries IndexedDB for today's sales, low stock, top items) and `askAI(userMessage, contextString)` using the Gemini Flash SDK. The client calls the API route; `askAI` is only called server-side from the route handler.

> **Commit:**
```bash
git add .
git commit -m "feat(ai): implement secure Gemini API route and context builder"
```

---

### Step 10.2 — Implement the useAI hook

- [ ] **Task:** Manage chat state and API calls in a reusable hook.

**`src/hooks/useAI.ts`**
```ts
'use client';
import { useState, useCallback } from 'react';
import { buildContext } from '@/services/gemini';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export function useAI() {
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sendMessage = useCallback(async (userMessage: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    const userEntry: ChatMessage = { role: 'user', content: userMessage, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userEntry]);

    try {
      const contextString = await buildContext();
      const response = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userMessage, contextString }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply, timestamp: new Date().toISOString() }]);
    } catch {
      setErrorMessage('Hindi makonekta sa AI. Subukan ulit.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { messages, isLoading, errorMessage, sendMessage };
}
```

> **Commit:**
```bash
git add .
git commit -m "feat(ai): implement useAI hook with message state and API fetch"
```

---

### Step 10.3 — Build the AI Assistant page

- [ ] **Task:** Full chat UI wired to the `useAI` hook.

`src/app/ai/page.tsx` must implement:
- Navy header: "AI Assistant" title + "Powered by Gemini Flash" subtitle
- Scrollable message list — auto-scroll to bottom on new message via `useRef` + `scrollIntoView`
- AI message bubble: `bg-[var(--ai-bubble-bg)]`, left-aligned, `rounded-lg rounded-bl-none`
- User message bubble: `bg-accent-navy text-white`, right-aligned, `rounded-lg rounded-br-none`
- Typing indicator (3 animated dots) while `isLoading` is true
- Error banner when `errorMessage` is set
- Quick-prompt chips row above input: "Kumusta benta?", "Low stock?", "Top items this week", "Suggest reorder"
- Text input + send button (accent color, arrow icon)

> **Commit:**
```bash
git add .
git commit -m "feat(ai): implement AI assistant chat page with bubbles and quick prompts"
```

---

### Step 10.4 — Add the opening AI greeting

- [ ] **Task:** Auto-send a greeting when the AI page first loads.

```tsx
// In AIAssistantPage component
useEffect(() => {
  if (messages.length === 0) {
    sendMessage(
      "Magandang araw! Please give me a short summary of today's sales and any low stock items."
    );
  }
}, []); // Run only on first mount
```

**Verify:** Opening the AI page shows a Filipino-language greeting with real today's data.

> **Commit:**
```bash
git add .
git commit -m "feat(ai): add auto-generated greeting on first AI page load"
```

---

### Step 10.5 — Verify AI assistant end-to-end

- [ ] **Task:** Test all AI scenarios.

Checklist:
- [ ] Greeting appears with today's actual data in Filipino
- [ ] "Kumusta ang benta ngayon?" returns today's sales in Filipino
- [ ] "What are the low stock items?" returns real items from IndexedDB in English
- [ ] Quick-prompt chips send the correct messages
- [ ] Sending while offline shows the error message — no crash
- [ ] Typing indicator appears while waiting for Gemini response
- [ ] `GEMINI_API_KEY` is NOT visible in browser network requests or client-side JS bundles

> **Commit:**
```bash
git add .
git commit -m "test(ai): verify AI assistant in Filipino and English, with offline handling"
```

> **Phase 10 complete — milestone commit:**
```bash
git commit --allow-empty -m "milestone(phase-10): AI assistant fully implemented and verified"
```

---

## Phase 11 — Barcode Scanner

> **Goal:** Scanning a barcode on the New Sale page finds the product instantly and adds it to the cart.

---

### Step 11.1 — Implement barcode scanning on the New Sale page

- [ ] **Task:** Wire `html5-qrcode` to the scan button.

- The scan button opens a `<dialog>` (HTML native modal) containing the `Html5QrcodeScanner` component
- On scan: close the dialog, call `getProductBySku(scannedValue)`
  - Found → `addItemToCart(product)`, show a brief success toast notification
  - Not found → show an error message inline: "No product matched barcode: {value}"
- Camera permission denied → show a message: "Camera access is required to scan barcodes. Please allow camera in your browser settings."
- `html5-qrcode` clears the camera stream when the dialog closes to avoid resource leaks

> **Commit:**
```bash
git add .
git commit -m "feat(scanner): implement barcode scanner with product lookup and cart add"
```

---

### Step 11.2 — Verify barcode scanning

- [ ] **Task:** Test with real SKUs in the browser.

Checklist:
- [ ] Browser camera permission prompt appears on first use
- [ ] Scanner opens in the modal dialog
- [ ] Scanning a known SKU adds the product to the cart and closes the modal
- [ ] Scanning an unknown barcode shows the "not found" inline error
- [ ] Denying camera permission shows a graceful message (no crash or blank screen)
- [ ] Camera stream is properly released when the modal closes

> **Commit:**
```bash
git add .
git commit -m "test(scanner): verify scan-to-cart flow with known and unknown barcodes"
```

> **Phase 11 complete — milestone commit:**
```bash
git commit --allow-empty -m "milestone(phase-11): barcode scanner implemented and verified"
```

---

## Phase 12 — PWA & Vercel Deployment

> **Goal:** The app is deployed on Vercel, installable as a PWA, and works fully offline.

---

### Step 12.1 — Configure PWA with next-pwa

- [ ] **Task:** Add service worker support for offline app shell caching.

Configure `next-pwa` in `next.config.ts`:

```ts
import withPWA from 'next-pwa';

const nextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})({
  // other Next.js config here
});

export default nextConfig;
```

Create `public/manifest.json`:

```json
{
  "name": "MotorParts POS",
  "short_name": "MtrParts",
  "description": "Motorcycle parts shop point of sale",
  "theme_color": "#1A1A2E",
  "background_color": "#FFFFFF",
  "display": "standalone",
  "start_url": "/dashboard",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Add `<link rel="manifest" href="/manifest.json">` to `layout.tsx` metadata. Add placeholder 192×192 and 512×512 PNG icons to `/public/`.

> **Commit:**
```bash
git add .
git commit -m "feat(pwa): configure next-pwa with manifest and service worker for offline support"
```

---

### Step 12.2 — Configure Vercel deployment

- [ ] **Task:** Connect the repository to Vercel and set environment variables.

1. Push the repository to GitHub.
2. In Vercel: Import project → select the GitHub repo → Framework: Next.js.
3. In Vercel **Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
4. Trigger a production deploy via `git push origin main`.

Add `vercel.json` to the project root:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

> **Commit:**
```bash
git add vercel.json
git commit -m "chore(deploy): add vercel.json and confirm Vercel project connected"
```

---

### Step 12.3 — Verify Vercel deployment end-to-end

- [ ] **Task:** Confirm the production deployment is fully functional.

Checklist:
- [ ] Production URL loads without errors in Chrome, Safari, and Edge
- [ ] All 5 pages navigate correctly from the sidebar
- [ ] A sale can be completed on the production URL
- [ ] AI chat responds correctly (confirms `GEMINI_API_KEY` is working server-side)
- [ ] The app can be installed as a PWA from the browser on desktop and tablet
- [ ] Browser DevTools Network tab confirms `GEMINI_API_KEY` is NOT in any client bundle or request

> **Commit:**
```bash
git add .
git commit -m "test(deploy): verify production Vercel deployment and PWA installation"
```

> **Phase 12 complete — milestone commit:**
```bash
git commit --allow-empty -m "milestone(phase-12): PWA configured and app deployed to Vercel"
```

---

## Phase 13 — Polish & QA

> **Goal:** Production-ready — visually consistent, accessible, performant, and crash-free across browsers.

---

### Step 13.1 — UI consistency audit

- [ ] **Task:** Review every page against the design system. Correct all failures before committing.

Checklist:
- [ ] Zero hardcoded hex values in any component file — all use CSS variable classes
- [ ] Zero hardcoded pixel numbers in JSX className strings — all use theme constants or Tailwind spacing
- [ ] All `<button>` elements have visible `hover:` and `focus-visible:` states
- [ ] All interactive elements have `min-h-[44px]` (WCAG AA minimum click target)
- [ ] Every page looks correct in light mode AND dark mode (test both)
- [ ] No text is clipped or truncated at 768px viewport width (minimum supported)

> **Commit:**
```bash
git add .
git commit -m "style(ui): resolve all design system inconsistencies found in audit"
```

---

### Step 13.2 — Accessibility audit

- [ ] **Task:** Verify WCAG AA compliance.

Checklist:
- [ ] All `<button>` and `<a>` elements are keyboard-navigable (Tab key)
- [ ] All interactive elements have a visible `focus-visible:` ring
- [ ] All icons and images have `aria-label` or `alt` attributes
- [ ] Text on colored backgrounds passes AA contrast ratio (4.5:1 minimum)
- [ ] The app does not rely on color alone to convey information (stock status has text AND a badge)
- [ ] Form inputs have associated `<label>` elements

> **Commit:**
```bash
git add .
git commit -m "a11y: add aria labels, focus rings, and verify contrast ratios"
```

---

### Step 13.3 — Performance audit

- [ ] **Task:** Profile and optimize page load and interaction performance.

Checklist:
- [ ] Run Lighthouse on the production URL — LCP < 2.5s, CLS < 0.1, FID < 100ms
- [ ] Product lists with 100+ items do not cause visible lag (use windowing or pagination if needed)
- [ ] Checkout transaction (IndexedDB write + stock deduction) completes in under 500ms
- [ ] No unnecessary re-renders visible in React DevTools profiler on the New Sale page during typing
- [ ] All images use `next/image` for automatic optimization

> **Commit:**
```bash
git add .
git commit -m "perf: optimize rendering, add pagination to large lists, use next/image"
```

---

### Step 13.4 — Final PRD acceptance criteria verification

- [ ] **Task:** Run every acceptance criterion from the PRD and confirm all pass.

Checklist:
- [ ] Sale completed offline — stock deducted, sale recorded in IndexedDB
- [ ] Internet restored — sale appears in Supabase within 5 seconds
- [ ] Low stock items shown in Dashboard banner and Inventory Low Stock tab
- [ ] AI answers "Kumusta ang benta ngayon?" with today's real data
- [ ] AI answers "Ano ang mababang stock?" with real low-stock items
- [ ] Light/dark mode switch works on all pages without visual glitches
- [ ] All features work offline: add product, complete sale, view history
- [ ] Barcode scan adds correct product to cart using browser camera
- [ ] App loads correctly in Chrome, Safari, and Edge
- [ ] All pages use design system tokens — no hardcoded values
- [ ] Deployed on Vercel with no build errors and no exposed API keys

> **Commit:**
```bash
git add .
git commit -m "test(qa): all PRD acceptance criteria verified and passing"
```

> **Phase 13 complete — milestone commit:**
```bash
git commit --allow-empty -m "milestone(phase-13): polish and QA complete — web app is production ready"
```

---

## Release Tag

```bash
git tag -a v1.0.0 -m "MotorParts POS Web App v1.0.0 — initial production release"
git push origin main --tags
```

---

## Summary

| Phase | Description | Steps | Commits |
|---|---|---|---|
| 1 | Project setup & foundation | 6 | 7 |
| 2 | Database layer (IndexedDB/Dexie) | 5 | 6 |
| 3 | Theme & design system | 4 | 5 |
| 4 | Layout shell & navigation | 3 | 4 |
| 5 | Inventory management | 5 | 6 |
| 6 | New sale & checkout | 5 | 6 |
| 7 | Dashboard | 4 | 5 |
| 8 | Sale history | 3 | 4 |
| 9 | Supabase cloud sync | 4 | 5 |
| 10 | AI assistant | 5 | 6 |
| 11 | Barcode scanner | 2 | 3 |
| 12 | PWA & Vercel deployment | 3 | 4 |
| 13 | Polish & QA | 4 | 5 |
| **Total** | | **53 steps** | **66 commits** |

---

## Key Technology Replacements (Mobile → Web)

| Mobile (Expo) | Web (Next.js) | Reason |
|---|---|---|
| `expo-sqlite` | Dexie.js (IndexedDB) | Browser-native offline storage |
| `expo-secure-store` | Server-only env vars | Gemini key secured via Next.js API routes |
| `@react-navigation` | Next.js App Router | File-system routing, no install required |
| `expo-barcode-scanner` | `html5-qrcode` | Browser camera API, no app install needed |
| `expo-print` | `window.print()` | Browser-native printing with CSS media query |
| `@react-native-community/netinfo` | `window` online/offline events | Built into all modern browsers |
| `useColorScheme` (RN) | `document.documentElement.classList` | Tailwind `dark` class strategy |
| `StyleSheet` / React Native styles | Tailwind CSS utility classes | Web-native styling |
| `expo-crypto` | `crypto.randomUUID()` | Built into all modern browsers (no package needed) |

---

*End of build plan — MotorParts POS Web App v1.0 · Reference: `MotorParts_POS_Web_PRD.md`*
