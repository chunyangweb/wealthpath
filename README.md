# moneygrowth

> Project your personal cash flow and check liquidity across French savings and investment products.

A static web app that helps you simulate your future cash position based on how you allocate across **Livret A, LDDS, LEP, CEL, PEL, PEA, assurance-vie, PER, CTO** and a user-defined custom product. Two distinct views: a **projection** of total cash position, and a separate **liquidity** view that tells you when your money is actually accessible.

**Live:** https://chunyangweb.github.io/moneygrowth (after first deploy)

**100% client-side.** No accounts, no server, no tracking. Your data stays in your browser's localStorage.

---

## Status

| Milestone | What | Status |
|---|---|---|
| M0 | Repo scaffolded, CI deploying to Pages | ✅ Done |
| M1 | Inputs page (income, expenses, balance) + localStorage + design system | ✅ Done |
| M2 | Product catalog + allocation sliders + profile selector + custom product slot | ✅ Done |
| M3 | Projection engine + chart on allocation page | Next |
| M4 | Liquidity engine + liquidity chart + snapshots + warnings | Pending |
| M5 | Summary page + JSON export/import | Pending |
| M6 | Final accessibility audit + polish | Pending |

---

## What works right now

**Home page** — hero, CTA, feature cards, language toggle.

**Inputs page** (M1):
- Situation dropdown (Étudiant / Salarié / Indépendant)
- Household type
- Current liquid balance
- Income / recurring expense / one-off expense lists
- Horizon picker: 1 / 2 / 3 / 5 / 10 years
- Live summary widget
- Auto-save to localStorage

**Allocation page** (M2):
- **Profile selector**: Prudent / Équilibré / Dynamique — snaps sliders to a starting allocation tailored to your situation
- **11 product sliders**: Livret A, LDDS, LEP, Livret Jeune, CEL, PEL, Assurance-vie (fonds euros + UC), PEA, PER, CTO
- **Editable rates**: click the rate badge next to any product to override the default with your own (e.g. if your bank pays a different super-livret rate)
- **Custom product slot**: a 12th slider where you define name, rate (treated as net of tax), and pool (liquid/locked)
- **Pool indicators**: color dots next to each product show liquidity category (green = liquid, amber = semi-liquid, gray = locked)
- **Lock icons**: products with lock-in show a small icon with a tooltip explaining the constraint
- **Cap awareness**: each slider's max is the product's regulated cap (e.g. €22,950 for Livret A)
- **Allocation total card**: shows how much you've allocated vs. your capital, with over-allocation warning
- Projection and Liquidity placeholders for M3 and M4

**Summary** — placeholder for M5.

---

## Product catalog

All rates verified Feb 2026 against official sources (service-public.gouv.fr, economie.gouv.fr). Source URLs are stored in the catalog file for audit.

The 2026 LFSS fiscal change is encoded correctly: social charges raised from 17.2% to **18.6%** for PEA, PER, and CTO; kept at 17.2% for assurance-vie, PEL, and CEL.

---

## Stack

Same as M1 plus:
- Product catalog as plain TypeScript data (no runtime cost, full type safety)
- Suggestion engine (`lib/finance/suggestion.ts`) computing default allocations per situation × profile

---

## Local development

```bash
git clone https://github.com/chunyangweb/moneygrowth.git
cd moneygrowth
npm install
npm run dev
```

Open http://localhost:5173/moneygrowth/.

### Commands

```bash
npm run dev        # Dev server with hot reload
npm run build      # Production build → dist/
npm test           # Run tests once
npm run test:watch # Tests in watch mode
npm run lint       # ESLint
npm run format     # Prettier
```

---

## Architecture

`lib/` is pure. No React, no DOM, no globals — all financial math is unit-testable in isolation.

```
src/
├── routes/              Pages — thin, no business logic
├── components/
│   ├── layout/          AppShell, Sidebar, TopBar
│   ├── inputs/          CashFlowRow
│   ├── allocation/      ProductSlider, CustomProductSlider, ProfileSelector, AllocationTotalCard
│   ├── projection/      M3 — chart
│   ├── liquidity/       M4 — chart + warnings
│   └── ui/              Card, Button, Input
├── lib/
│   ├── finance/         suggestion (M2), projection (M3), liquidity (M4), tax (M3)
│   ├── storage/         localStorage + Zod schemas
│   ├── i18n/            FR + EN translations
│   └── utils/           formatCurrency, createId, frequencyToMonthly
├── state/               Zustand stores: userInputs, allocation, settings
├── types/               Type definitions
└── data/                products.fr.ts — single source of truth for French products
```

---

## License

MIT — see [LICENSE](./LICENSE).

Copyright © 2026 Chunyang Wang
