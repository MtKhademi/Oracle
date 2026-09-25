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
with a **total in toman** (plus, since 2026-09-25, mock USD/gold-gram equivalent
rows, each with its own icon and color — see §6j) and **one row per asset**.
`src/assets.ts` still ships
static sample data (illustrative only), but the owner can now add/edit/delete their
own real assets through a small in-page form, or bulk-import them from a fixed
Excel template (see §6a); those real values are persisted ONLY in the browser's
`localStorage` (see §4/§5) and are never committed to git. No charts, navigation,
backend, or native tooling beyond add/edit/delete, the fixed-template Excel import,
and the mock live-price conversions (by explicit owner constraint/request).

## 2. Hard constraints (do not break)

1. Show a toman total (plus the owner-requested mock USD/gold-gram line, §6j) and
   one row per asset.
2. Do NOT add charts, navigation, backend, native tooling, or any other feature
   beyond add/edit/delete of assets, the fixed-template Excel import (§6a), and the
   mock live-price conversions (§6j) **unless the owner explicitly asks**. The
   Excel import must stay locked to the one fixed template — never auto-detect
   columns or accept other layouts. The USD/gold-gram line is explicitly MOCK
   data (`mockPriceService`) — never present it as a real market feed.
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
| `App.tsx` | Thin composition root: `parseImportRows()` (6-column Excel parser plus `resolveRowType`/`resolveRowDate`/`resolveEffectiveType`/`formatLocalIsoDate`/`parseIsoDateStrict` helpers, see §6a), the asset list `useState` (starts as the static `assets` sample with `isSample=true`; a mount-time `useEffect` calls `assetService.listAssets()` and swaps in the stored list + `isSample=false` if anything was previously saved), `isAddOpen` state, and the Excel-import/clear-all/add/edit/delete handlers — each of which is now `async` and calls the matching `assetService.xxx(...)` method, awaits the returned full list, and sets it into state (see §6d). A separate mount-time `useEffect` calls `authService.getCurrentUser()` into `currentUser`/`isAuthChecked` state (see §6g); while unchecked, a minimal loading screen renders, and once checked, `currentUser === null` renders `<AuthScreen>` instead of the dashboard. Once authenticated, renders `<SummaryCard>`, `<Toolbar>`, the list of `<AssetRow>`, and `<AddAssetModal>` (see §6, §6c) — no longer holds any icon/button/modal markup itself, and no longer touches `localStorage` directly. `handleLogout` calls `authService.logOut()`, clears `currentUser`, and closes the drawer; passed to `<SideDrawer onLogout>`. Also holds `historyAssetId` (`string | null`), set by each `AssetRow`'s History action (`onHistory`); when set, renders `<TransactionHistoryModal>` (see §6i) for that asset, passing `onTransactionRecorded={handleTransactionRecorded}` — an `async` handler that updates that asset's `quantity` via `assetService.updateAsset` (buy adds, sell subtracts clamped at 0; `unitPrice` is deliberately untouched) and sets the returned list into `items`. `handleAddAsset` now also writes a `buy` transaction on both the merge-into-existing and brand-new branches (the entered quantity at the entered unit price, dated today) via `transactionService.addTransaction(...)` (see §6i). Now also calls `useLivePrices()` once (see §6j/§6k) into `prices`, computes `total` via `getEffectiveUnitPrice(asset, prices)` per asset instead of raw `asset.unitPrice`, and passes `prices` down as a prop to both `<SummaryCard>` and every `<AssetRow>`. |
| `src/components/icons.tsx` | Shared small stroke-based SVG icon components: `UploadIcon`, `TrashIcon`, `PlusIcon`, `CloseIcon`, `PencilIcon`, `UserIcon`, `SettingsIcon`, `InfoIcon`, `HelpIcon`, `LogoutIcon` (all `w-4 h-4 block`, `viewBox="0 0 24 24"`, `fill="none" stroke="currentColor" strokeWidth="1.8"`), plus `HistoryIcon` (a clock-with-rewind-arrow glyph, used by `AssetRow`'s per-row "History" action, see §6i), `HamburgerIcon` (`w-[30px] h-[30px] block`, same stroke style, three horizontal lines — used only in the header, see §6e), `UserAvatarPlaceholderIcon` (`w-11 h-11 block`, same person glyph as `UserIcon` at a larger size — the profile avatar's empty-state placeholder, see §6f), `DollarIcon` (a bold inline `$` glyph, same Arial-glyph pattern as the `₮`/`₿` symbols in `AssetIcon.tsx`, used only by `SummaryCard`'s USD row, see §6j), `GoldBarIcon` (a standalone copy of the gold-bar SVG paths from `AssetIcon`'s `'gold'` case, used only by `SummaryCard`'s gold-gram row, see §6j — kept separate from `AssetIcon` so `SummaryCard` doesn't need the full asset-icon type-switch just for a decorative badge), and `RefreshIcon` (circular-arrows/refresh glyph, same 24x24/`stroke="currentColor"`/`strokeWidth="1.8"` style as the rest of this file, used only by `SummaryCard`'s manual-refresh button, see §6j). Used by `Toolbar`/`AssetRow`/`AddAssetModal`/`SideDrawer`/`ProfileModal`/`SummaryCard`/`App.tsx` — no icon markup duplicated elsewhere. |
| `src/components/IconButton.tsx` | Single reusable small icon-button component (`icon`, `onClick`, `ariaLabel`, `tone: 'neutral' \| 'danger'`, `variant: 'filled' \| 'ghost'`). `tone` controls the hover/background color (blue/violet tint for neutral, red tint for danger); `variant` distinguishes the toolbar's always-tinted `'filled'` buttons from the asset row's `'ghost'` (transparent-until-hover) edit/delete buttons. This is the ONLY icon-button implementation in the app — every small icon button (import/clear-all/add in the toolbar, edit/delete on each row) renders `<IconButton/>`, no hand-written button markup remains duplicated. |
| `src/components/AssetIcon.tsx` | `AssetIcon({type})` (per-asset-category glyph) + the `iconTint` color map, relocated unchanged from `App.tsx`. Used by `SummaryCard` (cash icon) and `AssetRow`. |
| `src/components/Toolbar.tsx` | The row of `IconButton`s above "دارایی‌های من" (import-excel / clear-all / add). Takes `onOpenImportModal`/`onClearAll`/`onAdd` callback props from `App.tsx`; the import button just opens the unified import modal (see §6a) — no file `<input>` lives here, it's owned by `ImportModal`. |
| `src/components/ImportModal.tsx` | The unified Excel import modal (see §6a): combines file selection AND the default-mode choice in one screen (not two steps). A styled file-picker control (hidden `<input type="file" accept=".xlsx,.xls">` behind a button; shows the chosen file's name with a "تغییر فایل" link once picked) plus a 3-way segmented radio choice for the **default mode** applied to rows whose own نوع column is empty — جایگذاری با دارایی فعلی (replace) / اضافه کردن به دارایی فعلی (add) / کم کردن از دارایی فعلی (subtract), each with a title + one-line description, local `useState<ImportMode>('replace')`. A "بارگذاری" submit button, `disabled` until a file is chosen, calls `onSubmit(defaultMode, file)`. Reuses the `ProfileModal`/`AddAssetModal` overlay pattern (backdrop click / "×" / `Escape`). Takes `onClose`/`onSubmit` props. Replaces the old two-step `ImportModeModal` (deleted). |
| `src/components/AssetRow.tsx` | One asset `<li>` (icon, name, quantity/unit or inline edit inputs, value, history/edit/delete `IconButton`s). Local `useState` for inline edit mode (quantity/unit-price only). Takes `asset`/`prices` + `onEdit`/`onDelete`/`onHistory` callback props. For a live-priced asset (`getLivePriceKeyForAsset(asset)`, see §6k — currently GOLD18/USDT only), the row's value and a small extra "rate per unit" line both use `getEffectiveUnitPrice(asset, prices)` instead of `asset.unitPrice`, and edit mode replaces the unit-price `<input>` with a read-only "قیمت زنده" label. |
| `src/components/SummaryCard.tsx` | The summary card showing the total (toman), sample badge, and asset count. Takes `total`/`count`/`isSample`/`prices` props (`prices` is now passed down from `App.tsx`'s single `useLivePrices()` call, see §6j/§6k — this component no longer calls the hook itself). Renders two additional small labeled rows below the toman total — دلار (green `DollarIcon` badge) and گرم طلا (gold `GoldBarIcon` badge, same tint as `iconTint.gold`) — each converting the toman total via the live prices, plus a smaller muted per-unit-rate sub-text on each row ("هر دلار/هر گرم … تومان", see §6j); while `prices` is `null`, the same two rows render `invisible` (kept in the layout, just not shown) so there's no flash of a zero value and no layout shift once prices arrive. The "ارزش کل دارایی‌ها" heading row also has a small manual-refresh `RefreshIcon` button (see §6j) that calls `priceService.refreshNow()` directly; a `useEffect` watching the `prices` prop drives a local `isSpinning` state that spins the icon (`animate-spin`) for ~700ms on every price change, whichever source caused it, and disables the button meanwhile. |
| `src/components/AddAssetModal.tsx` | The add-asset modal + form (catalog asset picker/quantity/unit/unit-price, see §6c), using the shared `stripToNumberString`/`formatWithThousands` comma-formatting helpers (now in `src/format.ts`, imported — no longer defined locally) for the quantity/unit-price inputs. Takes `onClose`/`onAdd` callback props; owns its own form state and the `Escape`-key listener. |
| `src/components/AssetPicker.tsx` | Custom searchable combobox (text input + dropdown panel) for picking a catalog asset — see §6c. Plain React state + Tailwind only, no external combobox/autocomplete library. Takes `selectedSymbol`/`onSelect` props; owns its own open/query/highlighted-index state. |
| `src/components/TransactionHistoryModal.tsx` | Per-asset transaction-history modal (see §6i): on mount it runs `ensureInitialTransaction(asset)` (lazy synthetic opening buy for assets with quantity but no history yet, see §5) and then loads that asset's transactions via `transactionService.listTransactionsForAsset(...)`, listing them newest-first with type (خرید/فروش), Persian date, quantity+unit, and toman price-per-unit, plus a clear empty state and a sample badge. Below the list it has an "add transaction" form (see §6i): a خرید/فروش toggle (styled like `AuthScreen`'s login/signup tabs), quantity + unit-price inputs (shared `stripToNumberString`/`formatWithThousands` thousands-formatting, see §4 `src/format.ts`), a date input defaulting to today, an optional note, and a "ثبت تراکنش" submit — on success it re-fetches the list, resets the form, and calls the `onTransactionRecorded(assetId, type, quantity)` prop so the parent updates the asset's quantity (buy adds, sell subtracts clamped at 0; the asset's `unitPrice` is never changed from here). Reuses the `ProfileModal` overlay pattern (backdrop click / "×" / `Escape`). No edit/delete of transactions yet (later task). Takes `asset`/`isSample`/`onClose`/`onTransactionRecorded` props. |
| `src/components/SideDrawer.tsx` | The header's side-menu drawer (see §6e): slide-in-from-right panel + backdrop, containing the menu item list. مشخصات opens the profile view (`onOpenProfile` prop, see §6f); خروج now calls `onLogout` (real logout, see §6g); تنظیمات/درباره Oracle/راهنما remain placeholders that just close the drawer. Takes `onClose`/`onOpenProfile`/`onLogout` props; owns its own open/close slide-in animation state and the `Escape`-key listener. |
| `src/components/ProfileModal.tsx` | The مشخصات (profile) modal (see §6f): avatar (image or placeholder icon) + "تغییر عکس" file picker, and نام و نام خانوادگی/شماره تماس/ایمیل inputs, pre-filled from `profileService.getProfile()` on open. Save button calls `profileService.saveProfile(...)`, shows a success toast, then closes. Takes only `onClose`; owns its own form state and the `Escape`-key listener. |
| `src/components/AuthScreen.tsx` | Full-page login/signup screen (see §6g), shown instead of the dashboard when no user is logged in. Tab toggle between "ورود" and "ثبت‌نام", styled with the same card/input tokens as `AddAssetModal`/`ProfileModal`. Login calls `authService.logIn(...)`; signup calls `authService.signUp(...)` (client-side password/repeat match check first). On success calls the `onAuthenticated(user)` prop; on failure shows `toast.error(result.error)`. Renders `<ForgotPasswordModal>` when its "رمز عبور را فراموش کرده‌اید؟" link is clicked. |
| `src/components/ForgotPasswordModal.tsx` | Two-step password-reset modal (see §6g), reusing the `AddAssetModal` overlay pattern. Step 1 asks for email/phone, calls `authService.requestPasswordReset(identifier)`, and shows the returned `simulatedCode` in a long-lived `toast(...)` (**simulated — not a real email/SMS send**, see §6g). Step 2 asks for the 6-digit code + new password (+ repeat, matched client-side), calls `authService.resetPassword(...)`. Takes only `onClose`. |
| `src/format.ts` | Shared `format(value, decimals = 0)` → `Intl.NumberFormat('fa-IR')` helper, plus `formatDate(isoDate)` → `Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' })` (parses a `YYYY-MM-DD` date as a local date, falling back to the raw string on a non-matching format), plus `stripToNumberString(raw)`/`formatWithThousands(raw)` (the live comma thousands-separators pair for numeric text inputs — plain-digit-string state in, comma-formatted display text out; see §6c), used by `App.tsx`, the components above, `AddAssetModal`, and the transaction-history modal's add-transaction form (see §6i). |
| `src/assets.ts` | `Asset` type + `assets` sample array. Now the **default/fallback** data only — real owner data lives in `localStorage`, behind the service layer below, not here. |
| `src/data/assetCatalog.json` | Fixed, owner-provided reference catalog of known assets — `categories`/`units` (id + Persian `label`) and `assets` (`symbol`/`name`/`category`/`unit`, category/unit referencing the `categories`/`units` ids). Committed static data (like `src/assets.ts`'s sample array), not owner-entered real values — safe to commit. Drives the add-asset form (see §6c) instead of free-typed names. |
| `src/services/assetCatalog.ts` | Typed wrapper around `assetCatalog.json` (`CatalogCategory`/`CatalogUnit`/`CatalogAsset` interfaces): `getCatalogAssets()`, `getCatalogAssetBySymbol(symbol)`, `getCategoryLabel(id)`/`getUnitLabel(id)` (Persian label lookups), and `getAssetIconForCatalogEntry(catalogAsset)` (maps a catalog category to the existing `Asset['icon']` key — see §6c). A catalog asset's `symbol` is now its permanent identity `code` (see §5) — this supersedes `assetCodeRegistry.ts`'s auto-generated codes for anything picked from the catalog. |
| `src/services/assetCodeRegistry.ts` | `getOrCreateCode(category, name): string` — assigns/looks up each asset's permanent `<PREFIX>-<NNNN>` identity code (see §5). Backed by two `localStorage` keys: `oracle_code_counters_v1` (highest `NNNN` issued per prefix, e.g. `{ GOLD: 2, USDT: 1 }`) and `oracle_asset_registry_v1` (`category\|name.trim().toLowerCase()` → already-assigned code). Same try/catch `localStorage` pattern as `storage.ts`/`profileStorage.ts`/`authStorage.ts`. Pure lookup/generation logic only — does not read or write the asset list itself; its only remaining caller is the one-time migration in `App.tsx` (see §6d/§6h), which attaches the returned code to a legacy asset and persists it via `assetService`. **No longer used by `AddAssetModal`** (see §6c) or the Excel import (see §6a, now catalog-driven) — now only a fallback path for pre-catalog legacy data. |
| `src/services/assetService.ts` | Defines the `AssetService` interface (`listAssets`/`addAsset`/`updateAsset`/`deleteAsset`/`importAssets(rows)`/`clearAssets`, all `Promise`-returning), the `ImportMode` (`'replace' \| 'add' \| 'subtract'`, the modal's default-mode choice), `ImportEffectiveType` (`'buy' \| 'sell' \| 'replace'`, a row's resolved per-row type), `ImportRow` (`{ asset, effectiveType, effectiveDate }`, one row ready to apply), and `ImportAssetChange` (`{ assetId, type: 'buy' \| 'sell', quantity, unitPrice, date }`) types, and exports the single `assetService` instance the whole app imports — currently `= localAssetService`. This is the ONLY line that needs to change to swap in a server-backed implementation later; no component/`App.tsx` code would need to change (see §6d). |
| `src/services/localAssetService.ts` | The `localAssetService: AssetService` implementation, backed by `src/storage.ts`'s `loadAssets`/`saveAssets`. Each method reads the current list, applies the change, writes the result back via `saveAssets`, and resolves with the new full list. `importAssets(rows)` applies each row's own `effectiveType` independently (not one mode for the whole file) matched by `code` — `replace` overwrites or appends (no `changes` entry), `buy` adds the imported quantity (updating unit price) or appends and records a `buy` dated the row's `effectiveDate`, `sell` subtracts (clamped at 0, unit price untouched) and records a `sell` dated the row's `effectiveDate`, or skips unmatched rows (`skippedNoMatch++`) — and resolves the full `ImportResult` incl. the `changes` transaction list (see §6a/§6d). Does not duplicate the try/catch/localStorage logic — always calls into `storage.ts`. |
| `src/storage.ts` | `loadAssets()`/`saveAssets()` — read/write the asset list to `localStorage` under key `oracle_assets_v1`, wrapped in try/catch so a browser that blocks storage doesn't crash the app (`loadAssets` returns `null`, `saveAssets` no-ops on failure). Only called from `src/services/localAssetService.ts` now — no other file touches storage directly. |
| `src/types/transaction.ts` | `TransactionType` (`'buy' \| 'sell'`) and `Transaction` (`id`/`assetId`/`type`/`quantity`/`unitPrice`/`date`/optional `note`) — the durable buy/sell history model for each asset, ready for the follow-up transaction-history UI. |
| `src/transactionStorage.ts` | `loadTransactions()`/`saveTransactions()` — read/write the transaction list to `localStorage` under key `oracle_transactions_v1`, using the same try/catch-safe array storage pattern as assets/auth/profile. Only called from `src/services/localTransactionService.ts`. |
| `src/services/transactionService.ts` | Defines the `TransactionService` interface (`listTransactions`/`listTransactionsForAsset`/`addTransaction`/`updateTransaction`/`deleteTransaction`/`deleteTransactionsForAsset`) and exports the single `transactionService` instance — currently `= localTransactionService`, matching the swap-one-line service-layer pattern used by assets/profile/auth. |
| `src/services/localTransactionService.ts` | The `localTransactionService: TransactionService` implementation, backed by `src/transactionStorage.ts`. Transaction IDs use the same `crypto.randomUUID()` pattern already used for asset rows; add/update reject invalid `quantity <= 0` or `unitPrice < 0`; asset deletion cleanup is triggered by the UI handler in `App.tsx`, not by coupling this service to `localAssetService`. |
| `src/services/transactionCalculations.ts` | Pure transaction math and migration helpers: `computeHoldingSummary(transactions)` calculates current quantity, weighted-average cost, and realized P/L in chronological order; `ensureInitialTransaction(asset)` lazily creates one synthetic initial buy for a pre-existing asset only if it has no transaction history yet (no-op otherwise). `ensureInitialTransaction` is now called by `TransactionHistoryModal` the first time an asset's history is opened (see §6i); `computeHoldingSummary` is still not used by the UI (the P/L display is a later task). |
| `src/services/priceService.ts` | Defines `LivePrices` (`{ usdToman, goldGramToman }`, both toman-denominated) and the `PriceService` interface (`getPrices(): Promise<LivePrices>`, `subscribe(callback): () => void` — calls back immediately with the current prices, then again on every refresh, returns an unsubscribe function — and `refreshNow(): Promise<LivePrices>`, which immediately re-computes prices and notifies all current subscribers without resetting the 60s interval), and exports the single `priceService` instance — currently `= mockPriceService` (see §6j). Same singleton-swap pattern as `assetService`/`profileService`/`authService`/`transactionService` (see §6d): this is the only line that needs to change to point at a real server-backed price feed later. |
| `src/services/mockPriceService.ts` | The `mockPriceService: PriceService` implementation (see §6j) — **entirely mock, no real price API**. Keeps in-memory current values (`usdToman: 230000` ≈ 1 US dollar, `goldGramToman: 24000000` ≈ 1 gram of 18-karat gold — realistic-looking starting points, not `src/assets.ts`'s old sample-data magnitudes) nudged each step by a shared `jitterStep()` function using a **fixed absolute toman amount** (`usdToman ±20`, `goldGramToman ±2,000,000`, not percentage-based) on a single shared `setInterval` (60000ms) once at least one subscriber is active; `getPrices()` resolves the current in-memory values immediately; `subscribe(callback)` calls `callback` immediately with the current values, adds it to a `Set` of subscribers notified on every tick, and returns an unsubscribe function that removes it and clears the interval once the last subscriber leaves (no leaked timer when no UI is mounted); `refreshNow()` calls the same `jitterStep()` immediately and notifies all current subscribers, independent of the interval timer — both the tick and manual refresh always apply the identical jitter logic. |
| `src/hooks/useLivePrices.ts` | `useLivePrices(): LivePrices \| null` — a small hook wrapping `priceService.subscribe(...)` in `useEffect` (subscribes on mount, unsubscribes on unmount via the returned cleanup function), holding the latest `LivePrices` in `useState`, starting `null` until the first callback arrives so the caller (now only `App.tsx`, see §6j/§6k — it threads the result down as a `prices` prop rather than each component calling the hook itself) can render a loading/placeholder state instead of flashing zeroed-out values. |
| `src/services/livePriceMapping.ts` | `getLivePriceKeyForAsset(asset)`/`getEffectiveUnitPrice(asset, prices)` (see §6k) — the single source of truth for which specific catalog assets (by `code`, currently only `GOLD18`→`goldGramToman` and `USDT`→`usdToman`) get their unit price computed live from `LivePrices` instead of their stored `Asset.unitPrice`. Used by `App.tsx` (page total) and `AssetRow` (row value + edit-mode unit-price lock). |
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
  code?: string;          // permanent identity code, see below — still optional
                          // at the type level because the Excel import doesn't
                          // assign it yet (next follow-up task)
};
```

- **`code`** — a permanent, unique identity for the asset, so the same
  real-world asset keeps mapping to the same record across separate Excel
  imports or manual re-entry — groundwork for a future transaction-history
  feature (no transaction logic yet). This field is purely an internal
  identity key for now — **not shown anywhere in the UI**. Two sources, in
  order of precedence:
  - **Catalog symbol (current source of truth)** — for any asset picked from
    `src/data/assetCatalog.json` (see §4/§6c, e.g. `GOLD18`, `USDT`,
    `COIN-EMAMI`), `code` is set directly to that catalog entry's `symbol` —
    no generation involved, since the catalog itself already guarantees
    uniqueness per real-world asset.
  - **Auto-generated `<PREFIX>-<NNNN>` (fallback for non-catalog assets)** —
    e.g. `GOLD-0001`, `USDT-0002`, `OTHR-0007`. `PREFIX` is derived from
    `icon`: `gold→GOLD`, `fund→FUND`, `cash→CASH`, `usdt→USDT`, `btc→BTC`,
    `eth→ETH`, `other→OTHR`. `NNNN` is a 4-digit zero-padded number, unique
    within that prefix. Generated and looked up via
    `getOrCreateCode(category, name)` in `src/services/assetCodeRegistry.ts`
    (see §4): the same `icon` + `name` (case-insensitive, trimmed) always
    resolves to the same code once assigned. Used **only** by the one-time
    migration described in §6h (pre-existing/sample assets predating the
    catalog). **No longer called by `AddAssetModal`** (see §6c) or the Excel
    import (`parseImportRows`, see §6a) — both are now catalog-driven and use
    the catalog entry's `symbol` as `code`.
  Editing an asset (see §6, quantity/unit price only) never touches `code` —
  identity never changes on edit, regardless of which source assigned it.

- Row value = `quantity × unitPrice` (toman) — except GOLD18/USDT, whose
  *effective* unit price is driven live (see §6k); `quantity × unitPrice`
  still applies verbatim to every other asset.
- Page total = `items.reduce((s,a)=> s + a.quantity*getEffectiveUnitPrice(a,
  prices), 0)` over the live `items` state in `App.tsx` (not the raw `assets`
  import) — `getEffectiveUnitPrice` (see §6k) falls through to `a.unitPrice`
  unchanged for every asset that isn't GOLD18/USDT.
- Cash `unitPrice = 1`, so its row value equals its quantity.
- `src/assets.ts` ships 7 sample assets (gold, two gold funds, cash, Tether, BTC,
  ETH) — **illustrative only**, unchanged, used purely as the default when
  `localStorage` has nothing saved yet.
- `icon: 'other'` is for anything that doesn't fit the 6 built-in categories (e.g.
  individual stocks/funds); it reuses the default bar-chart `AssetIcon` SVG with its
  own neutral grey tint (see §7).
- The real, owner-entered list (post add/edit/delete) is held in React state in
  `App.tsx` and persisted to `localStorage` via `src/storage.ts` — see §6.

### Transaction model (`src/types/transaction.ts`)

```ts
type Transaction = {
  id: string;
  assetId: string;      // related Asset.id
  type: 'buy' | 'sell';
  quantity: number;     // intended to be > 0
  unitPrice: number;    // toman per unit at transaction time, intended to be >= 0
  date: string;         // ISO date, e.g. "2026-09-24"
  note?: string;
};
```

- Transactions are stored separately from assets in `localStorage` under
  `oracle_transactions_v1` via `src/transactionStorage.ts` and
  `src/services/localTransactionService.ts` (see §4). The dashboard UI shows each
  asset's transaction history in a modal with an add-transaction form (see §6i) —
  opening a history panel now lazily creates a synthetic initial buy for a
  quantity-holding asset that has no history yet (`ensureInitialTransaction`, see
  below); it never edits or deletes transactions.
- `assetId` points to the related `Asset.id` (not `Asset.code`). When an asset is
  deleted from the current UI, `App.tsx` calls `assetService.deleteAsset(id)` and
  then `transactionService.deleteTransactionsForAsset(id)`; clear-all similarly
  deletes transaction rows for every asset that was present before clearing. This
  keeps the asset and transaction services independent while preventing orphaned
  transaction rows.
- `computeHoldingSummary(transactions)` uses weighted-average cost: process by
  chronological `date` (stable by original array order for tied dates), buys update
  average cost, sells keep average cost unchanged and add realized P/L as
  `(sellUnitPrice - currentAverageCost) * sellQuantity`. If bad data sells more
  than currently held, quantity is clamped at 0 while realized P/L still uses the
  requested sell quantity.
- `ensureInitialTransaction(asset)` is a lazy migration helper for pre-existing
  assets: if an asset has no transactions, it creates one synthetic `buy` for the
  current `asset.quantity`/`asset.unitPrice` dated today (a no-op when the asset
  already has any transactions). It is now called by `TransactionHistoryModal` the
  first time an asset's history is opened (see §6i), so a legacy real asset with a
  balance but no history gets a synthetic opening buy on first open. Note this is a
  *synthetic purchase*, not a separately-marked "opening balance" record — a
  distinct opening-balance transaction type is a later follow-up.

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
  "دارایی‌های من"; the import button opens the import-mode modal (`onOpenImportModal`),
  so the toolbar no longer owns a file input; takes
  `onOpenImportModal`/`onClearAll`/`onAdd` callbacks from `App.tsx`.
- `AssetRow` (in `src/components/AssetRow.tsx`) — one asset `<li>`: icon, name,
  quantity/unit (or, in edit mode, number inputs for quantity + unit price with
  save/cancel), value, and history/edit/delete `IconButton`s
  (`aria-label="تاریخچه"`/`"ویرایش"`/`"حذف"`).
   Edit mode is local `useState` per row; only quantity and unit price are editable
   inline (no separate edit page/route) — except a live-priced asset (GOLD18/USDT,
   see §6k), whose unit-price input is replaced with a read-only "قیمت زنده" label.
   History calls the parent's `onHistory(id)`
   (opens the transaction-history modal, see §6i); delete calls
   `onDelete(id)`.
- `SummaryCard` (in `src/components/SummaryCard.tsx`) — the summary card (cash
  `AssetIcon`, sample badge, big total, two secondary USD/gold-gram rows (see
  §6j), footer with asset count); takes `total`/`count`/`isSample`/`prices` props
  (`prices` threaded from `App.tsx`'s single `useLivePrices()` call, see §6j/§6k).
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
   7. Transaction-history modal (see §6i) — rendered as a sibling after `<main>`, only when `historyAssetId` is set (one asset row's History action was clicked); it lists that asset's transactions and holds the add-transaction form.
   8. Import modal (see §6a) — rendered as a sibling after `<main>`, only when `isImportModalOpen` is set (the toolbar's Excel-import button was clicked); a single screen combining file selection and the default replace/add/subtract mode choice, with a "بارگذاری" submit.
- All of the above (steps 1–8) only render once a user is logged in — see §6g for
  the login/signup/forgot-password screens shown instead when they are not.

## 6a. Excel import (fixed template only)

- `Toolbar` (see §6, `src/components/Toolbar.tsx`), above the "دارایی‌های من" heading
  in the portfolio `<section>`: a single "ایمپورت اکسل" `IconButton` (`tone="neutral"`,
  `UploadIcon`) that sets `App.tsx`'s `isImportModalOpen` to `true` (via the
  `onOpenImportModal` prop), opening `ImportModal` (see §4). **One unified screen**
  combines file selection AND the default-mode choice (not two separate steps like
  the earlier `ImportModeModal`, which this replaces): a file-picker button (a hidden
  `<input type="file" accept=".xlsx,.xls">` behind a styled button; once a file is
  chosen its name is shown with a "تغییر فایل" link to reselect) plus a 3-way radio
  choice for the **default mode** — **جایگذاری با دارایی فعلی** (replace: a
  full-snapshot row, no transaction), **اضافه کردن به دارایی فعلی** (add: a purchase
  row, records a buy), or **کم کردن از دارایی فعلی** (subtract: a sale row, records a
  sell, skipped if there's no matching holding) — applied to any row whose own **نوع**
  column is left empty (see below; a row can also specify its own type, overriding
  this default). A "بارگذاری" submit button, disabled until a file is chosen, calls
  `onSubmit(defaultMode, file)`; `App.tsx` closes the modal after processing. No
  drag-and-drop zone, no other format support — a plain file picker only. The actual
  parsing/state-update handler (`handleImportFile(defaultMode, file)`) lives in
  `App.tsx`.
- **Column layout** (`XLSX.read`/`XLSX.utils.sheet_to_json(sheet, { header: 1 })`
  from the `xlsx` npm package, entirely client-side — no backend, no network
  request), in this exact order: `نماد` | `تعداد` | `قیمت واحد (تومان)` | `نوع` |
  `تاریخ` | `نام دارایی (فقط نمایشی)`.
  1. First sheet only. Row 1's **first 3 headers** must equal (trimmed), in this
     exact order: `نماد`, `تعداد`, `قیمت واحد (تومان)`. The header check only
     requires **at least** those 3 columns with those exact values — columns 4-6
     (`نوع`/`تاریخ`/`نام دارایی`) are entirely **optional**: the header row may omit
     them altogether, or include them with per-row cells left empty. Header mismatch
     → `toast.error('فرمت فایل با قالب مورد انتظار مطابقت ندارد')` and nothing is
     imported (no partial import).
  2. From row 2 on, the **symbol** (column 1, `String(row[0] ?? '').trim()`) is
     looked up with `getCatalogAssetBySymbol(symbol)` (see §4
     `src/services/assetCatalog.ts`) — the **same identity source as the
     catalog-driven manual add** (§6c): the row's `code` becomes that catalog
     entry's `symbol`. No matching catalog entry → invalid, `skipped++`, continue to
     the next row. This is what makes an imported row and a manually catalog-added
     row for the same real asset carry the **same `code`**, so the merge below
     actually engages instead of creating a duplicate.
  3. **`تعداد`** (column 2, quantity) must be a finite number > 0 — otherwise parsing
     **stops at that row** (matching the prior behavior for an empty/invalid row,
     since that's where a template's trailing legend/notes text tends to live).
  4. **`قیمت واحد (تومان)`** (column 3, unit price) must be a finite number ≥ 0 —
     otherwise the row is invalid, `skipped++`, continue (does not stop parsing,
     unlike quantity, since a bad price alone doesn't look like trailing legend
     text).
  5. **`نوع`** (column 4, optional) is one of the literal English codes `buy`,
     `sell`, `replace` — case-insensitive, trimmed before comparing — or left empty.
     Empty → the row falls back to the modal's chosen default mode at
     effective-type resolution time (see below). Any other non-empty value → the
     row is invalid, `skipped++`, continue.
  6. **`تاریخ`** (column 5, optional) is an ISO `YYYY-MM-DD` date, or left empty.
     Empty → the row falls back to today's date (`new
     Date().toISOString().slice(0, 10)`) at effective-date resolution time. If the
     cell comes through as a JS `Date` object (the `xlsx` library returns `Date`
     objects for date-formatted cells, not always strings), it's converted via
     **local** year/month/day getters (`formatLocalIsoDate`, not `toISOString()`'s
     UTC conversion) to avoid an off-by-one-day shift for timezones behind UTC. A
     present-but-unparseable value (a non-`YYYY-MM-DD` string, or one that doesn't
     resolve to a real calendar date, e.g. `2026-13-40` — checked strictly via
     `parseIsoDateStrict`, which round-trips the parsed `Date` back against the
     original numbers so `new Date(...)`'s silent month/day rollover can't slip an
     invalid date through) → the row is invalid, `skipped++`, continue.
  7. **`نام دارایی (فقط نمایشی)`** (column 6, optional) is **never read** — a
     purely human-reference column left for the sheet's own bookkeeping; the
     catalog entry (via the symbol) remains the single source of truth for the
     asset's actual name.
  8. Each valid row becomes an `Asset` built from the catalog entry — `id:
     crypto.randomUUID()`, `name: catalogAsset.name`, `quantity` = col 2,
     `unitPrice` = col 3, `unit: getUnitLabel(catalogAsset.unit)`, `icon:
     getAssetIconForCatalogEntry(catalogAsset)`, `code: catalogAsset.symbol` —
     exactly the same pattern `AddAssetModal.tsx` uses for a manual add (see §6c).
     The old `importCategoryToIcon` mapping and the parse-time `getOrCreateCode`
     call are gone entirely from this path; `getOrCreateCode` is untouched for its
     other caller, the legacy-asset-migration `useEffect` in `App.tsx` (see §6h).
- **Effective type/date resolution** (`resolveEffectiveType`, `App.tsx`): for each
  parsed row, its *effective type* is its own `نوع` if set, else the modal's default
  mode mapped `add→'buy'`, `subtract→'sell'`, `replace→'replace'`; its *effective
  date* is its own `تاریخ` if set, else today. This lets a single file mix
  snapshot/purchase/sale rows freely (each row's own `نوع`/`تاریخ` override the
  modal-level default), while a file with all-empty `نوع`/`تاریخ` columns behaves
  exactly like the previous three-mode import.
- **Apply per-row** (`assetService.importAssets(rows)`, see §6d): each row's `code`
  is looked up against the asset already in the list with that same `code`, and its
  own *effective type* (not one shared mode for the whole file) decides what
  happens:
  - `replace` (a full-snapshot row): match found → that asset's
    `quantity`/`unitPrice` are **replaced** with the row's values (`id` unchanged);
    no match → appended as a brand-new asset. **No transaction is written** — a
    snapshot is not a purchase event.
  - `buy` (a purchase row): no match → appended as a brand-new asset **and** a `buy`
    transaction (row quantity/unitPrice, dated the row's *effective date*) is
    recorded for it; match → the existing asset's `quantity` is **increased** by the
    row's quantity and its `unitPrice` is updated to the row's, with a `buy`
    transaction recorded the same way (same semantics as the manual add-asset flow,
    see §6c/§6i).
  - `sell` (a sale row): match → the existing asset's `quantity` is **decreased** by
    the row's quantity, clamped at 0, `unitPrice` **left unchanged**, with a `sell`
    transaction recorded (row quantity/unitPrice, dated the row's *effective date*);
    no match → the row is **skipped** (`skippedNoMatch++`), no asset created — you
    can't record a sale against a holding you have no record of.
  - `importAssets` resolves `{ assets, added, updated, skippedNoMatch, changes }`;
    `changes` is the per-row transaction list (each entry carries that row's own
    `date`, not necessarily today) that `App.tsx` writes via
    `transactionService.addTransaction` (`Promise.all`), so imported buys/sells show
    up in each asset's history exactly like manually recorded ones, at their real
    trade date when specified (see §6d/§6i). Re-importing the same file with all
    rows left as `replace` still updates existing rows in place instead of creating
    duplicates.
- All user-facing outcomes are shown via `sonner` toasts (see §3), not inline page
  text; the toast library handles its own timing/dismissal. Wrong file extension and
  header mismatch → `toast.error`. Zero rows importable (all invalid) → `toast.error`.
  Otherwise the message reports the merge counts, e.g. `۳ دارایی اضافه شد، ۲ دارایی
  به‌روزرسانی شد` (only the non-zero halves are included), and appends — when
  non-zero — a `skippedNoMatch` half (`N ردیف بابت نبود دارایی مشابه نادیده گرفته
  شد`, `sell`-effective rows with no matching holding) and the invalid-row `skipped`
  half (`N ردیف نامعتبر رد شد`, unknown symbol / bad quantity or price / bad `نوع`
  or `تاریخ` — separate from `skippedNoMatch`). `toast.warning` when either skip
  bucket is non-zero, `toast.success` otherwise. A failure writing the recorded
  transactions (e.g. the non-secure deployed context, see §6i) adds a separate
  `toast.error` but does not undo the asset-list change that already happened.
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

## 6c. Add-asset modal (catalog-driven)

- A third `Toolbar` `IconButton` (`tone="neutral"`, `PlusIcon`) sits after the
  clear-all button, `aria-label="افزودن دارایی جدید"`, toggles `App.tsx`'s
  `isAddOpen` (`useState`) to `true`; the modal itself is `AddAssetModal` (see §4,
  §6, `src/components/AddAssetModal.tsx`), rendered only when `isAddOpen`, as a
  sibling after `<main>`, not nested inside it — taking `onClose`/`onAdd` props.
- **Catalog-driven, not free-text.** The old free-typed "نام" input + manual
  "دسته/آیکن" select were replaced with a single "دارایی" field populated from
  `getCatalogAssets()` (`src/services/assetCatalog.ts`, see §4). Picking an
  entry determines its name, category/icon, and unit all at once — this was an
  owner-requested fix to stop free-typed names from creating
  duplicate/inconsistent entries (e.g. "طلا ۱۸" vs "طلای ۱۸ عیار").
- **Searchable combobox, not a native `<select>`** (`src/components/AssetPicker.tsx`,
  see §4) — a custom component (plain React state + Tailwind, no external
  combobox/autocomplete library) replacing an earlier native
  `<select>`/`<optgroup>` version that forced scrolling through a long list.
  Takes `selectedSymbol`/`onSelect` props from `AddAssetModal`.
  - Renders a text `<input role="combobox">` showing the selected asset's name
    (placeholder `"جستجوی دارایی..."` when nothing is selected). Focusing or
    clicking it opens a dropdown panel below (`absolute`, same card/border/shadow
    tokens as the app's other cards — see §7).
  - Typing filters `getCatalogAssets()` live to entries whose `name` **or**
    `symbol` contains the typed text — a simple case-insensitive substring
    match (`.toLowerCase().includes(...)`), no fuzzy-search library; works
    for Persian names since `toLowerCase()` is a harmless no-op on
    non-Latin text.
  - Filtered results stay grouped by category exactly as before, rendered as
    a plain list with category-label headers (`getCategoryLabel(...)`)
    instead of `<optgroup>`s. No matches → a small "دارایی‌ای پیدا نشد"
    message instead of an empty panel.
  - Clicking a result calls `onSelect(symbol)`, fills the input with that
    asset's name, and closes the panel — triggering the same
    auto-fill-unit/`code`-as-`symbol`/merge-on-duplicate-symbol logic
    described below (unchanged from the previous native-`<select>` version).
  - Keyboard: `ArrowDown`/`ArrowUp` move a highlighted result (also opens the
    panel if closed), `Enter` selects the highlighted result, `Escape` closes
    the panel **without** changing the selection (the input reverts to
    showing the previously selected asset's name).
  - Closes on outside click via the same `fixed inset-0` backdrop pattern the
    app's modals/drawer already use (see `AddAssetModal`/`ProfileModal`/
    `ForgotPasswordModal`/`SideDrawer`) — a full-screen invisible `fixed
    inset-0` div behind the dropdown panel, `onClick` closes; the panel itself
    `stopPropagation`s so clicking inside it doesn't close.
  - Dropdown panel `max-h-[280px]` (bumped from an earlier `220px`) so ~5
    result rows are visible by default before `overflow-y-auto` kicks in —
    with fewer than 5 matches the panel just sizes to the actual content
    (no forced empty space); see the 2026-09-24 overflow-fix decision-log
    entry below for why `220px` looked cut off in the first place.
- **واحد (unit) is now locked**, not free-typed: a read-only/disabled text
  input showing `getUnitLabel(selectedAsset.unit)` for whichever catalog entry
  is currently selected — the unit is determined by the catalog entry, never
  manually entered.
- **مقدار (quantity)** and **قیمت واحد (unit price)** stay free-entry number
  fields, unchanged (see the comma-formatting note below).
- On submit, the new `Asset.code` is set **directly to the selected catalog
  entry's `symbol`** (e.g. `GOLD18`, `USDT`) — `getOrCreateCode` (see §5) is
  **not** called for catalog-driven adds; that auto-generated-code path is now
  only a fallback for assets outside the catalog (currently: pre-catalog
  migrated data, see §6h, and the Excel import, see §6a). `icon` is derived via
  `getAssetIconForCatalogEntry(selectedAsset)` (see §4) so `AssetIcon`/`iconTint`
  (which only know the 7 `Asset['icon']` keys) keep working unchanged: catalog
  `gold→gold`, `cash→cash`, `stock→other`, and `currency` symbols `USDT`/`BTC`/
  `ETH→` those exact icon keys, any other `currency` symbol (`USDC`, `BNB`,
  ...) `→other`.
- **Merge-on-same-symbol** (see §6, `App.tsx`'s `handleAddAsset`): before
  adding, the existing `items` list is checked for an asset whose `code`
  already matches the selected catalog symbol.
  - Match found → treated as "I'm adding to what I already have": the
    **existing** asset's `quantity` is **increased** by the newly entered
    quantity (added, not replaced — unlike Excel import, see §6a, which is a
    replace) and its `unitPrice` is updated to the newly entered value; its
    `id` is unchanged. `toast.success('مقدار <name> افزایش یافت')`.
  - No match → a brand-new asset is added, same as before.
    `toast.success('دارایی جدید اضافه شد')`.
- Modal markup: a `fixed inset-0` semi-transparent black backdrop (`bg-black/50`)
  that closes on click (calls `onClose`), containing a centered white card (same
  rounded/border/shadow tokens as other cards — see §7) with a top-corner "×"
  `CloseIcon` button. Clicking inside the card (`stopPropagation`) does not close it.
  A `useEffect` inside `AddAssetModal` adds/removes a `keydown` listener on mount that
  closes (`onClose`) on `Escape` while the modal is open.
  - **`AddAssetModal` is unique among the app's modals** in where the scroll
    boundary lives: the outer `fixed inset-0` backdrop itself has
    `overflow-y-auto` (plus an inner `min-h-full grid place-items-center`
    wrapper to keep the card centered while still scrollable), and the card
    (`<section>`) has **no** `overflow-y-auto`/`max-h-[90vh]` of its own —
    unlike `ProfileModal`/`ForgotPasswordModal`, which still put
    `overflow-y-auto max-h-[90vh]` directly on their `<section>` card. This
    is deliberate: `AddAssetModal` is the only modal containing `AssetPicker`
    (an `absolute`-positioned dropdown panel that must render *outside* the
    card's own content flow, anchored under the input) — a scrollable card
    would clip that dropdown against its own edge and/or show two competing
    scrollbars. If `AssetPicker` (or another absolutely-positioned overlay)
    is ever added to `ProfileModal`/`ForgotPasswordModal`, apply this same
    backdrop-owns-the-scroll pattern there too instead of the card. Card
    `max-w-[480px]` (bumped from `440px`) to give the picker/dropdown a bit
    more breathing room.
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
   `Asset.quantity`/`unitPrice` are unaffected. The two helpers live in
   `src/format.ts` (see §4) and are imported here — the transaction-history
   modal's add-transaction form (see §6i) reuses the same pair. This formatting is
   limited to numeric-entry inputs — the summary total, asset rows, etc. keep
   using `Intl.NumberFormat('fa-IR')` via `format()` as before.

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
    // Merges by `code` (see §6a) instead of always appending; each row carries
    // its own resolved `effectiveType` (independent per row, not one mode for
    // the whole file): 'replace' overwrites a matched asset's quantity/unitPrice
    // or appends (no transaction); 'buy' adds the row's quantity (updating unit
    // price) or appends and records a 'buy' dated the row's effectiveDate;
    // 'sell' subtracts the row's quantity (clamped at 0, unit price untouched)
    // and records a 'sell' dated the row's effectiveDate, or skips unmatched
    // rows. added/updated/skippedNoMatch report how many rows landed in each
    // bucket and `changes` is the per-row transaction list for 'buy'/'sell' rows.
    importAssets(rows: ImportRow[]): Promise<ImportResult>;
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
   list (`importAssets` additionally resolves the `added`/`updated`/`skippedNoMatch`
   counts plus the per-row `changes` transaction list — see §6a).
- `assetService.ts` exports a single instance, `export const assetService:
  AssetService = localAssetService;` — this one line is the only place that will
  need to change to point at a server-backed implementation later; no component or
  `App.tsx` code needs to change.
- `App.tsx` calls `assetService.listAssets()` once in a mount-time `useEffect`
  (replacing the old synchronous `loadAssets() ?? assets` initializer) and every
  handler (`handleAddAsset`, `handleDelete`, `handleEdit`, `clearAllAssets`,
  `handleImportFile`) is now `async`, `await`s the matching `assetService.xxx(...)`
  call, and sets the returned full list into `items` state. `handleDelete` also
  calls `transactionService.deleteTransactionsForAsset(id)` after deleting the
  asset, and `clearAllAssets` deletes transaction rows for every asset that was
  present before clearing, so future transaction history cannot be orphaned when
  asset rows are removed; this cleanup intentionally lives at the UI action
   boundary rather than inside `localAssetService`, keeping the services
   independent. `handleAddAsset` additionally writes a `buy` transaction on both
   its merge-into-existing and brand-new branches, and `handleTransactionRecorded`
   (called from the history modal's add-transaction form) writes an
   asset-quantity update — both also go through the service layer
   (`transactionService.addTransaction` / `assetService.updateAsset`), so the
   write paths follow the same pattern (see §6i). The local
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

## 6h. Asset identity codes (`code` field, migration)

- See §5 for the `code` field/format and §4 for
  `src/services/assetCodeRegistry.ts` (`getOrCreateCode`). §6c covers manual
  add-asset code assignment and §6a covers the (now catalog-driven) Excel import;
  both assign `code` directly from the catalog `symbol`. This section covers the
  one-time migration that backfills `code` on legacy assets that predate the field
  — editing an asset never reassigns/changes its `code` (only quantity/unit price
  are editable, see §6).
- The mount-time `useEffect` in `App.tsx` that calls `assetService.listAssets()`
  (see §6d) now also assigns codes:
  - If `listAssets()` resolves `null` (untouched sample, see §6/§6d), the static
    `assets` sample is run through `getOrCreateCode(asset.icon, asset.name)` for
    display only — `items` gets codes, but the sample list itself is **not**
    written through `assetService` (doing so would turn `oracle_assets_v1`
    non-null and permanently flip `isSample` to `false` even though the owner
    hasn't touched anything). The registry mapping is still recorded, though,
    so if the owner later adds a real asset with the exact same name/category as
    a sample row, `getOrCreateCode` returns that same code instead of minting a
    new one.
  - If `listAssets()` resolves a stored list, any asset missing `code` gets one
    via `getOrCreateCode`, and is persisted through
    `assetService.updateAsset(id, { code })` (no new `AssetService` method was
    added — this reuses the existing partial-update method) so the migration
    only has to run once per asset; assets that already have a `code` are left
    untouched.
- This migration exists purely so the 7 sample assets and any pre-existing real
  `localStorage` data end up with a code through the exact same
  `getOrCreateCode` path used for everything else — no codes are hardcoded into
  `src/assets.ts`.

## 6i. Transaction history (view + write)

- Each `AssetRow` shows a third ghost `IconButton` — a clock-with-rewind
  `HistoryIcon` (`aria-label="تاریخچه"`, `tone="neutral"`), placed to the right of
  the existing edit/delete buttons (i.e. first in the RTL button row) — that calls
  the row's `onHistory(asset.id)`. `App.tsx` passes `setHistoryAssetId`, so only the
  clicked asset's history opens. This action is visible in the row's default (not
  editing) state, alongside edit/delete; it does not change the dashboard layout,
  which still shows exactly one row per asset and the toman total.
- `TransactionHistoryModal` (`src/components/TransactionHistoryModal.tsx`) shows
  that asset's transactions only (filtered by `assetId` — opening one asset never
  surfaces another asset's rows). Each row shows the type as a small
  badge (خرید = buy, blue/violet tint; فروش = sell, neutral grey tint), the date
  formatted in Persian via `formatDate` (§4 `src/format.ts`), the quantity with the
  asset's unit (8 decimals, same as the dashboard), and the price per unit in
  toman. Optional `note` is shown when present.
- **Lazy opening balance (see §5):** on mount the modal awaits
  `ensureInitialTransaction(asset)` before listing — a pre-existing asset with a
  positive `quantity` but no transaction history gets one synthetic initial `buy`
  (current `quantity`/`unitPrice`, dated today) the first time its history is
  opened; assets with no holdings or with any existing history are untouched
  (`ensureInitialTransaction` is a no-op for both). In dev, StrictMode
  double-invokes the mount effect, so the call is memoized in a
  `useRef<Promise<void> | null>` shared in-flight promise so it runs exactly once
  per open; the list is fetched only after that promise settles, and on a failure
  (e.g. `crypto.randomUUID()` unavailable in the non-secure deployed context — see
  the secure-context note below) the modal still lists whatever is already stored
  instead of hanging on the loading state.
- **Add-transaction form:** below the list, a "ثبت تراکنش جدید" form lets the owner
  manually log a past or new buy/sell for this asset (backfilling pre-feature
  purchases, recording a sale, ...). Fields: a خرید/فروش segmented toggle (same
  tab-toggle styling as `AuthScreen`'s login/signup tabs — `grid grid-cols-2`,
  active = `bg-[#5264e8] text-white`), a مقدار (quantity) and a قیمت واحد به تومان
  (unit price) input using the shared `stripToNumberString`/`formatWithThousands`
  comma-formatting (text inputs, `inputMode="numeric"`, same as `AddAssetModal`,
  see §6c), a `<input type="date">` defaulting to today (local date), and an
  optional یادداشت (note) text input; the submit button reads "ثبت تراکنش".
  On submit: client-side validation requires `quantity > 0` and `unitPrice >= 0`
  (and a date) — otherwise `toast.error('مقدار و قیمت واحد را به‌درستی وارد
  کنید.')` and the service is not called. Valid input →
  `transactionService.addTransaction({ assetId, type, quantity, unitPrice, date,
  note: note || undefined })`; on success `toast.success('تراکنش ثبت شد')`, the
  list is re-fetched so the new row appears immediately, the form resets to
  defaults (date back to today), and the `onTransactionRecorded(assetId, type,
  quantity)` prop fires. On failure (the service throws, e.g. its internal
  validation) `toast.error(...)` with the error message and the form is left
  untouched.
- **Asset quantity sync:** `App.tsx`'s `handleTransactionRecorded` (passed as
  `onTransactionRecorded`) looks the asset up in `items` and calls
  `assetService.updateAsset(assetId, { quantity })` — buy: `current + quantity`;
  sell: `Math.max(0, current - quantity)` (never negative) — then sets the
  returned list into `items`. The asset's `unitPrice` is **deliberately never
  touched** from this flow: the transaction's unit price is only that record's
  historical trade price (kept in transaction history for future P/L
  calculation); the live portfolio `unitPrice` still changes only via the
  pencil-icon edit on the row.
- **Add-asset writes (see §6c):** `App.tsx`'s `handleAddAsset` now records a `buy`
  transaction in both branches — the merge-into-existing branch (an
  already-listed catalog asset) and the brand-new-asset branch:
  `transactionService.addTransaction({ assetId, type: 'buy', quantity:
  newAsset.quantity, unitPrice: newAsset.unitPrice, date: <today> })`, i.e. the
  *entered* quantity (the amount being added, not the new total) at the entered
  unit price.
- **Sort:** displayed newest-first (`date` descending, stable by original array
  order for tied dates) — this is display-only; the stored array and the
  chronological `computeHoldingSummary` logic are untouched.
- **Empty state:** after the lazy opening-balance step, an asset that still has no
  transactions (currently: zero-quantity assets) shows a centered message "هنوز
  تراکنشی برای این دارایی ثبت نشده است." (no transactions recorded yet) and, when
  the quantity is positive, a second line saying past trades have not been
  recorded yet.
- **Sample badge:** when `isSample` is true (the list is still the untouched
  static sample), the modal shows the same "نمایش نمونه" badge `SummaryCard` uses,
  so sample assets' history is clearly labelled as sample, not real holdings.
  (Sample assets do have quantities, so opening one will also get its synthetic
  initial buy in `localStorage` — accepted, since sample rows are not real
  holdings; the badge keeps it clearly labelled.)
- **Closing:** identical to the app's other modals (`ProfileModal`/
  `AddAssetModal`) — a top-corner "×" `CloseIcon` button, a `useEffect` `keydown`
  listener closing on `Escape`, and a `fixed inset-0 bg-black/50` backdrop that
  closes on click (the card `stopPropagation`s). Uses the card-owns-the-scroll
  variant (`max-h-[90vh] overflow-y-auto` on the `<section>`), matching
  `ProfileModal`/`ForgotPasswordModal`, since this modal has no absolutely
  positioned overlay to clip.
- **Scope (later tasks):** no edit/delete of transactions, no realized-P/L
  display (`computeHoldingSummary` is still UI-uncalled), and no separate
  "opening balance" transaction type yet (the lazy initial entry is a synthetic
  `buy`).
- **Intentionally NOT writing transactions:** the pencil-icon manual edit
  (`handleEdit`) still does **not** create a transaction record — direct edits are a
  known open decision (should they log an implicit buy/sell?). Excel import now
  **does** write transactions, but only for rows whose *effective type* (see §6a) is
  `buy`/`sell` (per-row `نوع`, or the modal's default mode when a row leaves it
  empty); a row whose effective type is `replace` — a full-snapshot value — writes
  none, since a snapshot is not a purchase event.
- **Secure-context note:** the add-transaction form (and the `handleAddAsset` and
  Excel-import buy/sell transaction writes) rely on
  `localTransactionService.addTransaction`, whose `crypto.randomUUID()` ID
  generation is a `[SecureContext]`-only API. The deployed origin
  (`http://45.82.137.126:8580/`, plain HTTP on a bare IP) is a non-secure
  context where it is `undefined`, so recording transactions there fails until
  HTTPS is set up; failures surface as a `toast.error` (for the import, the
  asset-list change already committed still stands — only the transaction rows
  fail). All existing
  `crypto.randomUUID()` usages (`localAssetService`/`AddAssetModal` asset ids, the
  Excel import, `localTransactionService`) remain for the dedicated cleanup in
  task 6.

## 6j. Live prices (mock) — USD / gold-gram equivalents

- **Mock only — not a real price feed.** `src/services/priceService.ts`/
  `mockPriceService.ts` (see §4) follow the exact same singleton-swap pattern as
  `assetService`/`profileService`/`authService`/`transactionService` (see §6d):
  `LivePrices = { usdToman, goldGramToman }` and a `PriceService` interface
  (`getPrices()`, `subscribe(callback): () => void`, `refreshNow(): Promise<LivePrices>`),
  with `priceService` currently `= mockPriceService`. Swapping in a real
  server-backed price API later only requires replacing that one exported
  instance — no component/hook code changes.
- `mockPriceService` keeps two **in-memory** numbers, starting at `usdToman:
  230,000` toman (≈ 1 US dollar) and `goldGramToman: 24,000,000` toman (≈ 1 gram
  of 18-karat gold) — realistic-looking reference rates, not arbitrary
  round-number placeholders. Once at least one subscriber is active, a single
  shared `setInterval` (60,000ms = 60s) nudges each value via a shared
  `jitterStep()` function — the single place both the interval tick and
  `refreshNow()` (below) apply the jitter, so they can never drift out of sync.
  The jitter is a **fixed absolute toman amount** (not percentage-based, unlike
  the original version of this feature): `usdToman += Math.random() * 40 - 20`
  (±20 toman) and `goldGramToman += Math.random() * 4000000 - 2000000`
  (±2,000,000 toman) each step — this is intentionally fake movement, not
  derived from any real market data. `getPrices()` resolves the current values
  immediately (a one-off read); `subscribe(callback)` calls `callback`
  immediately with the current values (so a new subscriber never waits a full
  minute for its first render), registers it to also be called on every
  subsequent tick, and returns an unsubscribe function — the interval itself is
  cleared once the last subscriber unsubscribes, so no timer leaks when nothing
  in the UI is mounted (e.g. between page loads in dev, or if `SummaryCard` is
  ever unmounted). `refreshNow()` runs `jitterStep()` immediately and notifies
  all current subscribers the same way a tick does, **without** resetting the
  60-second interval's own timer — a manual refresh and the next scheduled tick
  are independent.
- `src/hooks/useLivePrices.ts` — `useLivePrices(): LivePrices | null` wraps
  `priceService.subscribe(...)` in a mount/unmount `useEffect`, holding the latest
  value in `useState`. Starts `null` until the first callback arrives, so a caller
  can distinguish "not loaded yet" from "loaded" instead of momentarily rendering a
  flash of zeroed-out conversions. Both automatic ticks and manual `refreshNow()`
  calls flow through this same `subscribe` callback, so `SummaryCard` (below)
  can't tell them apart — and deliberately doesn't need to.
- `SummaryCard` (see §6, `src/components/SummaryCard.tsx`) calls `useLivePrices()`
  directly (no prop threaded through `App.tsx` — the hook is the only thing that
  needs `priceService`). The toman total keeps its own row exactly as before
  (unchanged size/prominence, `text-[44px]` etc. — it stays the single largest
  number on the card). Below it, **two separate stacked rows** show the USD and
  gold-gram equivalents, each with its own small icon in a tinted rounded badge
  (`w-6 h-6 rounded-[8px]`, the same icon-badge pattern used elsewhere in this file
  and in `AssetRow`/`iconTint`) and its own color, so each currency reads as a
  distinct, easy-to-scan line rather than one small muted inline string:
  - دلار row: `DollarIcon` (see §4 `src/components/icons.tsx`) in a green badge
    (`bg-[#d7f5e0]`/`text-[#1f9d55]` — reusing the exact green already used for
    "buy" elsewhere, e.g. `TransactionHistoryModal`'s خرید badge/toggle), text
    `≈ <format(total / prices.usdToman, 2)> دلار` in that same green
    (`text-[#1f9d55]`), `text-[13px] font-medium`.
  - گرم طلا row: `GoldBarIcon` (see §4) in the existing gold tint
    (`bg-[#fff5df]`/`text-[#d7a144]`, i.e. `iconTint.gold` from `AssetIcon.tsx`),
    text `≈ <format(total / prices.goldGramToman, 2)> گرم طلا` in that same gold
    (`text-[#d7a144]`), `text-[13px] font-medium`.
  Both figures come from the same live `total` (toman) prop the big number
  already uses, 2 decimal places via the existing `format(value, decimals)`
  helper (see §6). While `prices` is `null`, both rows are still rendered (with a
  fallback divisor of `1` so no `NaN`/`Infinity` briefly flashes) but wrapped in
  an `invisible` container — kept in the layout (reserving the exact same height)
  but not shown — so there's no flash of a wrong/zero value and no layout shift
  once `prices` resolves a moment later.
- **Manual refresh button.** The "ارزش کل دارایی‌ها" heading row is now
  `flex justify-between items-center`, with a small round `RefreshIcon` button
  (`aria-label="بروزرسانی قیمت‌ها"`, `text-[#9096aa]`, hover tint) at the row's
  other end — same small unobtrusive style as the other muted icon badges in
  this file. Clicking it calls `priceService.refreshNow()` directly (imported
  in `SummaryCard.tsx`; no prop threaded through `App.tsx`, same as
  `useLivePrices`). The button does **not** itself trigger the spin — local
  `isSpinning` state is driven by a `useEffect` watching the `prices` value
  from `useLivePrices()`: on every change to a new, non-initial value it sets
  `isSpinning` to `true` for ~700ms (`setTimeout`, cleaned up on unmount/
  re-trigger) via `animate-spin` on the icon. Since both the automatic 60s tick
  and a manual `refreshNow()` call flow through the exact same `prices`-changed
  path, the icon spins identically regardless of which one caused the update —
  there is no separate manual-refresh spin trigger to keep in sync. The button
  is `disabled` (and visually dimmed) while `isSpinning` is true, so rapid
  repeated clicks can't stack overlapping refreshes.
- No settings/toggle to hide the USD/gold-gram rows and no historical/trend
  display — just the two current-instant conversions, now with a manual
  refresh option alongside the automatic 60s drift. This is explicitly a mock
  groundwork feature per the owner's request; do not present these USD/gold-gram
  figures as real market data anywhere in the UI/docs until a real
  `PriceService` implementation replaces `mockPriceService`.
- **Per-unit rate sub-text on the دلار/گرم طلا rows.** Each row also shows a
  small muted (`text-[10px]`, lighter tint than the row's main `text-[13px]`
  figure) secondary string next to the converted amount: `هر دلار
  <format(prices.usdToman)> تومان` / `هر گرم <format(prices.goldGramToman)>
  تومان` — the current live per-unit rate itself, not just the converted
  total. Comes from the same `prices` prop as everything else on the card, so
  it updates on every tick/manual refresh in lockstep with the big total and
  the conversion rows.
- **`prices` is now a prop, not an internal hook call.** `useLivePrices()` is
  called exactly once, in `App.tsx` (see §6/§6k below), and threaded down as a
  `prices: LivePrices | null` prop to both `SummaryCard` and every `AssetRow`
  — this is what lets `App.tsx` also drive individual assets' unit prices
  from the same live feed (see §6k). `SummaryCard` itself no longer imports or
  calls `useLivePrices`; the `isSpinning`/manual-refresh-button behavior above
  is unchanged, just now keyed off the `prices` prop instead of a local hook
  result.

## 6k. Live-priced assets (GOLD18 / USDT unit price driven by the live feed)

- **Two specific catalog assets — GOLD18 (طلای ۱۸ عیار) and USDT (تتر) — now
  get their `unitPrice` computed live from `priceService` instead of their
  manually stored/imported value**, so their row total AND the overall
  portfolio total update automatically on every price refresh (60s automatic
  tick or the manual refresh button, see §6j). Every other asset is
  completely unaffected and keeps its manually entered/imported `unitPrice`
  exactly as before — this is a **hardcoded, explicit allow-list of two
  assets**, not a general "all catalog assets are live-priced" rule.
- New `src/services/livePriceMapping.ts` (see §4) is the single source of
  truth for this mapping: a `LIVE_PRICE_ASSET_CODES: Partial<Record<string,
  keyof LivePrices>>` object (`{ GOLD18: 'goldGramToman', USDT: 'usdToman' }`)
  keyed by `Asset.code` (the catalog symbol, see §5 — **not** name/id, so it
  only ever matches an asset that actually came from the catalog with that
  exact symbol), plus two pure helpers: `getLivePriceKeyForAsset(asset)` →
  the matching `LivePrices` key or `null`, and
  `getEffectiveUnitPrice(asset, prices)` → `prices[key]` when the asset is
  live-priced **and** `prices` has resolved, else `asset.unitPrice`
  unchanged (so before the live feed's first callback arrives, a live-priced
  asset still shows its last-stored/sample price rather than `0`/`NaN`).
  Adding a third live-priced asset later is a one-line change to this map —
  no other file needs to change.
- **`App.tsx`** now calls `useLivePrices()` once (instead of `SummaryCard`
  calling it internally, see §6j) and passes the resulting `prices` down as a
  prop to both `<SummaryCard>` and every `<AssetRow>`. The page `total` is now
  `items.reduce((sum, asset) => sum + asset.quantity *
  getEffectiveUnitPrice(asset, prices), 0)` — every other total/row-value
  computation described in §5 ("Row value = quantity × unitPrice") continues
  to apply verbatim for non-live-priced assets, since `getEffectiveUnitPrice`
  falls straight through to `asset.unitPrice` for them.
- **`AssetRow`** takes the new `prices: LivePrices | null` prop and computes
  `livePriceKey = getLivePriceKeyForAsset(asset)` /
  `effectiveUnitPrice = getEffectiveUnitPrice(asset, prices)` once per
  render. The row's value (`format(asset.quantity * effectiveUnitPrice)`)
  always uses `effectiveUnitPrice`, not the raw `asset.unitPrice`. When the
  asset is live-priced and `prices` has resolved, a small muted extra line
  (`text-[10px] text-[#a2a8b9]`, matching the row's existing quantity-line
  style one size down) appears under the quantity/unit line:
  `<format(effectiveUnitPrice)> تومان / <unit>` — e.g. `۲۴,۰۰۰,۰۰۰ تومان /
  گرم`. In **edit mode**, a live-priced asset no longer shows the editable
  unit-price `<input>` — it's replaced with a small read-only "قیمت زنده"
  label (muted badge style, `text-[#5264e8] bg-[#eef0ff]`) so it's visually
  obvious this asset's price can't be hand-edited; quantity stays editable
  exactly as before. Saving a live-priced asset's edit calls `onEdit(id,
  quantity, asset.unitPrice)` — the asset's **existing stored** `unitPrice`
  is passed through unchanged (never read for display anymore, but kept
  intact rather than discarded, in case the live-price mapping is ever
  removed for that asset later). Non-live-priced assets keep exactly today's
  edit behavior (both quantity and unit price editable and saved).
- **Why `unitPrice` is kept, not removed, on live-priced assets:** it remains
  the value shown as the starting draft the one time editing starts (`String
  (asset.unitPrice)`, immediately overridden/hidden by the "قیمت زنده" badge)
  and is preserved on save so no data is silently lost if this asset is ever
  un-mapped from the live feed — `Asset.unitPrice` itself (§5) is unchanged
  as a required field on the type.
- This only engages for an asset whose `code` is exactly `GOLD18` or `USDT`
  (the catalog symbols — see §5/§6c) — a manually re-added asset with a
  similar name but no catalog `code`, or a legacy pre-catalog asset that only
  got an auto-generated `<PREFIX>-<NNNN>` code (see §5), is **not** affected
  and keeps manual pricing, exactly as intended.

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
| 2026-09-24 | Owner-requested: added a permanent, unique `code: string` field (`<PREFIX>-<NNNN>`, e.g. `GOLD-0001`) to `Asset` — identity groundwork for a future transaction-history feature (no transaction logic added yet). New `src/services/assetCodeRegistry.ts` (`getOrCreateCode(category, name)`, see §4/§5) generates/looks up codes via two `localStorage` keys: a per-prefix counter (`oracle_code_counters_v1`) and a `category+name` → `code` lookup (`oracle_asset_registry_v1`), so the same real-world asset (same category + name, case-insensitive) always resolves to the same code across separate Excel imports or manual re-entry. A one-time migration in `App.tsx`'s mount-time `listAssets()` effect (see §6h) backfills `code` on any asset missing one — including the 7 static samples, which get codes assigned at runtime rather than hardcoded into `src/assets.ts` — and persists real (non-sample) assets back through `assetService.updateAsset` so it only runs once per asset. The `code` is purely an internal identity field for now: not shown in the UI, and not yet wired into the Excel import or add-asset form (explicit follow-up tasks). |
| 2026-09-24 | Owner-requested: `AddAssetModal`'s submit handler (see §6c) now calls `getOrCreateCode(formIcon, name)` and attaches the result as the new `Asset`'s `code`, so manually added assets get an identity code immediately instead of only through the migration — re-adding an asset with the same name+category reuses its existing code. Editing an asset (quantity/unit price only, no name/category edit exists) never calls `getOrCreateCode` and never touches `code`, confirming identity is stable across edits. Excel import still does not assign codes (next follow-up task). |
| 2026-09-24 | Bug fix (owner-reported): re-importing an Excel file (or a fresh export of unchanged holdings) no longer creates duplicate rows. `parseImportRows` (see §6a) now assigns each row a `code` via `getOrCreateCode` at parse time; `assetService.importAssets` (see §6d) merges by that `code` instead of always appending — a match REPLACES the existing asset's `quantity`/`unitPrice` (keeping its `id`, not summed with the old values, since the export reflects the current total holding, not a new purchase), no match appends a new asset as before. `importAssets` now resolves `{ assets, added, updated }`; the post-import toast reports both counts (e.g. `۳ دارایی اضافه شد، ۲ دارایی به‌روزرسانی شد`) instead of one combined "imported" count. Header validation/category mapping and manual add/edit were untouched. |
| 2026-09-24 | Owner-requested: added a fixed, owner-provided asset catalog (`src/data/assetCatalog.json`, 20 known assets across gold/currency/stock/cash categories, plus `src/services/assetCatalog.ts` — see §4/§5/§6c) and switched the add-asset form (`AddAssetModal`) from a free-typed "نام" input to a catalog-driven `<select>` grouped by category, with واحد (unit) now locked from the catalog entry instead of free-typed. **Catalog symbols are now the source of truth for asset identity**: `Asset.code` for any catalog-driven add is set directly to the selected entry's `symbol` (e.g. `GOLD18`, `USDT`) rather than generated via `getOrCreateCode` — that auto-generated-code path (`assetCodeRegistry.ts`) is kept only as a fallback for non-catalog assets (currently: the one-time pre-catalog migration, see §6h, and the Excel import, see §6a, which is not yet catalog-aware — noted with a `TODO` code comment as the next follow-up task). Added `getAssetIconForCatalogEntry` to map the catalog's 5 categories (gold/currency/stock/cash/other) onto the existing 7 `Asset['icon']` keys so `AssetIcon`/`iconTint` needed no changes. Manually adding a catalog asset that already exists in the list (matched by `code`/`symbol`) now merges — quantity is ADDED to the existing amount (this is a manual "I already have some of this" action, unlike Excel import's replace-on-match behavior) and unit price is updated — instead of creating a duplicate row, with a distinct success toast for the add-new vs. merge-into-existing cases. |
| 2026-09-24 | Owner-requested: replaced the add-asset form's native `<select>`/`<optgroup>` catalog picker (previous entry above) with a custom searchable combobox, `src/components/AssetPicker.tsx` (see §4/§6c) — a text input that filters the catalog live as the owner types (case-insensitive substring match on name or symbol) instead of forcing a scroll through a long dropdown. Built with plain React state + Tailwind only, **no external combobox/autocomplete library added** (no react-select/downshift/etc.), matching how the rest of this app is built. Supports keyboard use (Up/Down to move a highlighted result, Enter to select, Escape to close without changing the selection), a "دارایی‌ای پیدا نشد" message when nothing matches, and closes on outside click reusing the app's existing `fixed inset-0` backdrop pattern (same one `AddAssetModal`/`ProfileModal`/`ForgotPasswordModal`/`SideDrawer` already use) rather than a new document-click-listener pattern. Results stay grouped by category exactly as before, just rendered as a plain list with category headers instead of `<optgroup>`s. Everything downstream of selection — auto-filled unit, `code` set to the catalog `symbol`, merge-on-duplicate-symbol — is unchanged; only how the asset is picked changed. |
| 2026-09-24 | Bug fix (owner-reported): `AssetPicker`'s dropdown panel was overflowing outside/beside the `AddAssetModal` card and showing two overlapping scrollbars. Root cause: the card (`<section>` in `AddAssetModal.tsx`) had `overflow-y-auto max-h-[90vh]` directly on it, making it the nearest scrollable/clipping ancestor for the picker's `absolute`-positioned dropdown — the dropdown's own `overflow-y-auto` panel was fighting the card's scrollbar instead of being the only one. Fix: moved the scroll boundary from the card to the modal's outer `fixed inset-0` backdrop (`overflow-y-auto` there instead), with a new inner `min-h-full grid place-items-center` wrapper keeping the card centered; the card itself now has no `overflow`/`max-h` of its own, so it never clips the dropdown, and only the dropdown panel (or, if content overall exceeds the viewport, the backdrop) scrolls — never both competing over the same content. Also bumped the card's `max-w-[440px]→[480px]` and the dropdown panel's `max-h-[220px]→[280px]` (the old value only fit ~2–3 result rows; the new one comfortably shows ~5 without forcing empty space when there are fewer matches). Filter/grouping/keyboard-nav logic in `AssetPicker` untouched — layout/sizing only. See §6c for the updated overlay-pattern note (`AddAssetModal` now intentionally differs from `ProfileModal`/`ForgotPasswordModal` in where the scroll lives, because it's the only modal containing an absolutely-positioned dropdown). |
| 2026-09-24 | Owner-requested: added the transaction-history data/service foundation (no UI yet): `Transaction`/`TransactionType` in `src/types/transaction.ts`, `src/transactionStorage.ts` with `localStorage` key `oracle_transactions_v1`, `TransactionService`/`localTransactionService` using the same singleton-swap pattern as `AssetService`, and `src/services/transactionCalculations.ts` with weighted-average-cost `computeHoldingSummary(...)` plus `ensureInitialTransaction(asset)` for lazy migration of pre-transaction assets. Transactions relate to assets by `assetId = Asset.id`; deleting one asset or clearing all assets now also calls `transactionService.deleteTransactionsForAsset(...)` from `App.tsx`, deliberately outside `localAssetService` so the two services remain independent. Add/update reject invalid `quantity <= 0` or `unitPrice < 0`. Weighted-average summary processes transactions chronologically, updates average cost only on buys, keeps average cost unchanged on sells, computes realized P/L from sell price minus current average cost, and clamps bad-data oversells so quantity never goes negative. |
| 2026-09-24 | Owner-requested (transaction-history UI, task 1 of a 6-part rollout): added a **read-only** per-asset transaction-history view. Each `AssetRow` now has a "تاریخچه" ghost `IconButton` (new `HistoryIcon`) that opens `TransactionHistoryModal` (new, §6i), which loads `transactionService.listTransactionsForAsset(asset.id)` and lists that asset's transactions newest-first (type badge خرید/فروش, Persian `formatDate` date, quantity+unit, toman price-per-unit, optional note) with a clear empty state. The modal reuses the `ProfileModal` overlay pattern (×/Escape/backdrop). Added a `formatDate(isoDate)` Persian date helper to `src/format.ts` (local-date parse of `YYYY-MM-DD`). Strictly read-only: no buy/sell form, no opening balance, no edit/delete of transactions, and `Asset.quantity` is untouched; the history panel never creates/seeds transactions, and `ensureInitialTransaction` remains uncalled (a balance-with-no-history asset shows an explicit "past trades not yet recorded" empty state instead). Sample assets are shown with the "نمایش نمونه" badge and are never seeded. Verified the deployed origin (`http://45.82.137.126:8580/`) is a plain-HTTP non-secure context; this task adds no new `crypto.randomUUID()` path, leaving the existing secure-context-only ID usages for the task-6 cleanup. Build (`npm run build`) passes. |
| 2026-09-24 | Owner-requested (transaction-history UI, task 2 of the 6-part rollout): wired transaction **writing** into the app — transactions are now written (a) on every "add asset" action, in `App.tsx`'s `handleAddAsset`, in both branches: the merge-into-existing branch records a `buy` for the **entered** quantity (the amount being added, not the new total) at the entered unit price, and the brand-new-asset branch records a `buy` representing the initial purchase (both dated today, via `transactionService.addTransaction`); and (b) via a new manual "add transaction" form in `TransactionHistoryModal` — a خرید/فروش segmented toggle (styled like `AuthScreen`'s login/signup tabs), quantity + unit-price inputs (the comma-formatting helpers `stripToNumberString`/`formatWithThousands` were extracted from `AddAssetModal.tsx` into the shared `src/format.ts` and are now imported by both), a date input defaulting to today, an optional note, and a "ثبت تراکنش" submit that validates quantity > 0 / unitPrice >= 0 client-side, then on success re-fetches the list, resets the form, and calls a new `onTransactionRecorded(assetId, type, quantity)` prop so `App.tsx` updates the asset's `quantity` (buy adds; sell subtracts, clamped at 0 — the asset's `unitPrice` is never touched from this flow, which only carries the record's historical trade price for future P/L). Legacy assets get a synthetic initial `buy` transaction **lazily** the first time their history is opened: the modal's mount effect now awaits `ensureInitialTransaction(asset)` before listing (StrictMode double-mount guarded by a memoized shared in-flight promise; on failure it still lists existing rows instead of hanging). **By design, still NOT writing transactions:** manual quantity/price edits via the pencil icon (`handleEdit`) and Excel import (`importAssets`) — direct edits are a known open decision, and import stays a replace-the-current-total snapshot, not a purchase event. Still not in scope: edit/delete of transactions, a distinct "opening balance" transaction type (the lazy entry is a synthetic buy), and the P/L display (`computeHoldingSummary` remains UI-uncalled). Note: recording now relies on `localTransactionService.addTransaction`'s `crypto.randomUUID()`, which fails in the non-secure deployed HTTP context (surfaced as a `toast.error`) until HTTPS is set up — all existing ID usages remain for the task-6 secure-context cleanup. Build (`npm run build`) passes. |
| 2026-09-23 | Owner-requested: built an editable profile view (§6f) opened from the side drawer's مشخصات item — نام و نام خانوادگی/شماره تماس/ایمیل + an avatar (stored as a base64 data URL via `FileReader.readAsDataURL`, previewed immediately). Mirrors the asset service-layer pattern: added `Profile` type (`src/types.ts`), `src/profileStorage.ts` (localStorage key `oracle_profile_v1`, same try/catch pattern as `src/storage.ts`), and `ProfileService`/`localProfileService` (`src/services/`, same singleton-swap shape as `AssetService`). `ProfileModal` reuses the exact `AddAssetModal` overlay pattern (backdrop/Escape/"×") — no new modal pattern invented. No validation beyond native input `type` hints (personal single-user app). Only مشخصات was wired up; تنظیمات/درباره Oracle/راهنما/خروج remain placeholders. Noted the large-avatar/localStorage-quota caveat as accepted, not a concern to fix now. |
| 2026-09-23 | Owner-requested: changed tag-triggered deployment to build a versioned Docker image (`release-*`) and transfer it over SSH to Ubuntu, where the `oracle` Nginx container runs on port 80. This supersedes the earlier plan to rsync `dist/` to host Nginx. Private and pinned host keys remain GitHub repository secrets; `DEPLOYMENT.md` documents Docker/SSH setup and release steps. |
| 2026-09-23 | Owner-requested: changed the Docker host port from 80 to 8580 (`-p 8580:80`) while Nginx inside the image remains on port 80; the app URL is now `http://45.82.137.126:8580/`. Browser storage from port 80 remains at its original origin. |
| 2026-09-23 | Bugfix: `crypto.subtle.digest(...)` and `crypto.randomUUID()` are both `[SecureContext]`-only per the Web Crypto spec (HTTPS or `localhost` required) — both were `undefined`/throwing on the current plain-HTTP-on-bare-IP deployment (see §8), crashing `signUp` before any account was ever created (so login afterward always failed with "user not found"). Replaced password hashing with `js-sha256` (pure JS, no secure-context requirement, same SHA-256 output — no forced re-hash of any password that had been hashed pre-bug) and the user `id` generator with a manual UUID v4 built from `crypto.getRandomValues()` (also unaffected by secure-context). Also made `signUp` ignore any stored user record with a missing/empty `passwordHash` (only possible from a signup that crashed before completing) so it can't block a fresh signup with the same email/phone. No HTTPS/certbot setup as part of this — that needs a domain, which doesn't exist yet. |
| 2026-09-23 | Owner-requested: built login, signup, and forgot-password (see §6g), gating the whole dashboard behind being logged in. Added `User` type, `src/authStorage.ts` (localStorage keys `oracle_users_v1`/`oracle_session_v1`), and `AuthService`/`localAuthService` (`src/services/`) — same singleton-swap pattern as `assetService`/`profileService` (see §6d). Passwords are SHA-256-hashed via Web Crypto before ever being stored, never plaintext. `AuthScreen` (login/signup tabs) and `ForgotPasswordModal` (two-step: request code, then code+new password) reuse the existing card/input/overlay styling — no new visual pattern invented. **Password-reset codes are simulated** (generated locally, shown directly to the user via a toast) because no real email/SMS provider is connected yet; `localAuthService.ts` marks exactly where that integration would replace the simulation. خروج (logout) in the side drawer now actually calls `authService.logOut()`; تنظیمات/درباره Oracle/راهنما remain placeholders. |
| 2026-09-25 | Owner-requested: Excel import now supports **three modes** chosen by the user at import time via a new `ImportModeModal` (`src/components/ImportModeModal.tsx`, see §4/§6a) — the toolbar's "ایمپورت اکسل" button no longer opens a file picker directly (the hidden file input moved from `Toolbar` into the modal); it opens the mode modal, whose three option cards — جایگذاری با دارایی فعلی / اضافه کردن به دارایی فعلی / کم کردن از دارایی فعلی — each immediately open the file picker for that mode, and the chosen file is processed via `onFileSelected(mode, file)`. `assetService.importAssets(assets, mode)` (see §6d) now takes the mode and returns `skippedNoMatch` + a per-row `changes` list: `replace` keeps today's exact behavior (overwrite-or-append, **no** transactions — a snapshot is not a purchase event); `add` increases a matched asset's quantity (updating unit price) or appends, recording a `buy` per row; `subtract` decreases a matched asset's quantity (clamped at 0, unit price untouched) and records a `sell` per row, or skips the row (`skippedNoMatch`) when there is no matching asset to sell. `App.tsx`'s `handleImportFile(mode, file)` writes every `changes` entry via `transactionService.addTransaction` (dated today, `Promise.all`, failures → `toast.error` without undoing the asset-list change) so imported buys/sells show up in each asset's history like manually recorded ones (see §6i). Toasts append `skippedNoMatch`/invalid-`skipped` halves and use `toast.warning` when either is non-zero. Parsing (fixed 3-column template, catalog-symbol resolution, invalid-row skip) is unchanged. Build (`npm run build`) passes. |
| 2026-09-24 | Bug fix (owner-reported): Excel import now resolves each row against the asset catalog **by symbol**, using the same identity — the catalog entry's `symbol` as `code` — as the catalog-driven manual add, so an imported row and a manually catalog-added row for the same real-world asset always carry the same `code` and the existing `importAssets` merge-by-`code` logic (see §6a/§6d) actually engages (updates the existing row instead of creating a duplicate, which the old auto-generated `getOrCreateCode` codes never matched). The import template's header now needs only the first 3 columns in order (`نماد`, `تعداد`, `قیمت واحد (تومان)`), with any extra trailing columns (e.g. a human-readable reference-name column) allowed and ignored; `parseImportRows` looks up `getCatalogAssetBySymbol(symbol)`, skips (counts) rows with no catalog match, reads `quantity` (col 2, must be finite > 0 else parsing stops) and `unitPrice` (col 3), and builds the `Asset` from the catalog entry (`name`/`getUnitLabel(unit)`/`getAssetIconForCatalogEntry`/`symbol`). Removed the now-unused `importCategoryToIcon` mapping and the `getOrCreateCode` call in `parseImportRows` (`getOrCreateCode` is still used by the one-time legacy-asset migration in `App.tsx`'s mount effect); `localAssetService`'s merge logic was untouched, and the import toast wording (no category reference) is unchanged. Build (`npm run build`) passes. |
| 2026-09-25 | Owner-requested rebuild of the Excel import pipeline (supersedes the two entries above and replaces the just-shipped three-mode `ImportModeModal`), fixing two problems: imported rows now carry the same catalog-symbol identity as before (unchanged, still catalog-driven — see §6a), but import can now also record real per-row buy/sell/replace transactions with their own dates, not just one shared mode for the whole file. **New 6-column template**, in order: `نماد` \| `تعداد` \| `قیمت واحد (تومان)` \| `نوع` \| `تاریخ` \| `نام دارایی (فقط نمایشی)` — only the first 3 headers are required to match; columns 4-6 are fully optional (absent header or empty per-row cells both work). `نوع` (optional) is one of the literal codes `buy`/`sell`/`replace` (case-insensitive) or empty (falls back to the modal's default mode); `تاریخ` (optional) is an ISO date or empty (falls back to today), with JS `Date` cells converted via **local** y/m/d getters (`formatLocalIsoDate`) to avoid an off-by-one-day UTC shift, and a present-but-unparseable date/type skipping the row (`skipped++`) — added via new `resolveRowType`/`resolveRowDate`/`parseIsoDateStrict` helpers in `App.tsx`. The display-only name column is read but never used. **One unified modal**, `src/components/ImportModal.tsx` (replaces `ImportModeModal.tsx`, deleted), combines file selection and the default-mode choice on a single screen instead of two steps: a file-picker button showing the chosen file's name, a 3-way radio for the default replace/add/subtract mode (applied only to rows whose own `نوع` is empty), and a "بارگذاری" submit disabled until a file is picked; `Toolbar`'s `onImportFile` stays `onOpenImportModal` (unchanged from the prior task) and `App.tsx` renamed its state to `isImportModalOpen`. Each parsed row resolves its own *effective type* (own `نوع`, else the modal's default mapped `add→buy`/`subtract→sell`/`replace→replace`) and *effective date* (own `تاریخ`, else today) via `resolveEffectiveType`. `AssetService.importAssets` now takes `rows: ImportRow[]` (`{ asset, effectiveType, effectiveDate }`) instead of `(assets, mode)` — each row is applied independently by its own `effectiveType`: `replace` overwrites/appends with no transaction; `buy` adds to (or creates) the matched asset and always records a `buy` dated the row's own `effectiveDate`; `sell` subtracts from a matched asset (clamped at 0, price untouched) and records a `sell` dated the row's own `effectiveDate`, or is skipped (`skippedNoMatch++`) with no match. `ImportAssetChange` gained a `date` field carrying each row's real effective date (no longer always "today"); `App.tsx`'s `handleImportFile` builds the `ImportRow[]` after parsing and writes every `changes` entry with its own date via `transactionService.addTransaction`. Toast wording for the `skippedNoMatch` half changed to "N ردیف بابت نبود دارایی مشابه نادیده گرفته شد" and `toast.warning` now fires whenever either skip bucket (`skippedNoMatch` or invalid `skipped`) is non-zero, regardless of mode. Removed the old `importCategoryToIcon`-adjacent mode-vs-effective-type coupling entirely — a file can now freely mix snapshot/purchase/sale rows with their own historical dates in one import. `getOrCreateCode`'s only remaining caller (`App.tsx`'s legacy-asset-migration `useEffect`) is untouched. Build (`npm run build`) passes. |

