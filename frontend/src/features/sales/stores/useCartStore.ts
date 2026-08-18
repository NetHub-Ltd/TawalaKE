// import { create } from "zustand";
// import { persist, createJSONStorage } from "zustand/middleware";
// import { ProductResponse } from "@/lib/api/generated/models";

// /**
//  * @Scribe_Audit
//  * Architecture: Snapshot state pattern isolating live checkout streams.
//  * Business Logic: Parametrizable tax rates with bounds-safe flat-rate discount calculations.
//  * Resilience: Local Storage persistence prevents storefront data reset on browser refresh or network updates.
//  * Haptics: Implemented localized tactile feedback patterns for physical hardware counters.
//  */

// // ==========================================
// // STORE PARAMETERS & GLOBALS
// // ==========================================
// export const CHECKOUT_CONFIG = {
//   /** Default Tax Rate (e.g., 0.16 for Kenyan Standard VAT, 0.08 for specialized sectors) */
//   DEFAULT_TAX_RATE: 0.0,
//   CURRENCY_CODE: "KES",
//   STORAGE_KEY: "terminal-cart-storage",
// };

// interface CartItem {
//   id: string;
//   name: string;
//   price: number;
//   qty: number;
//   category: string;
//   sku?: string;
// }

// interface FinancialSummary {
//   subtotal: number;
//   taxRate: number;
//   taxAmount: number;
//   discountApplied: number;
//   grandTotal: number;
// }

// interface CartState {
//   cart: CartItem[];
//   discount: number;       // Manual flat amount deduction (e.g., 200 KES)
//   taxRate: number;        // Dynamic parameterizable percentage rate (e.g., 0.16)
  
//   // Core Actions
//   addToCart: (product: ProductResponse) => void;
//   updateQty: (id: string, delta: number) => void;
//   setDiscount: (value: number) => void;
//   setTaxRate: (rate: number) => void;
//   clearCart: () => void;
  
//   // Output Computations
//   getFinancials: () => FinancialSummary;
//   getReceiptPayload: (businessId: string, cashierId: string, paymentMethod?: string) => object;
// }

// // Tactical vibration triggers for active retail counter interaction loops
// const triggerHaptic = (style: "light" | "medium" | "success" = "light") => {
//   if (typeof window !== "undefined" && window.navigator?.vibrate) {
//     const patterns = {
//       light: [10],
//       medium: [20],
//       success: [10, 30, 10],
//     };
//     window.navigator.vibrate(patterns[style]);
//   }
// };

// export const useCartStore = create<CartState>()(
//   persist(
//     (set, get) => ({
//       // --- INITIAL STATE ---
//       cart: [],
//       discount: 0,
//       taxRate: CHECKOUT_CONFIG.DEFAULT_TAX_RATE,

//       // --- MUTATOR ACTIONS ---
//       addToCart: (product) => {
//         triggerHaptic("light");
//         set((state) => {
//           const existing = state.cart.find((item) => item.id === product.id);

//           if (existing) {
//             return {
//               cart: state.cart.map((item) =>
//                 item.id === product.id ? { ...item, qty: item.qty + 1 } : item
//               ),
//             };
//           }

//           // Generate isolated point-in-time snapshot details
//           const newItem: CartItem = {
//             id: product.id,
//             name: product.label || "Unnamed Product",
//             price: product.selling_price || 0,
//             category: (product.attributes as any)?.category || "General",
//             sku: product.attributes?.sku || "",
//             qty: 1,
//           };

//           return { cart: [...state.cart, newItem] };
//         });
//       },

//       updateQty: (id, delta) => {
//         triggerHaptic("light");
//         set((state) => ({
//           cart: state.cart
//             .map((item) =>
//               item.id === id
//                 ? { ...item, qty: Math.max(0, item.qty + delta) }
//                 : item
//             )
//             .filter((item) => item.qty > 0),
//         }));
//       },

//       setDiscount: (value) => {
//         set((state) => {
//           const subtotal = state.cart.reduce((acc, item) => acc + item.price * item.qty, 0);
//           const taxAmount = subtotal * state.taxRate;
//           const maxAllowedDiscount = subtotal + taxAmount;
          
