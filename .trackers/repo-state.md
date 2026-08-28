# Repository State

**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git  
**Default branch:** `main` (integration branch for this work: `dev`)  
**Current branch:** `fix/credit-sale-tracking-and-invoice`  
**Base tip:** `5f794e2` (`dev`)  
**Focus:** Credit sale finalize + invoice for collection

## Notes
- Live checkout path: `POST /api/v1/business/new-sale` + `POST /api/v1/business/checkout` via `store_crud`
- Wire payment method for credit remains `INVOICE` (enum/DB compatibility)
- `.skills/` still only on `main` (not on `dev`); agent loaded skills from `main` for this task
