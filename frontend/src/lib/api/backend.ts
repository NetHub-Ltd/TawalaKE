/** Server-only backend base URL (never expose to the browser). */
export function getBackendBaseUrl(): string {
  const raw = process.env.BACKEND_URL;
  if (!raw) {
    throw new Error("BACKEND_URL is not configured");
  }
  return raw.replace(/\/$/, "");
}

export function backendUrl(path: string): string {
  const base = getBackendBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (base.endsWith("/api/v1")) {
    return `${base}${p}`;
  }
  return `${base}/api/v1${p}`;
}
