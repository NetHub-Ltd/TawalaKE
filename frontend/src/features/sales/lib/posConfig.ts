/**
 * POS terminal config — tax from business + enabled tenders.
 */

export type PosPaymentMethod = {
  code: string;
  label: string;
  collects_money: boolean;
  requires_customer: boolean;
  requires_reference?: boolean;
  requires_amount_given?: boolean;
  supports_change?: boolean;
};

export type PosConfig = {
  business_id: string;
  tax_rate: number;
  currency: string;
  payment_methods: PosPaymentMethod[];
};

/** Always include Cash + M-Pesa + Credit when API omits methods */
export const POS_METHODS_FALLBACK: PosPaymentMethod[] = [
  {
    code: "CASH",
    label: "Cash",
    collects_money: true,
    requires_customer: true,
    requires_amount_given: true,
    supports_change: true,
  },
  {
    code: "MPESA",
    label: "M-Pesa",
    collects_money: true,
    requires_customer: true,
    requires_reference: true,
    requires_amount_given: true,
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
    credentials: "include",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      body.error || body.detail || body.message || "Failed to load POS config",
    );
  }
  const data = (body?.data || body) as PosConfig;
  let methods =
    Array.isArray(data.payment_methods) && data.payment_methods.length > 0
      ? data.payment_methods
      : POS_METHODS_FALLBACK;

  // Ensure M-Pesa appears if API only returned Cash + Credit (legacy hard-code)
  const codes = new Set(methods.map((m) => m.code.toUpperCase()));
  if (!codes.has("MPESA")) {
    methods = [
      ...methods.filter((m) => m.code !== "INVOICE"),
      POS_METHODS_FALLBACK[1],
      ...methods.filter((m) => m.code === "INVOICE"),
    ];
  }

  const config: PosConfig = {
    business_id: data.business_id || businessId,
    tax_rate: Number(data.tax_rate ?? 0),
    currency: data.currency || "KES",
    payment_methods: methods,
  };
  cache.set(businessId, { at: Date.now(), config });
  return config;
}
