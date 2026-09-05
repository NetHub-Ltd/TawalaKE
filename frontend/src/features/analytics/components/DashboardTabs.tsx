"use client";

import React from "react";
import { clsx } from "clsx";

export type DashboardTab = "sales" | "products" | "staff";

const TABS: { id: DashboardTab; label: string }[] = [
  { id: "sales", label: "Sales" },
  { id: "products", label: "Products" },
  { id: "staff", label: "Staff" },
];

export function DashboardTabs({
  value,
  onChange,
}: {
  value: DashboardTab;
  onChange: (t: DashboardTab) => void;
}) {
  return (
    <div role="tablist" aria-label="Dashboard sections" className="flex gap-6 border-b border-slate-200">
      {TABS.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            id={`tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "relative -mb-px pb-3 text-sm font-medium transition-colors",
              active ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
            )}
          >
            {tab.label}
            {active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-teal-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}
