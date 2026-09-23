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
with a **total in toman** and **one row per asset**. `src/assets.ts` still ships
static sample data (illustrative only), but the owner can now add/edit/delete their
own real assets through a small in-page form, or bulk-import them from a fixed
Excel template (see §6a); those real values are persisted ONLY in the browser's
`localStorage` (see §4/§5) and are never committed to git. No charts, navigation,
backend, or native tooling beyond add/edit/delete and the fixed-template Excel
import (by explicit owner constraint).

## 2. Hard constraints (do not break)

1. Show ONLY a toman total and one row per asset.
2. Do NOT add charts, navigation, backend, native tooling, or any other feature
   beyond add/edit/delete of assets and the fixed-template Excel import (§6a)
   **unless the owner explicitly asks**. The Excel import must stay locked to the
   one fixed template — never auto-detect columns or accept other layouts.
3. Palette: light grey background, white cards, blue/violet accents.
4. The sample badge/disclaimer must only show while the current list is still the
   untouched static sample data (see §5/§6) — hide it once the owner adds, edits,
   or deletes anything.
5. Real asset values entered by the owner must live ONLY in browser `localStorage`
   (`src/storage.ts`) — never write them into `src/assets.ts` or any committed file.
6. NEVER commit private financial data or credentials.

## 3. Tech stack

| Layer | Choice | Version (see `package.json`) |
| ----- | ------ | ---------------------------- |
| UI | React | 19.2.3 |
| Language | TypeScript (strict) | ^5.9.3 |
| Bundler/dev server | Vite | ^7.1.0 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | ^4.3.3 |
| Font | @fontsource/vazirmatn | ^5.2.0 |
| Excel parsing | `xlsx` (SheetJS), client-side only | ^0.18.5 |
| Toast/notification | `sonner` (`<Toaster richColors/>` mounted once in `src/main.tsx`) | ^2.0.8 |
| Runtime | Node.js | 22.13+ |

RTL via `<html lang="fa" dir="rtl">`. Numbers formatted with `Intl.NumberFormat('fa-IR')`
(Persian digits).

## 4. File map

| File | Responsibility |
| ---- | -------------- |
| `index.html` | Document shell: RTL, Vazirmatn-ready, `<title>Oracle \| سرمایه‌های من</title>`, loads `/src/main.tsx`. |
| `src/main.tsx` | React entry: mounts `<App/>` plus a single `sonner` `<Toaster dir="rtl" position="top-center" richColors/>` in `<div id="root">` under `StrictMode`; imports Vazirmatn 400/500/700 + `styles.css`. |
| `App.tsx` | Entire UI: `format()` helper, `AssetIcon`/`AssetRow`/`UploadIcon` components, `parseImportRows()` (fixed-template Excel parser, see §6a), and the default `App` (header + summary + portfolio incl. import toolbar + add-asset form + conditional sample note). Holds the asset list in `useState`, initialized from `loadAssets()` (falling back to the static `assets` sample) and persisted via `saveAssets()` on every change. |
| `src/assets.ts` | `Asset` type + `assets` sample array. Now the **default/fallback** data only — real owner data lives in `localStorage` via `src/storage.ts`, not here. |
| `src/storage.ts` | `loadAssets()`/`saveAssets()` — read/write the asset list to `localStorage` under key `oracle_assets_v1`, wrapped in try/catch so a browser that blocks storage doesn't crash the app (`loadAssets` returns `null`, `saveAssets` no-ops on failure). |
| `src/styles.css` | Single line: `@import "tailwindcss";` (Tailwind v4 entry, no config file). |
| `vite.config.ts` | Registers the `@tailwindcss/vite` plugin. |
| `tsconfig.json` | Strict TS config; includes `App.tsx` + `src`. |
| `AGENTS.md` | Short agent rules + governance + pointer to this file. |
| `README.md` | Owner-facing Persian run/data notes. |

## 5. Data model (`src/assets.ts`)

```ts
type Asset = {
  id: string;            // key (crypto.randomUUID() for owner-added rows)
  name: string;          // Persian display name
  quantity: number;      // amount held
  unit: string;          // Persian unit label (گرم, واحد, تومان, USDT, ...)
  unitPrice: number;     // price per unit, in toman (cash = 1)
  icon: 'gold' | 'fund' | 'cash' | 'usdt' | 'btc' | 'eth' | 'other';
};
```

- Row value = `quantity × unitPrice` (toman).
- Page total = `items.reduce((s,a)=> s + a.quantity*a.unitPrice, 0)` over the live
  `items` state in `App.tsx` (not the raw `assets` import).
- Cash `unitPrice = 1`, so its row value equals its quantity.
- `src/assets.ts` ships 7 sample assets (gold, two gold funds, cash, Tether, BTC,
  ETH) — **illustrative only**, unchanged, used purely as the default when
  `localStorage` has nothing saved yet.
