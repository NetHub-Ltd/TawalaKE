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
      "Stock theft is one of the quietest ways a Kenyan shop loses money. It rarely looks like a dramatic break-in. More often it is a missing carton after a busy evening shift, a voided sale that never made it into the book, or a “discount” that only the cashier can explain. Exercise books and goodwill do not survive three cashiers and a long queue.",
      "The goal is not to treat every staff member as a thief. The goal is a system where every sale, void, discount, and stock movement is attributable — so honest staff are protected and gaps surface the same day instead of at month-end.",
      "Step 1 — Unique PIN per person: Give every cashier and stock handler their own 4-digit PIN. Every sale, discount, void, and adjustment should be tied to that PIN. Shared logins make investigation impossible and punish the whole team when something goes wrong.",
      "Step 2 — Shift-level stock discipline: Do not wait for a monthly stock take to discover a problem. Count high-risk or high-value lines at the end of each shift (or at least daily). Compare expected stock (opening + receipts − sales − known adjustments) with physical counts while the shift is still fresh.",
      "Step 3 — Same-day mismatch alerts: Use a system that flags low stock and unexpected quantity drops automatically. When a line that sold 10 units shows 25 units missing, you want that signal before the next morning delivery, not after the supplier has already been paid.",
      "Step 4 — Review with the team, not only blame: Once a week, walk through discrepancy reports with the people who worked the counter. Close process gaps (unclear returns, informal credit, unrecorded samples) as deliberately as you address individual issues. Process fixes reduce future loss better than suspicion alone.",
      "What “good” looks like: By the end of a week you should know who sold what, which lines are shrinking faster than sales explain, and whether voids and discounts are concentrated on one person or one shift. That visibility is what turns stock control from a yearly panic into a daily habit.",
      "If you are still running on paper, start with PIN accountability and daily counts on your top 20 SKUs. Software such as Tawala is built around those exact loops — staff PIN login, real-time stock, and mismatch alerts — so the process does not depend on someone remembering to update an exercise book after closing.",
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
      "A pharmacy in Kenya is not a general minimart with white coats. Expiry risk, batch recalls, controlled items, and margin pressure from supplier price changes all sit on top of normal retail challenges. Choosing a POS only for “fast checkout” misses the inventory problems that actually destroy profit.",
      "FEFO before FIFO: First-Expired-First-Out matters more than simple first-in-first-out. You need visibility into which packs expire in 90, 60, and 30 days so staff can prioritise them at the counter. Writing off expired stock is pure loss; a system that never surfaces near-expiry lines forces you to discover the problem when it is already too late.",
      "Batch and lot control: When a recall or quality issue hits a batch, you must know whether that lot ever entered your shelves and whether any of it left through a sale. Batch-level history is the difference between a targeted response and a full-shelf guess.",
      "Staff accountability on the counter: Pharmacies often run with multiple people handling the same till. PIN-based login means every sale and adjustment is tied to a person. That record supports internal reviews and reduces the “anyone could have done it” gap that paper systems leave open.",
      "Prescription and controlled-drug trails: Even where full e-prescription is not mandatory for every line, an internal log that links sensitive sales to staff and time is useful for audits and disputes. Prefer systems that can grow into stricter logging without a full re-implementation.",
      "Hardware reality: Dedicated pharmacy terminals are expensive. A good POS for Kenyan chemists should run well on a phone or tablet at the counter, with barcode scanning and fast search, so you are not locked into one vendor’s hardware.",
      "Pricing and trial: Look for transparent monthly pricing in KES and a real trial on live stock data. Tawala’s pharmacy-oriented workflows emphasise FEFO-oriented stock visibility, batch-aware inventory, and staff PIN accountability — the same controls this guide prioritises — without requiring a heavy on-premise setup.",
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
      "In Kenyan retail, M-Pesa is not an alternative payment method — it is often the primary one. Closing the day by scrolling through SMS messages and copying amounts into an exercise book is slow, error-prone, and almost impossible to audit when a customer disputes a payment three days later.",
      "What reconciliation actually means: Every M-Pesa payment that belongs to your business should map to a sale (or a clear exception). Cash, M-Pesa, and credit should balance against recorded sales for the shift. Unmatched money or unmatched sales are the two failure modes you must surface, not bury.",
      "Step 1 — Capture payment at the point of sale: Record the M-Pesa payment as part of the same transaction that records the sale. Avoid a separate “we will update the book later” path. Later almost always means incomplete.",
      "Step 2 — Match by amount and time window: Where your system can see both the till statement and the sales list, auto-match clear one-to-one cases. Leave ambiguous rows (same amount twice in five minutes, partial payments, customer overpays) for a short manual review queue.",
      "Step 3 — Flag exceptions the same day: Unmatched M-Pesa credits and sales marked “paid via M-Pesa” with no matching payment should appear on a shift close report. Treating them as “sort out next week” is how leakage and customer disputes compound.",
      "Step 4 — Close the shift with one picture: Cash counted, M-Pesa matched, credit noted, and variance explained. One report per shift beats three different books that never agree.",
      "Practical constraints: Not every shop will have full automated Till API integration on day one. Even then, structured capture at the counter (sale + payment method + reference) is far better than free-text SMS logs. Automation can grow on top of clean records; it cannot fix a year of unstructured notes.",
      "Tawala is designed around this Kenyan payment reality: sales tied to staff, payment method captured in the flow, and day-end views that help you see cash vs M-Pesa vs credit without rebuilding the day from memory.",
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
      "Many Kenyan shop owners close the day by counting cash and M-Pesa and calling the total “what we made.” That number is revenue, not profit. If cost of goods, leakage, and operating expenses are invisible, you can have a busy till and still be going backwards.",
      "Simple definitions that matter: Gross profit is sales minus cost of goods sold (what you paid for the stock that left the shelf). Net profit is gross profit minus operating costs — rent, salaries, airtime, transport, packaging, small repairs, and similar.",
      "Step 1 — Record every sale the moment it happens: Reconstructing the day from memory or a partial exercise book understates or overstates revenue. Real-time capture is the foundation; everything else builds on it.",
      "Step 2 — Cost of goods must move with stock: When an item sells, its cost should leave inventory with it. If your system only tracks selling price, you will always be guessing gross margin. Average cost or last cost is fine to start; the important part is that cost is attached to movement.",
      "Step 3 — Capture operating expenses on a cadence you will keep: Daily is ideal for variable costs (transport, airtime, casual labour). Weekly is acceptable for some fixed costs if you allocate them deliberately. The failure mode is “we will allocate at month-end” and then never doing it.",
      "Step 4 — Review net profit at close of day (or next morning without fail): A short daily view — sales, COGS, expenses, net — trains better decisions than a single monthly surprise. You will notice which days or product lines actually pay the bills.",
      "Common traps: Treating supplier credit as free money, ignoring owner drawings, and celebrating high sales of low-margin or leaked stock. Net profit after honest COGS and expenses is the number that tells you whether the biashara is working.",
      "Tawala surfaces daily profit-oriented views so owners are not stuck reconstructing numbers from books after closing. The point is not fancy accounting — it is seeing true net performance while you can still change behaviour this week.",
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}
