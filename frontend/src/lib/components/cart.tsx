// "use client";

// import { CreditCard, ShoppingCart, Trash2, Minus, Plus } from "lucide-react";
// import Link from "next/link";
// import { useCartStore } from "../store/useCartStore";

// export function CartSidebar() {
//   const { cart, updateQty, clearCart, getSubtotal, getTotal } = useCartStore();

//   return (
//     <aside className="w-96 bg-card border-l border-border flex flex-col shadow-soft z-20">
//       {/* Compact Header */}
//       <div className="p-4 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm">
//         <div>
//           <h2 className="text-base font-black tracking-tight text-foreground uppercase">
//             Current Sale
//           </h2>
//           <p className="text-[9px] text-secondary font-bold tracking-widest">
//             #TRX-8821 • STATION 01
//           </p>
//         </div>
//         <button
//           onClick={clearCart}
//           className="p-2 hover:bg-red-500/10 text-secondary hover:text-red-500 rounded-lg transition-all"
//           title="Clear Cart"
//         >
//           <Trash2 size={18} />
//         </button>
//       </div>

//       {/* Optimized Items List: Tighter padding for less scrolling */}
//       <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
//         {cart.length === 0 ? (
//           <div className="h-full flex flex-col items-center justify-center text-secondary/30 gap-2">
//             <ShoppingCart size={24} strokeWidth={1.5} />
//             <p className="font-bold text-[10px] uppercase tracking-widest">
//               Basket Empty
//             </p>
//           </div>
//         ) : (
//           cart.map((item) => (
//             <div
//               key={item.id}
//               className="group flex items-center justify-between p-2.5 rounded-2xl bg-background/50 border border-transparent hover:border-primary/10 transition-all"
//             >
//               <div className="flex flex-col min-w-0 pr-2">
//                 <span className="font-bold text-xs text-foreground truncate leading-tight">
//                   {item.name}
//                 </span>
//                 <span className="text-[10px] font-black text-primary/80">
//                   KES {item.price.toLocaleString()}
//                 </span>
//               </div>

//               {/* Ultra-compact quantity toggles */}
//               <div className="flex items-center bg-card rounded-xl border border-border p-0.5 shadow-sm shrink-0">
//                 <button
//                   onClick={() => updateQty(item.id, -1)}
//                   className="p-1 hover:bg-background rounded-lg text-secondary hover:text-foreground transition-colors"
//                 >
//                   <Minus size={12} />
//                 </button>
//                 <span className="w-6 text-center text-[11px] font-black text-foreground">
//                   {item.qty}
//                 </span>
//                 <button
//                   onClick={() => updateQty(item.id, 1)}
//                   className="p-1 hover:bg-background rounded-lg text-secondary hover:text-foreground transition-colors"
//                 >
//                   <Plus size={12} />
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       {/* Slim Checkout Footer */}
//       <div className="p-4 bg-card border-t border-border space-y-4">
//         <div className="flex justify-between items-center px-1">
//           <span className="text-[10px] font-black text-secondary uppercase tracking-widest">
//             Subtotal
//           </span>
//           <span className="text-sm font-bold text-foreground">
//             KES {getSubtotal().toLocaleString()}
//           </span>
//         </div>

//         <div className="bg-primary/5 rounded-2xl p-4 flex justify-between items-center border border-primary/10">
//           <div className="flex flex-col">
//             <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
//               Payable Amount
//             </span>
//             <div className="text-2xl font-black tracking-tighter text-foreground leading-none">
//               KES {getTotal().toLocaleString()}
//             </div>
//           </div>

//           <Link href="/sale/payment">
//             <button
//               disabled={cart.length === 0}
//               className="h-12 px-6 rounded-xl bg-primary text-white font-black text-xs shadow-soft hover:brightness-110 active:scale-95 disabled:grayscale disabled:opacity-30 transition-all flex items-center justify-center gap-2"
//             >
//               PAY
//               <CreditCard size={16} />
//             </button>
//           </Link>
//         </div>
//       </div>
//     </aside>
//   );
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";
import { useCartStore } from "../store/useCartStore";
import { toast } from "sonner";

export function CartSidebar() {
  const router = useRouter();
  const {
    cart,
    updateQty,
    clearCart,
    getSubtotal,
    getTotal,
    createSale,
    isSyncing,
  } = useCartStore();
  const [localLoading, setLocalLoading] = useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setLocalLoading(true);
    try {
      // 1. Sync the sale to the backend
      const sale = await createSale();

      // 2. Success feedback
      toast.success("Sale initialized successfully");

      // 3. Navigate to payment with the ID returned from your API
      // Adjust the key (e.g., sale.id or sale.data.id) based on your exact API response
      const saleId =
        sale && typeof sale === "object" && "id" in sale
          ? String((sale as { id: string }).id)
          : "";
      router.push(`/sales/payment?saleId=${saleId}`);
    } catch (error: unknown) {
      console.error("Checkout Error:", error);
      toast.error(
        (error instanceof Error ? error.message : null) ||
          "Failed to connect to the server. Check if the backend is running.",
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = localLoading || isSyncing;

  return (
    <aside className="w-96 bg-card border-l border-border flex flex-col shadow-soft z-20">
      {/* Compact Header */}
      <div className="p-4 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm">
        <div>
          <h2 className="text-base font-black tracking-tight text-foreground uppercase">
            Current Sale
          </h2>
          <p className="text-[9px] text-secondary font-bold tracking-widest uppercase">
            #TRX-8821 • Station 01
          </p>
        </div>
        <button
          onClick={clearCart}
          disabled={isLoading}
          className="p-2 hover:bg-red-500/10 text-secondary hover:text-red-500 rounded-lg transition-all disabled:opacity-20"
          title="Clear Cart"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Optimized Items List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-secondary/30 gap-2">
            <ShoppingCart size={24} strokeWidth={1.5} />
            <p className="font-bold text-[10px] uppercase tracking-widest">
              Basket Empty
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between p-2.5 rounded-2xl bg-background/50 border border-transparent hover:border-primary/10 transition-all"
            >
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-bold text-xs text-foreground truncate leading-tight">
                  {item.name}
                </span>
                <span className="text-[10px] font-black text-primary/80">
                  KES {item.price.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center bg-card rounded-xl border border-border p-0.5 shadow-sm shrink-0">
                <button
                  onClick={() => updateQty(item.id, -1)}
                  disabled={isLoading}
                  className="p-1 hover:bg-background rounded-lg text-secondary hover:text-foreground transition-colors disabled:opacity-20"
                >
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center text-[11px] font-black text-foreground">
                  {item.qty}
                </span>
                <button
                  onClick={() => updateQty(item.id, 1)}
                  disabled={isLoading}
                  className="p-1 hover:bg-background rounded-lg text-secondary hover:text-foreground transition-colors disabled:opacity-20"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Slim Checkout Footer */}
      <div className="p-4 bg-card border-t border-border space-y-4">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black text-secondary uppercase tracking-widest">
            Subtotal
          </span>
          <span className="text-sm font-bold text-foreground">
            KES {getSubtotal().toLocaleString()}
          </span>
        </div>

        <div className="bg-primary/5 rounded-2xl p-4 flex justify-between items-center border border-primary/10">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
              Payable Amount
            </span>
            <div className="text-2xl font-black tracking-tighter text-foreground leading-none">
              KES {getTotal().toLocaleString()}
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isLoading}
            className="h-12 px-6 rounded-xl bg-primary text-white font-black text-xs shadow-soft hover:brightness-110 active:scale-95 disabled:grayscale disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                PAY
                <CreditCard size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}