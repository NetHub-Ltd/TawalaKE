/** Remember last staged (not yet finalized) sale for resume/cancel on terminal. */

const key = (businessId: string) => `tawala:staged-sale:${businessId}`;

export function setStagedSaleId(businessId: string, saleId: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key(businessId), saleId);
  } catch {
    /* ignore */
  }
}

export function getStagedSaleId(businessId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(key(businessId));
  } catch {
    return null;
  }
}

export function clearStagedSaleId(businessId: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key(businessId));
  } catch {
    /* ignore */
  }
}
