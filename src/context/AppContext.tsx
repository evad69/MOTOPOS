"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem, Product } from "@/database/db";

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

/** Provides global dark mode and cart state to all child components. */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    applyDarkModeClass(isDarkMode);
  }, [isDarkMode]);

  function toggleDarkMode() {
    setIsDarkMode((previousValue) => !previousValue);
  }

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

  const cartTotal = calculateCartTotal(cartItems);
  const contextValue: AppContextValue = {
    isDarkMode,
    toggleDarkMode,
    cartItems,
    addItemToCart,
    removeItemFromCart,
    updateCartItemQuantity,
    clearCart,
    cartTotal,
  };

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
