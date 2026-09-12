/** Normalize common Kenyan phone inputs to 07xxxxxxxx / 01xxxxxxxx. */
export function normalizeKenyanPhone(raw: string): string {
  let s = (raw || "").replace(/[\s\-()]/g, "");
  if (s.startsWith("+254")) s = "0" + s.slice(4);
  else if (s.startsWith("254") && s.length >= 12) s = "0" + s.slice(3);
  return s;
}

export function isValidKenyanPhone(raw: string): boolean {
  return /^(07|01)\d{8}$/.test(normalizeKenyanPhone(raw));
}
