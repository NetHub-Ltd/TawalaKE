"use client";

import { useEffect, useState } from "react";

export type UnitOption = { code: string; label: string };
export type CategoryOption = { code: string; name: string; id?: string };

/** Fallback if API unavailable — same seeds as backend DEFAULT_* */
export const FALLBACK_UNITS: UnitOption[] = [
  { code: "pcs", label: "Pieces (PCS)" },
  { code: "pair", label: "Pairs (PR)" },
  { code: "set", label: "Sets (SET)" },
  { code: "dozen", label: "Dozens (DZN)" },
  { code: "kg", label: "Kilograms (KG)" },
  { code: "g", label: "Grams (G)" },
  { code: "l", label: "Liters (L)" },
  { code: "ml", label: "Milliliters (ML)" },
  { code: "box", label: "Box" },
  { code: "pack", label: "Pack" },
  { code: "carton", label: "Carton" },
  { code: "bag", label: "Bag / Sack" },
  { code: "m", label: "Meters (M)" },
  { code: "unit", label: "Unit" },
  { code: "other", label: "Other Unit" },
];

export const FALLBACK_CATEGORIES: CategoryOption[] = [
  { code: "beverages", name: "Beverages & Drinks" },
  { code: "packaged_foods", name: "Packaged Foods & Groceries" },
  { code: "fresh_produce", name: "Fresh Produce & Grains" },
  { code: "bakery", name: "Bakery & Confectionery" },
  { code: "household", name: "Household & Cleaning" },
  { code: "personal_care", name: "Personal Care & Toiletries" },
  { code: "pharmacy", name: "Pharmacy & Medications" },
  { code: "agrovet", name: "Agrovet & Farming Supplies" },
  { code: "hardware", name: "Hardware & Tools" },
  { code: "electrical", name: "Electrical & Electronics" },
  { code: "clothing", name: "Clothing & Apparel" },
  { code: "beauty", name: "Beauty & Cosmetics" },
  { code: "food_service", name: "Fast Food & Restaurant Supplies" },
  { code: "cooking_ingredients", name: "Cooking Ingredients & Spices" },
  { code: "services", name: "Services & Labor" },
  { code: "digital", name: "Digital Products & Airtime" },
  { code: "other", name: "Other / Miscellaneous" },
];

export function useCatalogOptions(businessId?: string | null) {
  const [units, setUnits] = useState<UnitOption[]>(FALLBACK_UNITS);
  const [categories, setCategories] = useState<CategoryOption[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [uRes, cRes] = await Promise.all([
          fetch("/api/v1/catalog/units", { credentials: "include", cache: "no-store" }),
          fetch(
            `/api/v1/catalog/categories${businessId ? `?business_id=${businessId}` : ""}`,
            { credentials: "include", cache: "no-store" },
          ),
        ]);
        if (!cancelled && uRes.ok) {
          const body = await uRes.json();
          const list = Array.isArray(body?.data) ? body.data : [];
          if (list.length) {
            setUnits(
              list.map((r: { code: string; label: string }) => ({
                code: r.code,
                label: r.label,
              })),
            );
          }
        }
        if (!cancelled && cRes.ok) {
          const body = await cRes.json();
          const list = Array.isArray(body?.data) ? body.data : [];
          if (list.length) {
            setCategories(
              list.map((r: { id?: string; code?: string; name: string }) => ({
                id: r.id,
                code: r.code || r.name,
                name: r.name,
              })),
            );
          }
        }
      } catch {
        // keep fallbacks
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  return { units, categories, loading };
}