- `icon: 'other'` is for anything that doesn't fit the 6 built-in categories (e.g.
  individual stocks/funds); it reuses the default bar-chart `AssetIcon` SVG with its
  own neutral grey tint (see §7).
- The real, owner-entered list (post add/edit/delete) is held in React state in
  `App.tsx` and persisted to `localStorage` via `src/storage.ts` — see §6.

## 6. UI architecture (`App.tsx`)

- `format(value, decimals = 0)` → `Intl.NumberFormat('fa-IR')`. Quantity rendered with 8 decimals.
- `AssetIcon({type})`:
  - `btc` → `₿`, `usdt` → `₮` (styled span, Arial)
  - otherwise inline SVG: `gold`, `cash`, `eth`, default = bar chart (also used for `other`).
- `AssetRow` — one asset `<li>`: icon, name, quantity/unit (or, in edit mode, number
  inputs for quantity + unit price with save/cancel), value, and ویرایش/حذف buttons.
  Edit mode is local `useState` per row; only quantity and unit price are editable
  inline (no separate edit page/route). Delete calls the parent's `onDelete(id)`.
- App-level state: `items` (`Asset[]`, initialized from `loadAssets() ?? assets`,
  persisted to `localStorage` via `useEffect` on every change) and `isSample`
  (`boolean`, `true` only if `loadAssets()` returned `null` on first render; flips to
  `false` permanently once the owner adds, edits, or deletes anything).
- Styling is inline Tailwind utility classes (see §7) — there are no longer named CSS
  classes like `.header`/`.summary`/`.asset-row`; identify sections by their JSX/aria
  structure instead.
- Layout (top → bottom):
  1. `<header>` → brand link (icon + `Oracle` + caption `سرمایه‌های من`) and a note span (`یک نگاه، همهٔ دارایی‌ها`).
  2. Summary `<section>` (`aria-labelledby="total-title"`) → sample badge (only when `isSample`), `ارزش کل دارایی‌ها`, big total (toman), footer with asset count.
  3. Portfolio `<section>` (`aria-labelledby="assets-title"`) → Excel-import toolbar
     (see §6a) above the heading row, then `<ul>` of `AssetRow` items (icon, name +
     quantity/unit, value + `تومان`, ویرایش/حذف).
  4. Add-asset `<section>` (`aria-labelledby="add-asset-title"`) → inline form (name, icon/category select incl. `other`, quantity, unit, unit price) that validates and appends a new `Asset` with `crypto.randomUUID()`.
  5. Trailing `<p>` disclaimer that values are samples — only rendered when `isSample`.

## 6a. Excel import (fixed template only)

- Toolbar row above the "دارایی‌های من" heading in the portfolio `<section>`: a single
  "ایمپورت اکسل" button (violet pill, `UploadIcon` — inline stroke-based upload SVG,
  matches `AssetIcon` style) that triggers a visually hidden `<input type="file"
  accept=".xlsx,.xls">` via a `ref` + `.click()`. No drag-and-drop zone, no other
  format support — a plain file picker only.
- Parsing (`XLSX.read`/`XLSX.utils.sheet_to_json(sheet, { header: 1 })` from the
  `xlsx` npm package, entirely client-side — no backend, no network request):
  1. First sheet only. Row 1 must exactly equal (trimmed) the 5 fixed headers, in
     this exact order: `نام دارایی`, `دسته‌بندی`, `تعداد`, `واحد`,
     `قیمت واحد (تومان)`. Any mismatch → inline error `فرمت فایل با قالب مورد
     انتظار مطابقت ندارد` and nothing is imported (no partial import).
  2. From row 2 on, rows are read until the first row that is fully empty or whose
     `تعداد` (3rd column) is not a positive number — that's where the template's
     trailing legend/notes text lives, so it's implicitly skipped.
  3. `دسته‌بندی` must be one of the 7 fixed Persian labels, mapped to the internal
     `Asset['icon']` key: `طلا→gold`, `صندوق→fund`, `نقد→cash`, `تتر→usdt`,
     `بیت‌کوین→btc`, `اتریوم→eth`, `سایر→other`. Rows with any other category value
     are skipped (counted, not fatal) — parsing continues to the next row.
  4. Each valid row becomes an `Asset` (`id: crypto.randomUUID()`, `name` = col 1,
     `quantity`/`unitPrice` = cols 3/5 as numbers, `unit` = col 4) appended to the
     existing `items` state (never replaces it) — same state/persistence path as the
     manual add/edit/delete form, so `saveAssets()` fires automatically.
- All user-facing outcomes are shown via `sonner` toasts (see §3), not inline page
  text; the toast library handles its own timing/dismissal. Wrong file extension and
  header mismatch → `toast.error`. All rows valid → `toast.success`. Some rows
  skipped as invalid (partial import) → `toast.warning`. Zero rows importable (all
  invalid) → `toast.error`.