//           // Safety guard checking to prevent sub-zero transactions at checkout counters
//           return { 
//             discount: Math.min(Math.max(0, value), maxAllowedDiscount) 
//           };
//         });
//       },

//       setTaxRate: (rate) => {
//         // Enforce safe parameterizing limits (0% to 100%)
//         set({ taxRate: Math.max(0, Math.min(rate, 1)) });
//       },

//       clearCart: () => {
//         triggerHaptic("medium");
//         set({ cart: [], discount: 0, taxRate: CHECKOUT_CONFIG.DEFAULT_TAX_RATE });
//       },

//       // --- DERIVED FINANCIAL CALCULATIONS ---
//       getFinancials: () => {
//         const { cart, discount, taxRate } = get();
        
//         const subtotal = cart.reduce(
//           (acc, item) => acc + item.price * item.qty,
//           0
//         );

//         // Standard accounting hierarchy sequencing: Tax computed on raw subtotal values
//         const taxAmount = subtotal * taxRate;
//         const grandTotal = Math.max(0, (subtotal + taxAmount) - discount);

//         return {
//           subtotal,
//           taxRate,
//           taxAmount,
//           discountApplied: discount,
//           grandTotal,
//         };
//       },

//       /**
//        * Assembles a structured operational payload document optimized 
//        * for ERP persistence storage pipelines and thermal line printing.
//        */
//       getReceiptPayload: (businessId, cashierId, paymentMethod = "CASH") => {
//         const { cart, getFinancials } = get();
//         const financials = getFinancials();

//         return {
//           meta: {
//             business_id: businessId,
//             cashier_id: cashierId,
//             payment_method: paymentMethod.toUpperCase(),
//             timestamp: new Date().toISOString(),
//             currency: CHECKOUT_CONFIG.CURRENCY_CODE,
//           },
//           line_items: cart.map((item) => ({
//             product_id: item.id,
//             sku: item.sku || null,
//             name: item.name,
//             unit_price: item.price,
//             quantity: item.qty,
//             subtotal: item.price * item.qty,
//           })),
//           financials: {
//             subtotal: financials.subtotal,
//             tax_rate: financials.taxRate,
//             tax_amount: financials.taxAmount,
//             discount_applied: financials.discountApplied,
//             grand_total: financials.grandTotal,
//           },
//         };
//       },
//     }),
//     {
//       name: CHECKOUT_CONFIG.STORAGE_KEY,
//       storage: createJSONStorage(() => localStorage),
//     }
//   )
// );

// import { create } from "zustand";
// import { persist, createJSONStorage } from "zustand/middleware";
// import { ProductResponse } from "@/lib/api/generated/models";

// /**
//  * @Scribe_Audit
//  * Architecture: Snapshot state pattern isolating live checkout streams.
//  * Business Logic: Added explicit atomic `removeFromCart` mutation target to resolve browser invocation runtime crashes.
//  * Resilience: Local Storage persistence prevents storefront data reset on browser refresh or network updates.
//  * Haptics: Integrated tactile haptic trigger on item deletion for retail counter confirmation.
//  */

// // ==========================================
// // STORE PARAMETERS & GLOBALS
// // ==========================================
// export const CHECKOUT_CONFIG = {
//   /** Default Tax Rate (e.g., 0.16 for Kenyan Standard VAT, 0.08 for specialized sectors) */
//   DEFAULT_TAX_RATE: 0.0,
//   CURRENCY_CODE: "KES",
//   STORAGE_KEY: "terminal-cart-storage",
// };

// interface CartItem {
//   id: string;
//   name: string;
//   price: number;
//   qty: number;
//   category: string;
//   sku?: string;
// }

// interface FinancialSummary {
//   subtotal: number;
//   taxRate: number;
//   taxAmount: number;
//   discountApplied: number;
//   grandTotal: number;
// }

