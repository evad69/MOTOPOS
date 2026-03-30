# MotorParts POS — Product Requirements Document (Web App)

> **Version:** 2.0 · **Date:** March 31, 2026 · **Status:** Ready for development
> **Platform:** Web App (Next.js + React) · **Deployment:** Vercel · **Target:** Senior Full Stack Web Developer (AI Agent)

---

## 0. Agent Directive

> You are a **Senior Full Stack Web Developer** with 10+ years of experience building production-grade web applications. You are meticulous, opinionated about code quality, and deeply experienced with Next.js, React, Supabase, Tailwind CSS, and AI API integrations. You write clean, maintainable, well-commented code. You think in systems: you design the database schema before writing UI, implement proper error boundaries, handle offline-first sync gracefully via IndexedDB, and never ship without input validation.

**Your responsibilities:**

- Read this entire PRD before writing a single line of code.
- Follow the tech stack, color system, and UI principles exactly as specified.
- Build features in the order listed in Section 7 (MVP first, then enhancements).
- Ask clarifying questions only when a decision would block implementation.
- Produce clean, modular, commented code organized by feature folder.
- Enforce offline-first architecture: local IndexedDB writes first, Supabase syncs in background.

---

## 1. Product Overview

| Field | Value |
|---|---|
| Product | MotorParts POS — a web-based point-of-sale and shop management app |
| Target user | Owner/staff of a motorcycle parts shop in the Philippines |
| Goal | Replace manual/paper-based sales tracking with a fast, offline-capable, AI-assisted POS accessible from any browser |
| Language | Filipino (Tagalog) and English — AI assistant must support both |
| Deployment | Vercel (production) with automatic preview deployments per branch |

### 1.1 Problem Statement

Small motorcycle parts shops in the Philippines typically manage sales manually or use basic spreadsheets. This results in:

- Inaccurate inventory counts leading to stockouts or over-ordering
- No visibility into sales trends or best-selling items
- Slow checkout process during peak hours
- No data backup — loss of a notebook means loss of all records
- No way to ask intelligent questions about shop performance

### 1.2 Solution

MotorParts POS is a web application that runs in any modern browser on desktop, tablet, or mobile. It stores data locally in the browser (IndexedDB via Dexie.js) and syncs to the cloud (Supabase) when internet is available. An AI assistant (Gemini Flash) reads the shop's live data to answer questions and surface insights in natural language. Because it is a web app, there is no install required — staff access it via a bookmarked URL.

---

## 2. Tech Stack

| Layer | Technology | Purpose | Notes |
|---|---|---|---|
| Framework | Next.js 14 (App Router) | SSR/SSG, routing, API routes | Use `app/` directory |
| Language | TypeScript | App logic and type safety | Strict mode on |
| Styling | Tailwind CSS | Utility-first styling | CSS variables for theming |
| Local DB | Dexie.js (IndexedDB wrapper) | Offline-first data storage | Always write here first |
| Cloud DB | Supabase (PostgreSQL) | Cloud backup, real-time sync, auth | Free tier sufficient |
| AI | Gemini Flash API | Natural language assistant, insights | `@google/generative-ai` SDK |
| State | React Context + useReducer | Global app state | No Redux needed at MVP |
| Icons | Lucide React | SVG icon library | Consistent icon set |
| Date formatting | date-fns | Date parsing and display | — |
| Barcode | `html5-qrcode` | Scan barcodes via device camera | Web-native camera API |
| Printing | `window.print()` + print CSS | Browser-native receipt printing | No native plugin needed |
| Deployment | Vercel | Hosting, edge functions, CI/CD | Auto-deploy on push to `main` |
| UUID | `crypto.randomUUID()` | Client-generated primary keys | Built into modern browsers |

### 2.1 Key Packages to Install

```bash
npx create-next-app@latest MotorPartsPOS --typescript --tailwind --app --src-dir
cd MotorPartsPOS
npm install dexie
npm install @supabase/supabase-js
npm install @google/generative-ai
npm install lucide-react
npm install date-fns
npm install html5-qrcode
```

