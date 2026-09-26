export type ExpenseCategory =
  | "RENT"
  | "UTILITIES"
  | "SALARIES"
  | "TRANSPORT"
  | "SUPPLIES"
  | "MARKETING"
  | "MAINTENANCE"
  | "TAXES"
  | "OTHER";

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "RENT", label: "Rent" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "SALARIES", label: "Salaries" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "MARKETING", label: "Marketing" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "TAXES", label: "Taxes" },
  { value: "OTHER", label: "Other" },
];

export type ExpenseRow = {
  id: string;
  business_id: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  incurred_on: string;
  vendor?: string | null;
  notes?: string | null;
  reference?: string | null;
  created_at?: string | null;
};

export type ExpenseListPayload = {
  items: ExpenseRow[];
  total: number;
  total_amount: number;
};
