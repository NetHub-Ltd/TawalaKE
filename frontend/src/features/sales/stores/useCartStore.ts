import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ProductResponse } from "@/lib/api/generated/models";

/**
 * @Scribe_Audit
 * Architecture: Snapshot state pattern isolating live checkout streams.
 * Business Logic: Parametrizable tax rates with bounds-safe flat-rate discount calculations.
 * Resilience: Local Storage persistence prevents storefront data reset on browser refresh or network updates.
 * Haptics: Implemented localized tactile feedback patterns for physical hardware counters.
 */

// ==========================================
// STORE PARAMETERS & GLOBALS
// ==========================================
export const CHECKOUT_CONFIG = {
  /** Default Tax Rate (e.g., 0.16 for Kenyan Standard VAT, 0.08 for specialized sectors) */
  DEFAULT_TAX_RATE: 0.16,
  CURRENCY_CODE: "KES",
  STORAGE_KEY: "terminal-cart-storage",
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  category: string;
  sku?: string;
}

interface FinancialSummary {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountApplied: number;
  grandTotal: number;
}

interface CartState {
  cart: CartItem[];
  discount: number;       // Manual flat amount deduction (e.g., 200 KES)
  taxRate: number;        // Dynamic parameterizable percentage rate (e.g., 0.16)
  
  // Core Actions
  addToCart: (product: ProductResponse) => void;
  updateQty: (id: string, delta: number) => void;
  setDiscount: (value: number) => void;
  setTaxRate: (rate: number) => void;
  clearCart: () => void;
  
  // Output Computations
  getFinancials: () => FinancialSummary;
  getReceiptPayload: (businessId: string, cashierId: string, paymentMethod?: string) => object;
}

// Tactical vibration triggers for active retail counter interaction loops
const triggerHaptic = (style: "light" | "medium" | "success" = "light") => {
  if (typeof window !== "undefined" && window.navigator?.vibrate) {
    const patterns = {
      light: [10],
      medium: [20],
      success: [10, 30, 10],
    };
    window.navigator.vibrate(patterns[style]);
  }
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // --- INITIAL STATE ---
      cart: [],
      discount: 0,
      taxRate: CHECKOUT_CONFIG.DEFAULT_TAX_RATE,

      // --- MUTATOR ACTIONS ---
      addToCart: (product) => {
        triggerHaptic("light");
        set((state) => {
          const existing = state.cart.find((item) => item.id === product.id);

          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.id === product.id ? { ...item, qty: item.qty + 1 } : item
              ),
            };
          }

          // Generate isolated point-in-time snapshot details
          const newItem: CartItem = {
            id: product.id,
            name: product.label || "Unnamed Product",
            price: product.selling_price || 0,
            category: (product.attributes as any)?.category || "General",
            sku: product.attributes?.sku || "",
            qty: 1,
          };

          return { cart: [...state.cart, newItem] };
        });
      },

      updateQty: (id, delta) => {
        triggerHaptic("light");
        set((state) => ({
          cart: state.cart
            .map((item) =>
              item.id === id
                ? { ...item, qty: Math.max(0, item.qty + delta) }
                : item
            )
            .filter((item) => item.qty > 0),
        }));
      },

      setDiscount: (value) => {
        set((state) => {
          const subtotal = state.cart.reduce((acc, item) => acc + item.price * item.qty, 0);
          const taxAmount = subtotal * state.taxRate;
          const maxAllowedDiscount = subtotal + taxAmount;
          
          // Safety guard checking to prevent sub-zero transactions at checkout counters
          return { 
            discount: Math.min(Math.max(0, value), maxAllowedDiscount) 
          };
        });
      },

      setTaxRate: (rate) => {
        // Enforce safe parameterizing limits (0% to 100%)
        set({ taxRate: Math.max(0, Math.min(rate, 1)) });
      },

      clearCart: () => {
        triggerHaptic("medium");
        set({ cart: [], discount: 0, taxRate: CHECKOUT_CONFIG.DEFAULT_TAX_RATE });
      },

      // --- DERIVED FINANCIAL CALCULATIONS ---
      getFinancials: () => {
        const { cart, discount, taxRate } = get();
        
        const subtotal = cart.reduce(
          (acc, item) => acc + item.price * item.qty,
          0
        );

        // Standard accounting hierarchy sequencing: Tax computed on raw subtotal values
        const taxAmount = subtotal * taxRate;
        const grandTotal = Math.max(0, (subtotal + taxAmount) - discount);

        return {
          subtotal,
          taxRate,
          taxAmount,
          discountApplied: discount,
          grandTotal,
        };
      },

      /**
       * Assembles a structured operational payload document optimized 
       * for ERP persistence storage pipelines and thermal line printing.
       */
      getReceiptPayload: (businessId, cashierId, paymentMethod = "CASH") => {
        const { cart, getFinancials } = get();
        const financials = getFinancials();

        return {
          meta: {
            business_id: businessId,
            cashier_id: cashierId,
            payment_method: paymentMethod.toUpperCase(),
            timestamp: new Date().toISOString(),
            currency: CHECKOUT_CONFIG.CURRENCY_CODE,
          },
          line_items: cart.map((item) => ({
            product_id: item.id,
            sku: item.sku || null,
            name: item.name,
            unit_price: item.price,
            quantity: item.qty,
            subtotal: item.price * item.qty,
          })),
          financials: {
            subtotal: financials.subtotal,
            tax_rate: financials.taxRate,
            tax_amount: financials.taxAmount,
            discount_applied: financials.discountApplied,
            grand_total: financials.grandTotal,
          },
        };
      },
    }),
    {
      name: CHECKOUT_CONFIG.STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);