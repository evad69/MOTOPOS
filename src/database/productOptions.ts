import {
  db,
  DEFAULT_PRODUCT_CATEGORIES,
  DEFAULT_PRODUCT_UNITS,
  Product,
  ProductOptionKind,
} from "@/database/db";
import { sanitizeText } from "@/utils/validateInput";

function getDefaultOptionNames(kind: ProductOptionKind): readonly string[] {
  return kind === "category" ? DEFAULT_PRODUCT_CATEGORIES : DEFAULT_PRODUCT_UNITS;
}

function getOptionLabel(kind: ProductOptionKind): string {
  return kind === "category" ? "category" : "unit";
}

function getProductOptionValue(product: Product, kind: ProductOptionKind): string {
  return kind === "category" ? product.category : product.unit;
}

function createProductOptionId(kind: ProductOptionKind, name: string): string {
  const normalizedName = sanitizeText(name)
    .toLowerCase()
    .replace(/\s+/g, "-");

  return `${kind}:${normalizedName}`;
}

function sortOptionNames(optionNames: Iterable<string>): string[] {
  return Array.from(optionNames).sort((firstName, secondName) =>
    firstName.localeCompare(secondName),
  );
}

async function getActiveProducts(): Promise<Product[]> {
  return db.products.where("is_active").equals(1).toArray();
}

async function hasActiveProductsUsingOption(
  kind: ProductOptionKind,
  optionName: string,
): Promise<boolean> {
  const optionId = createProductOptionId(kind, optionName);
  const activeProducts = await getActiveProducts();

  return activeProducts.some((product) => {
    return createProductOptionId(kind, getProductOptionValue(product, kind)) === optionId;
  });
}

/** Returns the current category or unit names available to product forms. */
export async function getProductOptionNames(kind: ProductOptionKind): Promise<string[]> {
  const [activeProducts, optionRecords] = await Promise.all([
    getActiveProducts(),
    db.product_options.where("kind").equals(kind).toArray(),
  ]);
  const optionNamesById = new Map<string, string>();
  const optionIdsUsedByProducts = new Set<string>();

  for (const optionName of getDefaultOptionNames(kind)) {
    optionNamesById.set(createProductOptionId(kind, optionName), optionName);
  }

  for (const product of activeProducts) {
    const optionName = sanitizeText(getProductOptionValue(product, kind));
    if (!optionName) {
      continue;
    }

    const optionId = createProductOptionId(kind, optionName);
    optionIdsUsedByProducts.add(optionId);
    optionNamesById.set(optionId, optionName);
  }

  for (const optionRecord of optionRecords) {
    if (optionRecord.is_active === 1) {
      optionNamesById.set(optionRecord.id, optionRecord.name);
      continue;
    }

    if (!optionIdsUsedByProducts.has(optionRecord.id)) {
      optionNamesById.delete(optionRecord.id);
    }
  }

  return sortOptionNames(optionNamesById.values());
}

/** Adds or restores a category or unit option for future product forms. */
export async function upsertProductOption(
  kind: ProductOptionKind,
  optionName: string,
): Promise<string> {
  const sanitizedOptionName = sanitizeText(optionName);
  if (!sanitizedOptionName) {
    throw new Error(`Enter a ${getOptionLabel(kind)} name first.`);
  }

  const optionId = createProductOptionId(kind, sanitizedOptionName);
  const existingRecord = await db.product_options.get(optionId);
  const timestamp = new Date().toISOString();

  await db.product_options.put({
    id: optionId,
    kind,
    name: sanitizedOptionName,
    is_active: 1,
    created_at: existingRecord?.created_at ?? timestamp,
    updated_at: timestamp,
  });

  return sanitizedOptionName;
}

/** Hides a category or unit option when it is no longer assigned to active products. */
export async function hideProductOption(
  kind: ProductOptionKind,
  optionName: string,
): Promise<void> {
  const sanitizedOptionName = sanitizeText(optionName);
  if (!sanitizedOptionName) {
    throw new Error(`Choose a ${getOptionLabel(kind)} to delete.`);
  }

  if (await hasActiveProductsUsingOption(kind, sanitizedOptionName)) {
    throw new Error(
      `Change any products using this ${getOptionLabel(kind)} before deleting it.`,
    );
  }

  const optionId = createProductOptionId(kind, sanitizedOptionName);
  const existingRecord = await db.product_options.get(optionId);
  const timestamp = new Date().toISOString();

  await db.product_options.put({
    id: optionId,
    kind,
    name: existingRecord?.name ?? sanitizedOptionName,
    is_active: 0,
    created_at: existingRecord?.created_at ?? timestamp,
    updated_at: timestamp,
  });
}
