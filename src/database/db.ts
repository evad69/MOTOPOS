import Dexie, { Table } from "dexie";

export type ProductOptionKind = "category" | "unit";

export interface Product {
  id: string;
  owner_id: string;
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
  owner_id: string;
  sale_date: string;
  total_amount: number;
  discount_amount: number;
  payment_method: string;
  cash_received?: number;
  change_amount?: number;
  customer_name?: string;
  notes?: string;
  synced: number;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  owner_id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
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

export interface ProductOption {
  id: string;
  kind: ProductOptionKind;
  name: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_PRODUCT_CATEGORIES = [
  "Filters",
  "Electrical",
  "Brakes",
  "Drive",
  "Lubricants",
  "Engine",
  "Accessories",
] as const;

export const DEFAULT_PRODUCT_UNITS = ["pcs", "set", "liter", "pair"] as const;

/**
 * MotorPartsDatabase wraps IndexedDB via Dexie.
 * All offline-first data is stored here. Supabase syncs in background.
 */
class MotorPartsDatabase extends Dexie {
  products!: Table<Product, string>;
  sales!: Table<Sale, string>;
  sale_items!: Table<SaleItem, string>;
  suppliers!: Table<Supplier, string>;
  product_options!: Table<ProductOption, string>;

  constructor() {
    super("motorparts_pos");

    this.version(1).stores({
      products: "id, sku, name, category, brand, is_active, stock_qty, synced",
      sales: "id, sale_date, synced",
      sale_items: "id, sale_id, product_id",
      suppliers: "id, name",
    });

    this.version(2).stores({
      products: "id, sku, name, category, brand, is_active, stock_qty, synced",
      sales: "id, sale_date, synced",
      sale_items: "id, sale_id, product_id",
      suppliers: "id, name",
      product_options: "id, kind, name, is_active",
    });

    this.version(3).stores({
      products: "id, owner_id, sku, name, category, brand, is_active, stock_qty, synced",
      sales: "id, owner_id, sale_date, synced",
      sale_items: "id, owner_id, sale_id, product_id",
      suppliers: "id, name",
      product_options: "id, kind, name, is_active",
    });
  }
}

export const db = new MotorPartsDatabase();