---

## 3. UI / UX Principles

A clean app interface enhances usability, reduces cognitive load, and improves user retention by focusing on simplicity, visual hierarchy, and consistency. The agent must implement every principle listed below without exception.

### 3.1 Core Principles

- **Simplicity first** — remove every UI element that does not serve a direct user need
- **Visual hierarchy** — size, weight, and color must guide the user's eye to the most important action on each page
- **Consistency** — spacing, typography, border-radius, and component style must be identical across all pages
- **Whitespace** — generous padding and margins; never crowd elements together
- **Intuitive navigation** — a user with no training should complete a sale within 30 seconds
- **Feedback** — every click must produce immediate visual feedback (loading state, success, error)
- **Accessibility** — minimum click target 44×44px, sufficient color contrast (WCAG AA)
- **Responsive** — usable on desktop browsers and tablet browsers; minimum width 768px

### 3.2 Light Mode Color Palette

| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| `background-primary` | `#FFFFFF` | `--bg-primary` | Main page background |
| `background-secondary` | `#F5F5F5` | `--bg-secondary` | Off-white surfaces, cards |
| `text-primary` | `#121212` | `--text-primary` | All primary body text |
| `text-secondary` | `#666666` | `--text-secondary` | Labels, captions, hints |
| `accent` | `#1D9E75` | `--accent` | Buttons, links, active states |
| `accent-navy` | `#1A1A2E` | `--accent-navy` | Top bar, pay button, AI panel |
| `danger` | `#E24B4A` | `--danger` | Low stock, errors, delete |
| `warning` | `#EF9F27` | `--warning` | AI alerts, caution states |
| `success` | `#3B6D11` | `--success` | Completed sales, synced |
| `border` | `#E0E0E0` | `--border` | Card borders, dividers |
| `shadow` | `rgba(0,0,0,0.08)` | `--shadow` | Subtle card elevation |

### 3.3 Dark Mode Color Palette

> Do NOT use pure black (`#000000`) or pure white (`#FFFFFF`) in dark mode — use the values below to reduce eye strain and halation.

| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| `background-primary` | `#121212` | `--bg-primary` | Main page background |
| `background-secondary` | `#1F1F1F` | `--bg-secondary` | Cards, elevated surfaces |
| `background-tertiary` | `#1C1C1E` | `--bg-tertiary` | Secondary surfaces |
| `button-bg` | `#2A2A2A` | `--button-bg` | Default button background |
| `active-state` | `#3A3A3A` | `--active-state` | Hovered / active states |
| `text-primary` | `#E0E0E0` | `--text-primary` | Body text — NOT pure white |
| `text-secondary` | `#9E9E9E` | `--text-secondary` | Labels at ~60% opacity |
| `accent` | `#64B5F6` | `--accent` | Slightly brighter for visibility |
| `danger` | `#EF5350` | `--danger` | Errors, low stock |
| `border` | `#2C2C2C` | `--border` | Card borders, dividers |

All tokens are declared on `:root` and `.dark` in `src/styles/globals.css` via Tailwind CSS variables. Components reference CSS variables only — no hardcoded hex values in component files.

### 3.4 Typography

| Element | Size | Weight | Token |
|---|---|---|---|
| Page title | 20px | 600 semibold | `text-primary` |
| Section header | 16px | 600 semibold | `text-primary` |
| Body / list item | 14px | 400 regular | `text-primary` |
| Label / caption | 12px | 400 regular | `text-secondary` |
| Price / key number | 16px | 700 bold | `accent` |
| Button text | 15px | 600 semibold | white |
| AI chat message | 13px | 400 regular | `text-primary` |

### 3.5 Spacing & Layout Constants

