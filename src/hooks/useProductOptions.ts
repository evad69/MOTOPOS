"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_PRODUCT_CATEGORIES,
  DEFAULT_PRODUCT_UNITS,
  ProductOptionKind,
} from "@/database/db";
import {
  getProductOptionNames,
  hideProductOption,
  upsertProductOption,
} from "@/database/productOptions";

interface UseProductOptionsValue {
  categoryOptions: string[];
  unitOptions: string[];
  isLoading: boolean;
  errorMessage: string | null;
  addOption: (kind: ProductOptionKind, optionName: string) => Promise<string>;
  deleteOption: (kind: ProductOptionKind, optionName: string) => Promise<void>;
}

/** Loads, mutates, and reloads product category and unit options for forms. */
export function useProductOptions(): UseProductOptionsValue {
  const [categoryOptions, setCategoryOptions] = useState<string[]>([
    ...DEFAULT_PRODUCT_CATEGORIES,
  ]);
  const [unitOptions, setUnitOptions] = useState<string[]>([...DEFAULT_PRODUCT_UNITS]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadOptions(): Promise<{ nextCategoryOptions: string[]; nextUnitOptions: string[] }> {
    const [nextCategoryOptions, nextUnitOptions] = await Promise.all([
      getProductOptionNames("category"),
      getProductOptionNames("unit"),
    ]);

    setCategoryOptions(nextCategoryOptions);
    setUnitOptions(nextUnitOptions);

    return { nextCategoryOptions, nextUnitOptions };
  }

  useEffect(() => {
    let isCancelled = false;

    async function initializeOptions() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const { nextCategoryOptions, nextUnitOptions } = await Promise.all([
          getProductOptionNames("category"),
          getProductOptionNames("unit"),
        ]).then(([loadedCategoryOptions, loadedUnitOptions]) => ({
          nextCategoryOptions: loadedCategoryOptions,
          nextUnitOptions: loadedUnitOptions,
        }));

        if (!isCancelled) {
          setCategoryOptions(nextCategoryOptions);
          setUnitOptions(nextUnitOptions);
        }
      } catch {
        if (!isCancelled) {
          setErrorMessage("Unable to load product categories and units right now.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void initializeOptions();
    return () => {
      isCancelled = true;
    };
  }, []);

  async function addOption(kind: ProductOptionKind, optionName: string): Promise<string> {
    setErrorMessage(null);
    const savedOptionName = await upsertProductOption(kind, optionName);
    await loadOptions();

    return savedOptionName;
  }

  async function deleteOption(kind: ProductOptionKind, optionName: string): Promise<void> {
    setErrorMessage(null);
    await hideProductOption(kind, optionName);
    await loadOptions();
  }

  return {
    categoryOptions,
    unitOptions,
    isLoading,
    errorMessage,
    addOption,
    deleteOption,
  };
}
