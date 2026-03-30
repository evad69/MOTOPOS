import Dexie, { Table } from "dexie";

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
    super("motorparts_pos");

    this.version(1).stores({
      products: "id, sku, name, category, brand, is_active, stock_qty, synced",
      sales: "id, sale_date, synced",
      sale_items: "id, sale_id, product_id",
      suppliers: "id, name",
    });
  }
}

export const db = new MotorPartsDatabase();