```ts
// src/theme/spacing.ts
export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const RADIUS  = { sm: 6, md: 10, lg: 14, full: 9999 } as const;

export const LAYOUT = {
  sidebarWidth:   240,   // px — left sidebar nav width
  topBarHeight:   56,    // px — top header bar
  minClickTarget: 44,    // px — minimum button/link height (WCAG AA)
  maxContentWidth: 1280, // px — max inner page width
} as const;
```

### 3.6 Component Rules

- Cards: `bg-secondary`, `rounded-lg`, `p-4`, `border border-[--border]`, subtle shadow
- Buttons (primary): `bg-[--accent]`, full-width or min-width, `rounded-md`, `h-[52px]`
- Buttons (danger): `bg-[--danger]`, same sizing as primary
- Table rows: `p-3 px-4`, separated by `border-b border-[--border]`
- Input fields: `border border-[--border]`, `rounded-md`, `h-12`, `px-3`
- Stock badge — OK: `bg-[#E1F5EE]`, text `#085041`; Low: `bg-[#FCEBEB]`, text `#A32D2D`
- All interactive elements must have a hover and focus-visible visual state

---

## 4. Database Schema

The same schema is used in both Dexie/IndexedDB (local) and Supabase (cloud). **IndexedDB is the source of truth**; Supabase receives synced copies.

### 4.1 `products`

```ts
// Dexie table definition
interface Product {
  id: string;                  // Client-generated UUID
  sku: string;                 // Barcode or manual SKU (unique)
  name: string;
  brand?: string;              // Honda, NGK, Yamaha, etc.
  category: string;            // Filters, Electrical, Brakes, Drive, Lubricants, etc.
  unit: string;                // pcs, set, liter, pair, etc. (default: 'pcs')
  selling_price: number;       // Price in PHP
  cost_price?: number;         // Purchase cost in PHP
  stock_qty: number;           // default: 0
  low_stock_threshold: number; // Alert when at or below this (default: 5)
  image_url?: string;          // Optional product photo URL
  is_active: number;           // Soft delete: 0 = deleted, 1 = active (default: 1)
  created_at: string;          // ISO 8601 datetime
  updated_at: string;
}
```

**Supabase equivalent:** identical columns in a `products` PostgreSQL table, with `id TEXT PRIMARY KEY` and `sku TEXT UNIQUE NOT NULL`.

### 4.2 `sales`

```ts
interface Sale {
  id: string;
  sale_date: string;           // ISO 8601 datetime of transaction
  total_amount: number;        // Final total in PHP
  discount_amount: number;     // default: 0
  payment_method: string;      // 'cash' | 'gcash' | 'maya'
  customer_name?: string;      // Optional
  notes?: string;
  synced: number;              // 0 = pending sync to Supabase, 1 = synced
  created_at: string;
  updated_at: string;
}
```

### 4.3 `sale_items`

```ts
interface SaleItem {
  id: string;
  sale_id: string;             // FK → sales.id
  product_id: string;          // FK → products.id
  product_name: string;        // Snapshot of name at time of sale
  quantity: number;
  unit_price: number;          // Price at time of sale (snapshot)
  subtotal: number;            // quantity × unit_price
}
```

### 4.4 `suppliers` *(Phase 2)*

