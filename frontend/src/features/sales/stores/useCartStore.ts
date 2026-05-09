// import { create } from "zustand";
// import { persist, createJSONStorage } from "zustand/middleware";
// import { ProductResponse } from "@/lib/api/generated/models/productResponse";

// /**
//  * @Scribe_Audit
//  * Architecture: Added manual discount state and decoupled receipt payload logic.
//  * Business Logic: Total calculation now follows: ((Subtotal) + Tax) - Discount.
//  * Payload: Prepped for thermal receipt printers (80mm/58mm) and Backend API.
//  */

// interface CartItem {
//   id: string;
//   name: string;
//   price: number;
//   qty: number;
//   category: string;
//   sku?: string;
// }

// interface CartState {
//   cart: CartItem[];
//   discount: number; // Manual figure (e.g., 200)
//   addToCart: (product: ProductResponse) => void;
//   updateQty: (id: string, delta: number) => void;
//   setDiscount: (value: number) => void;
//   clearCart: () => void;
//   getTotal: () => {
//     subtotal: number;
//     tax: number;
//     discount: number;
//     total: number;
//   };
//   getReceiptPayload: (businessId: string, cashierId: string) => object;
// }

// const triggerHaptic = (style: "light" | "medium" | "success" = "light") => {
//   if (typeof window !== "undefined" && window.navigator.vibrate) {
//     const patterns = { light: [10], medium: [20], success: [10, 30, 10] };
//     window.navigator.vibrate(patterns[style]);
//   }
// };

// export const useCartStore = create<CartState>()(
//   persist(
//     (set, get) => ({
//       cart: [],
//       discount: 0,

//       addToCart: (product) => {
//         triggerHaptic("light");
//         set((state) => {
//           const existing = state.cart.find((item) => item.id === product.id);
//           const newItem = {
//             id: product.id,
//             name: product.label,
//             price: product.selling_price,
//             category: product.category || "General",
//             sku: product.attributes?.sku || "",
//             qty: 1,
//           };

//           if (existing) {
//             return {
//               cart: state.cart.map((item) =>
//                 item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
//               ),
//             };
//           }
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
//                 : item,
//             )
//             .filter((item) => item.qty > 0),
//         }));
//       },

//       setDiscount: (value) => {
//         set({ discount: Math.max(0, value) });
//       },

//       clearCart: () => {
//         triggerHaptic("medium");
//         set({ cart: [], discount: 0 });
//       },

//       getTotal: () => {
//         const { cart, discount } = get();
//         const subtotal = cart.reduce(
//           (acc, item) => acc + item.price * item.qty,
//           0,
//         );
//         // Assuming 8% tax is calculated on subtotal before discount
//         const tax = subtotal * 0.08;
//         const total = Math.max(0, subtotal + tax - discount);

//         return { subtotal, tax, discount, total };
//       },

//       /**
//        * Prepares data for backend /thermal receipt generation
//        */
//       getReceiptPayload: (businessId, cashierId) => {
//         const { cart, getTotal } = get();
//         const { subtotal, tax, discount, total } = getTotal();

//         return {
//           meta: {
//             business_id: businessId,
//             cashier_id: cashierId,
//             timestamp: new Date().toISOString(),
//             currency: "KSH",
//           },
//           line_items: cart.map((item) => ({
//             id: item.id,
//             sku: item.sku,
//             name: item.name,
//             unit_price: item.price,
//             quantity: item.qty,
//             row_total: item.price * item.qty,
//           })),
//           financials: {
//             subtotal,
//             tax_amount: tax,
//             tax_rate: 0.08,
//             discount_applied: discount,
//             grand_total: total,
//           },
//         };
//       },
//     }),
//     {
//       name: "terminal-cart-storage",
//       storage: createJSONStorage(() => localStorage),
//     },
//   ),
// );

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ProductResponse } from "@/lib/api/generated/models";

/**
 * @Scribe_Audit
 * Architecture: Snapshot pattern. Stores minimal data needed for sale/receipt.
 * Business Logic: Discount is a flat amount deducted from the (Subtotal + Tax).
 * Resilience: Persistence enabled to prevent data loss on network jitters/refresh.
 * Haptics: Integrated vibration feedback for tactile POS systems.
 */

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  category: string;
  sku?: string;
}

interface CartState {
  cart: CartItem[];
  discount: number; // Manual flat amount (e.g., 500 Ksh)
  addToCart: (product: ProductResponse) => void;
  updateQty: (id: string, delta: number) => void;
  setDiscount: (value: number) => void;
  clearCart: () => void;
  getTotal: () => {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
  };
  getReceiptPayload: (businessId: string, cashierId: string) => object;
}

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
      cart: [],
      discount: 0,

      addToCart: (product) => {
        triggerHaptic("light");
        set((state) => {
          const existing = state.cart.find((item) => item.id === product.id);

          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
              ),
            };
          }

          // Create Snapshot Item from ProductResponse
          const newItem: CartItem = {
            id: product.id,
            name: product.label,
            price: product.selling_price,
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
                : item,
            )
            .filter((item) => item.qty > 0),
        }));
      },

      setDiscount: (value) => {
        // Ensure discount doesn't exceed subtotal (prevent negative totals)
        set({ discount: Math.max(0, value) });
      },

      clearCart: () => {
        triggerHaptic("medium");
        set({ cart: [], discount: 0 });
      },

      getTotal: () => {
        const { cart, discount } = get();
        const subtotal = cart.reduce(
          (acc, item) => acc + item.price * item.qty,
          0,
        );

        // 8% Tax calculation (standard for some service sectors)
        const tax = subtotal * 0.08;

        // Final math: Total = (Subtotal + Tax) - Discount
        const total = Math.max(0, subtotal + tax - discount);

        return { subtotal, tax, discount, total };
      },

      /**
       * Prepares a clean payload for Thermal Receipt printing
       * and Backend Transaction logging.
       */
      getReceiptPayload: (businessId, cashierId) => {
        const { cart, getTotal } = get();
        const { subtotal, tax, discount, total } = getTotal();

        return {
          meta: {
            business_id: businessId,
            cashier_id: cashierId,
            timestamp: new Date().toISOString(),
            currency: "KSH",
          },
          line_items: cart.map((item) => ({
            product_id: item.id,
            sku: item.sku,
            name: item.name,
            unit_price: item.price,
            quantity: item.qty,
            line_total: item.price * item.qty,
          })),
          financials: {
            subtotal,
            tax_amount: tax,
            tax_rate: 0.08,
            discount_applied: discount,
            grand_total: total,
          },
        };
      },
    }),
    {
      name: "terminal-cart-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);