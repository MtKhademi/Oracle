# Oracle — AI-Agent Knowledge Base

This file is the durable source of truth for AI agents working on this app.
Read it (plus `README.md` and `src/assets.ts`) before changing anything.
Keep it current whenever behavior, structure, or decisions change.

- **App name / brand:** `Oracle`
- **Owner (approver):** `MtKhademi` (GitHub)
- **Admin (day-to-day maintainer):** the AI agent working in this repo
- **Working model:** owner + agent only; changes go through a branch + PR

---

## 1. What this app is

A single-page, Persian (RTL) asset overview. It shows a light-grey, white-card UI
with a **total in toman** and **one row per asset**. Values are static samples —
never the owner's real holdings or live prices. No forms, charts, imports,
navigation, backend, or native tooling (by explicit owner constraint).

## 2. Hard constraints (do not break)

1. Show ONLY a toman total and one row per asset.
2. Do NOT add forms, charts, imports, navigation, backend, native tooling, or any
   other feature **unless the owner explicitly asks**.
3. Palette: light grey background, white cards, blue/violet accents.
4. Sample data must always be labeled as a sample ("نمایش نمونه", "مقادیر ... نمونه‌اند").
5. NEVER commit private financial data or credentials.

## 3. Tech stack

| Layer | Choice | Version (see `package.json`) |
| ----- | ------ | ---------------------------- |
| UI | React | 19.2.3 |
| Language | TypeScript (strict) | ^5.9.3 |
| Bundler/dev server | Vite | ^7.1.0 |
| Font | @fontsource/vazirmatn | ^5.2.0 |
| Runtime | Node.js | 22.13+ |

RTL via `<html lang="fa" dir="rtl">`. Numbers formatted with `Intl.NumberFormat('fa-IR')`
(Persian digits).

## 4. File map

| File | Responsibility |
| ---- | -------------- |
| `index.html` | Document shell: RTL, Vazirmatn-ready, `<title>Oracle \| سرمایه‌های من</title>`, loads `/src/main.tsx`. |
| `src/main.tsx` | React entry: mounts `<App/>` in `<div id="root">` under `StrictMode`; imports Vazirmatn 400/500/700 + `styles.css`. |
| `App.tsx` | Entire UI: `format()` helper, `AssetIcon` component, and the default `App` (header + summary + portfolio + sample note). |
| `src/assets.ts` | `Asset` type + `assets` sample array (the only data source). |
| `src/styles.css` | All styling, one minified line. |
| `tsconfig.json` | Strict TS config; includes `App.tsx` + `src`. |
| `AGENTS.md` | Short agent rules + governance + pointer to this file. |
| `README.md` | Owner-facing Persian run/data notes. |

## 5. Data model (`src/assets.ts`)

```ts
type Asset = {
  id: string;            // key
  name: string;          // Persian display name
  quantity: number;      // amount held
  unit: string;          // Persian unit label (گرم, واحد, تومان, USDT, ...)
  unitPrice: number;     // price per unit, in toman (cash = 1)
  icon: 'gold' | 'fund' | 'cash' | 'usdt' | 'btc' | 'eth';
};
```

- Row value = `quantity × unitPrice` (toman).
- Page total = `assets.reduce((s,a)=> s + a.quantity*a.unitPrice, 0)`.
- Cash `unitPrice = 1`, so its row value equals its quantity.
- 7 sample assets: gold, two gold funds (عیار, گنج), cash, Tether, BTC, ETH.
- **All values are illustrative.** Keep them clearly marked as samples.

## 6. UI architecture (`App.tsx`)

- `format(value, decimals = 0)` → `Intl.NumberFormat('fa-IR')`. Quantity rendered with 8 decimals.
- `AssetIcon({type})`:
  - `btc` → `₿`, `usdt` → `₮` (`.coin-letter`)
  - otherwise inline SVG: `gold`, `cash`, `eth`, default = bar chart.