```ts
interface Supplier {
  id: string;
  name: string;
  contact?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

---

## 5. Page & Layout Specifications

The app uses a **persistent left sidebar layout** on desktop/tablet. All pages share:

```
TopBar (56px, full-width) ← sync status dot, theme toggle, shop name
Sidebar (240px, left) ← nav links: Dashboard · New Sale · Inventory · AI Assistant
Main Content Area (flex-grow, right of sidebar) ← page content
```

On tablet screens below 1024px, the sidebar collapses to an icon-only rail (48px wide). A hamburger menu opens it as a drawer overlay.

### 5.1 Dashboard Page (`/dashboard`)

- 2×2 metric card grid: Today's sales (₱), Transaction count, Low stock count, Top item name
- AI alert banner (amber): appears when any `stock_qty <= low_stock_threshold`
- Recent sales table: last 10 transactions — item summary, time, amount, payment method
- Clicking any sale row → navigates to Sale Detail page
- Sync status dot in top bar: green = synced, orange = pending

### 5.2 New Sale Page (`/sale/new`)

- Search bar: searches by product name, brand, and SKU
- Barcode scan button: opens browser camera via `html5-qrcode`, auto-adds matched product to cart
- Product table/grid: name, SKU, stock count, price, quick-add button
- Cart panel (right side on desktop, bottom drawer on tablet): quantity +/- controls, per-item subtotal, remove button
- Sticky footer/bar: total amount + large "Charge ₱X" button (accent-navy color)
- Payment method selector: Cash · GCash · Maya (segmented control above charge button)
- On successful charge:
  1. Deduct `stock_qty` in IndexedDB
  2. Insert row in `sales` and rows in `sale_items`
  3. Mark `synced = 0`
  4. Trigger background Supabase sync
  5. Show receipt modal with optional print action (`window.print()`)

### 5.3 Inventory Page (`/inventory`)

- Tab bar: **All Items · Low Stock · By Category**
- Search bar
- Product table: name, SKU, category, stock qty, color-coded badge (green = OK, red = Low)
- Clicking a row → Product Detail / Edit page
- "+ Add Product" button (top-right) → Add Product page
- Add/Edit Product form fields: name, brand, SKU, category, unit, selling price, cost price, stock qty, low stock threshold, image URL (optional)

### 5.4 AI Assistant Page (`/ai`)

- Chat interface styled like a messaging app, full-height panel
- AI messages: `#E1F5EE` background, left-aligned, `border-radius: RADIUS.lg` (bottom-left square)
- User messages: `accent-navy` background, white text, right-aligned (bottom-right square)
- On page load: AI sends a greeting with today's snapshot (sales total, transaction count, low stock count, top item)
- Text input bar with send button at the bottom
- Quick-prompt chips above input:
  - `Kumusta benta?`
  - `Low stock items?`
  - `Top items this week`
  - `Suggest reorder`
- Before every API call: query IndexedDB and inject current data as context (see Section 8.2)
- Loading indicator (typing dots animation) while awaiting Gemini response
- Support Filipino and English in the same conversation

### 5.5 Sale History Page (`/history`)

- Date range selector: Today · This Week · This Month · Custom (date picker)
- Table of all sales: total amount, item count, date/time, payment method
- Clicking a row → Sale Detail page: full itemized receipt view
- Summary bar at top: total revenue for selected period

### 5.6 Product Detail / Edit Page (`/inventory/[id]` and `/inventory/new`)

- Shared form for both Add and Edit modes
- Edit mode pre-populates all fields from IndexedDB
- Delete button (edit mode): confirmation dialog → soft-delete → redirect to `/inventory`

---

## 6. Offline-First Architecture

The app must function 100% without internet. Supabase is a background enhancement, not a dependency.

### 6.1 Write Flow

1. User completes an action (sale, stock edit, new product)
2. **Write to IndexedDB immediately** — UI updates at once, no waiting
3. Mark record as `synced = 0`
4. Background sync worker checks connectivity via `navigator.onLine` + `window` online/offline events
5. If online → push all `synced = 0` records to Supabase → mark `synced = 1`
6. If offline → queue stays; retry on next `online` event

### 6.2 Sync Implementation

```ts
// src/services/sync.ts
import { db } from '@/database/db';
import { supabase } from '@/services/supabase';

/** Listen for browser connectivity events and trigger sync immediately on reconnect. */
export function registerSyncListener() {
  window.addEventListener('online', syncPendingRecords);
}

/** Push all unsynced local records to Supabase. Safe to call at any time. */
export async function syncPendingRecords() {
  if (!navigator.onLine) return;

  const unsyncedSales = await db.sales.where('synced').equals(0).toArray();
  for (const sale of unsyncedSales) {
    await supabase.from('sales').upsert(sale, { onConflict: 'id' });
    await db.sales.update(sale.id, { synced: 1 });
  }

  const unsyncedProducts = await db.products.where('synced').equals(0).toArray();
  for (const product of unsyncedProducts) {
    await supabase.from('products').upsert(product, { onConflict: 'id' });
    await db.products.update(product.id, { synced: 1 });
  }
}
```

