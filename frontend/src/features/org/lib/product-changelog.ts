/**
 * Product updates for org staff (server-only).
 *
 * Sources (merged, newest first):
 * 1. GitHub Releases (when published)
 * 2. Merged PRs into `main` and `dev` (so updates appear as work lands)
 *
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

function githubHeaders(): Record<string, string> {
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
  return headers;
}

function classifyHeading(line: string): ChangelogItemType | null {
  const h = line.replace(/^#+\s*/, "").trim().toLowerCase();
  if (/^(features?|new|what's new|whats new)/.test(h)) return "feature";
  if (/^(fixes?|bug\s*fixes?|bugs?)/.test(h)) return "fix";
  if (/^(improvements?|changed|changes|polish|ux)/.test(h)) return "improvement";
  return null;
}

function classifyTitle(title: string): ChangelogItemType {
  const t = title.toLowerCase();
  if (/^fix(\b|[(/:])|^bug\b|^hotfix\b/.test(t)) return "fix";
  if (/^feat(\b|[(/:])|^feature\b|^add\b/.test(t)) return "feature";
  if (/^chore\b|^docs\b|^ci\b|^build\b|^refactor\b|^test\b|^style\b/.test(t)) {
    return "improvement";
  }
  return "improvement";
}

function sanitizeBullet(text: string): string {
  return text
    .replace(/\[[^\]]*\]\([^)]+\)/g, (m) => {
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

/** Strip conventional-commit prefix and PR number suffix for display. */
function cleanPrTitle(title: string): string {
  return title
    .replace(
      /^(feat|fix|chore|docs|ci|build|refactor|test|style|perf)(\([^)]*\))?:\s*/i,
      "",
    )
    .replace(/\s*\(#\d+\)\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

/** Parse release markdown body into typed bullets. */
export function parseReleaseBody(body: string | null | undefined): ChangelogItem[] {
  if (!body?.trim()) return [];
  const items: ChangelogItem[] = [];
  let current: ChangelogItemType = "improvement";
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const heading = classifyHeading(line);
    if (heading) {
      current = heading;
      continue;
    }
    if (/^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const text = sanitizeBullet(line.replace(/^[-*•]\s+/, "").replace(/^\d+\.\s+/, ""));
      if (text.length >= 3) items.push({ type: current, text });
    }
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
};

type GhPull = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  merged_at: string | null;
  draft?: boolean;
  user?: { login?: string } | null;
};

function mapRelease(rel: GhRelease): ChangelogEntry | null {
  if (rel.draft) return null;
  const tag = (rel.tag_name || "").toLowerCase();
  if (tag.startsWith("infra-") || tag.startsWith("internal-")) return null;

  const items = parseReleaseBody(rel.body);
  const published = rel.published_at || "";
  const date = published ? published.slice(0, 10) : "";
  const version = (rel.tag_name || "release").slice(0, 64);
  const title = (rel.name || rel.tag_name || "Product update").slice(0, 200);

  const safeItems =
    items.length > 0
      ? items
      : [{ type: "improvement" as const, text: title.slice(0, 500) }];

  return {
    id: `rel-${rel.id}`,
    date,
    version,
    title,
    items: safeItems,
  };
}

function mapPull(pr: GhPull, base: string): ChangelogEntry | null {
  if (!pr.merged_at) return null;
  if (pr.draft) return null;
  const titleRaw = (pr.title || "").trim();
  if (!titleRaw) return null;
  // Skip pure infra / merge-back noise
  const lower = titleRaw.toLowerCase();
  if (lower === "dev" || lower === "main" || lower.startsWith("merge ")) return null;
  if (/^chore\(deps\)/i.test(titleRaw)) return null;

  const type = classifyTitle(titleRaw);
  const text = cleanPrTitle(titleRaw);
  if (text.length < 3) return null;

  const date = pr.merged_at.slice(0, 10);
  return {
    id: `pr-${base}-${pr.number}`,
    date,
    version: `PR #${pr.number}`,
    title: text,
    items: [{ type, text }],
  };
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: githubHeaders(),
      next: { revalidate: 600 },
    });
    if (!res.ok) {
      console.warn(`[product-changelog] HTTP ${res.status} ${url}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn("[product-changelog] fetch failed", url, err);
    return null;
  }
}

async function loadReleases(): Promise<ChangelogEntry[]> {
  const data = await fetchJson<GhRelease[]>(
    `https://api.github.com/repos/${REPO}/releases?per_page=15`,
  );
  if (!Array.isArray(data)) return [];
  return data
    .map(mapRelease)
    .filter((e): e is ChangelogEntry => e != null)
    .slice(0, 15);
}

async function loadMergedPulls(base: string): Promise<ChangelogEntry[]> {
  // GitHub lists closed PRs; filter merged_at client-side
  const data = await fetchJson<GhPull[]>(
    `https://api.github.com/repos/${REPO}/pulls?state=closed&base=${encodeURIComponent(base)}&per_page=30&sort=updated&direction=desc`,
  );
  if (!Array.isArray(data)) return [];
  return data
    .map((pr) => mapPull(pr, base))
    .filter((e): e is ChangelogEntry => e != null)
    .slice(0, 25);
}

function dedupeEntries(entries: ChangelogEntry[]): ChangelogEntry[] {
  const seen = new Set<string>();
  const out: ChangelogEntry[] = [];
  for (const e of entries) {
    const key = `${e.date}|${e.title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

/**
 * Load customer-facing product updates from releases + merged work on main/dev.
 */
export async function loadProductChangelog(): Promise<ProductChangelog> {
  const [releases, mainPrs, devPrs] = await Promise.all([
    loadReleases(),
    loadMergedPulls("main"),
    loadMergedPulls("dev"),
  ]);

  const merged = dedupeEntries(
    [...releases, ...mainPrs, ...devPrs].sort((a, b) =>
      (b.date || "").localeCompare(a.date || ""),
    ),
  ).slice(0, 30);

  if (!merged.length) {
    return { updated_at: "", entries: [], source: "empty" };
  }

  return {
    updated_at: merged[0]?.date || new Date().toISOString().slice(0, 10),
    entries: merged,
    source: "github",
  };
}
