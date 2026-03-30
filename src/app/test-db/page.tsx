"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getAllProducts,
  insertProduct,
  softDeleteProduct,
} from "@/database/products";

interface SmokeTestOutcome {
  message: string;
  insertedProductId?: string;
}

/** Creates the product payload used by the temporary database smoke test. */
function createSmokeTestProduct() {
  return {
    sku: `SMOKE-${Date.now()}`,
    name: "Smoke Test Filter",
    brand: "Test Brand",
    category: "Filters",
    unit: "pcs",
    selling_price: 99,
    cost_price: 50,
    stock_qty: 5,
    low_stock_threshold: 2,
    image_url: "",
    is_active: 1,
  };
}

/** Runs the temporary browser smoke test against the product database layer. */
async function runSmokeTest(): Promise<SmokeTestOutcome> {
  const insertedProductId = await insertProduct(createSmokeTestProduct());
  const allProducts = await getAllProducts();
  const matchingProducts = allProducts.filter((product) => {
    return product.id === insertedProductId;
  });

  await softDeleteProduct(insertedProductId);

  if (matchingProducts.length !== 1) {
    throw new Error("Smoke test failed: expected 1 matching product.");
  }

  return {
    message: "Smoke test passed: 1 product found — Smoke Test Filter",
    insertedProductId,
  };
}

/** Executes the temporary smoke test and updates the page state with the outcome. */
async function executeSmokeTest(
  setOutputMessage: (message: string) => void,
  setIsRunning: (isRunning: boolean) => void,
): Promise<void> {
  setIsRunning(true);
  setOutputMessage("Running database smoke test...");

  try {
    const outcome = await runSmokeTest();
    setOutputMessage(outcome.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Smoke test failed.";
    setOutputMessage(message);
  } finally {
    setIsRunning(false);
  }
}

/** Renders the temporary database smoke test page used in Phase 2 verification. */
export default function TestDatabasePage() {
  const searchParams = useSearchParams();
  const shouldAutoRun = searchParams.get("autorun") === "1";
  const [outputMessage, setOutputMessage] = useState("Ready to run DB test.");
  const [isRunning, setIsRunning] = useState(false);
  const [hasAutoRunStarted, setHasAutoRunStarted] = useState(false);

  useEffect(() => {
    if (!shouldAutoRun || hasAutoRunStarted) {
      return;
    }

    setHasAutoRunStarted(true);
    void executeSmokeTest(setOutputMessage, setIsRunning);
  }, [hasAutoRunStarted, shouldAutoRun]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <section className="w-full max-w-xl rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Database Smoke Test</h1>
        <p className="mt-2 text-sm text-slate-600">
          This temporary page verifies product insert, query, and soft-delete.
        </p>
        <button
          className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          disabled={isRunning}
          onClick={() => void executeSmokeTest(setOutputMessage, setIsRunning)}
          type="button"
        >
          {isRunning ? "Running..." : "Run DB Test"}
        </button>
        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          {outputMessage}
        </div>
      </section>
    </main>
  );
}