- Handle conflicts with **last-write-wins** on `updated_at` timestamp
- Never block the UI on sync — always show current IndexedDB data
- Show sync status dot in the Dashboard top bar

### 6.3 Progressive Web App (PWA)

Configure `next-pwa` so the app is installable and works fully offline:

- Service worker caches Next.js app shell and static assets
- The service worker does NOT cache API calls to Supabase or Gemini — those are network-only
- `manifest.json`: name "MotorParts POS", `theme_color: "#1A1A2E"`, `display: standalone`
- Users on tablet/desktop can install it as a PWA from the browser, giving a near-native experience

---

## 7. Feature Roadmap & Build Order

> Build Phase 1 completely before starting Phase 2.

### Phase 1 — Core MVP

| # | Feature | Priority | Pages |
|---|---|---|---|
| 1.1 | Dexie/IndexedDB setup — all tables, version migrations on first load | Critical | All |
| 1.2 | Product CRUD — add, edit, soft-delete, list | Critical | Inventory |
| 1.3 | New Sale flow — cart, checkout, stock deduction | Critical | New Sale |
| 1.4 | Sale history — list and detail/receipt view | Critical | Dashboard, History |
| 1.5 | Dashboard metrics — today's totals from IndexedDB | Critical | Dashboard |
| 1.6 | Low stock alerts — badge on Inventory, banner on Dashboard | Critical | Dashboard, Inventory |
| 1.7 | Sidebar navigation — 4 links | Critical | All |
| 1.8 | Light + dark mode theming using Section 3 tokens | Critical | All |

### Phase 2 — Cloud & AI

| # | Feature | Priority | Notes |
|---|---|---|---|
| 2.1 | Supabase auth — email/password login for shop owner | High | One user per shop |
| 2.2 | Background Supabase sync | High | See Section 6 |
| 2.3 | AI assistant — Gemini Flash chat page | High | See Section 5.4 |
| 2.4 | AI context builder — inject live IndexedDB data | High | Last 30d sales + stock |
| 2.5 | Barcode scanner — scan to add product to cart | Medium | `html5-qrcode` via browser camera |
| 2.6 | Sales reports — weekly/monthly charts | Medium | `recharts` or `chart.js` |
| 2.7 | Browser print receipt | Low | `window.print()` + print stylesheet |
| 2.8 | Supplier management | Low | Phase 2 schema |

---

## 8. AI Assistant Specification

### 8.1 Gemini Flash Setup

```ts
// src/services/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function askAI(userMessage: string, contextString: string): Promise<string> {
  const systemPrompt = buildSystemPrompt(contextString);
  const result = await model.generateContent(`${systemPrompt}\n\nUser: ${userMessage}`);
  return result.response.text();
}
```

> **Important:** The Gemini API key must be called from a **Next.js API Route** (`/api/ai/chat`) — never expose it to the browser client. The client sends the user message to the API route; the route builds the context, calls Gemini, and streams the response back.

### 8.2 Context Injection

Before every AI request, query IndexedDB and build a plain-text context string:

```ts
// src/services/gemini.ts
export async function buildContext(): Promise<string> {
  const today = new Date().toISOString().split('T')[0];

  const todaySales = await db.sales
    .where('sale_date').startsWith(today)
    .toArray();

  const todayTotal = todaySales.reduce((sum, s) => sum + s.total_amount, 0);

  const allProducts = await db.products.where('is_active').equals(1).toArray();
  const lowStock = allProducts.filter(p => p.stock_qty <= p.low_stock_threshold);

  const recentSaleItems = await db.sale_items.toArray(); // filter client-side for last 30d
  const topItems = computeTopItems(recentSaleItems, allProducts, 5);

  return `
