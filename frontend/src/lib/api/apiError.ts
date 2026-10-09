/**
 * Map backend AuthZ / paywall error payloads to user-facing copy.
 * Backend remains the enforcement plane. Prefer backend `message` (already action-oriented).
 */
export type ApiErrorCode =
  | "RBAC_DENIED"
  | "FEATURE_NOT_AVAILABLE"
  | "PLAN_LIMIT_REACHED"
  | "SUBSCRIPTION_INACTIVE"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_LOCKED"
  | "ORG_REQUIRED"
  | string;

export function messageFromApiError(data: unknown, fallback = "Request failed"): string {
  if (!data || typeof data !== "object") return fallback;
  const d = data as Record<string, unknown>;
  const detail = d.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    const det = detail as Record<string, unknown>;
    // Prefer explicit server message (includes what happened + what to do)
    if (typeof det.message === "string" && det.message.trim()) return det.message;
    if (typeof det.code === "string") {
      return messageForCode(det.code);
    }
  }
  if (typeof d.message === "string") return d.message;
  if (typeof d.code === "string") return messageForCode(d.code);
  return fallback;
}

export function messageForCode(code: string, message?: string): string {
  if (message && message.trim()) return message;
  switch (code) {
    case "RBAC_DENIED":
      return "You do not have permission to perform this action. Ask an organization owner if you need access.";
    case "FEATURE_NOT_AVAILABLE":
      return "This feature is not included in your current plan. Open Billing to upgrade and unlock it.";
    case "PLAN_LIMIT_REACHED":
      return "You have reached a plan limit. Open Billing to upgrade, or free capacity to continue.";
    case "SUBSCRIPTION_INACTIVE":
      return "This organization has no active plan. Start a trial or choose a plan on Billing to continue.";
    case "SUBSCRIPTION_EXPIRED":
      return "Your subscription period has ended. Renew or upgrade on Billing to restore access for your team.";
    case "SUBSCRIPTION_LOCKED":
      return "Access is locked because the trial and grace period have ended. The organization owner can complete payment on Billing, or contact Tawala support for a short extension.";
    case "ORG_REQUIRED":
      return "Your account is not linked to an organization. Sign in again or contact support.";
    default:
      return "Request failed";
  }
}

/** Paywall / plan blocks use 402; legacy clients may still see 403. */
export function isPaywallStatus(status: number): boolean {
  return status === 402 || status === 403;
}

/** Codes that mean “go to billing” rather than permission denial. */
export function isSubscriptionPaywallCode(code: string | undefined | null): boolean {
  if (!code) return false;
  return (
    code === "SUBSCRIPTION_INACTIVE" ||
    code === "SUBSCRIPTION_EXPIRED" ||
    code === "SUBSCRIPTION_LOCKED" ||
    code === "PLAN_LIMIT_REACHED" ||
    code === "FEATURE_NOT_AVAILABLE"
  );
}
