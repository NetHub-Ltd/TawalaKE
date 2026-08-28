# Product inventory integrity (Phase A + B)

## Rules
1. Never change `Product.stock` without a matching `StockHistory` row.
2. Sale init: product must belong to `business_id`, be active, not soft-deleted; stock checked when `track_stock`.
3. Sale finalize: `SELECT … FOR UPDATE` on products, re-check qty, never go negative; history includes `organization_id` and `reference_id`.
4. Restock: business-scoped, `PURCHASE` movement, optional cost/price update.
5. Audit: business-scoped, absolute count → stock; history `quantity` is **delta**.
6. Product PATCH cannot set `stock`.
7. Credit void: `POST /business/sales/{sale_id}/void-credit` restores stock (`RETURN`) and sets status `REFUNDED`.

Live path: `store_crud` only. `crud/sale.py` is legacy.