Today's sales: ₱${todayTotal.toFixed(2)} across ${todaySales.length} transactions.

Low stock items (${lowStock.length}):
${lowStock.map(i => `- ${i.name}: ${i.stock_qty} pcs left (threshold: ${i.low_stock_threshold})`).join('\n')}

Top selling items (last 30 days):
${topItems.map((i, n) => `${n + 1}. ${i.name} — ${i.totalSold} pcs sold`).join('\n')}
  `.trim();
}
```

### 8.3 System Prompt Template

```
You are a helpful business assistant for a motorcycle parts shop in the Philippines.
You help the owner track sales, manage inventory, and understand their business performance.
Respond in the same language the user uses — Filipino (Tagalog) or English. Both may appear in the same conversation.
Be concise, practical, and friendly. Use ₱ for peso amounts.

Current shop data:
{context_string}
```

### 8.4 API Route Security

```ts
// src/app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/services/gemini';

export async function POST(request: NextRequest) {
  const { userMessage, contextString } = await request.json();
  if (!userMessage) return NextResponse.json({ error: 'Missing message' }, { status: 400 });

  const reply = await askAI(userMessage, contextString);
  return NextResponse.json({ reply });
}
```

---

## 9. Folder Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout: sidebar + topbar shell
│   ├── page.tsx                # Redirect to /dashboard
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard page
│   ├── sale/
│   │   └── new/
│   │       └── page.tsx        # New Sale page
│   ├── inventory/
│   │   ├── page.tsx            # Inventory list page
│   │   ├── new/
│   │   │   └── page.tsx        # Add Product page
│   │   └── [id]/
│   │       └── page.tsx        # Edit Product page
│   ├── history/
│   │   ├── page.tsx            # Sale History list page
│   │   └── [id]/
│   │       └── page.tsx        # Sale Detail / Receipt page
│   ├── ai/
│   │   └── page.tsx            # AI Assistant chat page
│   └── api/
│       └── ai/
│           └── chat/
│               └── route.ts    # Server-side Gemini API route
│
├── components/                 # Reusable UI components
│   ├── Button.tsx              # Primary, secondary, danger variants
│   ├── Card.tsx                # Standard card wrapper
│   ├── MetricCard.tsx          # Dashboard summary card
│   ├── StockBadge.tsx          # Green/red stock indicator pill
│   ├── CartItem.tsx            # Cart row with qty controls
│   ├── AIChatBubble.tsx        # AI and user message bubbles
│   ├── Sidebar.tsx             # Left navigation sidebar
│   ├── TopBar.tsx              # Top header bar
│   └── index.ts                # Barrel export
│
├── database/                   # Dexie/IndexedDB layer
│   ├── db.ts                   # Dexie database class + table definitions
│   ├── products.ts             # getAllProducts(), upsertProduct(), softDelete()
│   └── sales.ts                # insertSale(), getRecentSales(), completeSale()
│
├── services/                   # External integrations
│   ├── supabase.ts             # Supabase client + syncPendingRecords()
│   └── gemini.ts               # Gemini client + buildContext() + askAI()
│
├── context/
│   └── AppContext.tsx          # Global state: cart, theme, sync status
│
├── hooks/
│   ├── useSync.ts              # Online/offline listener + sync trigger
│   ├── useAI.ts                # Chat state + Gemini API call management
│   └── useTheme.ts             # Dark mode toggle and color access
│
├── theme/
│   ├── colors.ts               # CSS variable references + token map
│   ├── typography.ts           # Font size and weight constants
│   └── spacing.ts              # SPACING, RADIUS, LAYOUT constants
│
├── utils/
│   ├── generateId.ts           # crypto.randomUUID() wrapper
│   ├── formatCurrency.ts       # ₱ peso formatter
│   ├── formatDate.ts           # date-fns wrappers
│   └── validateInput.ts        # Product form validation + sanitizeText()
│
└── styles/
    └── globals.css             # Tailwind base + CSS variable declarations for light/dark
