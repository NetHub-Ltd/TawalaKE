/**
 * Parse API error bodies for PLAN_LIMIT_REACHED / 402 and build UI copy + billing href.
 */
export function parsePlanLimitError(
  status: number,
  body: unknown,
  organizationId?: string,
): { message: string; isLimit: boolean; billingHref: string | null } {
  const b = (body || {}) as Record<string, unknown>;
  const detail = b.detail;
  let message = "Request failed";
  let code = "";

  if (typeof detail === "string") {
    message = detail;
  } else if (detail && typeof detail === "object") {
    const d = detail as Record<string, unknown>;
    if (typeof d.message === "string") message = d.message;
    if (typeof d.code === "string") code = d.code;
  } else if (typeof b.error === "string") {
    message = b.error;
  } else if (typeof b.message === "string") {
    message = b.message;
  }

  const isLimit =
    status === 402 ||
    code === "PLAN_LIMIT_REACHED" ||
    /limit|upgrade|plan/i.test(message);

  const billingHref =
    isLimit && organizationId
      ? `/org/${organizationId}/billing`
      : null;

  if (isLimit && !message) {
    message = "Plan limit reached. Upgrade billing to continue.";
  }

  return { message, isLimit, billingHref };
}
