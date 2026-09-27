/** Shared sale document snapshot → view model for thermal receipt + formal invoice. */

export type PaymentField = { label: string; value: string };

export type Branding = {
  logo_url?: string;
  display_name?: string | null;
  payment_fields?: PaymentField[];
  terms_and_conditions?: string;
  paper_size?: string;
  apply_to_existing?: boolean;
};

export type ServiceLine = { description: string; amount: number };

export type ReceiptData = {
  document_number?: string;
  document_type?: string | { value?: string };
  issued_at?: string;
  branding?: Branding | null;
  seller?: {
    business_name?: string;
    business_id?: string;
    address?: string | null;
    phone?: string | null;
    tax_number?: string | null;
    cashier?: { name?: string } | null;
  } | null;
  buyer?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  financials?: {
    currency?: string;
    subtotal?: number;
    discount_amount?: number;
    tax_rate_applied?: number;
    tax_amount?: number;
    total_amount?: number;
    amount_paid?: number;
    balance_due?: number;
    service_lines?: ServiceLine[];
    service_total?: number;
  } | null;
  items?: Array<{
    name?: string;
    sku?: string;
    quantity?: number;
    unit_price?: number;
    total_price?: number;
  }>;
  payments?: Array<{
    method?: string;
    amount?: number;
    reference?: string | null;
  }>;
  summary?: {
    services?: ServiceLine[];
    discount_amount?: number;
  };
};

export type LiveBranch = {
  name?: string;
  phone?: string | null;
  address?: string | null;
  config?: {
    financial_documents?: Branding;
    show_tax_on_receipt?: boolean;
    receipt_footer?: string;
  } | null;
};

export type LineRow = {
  no: number;
  description: string;
  descriptionWithQty: string;
  quantity: number;
  unitPrice: number;
  total: number;
  kind: "product" | "service";
};

export type DocumentModel = {
  paper: "A5" | "A4";
  logoUrl: string;
  businessName: string;
  branchMeta: string[];
  phone: string;
  address: string;
  cashierName: string;
  docNumber: string;
  issuedAt: string;
  issuedAtShort: string;
  buyerName: string;
  buyerPhone: string;
  rows: LineRow[];
  paymentFields: PaymentField[];
  tenderLines: PaymentField[];
  subtotal: number;
  discount: number;
  tax: number;
  taxRateLabel: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  terms: string;
  receiptFooter: string;
  showTax: boolean;
  showDiscount: boolean;
  showBalance: boolean;
  showPaid: boolean;
  isInvoicePreferred: boolean;
  applyLive: boolean;
};

export const DEFAULT_LOGO = "https://tawala.nethub.co.ke/logo.svg";
export const DEFAULT_TERMS =
  "Payment is due within 30 days of the invoice date. Late payments may be subject to a 2% fee.\nThank you for your business!";

export function money(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatWhen(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(iso).slice(0, 10);
  }
}

export function formatWhenShort(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  } catch {
    return String(iso).slice(0, 10);
  }
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function docTypeString(raw: ReceiptData["document_type"]): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw.value) return String(raw.value);
  return String(raw);
}

function resolveServices(r: ReceiptData): ServiceLine[] {
  const a = r.financials?.service_lines;
  const b = r.summary?.services;
  const list = (Array.isArray(a) && a.length ? a : b) || [];
  return list
    .filter((s) => s && (s.description || Number(s.amount)))
    .map((s) => ({
      description: String(s.description || "Service"),
      amount: Number(s.amount) || 0,
    }));
}

