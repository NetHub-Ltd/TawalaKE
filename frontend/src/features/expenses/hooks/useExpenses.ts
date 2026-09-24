"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ExpenseCategory,
  ExpenseListPayload,
  ExpenseRow,
} from "@/features/expenses/types";

async function parseJson(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      body.error ||
      body.detail ||
      body.message ||
      (typeof body.detail === "string" ? body.detail : null) ||
      "Request failed";
    throw new Error(typeof msg === "string" ? msg : "Request failed");
  }
  return body?.data !== undefined ? body.data : body;
}

export function useExpenseList(businessId: string) {
  return useQuery({
    queryKey: ["expenses", businessId],
    queryFn: async (): Promise<ExpenseListPayload> => {
      const params = new URLSearchParams({
        businessId,
        limit: "50",
      });
      const res = await fetch(`/api/v1/expenses?${params}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      return parseJson(res);
    },
    enabled: Boolean(businessId),
    staleTime: 15_000,
  });
}

export type CreateExpenseInput = {
  business_id: string;
  category: ExpenseCategory;
  amount: number;
  currency?: string;
  incurred_on: string;
  vendor?: string;
  notes?: string;
};

export function useCreateExpense(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateExpenseInput): Promise<ExpenseRow> => {
      const res = await fetch("/api/v1/expenses", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      return parseJson(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", businessId] });
      // Overview dashboard may show expense KPIs for this business
      qc.invalidateQueries({ queryKey: ["report", "dashboard", businessId] });
    },
  });
}
