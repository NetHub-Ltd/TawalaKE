// import { create } from "zustand";
// import { persist } from "zustand/middleware";

// interface CartItem {
//   id: string;
//   name: string;
//   price: number;
//   qty: number;
// }

// interface CartState {
//   cart: CartItem[];
//   addToCart: (product: unknown) => void;
//   updateQty: (id: string, delta: number) => void;
//   clearCart: () => void;
//   // Computed values
//   getSubtotal: () => number;
//   getTax: () => number;
//   getTotal: () => number;
// }

// export const useCartStore = create<CartState>()(
//   persist(
//     (set, get) => ({
//       cart: [],

//       addToCart: (product) =>
//         set((state) => {
//           const existing = state.cart.find((item) => item.id === product.id);
//           if (existing) {
//             return {
//               cart: state.cart.map((item) =>
//                 item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
//               ),
//             };
//           }
//           return { cart: [...state.cart, { ...product, qty: 1 }] };
//         }),

//       updateQty: (id, delta) =>
//         set((state) => ({
//           cart: state.cart
//             .map((item) =>
//               item.id === id
//                 ? { ...item, qty: Math.max(0, item.qty + delta) }
//                 : item,
//             )
//             .filter((item) => item.qty > 0),
//         })),

//       clearCart: () => set({ cart: [] }),

//       getSubtotal: () =>
//         get().cart.reduce((acc, item) => acc + item.price * item.qty, 0),

//       getTax: () => get().getSubtotal() * 0.055, // 5.5% Tax rate from sketch [cite: 78, 101]

//       getTotal: () => get().getSubtotal() + get().getTax(),
//     }),
//     {
//       name: "omni-pos-cart", // Unique name for localStorage
//     },
//   ),
// );

// import { create } from "zustand";
// import { persist } from "zustand/middleware";

// interface CartItem {
//   id: string;
//   name: string;
//   price: number;
//   qty: number;
// }

// interface CartState {
//   cart: CartItem[];
//   isSyncing: boolean; // Tracks API state
//   addToCart: (product: unknown) => void;
//   updateQty: (id: string, delta: number) => void;
//   clearCart: () => void;
//   // Backend Integration
//   createSale: () => Promise<unknown>;
//   // Computed values
//   getSubtotal: () => number;
//   getTax: () => number;
//   getTotal: () => number;
// }

// export const useCartStore = create<CartState>()(
//   persist(
//     (set, get) => ({
//       cart: [],
//       isSyncing: false,

//       addToCart: (product) =>
//         set((state) => {
//           const existing = state.cart.find((item) => item.id === product.id);
//           if (existing) {
//             return {
//               cart: state.cart.map((item) =>
//                 item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
//               ),
//             };
//           }
//           return { cart: [...state.cart, { ...product, qty: 1 }] };
//         }),

//       updateQty: (id, delta) =>
//         set((state) => ({
//           cart: state.cart
//             .map((item) =>
//               item.id === id
//                 ? { ...item, qty: Math.max(0, item.qty + delta) }
//                 : item,
//             )
//             .filter((item) => item.qty > 0),
//         })),

//       clearCart: () => set({ cart: [] }),

//       /**
//        * Pushes current cart to the backend and returns the created sale object
//        */
//       createSale: async () => {
//         const { cart, getTotal, getSubtotal } = get();

//         if (cart.length === 0) throw new Error("Cannot sync an empty cart");

//         set({ isSyncing: true });

//         try {
//           const response = await fetch(
//             "http://localhost:8000/api/v1/sales/create-sale",
//             {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({
//                 items: cart,
//                 subtotal: getSubtotal(),
//                 total: getTotal(),
//                 status: "PENDING", // Initial status before payment
//                 created_at: new Date().toISOString(),
//               }),
//             },
//           );

//           if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.message || "Failed to create sale");
//           }

//           const saleData = await response.json();
//           return saleData; // Contains the backend-generated order ID
//         } finally {
//           set({ isSyncing: false });
//         }
//       },

//       getSubtotal: () =>
//         get().cart.reduce((acc, item) => acc + item.price * item.qty, 0),

//       getTax: () => get().getSubtotal() * 0.055,

//       getTotal: () => get().getSubtotal() + get().getTax(),
//     }),
//     {
//       name: "omni-pos-cart",
//     },
//   ),
// );

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface CartState {
  cart: CartItem[];
  isSyncing: boolean;
  addToCart: (product: unknown) => void;
  updateQty: (id: string, delta: number) => void;
  clearCart: () => void;
  createSale: () => Promise<unknown>;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      isSyncing: false,

      addToCart: (product) =>
        set((state) => {
          const existing = state.cart.find((item) => item.id === product.id);
          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
              ),
            };
          }
          // We only pluck the fields we actually need for the local UI/Store
          return {
            cart: [
              ...state.cart,
              {
                id: product.id,
                name: product.name,
                price: product.price,
                qty: 1,
              },
            ],
          };
        }),

      updateQty: (id, delta) =>
        set((state) => ({
          cart: state.cart
            .map((item) =>
              item.id === id
                ? { ...item, qty: Math.max(0, item.qty + delta) }
                : item,
            )
            .filter((item) => item.qty > 0),
        })),

      clearCart: () => set({ cart: [] }),

      createSale: async () => {
        const { cart, getTotal, getSubtotal } = get();
        if (cart.length === 0) throw new Error("Cannot sync an empty cart");

        set({ isSyncing: true });

        try {
          const response = await fetch(
            "http://localhost:8000/api/v1/sales/create-sale",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                // TOP-LEVEL METADATA
                status: "PENDING",
                subtotal: getSubtotal(),
                total: getTotal(),

                // SLIMMED ITEMS
                // We map 'id' to 'product_id' so the backend knows exactly what it is
                items: cart.map((item) => ({
                  product_id: item.id,
                  name: item.name,
                  price: item.price,
                  qty: item.qty,
                })),
              }),
            },
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to create sale");
          }

          return await response.json();
        } finally {
          set({ isSyncing: false });
        }
      },

      getSubtotal: () =>
        get().cart.reduce((acc, item) => acc + item.price * item.qty, 0),

      getTax: () => get().getSubtotal() * 0.055,

      getTotal: () => get().getSubtotal() + get().getTax(),
    }),
    {
      name: "omni-pos-cart",
    },
  ),
);