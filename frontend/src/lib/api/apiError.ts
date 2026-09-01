/**
 * Map backend AuthZ / paywall error payloads to user-facing copy.
 * Backend remains the enforcement plane.
 */
export type ApiErrorCode =
  | "RBAC_DENIED"
  | "FEATURE_NOT_AVAILABLE"
  | "PLAN_LIMIT_REACHED"
  | "SUBSCRIPTION_INACTIVE"
  | "SUBSCRIPTION_EXPIRED"
  | "ORG_REQUIRED"
  | string;

export function messageFromApiError(data: unknown, fallback = "Request failed"): string {
  if (!data || typeof data !== "object") return fallback;
  const d = data as Record<string, unknown>;
  const detail = d.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    const det = detail as Record<string, unknown>;
    if (typeof det.message === "string") return det.message;
    if (typeof det.code === "string") {
      return messageForCode(det.code, typeof det.message === "string" ? det.message : undefined);
    }
  }
  if (typeof d.message === "string") return d.message;
  if (typeof d.code === "string") return messageForCode(d.code);
  return fallback;
}

export function messageForCode(code: string, message?: string): string {
  if (message) return message;
  switch (code) {
    case "RBAC_DENIED":
      return "You do not have permission to perform this action.";
    case "FEATURE_NOT_AVAILABLE":
      return "This feature is not included in your current plan. Upgrade to unlock it.";
    case "PLAN_LIMIT_REACHED":
      return "You have reached a plan limit. Upgrade or free capacity to continue.";
    case "SUBSCRIPTION_INACTIVE":
      return "No active subscription. Start a trial or choose a plan.";
    case "SUBSCRIPTION_EXPIRED":
      return "Your subscription has expired. Renew to continue.";
    case "ORG_REQUIRED":
      return "Your account is not linked to an organization.";
    default:
      return "Request failed";
  }
}

export function isPaywallStatus(status: number): boolean {
  return status === 402 || status === 403;
}
