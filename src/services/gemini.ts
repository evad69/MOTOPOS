import type { SupabaseClient } from "@supabase/supabase-js";

interface SaleSummary {
  totalAmount: number;
  transactionCount: number;
}

interface LowStockProduct {
  name: string;
  stock_qty: number;
  low_stock_threshold: number;
}

interface RecentSale {
  id: string;
}

interface RecentSaleItem {
  product_name: string;
  quantity: number;
}

interface TopSellingItem {
  name: string;
  totalSold: number;
}

const defaultGeminiModelName = "gemini-2.5-flash";

/** Returns today's ISO date range for Supabase datetime filtering. */
function getTodayDateRange(): { startOfToday: string; endOfToday: string } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return {
    startOfToday: startOfToday.toISOString(),
    endOfToday: endOfToday.toISOString(),
  };
}

/** Returns the ISO timestamp for a date window ending now. */
function getDaysAgoIsoString(numberOfDays: number): string {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - numberOfDays);
  return cutoffDate.toISOString();
}

/** Returns today's sales total and transaction count from Supabase. */
async function getTodaySalesSummaryFromSupabase(
  supabaseClient: SupabaseClient,
): Promise<SaleSummary> {
  const { startOfToday, endOfToday } = getTodayDateRange();
  const { data, error } = await supabaseClient
    .from("sales")
    .select("id, total_amount")
    .gte("sale_date", startOfToday)
    .lt("sale_date", endOfToday);

  if (error) {
    throw error;
  }

  return {
    totalAmount: (data ?? []).reduce((sum, saleRecord) => sum + saleRecord.total_amount, 0),
    transactionCount: (data ?? []).length,
  };
}

/** Returns all active low-stock products from Supabase. */
async function getLowStockProductsFromSupabase(
  supabaseClient: SupabaseClient,
): Promise<LowStockProduct[]> {
  const { data, error } = await supabaseClient
    .from("products")
    .select("name, stock_qty, low_stock_threshold")
    .eq("is_active", 1);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .filter((product) => product.stock_qty <= product.low_stock_threshold)
    .sort((firstProduct, secondProduct) => firstProduct.stock_qty - secondProduct.stock_qty);
}

/** Returns the sale IDs created within the recent reporting window. */
async function getRecentSaleIdsFromSupabase(
  supabaseClient: SupabaseClient,
  numberOfDays: number,
): Promise<string[]> {
  const { data, error } = await supabaseClient
    .from("sales")
    .select("id")
    .gte("sale_date", getDaysAgoIsoString(numberOfDays));

  if (error) {
    throw error;
  }

  return (data as RecentSale[] | null)?.map((saleRecord) => saleRecord.id) ?? [];
}

/** Returns recent sale items for the provided sale IDs. */
async function getRecentSaleItemsFromSupabase(
  supabaseClient: SupabaseClient,
  saleIds: string[],
): Promise<RecentSaleItem[]> {
  if (!saleIds.length) {
    return [];
  }

  const { data, error } = await supabaseClient
    .from("sale_items")
    .select("product_name, quantity")
    .in("sale_id", saleIds);

  if (error) {
    throw error;
  }

  return (data as RecentSaleItem[] | null) ?? [];
}

/** Aggregates recent sale items into ranked top-selling products. */
function computeTopSellingItems(
  recentSaleItems: RecentSaleItem[],
  limit = 5,
): TopSellingItem[] {
  const itemTotals = new Map<string, number>();
  for (const recentSaleItem of recentSaleItems) {
    const currentQuantity = itemTotals.get(recentSaleItem.product_name) ?? 0;
    itemTotals.set(recentSaleItem.product_name, currentQuantity + recentSaleItem.quantity);
  }

  return [...itemTotals.entries()]
    .map(([name, totalSold]) => ({ name, totalSold }))
    .sort((firstItem, secondItem) => secondItem.totalSold - firstItem.totalSold)
    .slice(0, limit);
}

/** Returns the low-stock section text used in the AI context payload. */
function formatLowStockSection(lowStockProducts: LowStockProduct[]): string {
  if (!lowStockProducts.length) {
    return "- None";
  }

  return lowStockProducts
    .map((product) => {
      return `- ${product.name}: ${product.stock_qty} pcs left (threshold: ${product.low_stock_threshold})`;
    })
    .join("\n");
}

/** Returns the top-selling section text used in the AI context payload. */
function formatTopSellingSection(topSellingItems: TopSellingItem[]): string {
  if (!topSellingItems.length) {
    return "- No recent sales data";
  }

  return topSellingItems
    .map((topSellingItem, index) => {
      return `${index + 1}. ${topSellingItem.name} - ${topSellingItem.totalSold} pcs sold`;
    })
    .join("\n");
}

/** Returns a fallback shop-data summary when Supabase context queries fail. */
function buildUnavailableContext(): string {
  return "Current shop data is temporarily unavailable. Respond with general guidance only.";
}

/** Returns the structured shop-data context string used for each AI request. */
function buildContextString(
  saleSummary: SaleSummary,
  lowStockProducts: LowStockProduct[],
  topSellingItems: TopSellingItem[],
): string {
  return [
    `Today's sales: PHP ${saleSummary.totalAmount.toFixed(2)} across ${saleSummary.transactionCount} transactions.`,
    `Low stock items (${lowStockProducts.length}):\n${formatLowStockSection(lowStockProducts)}`,
    `Top selling items (last 30 days):\n${formatTopSellingSection(topSellingItems)}`,
  ].join("\n\n");
}

/** Returns the live shop-data context string from Supabase for the AI assistant. */
export async function buildContext(supabaseClient: SupabaseClient): Promise<string> {
  try {
    const [saleSummary, lowStockProducts, recentSaleIds] = await Promise.all([
      getTodaySalesSummaryFromSupabase(supabaseClient),
      getLowStockProductsFromSupabase(supabaseClient),
      getRecentSaleIdsFromSupabase(supabaseClient, 30),
    ]);
    const recentSaleItems = await getRecentSaleItemsFromSupabase(supabaseClient, recentSaleIds);
    const topSellingItems = computeTopSellingItems(recentSaleItems);
    return buildContextString(saleSummary, lowStockProducts, topSellingItems);
  } catch {
    return buildUnavailableContext();
  }
}

/** Returns the business-assistant system prompt with injected shop context. */
function buildSystemPrompt(contextString: string): string {
  return [
    "You are a helpful business assistant for a motorcycle parts shop in the Philippines.",
    "You help the owner track sales, manage inventory, and understand their business performance.",
    "Respond in the same language the user uses - Filipino (Tagalog) or English.",
    "Be concise, practical, and friendly. Use PHP for peso amounts.",
    "",
    "Current shop data:",
    contextString,
  ].join("\n");
}

/** Returns the configured Gemini Flash model for server-side content generation. */
async function createGenerativeModel(apiKey: string) {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const googleGenerativeAI = new GoogleGenerativeAI(apiKey);
  return googleGenerativeAI.getGenerativeModel({ model: defaultGeminiModelName });
}

/** Sends the user message and shop context to Gemini and returns the AI reply text. */
export async function askAI(
  userMessage: string,
  contextString: string,
  apiKey: string,
): Promise<string> {
  const generativeModel = await createGenerativeModel(apiKey);
  const prompt = `${buildSystemPrompt(contextString)}\n\nUser: ${userMessage}`;
  const result = await generativeModel.generateContent(prompt);
  return result.response.text();
}
