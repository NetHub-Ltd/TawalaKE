/**
 * Parse API error bodies for plan / subscription paywall (402) and build UI copy + billing href.
 * Prefer server message so users always know what happened and what to do next.
 */
export function parsePlanLimitError(
  status: number,
  body: unknown,
  organizationId?: string,
): { message: string; isLimit: boolean; billingHref: string | null; code: string } {
  const b = (body || {}) as Record<string, unknown>;
  const detail = b.detail;
  let message = "Request failed";
  let code = "";
  let action = "";

  if (typeof detail === "string") {
    message = detail;
  } else if (detail && typeof detail === "object") {
    const d = detail as Record<string, unknown>;
    if (typeof d.message === "string") message = d.message;
    if (typeof d.code === "string") code = d.code;
    if (typeof d.action === "string") action = d.action;
  } else if (typeof b.error === "string") {
    message = b.error;
  } else if (typeof b.message === "string") {
    message = b.message;
  }

  const subscriptionCodes = new Set([
    "PLAN_LIMIT_REACHED",
    "FEATURE_NOT_AVAILABLE",
    "SUBSCRIPTION_INACTIVE",
    "SUBSCRIPTION_EXPIRED",
    "SUBSCRIPTION_LOCKED",
  ]);

  const isLimit =
    status === 402 ||
    subscriptionCodes.has(code) ||
    action === "billing" ||
    /limit|upgrade|plan|billing|subscription|grace|locked/i.test(message);

  const billingHref =
    isLimit && organizationId
      ? `/org/${organizationId}/billing`
      : null;

  if (isLimit && (!message || message === "Request failed")) {
    message =
      code === "SUBSCRIPTION_LOCKED"
        ? "Access is locked. Complete payment on Billing to restore access."
        : "Plan or subscription limit. Open Billing to continue.";
  }

  return { message, isLimit, billingHref, code };
}
