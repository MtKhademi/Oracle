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
| Password hashing | `js-sha256` (pure JS SHA-256, no Web Crypto API) | ^1.0.0 |
| Toast/notification | `sonner` (`<Toaster richColors/>` mounted once in `src/main.tsx`) | ^2.0.8 |
| Runtime | Node.js | 22.13+ |

RTL via `<html lang="fa" dir="rtl">`. Numbers formatted with `Intl.NumberFormat('fa-IR')`
(Persian digits).

## 4. File map

| File | Responsibility |
| ---- | -------------- |
| `index.html` | Document shell: RTL, Vazirmatn-ready, `<title>Oracle \| سرمایه‌های من</title>`, loads `/src/main.tsx`. |
| `src/main.tsx` | React entry: mounts `<App/>` plus a single `sonner` `<Toaster dir="rtl" position="top-center" richColors/>` in `<div id="root">` under `StrictMode`; imports Vazirmatn 400/500/700 + `styles.css`. |
| `App.tsx` | Thin composition root: `parseImportRows()` (fixed-template Excel parser, see §6a), the asset list `useState` (starts as the static `assets` sample with `isSample=true`; a mount-time `useEffect` calls `assetService.listAssets()` and swaps in the stored list + `isSample=false` if anything was previously saved), `isAddOpen` state, and the Excel-import/clear-all/add/edit/delete handlers — each of which is now `async` and calls the matching `assetService.xxx(...)` method, awaits the returned full list, and sets it into state (see §6d). A separate mount-time `useEffect` calls `authService.getCurrentUser()` into `currentUser`/`isAuthChecked` state (see §6g); while unchecked, a minimal loading screen renders, and once checked, `currentUser === null` renders `<AuthScreen>` instead of the dashboard. Once authenticated, renders `<SummaryCard>`, `<Toolbar>`, the list of `<AssetRow>`, and `<AddAssetModal>` (see §6, §6c) — no longer holds any icon/button/modal markup itself, and no longer touches `localStorage` directly. `handleLogout` calls `authService.logOut()`, clears `currentUser`, and closes the drawer; passed to `<SideDrawer onLogout>`. |
| `src/components/icons.tsx` | Shared small stroke-based SVG icon components: `UploadIcon`, `TrashIcon`, `PlusIcon`, `CloseIcon`, `PencilIcon`, `UserIcon`, `SettingsIcon`, `InfoIcon`, `HelpIcon`, `LogoutIcon` (all `w-4 h-4 block`, `viewBox="0 0 24 24"`, `fill="none" stroke="currentColor" strokeWidth="1.8"`), plus `HamburgerIcon` (`w-[30px] h-[30px] block`, same stroke style, three horizontal lines — used only in the header, see §6e) and `UserAvatarPlaceholderIcon` (`w-11 h-11 block`, same person glyph as `UserIcon` at a larger size — the profile avatar's empty-state placeholder, see §6f). Used by `Toolbar`/`AssetRow`/`AddAssetModal`/`SideDrawer`/`ProfileModal`/`App.tsx` — no icon markup duplicated elsewhere. |
| `src/components/IconButton.tsx` | Single reusable small icon-button component (`icon`, `onClick`, `ariaLabel`, `tone: 'neutral' \| 'danger'`, `variant: 'filled' \| 'ghost'`). `tone` controls the hover/background color (blue/violet tint for neutral, red tint for danger); `variant` distinguishes the toolbar's always-tinted `'filled'` buttons from the asset row's `'ghost'` (transparent-until-hover) edit/delete buttons. This is the ONLY icon-button implementation in the app — every small icon button (import/clear-all/add in the toolbar, edit/delete on each row) renders `<IconButton/>`, no hand-written button markup remains duplicated. |
| `src/components/AssetIcon.tsx` | `AssetIcon({type})` (per-asset-category glyph) + the `iconTint` color map, relocated unchanged from `App.tsx`. Used by `SummaryCard` (cash icon) and `AssetRow`. |
| `src/components/Toolbar.tsx` | The row of `IconButton`s above "دارایی‌های من" (import-excel / clear-all / add). Takes `onImportFile`/`onClearAll`/`onAdd` callback props from `App.tsx`; owns the hidden file `<input>` + its `ref`. |
| `src/components/AssetRow.tsx` | One asset `<li>` (icon, name, quantity/unit or inline edit inputs, value, edit/delete `IconButton`s). Local `useState` for inline edit mode (quantity/unit-price only). Takes `asset` + `onEdit`/`onDelete` callback props. |
| `src/components/SummaryCard.tsx` | The summary card showing the total (toman), sample badge, and asset count. Takes `total`/`count`/`isSample` props. |
| `src/components/AddAssetModal.tsx` | The add-asset modal + form (name/category/quantity/unit/unit-price), including the `stripToNumberString`/`formatWithThousands` comma-formatting logic for the quantity/unit-price inputs (see §6c). Takes `onClose`/`onAdd` callback props; owns its own form state and the `Escape`-key listener. |
| `src/components/SideDrawer.tsx` | The header's side-menu drawer (see §6e): slide-in-from-right panel + backdrop, containing the menu item list. مشخصات opens the profile view (`onOpenProfile` prop, see §6f); خروج now calls `onLogout` (real logout, see §6g); تنظیمات/درباره Oracle/راهنما remain placeholders that just close the drawer. Takes `onClose`/`onOpenProfile`/`onLogout` props; owns its own open/close slide-in animation state and the `Escape`-key listener. |
| `src/components/ProfileModal.tsx` | The مشخصات (profile) modal (see §6f): avatar (image or placeholder icon) + "تغییر عکس" file picker, and نام و نام خانوادگی/شماره تماس/ایمیل inputs, pre-filled from `profileService.getProfile()` on open. Save button calls `profileService.saveProfile(...)`, shows a success toast, then closes. Takes only `onClose`; owns its own form state and the `Escape`-key listener. |
| `src/components/AuthScreen.tsx` | Full-page login/signup screen (see §6g), shown instead of the dashboard when no user is logged in. Tab toggle between "ورود" and "ثبت‌نام", styled with the same card/input tokens as `AddAssetModal`/`ProfileModal`. Login calls `authService.logIn(...)`; signup calls `authService.signUp(...)` (client-side password/repeat match check first). On success calls the `onAuthenticated(user)` prop; on failure shows `toast.error(result.error)`. Renders `<ForgotPasswordModal>` when its "رمز عبور را فراموش کرده‌اید؟" link is clicked. |
| `src/components/ForgotPasswordModal.tsx` | Two-step password-reset modal (see §6g), reusing the `AddAssetModal` overlay pattern. Step 1 asks for email/phone, calls `authService.requestPasswordReset(identifier)`, and shows the returned `simulatedCode` in a long-lived `toast(...)` (**simulated — not a real email/SMS send**, see §6g). Step 2 asks for the 6-digit code + new password (+ repeat, matched client-side), calls `authService.resetPassword(...)`. Takes only `onClose`. |
| `src/format.ts` | Shared `format(value, decimals = 0)` → `Intl.NumberFormat('fa-IR')` helper, used across `App.tsx` and the components above. |
| `src/assets.ts` | `Asset` type + `assets` sample array. Now the **default/fallback** data only — real owner data lives in `localStorage`, behind the service layer below, not here. |
| `src/services/assetService.ts` | Defines the `AssetService` interface (`listAssets`/`addAsset`/`updateAsset`/`deleteAsset`/`importAssets`/`clearAssets`, all `Promise`-returning) and exports the single `assetService` instance the whole app imports — currently `= localAssetService`. This is the ONLY line that needs to change to swap in a server-backed implementation later; no component/`App.tsx` code would need to change (see §6d). |
| `src/services/localAssetService.ts` | The `localAssetService: AssetService` implementation, backed by `src/storage.ts`'s `loadAssets`/`saveAssets`. Each method reads the current list, applies the change, writes the result back via `saveAssets`, and resolves with the new full list. Does not duplicate the try/catch/localStorage logic — always calls into `storage.ts`. |
| `src/storage.ts` | `loadAssets()`/`saveAssets()` — read/write the asset list to `localStorage` under key `oracle_assets_v1`, wrapped in try/catch so a browser that blocks storage doesn't crash the app (`loadAssets` returns `null`, `saveAssets` no-ops on failure). Only called from `src/services/localAssetService.ts` now — no other file touches storage directly. |
| `src/types.ts` | `Profile` type (`fullName`/`phone`/`email`/`avatarDataUrl: string \| null`) + `emptyProfile` (all empty strings, `avatarDataUrl: null`) — the default when nothing is stored yet. See §6f. |
| `src/profileStorage.ts` | `loadProfile()`/`saveProfile()` — read/write the `Profile` to `localStorage` under key `oracle_profile_v1`, same try/catch pattern as `src/storage.ts` (`loadProfile` falls back to `emptyProfile` on missing/corrupt/partial data instead of `null`, since there's always a single profile, not a list). Only called from `src/services/localProfileService.ts`. |
| `src/services/profileService.ts` | Defines the `ProfileService` interface (`getProfile(): Promise<Profile>`, `saveProfile(profile): Promise<Profile>`) and exports the single `profileService` instance — currently `= localProfileService`. Same pattern as `assetService.ts` (see §6d): this is the only line that needs to change to swap in a server-backed implementation later. |
| `src/services/localProfileService.ts` | The `localProfileService: ProfileService` implementation, backed by `src/profileStorage.ts`'s `loadProfile`/`saveProfile`. |
| `src/types.ts` (additions) | `User` type (`id`/`fullName`/`email`/`phone`/`passwordHash`) — see §6g. |
| `src/authStorage.ts` | `loadUsers()`/`saveUsers()` (localStorage key `oracle_users_v1`, an array of `StoredUser` — `User` plus an internal, optional `resetCode`/`resetCodeExpiresAt` pair never exposed outside this file) and `loadSessionUserId()`/`saveSessionUserId()`/`clearSession()` (localStorage key `oracle_session_v1`, holding just the logged-in user's `id`). Same try/catch pattern as `src/storage.ts`/`src/profileStorage.ts`. Only called from `src/services/localAuthService.ts`. |
| `src/services/authService.ts` | Defines the `AuthService` interface (`signUp`/`logIn`/`logOut`/`getCurrentUser`/`requestPasswordReset`/`resetPassword`, all `Promise`-returning, see §6g) and exports the single `authService` instance — currently `= localAuthService`. Same singleton-swap pattern as `assetService`/`profileService` (see §6d). |
| `src/services/localAuthService.ts` | The `localAuthService: AuthService` implementation, backed by `src/authStorage.ts`. Hashes passwords with `js-sha256`'s `sha256(...)` before ever storing them — plaintext passwords are never written to `localStorage` (see §6g for why this is not `crypto.subtle`). User IDs are generated with a manual UUID v4 built from `crypto.getRandomValues()` (not `crypto.randomUUID()`, same reason). `requestPasswordReset` generates a random 6-digit code with a 10-minute expiry stored alongside the user record; a code comment marks exactly where a real email/SMS provider call would replace the simulation (see §6g). |
| `src/styles.css` | Single line: `@import "tailwindcss";` (Tailwind v4 entry, no config file). |
| `vite.config.ts` | Registers the `@tailwindcss/vite` plugin. |
| `tsconfig.json` | Strict TS config; includes `App.tsx` + `src`. |
| `AGENTS.md` | Short agent rules + governance + pointer to this file. |
| `README.md` | Owner-facing Persian run/data notes. |
| `Dockerfile` | Multi-stage image: Node.js 22 builds the app; Nginx serves only `dist/` on port 80. |
| `.dockerignore` | Excludes local dependencies, build output, Git metadata, and environment files from Docker build context. |
| `docker/nginx.conf` | Nginx static-site config with fallback to `index.html`. |
| `.github/workflows/deploy.yml` | On `release-*` tag push: build a versioned Docker image, send it via SSH, load it on Ubuntu, restart and check the container. Uses two repository secrets for the private key and pinned SSH host key. |
| `DEPLOYMENT.md` | One-time Ubuntu/Docker/SSH setup, GitHub secret names, and release-tag instructions. |

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

## 6. UI architecture (`App.tsx` + `src/components/`)

- The UI is split into small reusable components under `src/components/` (see §4);
  `App.tsx` itself is a thin composition root holding state, storage wiring, and the
  Excel-import parser only. Any element used more than once (icon buttons, SVG icons,
  the modal) has exactly one implementation — no duplicated markup.
- `format(value, decimals = 0)` (in `src/format.ts`) → `Intl.NumberFormat('fa-IR')`.
  Quantity rendered with 8 decimals.
- `AssetIcon({type})` (in `src/components/AssetIcon.tsx`):
  - `btc` → `₿`, `usdt` → `₮` (styled span, Arial)
  - otherwise inline SVG: `gold`, `cash`, `eth`, default = bar chart (also used for `other`).
- `IconButton` (in `src/components/IconButton.tsx`) — the single small icon-button
  component used everywhere: the toolbar's import/clear-all/add buttons (`variant="filled"`,
  always-tinted background) and each asset row's edit/delete buttons
  (`variant="ghost"`, tint only on hover). `tone="neutral"` = blue/violet tint,
  `tone="danger"` = red tint. Takes `icon`/`onClick`/`ariaLabel` props.
- `Toolbar` (in `src/components/Toolbar.tsx`) — renders the three `IconButton`s above
  "دارایی‌های من" plus the hidden file `<input>` for Excel import; takes
  `onImportFile`/`onClearAll`/`onAdd` callbacks from `App.tsx`.
- `AssetRow` (in `src/components/AssetRow.tsx`) — one asset `<li>`: icon, name,
  quantity/unit (or, in edit mode, number inputs for quantity + unit price with
  save/cancel), value, and edit/delete `IconButton`s (`aria-label="ویرایش"`/`"حذف"`).
  Edit mode is local `useState` per row; only quantity and unit price are editable
  inline (no separate edit page/route). Delete calls the parent's `onDelete(id)`.
- `SummaryCard` (in `src/components/SummaryCard.tsx`) — the summary card (cash
  `AssetIcon`, sample badge, big total, footer with asset count); takes
  `total`/`count`/`isSample` props.
- `AddAssetModal` (in `src/components/AddAssetModal.tsx`) — the add-asset modal +
  form; takes `onClose`/`onAdd` props and owns its own form state, validation, and the
  `Escape`-key listener (see §6c for the comma-formatting logic inside it).
- App-level state: `items` (`Asset[]`, starts as the static `assets` sample; a
  mount-time `useEffect` calls `assetService.listAssets()` and, if it resolves to
  non-`null`, replaces `items` with the stored list) and `isSample` (`boolean`,
  starts `true`, set to `false` either by that mount-time load finding stored data or
  permanently once the owner adds, edits, deletes, imports, or clears anything —
  each of those handlers is `async`, awaits the `assetService` call, and sets the
  returned list into state; see §6d). `assetService.listAssets()` resolving `null`
  (key never written) vs. `[]` (owner explicitly cleared everything) are distinct
  states — only `null` counts as "untouched sample"; an explicitly saved empty array
  must never fall back to the `assets` sample again.
- When `items` is empty, the portfolio `<ul>` is replaced by a single centered `<p>`
  ("هنوز دارایی‌ای ثبت نشده") reusing the same muted text styles as the sample
  disclaimer paragraph. Total/count naturally show ۰ تومان / ۰ دارایی since both are
  derived from `items`.
- Styling is inline Tailwind utility classes (see §7) — there are no longer named CSS
  classes like `.header`/`.summary`/`.asset-row`; identify sections by their JSX/aria
  structure instead.
- Layout (top → bottom):
  1. `<header>` → hamburger menu button (opens the side drawer, see §6e) + brand link (`Oracle` + caption `سرمایه‌های من`) and a note span (`یک نگاه، همهٔ دارایی‌ها`).
  2. Summary `<section>` (`aria-labelledby="total-title"`) → sample badge (only when `isSample`), `ارزش کل دارایی‌ها`, big total (toman), footer with asset count.
  3. Portfolio `<section>` (`aria-labelledby="assets-title"`) → toolbar (Excel-import
     button, see §6a; clear-all button, see §6b; add-asset button, see §6c) above the
     heading row, then `<ul>` of `AssetRow` items (icon, name + quantity/unit, value +
     `تومان`, ویرایش/حذف) — or the empty-state `<p>` when `items` is empty.
  4. Trailing `<p>` disclaimer that values are samples — only rendered when `isSample`.
  5. Add-asset modal (see §6c) — rendered as a sibling after `<main>`, only when open.
  6. Side-menu drawer (see §6e) and, opened from it, the profile modal (see §6f) — both rendered as siblings after `<main>`, only when open.
- All of the above (steps 1–6) only render once a user is logged in — see §6g for
  the login/signup/forgot-password screens shown instead when they are not.

## 6a. Excel import (fixed template only)

- `Toolbar` (see §6, `src/components/Toolbar.tsx`), above the "دارایی‌های من" heading
  in the portfolio `<section>`: a single "ایمپورت اکسل" `IconButton` (`tone="neutral"`,
  `UploadIcon`) that triggers a visually hidden `<input type="file"
  accept=".xlsx,.xls">` via a `ref` + `.click()`. No drag-and-drop zone, no other
  format support — a plain file picker only. The actual parsing/state-update handler
  (`handleImportFile`) lives in `App.tsx` and is passed down as `onImportFile`.
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

## 6b. Clear all assets

- A second `Toolbar` `IconButton` (`tone="danger"`, `TrashIcon`) sits next to
  "ایمپورت اکسل", `aria-label="پاک کردن همه دارایی‌ها"`.
- No native `confirm()` and no modal/dialog component — confirmation is the
  `sonner` toast's own `action`/`cancel` buttons: `toast('همه دارایی‌ها پاک
  شوند؟', { action: {...}, cancel: {...} })`. Only the `action` click actually
  clears; `cancel` (and dismissing) does nothing.
- `clearAllAssets()` is `async`: it calls `await assetService.clearAssets()`
  (which persists an explicit empty array to `localStorage` and resolves `[]`),
  sets `items` to that result and `isSample` to `false`, then shows
  `toast.success('همه دارایی‌ها پاک شد')`. See §6/§6d for the `null` vs `[]`
  distinction this relies on and the service layer generally.

## 6c. Add-asset modal

- A third `Toolbar` `IconButton` (`tone="neutral"`, `PlusIcon`) sits after the
  clear-all button, `aria-label="افزودن دارایی جدید"`, toggles `App.tsx`'s
  `isAddOpen` (`useState`) to `true`; the modal itself is `AddAssetModal` (see §4,
  §6, `src/components/AddAssetModal.tsx`), rendered only when `isAddOpen`, as a
  sibling after `<main>`, not nested inside it — taking `onClose`/`onAdd` props.
- The form itself (name, icon/category select incl. `other`, quantity, unit, unit
  price) and its submit handler live inside `AddAssetModal` (own local `useState`,
  not lifted to `App.tsx`); on successful submit it calls the parent's `onAdd(asset)`
  then resets its own form fields and calls `onClose()` so the modal closes and
  reopens empty next time.
- Modal markup: a `fixed inset-0` semi-transparent black backdrop (`bg-black/50`)
  that closes on click (calls `onClose`), containing a centered white card (same
  rounded/border/shadow tokens as other cards — see §7) with a top-corner "×"
  `CloseIcon` button. Clicking inside the card (`stopPropagation`) does not close it.
  A `useEffect` inside `AddAssetModal` adds/removes a `keydown` listener on mount that
  closes (`onClose`) on `Escape` while the modal is open.
- Built with plain React state — no modal/dialog component library.
- The مقدار (quantity) and قیمت واحد به تومان (unit price) inputs are `type="text"`
  (with `inputMode="numeric"` for the mobile keypad) instead of `type="number"`, so
  they can show live comma thousands-separators as the owner types (e.g.
  `1000000` → `1,000,000`). `formQuantity`/`formUnitPrice` state always holds the
  plain digit string (via `stripToNumberString`, applied on every `onChange` —
  covers typed and pasted input alike); the comma-formatted text
  (`formatWithThousands`, using `Number(intPart).toLocaleString('en-US')` on the
  integer part, decimal part left as-is after the dot) is only computed for the
  input's displayed `value` at render time. `handleAddSubmit` still does
  `Number(formQuantity)` on the clean digit string, so validation and the final
  `Asset.quantity`/`unitPrice` are unaffected. This formatting is local to these two
  inputs only — the summary total, asset rows, etc. keep using
  `Intl.NumberFormat('fa-IR')` via `format()` as before.

## 6d. Service layer (`src/services/`)

- All data operations (list/add/update/delete/import/clear) go through a single
  `AssetService` interface (`src/services/assetService.ts`) instead of `App.tsx`
  calling `loadAssets`/`saveAssets` directly:
  ```ts
  export interface AssetService {
    listAssets(): Promise<Asset[] | null>; // null = nothing stored yet (use default sample data)
    addAsset(asset: Asset): Promise<Asset[]>;
    updateAsset(id: string, changes: Partial<Asset>): Promise<Asset[]>;
    deleteAsset(id: string): Promise<Asset[]>;
    importAssets(assets: Asset[]): Promise<Asset[]>; // appends, like the Excel import
    clearAssets(): Promise<Asset[]>; // returns []
  }
  ```
  Every method returns a `Promise` (even though the local implementation is
  synchronous under the hood) so calling code doesn't need to change shape when a
  real network-backed implementation is swapped in later.
- `src/services/localAssetService.ts` is the current (and only) implementation,
  backed by the existing `src/storage.ts` `loadAssets`/`saveAssets` functions —
  it does not duplicate the `localStorage`/try-catch logic, it just calls into
  `storage.ts`. Each method reads the current list via `loadAssets()`, applies the
  change, writes the result back via `saveAssets()`, and resolves with the new full
  list.
- `assetService.ts` exports a single instance, `export const assetService:
  AssetService = localAssetService;` — this one line is the only place that will
  need to change to point at a server-backed implementation later; no component or
  `App.tsx` code needs to change.
- `App.tsx` calls `assetService.listAssets()` once in a mount-time `useEffect`
  (replacing the old synchronous `loadAssets() ?? assets` initializer) and every
  handler (`handleAddAsset`, `handleDelete`, `handleEdit`, `clearAllAssets`,
  `handleImportFile`) is now `async`, `await`s the matching `assetService.xxx(...)`
  call, and sets the returned full list into `items` state. The local
  implementation resolves instantly (no network involved yet), so no loading
  spinners are needed for now — see §6/§6b for how `isSample` is derived from these
  same calls.
- `App.tsx`/components never call `loadAssets`/`saveAssets` (or touch
  `localStorage`) directly anymore — the service layer is the only thing allowed to
  touch storage.

## 6e. Header side-menu drawer

- The header icon that used to sit next to the `Oracle` brand text (a bar-chart
  glyph) is now a hamburger menu button (`HamburgerIcon`, in
  `src/components/icons.tsx`, three horizontal lines, same box/size/stroke style as
  the icon it replaced). Clicking it sets `App.tsx`'s `isMenuOpen` (`useState`) to
  `true`, which renders `SideDrawer` (`src/components/SideDrawer.tsx`) as a sibling
  after `<main>`, taking an `onClose` prop. The `Oracle` brand text next to it is
  still a plain `<a href="./">` link — unchanged, unrelated to the drawer.
- `SideDrawer` reuses the same overlay pattern as `AddAssetModal` (see §6c): a
  `fixed inset-0` semi-transparent black backdrop (`bg-black/50`) that closes on
  click. Instead of a centered card, the panel itself is an `<aside>` pinned
  `absolute top-0 right-0`, full height, fixed width (`w-[280px]`, capped
  `max-w-[80vw]` for narrow screens), sliding in from the right via a Tailwind
  `translate-x` transition (`translate-x-full` → `translate-x-0` on a
  `requestAnimationFrame`-delayed mount flag, so the transition actually animates
  instead of snapping open). Clicking inside the panel (`stopPropagation`) does not
  close it. A `useEffect` inside `SideDrawer` adds/removes a `keydown` listener that
  closes (`onClose`) on `Escape`, same as `AddAssetModal`. A top-corner "×"
  `CloseIcon` button (same style as the modal's) also closes it.
- Menu items: `مشخصات` (`UserIcon`) is wired to `onOpenProfile` (opens the profile
  modal, see §6f, and closes the drawer first). The rest are a small hardcoded
  array (icon + label) rendered as a vertical list below it: `تنظیمات`
  (`SettingsIcon`), `درباره Oracle` (`InfoIcon`), `راهنما` (`HelpIcon`) — then,
  visually separated by a top border divider and in red/danger text
  (`text-[#d95050]`, matching the app's existing danger-tone convention, see
  `IconButton`'s `tone="danger"`), `خروج` (`LogoutIcon`). **These remaining four are
  still placeholders only** — there is no backend/auth in this app yet, so clicking
  any of them (including خروج) just calls `onClose()` and does nothing else; a code
  comment above the `menuItems` array in `SideDrawer.tsx` notes this. Do NOT wire up
  real settings/about/help/logout behavior without an explicit owner request.

## 6f. Profile view (مشخصات)

- Opened from the side drawer's مشخصات item (see §6e), via `App.tsx`'s
  `isProfileOpen` (`useState`); the drawer closes first (`onOpenProfile` sets
  `isMenuOpen` to `false` and `isProfileOpen` to `true` in one go), then
  `ProfileModal` (`src/components/ProfileModal.tsx`) renders as a sibling after
  `<main>`, taking only an `onClose` prop.
- Reuses the exact same overlay pattern as `AddAssetModal` (see §6c): a `fixed
  inset-0` semi-transparent black backdrop (`bg-black/50`) that closes on click,
  a centered white card (same rounded/border/shadow tokens, see §7) with a
  top-corner "×" `CloseIcon` button, `stopPropagation` on the card itself, and a
  `useEffect`-based `Escape`-key listener — no new overlay pattern invented.
- On mount, `ProfileModal` calls `profileService.getProfile()` (see §6d/§4 for the
  service-layer pattern — same shape as `assetService`) and pre-fills its local
  form state (`fullName`/`phone`/`email`/`avatarDataUrl`) from the result;
  `getProfile()` resolves `emptyProfile` (all empty strings, `avatarDataUrl: null`)
  when nothing has been saved yet.
- Avatar: a circular `w-20 h-20` preview at the top — the stored `avatarDataUrl`
  `<img>` if set, else `UserAvatarPlaceholderIcon` (see §4). A "تغییر عکس" button
  below it triggers a visually hidden `<input type="file" accept="image/*">` (same
  hidden-input-plus-ref-click pattern as the Excel import in `Toolbar`, see §6a).
  The chosen file is read via `FileReader.readAsDataURL` and the resulting base64
  data URL is set directly into local state, so the new image previews immediately
  — no crop/resize step.
- Below the avatar: three labeled text inputs, same input styling as
  `AddAssetModal`'s fields (see §6c) — نام و نام خانوادگی (`type="text"`), شماره
  تماس (`type="tel"`), ایمیل (`type="email"`). No validation beyond the browser's
  native `type` hints — this is a personal single-user app, saving is never
  blocked on empty or malformed fields.
- "ذخیره" button calls `profileService.saveProfile({ fullName, phone, email,
  avatarDataUrl })`, shows `toast.success('مشخصات ذخیره شد')` (same `sonner`
  convention as the rest of the app, see §3/§7), then closes the modal.
- **Storage caveat**: the avatar is stored as a base64 data URL string inside the
  same `localStorage` JSON blob as the rest of the profile (key
  `oracle_profile_v1`) — a large source image can meaningfully bloat that blob
  (data URLs run ~33% larger than the raw file, and `localStorage` typically caps
  out around 5–10MB per origin). This is accepted for now (no resize/compression
  step) and is not a concern to fix in this task; revisit only if the owner
  reports a `localStorage` quota error in practice.
- `src/services/profileService.ts`/`localProfileService.ts` follow the exact same
  singleton-swap pattern as `assetService`/`localAssetService` (see §6d) — swapping
  to a server backend later only means replacing the `profileService` export.

## 6g. Login, signup, forgot-password (auth)

- `App.tsx` calls `authService.getCurrentUser()` once in a mount-time `useEffect`
  and holds `currentUser` (`User | null`) + `isAuthChecked` (`boolean`) state. While
  `isAuthChecked` is `false`, a minimal centered "در حال بارگذاری..." screen renders.
  Once checked, `currentUser === null` renders `<AuthScreen onAuthenticated>`
  instead of the whole dashboard (header/summary/portfolio/side-drawer/profile —
  see §6/§6a–§6f are all gated behind being logged in). `onAuthenticated` just
  sets `currentUser` into state directly (the login/signup call already resolved a
  full `User`, no extra round-trip needed).
- `AuthScreen` (`src/components/AuthScreen.tsx`) — a full-page card (same
  rounded/border/shadow/input tokens as `AddAssetModal`/`ProfileModal`, see §7),
  centered on the `#f5f6fb` page background, with a two-tab toggle ("ورود"/"ثبت‌نام",
  plain `useState`, no router/tab library):
  - **ورود (login)**: "ایمیل یا شماره موبایل" + "رمز عبور" fields, a submit button,
    and a "رمز عبور را فراموش کرده‌اید؟" link that opens `ForgotPasswordModal`.
    Calls `authService.logIn({ identifier, password })`; success →
    `onAuthenticated(user)`; failure → `toast.error(result.error)` (a single
    generic message, see below — never reveals whether the identifier or the
    password was wrong).
  - **ثبت‌نام (signup)**: نام و نام خانوادگی/ایمیل/شماره موبایل/رمز عبور/تکرار رمز
    عبور fields. Client-side check first: mismatched password/repeat →
    `toast.error('رمز عبور و تکرارش یکسان نیستند')` without calling the service.
    Otherwise calls `authService.signUp({...})`; success →
    `toast.success('ثبت‌نام با موفقیت انجام شد')` then `onAuthenticated(user)`
    (signup logs the person straight in, no separate login step); failure
    (duplicate email/phone) → `toast.error(result.error)`.
- `ForgotPasswordModal` (`src/components/ForgotPasswordModal.tsx`) — reuses the
  exact `AddAssetModal`/`ProfileModal` overlay pattern (backdrop/Escape/"×"), a
  local `useState<'request' | 'reset'>` step switch, no routing:
  - **Step "request"**: "ایمیل یا شماره موبایل" field → calls
    `authService.requestPasswordReset(identifier)`. Success → shows the returned
    `simulatedCode` via `toast('کد بازیابی (نمایش موقت تا سرویس پیامک/ایمیل وصل
    شود): <code>', { duration: 15000 })` and advances to step "reset". Failure
    (no such user) → `toast.error(result.error)`.
  - **Step "reset"**: 6-digit code + new password + repeat (client-side match
    check, same message as signup) → calls
    `authService.resetPassword(identifier, code, newPassword)`. Success →
    `toast.success('رمز عبور تغییر کرد')` then `onClose()` (back to the login
    tab). Failure (bad/expired code) → `toast.error(result.error)`.
- **Auth data & service layer** (`src/types.ts`/`src/authStorage.ts`/
  `src/services/authService.ts`/`src/services/localAuthService.ts`) — same
  singleton-swap pattern as `assetService`/`profileService` (see §6d):
  - `User` type: `{ id, fullName, email, phone, passwordHash }` (see §4).
  - `AuthService` interface: `signUp`/`logIn`/`logOut`/`getCurrentUser`/
    `requestPasswordReset`/`resetPassword`, all `Promise`-returning.
  - `localAuthService` stores every signed-up user (as `StoredUser`, `User` plus
    an internal, optional `resetCode`/`resetCodeExpiresAt`) in `localStorage`
    under `oracle_users_v1`, and the current session's user `id` under a separate
    key `oracle_session_v1` (see §4). `getCurrentUser()` looks the id up in the
    users list.
  - Passwords are **never stored in plaintext** — hashed with `js-sha256`'s
    `sha256(...)` before being written anywhere, both at signup and at reset.
    **Not** `crypto.subtle.digest(...)` (Web Crypto): `SubtleCrypto` (and also
    `crypto.randomUUID()`, used for the user `id`) are `[SecureContext]`-only
    per spec — `undefined`/throwing in a browser unless the page is served
    over HTTPS or from `localhost`. The app is currently deployed over plain
    HTTP on a bare IP (see §8) with no secure context, so both would crash
    `signUp`/`logIn` immediately. `js-sha256` is a pure-JS, dependency-free
    SHA-256 implementation with no such restriction; the user `id` is built
    manually as a UUID v4 from `crypto.getRandomValues()` instead (which has
    no secure-context restriction). Revisit once HTTPS is set up, though
    there's no need to switch back — both work identically either way.
  - `signUp` also ignores/drops any stored user record with a missing or
    empty `passwordHash` when checking for an existing email/phone (see
    `hasValidPasswordHash` in `localAuthService.ts`) — such a record could
    only exist from a previous crashed signup attempt and can never log in,
    so it must not permanently block a fresh signup with the same identifier.
  - `logIn` matches `identifier` against either `email` (case-insensitive) or
    `phone` (exact) across all stored users, then compares the SHA-256 hash of
    the submitted password. On any mismatch (unknown identifier OR wrong
    password) it returns the **same generic error string**
    (`'ایمیل/شماره یا رمز عبور اشتباه است'`) — this is intentional, so a caller
    can't probe which part was wrong.
  - `signUp` rejects if the email or phone is already registered (case-insensitive
    email match), otherwise creates the user, immediately calls `saveSessionUserId`
    (auto-login), and resolves it.
  - `requestPasswordReset` finds the user by identifier, generates a random
    6-digit code (`Math.floor(100000 + Math.random() * 900000)`), stores it on
    that user's record with `Date.now() + 10 minutes` as the expiry, and resolves
    `{ ok: true, simulatedCode }`.
  - `resetPassword` checks the submitted code against the stored one and its
    expiry; on success it re-hashes and replaces `passwordHash` and clears the
    `resetCode`/`resetCodeExpiresAt` fields (so a code can't be reused after a
    successful reset, nor after it expires).
  - `logOut` just removes the `oracle_session_v1` key.
- **Password reset is simulated, not real** — there is no email/SMS provider
  connected in this app. The 6-digit code is generated locally and shown directly
  to the user on-screen (via the `toast(...)` in `ForgotPasswordModal`, see above)
  instead of being delivered through any real channel. `localAuthService.ts`
  contains an explicit code comment marking exactly where a real email/SMS
  provider call would replace this simulation. **Do not treat this as a security
  boundary** — anyone with access to the browser sees the code directly; this is
  acceptable only because there is no real user data/money at stake yet and no
  delivery channel exists. Revisit once a real backend/email/SMS service is
  integrated.
- No password-strength meter, CAPTCHA, or other extras were added — kept
  intentionally minimal per the task.

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

Production deploy: after the PR is merged into `main`, pushing a new `release-*`
tag triggers `.github/workflows/deploy.yml`. The runner builds
`oracle:<release-tag>` from the multi-stage `Dockerfile` (Node.js 22 build,
Nginx runtime), pipes `docker save` over SSH to
`oracle-deploy@45.82.137.126`, loads the image, and replaces the `oracle`
container with host port 8580 mapped to Nginx port 80. Images remain versioned
on the server; no registry is needed. The SSH host key is pinned. Required
repository secrets are
`ORACLE_SSH_PRIVATE_KEY` and `ORACLE_SSH_HOST_KEY`; see `DEPLOYMENT.md` for
Docker Engine, deployment-user, and SSH setup. Browser `localStorage` assets
are not part of the image. With no domain/TLS yet, the host serves HTTP on
port 8580; use HTTPS before entering real financial data. The port change
creates a different browser origin; existing assets and profile data in
`localStorage` at the old port do not appear automatically at the new port.

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
| 2026-09-23 | Owner-requested: added a "clear all assets" toolbar button (see §6b), confirmed via a `sonner` toast's own action/cancel buttons (not `confirm()`, not a modal). Clearing sets `items` to an explicit `[]`, which persists via the existing `saveAssets()` path and must stay distinct from the `null`/"never touched" sample state. Added an empty-state message reusing the sample-disclaimer text style when the list has zero assets. |
| 2026-09-23 | Owner-requested: moved the "add asset" form out of its always-visible inline position into a modal (see §6c), opened via a new third toolbar button (`PlusIcon`). Form fields/validation/submit logic unchanged — only relocated; submit now also closes the modal. Modal is hand-built with plain `useState`/Tailwind (backdrop click, "×" button, Escape key) — no dialog/modal library added. |
| 2026-09-23 | Owner-requested: مقدار/قیمت واحد inputs in the add-asset form now show live comma thousands-separators as the owner types (see §6c). Switched those two inputs from `type="number"` to `type="text"`/`inputMode="numeric"`; underlying form state stays a plain comma-free digit string, only the displayed `value` is formatted — no input-masking library added, no change to `Intl.NumberFormat('fa-IR')` formatting used elsewhere (summary total, asset rows). |
| 2026-09-23 | Structural refactor (owner-requested): broke the previously monolithic `App.tsx` into reusable components under `src/components/` — `IconButton` (single implementation for every small icon button in the app), `AssetIcon`, `Toolbar`, `AssetRow`, `SummaryCard`, `AddAssetModal`, plus `src/format.ts` and `src/components/icons.tsx` (shared SVG icons). Pure refactor — no styling/text/behavior change; `App.tsx` is now just state + storage wiring + Excel-import parsing + composition. |
| 2026-09-23 | Architectural refactor (owner-requested): introduced a service layer (`src/services/`, see §6d) — `AssetService` interface + `localAssetService` implementation (still backed by `src/storage.ts`/`localStorage`) — sitting between `App.tsx` and storage. Every data operation (add/edit/delete/import/clear/list) now goes through `assetService.xxx(...)` (all `Promise`-returning) instead of `App.tsx` calling `loadAssets`/`saveAssets` directly; handlers became `async`/`await`. Purpose: swapping to a real server backend later only requires replacing the single `assetService` export in `assetService.ts` — no component/`App.tsx` changes needed. No visible behavior/styling change. |
| 2026-09-23 | Owner-requested: replaced the header's bar-chart icon with a hamburger menu button that opens a side drawer (`src/components/SideDrawer.tsx`, see §6e), sliding in from the right, reusing the `AddAssetModal`'s backdrop/Escape/"×" close pattern. Contains 5 placeholder menu items (مشخصات/تنظیمات/درباره Oracle/راهنما, then خروج separated by a divider + red/danger styling) — none have real functionality yet (no backend/auth exists), clicking any of them just closes the drawer. UI shell only; do not wire up real behavior without an explicit owner request. |
| 2026-09-23 | Owner-requested: built an editable profile view (§6f) opened from the side drawer's مشخصات item — نام و نام خانوادگی/شماره تماس/ایمیل + an avatar (stored as a base64 data URL via `FileReader.readAsDataURL`, previewed immediately). Mirrors the asset service-layer pattern: added `Profile` type (`src/types.ts`), `src/profileStorage.ts` (localStorage key `oracle_profile_v1`, same try/catch pattern as `src/storage.ts`), and `ProfileService`/`localProfileService` (`src/services/`, same singleton-swap shape as `AssetService`). `ProfileModal` reuses the exact `AddAssetModal` overlay pattern (backdrop/Escape/"×") — no new modal pattern invented. No validation beyond native input `type` hints (personal single-user app). Only مشخصات was wired up; تنظیمات/درباره Oracle/راهنما/خروج remain placeholders. Noted the large-avatar/localStorage-quota caveat as accepted, not a concern to fix now. |
| 2026-09-23 | Owner-requested: changed tag-triggered deployment to build a versioned Docker image (`release-*`) and transfer it over SSH to Ubuntu, where the `oracle` Nginx container runs on port 80. This supersedes the earlier plan to rsync `dist/` to host Nginx. Private and pinned host keys remain GitHub repository secrets; `DEPLOYMENT.md` documents Docker/SSH setup and release steps. |
| 2026-09-23 | Owner-requested: changed the Docker host port from 80 to 8580 (`-p 8580:80`) while Nginx inside the image remains on port 80; the app URL is now `http://45.82.137.126:8580/`. Browser storage from port 80 remains at its original origin. |
| 2026-09-23 | Bugfix: `crypto.subtle.digest(...)` and `crypto.randomUUID()` are both `[SecureContext]`-only per the Web Crypto spec (HTTPS or `localhost` required) — both were `undefined`/throwing on the current plain-HTTP-on-bare-IP deployment (see §8), crashing `signUp` before any account was ever created (so login afterward always failed with "user not found"). Replaced password hashing with `js-sha256` (pure JS, no secure-context requirement, same SHA-256 output — no forced re-hash of any password that had been hashed pre-bug) and the user `id` generator with a manual UUID v4 built from `crypto.getRandomValues()` (also unaffected by secure-context). Also made `signUp` ignore any stored user record with a missing/empty `passwordHash` (only possible from a signup that crashed before completing) so it can't block a fresh signup with the same email/phone. No HTTPS/certbot setup as part of this — that needs a domain, which doesn't exist yet. |
| 2026-09-23 | Owner-requested: built login, signup, and forgot-password (see §6g), gating the whole dashboard behind being logged in. Added `User` type, `src/authStorage.ts` (localStorage keys `oracle_users_v1`/`oracle_session_v1`), and `AuthService`/`localAuthService` (`src/services/`) — same singleton-swap pattern as `assetService`/`profileService` (see §6d). Passwords are SHA-256-hashed via Web Crypto before ever being stored, never plaintext. `AuthScreen` (login/signup tabs) and `ForgotPasswordModal` (two-step: request code, then code+new password) reuse the existing card/input/overlay styling — no new visual pattern invented. **Password-reset codes are simulated** (generated locally, shown directly to the user via a toast) because no real email/SMS provider is connected yet; `localAuthService.ts` marks exactly where that integration would replace the simulation. خروج (logout) in the side drawer now actually calls `authService.logOut()`; تنظیمات/درباره Oracle/راهنما remain placeholders. |

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