export function buildDocumentModel(
  receipt: ReceiptData,
  saleId: string,
  liveBranch: LiveBranch | null,
): DocumentModel {
  const fin = receipt.financials || {};
  const seller = receipt.seller || {};
  const snapBranding = receipt.branding || {};
  const liveFd = liveBranch?.config?.financial_documents || {};
  const applyLive = Boolean(liveFd.apply_to_existing);
  const branding: Branding = applyLive
    ? { ...snapBranding, ...liveFd }
    : { ...snapBranding };

  const currency = fin.currency || "KES";
  const balanceDue = Number(fin.balance_due) || 0;
  const amountPaid = Number(fin.amount_paid) || 0;
  const totalAmount = Number(fin.total_amount) || 0;
  const dtype = docTypeString(receipt.document_type);
  const isInvoicePreferred =
    balanceDue > 0.001 || /invoice|credit/i.test(dtype);

  const services = resolveServices(receipt);
  const discount =
    Number(fin.discount_amount ?? receipt.summary?.discount_amount) || 0;
  const tax = Number(fin.tax_amount) || 0;
  const taxRate = Number(fin.tax_rate_applied) || 0;
  const taxRateLabel =
    taxRate > 0 && taxRate <= 1
      ? `${(taxRate * 100).toFixed(0)}%`
      : taxRate > 1
        ? `${taxRate}%`
        : "—";

  const rows: LineRow[] = [];
  let n = 1;
  for (const item of receipt.items || []) {
    const qty = Number(item.quantity) || 0;
    const unit = Number(item.unit_price) || 0;
    const lineTotal =
      item.total_price != null && Number.isFinite(Number(item.total_price))
        ? Number(item.total_price)
        : qty * unit;
    const name = (item.name || item.sku || "Item").trim() || "Item";
    const descriptionWithQty =
      qty !== 1 ? `${name} x${qty % 1 === 0 ? qty : qty}` : name;
    rows.push({
      no: n++,
      description: name,
      descriptionWithQty,
      quantity: qty,
      unitPrice: unit,
      total: lineTotal,
      kind: "product",
    });
  }
  for (const s of services) {
    rows.push({
      no: n++,
      description: s.description,
      descriptionWithQty: s.description,
      quantity: 1,
      unitPrice: s.amount,
      total: s.amount,
      kind: "service",
    });
  }

  const paper =
    String(branding.paper_size || "A5").toUpperCase() === "A4" ? "A4" : "A5";

  let paymentFields = (branding.payment_fields || []).filter(
    (f) => f && (f.label || f.value),
  ) as PaymentField[];

  const tenderLines: PaymentField[] = (receipt.payments || []).map((p) => ({
    label: String(p.method || "Payment"),
    value: [
      p.reference ? String(p.reference) : null,
      p.amount != null ? `${currency} ${money(Number(p.amount))}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  if (!paymentFields.length) {
    paymentFields = tenderLines;
  }

  const businessName =
    (branding.display_name && String(branding.display_name).trim()) ||
    liveBranch?.name ||
    seller.business_name ||
    "Business";

  const phone = liveBranch?.phone || seller.phone || "";
  const address = liveBranch?.address || seller.address || "";
  const taxNumber = seller.tax_number || "";
  const branchMeta = [
    address ? String(address) : null,
    phone ? `Tel ${phone}` : null,
    taxNumber ? `Tax / PIN ${taxNumber}` : null,
  ].filter(Boolean) as string[];

  const showTax = tax > 0 && liveBranch?.config?.show_tax_on_receipt !== false;

  return {
    paper,
    logoUrl: branding.logo_url || DEFAULT_LOGO,
    businessName,
    branchMeta,
    phone,
    address,
    cashierName: seller.cashier?.name || "",
    docNumber: receipt.document_number || saleId.slice(0, 8).toUpperCase(),
    issuedAt: formatWhen(receipt.issued_at),
    issuedAtShort: formatWhenShort(receipt.issued_at),
    buyerName:
      receipt.buyer?.name && !/^walk[-\s]?in/i.test(receipt.buyer.name)
        ? receipt.buyer.name
        : receipt.buyer?.name || "Walk-in customer",
    buyerPhone: receipt.buyer?.phone || "",
    rows,
    paymentFields,
    tenderLines,
    subtotal: Number(fin.subtotal) || 0,
    discount,
    tax,
    taxRateLabel,
    total: totalAmount,
    amountPaid,
    balanceDue,
    currency,
    terms: branding.terms_and_conditions || DEFAULT_TERMS,
    receiptFooter:
      liveBranch?.config?.receipt_footer?.trim() || "THANK YOU",
    showTax,
    showDiscount: discount > 0,
    showBalance: isInvoicePreferred && balanceDue > 0.001,
    showPaid: amountPaid > 0,
    isInvoicePreferred,
    applyLive,
  };
}

export function printHtmlDocument(html: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Print document");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("Could not create print frame");
  }
  doc.open();
  doc.write(html);
  doc.close();
  const w = iframe.contentWindow;
  if (!w) {
    document.body.removeChild(iframe);
    throw new Error("Print window unavailable");
  }
  setTimeout(() => {
    w.focus();
    w.print();
    setTimeout(() => {
      if (iframe.parentNode) document.body.removeChild(iframe);
    }, 1200);
  }, 300);
}
