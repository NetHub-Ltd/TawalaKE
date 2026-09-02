/**
 * Static blog articles for marketing / SEO content.
 * Replace or extend with CMS later; keep slugs stable for sitemap and backlinks.
 */
export interface Article {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  /** Paragraphs or step-like content blocks for the article body. */
  content: string[];
}

export const articles: Article[] = [
  {
    slug: "stop-stock-theft-small-shop-kenya",
    title: "How to Stop Stock Theft in a Small Shop in Kenya",
    description:
      "Practical strategies Kenyan shop owners use to eliminate stock leakages, from PIN accountability to daily stock audits.",
    date: "2026-09-02",
    author: "Tawala Team",
    tags: ["stock management", "theft prevention", "Kenya"],
    content: [
      "Stock theft is the silent profit killer for Kenyan retail businesses. Exercise books and trust alone rarely survive a busy counter and multiple cashiers.",
      "Step 1: Assign every staff member a unique PIN so every sale, discount, and void is attributable.",
      "Step 2: Reconcile inventory after every shift instead of waiting for month-end stock takes.",
      "Step 3: Use automated low-stock and mismatch alerts so discrepancies surface the same day.",
      "Step 4: Review discrepancy reports weekly with the team and close gaps in process, not just blame.",
    ],
  },
  {
    slug: "best-pos-pharmacy-kenya",
    title: "Best POS System for Pharmacies in Kenya (2026)",
    description:
      "What to look for in pharmacy POS software: FEFO expiry tracking, batch control, prescription logs, and KRA compliance readiness.",
    date: "2026-09-02",
    author: "Tawala Team",
    tags: ["pharmacy", "POS", "Kenya"],
    content: [
      "Running a pharmacy in Kenya comes with unique inventory challenges: expiry risk, batch recalls, and the need for clear staff accountability.",
      "FEFO vs FIFO: Why expiry tracking matters — selling oldest usable stock first protects margin and patient safety.",
      "Batch control for drug recalls: you need to know which lot left the shelf and when.",
      "Prescription audit trails: linking sales to staff PINs creates a usable internal record for reviews.",
      "Choose a system that works on phones and tablets so the counter stays fast without expensive dedicated hardware.",
    ],
  },
  {
    slug: "mpesa-reconciliation-retail-business",
    title: "M-Pesa Reconciliation for Retail Business: A Complete Guide",
    description:
      "How to automatically match M-Pesa Buy Goods transactions with your daily sales records — no more manual SMS copying.",
    date: "2026-09-02",
    author: "Tawala Team",
    tags: ["M-Pesa", "payments", "reconciliation"],
    content: [
      "Manually copying M-Pesa SMS messages into a sales book wastes time and introduces errors at close of day.",
      "Step 1: Integrate your M-Pesa Till or Buy Goods flow with your POS so payments land against sales.",
      "Step 2: Auto-match transactions by amount and timestamp where possible.",
      "Step 3: Flag unmatched entries for review so nothing is silently written off.",
      "Step 4: Close the shift with cash, M-Pesa, and credit balanced in one report.",
    ],
  },
  {
    slug: "calculate-daily-net-profit-shop",
    title: "How to Calculate Daily Net Profit for Your Shop",
    description:
      "Most shop owners treat revenue as profit. Here is how to track true daily net profit after stock, expenses, and staff costs.",
    date: "2026-09-02",
    author: "Tawala Team",
    tags: ["profit tracking", "accounting", "SME"],
    content: [
      "Revenue minus cost of goods sold equals gross profit — but net profit also subtracts operating costs.",
      "Step 1: Track every sale in real time so revenue is not reconstructed from memory.",
      "Step 2: Deduct cost of goods sold automatically as stock moves out.",
      "Step 3: Account for operating expenses (rent, salaries, airtime, transport) on a daily or weekly cadence.",
      "Step 4: Review true net profit at close of day so decisions are based on numbers, not gut feel.",
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}