// interface CartState {
//   cart: CartItem[];
//   discount: number;       // Manual flat amount deduction (e.g., 200 KES)
//   taxRate: number;        // Dynamic parameterizable percentage rate (e.g., 0.16)
  
//   // Core Actions
//   addToCart: (product: ProductResponse) => void;
//   removeFromCart: (id: string) => void;
//   updateQty: (id: string, delta: number) => void;
//   setDiscount: (value: number) => void;
//   setTaxRate: (rate: number) => void;
//   clearCart: () => void;
  
//   // Output Computations
//   getFinancials: () => FinancialSummary;
//   getReceiptPayload: (businessId: string, cashierId: string, paymentMethod?: string) => object;
// }

// // Tactical vibration triggers for active retail counter interaction loops
// const triggerHaptic = (style: "light" | "medium" | "success" = "light") => {
//   if (typeof window !== "undefined" && window.navigator?.vibrate) {
//     const patterns = {
//       light: [10],
//       medium: [20],
//       success: [10, 30, 10],
//     };
//     window.navigator.vibrate(patterns[style]);
//   }
// };

// export const useCartStore = create<CartState>()(
//   persist(
//     (set, get) => ({
//       // --- INITIAL STATE ---
//       cart: [],
//       discount: 0,
//       taxRate: CHECKOUT_CONFIG.DEFAULT_TAX_RATE,

//       // --- MUTATOR ACTIONS ---
//       addToCart: (product) => {
//         triggerHaptic("light");
//         set((state) => {
//           const existing = state.cart.find((item) => item.id === product.id);

//           if (existing) {
//             return {
//               cart: state.cart.map((item) =>
//                 item.id === product.id ? { ...item, qty: item.qty + 1 } : item
//               ),
//             };
//           }

//           // Generate isolated point-in-time snapshot details
//           const newItem: CartItem = {
//             id: product.id,
//             name: product.label || "Unnamed Product",
//             price: product.selling_price || 0,
//             category: (product.attributes as any)?.category || "General",
//             sku: product.attributes?.sku || "",
//             qty: 1,
//           };

//           return { cart: [...state.cart, newItem] };
//         });
//       },

//       removeFromCart: (id) => {
//         triggerHaptic("medium");
//         set((state) => ({
//           cart: state.cart.filter((item) => item.id !== id),
//         }));
//       },

//       updateQty: (id, delta) => {
//         triggerHaptic("light");
//         set((state) => ({
//           cart: state.cart
//             .map((item) =>
//               item.id === id
//                 ? { ...item, qty: Math.max(0, item.qty + delta) }
//                 : item
//             )
//             .filter((item) => item.qty > 0),
//         }));
//       },

//       setDiscount: (value) => {
//         set((state) => {
//           const subtotal = state.cart.reduce((acc, item) => acc + item.price * item.qty, 0);
//           const taxAmount = subtotal * state.taxRate;
//           const maxAllowedDiscount = subtotal + taxAmount;
          
//           // Safety guard checking to prevent sub-zero transactions at checkout counters
//           return { 
//             discount: Math.min(Math.max(0, value), maxAllowedDiscount) 
//           };
//         });
//       },

//       setTaxRate: (rate) => {
//         // Enforce safe parameterizing limits (0% to 100%)
//         set({ taxRate: Math.max(0, Math.min(rate, 1)) });
//       },

//       clearCart: () => {
//         triggerHaptic("medium");
//         set({ cart: [], discount: 0, taxRate: CHECKOUT_CONFIG.DEFAULT_TAX_RATE });
//       },

//       // --- DERIVED FINANCIAL CALCULATIONS ---
//       getFinancials: () => {
//         const { cart, discount, taxRate } = get();
        
//         const subtotal = cart.reduce(
//           (acc, item) => acc + item.price * item.qty,
//           0
//         );

//         // Standard accounting hierarchy sequencing: Tax computed on raw subtotal values
//         const taxAmount = subtotal * taxRate;
//         const grandTotal = Math.max(0, (subtotal + taxAmount) - discount);

//         return {
//           subtotal,
//           taxRate,
//           taxAmount,
//           discountApplied: discount,
//           grandTotal,
//         };
//       },

