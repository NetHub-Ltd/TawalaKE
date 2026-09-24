import { readFile } from "fs/promises";
import path from "path";

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
};

/** Load curated product changelog. Never exposes internal paths or tokens. */
export async function loadProductChangelog(): Promise<ProductChangelog> {
  const candidates = [
    path.join(process.cwd(), "docs", "product-changelog.json"),
    path.join(process.cwd(), "..", "docs", "product-changelog.json"),
  ];
  let raw: string | null = null;
  for (const filePath of candidates) {
    try {
      raw = await readFile(filePath, "utf8");
      break;
    } catch {
      /* try next */
    }
  }
  if (!raw) return { updated_at: "", entries: [] };

  try {
    const data = JSON.parse(raw) as ProductChangelog;
    if (!Array.isArray(data.entries)) return { updated_at: "", entries: [] };
    const entries: ChangelogEntry[] = data.entries
      .filter((e) => e && typeof e.id === "string" && typeof e.title === "string")
      .map((e) => ({
        id: String(e.id).slice(0, 64),
        date: String(e.date || "").slice(0, 32),
        version: String(e.version || "Update").slice(0, 64),
        title: String(e.title).slice(0, 200),
        items: Array.isArray(e.items)
          ? e.items
              .filter((i) => i && typeof i.text === "string")
              .map((i) => ({
                type: (["feature", "fix", "improvement"].includes(String(i.type))
                  ? (i.type as ChangelogItemType)
                  : "improvement"),
                text: String(i.text).slice(0, 500),
              }))
          : [],
      }));
    return { updated_at: String(data.updated_at || ""), entries };
  } catch {
    return { updated_at: "", entries: [] };
  }
}
