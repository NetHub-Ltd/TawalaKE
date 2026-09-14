#!/usr/bin/env bash
# Theme debt guard (AGENTS.md §5 / theme.md).
# Strict fail on already-migrated paths; report-only on the rest of src/features
# until remaining milestones are complete.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PATTERN='bg-slate-|text-slate-|border-slate-|bg-gray-|bg-zinc-|bg-indigo-|bg-blue-|bg-violet-|bg-purple-|bg-emerald-|text-emerald-|bg-green-600|hover:bg-blue-|hover:text-blue-|text-\[1[0-9]px\]|text-\[2[0-9]px\]'

# Paths already migrated to canonical tokens — must stay clean
STRICT_PATHS=(
  "$ROOT/src/features/org/components/OrgShell.tsx"
  "$ROOT/src/features/org/components/Sidebar.tsx"
  "$ROOT/src/features/org/components/OrgHomeClient.tsx"
  "$ROOT/src/features/org/components/OrgSettingsClient.tsx"
  "$ROOT/src/features/org/components/OrgCommandCenterClient.tsx"
  "$ROOT/src/app/(organization)/org/[organizationId]/[businessId]/layout.tsx"
  "$ROOT/src/app/(organization)/org/[organizationId]/billing/page.tsx"
  "$ROOT/src/features/business/components/TerminalCockpit.tsx"
  "$ROOT/src/features/business/components/product-card.tsx"
  "$ROOT/src/features/sales/components/CartSideBar.tsx"
  "$ROOT/src/features/sales/components/CartFullPage.tsx"
  "$ROOT/src/features/sales/components/CheckoutForm.tsx"
  "$ROOT/src/features/sales/components/CheckoutWorkspace.tsx"
  "$ROOT/src/features/sales/components/CompleteSaleClient.tsx"
  "$ROOT/src/features/sales/components/ReceiptClientView.tsx"
  "$ROOT/src/features/customers/components/CustomersList.tsx"
  "$ROOT/src/features/customers/components/CollectCreditForm.tsx"
  "$ROOT/src/features/customers/components/CustomerWorkspace.tsx"
  "$ROOT/src/features/inventory/ProductWorkspace.tsx"
  "$ROOT/src/features/inventory/ProductSmartRow.tsx"
  "$ROOT/src/features/inventory/AssetComposer.tsx"
  "$ROOT/src/features/inventory/AuditTableRow.tsx"
  "$ROOT/src/features/stock/AuditForm.tsx"
  "$ROOT/src/features/stock/RestockForm.tsx"
  "$ROOT/src/features/stock/StockTakingTableRow.tsx"
  "$ROOT/src/features/staff/components/TeamDirectory.tsx"
  "$ROOT/src/features/staff/components/StaffMemberWorkspace.tsx"
  "$ROOT/src/features/staff/components/AcceptInviteForm.tsx"
  "$ROOT/src/features/store/components/store-form.tsx"
  "$ROOT/src/features/business/components/BusinessSettingsForm.tsx"
  "$ROOT/src/features/business/components/BusinessSwitcher.tsx"
  "$ROOT/src/features/sales/components/ReceiptClientView.tsx"
)

fail=0
echo "== Strict (migrated surfaces) =="
for f in "${STRICT_PATHS[@]}"; do
  if [[ -f "$f" ]] && grep -nE "$PATTERN" "$f" 2>/dev/null; then
    echo "FAIL: $f"
    fail=1
  else
    echo "OK:   ${f#$ROOT/}"
  fi
done

echo ""
echo "== Report (remaining src/features debt — not failing CI yet) =="
# Count matches under features excluding strict paths already checked
report=$(grep -RInE --include='*.tsx' --include='*.ts' -E "$PATTERN" "$ROOT/src/features" 2>/dev/null | grep -v 'OrgShell.tsx' | grep -v 'Sidebar.tsx' || true)
if [[ -n "$report" ]]; then
  count=$(echo "$report" | wc -l)
  echo "Found $count matching lines outside migrated shell (expected until Phase B–E complete)."
  echo "$report" | head -20
  if [[ "$count" -gt 20 ]]; then
    echo "... truncated"
  fi
else
  echo "No remaining forbidden patterns under src/features."
fi

if [[ "$fail" -ne 0 ]]; then
  echo ""
  echo "check:theme FAILED — fix strict paths (use globals.css tokens + UI kit)."
  exit 1
fi
echo ""
echo "check:theme OK (strict paths clean)."