| 2026-09-25 | Owner-requested: added a **mock** live-price service and USD/gold-gram equivalents on the total (see §6j). New `src/services/priceService.ts` (`LivePrices = { usdToman, goldGramToman }`, `PriceService` interface: `getPrices()`/`subscribe(callback): () => void`) + `src/services/mockPriceService.ts` — same singleton-swap pattern as `assetService`/`profileService`/`authService`/`transactionService` (see §6d), `priceService` currently `= mockPriceService`. The mock keeps two in-memory numbers (`usdToman: 1,000,000`, `goldGramToman: 20,000,000` starting points, consistent with existing sample-data magnitudes) nudged by ±~0.5% random jitter on a single shared `setInterval` (60s) while at least one subscriber is active; `subscribe` calls back immediately then on every tick, and the interval is cleared once the last subscriber unsubscribes (no leaked timer). New `src/hooks/useLivePrices.ts` wraps `priceService.subscribe` in `useEffect`, returning `null` until the first callback. `SummaryCard` calls the hook directly and, once prices resolve, renders a small muted secondary line below the (unchanged, still-largest) toman total: `≈ <USD, 2 decimals> دلار · <gold grams, 2 decimals> گرم طلا`, both derived from the existing `total` prop; while `null`, the card renders exactly as before (an equal-height spacer avoids a layout shift once prices arrive). **This is mock data, not a real price feed** — no real price API is connected; swapping one in later only requires replacing the `priceService` export. Updates the §13 "Live price fetch" candidate-next-step entry to done-as-mock. Build (`npm run build`) passes. |
| 2026-09-25 | Owner-requested follow-up (see §6j): made the mock rates realistic and split the USD/gold-gram conversions into their own labeled rows. `mockPriceService`'s starting values changed from the old round-number placeholders (`1,000,000`/`20,000,000`) to `usdToman: 230,000` (≈ 1 USD) and `goldGramToman: 24,000,000` (≈ 1 gram of 18k gold); jitter increased from `±~0.5%` to `±~1%` per 60s tick (`JITTER_RATIO` `0.01 → 0.02`) so movement is clearly visible when watching the card for a minute or two — same shared-interval/subscribe mechanics, unchanged. `SummaryCard` no longer shows one small inline "≈ X دلار · Y گرم طلا" line; it now renders **two separate stacked rows** below the toman total, each with a dedicated icon in a tinted rounded badge and its own text color, matching the existing icon-badge pattern (`AssetRow`/`iconTint`): a دلار row (new `DollarIcon`, green `#1f9d55`/`#d7f5e0` — the same green already used for "buy" in `TransactionHistoryModal`) and a گرم طلا row (new `GoldBarIcon`, reusing the exact gold-bar SVG paths from `AssetIcon`'s `'gold'` case, in the existing `iconTint.gold` colors `#d7a144`/`#fff5df`). Both new icon components live in `src/components/icons.tsx` (see §4) so `SummaryCard` doesn't need to import `AssetIcon`'s full type-switch for a decorative badge. Both rows still render while `prices` is `null` (wrapped `invisible` to reserve the same height) instead of being omitted, keeping the no-flash/no-layout-shift behavior. Build (`npm run build`) passes. |
| 2026-09-25 | Owner-requested follow-up (see §6j): added a manual refresh button and switched the mock jitter from percentage-based to fixed absolute toman amounts. `PriceService` gained `refreshNow(): Promise<LivePrices>`; `mockPriceService` extracted the jitter math into a single shared `jitterStep()` function called by both the 60s interval tick and `refreshNow()` (so they can never diverge), and changed the jitter formula from `value *= 1 + (Math.random()-0.5)*0.02` (≈±1%) to fixed ranges: `usdToman += Math.random()*40-20` (±20 toman) and `goldGramToman += Math.random()*4000000-2000000` (±2,000,000 toman) — starting values (`230,000`/`24,000,000`) unchanged. `refreshNow()` does not reset the interval timer, so a manual refresh and the next scheduled tick remain independent. New `RefreshIcon` (`src/components/icons.tsx`) and a small round refresh button next to the "ارزش کل دارایی‌ها" heading in `SummaryCard` (heading row is now `flex justify-between items-center`), calling `priceService.refreshNow()` on click. The spin animation is driven entirely by a `useEffect` watching the `prices` value from `useLivePrices()` — not by the click handler directly — so the icon spins (`animate-spin`, ~700ms via `setTimeout`) identically whether the update came from the automatic tick or a manual refresh; the button is `disabled` while spinning to prevent stacked clicks. Build (`npm run build`) passes. |
| 2026-09-25 | Owner-requested (see §6k): GOLD18 (طلای ۱۸ عیار) and USDT (تتر) now derive their unit price **live** from `priceService` instead of their stored/imported `Asset.unitPrice` — their row total AND the overall portfolio total now update automatically on every 60s tick or manual refresh (see §6j), because that's why they can no longer be manually price-edited (their edit-mode unit-price input is replaced with a read-only "قیمت زنده" label; quantity stays editable). New `src/services/livePriceMapping.ts` holds the hardcoded `code → LivePrices key` allow-list (`GOLD18→goldGramToman`, `USDT→usdToman`) plus `getLivePriceKeyForAsset`/`getEffectiveUnitPrice` helpers. `useLivePrices()` moved from being called inside `SummaryCard` to being called once in `App.tsx`, which now computes the page `total` via `getEffectiveUnitPrice` and threads the resulting `prices` prop down into both `SummaryCard` and every `AssetRow` (neither imports/calls the hook itself anymore). `SummaryCard`'s دلار/گرم طلا rows also gained a smaller muted per-unit-rate sub-text ("هر دلار/هر گرم … تومان"). **Every other asset is completely unaffected** — this is a hardcoded two-asset allow-list keyed by catalog `code`, not a general "all catalog assets are live-priced" rule; extending it later is a one-line change to `livePriceMapping.ts`. Build (`npm run build`) passes. |

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
- 🟡 Done as MOCK only (2026-09-25, see §6j): live price fetch for USD/gold — `mockPriceService` simulates jittered movement client-side; a **real** data source + key handling is still needed before this reflects actual market prices.

These remain ideas only; implement any of them **only when the owner asks**:
- Multiple portfolios / categories, or a debts section.
- Dark mode.