- Layout (top → bottom):
  1. `.header` → `.brand` (icon + `Oracle` + caption `سرمایه‌های من`) and `.header-note` (`یک نگاه، همهٔ دارایی‌ها`).
  2. `.summary` card → sample badge, `ارزش کل دارایی‌ها`, big `.total` (toman), footer with asset count.
  3. `.portfolio` → `.asset-list` of `.asset-row` (icon, name + quantity/unit, value + `تومان`).
  4. `.sample-note` → disclaimers that values are samples.

## 7. Design system (`src/styles.css`)

- One minified line; keep it that way.
- Key tokens:
  - Header/brand: `#5264e8`; accent number: `#4659d9`; dot: `#8593ee`.
  - Page bg: `#f5f6fb`; card: `#fff`; borders: `#eceef8` / `#eef0f7`.
  - Icon tints: gold `#d7a144/#fff5df`, fund `#6e68dc/#f0edff`, cash `#4ab3b4/#e5f7f6`, usdt `#3daf99/#e6f6f0`, btc `#efa451/#fff1e3`, eth `#617cdb/#ecf0ff`.
- Responsive breakpoints: `min-width:1050px` (2-col sticky summary), `max-width:480px`, `max-width:350px`.
- Header height: 224px base, 220px (≥1050px), 198px (≤480px).

## 8. Build & run

```sh
npm ci                 # install (lockfile present)
npm run dev            # vite --host 0.0.0:0 (use printed IP for phone on LAN)
npm run build          # tsc --noEmit && vite build  -> dist/
npm run preview        # serve the built dist/
npm run typecheck      # tsc --noEmit
```

**Run `npm run build` before delivering any change** (typecheck + bundle must pass).

## 9. Naming & copy rules

- **Brand = `Oracle`** (package name `oracle`, UI brand, docs title).
- **`دارایی` = "asset"** (generic Persian word). It is intentionally NOT the brand and
  must stay in copy like `دارایی‌های من` (my assets), `ارزش کل دارایی‌ها`, etc.
- Never do a blind `دارایی` → `Oracle` replace — it would corrupt UI copy.

## 10. Repository state

- Remote: `https://github.com/MtKhademi/Oracle.git` (renamed from `Darayi`; old URL redirects).
- Branch: `main` (default). Non-trivial changes: feature branch → PR → merge.
- `.gitignore` excludes `node_modules/`, `dist/`, `.expo/`, `android/`, `ios/`, keystores,
  `.env*` (keeps `.env.example`), `*.xlsx/csv`, logs.
- Git history (oldest → newest): initial → offline Excel asset manager (Expo) →
  replaced Expo with responsive React overview → renamed Darayi → Oracle.

## 11. Decision log

| Date | Decision |
| ---- | -------- |
| 2026-09-23 | Replaced the Expo native app with a plain React + Vite web overview. |
| 2026-09-23 | Renamed project **Darayi → Oracle** (package name, docs, UI brand); kept Persian "asset" copy. |
| 2026-09-23 | Established single-agent governance: AI agent is admin, owner approves via PR. |

## 12. Agent playbook (how to progress this app)

For every change:
1. Read this file + `README.md` + `src/assets.ts`.
2. Confirm it does not violate the hard constraints (§2). If it adds a feature,
   it must be explicitly requested by the owner.
3. Make the **minimal** edit; follow existing style (no comments unless asked).
4. `npm run build` must pass.
5. Branch + commit (clear message) + push + open a PR to `main`. Update this file
   and `AGENTS.md`/`README.md` if behavior/structure/decisions changed.

## 13. Candidate next steps (NOT approved — needs owner request)

These are ideas only; implement any of them **only when the owner asks**:
- Persist the owner's real values in the browser (localStorage) — keep them out of git.
- Editable rows (a small inline edit) while still showing only a toman total.
- Live price fetch for crypto/gold (requires a data source + key handling).
- Multiple portfolios / categories, or a debts section.
- Dark mode.
