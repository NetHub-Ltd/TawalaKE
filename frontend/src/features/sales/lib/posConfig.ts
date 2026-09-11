/**
 * POS terminal config — tax from business model + enabled tenders from API.
 */

export type PosPaymentMethod = {
  code: string;
  label: string;
  collects_money: boolean;
  requires_customer: boolean;
};

export type PosConfig = {
  business_id: string;
  tax_rate: number;
  currency: string;
  payment_methods: PosPaymentMethod[];
};

export const POS_METHODS_FALLBACK: PosPaymentMethod[] = [
  {
    code: "CASH",
    label: "Cash (paid now)",
    collects_money: true,
    requires_customer: true,
  },
  {
    code: "INVOICE",
    label: "Credit (pay later)",
    collects_money: false,
    requires_customer: true,
  },
];

const cache = new Map<string, { at: number; config: PosConfig }>();
const TTL_MS = 60_000;

export function invalidatePosConfig(businessId?: string) {
  if (businessId) cache.delete(businessId);
  else cache.clear();
}

export async function fetchPosConfig(businessId: string): Promise<PosConfig> {
  const hit = cache.get(businessId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.config;

  const res = await fetch(`/api/v1/org/stores/${businessId}/pos-config`, {
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || body.detail || "Failed to load POS config");
  }
  const data = body as PosConfig;
  const config: PosConfig = {
    business_id: data.business_id || businessId,
    tax_rate: Number(data.tax_rate ?? 0),
    currency: data.currency || "KES",
    payment_methods:
      Array.isArray(data.payment_methods) && data.payment_methods.length > 0
        ? data.payment_methods
        : POS_METHODS_FALLBACK,
  };
  cache.set(businessId, { at: Date.now(), config });
  return config;
}
