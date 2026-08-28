"use client";

import React from "react";
import { useCartStore } from "@/lib/store/useCartStore";

export default function Receipt({
  method,
  details,
}: {
  method: string;
  details?: string;
}) {
  const receiptNo = "PENDING";
  const { cart, getSubtotal, getTax, getTotal } = useCartStore();
  const today = new Date().toLocaleString();

  return (
    <div
      id="printable-receipt"
      className="w-[380px] bg-white p-8 text-black shadow-sm mx-auto font-mono text-sm border border-dashed border-gray-300"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-black uppercase tracking-tighter">
          OmniPOS Terminal
        </h2>
        <p>123 Business Avenue, Nairobi</p>
        <p>Tel: +254 700 000 000</p>
        <div className="border-b border-black border-dashed my-4" />
        <p className="flex justify-between">
          <span>Date:</span> <span>{today}</span>
        </p>
        <p className="flex justify-between">
          <span>Receipt #:</span>{" "}
          <span>{receiptNo}</span>
        </p>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex justify-between font-bold border-b border-black pb-1">
          <span>Item</span>
          <span>Qty</span>
          <span>Price</span>
        </div>
        {cart.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>{item.name}</span>
            <span>x{item.qty}</span>
            <span>{(item.price * item.qty).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1 border-t border-black pt-4">
        <div className="flex justify-between">
          <span>Subtotal</span> <span>{getSubtotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax (5.5%)</span> <span>{getTax().toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-black text-lg pt-2">
          <span>TOTAL</span>
          <span>KES {getTotal().toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-dashed border-black">
        <p className="font-bold uppercase tracking-widest">
          Paid via: {method}
        </p>
        {details && <p className="text-xs uppercase opacity-70">{details}</p>}
      </div>

      <div className="text-center mt-8 italic">
        <p>Thank you for shopping with us!</p>
        <p>Please come again.</p>
      </div>
    </div>
  );
}