- This is intentionally a single hardcoded template — do NOT add column
  auto-detection, alternate layouts, CSV, or other spreadsheet formats.

## 7. Design system (Tailwind CSS v4)

- Styling is done entirely with Tailwind utility classes directly in `App.tsx` / `index.html`.
  `src/styles.css` is just `@import "tailwindcss";` — no `tailwind.config.*` file needed
  (v4 + `@tailwindcss/vite` needs zero config for this app). Do NOT add a component
  library (no DaisyUI/shadcn/Chakra/Mantine) — Tailwind utilities only.
- None of the exact colors below are default Tailwind palette colors, so they are all
  expressed with **arbitrary value syntax** (e.g. `bg-[#f5f6fb]`, `text-[#4659d9]`)
  rather than inventing a new named palette. Keep reusing the same hex literals when
  touching this UI so tokens stay consistent.
- Key tokens (unchanged from the original design):
  - Header/brand: `#5264e8`; accent number: `#4659d9`; dot: `#8593ee`.
  - Page bg: `#f5f6fb`; card: `#fff`; borders: `#eceef8` / `#eef0f7`.
  - Icon tints: gold `#d7a144/#fff5df`, fund `#6e68dc/#f0edff`, cash `#4ab3b4/#e5f7f6`, usdt `#3daf99/#e6f6f0`, btc `#efa451/#fff1e3`, eth `#617cdb/#ecf0ff`, other `#6b7280/#eef0f3` (neutral grey, for anything outside the 6 built-in categories — reuses the default bar-chart `AssetIcon` glyph).
  - `.section-heading` "ارزش به تومان" label was `#9198ad` on white (~2.9:1 contrast,
    fails WCAG AA). Fixed to `#656e87` (~4.7:1, passes AA for small text). This is the
    only intentional color change in the Tailwind migration.
- Responsive breakpoints, expressed as Tailwind arbitrary variants to match the original
  CSS breakpoints exactly: `min-[1050px]:` (2-col sticky summary), `max-[481px]:`
  (mirrors the old `max-width:480px`), `max-[351px]:` (mirrors `max-width:350px`), and
  `[@media(min-width:351px)_and_(max-width:480px)]:` for the narrow phone-only tier.
  Note: Tailwind's bare `max-[480px]:` compiles to `not (min-width:480px)`, i.e.
  `width < 480`, which is off-by-one vs the original inclusive `max-width:480px`
  (`width <= 480`) — hence `481`/`351` are used to keep the exact same breakpoint.
- Header height: 224px base, 220px (≥1050px), 198px (≤480px).
- Toast colors (via `sonner`'s `richColors`, see §3/§4): `toast.success` = green,
  `toast.warning` = yellow, `toast.error` = red, `toast.info` = blue (not yet used,
  but supported). Follow this same success/warning/error/info mapping for any
  future toast added to the app.

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
| 2026-09-23 | Migrated styling from hand-written `src/styles.css` to Tailwind CSS v4 (`@tailwindcss/vite`, zero-config). Tooling-only change — no visual/layout change intended, except fixing the low-contrast `.section-heading` label (`#9198ad` → `#656e87`). |
| 2026-09-23 | Owner-requested: added local persistence (`src/storage.ts`, `localStorage` key `oracle_assets_v1`) plus an in-page add/edit/delete form, so the owner can maintain their real asset list without ever writing real values into git. `src/assets.ts` is now only the default sample fallback. Added `icon: 'other'` category (reuses the default bar-chart icon, neutral grey tint) for assets outside the 6 built-in types. Sample badge/disclaimer now only show while the list is still the untouched default. |
| 2026-09-23 | Owner-requested: added Excel bulk import for assets, locked to one fixed template (5 columns, 7 fixed Persian category labels — see §6a). Added `xlsx` (SheetJS) as a dependency; parsing is 100% client-side (no backend/network). Imported rows are appended to the same `items` state as manual add/edit/delete, so they persist via the existing `localStorage` path. Explicitly not a general-purpose importer — no column auto-detection or other file formats. |
| 2026-09-23 | Color-coded toasts: enabled `sonner`'s `richColors` on `<Toaster/>` (green/success, yellow/warning, red/error, blue/info). Excel import now uses `toast.warning` for partial imports (some rows skipped) instead of `toast.success`, and `toast.error` when zero rows are importable; full success and format/type errors unchanged. No `toast.info` calls added yet. |

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

- ✅ Done (2026-09-23): Persist the owner's real values in the browser (localStorage) — keep them out of git.
- ✅ Done (2026-09-23): Editable rows (a small inline edit) while still showing only a toman total.

These remain ideas only; implement any of them **only when the owner asks**:
- Live price fetch for crypto/gold (requires a data source + key handling).
- Multiple portfolios / categories, or a debts section.
- Dark mode.