```

---

## 10. Vercel Deployment

### 10.1 Environment Variables

Set in the Vercel project dashboard under **Settings → Environment Variables**:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (safe to expose to browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe to expose to browser) |
| `GEMINI_API_KEY` | Gemini API key — **server-only**, never expose to browser |

### 10.2 Deployment Workflow

```
git push origin main
→ Vercel automatically builds and deploys to production
→ Every pull request branch gets an isolated preview URL
→ Zero-downtime deployments via Vercel edge network
```

### 10.3 `vercel.json`

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev"
}
```

---

## 11. Non-Functional Requirements

| Requirement | Target | Notes |
|---|---|---|
| Initial page load | < 2 seconds (LCP) | Next.js static generation + Vercel CDN |
| Checkout speed | < 3 clicks to complete a sale | Product search → cart → charge |
| Offline capability | 100% core features work offline | AI requires internet |
| Sync latency | < 5 seconds after connectivity restored | Background sync on `online` event |
| AI response time | < 4 seconds | Gemini Flash via server API route |
| Browser support | Chrome 90+, Safari 15+, Edge 90+, Firefox 90+ | Modern browsers only |
| Responsive layout | Works on 768px+ width (tablet landscape and desktop) | |
| Data safety | IndexedDB never deleted without explicit user action | |
| Accessibility | WCAG AA contrast on all text; min click target 44×44px | |
| Security | GEMINI_API_KEY never exposed to browser; all AI calls server-side | |

---

## 12. Acceptance Criteria

The build is complete when all of the following pass:

- [ ] A sale can be completed offline — stock is deducted and the sale is recorded in IndexedDB
- [ ] When internet is restored, the sale appears in Supabase within 5 seconds
- [ ] Low stock items appear in the Dashboard alert banner and the Inventory "Low Stock" tab
- [ ] The AI assistant answers *"Kumusta ang benta ngayon?"* with today's actual sales data
- [ ] The AI assistant answers *"Ano ang mababang stock?"* and lists real items from IndexedDB
- [ ] Switching between light and dark mode works on all pages without visual glitches
- [ ] Adding a new product, completing a sale, and viewing history all work without internet
- [ ] Barcode scan adds the correct product to the cart using the browser camera
- [ ] The app loads and runs correctly in Chrome, Safari, and Edge
- [ ] All pages follow the color tokens and spacing constants from Section 3
- [ ] Deployed on Vercel with no build errors and no exposed API keys

---

## 13. Glossary

| Term | Definition |
|---|---|
| POS | Point of Sale — the system used to process customer transactions |
| SKU | Stock Keeping Unit — a unique code identifying a product |
| IndexedDB | A browser-native database API for storing structured data locally on the device |
| Dexie.js | A developer-friendly TypeScript wrapper around the browser IndexedDB API |
| Supabase | An open-source Firebase alternative — provides PostgreSQL, auth, and real-time sync |
| Gemini Flash | Google's fast, cost-efficient large language model used for the AI assistant |
| Next.js | A React framework that provides server-side rendering, routing, and API routes |
| Vercel | A cloud platform for deploying Next.js apps with automatic CI/CD |
| App Router | Next.js 14's file-system routing system using the `app/` directory |
| Offline-first | Architecture where the app works fully without internet; cloud sync is additive |
| PWA | Progressive Web App — a web app installable on devices, with offline support via service workers |
| UUID | Universally Unique Identifier — used as primary keys, generated via `crypto.randomUUID()` |
| API Route | A server-side function in Next.js (`app/api/`) that runs securely on Vercel's servers |

---

*End of document — MotorParts POS Web App PRD v2.0 · Confidential*
