"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem, Product } from "@/database/db";
import { useSync } from "@/hooks/useSync";

interface AppContextValue {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  cartItems: CartItem[];
  addItemToCart: (product: Product) => void;
  removeItemFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, newQuantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
}

interface AppProviderProps {
  children: React.ReactNode;
}

const AppContext = createContext<AppContextValue | null>(null);

/** Creates a cart item from a product record. */
function createCartItem(product: Product): CartItem {
  return {
    productId: product.id,
    productName: product.name,
    unitPrice: product.selling_price,
    quantity: 1,
  };
}

/** Applies the current dark mode class to the root HTML element. */
function applyDarkModeClass(isDarkMode: boolean): void {
  document.documentElement.classList.toggle("dark", isDarkMode);
}

/** Adds a product to the cart or increments it when already present. */
function addProductToCart(previousItems: CartItem[], product: Product): CartItem[] {
  const existingItem = previousItems.find((item) => item.productId === product.id);
  if (!existingItem) {
    return [...previousItems, createCartItem(product)];
  }

  return previousItems.map((item) => {
    if (item.productId !== product.id) {
      return item;
    }

    return { ...item, quantity: item.quantity + 1 };
  });
}

/** Replaces a cart item's quantity or removes it when the quantity is zero. */
function replaceCartItemQuantity(
  previousItems: CartItem[],
  productId: string,
  newQuantity: number,
): CartItem[] {
  if (newQuantity <= 0) {
    return previousItems.filter((item) => item.productId !== productId);
  }

  return previousItems.map((item) => {
    if (item.productId !== productId) {
      return item;
    }

    return { ...item, quantity: newQuantity };
  });
}

/** Calculates the current cart total from all cart items. */
function calculateCartTotal(cartItems: CartItem[]): number {
  return cartItems.reduce((sum, item) => {
    return sum + item.unitPrice * item.quantity;
  }, 0);
}

/** Returns dark mode state and keeps the root HTML class in sync. */
function useDarkModeState() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    applyDarkModeClass(isDarkMode);
  }, [isDarkMode]);

  function toggleDarkMode() {
    setIsDarkMode((previousValue) => !previousValue);
  }

  return { isDarkMode, toggleDarkMode };
}

/** Returns cart data and cart actions for the global application state. */
function useCartState() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  function addItemToCart(product: Product) {
    setCartItems((previousItems) => addProductToCart(previousItems, product));
  }

  function removeItemFromCart(productId: string) {
    setCartItems((previousItems) => {
      return previousItems.filter((item) => item.productId !== productId);
    });
  }

  function updateCartItemQuantity(productId: string, newQuantity: number) {
    setCartItems((previousItems) => {
      return replaceCartItemQuantity(previousItems, productId, newQuantity);
    });
  }

  function clearCart() {
    setCartItems([]);
  }

  return {
    cartItems,
    addItemToCart,
    removeItemFromCart,
    updateCartItemQuantity,
    clearCart,
    cartTotal: calculateCartTotal(cartItems),
  };
}

/** Creates the value passed to the shared application context provider. */
function createContextValue(
  isDarkMode: boolean,
  toggleDarkMode: () => void,
  cartState: ReturnType<typeof useCartState>,
  syncState: ReturnType<typeof useSync>,
): AppContextValue {
  return {
    isDarkMode,
    toggleDarkMode,
    ...cartState,
    ...syncState,
  };
}

/** Provides global dark mode, cart state, and sync state to all child components. */
export function AppProvider({ children }: AppProviderProps) {
  const { isDarkMode, toggleDarkMode } = useDarkModeState();
  const cartState = useCartState();
  const syncState = useSync();
  const contextValue = createContextValue(isDarkMode, toggleDarkMode, cartState, syncState);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

/** Returns theme and cart state. Must be used inside AppProvider. */
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }

  return context;
}