//       /**
//        * Assembles a structured operational payload document optimized 
//        * for ERP persistence storage pipelines and thermal line printing.
//        */
//       getReceiptPayload: (businessId, cashierId, paymentMethod = "CASH") => {
//         const { cart, getFinancials } = get();
//         const financials = getFinancials();

//         return {
//           meta: {
//             business_id: businessId,
//             cashier_id: cashierId,
//             payment_method: paymentMethod.toUpperCase(),
//             timestamp: new Date().toISOString(),
//             currency: CHECKOUT_CONFIG.CURRENCY_CODE,
//           },
//           line_items: cart.map((item) => ({
//             product_id: item.id,
//             sku: item.sku || null,
//             name: item.name,
//             unit_price: item.price,
//             quantity: item.qty,
//             subtotal: item.price * item.qty,
//           })),
//           financials: {
//             subtotal: financials.subtotal,
//             tax_rate: financials.taxRate,
//             tax_amount: financials.taxAmount,
//             discount_applied: financials.discountApplied,
//             grand_total: financials.grandTotal,
//           },
//         };
//       },
//     }),
//     {
//       name: CHECKOUT_CONFIG.STORAGE_KEY,
//       storage: createJSONStorage(() => localStorage),
//     }
//   )
// );

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ProductResponse } from "@/lib/api/generated/models";

/**
 * @Scribe_Audit
 * Architecture: Tenant & User scoped isolation pattern with local-first sync indicators.
 * Security: Validates session composite keys (businessId + userId) on state rehydration and profile switches.
 * Integrity: Automatically purges cross-tenant state mismatch to prevent accidental checkout contamination.
 */

export const CHECKOUT_CONFIG = {
  DEFAULT_TAX_RATE: 0.0,
  CURRENCY_CODE: "KES",
  STORAGE_KEY: "terminal-cart-storage",
};

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  category: string;
  sku?: string;
}

export interface FinancialSummary {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountApplied: number;
  grandTotal: number;
}

export interface CartScope {
  businessId: string | null;
  userId: string | null;
  scopeHash: string | null;
}

export interface BackendSyncPayload {
  scope: CartScope;
  cart: CartItem[];
  discount: number;
  taxRate: number;
  updatedAt: string;
}

interface CartState {
  // Tenant Context & State Locks
  scope: CartScope;
  cart: CartItem[];
  discount: number;
  taxRate: number;
  
  // Local-First Sync Tracking Flags
  isDirty: boolean;
  lastSyncedAt: string | null;
  syncStatus: "idle" | "syncing" | "error" | "synced";

  // Scope & Validation Actions
  validateAndSetScope: (businessId: string, userId: string) => boolean;
  
  // Core Mutators
  addToCart: (product: ProductResponse) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  setDiscount: (value: number) => void;
  setTaxRate: (rate: number) => void;
  clearCart: () => void;

  // Remote Sync Handlers
  getSyncPayload: () => BackendSyncPayload;
  markSynced: (timestamp: string) => void;
  hydrateFromRemote: (payload: Partial<BackendSyncPayload>) => void;

  // Calculations
  getFinancials: () => FinancialSummary;
  getReceiptPayload: (cashierId: string, paymentMethod?: string) => object;
}

// Simple deterministic string hasher for scope verification
const generateScopeHash = (businessId: string, userId: string): string => {
  return `b_${businessId}::u_${userId}`;
};

