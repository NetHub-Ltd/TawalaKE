/**
 * Product updates from GitHub Releases (server-only).
 * Never exposes tokens, SHAs, or internal paths to the client.
 */

export type ChangelogItemType = "feature" | "fix" | "improvement";

export type ChangelogItem = {
  type: ChangelogItemType;
  text: string;
};

export type ChangelogEntry = {
  id: string;
  date: string;
  version: string;
  title: string;
  items: ChangelogItem[];
};

export type ProductChangelog = {
  updated_at: string;
  entries: ChangelogEntry[];
  source: "github" | "empty";
};

const REPO =
  process.env.GITHUB_RELEASES_REPO?.trim() || "NetHub-Ltd/TawalaKE";
const API = `https://api.github.com/repos/${REPO}/releases?per_page=20`;

function classifyHeading(line: string): ChangelogItemType | null {
  const h = line.replace(/^#+\s*/, "").trim().toLowerCase();
  if (/^(features?|new|what's new|whats new)/.test(h)) return "feature";
  if (/^(fixes?|bug\s*fixes?|bugs?)/.test(h)) return "fix";
  if (/^(improvements?|changed|changes|polish|ux)/.test(h)) return "improvement";
  return null;
}

function sanitizeBullet(text: string): string {
  return text
    .replace(/\[[^\]]*\]\([^)]+\)/g, (m) => {
      // keep link label only
      const label = m.match(/^\[([^\]]*)\]/);
      return label ? label[1] : "";
    })
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b[0-9a-f]{7,40}\b/gi, "")
    .replace(/#\d+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 500);
}

/** Parse release markdown body into typed bullets. */
export function parseReleaseBody(body: string | null | undefined): ChangelogItem[] {
  if (!body || !body.trim()) return [];
  const items: ChangelogItem[] = [];
  let current: ChangelogItemType = "improvement";
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^#{1,3}\s+/.test(line)) {
      const t = classifyHeading(line);
      if (t) current = t;
      continue;
    }
    const bullet = line.match(/^[-*+]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
    if (bullet) {
      const text = sanitizeBullet(bullet[1]);
      if (text.length >= 3) items.push({ type: current, text });
    }
  }
  // Fallback: first non-empty paragraphs as improvements
  if (!items.length) {
    const para = body
      .split(/\n\n+/)
      .map((p) => sanitizeBullet(p.replace(/\n/g, " ")))
      .filter((p) => p.length >= 8)
      .slice(0, 5);
    for (const text of para) items.push({ type: "improvement", text });
  }
  return items.slice(0, 40);
}

type GhRelease = {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  html_url?: string;
};

function mapRelease(rel: GhRelease): ChangelogEntry | null {
  if (rel.draft) return null;
  // Skip infra-only tags
  const tag = (rel.tag_name || "").toLowerCase();
  if (tag.startsWith("infra-") || tag.startsWith("internal-")) return null;

  const items = parseReleaseBody(rel.body);
  if (!items.length && !rel.name) return null;

  const published = rel.published_at || "";
  const date = published ? published.slice(0, 10) : "";
  const version = (rel.tag_name || "release").slice(0, 64);
  const title = (rel.name || rel.tag_name || "Product update").slice(0, 200);

  // If body empty, still show the release title as one improvement
  const safeItems =
    items.length > 0
      ? items
      : [{ type: "improvement" as const, text: title.slice(0, 500) }];

  return {
    id: String(rel.id).slice(0, 64),
    date,
    version,
    title,
    items: safeItems,
  };
}

/**
 * Fetch published GitHub Releases and map to customer-safe changelog entries.
 * Uses GITHUB_TOKEN / GITHUB_RELEASES_TOKEN when set (private repos).
 */
export async function loadProductChangelog(): Promise<ProductChangelog> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "TawalaKE-Updates",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token =
    process.env.GITHUB_RELEASES_TOKEN?.trim() ||
    process.env.GITHUB_TOKEN?.trim() ||
    process.env.GH_TOKEN?.trim() ||
    "";
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(API, {
      headers,
      next: { revalidate: 900 }, // 15 minutes
    });
    if (!res.ok) {
      console.warn(
        `[product-changelog] GitHub releases HTTP ${res.status} for ${REPO}`,
      );
      return { updated_at: "", entries: [], source: "empty" };
    }
    const data = (await res.json()) as GhRelease[];
    if (!Array.isArray(data)) {
      return { updated_at: "", entries: [], source: "empty" };
    }
    const entries = data
      .filter((r) => r && !r.draft)
      .map(mapRelease)
      .filter((e): e is ChangelogEntry => e != null)
      .slice(0, 20);

    const updated_at =
      entries[0]?.date ||
      new Date().toISOString().slice(0, 10);

    return { updated_at, entries, source: "github" };
  } catch (err) {
    console.warn("[product-changelog] fetch failed", err);
    return { updated_at: "", entries: [], source: "empty" };
  }
}
