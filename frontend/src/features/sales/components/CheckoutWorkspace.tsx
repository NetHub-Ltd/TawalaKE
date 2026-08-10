"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { CheckoutForm } from "@/features/sales/components/CheckoutForm";
import { useSales } from "@/features/sales/hooks/useSales";

interface CheckoutWorkspaceProps {
  saleId: string;
  organizationId: string;
  businessId: string;
}

export function CheckoutWorkspace({
  saleId,
  organizationId,
  businessId,
}: CheckoutWorkspaceProps) {
  const { sales, isLoading, error } = useSales({ businessId, saleId });

  if (isLoading) {
    return (
      <div className="h-dvh w-full bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading sale...
        </p>
      </div>
    );
  }

  const activeSale = sales[0];

  if (error || !activeSale) {
    return (
      <div className="h-dvh w-full bg-background flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle size={20} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Couldn’t load this sale
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {error?.message || "Please go back and try again."}
          </p>
        </div>
        <Link
          href={`/org/${organizationId}/${businessId}/terminal`}
          className="mt-2 h-10 px-4 rounded-xl bg-brand-primary text-white text-sm font-medium flex items-center"
        >
          Back to counter
        </Link>
      </div>
    );
  }

  const subtotal = activeSale.subtotal;
  const taxAmount = activeSale.tax_amount;
  const discount = activeSale.discount;
  const grandTotal = activeSale.total_amount;
  const shortRef = activeSale.id.slice(0, 8).toUpperCase();

  return (
    <div className="h-dvh w-full bg-background flex flex-col overflow-hidden">
      {/* Top bar */}

      {/* Main content — fits remaining height */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-0">
        {/* LEFT — Summary */}
        <section className="flex flex-col justify-center px-6 sm:px-10 py-8 lg:py-10 lg:border-r border-border/60 ">
          <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto lg:mr-8">
            <p className="text-sm text-muted-foreground mb-1">
              Amount to collect
            </p>
            <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground tabular-nums">
              KES{" "}
              {grandTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <div className="mt-8 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums text-foreground">
                  KES {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT</span>
                <span className="tabular-nums text-foreground">
                  KES {taxAmount.toLocaleString()}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-brand-accent">
                  <span>Discount</span>
                  <span className="tabular-nums">
                    −KES {discount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-border/70 flex justify-between items-baseline">
              <span className="text-sm font-medium text-foreground">Total</span>
              <span className="text-lg font-semibold tabular-nums text-foreground">
                KES{" "}
                {grandTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </section>

        {/* RIGHT — Form */}
        <section className="flex flex-col justify-center px-6 sm:px-10 py-8 lg:py-10 overflow-y-auto">
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-8">
            <CheckoutForm
              saleId={activeSale.id}
              grandTotal={grandTotal}
              organizationId={organizationId}
              businessId={businessId}
            />
          </div>
        </section>
      </main>
    </div>
  );
}