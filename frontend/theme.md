# SaaS Design System & Theming Architecture

This application leverages **Tailwind CSS v4**'s native `@theme` engine. By migrating configuration from JavaScript object declarations (`tailwind.config.js`) directly into CSS custom properties, our build pipeline eliminates runtime configuration overhead and natively hooks token references into standard CSS variables.

---

## 1. Architectural Philosophy: The "Layered Lifting" Paradigm

Unlike traditional flat designs where pages and components share identical background values, this platform utilizes a high-contrast stacking model to establish immediate visual hierarchy:

* **The Deep Base Layer (`--surface`):** Assigned directly to the document `<body>`. This acts as the canvas environment. In Light Mode, it presents a muted gray background; in Dark Mode, it becomes a rich, deep midnight void.
* **The Elevated Interactive Layer (`--background`):** Used strictly for high-priority sections, components, cards, or focus panels (e.g., using `.card-layered`). It physically "lifts" content away from the backdrop canvas to create distinct visual focus boundaries without heavy layout structural changes.

### Stacking Execution Guidelines
When structuring application pages, follow this layout hierarchy:
```tsx
// Correct Implementation
<main className="bg-surface text-foreground"> {/* The canvas */}
  <section className="card-layered bg-background"> {/* The content pod */}
    <p className="text-muted">Meta Detail</p>
  </section>
</main>