const triggerHaptic = (style: "light" | "medium" | "success" = "light") => {
  if (typeof window !== "undefined" && window.navigator?.vibrate) {
    const patterns = { light: [10], medium: [20], success: [10, 30, 10] };
    window.navigator.vibrate(patterns[style]);
  }
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // --- INITIAL STATE ---
      scope: {
        businessId: null,
        userId: null,
        scopeHash: null,
      },
      cart: [],
      discount: 0,
      taxRate: CHECKOUT_CONFIG.DEFAULT_TAX_RATE,
      isDirty: false,
      lastSyncedAt: null,
      syncStatus: "idle",

      // --- SESSION & TENANT SCOPE GUARD ---
      validateAndSetScope: (businessId, userId) => {
        const targetHash = generateScopeHash(businessId, userId);
        const currentScope = get().scope;

        // Scope match verified - retain current local session
        if (currentScope.scopeHash === targetHash) {
          return true;
        }

        // Scope Mismatch Detected: Enforce zero leakage by clearing state and resetting scope
        set({
          scope: { businessId, userId, scopeHash: targetHash },
          cart: [],
          discount: 0,
          taxRate: CHECKOUT_CONFIG.DEFAULT_TAX_RATE,
          isDirty: false,
          syncStatus: "idle",
        });

        return false;
      },

      // --- CORE MUTATIONS ---
      addToCart: (product) => {
        triggerHaptic("light");
        set((state) => {
          const existing = state.cart.find((item) => item.id === product.id);
          const updatedCart = existing
            ? state.cart.map((item) =>
                item.id === product.id ? { ...item, qty: item.qty + 1 } : item
              )
            : [
                ...state.cart,
                {
                  id: product.id,
                  name: product.label || "Unnamed Product",
                  price: product.selling_price || 0,
                  category: (product.attributes as any)?.category || "General",
                  sku: product.attributes?.sku || "",
                  qty: 1,
                },
              ];

          return { cart: updatedCart, isDirty: true };
        });
      },

      removeFromCart: (id) => {
        triggerHaptic("medium");
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
          isDirty: true,
        }));
      },

      updateQty: (id, delta) => {
        triggerHaptic("light");
        set((state) => ({
          cart: state.cart
            .map((item) =>
              item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
            )
            .filter((item) => item.qty > 0),
          isDirty: true,
        }));
      },

      setDiscount: (value) => {
        set((state) => {
          const subtotal = state.cart.reduce((acc, item) => acc + item.price * item.qty, 0);
          const maxAllowed = subtotal + subtotal * state.taxRate;
          return {
            discount: Math.min(Math.max(0, value), maxAllowed),
            isDirty: true,
          };
        });
      },

      setTaxRate: (rate) => {
        set({ taxRate: Math.max(0, Math.min(rate, 1)), isDirty: true });
      },

      clearCart: () => {
        triggerHaptic("medium");
        set({
          cart: [],
          discount: 0,
          taxRate: CHECKOUT_CONFIG.DEFAULT_TAX_RATE,
          isDirty: true,
        });
      },

      // --- BACKEND SYNC INFRASTRUCTURE ---
      getSyncPayload: () => {
        const { scope, cart, discount, taxRate } = get();
        return {
          scope,
          cart,
          discount,
          taxRate,
          updatedAt: new Date().toISOString(),
        };
      },

      markSynced: (timestamp) => {
        set({
          isDirty: false,
          lastSyncedAt: timestamp,
          syncStatus: "synced",
        });
      },

      hydrateFromRemote: (payload) => {
        set((state) => ({
          cart: payload.cart ?? state.cart,
          discount: payload.discount ?? state.discount,
          taxRate: payload.taxRate ?? state.taxRate,
          isDirty: false,
          syncStatus: "synced",
          lastSyncedAt: payload.updatedAt || new Date().toISOString(),
        }));
      },

      // --- COMPUTED OUTPUTS ---
      getFinancials: () => {
        const { cart, discount, taxRate } = get();
        const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
        const taxAmount = subtotal * taxRate;
        const grandTotal = Math.max(0, subtotal + taxAmount - discount);

        return { subtotal, taxRate, taxAmount, discountApplied: discount, grandTotal };
      },

      getReceiptPayload: (cashierId, paymentMethod = "CASH") => {
        const { scope, cart, getFinancials } = get();
        const financials = getFinancials();

        return {
          meta: {
            business_id: scope.businessId,
            user_id: scope.userId,
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
      // Validate scope during client hydration cycle
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // If rehydrated payload lacks active hash structure, safely reset
        if (!state.scope?.scopeHash) {
          state.clearCart();
        }
      },
    }
  )
);