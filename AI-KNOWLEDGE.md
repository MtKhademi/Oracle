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
`localStorage` (see §4/§5) and are never committed to git. Below the total, a
daily-snapshot trend chart (see §6n) compares portfolio growth against USD and
gold, normalized to "% change since day 1". No navigation, backend, or native
tooling beyond add/edit/delete, the fixed-template Excel import, the mock
live-price conversions, the چشم بازار market-watch list (now a personal,
editable watchlist the owner curates via a search-and-add picker and
per-item remove, see §6r), and the portfolio-growth trend chart (by explicit
owner constraint/request — each addition beyond the original
toman-total/one-row-per-asset scope was individually owner-requested, see
§11).

## 2. Hard constraints (do not break)

1. Show a toman total (plus the owner-requested mock USD/gold-gram line, §6j) and
   one row per asset.
2. Do NOT add navigation, backend, native tooling, or any other feature beyond
   add/edit/delete of assets, the fixed-template Excel import (§6a), the mock
   live-price conversions (§6j), the چشم بازار market-watch list and its
   personal-watchlist add/remove flow (§6l/§6m/§6r), and the owner-requested
   portfolio-growth trend chart (§6n) **unless the owner explicitly asks for
   anything further**. The Excel import must stay locked to the one fixed
   template — never auto-detect columns or accept other layouts. The
   USD/gold-gram line and the چشم بازار list/catalog are explicitly MOCK
   data (`mockPriceService`/`mockMarketWatchService`) — never present either as
   a real market feed; the watchlist add/remove UI only changes which of the
   same 14 mock items are shown, it never adds real items or a real feed. The
   daily portfolio-history snapshots backing the trend chart (§6n) are real
   local computations of the real `total`/live mock rates, but the first 30
   backfilled days are synthetic/generated — never present that backfilled
   history as real past data either.
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
| `App.tsx` | Thin composition root: `parseImportRows()` (6-column Excel parser plus `resolveRowType`/`resolveRowDate`/`resolveEffectiveType`/`formatLocalIsoDate`/`parseIsoDateStrict` helpers, see §6a), the asset list `useState` (starts as the static `assets` sample with `isSample=true`; a mount-time `useEffect` calls `assetService.listAssets()` and swaps in the stored list + `isSample=false` if anything was previously saved), and the Excel-import/clear-all/delete handlers — each of which is now `async` and calls the matching `assetService.xxx(...)` method, awaits the returned full list, and sets it into state (see §6d). **No `isAddOpen` state or `AddAssetModal` render anymore** (removed in §6aa — adding a brand-new asset now only happens through `SelectAssetForTransactionModal`'s catalog search, see below). A separate mount-time `useEffect` calls `authService.getCurrentUser()` into `currentUser`/`isAuthChecked` state (see §6g); while unchecked, a minimal loading screen renders, and once checked, `currentUser === null` renders `<AuthScreen>` instead of the dashboard. Once authenticated, renders `<SummaryCard>`, `<Toolbar>`, and the list of `<AssetRow>` (see §6, §6c) — no longer holds any icon/button/modal markup itself. `handleLogout` calls `authService.logOut()`, clears `currentUser`, and closes the drawer; passed to `<SideDrawer onLogout>`. Also holds `historyAssetId` (`string | null`), set by each `AssetRow`'s History action (`onHistory`); when set, renders `<TransactionHistoryModal>` (see §6i/§6v) for that asset — history-only, no `onTransactionRecorded` prop anymore. Separately holds `recordTransactionAssetId` (`string | null`, see §6v), set by each `AssetRow`'s record-transaction action (`onRecordTransaction`, `PlusIcon` since §6aa); when set, renders `<RecordTransactionModal>` for that asset, passing `onTransactionRecorded={handleTransactionRecorded}` — an `async` handler, now taking a 4th `unitPrice` param (see §6w), that updates that asset via `assetService.updateAsset`: for `type: 'buy' | 'sell'`, only `quantity` changes (buy adds, sell subtracts clamped at 0; `unitPrice` is deliberately untouched, unchanged since §6v); for `type: 'replace'` (new in §6w), it instead sets **both** `quantity` and `unitPrice` directly to the entered values (not additive/subtractive — "this is the asset's new current state"), then sets the returned list into `items` either way. **`handleEdit` (the old direct quantity/unitPrice edit) was removed in §6v**, and **`handleAddAsset` (the old merge-by-code add-asset handler) was removed in §6aa**, replaced by a much smaller `handleAddNewAsset` (just `assetService.addAsset` + `setItems`, no transaction write — see §6aa for why) passed to `SelectAssetForTransactionModal` as `onAddAsset`. Still calls `useLivePrices()` once (see §6j/§6k) into `prices`, computes `total` via `getEffectiveUnitPrice(asset, prices)` per asset instead of raw `asset.unitPrice`, and passes `prices` down as a prop to `<SummaryCard>`, every `<AssetRow>`, and now `<SelectAssetForTransactionModal>` too (§6aa, so a newly picked GOLD18/USDT catalog asset can default to its live rate). **Exception to "no direct `localStorage` access"** (added §6o): `sortMode` (`AssetSortMode`) is read/written straight to `localStorage` (key `oracle_asset_sort_mode_v1`) via small local `readStoredSortMode()`/`handleSortModeChange` helpers in `App.tsx` itself, the one deliberate exception to the service-layer-only rule (§6d) — it's a tiny UI display-preference, not asset/domain data, so a dedicated service felt like overkill; `sortedItems` (a `useMemo` over `items`/`sortMode`/`prices`, via `sortAssetsForDisplay()`) is what's actually mapped into `<AssetRow>` on the wallet tab — `items` itself is untouched/still insertion-ordered. Also holds `walletAccounts: WalletAccount[] | null` (added §6ad) + a mount-time `useEffect` calling `walletService.listAccounts()`, self-healing-seeding the default `نقدی` account (balance 0) whenever the loaded list has no account named `نقدی` at all — whether the source was `null` (never saved before) or a real, non-null array — and otherwise using the stored array as-is (see §6af, superseded in §6al); the `walletSeededRef` still dedupes the dev-only StrictMode double run (see §6af/§6al) — the canonical list for the "کیف پول" tab, rendered via `<WalletTab tabs accounts onAccountsChanged={setWalletAccounts}/>` (the wallet branch's placeholder JSX from §6ac was replaced); every wallet mutation pushes the service's returned full list back through `onAccountsChanged`. |
| `src/components/icons.tsx` | Shared small stroke-based SVG icon components: `UploadIcon`, `TrashIcon`, `PlusIcon`, `CloseIcon`, `PencilIcon`, `UserIcon`, `SettingsIcon`, `InfoIcon`, `HelpIcon`, `LogoutIcon` (all `w-4 h-4 block`, `viewBox="0 0 24 24"`, `fill="none" stroke="currentColor" strokeWidth="1.8"`), plus `HistoryIcon` (a clock-with-rewind-arrow glyph, used by `AssetRow`'s per-row "History" action, see §6i), `HamburgerIcon` (`w-[30px] h-[30px] block`, same stroke style, three horizontal lines — used only in the header, see §6e), `UserAvatarPlaceholderIcon` (`w-11 h-11 block`, same person glyph as `UserIcon` at a larger size — the profile avatar's empty-state placeholder, see §6f), `DollarIcon` (a bold inline `$` glyph, same Arial-glyph pattern as the `₮`/`₿` symbols in `AssetIcon.tsx`, used only by `SummaryCard`'s USD row, see §6j), `GoldBarIcon` (a standalone copy of the gold-bar SVG paths from `AssetIcon`'s `'gold'` case, used only by `SummaryCard`'s gold-gram row, see §6j — kept separate from `AssetIcon` so `SummaryCard` doesn't need the full asset-icon type-switch just for a decorative badge), `RefreshIcon` (circular-arrows/refresh glyph, same 24x24/`stroke="currentColor"`/`strokeWidth="1.8"` style as the rest of this file, used only by `SummaryCard`'s manual-refresh button, see §6j), and — added in §6m — `WalletIcon` (billfold glyph, tab toggle's "کیف پول" button), `MarketEyeIcon` (eye glyph, tab toggle's "چشم بازار" button), and — added in §6ac — `InvestmentIcon` (bag/coin-with-plus glyph, tab toggle's "سرمایه‌گذاری" button; same 24x24/`stroke="currentColor"`/`strokeWidth="1.8"` style as the rest of this file), `CryptoIcon` (two overlapping coin circles, `MarketWatchList`'s "ارزها" category heading), `StockIcon` (bar-chart glyph, `MarketWatchList`'s "بورس" category heading), and `FixedIncomeIcon` (shield + checkmark glyph, `MarketWatchList`'s "صندوق‌های درآمد ثابت" category heading) — all same 24x24/`stroke="currentColor"`/`strokeWidth="1.8"` style; the gold category reuses the existing `GoldBarIcon`, no new gold icon added — and, added in §6o, `MoreVerticalIcon` (three small **filled** dots stacked vertically, `fill="currentColor"` instead of this file's usual stroke style so the dots stay visible at this size — the "دارایی‌های من" sort-menu trigger button), and — added in §6aw — `SendIcon` (a paper-plane / send glyph, same 24x24/`stroke="currentColor"`/`strokeWidth="1.8"` style as most icons here — the "ارسال مشخصات" copy-account-details button in `ManageWalletAccountsModal`, see §6aw). Used by `Toolbar`/`AssetRow`/`AddAssetModal`/`SideDrawer`/`ProfileModal`/`SummaryCard`/`MarketWatchList`/`AssetSortMenu`/`ManageWalletAccountsModal`/`App.tsx` — no icon markup duplicated elsewhere. |
| `src/components/IconButton.tsx` | Single reusable small icon-button component (`icon`, `onClick`, `ariaLabel`, `tone: 'neutral' \| 'danger'`, `variant: 'filled' \| 'ghost'`). `tone` controls the hover/background color (blue/violet tint for neutral, red tint for danger); `variant` distinguishes the toolbar's always-tinted `'filled'` buttons from the asset row's `'ghost'` (transparent-until-hover) record-transaction/delete buttons. Base className includes `aspect-square` (added in §6z) so every instance's width always tracks its actual rendered height, even when a flex sibling stretches that height (see §6z — this is what fixed `RecordTransactionModal`'s last-price button, which previously rendered as a narrow rectangle, not a square). This is the ONLY icon-button implementation in the app — every small icon button (import/clear-all/add-transaction in the toolbar, record-transaction/delete on each row) renders `<IconButton/>`, no hand-written button markup remains duplicated. |
| `src/components/AssetIcon.tsx` | `AssetIcon({type})` (per-asset-category glyph) + the `iconTint` color map, relocated unchanged from `App.tsx`. Used by `SummaryCard` (cash icon) and `AssetRow`. |
| `src/components/Toolbar.tsx` | The single header row above the "کیف پول" asset list (see §6q): import/clear-all/add-transaction `IconButton`s on the right — the old "افزودن دارایی جدید" button was removed in §6aa (adding an asset now happens through the picker, §6aa) and the "ثبت تراکنش جدید" button (added in §6z) now uses `PlusIcon` instead of `PencilIcon` (re-pointed in §6aa, matching each `AssetRow`'s per-asset "+" button) — and the "ارزش به تومان" label + `AssetSortMenu` on the left, with the label rendered FIRST and the three-dot sort menu SECOND (§6aa — in the RTL row this moves the icon to sit directly beside "تومان" at the label's far-left end). Merged from what used to be two separate rows once the standalone "دارایی‌های من" heading was removed. Takes `onOpenImportModal`/`onClearAll`/`onAddTransaction`/`sortMode`/`onSortModeChange` props from `App.tsx` (no more `onAdd`); the import button just opens the unified import modal (see §6a) — no file `<input>` lives here, it's owned by `ImportModal`; `onAddTransaction` opens `SelectAssetForTransactionModal` (see §6z/§6aa). Only rendered on the "کیف پول" tab (see §6l), now inside `App.tsx`'s `<SectionHeaderCard>` alongside `<SectionTabs>` (see §6ab) — the "چشم بازار" tab renders `MarketWatchList` instead, with no `Toolbar`; `MarketWatchList` owns its own equivalent header row (see §6s/§6t). Its own bottom margin dropped the mobile `mb-[15px]` in §6ab (now just `min-[1050px]:mb-[19px]`) since `SectionHeaderCard`'s own margin provides the mobile gap to the list below instead. |
| `src/components/MarketWatchList.tsx` | The "چشم بازار" (market watch) list — a personal, editable watchlist (see §6r — supersedes the read-only version from §6l/§6m), not an always-show-everything view. Calls `useMarketWatch()` (the live-jittered snapshot) AND `useMarketWatchlist()` (the persisted watched-id subset, see §4/§6r) itself, filters `snapshot.items` down to only watched ids, then groups the result into up to 4 category sections in fixed order (`currency`→"ارزها"/`CryptoIcon`, `gold`→"طلا"/`GoldBarIcon`, `stock`→"بورس"/`StockIcon`, `fixed-income`→"صندوق‌های درآمد ثابت"/`FixedIncomeIcon` — the order/labels/icons now live in shared `src/services/marketCategoryMeta.tsx`, see §4/§6r), each with an icon+label heading and a plain `<ul>` of name/price rows (`format(item.priceToman)` + "تومان" plus a per-row danger/ghost trash `IconButton` calling `remove(item.id)` immediately, no confirmation). Takes an optional `tabs?: ReactNode` prop (see §6ab) — both the "در حال دریافت قیمت‌ها..." loading return and the normal populated return now wrap `{tabs}` + its own header row in `<SectionHeaderCard>` (mobile-only card, see §6ab), with the category-grouped items grid rendered outside that card. Exactly one header row inside the card (see §6s/§6t), `justify-between`, its own bottom margin now just `min-[1050px]:mb-[19px]` (dropped the mobile `mb-[15px]` in §6ab — `SectionHeaderCard`'s own margin covers that gap on mobile instead): the neutral/filled `PlusIcon` `IconButton` (`افزودن به چشم بازار`, opens `AddMarketWatchItemModal`, see §4/§6r) on the right, and the "بروزرسانی: HH:mm:ss" `<p>` (from `snapshot.updatedAt`) on the left — the "ارزش به تومان" label §6s originally paired here was replaced by this timestamp and the old separate timestamp row removed in §6t (redundant with each item row's own "تومان" unit). Shows "در حال دریافت قیمت‌ها..." while either `useMarketWatch()`/`useMarketWatchlist()` hasn't resolved yet, and "چیزی به چشم بازار اضافه نشده" when the filtered watched list is empty (all removed). |
| `src/components/SectionTabs.tsx` | The "سرمایه‌گذاری"/"چشم بازار"/"کیف پول" tab switcher (see §6ab, extended to 3 tabs in §6ac) — moved out of `App.tsx` unchanged (same markup/icons/active-state styling), now a small component taking `{ activeTab: 'investment' \| 'market' \| 'wallet'; onChange: (tab) => void }` props (also exports the `SectionTab` type) instead of reading/writing `App.tsx`'s state directly. A 3-button `grid grid-cols-3` row (was 2-button `grid-cols-2` before §6ac) in this exact order: **سرمایه‌گذاری** (`InvestmentIcon`, `onChange('investment')`), **چشم بازار** (`MarketEyeIcon`, `onChange('market')`, unchanged), **کیف پول** (`WalletIcon`, `onChange('wallet')` — the icon that used to sit on the first/"کیف پول" button, moved here); active state `bg-[#5264e8] text-white`, inactive `text-[#7a8097]`, unchanged. Instantiated once per active tab branch in `App.tsx` (inside `SectionHeaderCard` on the investment and wallet branches, passed as `MarketWatchList`'s `tabs` prop on the market branch) — never both at once, so it still renders exactly once on screen. Its mobile bottom margin shrank from `mb-[15px]` to `mb-[12px]` (unchanged `min-[1050px]:mb-[19px]` on desktop) since it now sits inside `SectionHeaderCard`'s own padded card. |
| `src/components/WalletTab.tsx` | The "کیف پول" (wallet) tab content (see §6ad) — the owner's cash/bank accounts (e.g. "نقد", "کارت بانک ملی"), fully dynamic. Takes `{ tabs?: ReactNode; accounts: WalletAccount[] \| null; onAccountsChanged: (accounts: WalletAccount[]) => void }` props from `App.tsx` (mirrors `MarketWatchList`'s `tabs` prop + the `items`/`assetService` state pattern). `accounts === null` (until App.tsx's mount-time `walletService.listAccounts()` resolves) renders `SectionHeaderCard` + a "در حال بارگذاری..." line; otherwise renders `SectionHeaderCard` (`{tabs}` + a header row: neutral/filled `PlusIcon` `IconButton` — since §6an `ariaLabel="مدیریت حساب‌ها"` (opens the `ManageWalletAccountsModal` manage view, the home of real add/edit/delete, see §6an; previously "افزودن حساب" and opened the add form directly) — on the right, a "حساب‌های نقدی" label on the left — same `justify-between`/`min-[1050px]:mb-[19px]` row shape as `MarketWatchList`'s) followed by a `<ul>` of account rows outside the card (since §6ao the rendered list is first a **display-only filter** — and, since §6au, with the seeded "نقدی" unconditionally included — `const visibleAccounts = accounts.filter(account => account.balance > 0 || account.name === 'نقدی')` (the main list shows every positive-balance account **plus** "نقدی", which always appears there at any balance — the §6ap exclusion is reverted) — and then a display-only sort by `balance` descending — `const sortedAccounts = [...visibleAccounts].sort((a, b) => b.balance - a.balance)` — both computed after the `null` guard, and both the `.length === 0` empty-state check and the row `.map` use `sortedAccounts`; zero-balance accounts are hidden from this main list but still exist in storage and remain fully visible/editable/deletable in `ManageWalletAccountsModal`, which keeps receiving the **full, unfiltered** `accounts` prop (see §6ao) but — since §6au — filters the seeded "نقدی" out of its own rendered list ("نقدی" now appears in the main list instead, at any balance); the `accounts` prop itself keeps its stored order for everything else, see §6al). Each row reuses `AssetRow`'s exact card tokens (white card, `border-[#eef0f7]`, `rounded-[17px]`, responsive padding) with a `cash`-tinted `AssetIcon` (`iconTint.cash`) in the same 46px icon badge, the account `name` (`text-[14px]`), a left-aligned `format(balance)` + "تومان" value, and ghost `IconButton`s — `HistoryIcon` "تاریخچه" (added in §6ai; opens `WalletTransactionHistoryModal` for that account), `PlusIcon` "ثبت تراکنش" (added in §6ah; opens `RecordWalletTransactionModal` for that account), — since §6an the per-row `PencilIcon` "ویرایش" button was **removed** (editing now only happens inside the `ManageWalletAccountsModal`, see §6an) — and a danger `TrashIcon` (since §6am `ariaLabel="صفر کردن موجودی و تاریخچه"` — a **reset**, not a delete: it shows a `sonner` toast-confirm, and on confirm zeroes the account's `balance` and wipes its whole transaction history via `walletTransactionService.deleteTransactionsForAccount` + `walletService.updateAccount(id, { balance: 0 })`, never removing the account itself — the §6ad-era "deletes immediately, no confirmation" `handleDelete` is gone, see §6am). Since §6am this reset button renders on **every** account row, including the seeded "نقدی" — the `{account.name !== 'نقدی' && ...}` guard that §6ak had wrapped it in was dropped, since it no longer deletes the account. Since §6an the per-row `PencilIcon` edit button is gone from **every** row (editing moved into `ManageWalletAccountsModal`), so each account row now shows exactly three action buttons — تاریخچه, ثبت تراکنش, and the reset `TrashIcon` — for every account including the seeded "نقدی" (**superseded by §6ap:** "نقدی" no longer renders a main-list row at any balance, so both buttons now render only on non-"نقدی" rows, and there is no longer any UI path to reset "نقدی"'s balance — see §6ap). Since §6ak every row also uses a plain `items-center` alignment (the §6aj per-row `items-center`/`items-start` ternary was removed) and shows at most two text lines — the account `name` plus, when set, the `bankName` alone in the muted `grid gap-[2px] mt-[3px]` detail block; the `cardNumber`/`accountNumber`/`shebaNumber`/`cardPin1`/`cardPin2` lines were dropped from the row display (they are still collected in `WalletAccountModal`, stored on `WalletAccount`, and pre-filled on edit — only the list no longer renders them). Empty state is the same muted "هنوز حسابی ثبت نشده" line. The `WalletAccountModal` (shelled like `RecordTransactionModal`: backdrop/Escape/"×"/`stopPropagation`) is **defined and exported here** — since §6an it is opened only by `ManageWalletAccountsModal` (which imports it), not by `WalletTab` directly: add mode opens with an empty name + blank optional bank fields (نام بانک/شماره کارت/شماره حساب/شماره شبا, see §6af — plus, since §6aq, the two optional card-PIN fields رمز اول/رمز دوم, see §6aq) + `"0"` balance, edit mode pre-fills from the account (including any bank fields it has); it validates (non-empty trimmed name, finite balance ≥ 0 — bank fields are optional and never block), calls the matching `walletService` method, toasts (`حساب اضافه شد`/`تغییرات ذخیره شد` on success, red errors on failure), and pushes the returned full list up via `onAccountsChanged` so `App.tsx` stays canonical (the `handleAccountSubmit`/`handleDelete` logic that used to live in `WalletTab` now lives in `ManageWalletAccountsModal`, see §6an). The "ثبت تراکنش" button (see §6ah) holds its own `recordFor` state (`WalletAccount | null`) and renders `RecordWalletTransactionModal`, whose success callback pushes the service's returned full account list up through the same `onAccountsChanged` (so the row's balance — and the grand total, which `App.tsx` derives from `walletAccounts` — updates immediately without a reload). |
| `src/services/walletTransactionService.ts` | Defines the `WalletTransactionService` interface (see §6ag) — `listTransactionsForAccount(accountId): Promise<WalletTransaction[]>`, `addTransaction(input: Omit<WalletTransaction, 'id'>): Promise<WalletTransaction>`, `deleteTransactionsForAccount(accountId): Promise<void>` — and exports the single `walletTransactionService` instance — currently `= localWalletTransactionService`. Same singleton-swap-one-line pattern as `walletService`/`transactionService` (see §6d): the only line that needs to change to swap in a server-backed implementation later. Deliberately has NO `updateTransaction`/single `deleteTransaction` — the wallet-side history is append/bulk-clear only from the UI, exactly like the investment side (§6ag). |
| `src/services/localWalletTransactionService.ts` | The `localWalletTransactionService: WalletTransactionService` implementation (see §6ag), backed by `src/walletTransactionStorage.ts` (mirrors `localTransactionService`'s read/filter/write shape). `addTransaction` validates via a local `assertValidWalletTransaction`: `amount > 0` for `'increase'`/`'decrease'` (the wallet equivalent of `localTransactionService`'s `quantity > 0` check), `amount >= 0` for `'replace'` (a replace to exactly zero is valid). IDs come from the shared `generateUuidV4()` in `src/uuid.ts` — NOT `crypto.randomUUID()` (see §6ag for why; the same reason `localWalletService` and `localAuthService` generate IDs this way). |
| `src/services/walletService.ts` | Defines the `WalletAccount` type (`{ id, name, balance, bankName?, cardNumber?, accountNumber?, shebaNumber?, cardPin1?, cardPin2? }` — `balance` a plain toman amount, displayed `format()` + "تومان", unlike an `Asset`'s quantity × unit-price; the 4 optional bank-detail fields were added in §6af and the 2 optional card-PIN fields `cardPin1?`/`cardPin2?` in §6aq) and the `WalletService` interface (`listAccounts(): Promise<WalletAccount[] \| null>`, `addAccount(account)`, `updateAccount(id, changes)`, `deleteAccount(id)` — the mutations all return the full updated list), exporting the single `walletService` instance — currently `= localWalletService`. Same singleton-swap-one-line pattern as `assetService` (see §6d): the only line that needs to change to swap in a server-backed implementation later. |
| `src/services/localWalletService.ts` | The `localWalletService: WalletService` implementation, backed by `src/walletStorage.ts`'s `loadWalletAccounts`/`saveWalletAccounts` (mirrors `localAssetService` — each mutation reads the current list, applies the change, writes back, resolves the new full list). Account IDs use the shared `generateUuidV4()` in `src/uuid.ts` (a manual UUID v4 built from `crypto.getRandomValues()` — NOT `crypto.randomUUID()`, which is `[SecureContext]`-only and `undefined` on the current plain-HTTP deployment — the same reason `localAuthService` generates user IDs this way, see §6g; the helper was extracted into `src/uuid.ts` in §6ag). |
| `src/walletStorage.ts` | `loadWalletAccounts()`/`saveWalletAccounts()` — read/write the wallet account list to `localStorage` under key `oracle_wallet_accounts_v1`, same try/catch-safe, null-on-missing-or-invalid convention as `src/storage.ts`'s `loadAssets`/`saveAssets` (`null` = never saved yet, an explicit `[]` = owner removed every account). Only called from `src/services/localWalletService.ts`. |
| `src/types/walletTransaction.ts` | `WalletTransactionType` (`'increase' \| 'decrease' \| 'replace'`) and `WalletTransaction` (`id`/`accountId`/`type`/`amount`/`date`/optional `note`) — the wallet-account equivalent of the investment-side `Transaction` model (see §5/§6ag), but with a single plain-toman `amount` instead of a `quantity` × `unitPrice` split (a cash/bank account balance isn't priced like an asset). Added in §6ag. |
| `src/walletTransactionStorage.ts` | `loadWalletTransactions()`/`saveWalletTransactions()` — read/write the `WalletTransaction[]` list to `localStorage` under key `oracle_wallet_transactions_v1`, the same try/catch-safe **`[]`-on-missing-or-invalid** convention as `src/transactionStorage.ts` (NOT the null-on-missing convention of `src/walletStorage.ts` — there is no "never saved" signal to preserve for a transaction log, matching how investment transactions work). Only called from `src/services/localWalletTransactionService.ts`. |
| `src/uuid.ts` | `generateUuidV4(): string` — a manual UUID v4 built from `crypto.getRandomValues()`, extracted in §6ag from the two identical copies that existed in `src/services/localWalletService.ts` and `src/services/localAuthService.ts`. `crypto.randomUUID()` is `[SecureContext]`-only and `undefined` on the current plain-HTTP deployment, so every ID-generating service must use this (or the auth file's local copy) instead. `localWalletService` and `localWalletTransactionService` now import it; `localAuthService` still has its own local copy (deliberately left untouched in §6ag). |
| `src/components/SectionHeaderCard.tsx` | A plain wrapper `<div>` (see §6ab) whose card styling — reusing `SummaryCard.tsx`/`PortfolioTrendChart.tsx`'s large-card tokens (`bg-white`/`border-[#eceef8]`/`rounded-[20px]`/`shadow-[0_12px_36px_#2734790b]`/`p-[14px]`, `max-[351px]:p-[10px]`) — applies ONLY below the 1050px breakpoint, via Tailwind v4's `max-[1050px]:` variant (the exact complement of the outer assets `<section>`'s own `min-[1050px]:` card classes in `App.tsx`). At ≥1050px it renders no bg/border/padding/margin at all, since the outer section is already the card there. Wraps the tab switcher (`SectionTabs`) + that tab's own header row (`Toolbar` on wallet, `MarketWatchList`'s own header row on market) so they sit inside one white card on mobile instead of rendering naked on the gray page background — the asset/market item lists stay outside it. Takes only a `children` prop. |
| `src/components/AddMarketWatchItemModal.tsx` | The "افزودن به چشم بازار" modal (see §6r), shelled like `AddAssetModal.tsx` (backdrop + centered card + `CloseIcon` + heading, `Escape`/backdrop-click/`stopPropagation` close behavior). Loads the full static catalog via `marketWatchService.getAllItems()` on mount, excludes ids already in the `watchedIds` prop, filters the remainder by a plain name-substring search input (same case-insensitive-substring convention as `AssetPicker`'s catalog filter, no fuzzy-search library), and groups results by category using the shared `marketCategoryMeta.tsx` (not duplicated from `MarketWatchList.tsx`). Clicking a result calls the `onAdd(id)` prop (wired to the watchlist hook's `add`) and closes itself. No separate floating dropdown panel to protect (the list IS the modal body), so it doesn't need `AssetPicker`'s `mousedown`-based outside-click detection — the modal's own backdrop/`Escape` handling is enough. Takes `onClose`/`watchedIds`/`onAdd` props. |
| `src/components/PortfolioTrendChart.tsx` | Card below `SummaryCard` (see §6n) showing a hand-rolled inline-SVG line chart of portfolio growth normalized against USD and gold. Calls `portfolioHistoryService.listHistory()` itself in a `useEffect` (re-fetches when the `refreshKey` prop changes, bumped by `App.tsx` after each snapshot write), computes 3 "% of day 1" index series (toman/usd/gold, all starting at exactly 100), and renders 3 `<polyline>`s (`#5264e8`/`#1f9d55`/`#d7a144`) plus a 3-row legend (colored dot + label + latest %-change badge, green/red via the app's existing buy/sell color convention). Below the SVG, 3 relative-time X-axis labels ("۳۰ روز پیش" / "{N} روز پیش" for the midpoint / "امروز", real computed day-counts via `daysBetweenIso`, `format()` for Persian digits, `text-[11px]`, in a `dir="ltr"` row so left-to-right always matches the SVG's own coordinate space regardless of the page's RTL direction — no calendar-style dates, see §6n). Shows "داده کافی برای نمودار وجود ندارد" when history has fewer than 2 points. No charting library — plain `<svg>`. |
| `src/components/ImportModal.tsx` | The unified Excel import modal (see §6a): combines file selection AND the default-mode choice in one screen (not two steps). A styled file-picker control (hidden `<input type="file" accept=".xlsx,.xls">` behind a button; shows the chosen file's name with a "تغییر فایل" link once picked) plus a 3-way segmented radio choice for the **default mode** applied to rows whose own نوع column is empty — جایگذاری با دارایی فعلی (replace) / اضافه کردن به دارایی فعلی (add) / کم کردن از دارایی فعلی (subtract), each with a title + one-line description, local `useState<ImportMode>('replace')`. A "بارگذاری" submit button, `disabled` until a file is chosen, calls `onSubmit(defaultMode, file)`. Reuses the `ProfileModal`/`AddAssetModal` overlay pattern (backdrop click / "×" / `Escape`). Takes `onClose`/`onSubmit` props. Replaces the old two-step `ImportModeModal` (deleted). |
| `src/components/AssetSortMenu.tsx` | The three-dot sort-menu button + dropdown rendered inside `Toolbar` (see §6o/§6p) next to "ارزش به تومان" — `AssetSortMenu({ value, onChange })`, `AssetSortMode = 'value' \| 'type'`. Icon-only trigger button (`MoreVerticalIcon`) opens an `absolute`-positioned panel (same card/border/shadow tokens as `AssetPicker`'s dropdown) with the two radio-style options, a checkmark on the active one. Outside-click closing reuses `AssetPicker`'s exact `document` `mousedown` + container `ref` pattern (detects, never intercepts, the click) instead of a `fixed inset-0` overlay — deliberately avoiding the overlay-blocks-parent-modal-close bug class noted in `AssetPicker.tsx`'s own comment. Selecting an option calls `onChange(mode)` then closes itself. Only rendered on the "کیف پول" tab — the "چشم بازار" tab/`MarketWatchList` are untouched. |
| `src/components/AssetRow.tsx` | One asset `<li>` (icon, name, quantity/unit, value, history/record-transaction/delete `IconButton`s) — a single, always-static view; no inline edit mode (removed in §6v). Takes `asset`/`prices` + `onDelete`/`onRecordTransaction`/`onHistory` callback props. The record-transaction `IconButton` calls `onRecordTransaction(asset.id)`, opening `RecordTransactionModal` (see §6v) instead of putting the row itself into an editable state — it now renders `PlusIcon` with `ariaLabel="ثبت تراکنش"` (re-pointed from `PencilIcon`/`"ویرایش"` in §6aa; the button never opened an edit form, so the old pencil glyph + label were both stale). For a live-priced asset (`getLivePriceKeyForAsset(asset)`, see §6k — currently GOLD18/USDT only), the row's value and a small extra "rate per unit" line both use `getEffectiveUnitPrice(asset, prices)` instead of `asset.unitPrice`. |
| `src/components/SummaryCard.tsx` | The summary card showing the total (toman), sample badge, and asset count. Takes `total`/`count`/`isSample`/`prices` props (`prices` is now passed down from `App.tsx`'s single `useLivePrices()` call, see §6j/§6k — this component no longer calls the hook itself). Renders two additional small labeled rows below the toman total — دلار (green `DollarIcon` badge) and گرم طلا (gold `GoldBarIcon` badge, same tint as `iconTint.gold`) — each converting the toman total via the live prices, plus a smaller muted per-unit-rate sub-text on each row ("هر دلار/هر گرم … تومان", see §6j); while `prices` is `null`, the same two rows render `invisible` (kept in the layout, just not shown) so there's no flash of a zero value and no layout shift once prices arrive. The card's very first row (see §6u) holds the wallet-icon button on the right and, on the left, the optional "نمایش نمونه" sample tag followed by the hide-balance eye toggle (§6p) and the manual-refresh `RefreshIcon` button (§6j) that calls `Promise.all([priceService.refreshNow(), marketWatchService.refreshNow()])` — refreshing both the portfolio-total price feed AND the independent چشم بازار feed together, see §6m; a `useEffect` watching the `prices` prop drives a local `isSpinning` state that spins the icon (`animate-spin`) for ~700ms on every price change, whichever source caused it, and disables the button meanwhile. The standalone "ارزش کل دارایی‌ها" heading that used to sit above the big total (with the eye/refresh buttons beside it) was removed in §6u — the section itself keeps `aria-label="ارزش کل دارایی‌ها"` for its accessible name instead of the old `aria-labelledby`. |
| `src/components/AssetPicker.tsx` | Custom searchable combobox (text input + dropdown panel) for picking a catalog asset — see §6c. Plain React state + Tailwind only, no external combobox/autocomplete library. Takes `selectedSymbol`/`onSelect` props; owns its own open/query/highlighted-index state. **Currently unused/orphaned** (§6aa) — its only caller, `AddAssetModal.tsx`, was deleted when the toolbar's standalone "افزودن دارایی جدید" button was removed; kept in the tree (not deleted) since nothing about the component itself is wrong, only its caller went away — a future feature needing a full catalog combobox (as opposed to `SelectAssetForTransactionModal`'s simpler name-substring list) could still reuse it. |
| `src/components/TransactionHistoryModal.tsx` | Per-asset transaction-history modal (see §6i) — **history-only since §6v**, no add-transaction form. On mount it runs `ensureInitialTransaction(asset)` (lazy synthetic opening buy for assets with quantity but no history yet, see §5) and then loads that asset's transactions via `transactionService.listTransactionsForAsset(...)`, listing them newest-first with a 3-way type badge (خرید green / فروش red / **جایگذاری amber, added in §6w** — same `#d7a144`/`#fff5df` tone `SummaryCard`'s gold-gram row uses), Persian date, quantity+unit, and toman price-per-unit, plus pagination, a clear empty state, and a sample badge. A `'replace'` row is never deleted or hidden — every transaction before it stays visible here exactly as before (see §5/§6w); this modal only ever *displays* history, it never decides what to count for a summary. Reuses the `ProfileModal` overlay pattern (backdrop click / "×" / `Escape`). No edit/delete of transactions yet (later task). Takes only `asset`/`isSample`/`onClose` props — no longer takes `onTransactionRecorded` (moved to `RecordTransactionModal`, see §6v). |
| `src/components/RecordTransactionModal.tsx` | The "ثبت تراکنش جدید" (record buy/sell/replace) modal (see §6v, extended to a 3-way toggle in §6w, last-price-fill/type-reactive submit button added in §6x, last-price control shrunk to an icon button + مقدار/قیمت‌واحد width ratio changed in §6y) — split out of `TransactionHistoryModal` into its own single-purpose modal, opened by `AssetRow`'s pencil icon (not the history/clock icon). Same shell pattern as `TransactionHistoryModal` (backdrop/"×"/`Escape`, `stopPropagation` on the card). Owns a **3-way** فروش/خرید/جایگذاری toggle (`grid-cols-3`, added in §6w — خرید stays green `#1f9d55`, فروش stays red `#d95050`, جایگذاری is amber `#d7a144`, same gold tone as `SummaryCard`'s گرم طلا row), then a §6y inner `grid gap-[10px] min-[560px]:grid-cols-[2fr_3fr] min-[560px]:col-span-2` wrapper holding just the مقدار/قیمت واحد به تومان (shared `stripToNumberString`/`formatWithThousands` comma-formatting; both labels switch to "مقدار جدید"/"قیمت واحد جدید (تومان)" while جایگذاری is selected, see §6w) fields — this inner grid gives قیمت واحد 3 parts vs مقدار's 2 parts of the row's width at ≥560px (see §6y), independent of the outer form grid's `min-[560px]:grid-cols-2` (still governing تاریخ/یادداشت below, unaffected), then a type-reactive submit button (see §6x — green/"ثبت تراکنش خرید", red/"ثبت تراکنش فروش", or amber/"ثبت تراکنش جایگذاری", the same three toggle colors) — identical validation (`quantity > 0`, `unitPrice >= 0`, valid date) for all three types/toast messages/`transactionService.addTransaction` call as before. Also takes a **`prices: LivePrices | null`** prop (§6x, threaded from `App.tsx`'s existing `useLivePrices()` call, same one already passed to `AssetRow`/`SummaryCard`) — computes `lastPrice = getEffectiveUnitPrice(asset, prices)` (reusing `AssetRow`'s exact live-price-vs-stored-price logic, see §6k, no new price logic) and renders a small icon-only `IconButton` (`DollarIcon`, `tone="neutral"`, `variant="filled"`, `ariaLabel="پر کردن با آخرین قیمت"` — see §6y, replacing the §6x text "آخرین قیمت" button) directly beside the قیمت واحد input (a `flex` row inside the label, `min-w-0` on both the label and the inner `flex` wrapper so the input still shrinks properly at a `grid` breakpoint instead of overflowing — see §6x/§6y); clicking it fills `formUnitPrice` with that value (rounded to the nearest toman), `fillLastPrice`'s logic unchanged since §6x. Header shows "ثبت تراکنش جدید" + the asset's name (and the "نمایش نمونه" tag when `isSample`) so it's clear which asset the transaction is for. It does **not** reset its fields and stay open after a successful submit — it calls `onTransactionRecorded(assetId, type, quantity, unitPrice)` (the `unitPrice` param added in §6w so `App.tsx` can apply جایگذاری's exact-set semantics) then `onClose()` immediately, since this modal's only job is recording one transaction. Takes `asset`/`isSample`/`prices`/`onClose`/`onTransactionRecorded` props. |
| `src/components/RecordWalletTransactionModal.tsx` | The wallet-side "ثبت تراکنش جدید" (record wallet transaction) modal (see §6ah) — the wallet analogue of `RecordTransactionModal`, minus the unit-price concept. Same shell (backdrop/"×"/`Escape`/`stopPropagation`, identical card classes) and the same 3-way `grid-cols-3` active-color toggle, but with wallet labels/types: افزایش (green `#1f9d55`) / کاهش (red `#d95050`) / جایگذاری (amber `#d7a144`). One toman **amount** field (`formatWithThousands`/`stripToNumberString`, label flips to "مبلغ جدید به تومان" while جایگذاری is selected) + a date field (`todayLocalIso()` default) + an optional note — **no** unit-price, `isSample`, `prices`, or last-price button. On submit it validates the amount client-side (finite `> 0` for افزایش/کاهش, `>= 0` for جایگذاری; non-empty date), then does **two** things in sequence: `walletTransactionService.addTransaction({ accountId, type, amount, date, note })` and `walletService.updateAccount(account.id, { balance })` where the new balance is increase `balance + amount`, decrease `Math.max(0, balance - amount)` (floored at 0, mirroring the investment sell), or replace `amount`; on success it toasts `تراکنش ثبت شد`, pushes the service's returned full account list up via `onTransactionRecorded`, and closes (an error toast stays open, matching the app's conventions). Takes `account`/`onClose`/`onTransactionRecorded: (accounts: WalletAccount[]) => void` props. |
| `src/components/WalletTransactionHistoryModal.tsx` | Wallet-side per-account transaction-history modal (see §6ai), closely mirroring `TransactionHistoryModal` but for `WalletTransaction`: loads `walletTransactionService.listTransactionsForAccount(account.id)` on open, sorts newest-first by date with stable insertion fallback, paginates 6 rows per page, and shows افزایش/کاهش/جایگذاری badges using the same green/red/amber tokens as the investment modal. Rows show formatted amount + "تومان", `formatDate(date)`, and optional note. The modal also owns the wallet-only destructive action "پاک کردن کل تاریخچه": a danger-styled button confirmed via the existing `sonner` toast `action`/`cancel` pattern, calling `walletTransactionService.deleteTransactionsForAccount(account.id)` and reloading only that modal's list to empty; it deliberately does NOT change `account.balance`, close the modal, delete the account, or touch other accounts' histories. |
| `src/components/ManageWalletAccountsModal.tsx` | The "مدیریت حساب‌ها" (manage accounts) modal (see §6an) — the home of **real** wallet-account add/edit/delete, opened by the "کیف پول" tab's header "+" button (no longer the add form directly). Takes `{ accounts: WalletAccount[]; onAccountsChanged: (accounts: WalletAccount[]) => void; onClose: () => void }` props from `WalletTab.tsx` (the **full, unfiltered** list — unlike the main row list, which §6ao/§6ap/§6au filters to positive-balance accounts plus "نقدی"); it then filters that prop down to `listedAccounts = accounts.filter(account => account.name !== 'نقدی')` for rendering (since §6au — "نقدی" never appears in this modal at all; it always shows in the main "کیف پول" list instead), while add/edit/delete still operate on the same full prop. Same modal shell as the others (backdrop `fixed inset-0 z-50 grid place-items-center bg-black/50 p-4` / `Escape`-to-close / "×" close button / `stopPropagation` on the card / identical `WalletAccountModal` card classes), header "مدیریت حساب‌ها" — the "بستن" "×" close button is a standalone `absolute top-4 left-4` corner button with the app-wide classes (`text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors`), the same convention every other modal uses; below it the header is two rows: (1) a `mb-4 pr-1 pl-10` wrapper holding only the title `<h2>` (the `pl-10` is deliberate clearance keeping the title clear of the corner "×"), and (2) directly below it a `flex mb-4` row whose single child is the "افزودن حساب" `PlusIcon` `IconButton` — in the app's RTL layout a plain flex row's start is the right side, so the button sits on its own row, right-aligned, under the title (see §6as/§6at; the §6ar combined single-line "+"+"×" header was explicitly reverted by the owner, and "+" and "×" must not be combined in this app's modal headers); the "افزودن حساب" `IconButton` opens `WalletAccountModal` in add mode. Lists **every** account (no balance filter, except the seeded "نقدی", which §6au filters out of this modal entirely) as a simplified row (cash-tinted `AssetIcon` in a 40px badge, `name` + optional `bankName`, and — since §6aq — a two-column grid of six green/red lines, one per bank-detail field, in the order بانک/کارت/حساب/شبا/رمز اول/رمز دوم: each line shows the field label on the right and, on the left, the field's **actual stored value** in green `text-[#1f9d55]` when that field is set (non-blank after trim) or a red `text-[#d95050]` "—" placeholder when empty — since §6av, the §6aq static "ثبت شده"/"ثبت نشده" wording is gone (sensitive values — card/account/sheba/both PINs — are shown as plain text here, the same trust model as the rest of this single-user local app); see §6aq/§6av), muted `format(balance)` + "تومان", and ghost `IconButton`s): a `PencilIcon` "ویرایش" (opens `WalletAccountModal` in edit mode), then — since §6aw — a neutral `SendIcon` "ارسال مشخصات" (copy account details, see below) that renders on **every** row (deliberately NOT wrapped in a "نقدی" guard — it only ever shows on real accounts in practice because §6au filters "نقدی" out, but the button does not special-case it), then a danger `TrashIcon` "حذف" — the edit and delete buttons still wrapped in their `account.name !== 'نقدی'` guards (a no-op since §6au, because "نقدی" no longer reaches the row render at all — the guard is defensive legacy, the seeded account is locked either way: no edit, no delete), the delete being a **real, immediate, unconfirmed** `walletService.deleteAccount(id)` (the lightweight single-item delete convention). The §6aw copy-details button calls `handleCopyDetails(account)`: it resolves the logged-in user's full name via `authService.getCurrentUser()` (the same source `App.tsx` uses), builds a plain-text block with one trimmed line per non-empty value in the order [user full name, `bankName`, `cardNumber`, `accountNumber`, `shebaNumber`] (empty lines skipped — no empty labels are printed), and copies it with `navigator.clipboard.writeText(...)`; on success it toasts `مشخصات کارت کپی شد` and on any failure (clipboard rejected/thrown) it toasts an error (`کپی مشخصات انجام نشد`) — the two card-PIN fields (`cardPin1`/`cardPin2`) are **deliberately excluded** from the copied text (personal reminders, not meant to be shared); `handleAccountSubmit` (moved here from `WalletTab`) calls `walletService.updateAccount`/`addAccount` + `onAccountsChanged` + success/error toast and returns `true`/`false` to `WalletAccountModal`; it passes `name`, `balance` and the six optional detail fields through (`bankName`/`cardNumber`/`accountNumber`/`shebaNumber` + the §6aq `cardPin1`/`cardPin2`); `handleDelete` (moved here) calls `walletService.deleteAccount` + `onAccountsChanged` + success/error toast. Renders the imported `WalletAccountModal` (from `./WalletTab`, exported since §6an) as a **sibling** via a fragment (not DOM-nested inside this backdrop — so the form's backdrop click doesn't bubble up to close this modal), so add/edit opens on top of this modal (both `z-50`; the form stacks above); the modal's own `Escape` handler is guarded by `modal === null` so Escape dismisses the topmost form first, not both. Empty state reuses the muted "هنوز حسابی ثبت نشده" line (defensive — "نقدی" always exists; **superseded by §6au**, since "نقدی" no longer renders here, so this state is genuinely reachable whenever the only stored account is the seeded "نقدی"). |
| `src/components/SelectAssetForTransactionModal.tsx` | The "ثبت تراکنش برای کدام دارایی؟" asset-picker modal (see §6z, extended in §6aa), opened from the wallet toolbar's "ثبت تراکنش جدید" button — lets the owner record a transaction for any existing asset without first finding its row, **or** pick a catalog asset they don't own yet, which is silently added (quantity 0) and proceeds straight into the same flow (§6aa — this is now the app's only way to add a brand-new asset, since the standalone add-asset button/modal were removed). Same shell as `RecordTransactionModal` (backdrop/`Escape`/"×"/`stopPropagation` on the card). Takes `items: Asset[]`/`prices: LivePrices | null`/`onClose`/`onSelect: (assetId) => void`/`onAddAsset: (asset) => Promise<void>` props from `App.tsx`. A plain name-substring search input (same case-insensitive convention as `AssetPicker`/`AddMarketWatchItemModal`'s catalog filters, no fuzzy-search library, no keyboard-nav machinery — a full modal, not a dropdown) filters wallet `items` by name — always the primary/first section, exactly as before. While a query is active, it additionally filters the full catalog (`getCatalogAssets()`, same case-insensitive name-**or**-symbol match `AssetPicker` uses) down to entries not already owned (matched by `code === symbol` **or** an exact-name fallback, so legacy/auto-coded assets like the default samples — coded e.g. `USDT-0001`, not the catalog's `USDT` — are still correctly recognized as already-owned and never listed as "new") and renders them below a "دارایی‌های جدید" heading, each row tagged with a small "دارایی جدید" badge. Clicking an owned-asset row calls `onSelect(asset.id)` exactly as before. Clicking a not-yet-owned catalog row instead builds a brand-new `Asset` (quantity `0`, `unitPrice` from `getEffectiveUnitPrice` — 0 unless the symbol is GOLD18/USDT, see §6k — `code` = the catalog `symbol`), calls `onAddAsset(newAsset)` (awaited, guarded by a `pendingSymbol` state so a double-click can't race two creations), then `onSelect(newAsset.id)` — from `App.tsx`'s point of view this is indistinguishable from picking an existing asset; the exact same `RecordTransactionModal` opens next (defaulting to خرید, its own existing default), and the owner's very first submitted transaction sets the real quantity/price. No "هنوز دارایی‌ای ثبت نشده" empty-state guard anymore (removed in §6aa) — an empty wallet now shows a small inline hint above the (empty) list instead, since searching the catalog is always available regardless of wallet size. |
| `src/components/SideDrawer.tsx` | The header's side-menu drawer (see §6e): slide-in-from-right panel + backdrop, containing the menu item list. مشخصات opens the profile view (`onOpenProfile` prop, see §6f); خروج now calls `onLogout` (real logout, see §6g); تنظیمات/درباره Oracle/راهنما remain placeholders that just close the drawer. Takes `onClose`/`onOpenProfile`/`onLogout` props; owns its own open/close slide-in animation state and the `Escape`-key listener. |
| `src/components/ProfileModal.tsx` | The مشخصات (profile) modal (see §6f): avatar (image or placeholder icon) + "تغییر عکس" file picker, and نام و نام خانوادگی/شماره تماس/ایمیل inputs, pre-filled from `profileService.getProfile()` on open. Save button calls `profileService.saveProfile(...)`, shows a success toast, then closes. Takes only `onClose`; owns its own form state and the `Escape`-key listener. |
| `src/components/AuthScreen.tsx` | Full-page login/signup screen (see §6g), shown instead of the dashboard when no user is logged in. Tab toggle between "ورود" and "ثبت‌نام", styled with the same card/input tokens as `AddAssetModal`/`ProfileModal`. Login calls `authService.logIn(...)`; signup calls `authService.signUp(...)` (client-side password/repeat match check first). On success calls the `onAuthenticated(user)` prop; on failure shows `toast.error(result.error)`. Renders `<ForgotPasswordModal>` when its "رمز عبور را فراموش کرده‌اید؟" link is clicked. |
| `src/components/ForgotPasswordModal.tsx` | Two-step password-reset modal (see §6g), reusing the `AddAssetModal` overlay pattern. Step 1 asks for email/phone, calls `authService.requestPasswordReset(identifier)`, and shows the returned `simulatedCode` in a long-lived `toast(...)` (**simulated — not a real email/SMS send**, see §6g). Step 2 asks for the 6-digit code + new password (+ repeat, matched client-side), calls `authService.resetPassword(...)`. Takes only `onClose`. |
| `src/format.ts` | Shared `format(value, decimals = 0)` → `Intl.NumberFormat('fa-IR')` helper, plus `formatDate(isoDate)` → `Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' })` (parses a `YYYY-MM-DD` date as a local date, falling back to the raw string on a non-matching format), plus `stripToNumberString(raw)`/`formatWithThousands(raw)` (the live comma thousands-separators pair for numeric text inputs — plain-digit-string state in, comma-formatted display text out; see §6c), used by `App.tsx`, the components above, `AddAssetModal`, and `RecordTransactionModal`'s form (see §6i/§6v). Also `todayLocalIso()` (moved here from a local definition inside `TransactionHistoryModal.tsx` in §6v, so both transaction modals can share it) — today's date as a local (not UTC) `YYYY-MM-DD` string, used to default the transaction-form date input. |
| `src/assets.ts` | `Asset` type + `assets` sample array. Now the **default/fallback** data only — real owner data lives in `localStorage`, behind the service layer below, not here. |
| `src/data/assetCatalog.json` | Fixed, owner-provided reference catalog of known assets — `categories`/`units` (id + Persian `label`) and `assets` (`symbol`/`name`/`category`/`unit`, category/unit referencing the `categories`/`units` ids). Committed static data (like `src/assets.ts`'s sample array), not owner-entered real values — safe to commit. Drives the add-asset form (see §6c) instead of free-typed names. |
| `src/services/assetCatalog.ts` | Typed wrapper around `assetCatalog.json` (`CatalogCategory`/`CatalogUnit`/`CatalogAsset` interfaces): `getCatalogAssets()`, `getCatalogAssetBySymbol(symbol)`, `getCategoryLabel(id)`/`getUnitLabel(id)` (Persian label lookups), and `getAssetIconForCatalogEntry(catalogAsset)` (maps a catalog category to the existing `Asset['icon']` key — see §6c). A catalog asset's `symbol` is now its permanent identity `code` (see §5) — this supersedes `assetCodeRegistry.ts`'s auto-generated codes for anything picked from the catalog. |
| `src/services/assetCodeRegistry.ts` | `getOrCreateCode(category, name): string` — assigns/looks up each asset's permanent `<PREFIX>-<NNNN>` identity code (see §5). Backed by two `localStorage` keys: `oracle_code_counters_v1` (highest `NNNN` issued per prefix, e.g. `{ GOLD: 2, USDT: 1 }`) and `oracle_asset_registry_v1` (`category\|name.trim().toLowerCase()` → already-assigned code). Same try/catch `localStorage` pattern as `storage.ts`/`profileStorage.ts`/`authStorage.ts`. Pure lookup/generation logic only — does not read or write the asset list itself; its only remaining caller is the one-time migration in `App.tsx` (see §6d/§6h), which attaches the returned code to a legacy asset and persists it via `assetService`. **No longer used by `AddAssetModal`** (see §6c) or the Excel import (see §6a, now catalog-driven) — now only a fallback path for pre-catalog legacy data. |
| `src/services/assetService.ts` | Defines the `AssetService` interface (`listAssets`/`addAsset`/`updateAsset`/`deleteAsset`/`importAssets(rows)`/`clearAssets`, all `Promise`-returning), the `ImportMode` (`'replace' \| 'add' \| 'subtract'`, the modal's default-mode choice), `ImportEffectiveType` (`'buy' \| 'sell' \| 'replace'`, a row's resolved per-row type), `ImportRow` (`{ asset, effectiveType, effectiveDate }`, one row ready to apply), and `ImportAssetChange` (`{ assetId, type: 'buy' \| 'sell', quantity, unitPrice, date }`) types, and exports the single `assetService` instance the whole app imports — currently `= localAssetService`. This is the ONLY line that needs to change to swap in a server-backed implementation later; no component/`App.tsx` code would need to change (see §6d). |
| `src/services/localAssetService.ts` | The `localAssetService: AssetService` implementation, backed by `src/storage.ts`'s `loadAssets`/`saveAssets`. Each method reads the current list, applies the change, writes the result back via `saveAssets`, and resolves with the new full list. `importAssets(rows)` applies each row's own `effectiveType` independently (not one mode for the whole file) matched by `code` — `replace` overwrites or appends (no `changes` entry), `buy` adds the imported quantity (updating unit price) or appends and records a `buy` dated the row's `effectiveDate`, `sell` subtracts (clamped at 0, unit price untouched) and records a `sell` dated the row's `effectiveDate`, or skips unmatched rows (`skippedNoMatch++`) — and resolves the full `ImportResult` incl. the `changes` transaction list (see §6a/§6d). Does not duplicate the try/catch/localStorage logic — always calls into `storage.ts`. |
| `src/storage.ts` | `loadAssets()`/`saveAssets()` — read/write the asset list to `localStorage` under key `oracle_assets_v1`, wrapped in try/catch so a browser that blocks storage doesn't crash the app (`loadAssets` returns `null`, `saveAssets` no-ops on failure). Only called from `src/services/localAssetService.ts`. Also `loadWatchedMarketItemIds()`/`saveWatchedMarketItemIds(ids)` (see §6r) — same try/catch-safe, null-on-missing-or-invalid convention, under key `oracle_market_watchlist_v1`; only called from `src/services/localMarketWatchlistService.ts`. |
| `src/types/transaction.ts` | `TransactionType` (`'buy' \| 'sell' \| 'replace'`, `'replace'` added in §6w) and `Transaction` (`id`/`assetId`/`type`/`quantity`/`unitPrice`/`date`/optional `note`) — the durable buy/sell/replace history model for each asset. A `'replace'` transaction's `quantity`/`unitPrice` mean "the new total state as of this date", not a delta — see §5/§6w. |
| `src/transactionStorage.ts` | `loadTransactions()`/`saveTransactions()` — read/write the transaction list to `localStorage` under key `oracle_transactions_v1`, using the same try/catch-safe array storage pattern as assets/auth/profile. Only called from `src/services/localTransactionService.ts`. |
| `src/services/transactionService.ts` | Defines the `TransactionService` interface (`listTransactions`/`listTransactionsForAsset`/`addTransaction`/`updateTransaction`/`deleteTransaction`/`deleteTransactionsForAsset`) and exports the single `transactionService` instance — currently `= localTransactionService`, matching the swap-one-line service-layer pattern used by assets/profile/auth. |
| `src/services/localTransactionService.ts` | The `localTransactionService: TransactionService` implementation, backed by `src/transactionStorage.ts`. Transaction IDs use the same `crypto.randomUUID()` pattern already used for asset rows; add/update reject invalid `quantity <= 0` or `unitPrice < 0`; asset deletion cleanup is triggered by the UI handler in `App.tsx`, not by coupling this service to `localAssetService`. |
| `src/services/transactionCalculations.ts` | Pure transaction math and migration helpers: `computeHoldingSummary(transactions)` calculates current quantity, weighted-average cost, and realized P/L in chronological order — since §6w, it first finds the most recent `'replace'` transaction (if any) and treats it as a reset checkpoint (see §5/§6w): everything before it is ignored for this calculation only (never deleted from storage), and `quantity`/`averageCost`/`realizedPnL` are re-initialized from that replace's `quantity`/`unitPrice`/`0` before the normal buy/sell accumulation loop continues over whatever comes after it; a `'replace'` transaction is itself never treated as a buy or sell. `ensureInitialTransaction(asset)` lazily creates one synthetic initial buy for a pre-existing asset only if it has no transaction history yet (no-op otherwise, unaffected by §6w). `ensureInitialTransaction` is now called by `TransactionHistoryModal` the first time an asset's history is opened (see §6i); `computeHoldingSummary` is still not used by the UI (the P/L display is a later task) — its `'replace'`-aware behavior was sanity-checked with a temporary throwaway script during §6w's implementation, not a permanent test file. |
| `src/services/priceService.ts` | Defines `LivePrices` (`{ usdToman, goldGramToman, btcToman, ethToman, updatedAt }`, the first 4 toman-denominated, `updatedAt` a `Date.now()` timestamp — see §6l) and the `PriceService` interface (`getPrices(): Promise<LivePrices>`, `subscribe(callback): () => void` — calls back immediately with the current prices, then again on every refresh, returns an unsubscribe function — and `refreshNow(): Promise<LivePrices>`, which immediately re-computes prices and notifies all current subscribers without resetting the 60s interval), and exports the single `priceService` instance — currently `= mockPriceService` (see §6j). Same singleton-swap pattern as `assetService`/`profileService`/`authService`/`transactionService` (see §6d): this is the only line that needs to change to point at a real server-backed price feed later. |
| `src/services/mockPriceService.ts` | The `mockPriceService: PriceService` implementation (see §6j) — **entirely mock, no real price API**. Keeps in-memory current values (`usdToman: 230000` ≈ 1 US dollar, `goldGramToman: 24000000` ≈ 1 gram of 18-karat gold, `btcToman: 10500000000`/`ethToman: 360000000` — see §6l — realistic-looking starting points, not `src/assets.ts`'s old sample-data magnitudes) nudged each step by a shared `jitterStep()` function using a **fixed absolute toman amount** (`usdToman ±20`, `goldGramToman ±2,000,000`, `btcToman ±50,000,000`, `ethToman ±5,000,000`, not percentage-based), which also stamps `updatedAt: Date.now()` every time it runs, on a single shared `setInterval` (60000ms) once at least one subscriber is active; `getPrices()` resolves the current in-memory values immediately; `subscribe(callback)` calls `callback` immediately with the current values, adds it to a `Set` of subscribers notified on every tick, and returns an unsubscribe function that removes it and clears the interval once the last subscriber leaves (no leaked timer when no UI is mounted); `refreshNow()` calls the same `jitterStep()` immediately and notifies all current subscribers, independent of the interval timer — both the tick and manual refresh always apply the identical jitter logic, including the `updatedAt` stamp. |
| `src/hooks/useLivePrices.ts` | `useLivePrices(): LivePrices \| null` — a small hook wrapping `priceService.subscribe(...)` in `useEffect` (subscribes on mount, unsubscribes on unmount via the returned cleanup function), holding the latest `LivePrices` in `useState`, starting `null` until the first callback arrives so the caller (now only `App.tsx`, see §6j/§6k — it threads the result down as a `prices` prop rather than each component calling the hook itself) can render a loading/placeholder state instead of flashing zeroed-out values. |
| `src/services/marketWatchService.ts` | Defines `MarketCategory` (`'currency' \| 'gold' \| 'stock' \| 'fixed-income'`), `MarketItem` (`{ id, name, category, priceToman }`), `MarketSnapshot` (`{ items, updatedAt }`), and the `MarketWatchService` interface (`getSnapshot`/`subscribe`/`refreshNow`, same shape/semantics as `PriceService`, plus — added in §6r — `getAllItems(): Promise<MarketItem[]>`, the full static 14-item catalog with no jitter, used only for picking an item to watch, never for display), exporting the single `marketWatchService` instance — currently `= mockMarketWatchService` (see §6m). Deliberately **independent** from `priceService.ts`/`LivePrices` — a separate mock feed just for the چشم بازار list, not used by `SummaryCard`'s conversions or `AssetRow`'s live-priced assets. |
| `src/services/mockMarketWatchService.ts` | The `mockMarketWatchService: MarketWatchService` implementation (see §6m) — entirely mock, 14 seeded items across 4 categories, same in-memory-state/shared-`jitterStep()`/subscriber-`Set`/single-shared-60s-`setInterval` pattern as `mockPriceService.ts` (§6j). Each item has its own fixed absolute toman jitter range (roughly 0.1%-1% of its starting price, fixed-income items much smaller at ≈0.05% — see §6m's table) applied every tick; `updatedAt: Date.now()` stamped on every `jitterStep()` run (both the 60s tick and `refreshNow()`). `getAllItems()` (§6r) maps `seedItems` to plain `MarketItem`s (drops `jitterToman`), independent of the live-jittered `current` state. |
| `src/services/marketCategoryMeta.tsx` | Shared `categoryOrder: MarketCategory[]` + `categoryMeta: Record<MarketCategory, { label, icon }>` (see §6r) — the 4-category order/Persian-label/icon mapping that used to live only inside `MarketWatchList.tsx`, now extracted so `AddMarketWatchItemModal.tsx` can group its own candidate list by the exact same categories without duplicating the mapping. `.tsx` (not `.ts`) since `categoryMeta` embeds JSX icon elements. |
| `src/services/marketWatchlistService.ts` | Defines the `MarketWatchlistService` interface (`getWatchedIds(): Promise<string[]>`, `addItem(id): Promise<string[]>`, `removeItem(id): Promise<string[]>`, see §6r) and exports the single `marketWatchlistService` instance — currently `= localMarketWatchlistService`. Same singleton-swap-one-line pattern as `assetService`/`marketWatchService`/etc. (see §6d). |
| `src/services/localMarketWatchlistService.ts` | The `localMarketWatchlistService: MarketWatchlistService` implementation (see §6r), backed by `src/storage.ts`'s `loadWatchedMarketItemIds`/`saveWatchedMarketItemIds`. A shared internal `readWatchedIds()` helper returns the stored id list when `loadWatchedMarketItemIds()` is non-`null`, else falls back to **all** ids from `marketWatchService.getAllItems()` — without persisting that fallback — so a first-time/never-customized user keeps seeing every item (matching pre-watchlist behavior) until their first `addItem`/`removeItem` actually writes something, keeping "never customized" (`null`) distinguishable from "customized to include everything" (an explicit array of all ids). `addItem`/`removeItem` both read via that same helper, add/filter the id, persist via `saveWatchedMarketItemIds`, and return the new list. |
| `src/hooks/useMarketWatch.ts` | `useMarketWatch(): MarketSnapshot \| null` — same subscribe-on-mount/unsubscribe-on-unmount pattern as `useLivePrices.ts`, pointed at `marketWatchService` instead of `priceService`. Used only by `MarketWatchList` (see §6m). Also exports `useMarketWatchlist()` (see §6r): `{ watchedIds: string[] \| null; add: (id) => void; remove: (id) => void }` — loads `marketWatchlistService.getWatchedIds()` once on mount into local state (`null` until resolved), and `add`/`remove` call the matching service method and set the returned list directly into that same state, so the UI updates immediately without a full re-fetch. Extended into the existing file rather than a separate `useMarketWatchlist.ts` — smaller diff, same file already owns the چشم بازار hook pattern. |
| `src/services/livePriceMapping.ts` | `getLivePriceKeyForAsset(asset)`/`getEffectiveUnitPrice(asset, prices)` (see §6k) — the single source of truth for which specific catalog assets (by `code`, currently only `GOLD18`→`goldGramToman` and `USDT`→`usdToman`) get their unit price computed live from `LivePrices` instead of their stored `Asset.unitPrice`. Used by `App.tsx` (page total) and `AssetRow` (row value + edit-mode unit-price lock). |
| `src/services/portfolioHistoryService.ts` | Defines `PortfolioSnapshot` (`{ date, totalToman, usdToman, goldGramToman }`, one day's recorded values) and the `PortfolioHistoryService` interface (`listHistory()` oldest-first, `recordSnapshotIfNeeded(...)`, `seedMockHistoryIfEmpty(...)`, see §6n), exporting the single `portfolioHistoryService` instance — currently `= localPortfolioHistoryService`. Same singleton-swap pattern as `assetService`/`priceService`/etc. (see §6d). |
| `src/services/localPortfolioHistoryService.ts` | The `localPortfolioHistoryService: PortfolioHistoryService` implementation (see §6n), backed by `src/portfolioHistoryStorage.ts`. `recordSnapshotIfNeeded` upserts today's entry (overwrites if already present, so repeated calls the same day just update in place) and caps the stored array at the most recent 90 entries. `seedMockHistoryIfEmpty` is a no-op unless history is empty, in which case it generates 30 synthetic days ending yesterday by walking backwards from the given current values with small daily jitter (`totalToman` ±2%, `usdToman` ±0.3%, `goldGramToman` ±1%). |
| `src/portfolioHistoryStorage.ts` | `loadPortfolioHistory()`/`savePortfolioHistory()` — read/write the `PortfolioSnapshot[]` to `localStorage` under key `oracle_portfolio_history_v1`, same try/catch-safe pattern as `src/storage.ts` (`loadPortfolioHistory` falls back to `[]` on missing/corrupt data). Only called from `src/services/localPortfolioHistoryService.ts`. |
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
  There is no direct quantity/unit-price edit anymore (removed in §6v) — an
  asset's quantity only ever changes via a recorded transaction (buy/sell,
  see §6i/§6v), which never touches `code` either — identity never changes
  regardless of which source assigned it.

- Row value = `quantity × unitPrice` (toman) — except GOLD18/USDT, whose
  *effective* unit price is driven live (see §6k); `quantity × unitPrice`
  still applies verbatim to every other asset.
- Page total = `items.reduce((s,a)=> s + a.quantity*getEffectiveUnitPrice(a,
  prices), 0)` over the live `items` state in `App.tsx` (not the raw `assets`
  import) — `getEffectiveUnitPrice` (see §6k) falls through to `a.unitPrice`
  unchanged for every asset that isn't GOLD18/USDT. Since §6ae this
  investment-only `total` is what feeds the portfolio-history snapshots (and
  `PortfolioTrendChart`), while the "ارزش کل دارایی" shown by `SummaryCard` is
  `total + walletTotal` — the wallet total being the sum of the "کیف پول"
  tab's account balances (§6ad/§6ae).
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
  type: 'buy' | 'sell' | 'replace'; // 'replace' added in §6w
  quantity: number;     // intended to be > 0
  unitPrice: number;    // toman per unit at transaction time, intended to be >= 0
  date: string;         // ISO date, e.g. "2026-09-24"
  note?: string;
};
```

- Transactions are stored separately from assets in `localStorage` under
  `oracle_transactions_v1` via `src/transactionStorage.ts` and
  `src/services/localTransactionService.ts` (see §4). The dashboard UI shows each
  asset's transaction history in a modal with a separate record-transaction form
  (see §6i/§6v) — opening a history panel now lazily creates a synthetic initial
  buy for a quantity-holding asset that has no history yet
  (`ensureInitialTransaction`, see below); it never edits or deletes transactions.
- `assetId` points to the related `Asset.id` (not `Asset.code`). When an asset is
  deleted from the current UI, `App.tsx` calls `assetService.deleteAsset(id)` and
  then `transactionService.deleteTransactionsForAsset(id)`; clear-all similarly
  deletes transaction rows for every asset that was present before clearing. This
  keeps the asset and transaction services independent while preventing orphaned
  transaction rows.
- **`'replace'` (added in §6w) — a non-destructive history checkpoint, not a
  delta.** For a `'replace'` transaction, `quantity`/`unitPrice` mean "this is the
  asset's true total quantity / price basis as of this date", not an
  amount-to-add/subtract like `'buy'`/`'sell'`. Recording one **never deletes**
  any earlier transaction — every prior row stays in `localStorage` and keeps
  showing in `TransactionHistoryModal` exactly as before (see §6i/§6w); it is
  purely a *calculation-time* reset point, used so far only by
  `computeHoldingSummary` (below) — a UI still not calling that function can
  simply ignore this distinction entirely and treat `'replace'` rows as
  additional history rows to display.
- `computeHoldingSummary(transactions)` uses weighted-average cost: process by
  chronological `date` (stable by original array order for tied dates). Since
  §6w, it first locates the **most recent** (by that same chronological/tie-break
  order) `'replace'` transaction, if any; if found, every transaction before it
  is dropped from this calculation only (never from storage) and
  `quantity`/`averageCost`/`realizedPnL` are seeded from that replace's
  `quantity`/`unitPrice`/`0` — the normal accumulation loop below then continues
  from there over whatever comes after it. If no `'replace'` transaction exists,
  behavior is unchanged from before §6w. Within that (possibly truncated) window,
  buys update average cost, sells keep average cost unchanged and add realized
  P/L as `(sellUnitPrice - currentAverageCost) * sellQuantity`; a `'replace'`
  transaction is itself never treated as a buy or a sell by this loop — it acts
  only as the reset anchor described above, never adding/subtracting its own
  quantity a second time. If bad data sells more than currently held, quantity is
  clamped at 0 while realized P/L still uses the requested sell quantity.
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
  component used everywhere: the toolbar's import/clear-all/add-transaction buttons
  (`variant="filled"`, always-tinted background) and each asset row's history/
  record-transaction/delete buttons (`variant="ghost"`, tint only on hover).
  `tone="neutral"` = blue/violet tint, `tone="danger"` = red tint. Base className
  includes `aspect-square` (added in §6z) so every instance always renders as a
  true square regardless of any flex-stretch context. Takes `icon`/`onClick`/
  `ariaLabel` props.
- `Toolbar` (in `src/components/Toolbar.tsx`) — the single header row above the
  "کیف پول" asset list (see §6q): three `IconButton`s (import/clear-all/
  add-transaction — the standalone "add new asset" button was removed in §6aa)
  on the right, "ارزش به تومان" + `AssetSortMenu` on the left, in that order
  (swapped in §6aa so the sort-menu icon sits directly beside "تومان"); the
  import button opens the import-mode modal (`onOpenImportModal`), so the
  toolbar no longer owns a file input; the add-transaction button
  (`onAddTransaction`) opens `SelectAssetForTransactionModal` (see §6z/§6aa) and
  now renders `PlusIcon` (re-pointed from `PencilIcon` in §6aa, to match each
  `AssetRow`'s own per-asset "+" button). Takes `onOpenImportModal`/`onClearAll`/
  `onAddTransaction`/`sortMode`/`onSortModeChange` props from `App.tsx` (no more
  `onAdd`, removed in §6aa).
- `AssetRow` (in `src/components/AssetRow.tsx`) — one asset `<li>`: icon, name,
  quantity/unit, value, and history/record-transaction/delete `IconButton`s
  (`aria-label="تاریخچه"`/`"ثبت تراکنش"`/`"حذف"` — the middle one re-pointed from
  `PencilIcon`/`"ویرایش"` to `PlusIcon`/`"ثبت تراکنش"` in §6aa, a stale label fix
  since it never opened an edit form) — a single, always-static view (no local
  inline-edit state or mode anymore, removed in §6v). History calls the parent's
  `onHistory(id)` (opens the transaction-history modal, see §6i); the "+" button
  calls the parent's `onRecordTransaction(id)` (opens `RecordTransactionModal`,
  see §6v — no longer a direct quantity/unitPrice edit); delete calls
  `onDelete(id)`.
- `SummaryCard` (in `src/components/SummaryCard.tsx`) — the summary card (cash
  `AssetIcon`, sample badge, big total, two secondary USD/gold-gram rows (see
  §6j), footer with asset count); takes `total`/`count`/`isSample`/`prices` props
  (`prices` threaded from `App.tsx`'s single `useLivePrices()` call, see §6j/§6k).
- **No more standalone "add new asset" modal** (§6aa) — `AddAssetModal.tsx` and
  its toolbar button were both deleted; adding a brand-new asset now only
  happens by searching the catalog inside `SelectAssetForTransactionModal` (see
  §6z/§6aa/§4), which silently creates it (quantity 0) and proceeds straight
  into `RecordTransactionModal` for the real first buy. `AssetPicker.tsx`
  itself (the searchable catalog combobox `AddAssetModal` used) is left in the
  tree, currently unused/orphaned — nothing wrong with the component, just no
  caller left.
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
   2. Summary `<section>` (`aria-label="ارزش کل دارایی‌ها"`, see §6u) → top row (wallet-icon button on the right, sample badge (only when `isSample`) + hide-balance eye toggle + manual-refresh button on the left), big total (toman — investment total + "کیف پول" wallet-account balances since §6ae), footer with asset count. No visible "ارزش کل دارایی‌ها" heading is rendered any more (see §6u) — the section's accessible name comes from `aria-label` instead.
  2b. `PortfolioTrendChart` (see §6n) — the portfolio-growth-vs-USD/gold trend
      chart card, directly below the summary section in the same column.
  3. Portfolio `<section>` (3 tabs since §6ac — see §6ac; `aria-label` varies
     per tab: `"دارایی‌های من"` on the "سرمایه‌گذاری" (investment) tab,
     `"چشم بازار"` on the "چشم بازار" (market) tab, `"کیف پول"` on the new
     "کیف پول" (wallet) tab — see §6q/§6r/§6ac for why these differ per tab;
     no tab renders a visible `<h2>` heading anymore, so all use `aria-label`
     rather than `aria-labelledby`) → a "سرمایه‌گذاری"/"چشم بازار"/"کیف پول"
     tab toggle (see §6l, tab icons added in §6m, extended to 3 in §6ac) above
     everything else in this section, then, on the "سرمایه‌گذاری" tab: the
     single `Toolbar` header row (import/clear-all/add-transaction icons on the
     right, "ارزش به تومان" + sort menu on the left, in that order since §6aa —
     see §6a/§6b/§6o/§6p/§6z/§6aa; no separate "دارایی‌های من" heading is
     rendered on this tab, see §6q), then `<ul>` of `AssetRow` items (icon,
     name + quantity/unit, value + `تومان`, تاریخچه/ثبت‌تراکنش/حذف) — or the
     empty-state `<p>` when `items` is empty; on the "چشم بازار" tab:
     `MarketWatchList` (see §6l, categorized in §6m, a personal editable
     watchlist with its own add/remove UI since §6r) — no `Toolbar` on this
     tab; `MarketWatchList` itself now renders its own top header row
     (add-to-watchlist `IconButton` on the right, "ارزش به تومان" on the left,
     see §6s) with the "بروزرسانی: …" timestamp on its own separate row below
      that; on the "کیف پول" (wallet) tab: `WalletTab` (see §6ad) — the
      owner's cash/bank accounts (`SectionHeaderCard` holding `<SectionTabs/>`
      + an "افزودن حساب" header row, then a `<ul>` of account rows or the
      "هنوز حسابی ثبت نشده" empty state; add/edit via its own shared small
      modal, immediate per-row delete) — replacing the §6ac placeholder.
  4. Trailing `<p>` disclaimer that values are samples — only rendered when `isSample`.
  5. **(removed in §6aa)** — the standalone add-asset modal no longer exists; see step 7c below for how a brand-new asset is now added.
  6. Side-menu drawer (see §6e) and, opened from it, the profile modal (see §6f) — both rendered as siblings after `<main>`, only when open.
   7. Transaction-history modal (see §6i, history-only since §6v) — rendered as a sibling after `<main>`, only when `historyAssetId` is set (one asset row's History/clock action was clicked); it only lists that asset's transactions, no add-transaction form.
   7b. Record-transaction modal (see §6v, 3-way خرید/فروش/جایگذاری toggle added in §6w, last-price fill button + type-reactive submit button added in §6x, last-price control shrunk to an icon button + مقدار/قیمت‌واحد width ratio changed in §6y) — rendered as a sibling after `<main>`, only when `recordTransactionAssetId` is set (one asset row's "+" action was clicked, OR an asset was just picked/created via the §6z/§6aa picker below); a single "ثبت تراکنش جدید" form for that asset.
   7c. Select-asset-for-transaction modal (see §6z, extended in §6aa) — rendered as a sibling after `<main>`, only when `isSelectAssetForTransactionOpen` is set (the toolbar's "ثبت تراکنش جدید" button was clicked); lets the owner pick any existing asset OR search the catalog and silently create a not-yet-owned one (quantity 0) — either way, picking/creating one closes this modal and sets `recordTransactionAssetId`, opening 7b for that asset. This is now the ONLY way to add a brand-new asset to the wallet (§6aa).
   8. Import modal (see §6a) — rendered as a sibling after `<main>`, only when `isImportModalOpen` is set (the toolbar's Excel-import button was clicked); a single screen combining file selection and the default replace/add/subtract mode choice, with a "بارگذاری" submit.
- All of the above (steps 1–8, minus the removed step 5) only render once a user is logged in — see §6g for
  the login/signup/forgot-password screens shown instead when they are not.

## 6a. Excel import (fixed template only)

- `Toolbar` (see §6, `src/components/Toolbar.tsx`), the single header row above
  the asset list in the "کیف پول" tab's portfolio `<section>` (see §6q): a
  single "ایمپورت اکسل" `IconButton` (`tone="neutral"`,
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

## 6c. Add-asset modal (catalog-driven) — **SUPERSEDED, see §6aa**

> **This entire modal/button was removed in §6aa** — kept below for historical
> context only (the catalog-driven concepts it introduced, e.g. `code` =
> catalog `symbol`, `getAssetIconForCatalogEntry`, are still very much in use,
> just now triggered from `SelectAssetForTransactionModal`, see §6z/§6aa,
> instead of this standalone modal). Do not treat any state/prop/file named
> below (`isAddOpen`, `AddAssetModal.tsx`, `handleAddAsset`) as current —
> check §4/§6/§6aa for what replaced it.

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
  handler (`handleAddAsset`, `handleDelete`, `clearAllAssets`,
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
  clicked asset's history opens. This action is visible in the row's default
  state, alongside edit/delete; it does not change the dashboard layout,
  which still shows exactly one row per asset and the toman total.
- `TransactionHistoryModal` (`src/components/TransactionHistoryModal.tsx`) shows
  that asset's transactions only (filtered by `assetId` — opening one asset never
  surfaces another asset's rows). Each row shows the type as a small 3-way
  badge (خرید = buy, green; فروش = sell, red; **جایگذاری = replace, amber —
  added in §6w**, same `#d7a144`/`#fff5df` tone as `SummaryCard`'s گرم طلا row),
  the date formatted in Persian via `formatDate` (§4 `src/format.ts`), the
  quantity with the asset's unit (8 decimals, same as the dashboard), and the
  price per unit in toman. Optional `note` is shown when present. **Since §6v
  this modal is history-only** — the add-transaction form described below was
  split out into `RecordTransactionModal`, opened from the pencil icon instead
  (see §6v); the bullets below describe the writing mechanics that still apply,
  just via the separate modal now. A `'replace'` row is displayed exactly like
  any other row, never hidden or specially collapsed — its non-destructive
  reset semantics (see §5/§6w) only affect `computeHoldingSummary`, which this
  modal doesn't call.
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
- **Record-transaction form (now `RecordTransactionModal`, see §6v; extended to
  a 3-way toggle in §6w; last-price-fill button + type-reactive submit in §6x;
  last-price control shrunk to an icon button + مقدار/قیمت‌واحد width ratio
  changed in §6y):**
  a "ثبت تراکنش جدید" form lets the owner manually log
  a past or new خرید/فروش/**جایگذاری** for an asset (backfilling pre-feature
  purchases, recording a sale, or — since §6w — checkpointing the asset's true
  current state when they've fallen behind on logging individual
  transactions), opened by `AssetRow`'s pencil icon. Fields: a **3-way**
  segmented toggle (same tab-toggle styling as `AuthScreen`'s login/signup
  tabs, now `grid grid-cols-3`, added in §6w — خرید stays green
  `bg-[#1f9d55]`, فروش stays red `bg-[#d95050]`, جایگذاری is amber
  `bg-[#d7a144]`, the same gold tone `SummaryCard`'s گرم طلا row already uses),
  then (since §6y) an inner `grid gap-[10px] min-[560px]:grid-cols-[2fr_3fr]
  min-[560px]:col-span-2` wrapper (independent of the outer form grid's own
  `min-[560px]:grid-cols-2`, still unchanged and still governing تاریخ/یادداشت
  below) holding just the مقدار/**مقدار جدید** (quantity) and قیمت واحد به
  تومان/**قیمت واحد جدید (تومان)** (unit price) fields — giving قیمت واحد 3
  parts vs مقدار's 2 parts of that row's width at ≥560px, since unit-price
  values run to many more digits than quantity values; below 560px both still
  stack full-width, unchanged. Labels switch to the "جدید" variants only
  while جایگذاری is selected, see §6w, to make the "this is the new total, not
  a delta" meaning explicit) using the shared
  `stripToNumberString`/`formatWithThousands` comma-formatting (text inputs,
  `inputMode="numeric"`, same as `AddAssetModal`, see §6c) — the قیمت واحد
  input now sits beside a small icon-only `IconButton` (`DollarIcon`,
  `tone="neutral"`, `variant="filled"`, `ariaLabel="پر کردن با آخرین قیمت"` —
  §6y, replacing §6x's text "آخرین قیمت" button now that there's no visible
  label to give the control its accessible name; `flex` row inside the label)
  that fills it with `getEffectiveUnitPrice(asset, prices)` — the same
  live-or-stored per-unit rate `AssetRow` already shows next to that asset,
  reusing that helper rather than duplicating price logic, `fillLastPrice`'s
  logic itself unchanged since §6x — a `<input
  type="date">` defaulting to today (local date, via `todayLocalIso()` in
  `src/format.ts`), and an optional یادداشت (note) text input; the submit
  button (§6x) is type-reactive: green/"ثبت تراکنش خرید",
  red/"ثبت تراکنش فروش", amber/"ثبت تراکنش جایگذاری" (the same three toggle
  colors), replacing a single static blue "ثبت تراکنش" label/color used
  before §6x. On submit: client-side validation requires
  `quantity > 0` and `unitPrice >= 0` (and a date) for **all three** types,
  unchanged by §6w — otherwise `toast.error('مقدار و قیمت واحد را به‌درستی
  وارد کنید.')` and the service is not called. Valid input →
  `transactionService.addTransaction({ assetId, type, quantity, unitPrice, date,
  note: note || undefined })`; on success `toast.success('تراکنش ثبت شد')`, the
  `onTransactionRecorded(assetId, type, quantity, unitPrice)` prop fires (the
  `unitPrice` param added in §6w so `App.tsx` can apply جایگذاری's exact-set
  semantics — خرید/فروش ignore it, unchanged), then the modal **closes itself**
  (since §6v — it no longer resets and stays open, because this modal's only
  job is recording one transaction at a time). On failure (the service throws,
  e.g. its internal validation) `toast.error(...)` with the error message and
  the form is left open/untouched.
- **Asset quantity sync:** `App.tsx`'s `handleTransactionRecorded` (passed as
  `onTransactionRecorded`) looks the asset up in `items` and calls
  `assetService.updateAsset(...)`: for خرید/فروش (unchanged since §6v) —
  `{ quantity }` only, buy: `current + quantity`; sell: `Math.max(0, current -
  quantity)` (never negative), `unitPrice` untouched. For **جایگذاری (new in
  §6w)** — `{ quantity, unitPrice }`, both **set directly** to the entered
  values (not additive/subtractive — "this is the asset's new current state"),
  since a replace isn't a purchase/sale event but a full snapshot. Either way
  the returned list is set into `items`. Outside the جایگذاری branch,
  `unitPrice` is **deliberately never touched**: the transaction's unit price
  is only that record's historical trade price (kept in transaction history
  for future P/L calculation); there is still no *direct* quantity/unitPrice
  edit anywhere in the app (removed in §6v) — recording a جایگذاری transaction
  is the only way to directly set `unitPrice` now, and it always goes through
  `transactionService.addTransaction` first, same as any other recorded
  transaction.
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
- **Pencil icon now always writes a transaction (see §6v):** there is no more
  direct quantity/unitPrice edit that bypasses the transaction system — the
  pencil icon opens `RecordTransactionModal`, and every asset-quantity change
  it makes goes through `transactionService.addTransaction` +
  `onTransactionRecorded`, same as any other خرید/فروش/جایگذاری (see §6w).
  Excel import **does** write transactions, but only for rows whose *effective
  type* (see §6a) is `buy`/`sell` (per-row `نوع`, or the modal's default mode
  when a row leaves it empty); a row whose effective type is `replace` — a
  full-snapshot value — writes **none**, since a snapshot is not a purchase
  event. **Do not confuse this with the جایگذاری `TransactionType` added in
  §6w** — they share the same Persian word and both mean "set the exact
  current state", but the Excel-import `replace` mode never writes a
  transaction row at all (see §6a), while a pencil-icon جایگذاری always writes
  one (a visible, amber-badged history entry) — they are two independent
  mechanisms that happen to share a name and a similar snapshot intent.
- **Secure-context note:** `RecordTransactionModal`'s form (and the `handleAddAsset` and
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
- **Manual refresh button.** A small round `RefreshIcon` button
  (`aria-label="بروزرسانی قیمت‌ها"`, `text-[#9096aa]`, hover tint) sits on the
  card's top row, on the left side next to the hide-balance eye toggle (see
  §6p) — originally paired with the now-removed "ارزش کل دارایی‌ها" heading
  row, moved up onto the card's first row in §6u. Clicking it calls
  `priceService.refreshNow()` directly (imported in `SummaryCard.tsx`; no
  prop threaded through `App.tsx`, same as `useLivePrices`). The button does
  **not** itself trigger the spin — local
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
  گرم`. **(Historical note, superseded by §6v):** this section used to also
  describe an inline edit-mode replacing the unit-price `<input>` with a
  read-only "قیمت زنده" label — that whole inline-edit mode (and `onEdit`)
  was removed in §6v; `RecordTransactionModal`'s خرید/فروش form never touches
  `unitPrice` for live-priced assets either, since it only records the
  transaction's own historical trade price, not the asset's live/stored
  `unitPrice`.
- **جایگذاری vs. live-priced assets — a known interaction (see §6w):** unlike
  خرید/فروش, a recorded جایگذاری transaction *does* write `unitPrice`
  directly to the asset (see §6i/§6w's `handleTransactionRecorded`). For a
  GOLD18/USDT asset this stored value is immediately shadowed again by
  `getEffectiveUnitPrice` (this section) on every render, so the row/total
  still show the live price, not whatever was entered — the write isn't
  wrong, it's just inert for those two assets until/unless they're ever
  un-mapped from the live feed. This wasn't explicitly special-cased in §6w
  (recording a جایگذاری against GOLD18/USDT still works and updates
  `quantity` correctly) — just don't be surprised the entered *price* doesn't
  visibly change anything for those two assets specifically.
- **Why `unitPrice` is still a required `Asset` field, not removed:** even
  though it's never *directly* hand-edited (there's still no dedicated
  quantity/unitPrice edit UI, removed in §6v), `Asset.unitPrice` (§5) is now
  settable via a recorded جایگذاری transaction (§6w) as well as still backing
  every non-live-priced asset's row value, and is preserved unchanged if a
  live-priced asset is ever un-mapped from the live feed later.
- This only engages for an asset whose `code` is exactly `GOLD18` or `USDT`
  (the catalog symbols — see §5/§6c) — a manually re-added asset with a
  similar name but no catalog `code`, or a legacy pre-catalog asset that only
  got an auto-generated `<PREFIX>-<NNNN>` code (see §5), is **not** affected
  and keeps manual pricing, exactly as intended.

## 6l. "کیف پول" / "چشم بازار" tabs and MarketWatchList

- The portfolio `<section>` (see §6, step 3) now has a two-tab toggle above
  everything else in it — "کیف پول" (wallet, the existing assets view,
  default/initial tab) and "چشم بازار" (market watch, a new read-only
  live-price list) — driven by `App.tsx`'s `activeSectionTab: 'wallet' |
  'market'` `useState`. Styled with the exact same tab-toggle pattern already
  used by `AuthScreen`'s login/signup tabs (see §6g): `grid grid-cols-2` inside
  a `border border-[#eef0f7] rounded-[10px] p-1` container, each button
  `bg-[#5264e8] text-white` when active and `text-[#7a8097]` when inactive —
  no new tab-toggle pattern invented.
- **"کیف پول" tab** renders exactly what the section always rendered before
  this task, unchanged: the `Toolbar` (import/clear-all/add), the "دارایی‌های
  من" heading, and the `AssetRow` list (or the empty state).
- **"چشم بازار" tab** renders a "چشم بازار" heading (replacing "دارایی‌های
  من" only while this tab is active) followed by `MarketWatchList` (new, see
  §4 `src/components/MarketWatchList.tsx`) — no `Toolbar` on this tab, since
  the market-watch list is entirely read-only.
- **`SummaryCard`/the portfolio total above this section are unaffected by
  the tab** — the toman total, sample badge, and USD/gold-gram rows (see
  §6j) keep coming from `items`/`prices` exactly as before regardless of
  which tab is active; only the section below the summary card switches.
- **`MarketWatchList` (superseded by §6m — categorized rewrite)**: the
  version described in this task (5 flat rows sourced from
  `useLivePrices()`/`priceService`) was fully replaced in the follow-up task
  covered by §6m below — it now uses the independent `marketWatchService`/
  `useMarketWatch()` and renders category groups instead of a flat list. See
  §6m for the current behavior; this bullet and the two below are kept only
  as history of why `LivePrices.btcToman`/`ethToman` exist.
- **Extended mock `LivePrices`** (see §4/§6j): `usdToman`/`goldGramToman` are
  unchanged; two new rates were added, `btcToman: 10,500,000,000` (≈ 1
  bitcoin) and `ethToman: 360,000,000` (≈ 1 ether) — consistent in magnitude
  with `src/assets.ts`'s existing sample BTC/ETH rows (`unitPrice:
  10,000,000,000`/`350,000,000`) — nudged by the same fixed-absolute-toman
  `jitterStep()` pattern as the other two rates (`btcToman ±50,000,000`,
  `ethToman ±5,000,000` per step, both the 60s tick and `refreshNow()`). A
  new `updatedAt: number` field (`Date.now()`) is stamped inside `jitterStep()`
  on every run. `btcToman`/`ethToman` are **not** wired into
  `livePriceMapping.ts` (§6k) — extending the live-priced-asset allow-list to
  BTC/ETH was not part of this task and remains a one-line follow-up if the
  owner asks for it later. **As of §6m, `btcToman`/`ethToman` have no
  remaining UI consumer** (the only caller, the old flat `MarketWatchList`,
  was rewritten to use the independent `marketWatchService` instead) — they
  are left in `LivePrices`/`mockPriceService` untouched rather than removed,
  since this task's follow-up explicitly avoided touching that existing
  live-price wiring; a future cleanup task could remove them from
  `LivePrices` if nothing ever needs them again.
- This is still entirely **mock** data (see §6j).

## 6m. Categorized "چشم بازار" with its own icons and an independent market-watch feed

- **Tab icons**: the "کیف پول"/"چشم بازار" tab toggle from §6l now shows a
  small icon (`w-4 h-4`) inline before each label, `flex items-center
  gap-1.5` on the button — new `WalletIcon` (billfold glyph) before "کیف
  پول", new `MarketEyeIcon` (eye glyph) before "چشم بازار". Both new icons
  live in `src/components/icons.tsx`, same 24x24/`stroke="currentColor"`/
  `strokeWidth="1.8"` style as every other icon in that file.
- **`MarketWatchList` rewritten from a flat 5-row list (§6l) into 4 labeled,
  icon-headed categories**, each with more items — see §4 for the file
  summary. It now calls the new `useMarketWatch()` hook instead of
  `useLivePrices()`. Category order/labels/icons:
  - `'currency'` → "ارزها", new `CryptoIcon` (two overlapping coin circles)
  - `'gold'` → "طلا", the existing `GoldBarIcon` (reused, no new icon)
  - `'stock'` → "بورس", new `StockIcon` (bar-chart glyph)
  - `'fixed-income'` → "صندوق‌های درآمد ثابت", new `FixedIncomeIcon` (shield +
    checkmark glyph)
  Each group heading is an icon in a small `bg-[#eef0ff] text-[#5264e8]`
  badge (the same neutral-tint token used elsewhere, e.g. `AddAssetModal`'s
  live-price label background) plus the Persian category label; under it, a
  plain `<ul>` of read-only rows (name on the right, `{format(item.priceToman)}
  تومان` on the left) — no icon per row (only the category has one), no
  edit/delete/history actions, styled with the same card/border/shadow
  tokens as `AssetRow`. A single shared "بروزرسانی: HH:mm:ss" label (`new
  Intl.DateTimeFormat('fa-IR', { timeStyle: 'medium' })` on
  `snapshot.updatedAt`) renders once near the top of the whole list instead
  of once per row (§6l's version repeated it per row since each row could
  theoretically differ; now the entire snapshot always refreshes together in
  one tick, so one label covers it). Loading state ("در حال دریافت
  قیمت‌ها...") unchanged, shown while `useMarketWatch()` is still `null`.
- **New independent data feed — `src/services/marketWatchService.ts` +
  `src/services/mockMarketWatchService.ts`** (see §4): deliberately a
  **separate mock feed from `priceService`/`mockPriceService`**, with its own
  types (`MarketCategory`, `MarketItem { id, name, category, priceToman }`,
  `MarketSnapshot { items, updatedAt }`) and its own `MarketWatchService`
  interface (`getSnapshot`/`subscribe`/`refreshNow`) — same
  singleton-swap-one-line pattern as every other service in this app (see
  §6d), `marketWatchService = mockMarketWatchService`. It does **not** touch
  or depend on `LivePrices`/`priceService`'s shape, so `SummaryCard`'s
  USD/gold-gram conversions and `AssetRow`'s GOLD18/USDT live pricing (via
  `livePriceMapping.ts`, §6k) are entirely unaffected by this task.
  `mockMarketWatchService` follows the exact same in-memory-state /
  shared-`jitterStep()` / subscriber-`Set` / single-shared-60s-`setInterval`
  pattern as `mockPriceService` (§6j) — `jitterStep()` is called by both the
  60s tick and `refreshNow()`, and stamps `updatedAt: Date.now()` every run.
  Each seeded item carries its own fixed absolute toman jitter range (not
  percentage-based at tick time, though each range was itself sized
  proportionally to that item's starting price when seeded — see the table
  below), applied every tick, same fixed-amount philosophy as
  `mockPriceService`'s existing rates.
- **Seeded items** (14 total, stable kebab-case `id`s), by category:
  | Category | Item | id | Starting price (toman) | Jitter range |
  | -------- | ---- | -- | ----------------------- | ------------ |
  | currency | تتر | `usdt` | 230,000 | ±230 (≈0.1%) |
  | currency | دلار | `usd` | 230,000 | ±230 (≈0.1%) |
  | currency | بیت‌کوین | `btc` | 10,500,000,000 | ±52,500,000 (≈0.5%) |
  | currency | اتریوم | `eth` | 360,000,000 | ±1,800,000 (≈0.5%) |
  | gold | طلای ۱۸ عیار | `gold-18` | 20,800,000 | ±104,000 (≈0.5%) |
  | gold | طلای ۲۴ عیار | `gold-24` | 27,700,000 | ±138,500 (≈0.5%) |
  | gold | سکه امامی | `coin-emami` | 320,000,000 | ±1,600,000 (≈0.5%) |
  | gold | نیم سکه | `coin-half` | 160,000,000 | ±800,000 (≈0.5%) |
  | gold | ربع سکه | `coin-quarter` | 85,000,000 | ±425,000 (≈0.5%) |
  | gold | نقره آبشده | `silver` | 900,000 | ±9,000 (≈1%) |
  | stock | صندوق طلای عیار (مفید) | `fund-mofid-gold` | 28,500 | ±285 (≈1%) |
  | stock | فملی | `fameli` | 8,500 | ±85 (≈1%) |
  | fixed-income | صندوق پیشتاز | `pishtaz` | 57,000 | ±28.5 (≈0.05%) |
  | fixed-income | صندوق پیشرو مفید | `pishro-mofid` | 34,000 | ±17 (≈0.05%) |
  The two fixed-income items deliberately get a much smaller jitter (±0.05%
  vs. ±0.1%-1% for everything else) — fixed-income fund units barely move
  tick to tick in real life, unlike currencies/gold/stocks.
- **`src/hooks/useMarketWatch.ts`** — `useMarketWatch(): MarketSnapshot |
  null`, the exact same subscribe-on-mount/unsubscribe-on-unmount `useEffect`
  pattern as `useLivePrices.ts` (§4), just pointed at `marketWatchService`
  instead of `priceService`.
- **Manual refresh button now refreshes both feeds together**: `SummaryCard`'s
  existing refresh button (§6j) now calls `Promise.all([
  priceService.refreshNow(), marketWatchService.refreshNow() ])` instead of
  just `priceService.refreshNow()` — one click applies a fresh jitter step
  to both the portfolio-total conversions/GOLD18/USDT pricing **and** the
  چشم بازار list at once, still without resetting either service's own 60s
  interval timer. `SummaryCard.tsx` now imports `marketWatchService`
  alongside `priceService` for this.
- Still entirely **mock** data on both feeds — do not present either as a
  real market feed anywhere in the UI/docs.
- Build (`npm run build`) passes. Manual browser verification (Playwright/
  Firefox): tab icons render, all 4 category headings + all 14 items appear
  on the چشم بازار tab, exactly one shared update-time label per view, the
  wallet tab's toolbar/asset list are unaffected, and the manual refresh
  button (clicked from the wallet tab) visibly updates the market tab's
  update-time label on next view.

## 6n. Daily portfolio-history snapshots + a growth-vs-USD/gold trend chart

- **New daily-snapshot history service** — `src/services/portfolioHistoryService.ts`
  + `src/services/localPortfolioHistoryService.ts` + `src/portfolioHistoryStorage.ts`
  (see §4), same singleton-swap/`localStorage`-try-catch pattern as every other
  service in this app (see §6d). `PortfolioSnapshot = { date, totalToman,
  usdToman, goldGramToman }` — one row per calendar day, `date` an ISO
  `YYYY-MM-DD` string. Stored under `localStorage` key
  `oracle_portfolio_history_v1`, capped at the most recent **90 entries**
  (oldest dropped once exceeded).
- **`recordSnapshotIfNeeded(totalToman, usdToman, goldGramToman)`** — upserts
  **today's** entry: if today already has a row (this function was already
  called once today), it's overwritten in place with the latest values rather
  than appended again, so calling it repeatedly the same day (e.g. every time
  `total`/`prices` change) just keeps today's single point current instead of
  creating duplicates.
- **`seedMockHistoryIfEmpty(totalToman, usdToman, goldGramToman)`** — a
  one-time backfill: no-ops if `listHistory()` already has any entries;
  otherwise generates **30 synthetic daily snapshots** for the 30 days ending
  **yesterday** (today's real point is recorded separately via
  `recordSnapshotIfNeeded`, so the two never overlap/duplicate a day), walking
  *backwards* from the given current values with small day-to-day random
  jitter — `totalToman` ±2%, `usdToman` ±0.3%, `goldGramToman` ±1% per
  simulated day — so the backfilled 30 days look like a gently fluctuating
  plausible history instead of a flat line. **This 30-day backfill is
  synthetic/generated, not real historical data** — never present it as real
  past portfolio values.
- **Wiring in `App.tsx`**: a `useEffect` watches `total`/`prices`; once both
  are ready (`prices !== null && total > 0`) it awaits
  `seedMockHistoryIfEmpty(...)` then `recordSnapshotIfNeeded(...)` with the
  current `total`/`prices.usdToman`/`prices.goldGramToman`. A
  `lastSnapshotDateRef` (`useRef<string | null>`) guards this so it only
  actually runs once per calendar date per session — not on every 60s
  `prices` tick — by comparing today's ISO date against the ref before
  proceeding, then storing it. After both service calls resolve, `App.tsx`
  bumps a `historyVersion` counter state, passed to `<PortfolioTrendChart
  refreshKey={historyVersion}/>` so the chart re-fetches `listHistory()` right
  after a snapshot changes instead of only once on mount.
- **`PortfolioTrendChart` (new, `src/components/PortfolioTrendChart.tsx`, see
  §4)** — rendered directly below `<SummaryCard>` in the same column (`App.tsx`
  wraps both in one `<div>`, `PortfolioTrendChart` styled with its own
  `mt-5`/`mt-[19px]` matching the page's existing vertical rhythm, same
  white-rounded-card/border/shadow/padding tokens as `SummaryCard`). On
  mount and whenever its `refreshKey` prop changes, it calls
  `portfolioHistoryService.listHistory()` itself (`useEffect`) rather than
  receiving history as a prop.
  - **Normalization**: for each snapshot, `tomanIndex = (totalToman /
    history[0].totalToman) * 100`; `usdIndex = ((totalToman / usdToman) /
    (history[0].totalToman / history[0].usdToman)) * 100`; `goldIndex =
    ((totalToman / goldGramToman) / (history[0].totalToman /
    history[0].goldGramToman)) * 100` — all three necessarily equal exactly
    100 on day 1, making otherwise-incomparable units (toman vs. dollars vs.
    grams) directly comparable as "% change since day 1".
  - **Rendering**: a hand-rolled inline `<svg viewBox="0 0 600 200">` — **no
    charting library** — with 3 `<polyline>`s auto-scaled to fit the min/max
    across all three series (10% padding) on the Y axis and evenly spaced
    points on the X axis: portfolio/toman `#5264e8` (brand indigo), USD
    equivalent `#1f9d55` (green, matching the existing buy/`toast.success`
    convention), gold equivalent `#d7a144` (matching `iconTint.gold`). All
    `history.length` points are plotted on the lines.
  - **X-axis labels (2026-09-25 revision)**: exactly 3 **relative-time**
    labels, not calendar dates — rendered as real HTML `<span>`s below the
    `<svg>` (not SVG `<text>`, so a normal Tailwind `text-[11px]` size class
    applies as literal on-screen pixels instead of being squashed by the
    SVG's `viewBox` scaling, which is why the original calendar-date version
    was unreadably tiny on mobile). Oldest point (`history[0]`): `"{N} روز
    پیش"` where `N = daysBetweenIso(oldest.date, newest.date)` — naturally
    reads "۳۰ روز پیش" once 30 days of history have accumulated, and the
    correct smaller `N` if the stored history is shorter (never hardcoded to
    30). Midpoint (`history[Math.floor((history.length-1)/2)]`): `"{N} روز
    پیش"` where `N = daysBetweenIso(mid.date, todayIso)`, real computed day
    count (e.g. "۱۵ روز پیش" once 30 days have accumulated). Newest point
    (`history[history.length-1]`, i.e. today): fixed string `"امروز"`. All
    digits rendered via the existing `format()` helper (`src/format.ts`,
    `Intl.NumberFormat('fa-IR')`) — no separate digit-conversion helper
    introduced. `daysBetweenIso` parses `"YYYY-MM-DD"` as **local** dates
    (not UTC) before diffing, avoiding an off-by-one near UTC day
    boundaries. This label row has `dir="ltr"` so it always renders
    left(oldest)→right(today) — matching the SVG's own always-LTR coordinate
    space — even though the rest of the page is RTL (a plain RTL flex row
    here would visually reverse the labels relative to where the lines
    actually are, which is why `dir="ltr"` is required, not optional
    styling). `formatDate()` is no longer used by this component.
  - **Legend**: below the chart, one row per series — a colored dot, the
    Persian label ("دارایی من (تومان)" / "معادل دلار" / "معادل گرم طلا"), and
    that series' latest value expressed as `±X.X٪` relative to day 1 (index
    value − 100), colored green (`#1f9d55`) when ≥ 0 or red (`#d95050`) when
    negative — the same green/red convention already used by
    `TransactionHistoryModal`'s خرید/فروش badges.
  - **Empty state**: fewer than 2 history points (e.g. right after signup,
    before the seed/record effect has finished) shows "داده کافی برای نمودار
    وجود ندارد" instead of an empty/broken chart; a brief "در حال
    بارگذاری..." shows while `listHistory()` hasn't resolved yet.
  - Heading: "روند رشد دارایی نسبت به دلار و طلا".
- **Still built on mock rates**: `usdToman`/`goldGramToman` come from the
  existing mock `priceService` (§6j) — the trend chart is a real computation
  over real recorded `total`/mock-rate history, but "real" here means
  "actually computed from today's real portfolio total each day", not "backed
  by a real market data source". Never present the USD/gold comparison lines
  as tracking real market prices.
- Build (`npm run build`) passes. Manual Playwright/Firefox verification:
  after seeding, the chart renders 3 polylines + all 3 legend rows with
  correctly colored ±% badges on both desktop and mobile viewports, sits
  directly below `SummaryCard` in the page's existing card column, and
  `localStorage['oracle_portfolio_history_v1']` correctly holds 31 entries
  (30 backfilled + today) after first load.

## 6o. Asset-list sort menu ("دارایی‌های من")

- **Owner-requested**: a small three-dot icon-only button (`MoreVerticalIcon`,
  see §4 `src/components/icons.tsx`) sits at the top-left corner of the
  `Toolbar` header row (originally its own separate "دارایی‌های من" heading
  row, later merged into `Toolbar` itself, see §6q), directly beside the
  existing "ارزش به تومان" label (both wrapped in one `flex items-center
  gap-1` span so they occupy the same corner — the label is kept, not
  replaced). Only rendered on the **"کیف پول" tab** (see §6l) — the "چشم
  بازار" tab's header row and `MarketWatchList` are completely untouched by
  this task.
- Clicking it opens `AssetSortMenu` (new, `src/components/AssetSortMenu.tsx`,
  see §4) — a small `absolute`-positioned dropdown (same
  card/border/shadow tokens as `AssetPicker`'s panel, §6c) with exactly two
  radio-style options, a checkmark (`✓`) on whichever is currently active:
  1. **"بیشترین ارزش (تومان)"** (default) — all assets in one flat list,
     descending by each asset's own toman value.
  2. **"بر اساس نوع دارایی"** — assets grouped by their own `icon` field
     (`Asset['icon']`, see §5 — `'gold' | 'fund' | 'cash' | 'usdt' | 'btc' |
     'eth' | 'other'`, always populated for every asset), groups ordered by
     **total group value** descending, assets **within** each group ordered
     by their own value descending. **Bug fix (2026-09-26, see the decision
     log below)**: this originally grouped by
     `getCatalogAssetBySymbol(asset.code)?.category` instead, which only
     resolves for assets whose `code` is a real catalog `symbol` (assets
     added via the catalog-driven `AddAssetModal`) — every legacy/auto-coded
     asset (including all 7 static samples, see §6h) has a non-catalog
     `<PREFIX>-<NNNN>` code, so `getCatalogAssetBySymbol` always returned
     `undefined` for them and they all silently fell into the single
     `'other'` bucket, making "بر اساس نوع دارایی" produce the exact same
     order as "بیشترین ارزش (تومان)" for any portfolio made up mostly/
     entirely of legacy assets — the common case. `asset.icon` has no such
     gap (it's set for every asset regardless of `code`), so it replaced the
     catalog lookup entirely as the grouping key.
- **Reuses the existing value calculation** — no new/duplicate math: both
  modes sort via a small `getAssetTomanValue(asset, prices)` helper in
  `App.tsx` that is just `asset.quantity * getEffectiveUnitPrice(asset,
  prices)`, the exact same call `AssetRow`'s displayed value and `App.tsx`'s
  own `total` already use (`src/services/livePriceMapping.ts`, see §6k) — so
  a live-priced asset (GOLD18/USDT) sorts by its live value, consistent with
  what's shown on its row.
- **State**: `sortMode: AssetSortMode = 'value' | 'type'` in `App.tsx`,
  initialized from `localStorage` (key `oracle_asset_sort_mode_v1`, read via
  a small `readStoredSortMode()` helper — try/catch-safe, falls back to
  `'value'` on a missing key, unrecognized value, or blocked storage, same
  convention as `src/storage.ts`). Selecting an option in `AssetSortMenu`
  calls the `onChange` prop, which `App.tsx`'s `handleSortModeChange` uses to
  update `sortMode` **and** write it straight back to `localStorage`
  (try/catch, no-op on failure) — see the `App.tsx` file-map entry (§4) for
  why this one write bypasses the service layer. `AssetSortMenu` closes
  itself immediately after a selection.
- **Derived, not stored, sort**: `App.tsx` computes `sortedItems =
  useMemo(() => sortAssetsForDisplay(items, sortMode, prices), [items,
  sortMode, prices])` and maps `sortedItems` (not `items`) into `<AssetRow>`
  on the wallet tab. `items` itself — the actual state that
  add/edit/delete/import/clear write to and that persists via `assetService`
  (see §6d) — is **never reordered**; only what's rendered changes. This also
  means the "no assets yet" empty-state check switched from `items.length ===
  0` to `sortedItems.length === 0` (equivalent, since sorting never changes
  length), and re-sorting reacts instantly to a live price tick (`prices` is
  a `useMemo` dependency) without any extra plumbing.
- **`AssetRow.tsx` itself is completely unchanged** — same props, same
  internal edit/delete/history logic; it simply receives assets in a
  different order now.
- **Outside-click handling — deliberately copied from `AssetPicker.tsx`**:
  `AssetSortMenu` uses the exact same `document` `mousedown` listener + a
  container `ref` pattern as `AssetPicker`'s dropdown (see §6c), instead of a
  `fixed inset-0` overlay div. This was a deliberate, explicit requirement
  (not incidental reuse): an overlay div would sit on top of everything else
  in this dropdown's stacking context and could intercept a click meant for
  another open UI element (e.g. a parent modal's own "×"/backdrop) before it
  ever reaches that element — exactly the real bug `AssetPicker.tsx`'s own
  comment documents from an earlier version of this app. A `mousedown`
  listener only *detects* whether a click landed outside this component's
  own DOM subtree (closing the dropdown if so) without ever calling
  `stopPropagation`/`preventDefault`, so the same click still reaches
  whatever it was actually aimed at in the same event dispatch — the
  dropdown's own outside-click logic cannot swallow or block any other
  click-outside behavior in the app.
- No new UI/dropdown library was introduced — `AssetSortMenu` is plain
  React state + Tailwind, matching every other overlay/dropdown in this app.
- Build (`npm run build`) passes.

## 6p. "Hide balance" eye toggle

- **Owner-requested**: a single icon-only eye toggle button in `SummaryCard`'s
  header row, placed directly beside the existing refresh-prices button
  (both inside one `flex items-center gap-1` span so they sit together in the
  same corner — this pair was later moved from its own heading row up onto
  the card's very first row in §6u, still side by side). Clicking it masks/unmasks **every toman amount shown in the
  wallet** in one click: the big total, its دلار/گرم طلا equivalent lines, and
  every `AssetRow`'s own toman value in "دارایی‌های من" — **not** a per-row
  toggle, one shared state drives all of them.
- **Masking** — new `maskAmount(formatted: string)` in `src/format.ts`:
  `formatted.replace(/[0-9۰-۹]/g, '•')`, replacing every Latin or Persian
  digit in an already-`format()`-ed string with a bullet while leaving
  thousands separators/grouping intact, so a masked value still reads as a
  number-shaped placeholder (e.g. `۱,۸۹۶,۳۳۲,۵۴۶` → `•,•••,•••,•••`) instead of
  disappearing or collapsing to a fixed-width blob. Always applied as
  `maskAmount(format(...))`, never a separate rendering path — the exact same
  `Intl.NumberFormat('fa-IR')` output is computed either way, just with digits
  swapped for bullets afterward when hidden.
- **What gets masked vs. left alone**: only amounts that represent the
  owner's own holding **value** — `SummaryCard`'s total, its USD-equivalent
  amount, its gold-gram-equivalent amount, and each `AssetRow`'s own
  `quantity * effectiveUnitPrice` toman value. Everything else stays fully
  visible regardless of the toggle: each row's own `quantity`/`unit` line,
  the small live per-unit-rate sub-text a live-priced asset shows (GOLD18/
  USDT, see §6k), and the "هر دلار/هر گرم … تومان" rate lines under the
  equivalents in `SummaryCard` — those are **prices**, not the owner's
  holding amount, so hiding "how much I have" never hides "what things cost".
- **Icons** (`src/components/icons.tsx`) — new `EyeClosedIcon` (the existing
  `MarketEyeIcon` eye-outline-plus-pupil shape with a diagonal slash added
  through it, same 24x24/`stroke="currentColor"`/`strokeWidth="1.8"` style as
  the rest of the file) for the hidden state; the visible state reuses the
  existing `MarketEyeIcon` directly (imported by `SummaryCard`, not
  duplicated) — the same glyph the "چشم بازار" tab button already uses
  elsewhere in the app.
- **Color as a second signal, not just the icon shape**: the toggle button's
  icon is `text-[#1f9d55]` (the same green already used for the دلار
  equivalent line) when balances are **visible**, and `text-[#9096aa]` (the
  same neutral grey as the refresh button) when **hidden** — so the button's
  own color communicates state at a glance, on top of the eye/crossed-eye
  shape difference. `aria-label` also flips per state (`"مخفی کردن ارزش
  دارایی‌ها"` / `"نمایش ارزش دارایی‌ها"`) rather than one static label.
- **State — same tiny-UI-preference pattern as `sortMode`** (see §6o):
  `isBalanceHidden: boolean` in `App.tsx`, initialized from `localStorage`
  (key `oracle_balance_hidden_v1`) via a small try/catch-safe
  `readStoredBalanceHidden()` helper that falls back to `false` (visible —
  today's/default behavior) on a missing key or a browser that blocks
  storage. `handleToggleBalanceHidden` flips the state (functional update)
  and writes the new value straight back to `localStorage` (`try`/`catch`,
  no-op on failure) — this is a second deliberate exception to the
  service-layer-only rule (see the `App.tsx` file-map note, §4/§6d), for the
  exact same reason `sortMode` is: a tiny, purely-visual, non-domain
  preference, not owner asset data. `isBalanceHidden` is passed straight
  through as a prop into `SummaryCard` and every `<AssetRow>` — there is no
  per-row or per-component copy of the flag, just one shared source of truth.
- **`AssetRow.tsx`/`SummaryCard.tsx` otherwise unchanged** — no new
  edit/delete/history logic, no change to what triggers a re-render besides
  the one new prop; masking is a pure display wrapper around the same
  `format(...)` calls that already existed.
- Verified via Playwright/Chrome: default (nothing in `localStorage` yet)
  renders fully visible/unmasked (matching pre-existing behavior), one click
  masks the total + both equivalent lines + all 7 sample rows' toman values
  simultaneously (quantities/units/live per-unit rates on GOLD18/USDT
  untouched) and turns the toggle icon grey with the crossed-eye glyph, a
  second click restores all of them and the green open-eye icon, and a page
  reload after hiding keeps it hidden (confirmed the `oracle_balance_hidden_v1`
  key holds `"true"` in `localStorage` across the reload). Build
  (`npm run build`) passes.

## 6q. Merged asset-list header row (removed the standalone "دارایی‌های من" heading)

- **Owner-requested**: the "کیف پول" tab used to render **two** separate rows
  above the asset list — `Toolbar` (import/clear-all/add icons) directly
  followed by its own `flex justify-between` row holding the `<h2
  id="assets-title">دارایی‌های من</h2>` heading plus `AssetSortMenu` +
  "ارزش به تومان" (see §6o). Those two rows are now **one**: `Toolbar` itself
  (see §4/§6) renders `justify-between` — import/clear-all/add `IconButton`s
  on the right, `AssetSortMenu` + "ارزش به تومان" on the left — and takes two
  new props, `sortMode`/`onSortModeChange`, threaded straight through from
  `App.tsx` (which no longer imports `AssetSortMenu` itself). The separate
  heading `<div>` in `App.tsx`'s wallet-tab branch was deleted outright — the
  **"دارایی‌های من" heading text is no longer rendered anywhere on screen**.
  Kept the merged row's `mb-[15px] min-[1050px]:mb-[19px]` spacing (the old
  heading row's values, not `Toolbar`'s old `mb-[10px]`) so the gap to the
  asset list below is visually unchanged from before. At the time of this
  task the "چشم بازار" tab's own heading row (`<h2 id="assets-title">چشم
  بازار</h2>` + "ارزش به تومان") and `MarketWatchList` were left completely
  untouched — only the "کیف پول" tab's markup changed here; the market tab's
  own heading was later also removed by the §6r task below, which is why the
  `aria-labelledby="assets-title"` fallback described next no longer applies
  as of §6r (superseded — see §6r for the current per-tab accessible-name
  handling).
- **Accessible name of the assets `<section>`, as of this task (superseded by
  §6r)**: since the wallet tab no longer had any element with
  `id="assets-title"`, the section's `aria-labelledby="assets-title"`
  (previously always pointing at whichever tab's own `<h2>` happened to be
  rendered) would have gone dangling on the wallet tab. Fixed at the time by
  switching the `<section>`'s accessible-name attribute per tab:
  `aria-label="دارایی‌های من"` while `activeSectionTab === 'wallet'`,
  `aria-labelledby="assets-title"` (pointing at the market tab's own `<h2>`)
  while `activeSectionTab === 'market'` — never both, and never a
  `aria-labelledby` pointing at a missing id. §6r below removes the market
  tab's `<h2>` too and switches both tabs to `aria-label`.
- `AssetSortMenu.tsx` itself, `AssetRow.tsx`, `IconButton.tsx`, and every
  icon component are **completely unchanged** — this was a pure layout/
  composition change (which component renders which JSX, and where), not a
  change to any of the pieces themselves. The sort menu's own open/close and
  actual re-sort behavior (§6o, and its 2026-09-26 bug fix) are untouched.
- Verified via Playwright/Chrome at 320px/400px/700px/1200px viewport
  widths: exactly one row above the asset list on the "کیف پول" tab (icons
  right, sort-menu+label left, confirmed vertically aligned — same `top`
  coordinate — at every width), the "دارایی‌های من" text string is not
  present anywhere in the rendered DOM, the sort menu still opens and an
  actual re-sort of the list order is observed when switching to "بر اساس
  نوع دارایی", the "چشم بازار" tab's own heading/label/row is pixel-for-pixel
  unchanged, and the assets `<section>`'s accessible name resolves correctly
  in both tab states with no dangling `aria-labelledby`. Build
  (`npm run build`) passes.

## 6r. Removed the "چشم بازار" heading + a personal, editable market watchlist

- **Owner-requested**: two changes to the "چشم بازار" tab. First, the visible
  "چشم بازار" heading text (`<h2 id="assets-title">چشم بازار</h2>`, added in
  §6l) is now **removed outright**, matching the same "no visible heading
  text on this section" treatment §6q already applied to the wallet tab —
  "ارزش به تومان" still renders alone in its header row (this row's exact
  position/layout was later moved into `MarketWatchList.tsx` itself and
  paired with the add button, see §6s — at the time of *this* task it was
  still `App.tsx`'s own standalone `flex justify-end` row above
  `MarketWatchList`). Second, and the larger change: the "چشم بازار" list,
  which had always shown all 14 mock catalog items unconditionally
  (§6l/§6m), is now a **personal watchlist** — a persisted subset of that
  same fixed 14-item catalog the owner curates via a search-and-add modal
  and a per-item remove button, not an always-show-everything view.
- **Accessible name of the assets `<section>`, final form**: since neither
  tab renders a visible `<h2>` anymore, `App.tsx`'s `<section>` now uses
  `aria-label` on **both** tabs instead of the §6q-era
  `aria-label`-on-wallet/`aria-labelledby`-on-market split:
  `aria-label="دارایی‌های من"` on `activeSectionTab === 'wallet'`,
  `aria-label="چشم بازار"` on `activeSectionTab === 'market'` — never a
  dangling `aria-labelledby` (there is no longer any `id="assets-title"`
  element in the DOM at all).
- **New storage** — `src/storage.ts` gained `loadWatchedMarketItemIds()`/
  `saveWatchedMarketItemIds(ids)` (see §4), the same try/catch-safe,
  null-on-missing-or-invalid convention as `loadAssets`/`saveAssets`, under a
  new `localStorage` key `oracle_market_watchlist_v1` (a plain `string[]` of
  watched item ids, e.g. `["usdt","gold-18",...]`).
- **New service — `src/services/marketWatchlistService.ts` +
  `localMarketWatchlistService.ts`** (see §4): same singleton-swap pattern as
  every other service in this app (§6d) — `getWatchedIds()`/`addItem(id)`/
  `removeItem(id)`, all `Promise<string[]>`-returning (the addressed/updated
  full id list, so the UI never needs a separate re-fetch after a write).
  The **"never customized yet" vs "customized to include everything"**
  distinction is the key design point: `loadWatchedMarketItemIds()` resolving
  `null` (nothing saved yet) makes `getWatchedIds()` fall back to **all**
  ids from the new `marketWatchService.getAllItems()` (see below) **without
  persisting that fallback** — so an existing user (or a fresh install) sees
  exactly the same all-14-items view as before this task, right up until
  their first actual add/remove, at which point `addItem`/`removeItem`
  persist a real (now explicit) list. This means an owner who removes every
  single item ends up with an explicit `[]` in storage (a real empty
  watchlist, correctly rendering the empty state below) — never
  reinterpreted as "never customized" again.
- **`marketWatchService.ts` gained `getAllItems(): Promise<MarketItem[]>`**
  (see §4) — the full static 14-item catalog (all of `mockMarketWatchService`'s
  `seedItems`, mapped to plain `MarketItem`s with `jitterToman` dropped), with
  **no jitter applied** since this is only used for picking an item to watch,
  never for display; it is entirely independent of the live-jittered
  `current` snapshot state that `getSnapshot()`/`subscribe()`/`refreshNow()`
  drive.
- **`src/services/marketCategoryMeta.tsx`** (new, see §4) — the
  `categoryOrder`/`categoryMeta` mapping (4 categories → Persian label + icon)
  that used to live only inside `MarketWatchList.tsx` was extracted here so
  `AddMarketWatchItemModal.tsx` (below) can group its own candidate list by
  the exact same categories without duplicating the mapping. `.tsx` extension
  because `categoryMeta` embeds JSX icon elements.
- **`src/hooks/useMarketWatch.ts` gained a second export,
  `useMarketWatchlist()`** (see §4) — extended into the existing file rather
  than a new `useMarketWatchlist.ts` (smaller diff, same file already owns
  the چشم بازار hook pattern). Loads `marketWatchlistService.getWatchedIds()`
  once on mount into local state (`watchedIds: string[] | null`, `null` until
  resolved), and exposes `add(id)`/`remove(id)` that call the matching
  service method and set the returned list **directly** into that same local
  state — so the rendered list updates immediately on add/remove without a
  full re-fetch round-trip.
- **`MarketWatchList.tsx` rewritten** (see §4) to call both `useMarketWatch()`
  (the live-jittered snapshot) and `useMarketWatchlist()` (the persisted
  watched-id subset), filtering `snapshot.items` down to only watched ids
  *before* grouping by category (an empty category after filtering simply
  doesn't render, same as before). A header row above the category groups
  now holds the existing "بروزرسانی: …" label plus a new neutral/filled
  `PlusIcon` `IconButton` (`aria-label="افزودن به چشم بازار"`, same
  `IconButton`/`tone="neutral"` convention as `Toolbar`'s own add button)
  that opens `AddMarketWatchItemModal` (below). Each item's row gained a
  small danger/ghost trash `IconButton` (same convention as `AssetRow`'s own
  delete button) that calls `remove(item.id)` **immediately, with no
  confirmation** — deliberately lighter-weight than the wallet's
  clear-all-with-toast-confirmation (§6b), matching the low-stakes,
  easily-reversible nature of toggling a watchlist item. When the filtered
  watched list is empty (everything removed, or an explicit empty
  watchlist), a small centered "چیزی به چشم بازار اضافه نشده" message
  renders instead of an empty grid (same muted-text convention as the
  wallet's own "هنوز دارایی‌ای ثبت نشده" empty state, §6).
- **New `src/components/AddMarketWatchItemModal.tsx`** (see §4) — the
  "افزودن به چشم بازار" modal, shelled exactly like `AddAssetModal.tsx`
  (`fixed inset-0` backdrop + centered white card + top-corner `CloseIcon` +
  `aria-labelledby` heading, backdrop-click/`Escape`/card-`stopPropagation`
  close behavior — no new modal pattern invented). On mount it loads the
  full catalog via `marketWatchService.getAllItems()`, excludes any id
  already in the `watchedIds` prop (so you can never add a duplicate), and
  filters the remainder by a plain case-insensitive name-substring search
  input (same convention as `AssetPicker`'s catalog filter, no fuzzy-search
  library — search is "by name" only, per the task). Results are grouped by
  category using the shared `marketCategoryMeta.tsx` above, rendered as
  plain buttons (not `AssetPicker`'s floating/absolute dropdown — this list
  **is** the modal's whole body, not an overlay panel anchored under an
  input). Clicking a result calls the `onAdd(id)` prop (wired to the
  watchlist hook's `add`) and closes the modal immediately. Because there's
  no separate floating panel to protect from the modal's own backdrop click
  (unlike `AssetPicker` inside `AddAssetModal`, see §6c), this component does
  **not** need `AssetPicker`'s `mousedown`-based outside-click detection —
  the modal's own existing backdrop/`Escape` handling is sufficient. Shows
  "همهٔ دارایی‌ها به چشم بازار اضافه شده‌اند" when every catalog item is
  already watched (no candidates left to add), or "دارایی‌ای پیدا نشد" when a
  search query matches nothing.
- **Wallet tab (کیف پول) completely unaffected**: `SummaryCard`, `Toolbar`,
  `AssetSortMenu`, `AssetRow`, the §6p hide-balance eye toggle, and the whole
  `assetService`/`localAssetService`/`src/storage.ts` asset-list path are
  untouched by this task — the new watchlist storage/service/hook files are
  entirely separate from the asset ones, following the same
  service-per-domain convention already used throughout this app (see §6d).
- **Still entirely mock data** (see §6j/§6m) — the watchlist add/remove UI
  only changes which of the same 14 mock catalog items are shown; it never
  adds a real item, a real price, or a real feed. The 60-second jitter tick
  and the manual refresh button (`Promise.all([priceService.refreshNow(),
  marketWatchService.refreshNow()])`, §6m) are untouched and continue to
  drive whichever items remain watched.
- Verified via Playwright/Chrome at multiple viewport widths (320–1200px):
  the "چشم بازار" heading text is gone from the DOM while "ارزش به تومان"
  still renders; on first load (fresh signup, nothing saved yet) all 14
  items render exactly as before, grouped the same way; opening the add
  modal with everything already watched shows the "همهٔ دارایی‌ها..." empty
  message; removing an item immediately hides it from the list and makes it
  reappear as a candidate in the add modal; the search input filters
  candidates by name; adding a candidate closes the modal and immediately
  shows that item back in its category group; removing every item shows the
  "چیزی به چشم بازار اضافه نشده" empty state; the watched-id selection
  persists across a full page reload; the manual refresh button still
  visibly updates the "بروزرسانی: …" timestamp for the remaining watched
  items; the wallet tab (toolbar, sort menu, asset rows, summary card) is
  visually and functionally unaffected. Build (`npm run build`) passes.

## 6s. Moved the "+" (add-to-watchlist) button onto the same row as "ارزش به تومان"

- **Owner-requested**: on the "چشم بازار" tab, the add-to-watchlist "+"
  button used to sit on its own row (paired with the "بروزرسانی: …"
  timestamp inside `MarketWatchList.tsx`, see §6r) directly *below* a
  separate standalone `App.tsx` row holding just "ارزش به تومان" — so the
  "+" appeared on the left, one row down from "ارزش به تومان", instead of
  beside it. The owner wanted these paired on the same row instead, matching
  the "کیف پول" tab's own merged `Toolbar` row (§6q): icon button on the
  right, label on the left, directly facing each other.
- **`App.tsx`**: the standalone
  `<div className="flex justify-end items-center px-1 mb-[15px]
  min-[1050px]:mb-[19px]"><span ...>ارزش به تومان</span></div>` row above
  `<MarketWatchList/>` in the market-tab branch was deleted outright —
  `<MarketWatchList/>` is now the only thing that branch renders below the
  tab toggle.
- **`MarketWatchList.tsx`**: gained a new first header row, above the
  existing "بروزرسانی" row, reusing the exact `mb-[15px]
  min-[1050px]:mb-[19px]` spacing the deleted `App.tsx` row had (so the
  vertical gap down to the category groups is unchanged) — JSX child order
  is icon button first (RTL: right side), label second (RTL: left side),
  the same convention `Toolbar.tsx` already uses for its own merged row
  (§6q):
  ```tsx
  <div className="flex justify-between items-center px-1 mb-[15px] min-[1050px]:mb-[19px]">
    <IconButton icon={<PlusIcon/>} onClick={() => setIsAddOpen(true)} ariaLabel="افزودن به چشم بازار" tone="neutral"/>
    <span className="text-[11px] text-[#656e87]">ارزش به تومان</span>
  </div>
  ```
  The old "بروزرسانی"/"+" row lost its `IconButton` (now with only one
  child, `justify-between` is a no-op) and was simplified to a plain
  `<div className="px-1"><p>بروزرسانی: {updatedAtLabel}</p></div>` — the
  timestamp still renders on its own row, right-aligned, directly below the
  new "+"/"ارزش به تومان" row.
  (The "ارزش به تومان" label described in this row was itself replaced by
  the "بروزرسانی: …" timestamp, and the two rows merged into one, in the
  §6t task below — this section is kept for history.)
- Only these two files changed; `isAddOpen` state, `AddMarketWatchItemModal`,
  the category grouping/rendering, and the per-item remove button are all
  untouched — this was a pure header-row layout change. The wallet tab
  (`SummaryCard`/`Toolbar`/`AssetSortMenu`/`AssetRow`) is untouched.
- Verified via Playwright/Chrome at 320/400/700/1200px: the "+" button and
  "ارزش به تومان" sit on the same row with the "+" on the right (measured
  bounding boxes: same `y`, "+" `x` greater than the label's `x`, correct
  for RTL); the "بروزرسانی: …" timestamp renders on its own row directly
  below; clicking "+" still opens `AddMarketWatchItemModal`; remove-then-
  re-add still works (14 → 13 → 14 items); no "چشم بازار" heading text
  reappeared. Build (`npm run build`) passes.

## 6t. Replaced "ارزش به تومان" with the update timestamp; dropped the second row

- **Owner-requested**: the "ارزش به تومان" label on the "چشم بازار" tab's
  header row (added in §6s) was redundant — every item row already shows
  its own "تومان" unit next to its price (see §4's `MarketWatchList.tsx`
  entry). The owner asked for that label to be replaced by the
  "بروزرسانی: …" update timestamp (which used to render on its own separate
  row directly below, see §6s), and for that now-empty second row to be
  removed entirely.
- **`MarketWatchList.tsx`** (the only file changed): the two rows from §6s
  were merged into one. JSX child order is unchanged (icon button first =
  right side, text second = left side) — only the second child changed from
  the `<span>` label to the `<p>` timestamp, keeping its exact existing text
  and classes:
  ```tsx
  <div className="flex justify-between items-center px-1 mb-[15px] min-[1050px]:mb-[19px]">
    <IconButton icon={<PlusIcon/>} onClick={() => setIsAddOpen(true)} ariaLabel="افزودن به چشم بازار" tone="neutral"/>
    <p className="text-[10px] text-[#a2a8b9]">بروزرسانی: {updatedAtLabel}</p>
  </div>
  ```
  The now-empty second `<div className="px-1">...</div>` row (which used to
  hold just that `<p>`) was deleted outright — there is exactly one header
  row above the category groups now, and the vertical gap down to the first
  category heading is unchanged (still driven by the same
  `mb-[15px] min-[1050px]:mb-[19px]` on the merged row plus the outer
  `grid gap-[18px]` wrapper).
- The "ارزش به تومان" text no longer appears anywhere on this tab (or, since
  it was only ever used here, anywhere in the app). `App.tsx`, the wallet
  tab, `isAddOpen` state, `AddMarketWatchItemModal`, the category
  grouping/rendering, and the per-item remove button are all untouched —
  this was a pure text/row-merge change confined to one file.
- Verified via Playwright/Chrome at 320/400/700/1200px: the "+" button and
  the "بروزرسانی: HH:MM:SS" timestamp sit on the same row (measured
  bounding boxes: same `y`, "+" `x` greater than the timestamp's `x`,
  correct RTL right/left placement); zero matches for "ارزش به تومان"
  anywhere on the page; no leftover empty row or extra gap between the
  merged row and the first category heading; the timestamp still updates on
  manual refresh (unchanged `snapshot.updatedAt` wiring); clicking "+" still
  opens `AddMarketWatchItemModal`; remove-then-re-add still works
  (14 → 13 → 14 items). Build (`npm run build`) passes.

## 6u. Removed "ارزش کل دارایی‌ها" and moved the eye/refresh buttons onto the top row

- **Owner-requested**: the "ارزش کل دارایی‌ها" heading in `SummaryCard.tsx`
  (above the big toman total) was judged unnecessary — the number's context
  is already obvious from the card — and removed outright. The owner also
  wanted the hide-balance eye toggle (§6p) and the manual-refresh button
  (§6j), which used to sit on that now-removed heading's own row, moved up
  onto the card's very first row instead (the row that already holds the
  wallet-icon button and the optional "نمایش نمونه" sample tag).
- **`SummaryCard.tsx`** (the only file changed): the `<h1 id="total-title">`
  was deleted, and the `<span className="flex items-center gap-1">` wrapping
  the eye-toggle and refresh buttons was moved up into the first row. JSX
  child order on that row's left side is unchanged left-to-right visually —
  the optional `{isSample && <span>نمایش نمونه</span>}` tag renders first,
  then the eye/refresh `<span>` group, both now wrapped together in one
  `<span className="flex items-center gap-2">` so they sit as a single group
  on the left side of the first row (right side still holds only the
  wallet-icon button):
  ```tsx
  <div className="flex justify-between items-center">
    <button type="button" onClick={onOpenWallet} aria-label="نمایش کیف پول" className="...">...</button>
    <span className="flex items-center gap-2">
      {isSample && <span className="...">نمایش نمونه</span>}
      <span className="flex items-center gap-1">
        <button type="button" onClick={onToggleBalanceHidden} aria-label={...} className="...">{isBalanceHidden ? <EyeClosedIcon/> : <MarketEyeIcon/>}</button>
        <button type="button" onClick={() => { void Promise.all([priceService.refreshNow(), marketWatchService.refreshNow()]); }} disabled={isSpinning} aria-label="بروزرسانی قیمت‌ها" className="...">
          <span className={isSpinning ? 'animate-spin' : ''}><RefreshIcon/></span>
        </button>
      </span>
    </span>
  </div>
  ```
  The now-empty second row (the old `<div className="flex justify-between
  items-center mt-5 ...">` that used to hold the `<h1>` and the eye/refresh
  `<span>`) was deleted entirely — the big-total block (`<div className="flex
  items-baseline gap-[10px] ...">`) now follows directly after the merged
  first row, with its top margin adjusted from `mt-[5px]` to `mt-4
  min-[1050px]:mt-5 max-[481px]:mt-3` to keep the vertical gap looking
  balanced now that the removed row's height is gone (roughly matching the
  deleted row's own `mt-5`/`mt-[25px]`/`mt-4` values, since that's the gap
  being closed).
- **Accessible name.** Since the `<h1 id="total-title">` is gone, the outer
  `<section aria-labelledby="total-title">` became `<section
  aria-label="ارزش کل دارایی‌ها">` — the card keeps the exact same accessible
  name for screen readers even though the visible heading text is removed.
- Every button's existing classes, `onClick` handlers, `aria-label`s, and
  icon logic (`isBalanceHidden ? EyeClosedIcon : MarketEyeIcon`, the
  `isSpinning`/`animate-spin` wiring, etc.) are unchanged — only their
  position in the JSX tree moved. Nothing else in `SummaryCard.tsx` changed:
  the total number itself, masking behavior, the USD/gold equivalent lines,
  and the footer row are all untouched; `App.tsx`, the wallet-tab
  `Toolbar`/`AssetRow`/`AssetSortMenu`, and the "چشم بازار" tab are all
  untouched too.
- Verified via Playwright/Chrome at 320/400/700/1200px: zero remaining
  matches for "ارزش کل دارایی‌ها" as visible text anywhere on the page (while
  the section itself still carries that string as its `aria-label`); the
  card's first row has the wallet button on the right and, on the left, the
  sample tag (only when `isSample`) followed by the eye toggle then the
  refresh button, all on the same row at every breakpoint with no
  wrap/overlap between the wallet button and the eye/refresh group; clicking
  the eye button still masks/unmasks the total (confirmed via its rendered
  text switching between the real formatted number and the bullet-masked
  placeholder); clicking refresh still adds `animate-spin` to the icon
  immediately. Build (`npm run build`) passes.

## 6v. Split the transaction-history modal from the record-transaction form; pencil icon now opens the latter

- **Owner-requested**: `TransactionHistoryModal.tsx` used to combine two
  separate things in one modal, opened only by the history (clock) icon: a
  read-only transaction-history list AND a "ثبت تراکنش جدید" buy/sell entry
  form. Meanwhile `AssetRow`'s pencil icon opened a completely different,
  older mechanism — a local inline edit mode (text inputs directly inside
  the row, with "ذخیره"/"انصراف" buttons) that overwrote the stored
  `quantity`/`unitPrice` **directly** via `assetService.updateAsset`,
  bypassing the transaction system entirely (no `Transaction` record was
  ever created for a pencil-icon edit — see the "Intentionally NOT writing
  transactions" bullet in §6i, now superseded). The owner wanted these
  untangled: the history icon should show **only** history, and the pencil
  icon should open the buy/sell form as its **own** modal instead of the old
  direct inline edit.
- **`src/format.ts`**: `todayLocalIso()` (today's date as a local `YYYY-MM-DD`
  string) was moved here from a local definition at the top of
  `TransactionHistoryModal.tsx`, exported, so both transaction modals can
  import the same helper instead of duplicating it (see §4).
- **`TransactionHistoryModal.tsx`**: the `formType`/`formQuantity`/
  `formUnitPrice`/`formDate`/`formNote` state, `handleAddSubmit`, and the
  entire "ثبت تراکنش جدید" form block (heading + form) were removed
  entirely. The component no longer takes an `onTransactionRecorded` prop —
  its signature is now just `{ asset, isSample, onClose }`. Everything else
  (the lazy `ensureInitialTransaction` opening-balance step, the
  transactions list, pagination, empty state, the "نمایش نمونه" sample tag,
  the modal shell/close behavior) is untouched.
- **New `src/components/RecordTransactionModal.tsx`**: the exact form state
  and JSX that used to live inside `TransactionHistoryModal` — the خرید/فروش
  toggle, مقدار/قیمت واحد به تومان/تاریخ/یادداشت fields, "ثبت تراکنش" submit
  — moved here verbatim (same validation, same
  `transactionService.addTransaction` call, same `toast.success('تراکنش ثبت
  شد')`/`toast.error(...)` handling, same `onTransactionRecorded(asset.id,
  formType, quantity)` call). Same modal shell pattern as
  `TransactionHistoryModal` (fixed `inset-0` backdrop with its own scroll,
  centered card, `CloseIcon` button, `Escape`-closes, backdrop-click-closes,
  `stopPropagation` on the card). Header shows `<h2>ثبت تراکنش جدید</h2>`
  with the asset's name (plus the "نمایش نمونه" tag when `isSample`) shown
  just below it, so it's clear which asset the transaction is for — same
  title-row pattern `TransactionHistoryModal` itself uses. **One deliberate
  behavior change**: rather than resetting its fields and staying open
  after a successful submit (the old embedded form's behavior, meant for
  logging several transactions in a row without re-navigating), it now calls
  `onClose()` immediately after the success toast/callback — this modal's
  only job is recording one transaction, matching how `AddAssetModal`
  already behaves for a single-purpose action modal. Takes `asset`/
  `isSample`/`onClose`/`onTransactionRecorded` props (same
  `onTransactionRecorded` shape the old embedded form used).
- **`AssetRow.tsx`**: the old inline-edit mechanism was removed entirely —
  `isEditing`/`draftQuantity`/`draftUnitPrice`/`error` local state, the
  `startEdit`/`save` functions, and the `isEditing ? ... : ...` conditional
  branches (input fields with ذخیره/انصراف buttons vs. the static
  quantity/value view) are all gone. The row now always renders what used
  to be the "not editing" branch — it no longer has two visual modes. The
  `onEdit: (id, quantity, unitPrice) => void` prop was removed from the
  component's props type (nothing calls it anymore); a new `onRecordTransaction:
  (id: string) => void` prop was added. The pencil `IconButton`'s `onClick`
  changed from `startEdit` to `() => onRecordTransaction(asset.id)` — its
  icon/`aria-label="ویرایش"`/`tone="neutral"`/`variant="ghost"` are all
  unchanged, only what it opens changed.
- **`App.tsx`**: `handleEdit` (the old direct `assetService.updateAsset(id,
  { quantity, unitPrice })` handler wired to the pencil icon) was removed
  entirely. A new `recordTransactionAssetId` (`string | null`) `useState`
  was added, mirroring the existing `historyAssetId`/`historyAsset` pattern
  exactly (`recordTransactionAsset = recordTransactionAssetId ? items.find(...)
  : undefined`). `<AssetRow>`'s call site dropped `onEdit={handleEdit}` and
  gained `onRecordTransaction={setRecordTransactionAssetId}`.
  `<TransactionHistoryModal>`'s render no longer passes
  `onTransactionRecorded` (the prop no longer exists on that component); a
  new `{recordTransactionAsset && <RecordTransactionModal .../>}` sibling was
  added next to it, passing `onClose={() => setRecordTransactionAssetId(null)}`
  and reusing the **existing, unchanged** `handleTransactionRecorded` handler
  as `onTransactionRecorded` — no new quantity-update logic was needed, since
  that handler already did exactly what a transaction-based quantity update
  requires (buy adds, sell subtracts clamped at 0, `unitPrice` untouched).
- **Both modals are fully independent**: they're keyed off two separate
  `useState`s (`historyAssetId`/`recordTransactionAssetId`) and can be open
  for the same or different assets at the same time (though the current UI
  only ever opens one at a time per click); closing one never affects the
  other's state.
- Untouched by this task: `handleDelete`, `handleAddAsset`,
  `handleTransactionRecorded` itself, deleting/sorting/importing/the
  eye-mask toggle, and every other modal/component in the app.
- Verified via Playwright/Chrome: opening the history icon shows only the
  asset's name, "تاریخچهٔ تراکنش‌ها" subtitle, and the transaction list/empty
  state/pagination — zero occurrences of "ثبت تراکنش جدید" anywhere in that
  modal. Opening the pencil icon shows a **separate** modal titled "ثبت
  تراکنش جدید" with the asset's name below it, the خرید/فروش toggle, and the
  four form fields; submitting a transaction updates the asset's quantity
  (confirmed via the row's updated value and the transaction appearing in a
  subsequent history-modal open) and the modal auto-closes on success. No
  inline `<input aria-label="مقدار ...">`/ذخیره/انصراف markup exists anywhere
  in the rendered page at any point. Build (`npm run build`) passes.

## 6w. "جایگذاری" (replace) transaction type — a non-destructive history checkpoint

- **Owner request:** the owner sometimes falls behind on logging individual
  خرید/فروش transactions for an asset. Rather than reconstructing every
  missed trade, they wanted a third recording option that means "this is my
  asset's true current state as of today" — a checkpoint, not a delta.
- **Design constraint (explicitly agreed non-destructive):** recording a
  جایگذاری transaction must **never delete** any earlier transaction for that
  asset. Every prior خرید/فروش/جایگذاری row stays in `localStorage` and keeps
  showing in `TransactionHistoryModal` exactly as before (see §6i) — the
  "reset" only applies to any *future calculation* over the history, starting
  with `computeHoldingSummary` (see §5), which is instructed to ignore
  everything before the most recent replace and start counting from there.
  `TransactionHistoryModal` itself has no concept of this reset — it always
  lists 100% of stored rows, oldest data included.
- **`src/types/transaction.ts`:** `TransactionType` widened to `'buy' | 'sell'
  | 'replace'` — no other field changes; `Transaction.quantity`/`unitPrice`
  on a `'replace'` row mean "the new total quantity"/"the new price basis",
  not deltas (documented directly on the type's own field comments and in
  §5).
- **`src/services/transactionCalculations.ts`'s `computeHoldingSummary`:**
  after the existing chronological sort (by `date`, stable by original array
  index for ties — unchanged), it now scans for the **last** (most recent by
  that same order) transaction with `type === 'replace'`. If found:
  `quantity`/`averageCost`/`realizedPnL` are seeded from that transaction's
  `quantity`/`unitPrice`/`0` instead of `0`/`0`/`0`, and the accumulation loop
  starts from the position **immediately after** it in the sorted array —
  everything at or before that position is skipped entirely (not deleted,
  just not counted here). If no `'replace'` exists anywhere in the list,
  behavior is byte-for-byte identical to before this task. Inside the loop, a
  `'replace'` transaction is explicitly skipped (`continue`) rather than
  falling into the buy/sell branches — it is never double-counted as an
  additional buy on top of the reset it already performed. Multiple replaces
  in history are handled correctly too: only the single most recent one
  matters, any earlier replace is just as invisible to this calculation as
  any earlier buy/sell. Verified with a temporary throwaway `tsx` script
  (not committed — `computeHoldingSummary` still has no permanent test file
  in this codebase) covering: no-replace unchanged behavior, buys/sells
  before **and** after a replace, replace as the very last transaction,
  multiple replaces (only the latest counts), and same-date tie-breaking
  (replace sorts by original array position on a date collision, same as
  every other transaction type already did) — all 5 scenarios passed.
- **`RecordTransactionModal.tsx` (the pencil-icon form, see §6v):** the
  خرید/فروش toggle became a **3-way** `grid-cols-3` toggle — فروش/خرید/جایگذاری
  in that left-to-right order (خرید stays visually primary/first as before;
  جایگذاری is the new third segment) — خرید active state unchanged
  (`bg-[#1f9d55] text-white`), فروش unchanged (`bg-[#d95050] text-white`),
  جایگذاری active state is amber (`bg-[#d7a144] text-white`) — deliberately
  reusing `SummaryCard`'s existing گرم طلا gold tone (`#d7a144`/`#fff5df`
  pair) rather than inventing a new color, so "replace" reads as a distinct,
  intentional third color rather than an arbitrary one. While جایگذاری is
  selected, the two number field labels switch from "مقدار"/"قیمت واحد به
  تومان" to **"مقدار جدید"/"قیمت واحد جدید (تومان)"** — making the "this is
  the new total, not a delta" meaning explicit at the point of entry; خرید's
  and فروش's labels are untouched. Validation is identical for all three
  types (`quantity > 0`, `unitPrice >= 0`, valid date). On submit, a
  جایگذاری transaction is written via the same
  `transactionService.addTransaction({ assetId, type: 'replace', quantity,
  unitPrice, date, note })` call every other type already used — no special
  casing in the write path itself, only in how `App.tsx` reacts to it (next
  bullet). The `onTransactionRecorded` prop's signature gained a 4th
  parameter, `unitPrice: number` (previously `(assetId, type, quantity) =>
  void`, now `(assetId, type: TransactionType, quantity, unitPrice) => void`)
  — خرید/فروش call sites in `App.tsx` simply ignore the new parameter,
  unchanged behavior; جایگذاری needs it to know what to set `unitPrice` to.
- **`App.tsx`'s `handleTransactionRecorded`:** gained the same 4th `unitPrice`
  parameter (now typed with the shared `TransactionType`, imported from
  `src/types/transaction.ts`, instead of an inline `'buy' | 'sell'` literal
  union). For `type === 'buy' | 'sell'` the function is **byte-for-byte
  unchanged** (still only touches `quantity`, `unitPrice` param simply
  unused) — the owner explicitly required existing خرید/فروش behavior to be
  untouched. A new `if (type === 'replace')` branch, checked first, calls
  `assetService.updateAsset(assetId, { quantity, unitPrice })` — **both**
  fields set directly to the entered values (not additive/subtractive, unlike
  خرید/فروش) — then returns early, since a replace's semantics don't fit the
  buy-adds/sell-subtracts branch below it at all.
- **`TransactionHistoryModal.tsx`:** the per-row badge/card styling (`<li>`
  outer classes + inner `<span>` badge) became a 3-way branch instead of a
  binary `type === 'buy' ? green : red`: خرید unchanged (`border-[#c8ecd4]
  bg-[#f0fdf5]` card / `text-[#1f9d55] bg-[#d7f5e0]` badge), فروش unchanged
  (`border-[#f3c8c8] bg-[#fdf0f0]` card / `text-[#d95050] bg-[#fde3e3]`
  badge), جایگذاری new (`border-[#f0dca0] bg-[#fffbf0]` card —
  slightly-more-saturated amber border/background than the flat
  `#d7a144`/`#fff5df` badge pair, tuned so the card itself doesn't read too
  pale next to the existing green/red cards — badge itself is
  `text-[#d7a144] bg-[#fff5df]`, the exact `SummaryCard` gold tone), labeled
  "جایگذاری" instead of "خرید"/"فروش". A replace row is otherwise a perfectly
  normal history row — same date/quantity/unit-price/note layout, same
  pagination, no special treatment beyond the color/label.
- **Untouched by this task:** `ensureInitialTransaction` (still only ever
  writes a synthetic `'buy'`), `TransactionHistoryModal`'s pagination/loading/
  empty states, the Excel-import `replace` mode (see §6a/§6i's disambiguation
  bullet — a same-named but functionally distinct mechanism that never
  writes a transaction row at all), and every
  AssetRow/AssetSortMenu/eye-toggle/چشم بازار feature.
- **Verified:** via Playwright/Chrome — the pencil-icon modal shows all three
  toggle options (فروش/خرید/جایگذاری); selecting جایگذاری relabels both
  number fields to "مقدار جدید"/"قیمت واحد جدید (تومان)"; submitting
  quantity=10/unitPrice=500,000 against an asset that already held 5 units
  set its displayed quantity to **exactly** 10 (not 15 — confirming
  exact-set, not additive) and its stored `unitPrice` to exactly 500,000; the
  modal auto-closed on success; re-opening the history modal showed **both**
  the new جایگذاری row (amber, computed `background-color: rgb(255, 245,
  223)` / `color: rgb(215, 161, 68)` — the exact `#fff5df`/`#d7a144` pair) and
  the original, untouched خرید row from before the replace (still green,
  still present — confirming non-destructive/no-deletion). Ran the
  `computeHoldingSummary` sanity script described above (5 scenarios, all
  passed). `npm run build` (typecheck + vite build) passes.

## 6x. "آخرین قیمت" fill button + type-reactive submit button in `RecordTransactionModal`

- **Owner request:** two small usability improvements to the pencil-icon
  "ثبت تراکنش جدید" form (§6v/§6w): (1) a one-click way to fill قیمت واحد with
  the asset's current per-unit rate instead of having to type/copy it in
  manually, and (2) make the submit button's color/label reflect which of the
  three types (خرید/فروش/جایگذاری) is currently selected, so it's obvious at a
  glance what pressing it will do — matching the toggle's own three colors.
- **`RecordTransactionModal.tsx` gains a `prices: LivePrices | null` prop**
  (imported from `../services/priceService`, same type `AssetRow`/`SummaryCard`
  already use) — `App.tsx` passes its existing `prices` state (from the single
  `useLivePrices()` call, see §6k) into this modal's render call, the same way
  it already does for `<AssetRow>`/`<SummaryCard>`. No new price-fetching
  logic anywhere — this is purely wiring an already-existing value one level
  deeper.
- **`lastPrice = getEffectiveUnitPrice(asset, prices)`** is computed once at
  the top of the component, reusing the exact same helper `AssetRow` already
  calls (`src/services/livePriceMapping.ts`, see §6k) — for GOLD18/USDT this
  resolves to the live mock rate, for every other asset it falls through to
  `asset.unitPrice`. No `getLivePriceKeyForAsset` import needed here since
  `getEffectiveUnitPrice` already encapsulates that branching.
- **"آخرین قیمت" button:** sits directly beside the قیمت واحد `<input>`
  (`<span className="flex gap-[6px] min-w-0">` wrapping both, inside the same
  `<label>` — the label text/switching logic between "قیمت واحد به
  تومان"/"قیمت واحد جدید (تومان)" from §6w is untouched, just now sitting above
  a row instead of directly above a single input). Clicking it calls
  `fillLastPrice`, which sets `formUnitPrice` to
  `String(Math.round(lastPrice))` — rounded to the nearest whole toman,
  mirroring how `format()` (§4 `src/format.ts`) displays this same value
  elsewhere with `maximumFractionDigits: 0`, so the filled number matches what
  the owner already sees on the row/history. The field stays a completely
  normal editable text input afterward — nothing locks it, the owner can
  still type over the filled value.
- **Layout: `min-w-0` on both the `<label>` and the inner `flex` `<span>`.**
  Without it, this bug surfaced during verification: `<label>` is a CSS
  `grid` item (the form's own `grid gap-1` per-field convention, unchanged),
  and a `flex` child's default `min-width: auto` sizes it to its own content
  rather than shrinking within a grid track — at the `min-[560px]:grid-cols-2`
  two-column breakpoint (roughly 560–900px form width) this made the
  input+button row overflow sideways into the neighboring مقدار field instead
  of respecting its own column. Adding `min-w-0` on the label and the span
  (the `flex-1 min-w-0` already on the `<input>` itself, from the initial
  implementation, wasn't sufficient on its own — the *ancestors* needed it
  too) lets the row shrink to the grid track's actual width, so the input
  correctly gives up space to the `shrink-0` button instead of pushing it off
  to the side. Verified by re-measuring computed `width` at 320/400/560/700px
  after the fix — label/span/input widths now track the available column
  width exactly, with the button holding its fixed content-sized width
  throughout.
- **Submit button, type-reactive (previously a single static
  `bg-[#5264e8]`/"ثبت تراکنش" button regardless of `formType`):** its
  className and label are now both computed from `formType`, reusing the
  exact same three hex colors as the toggle segments directly above it (§6w)
  so the whole form visually agrees on the action about to be taken:
  - خرید → `bg-[#1f9d55]`, "ثبت تراکنش خرید"
  - فروش → `bg-[#d95050]`, "ثبت تراکنش فروش"
  - جایگذاری → `bg-[#d7a144]`, "ثبت تراکنش جایگذاری"

  Switching the toggle updates this immediately (plain derived JSX, no extra
  state) — before any submit happens. The submit handler's own logic
  (validation, `transactionService.addTransaction`, toast, `onClose`) is
  completely unchanged.
- **Untouched by this task:** `TransactionHistoryModal.tsx`, `AssetRow.tsx`,
  the toggle segments themselves, form validation, `handleTransactionRecorded`
  in `App.tsx`, and every wallet/چشم بازار feature.
- **Verified via Playwright/Chrome** at four viewport widths (320/400/700/
  1200px): the "آخرین قیمت" button is visible beside the قیمت واحد input at
  every width without the input becoming unreadably narrow or the button
  wrapping/overlapping (the `min-w-0` fix above was found and confirmed this
  way); clicking it against a non-live-priced sample asset filled the
  input with that asset's exact stored `unitPrice` (`7,500,000`); against a
  freshly-added GOLD18 asset it filled with the exact live rate shown on that
  asset's own row (`24,000,000`, matching `AssetRow`'s "۲۴,۰۰۰,۰۰۰ تومان /
  گرم" line character-for-character); the submit button's computed
  `background-color`/text switched correctly across all three toggle
  selections (خرید green `#1f9d55`/"ثبت تراکنش خرید", فروش red
  `#d95050`/"ثبت تراکنش فروش", جایگذاری amber `#d7a144`/"ثبت تراکنش
  جایگذاری") without a page reload, confirmed both via computed-style
  assertions and visual screenshots. `npm run build` (typecheck + vite build)
  passes.

## 6y. Last-price button shrunk to an icon + مقدار narrower than قیمت واحد

- **Owner request:** two small refinements to §6x's last-price control and
  field layout in `RecordTransactionModal`: (1) the "آخرین قیمت" text button
  eats into the already-tight قیمت واحد column at the form's
  `min-[560px]:grid-cols-2` two-column breakpoint — replace it with a
  smaller icon-only button; (2) at that same breakpoint, مقدار and قیمت واحد
  get equal-width columns even though unit-price values run to many more
  digits than quantity values — give قیمت واحد more room.
- **Icon-only last-price button:** the §6x text `<button>آخرین قیمت</button>`
  is now `<IconButton icon={<DollarIcon/>} onClick={fillLastPrice}
  ariaLabel="پر کردن با آخرین قیمت" tone="neutral" variant="filled"/>` —
  reusing the app's one shared `IconButton` component (`src/components/
  IconButton.tsx`, see §4) instead of a bespoke `<button>`, and reusing the
  existing `DollarIcon` (`src/components/icons.tsx`, already used by
  `SummaryCard`'s دلار row, see §6j) instead of adding a new icon. No new
  components were created. `fillLastPrice`'s own logic (`setFormUnitPrice(
  String(Math.round(lastPrice)))`) is completely unchanged — only the trigger
  element changed. Since the visible "آخرین قیمت" text is gone, the
  `ariaLabel` ("پر کردن با آخرین قیمت") is now this control's only accessible
  name, so it stays fully descriptive rather than a generic "پر کردن".
- **مقدار/قیمت واحد width ratio:** the two fields — previously two direct
  children of the form's outer `grid gap-[10px] min-[560px]:grid-cols-2` (so
  they got equal-width columns at ≥560px, same as تاریخ/یادداشت below them)
  — are now wrapped in their own inner
  `<div className="grid gap-[10px] min-[560px]:grid-cols-[2fr_3fr]
  min-[560px]:col-span-2">`, sitting as a single `min-[560px]:col-span-2`
  item inside the outer grid (in the same position the two labels used to
  occupy). This gives قیمت واحد 3 parts vs مقدار's 2 parts of the row's width
  at ≥560px — visibly wider, never equal or reversed — while leaving the
  outer form grid's own `min-[560px]:grid-cols-2` completely untouched, so
  تاریخ and یادداشت below keep their existing equal-width side-by-side layout
  unaffected. Below 560px the inner grid has no `grid-cols` override, so it
  falls back to a single implicit column — مقدار and قیمت واحد still stack
  full-width exactly as before, unchanged from pre-§6y behavior. The §6x
  `min-w-0` fix (on the قیمت واحد `<label>` and its inner `flex` `<span>`,
  needed so the input+icon-button row shrinks to its own grid column instead
  of overflowing) is untouched and still required — it now applies to the
  narrower of the inner grid's two tracks instead of the outer grid's own
  column, same fix, same reason.
- **Untouched by this task:** the toggle segments, the submit button,
  validation, `fillLastPrice`'s calculation, `getEffectiveUnitPrice`, the
  `prices` prop threading, تاریخ/یادداشت fields/labels, and everything in
  `App.tsx`.
- **Verified via Playwright/Firefox** at four viewport widths (320/400/700/
  1200px): the last-price control renders as a small icon button (no
  "آخرین قیمت" text anywhere in the DOM) sitting directly beside the قیمت واحد
  input with no overlap/clipping at any width; at 700px/1200px (≥560px) قیمت
  واحد's input column measures visibly wider than مقدار's, while تاریخ/یادداشت
  below remain equal-width; at 320px/400px (<560px) both مقدار and قیمت واحد
  stack full-width at equal column width, matching pre-§6y behavior; clicking
  the icon button against a non-live-priced sample asset still filled the
  قیمت واحد input with that asset's exact stored `unitPrice`
  (`7,500,000`), confirming `fillLastPrice`'s behavior is unchanged. `npm run
  build` (typecheck + vite build) passes.

## 6z. Square icon buttons everywhere + a global "record transaction" toolbar button

- **Owner request, two parts.** (1) `RecordTransactionModal`'s last-price
  icon button (§6y) renders taller than it is wide, not square: it sits
  inside `<span className="flex gap-[6px] min-w-0">` next to the قیمت واحد
  `<input>`, and `flex`'s default `align-items: stretch` makes it match the
  input's (taller, form-field-sized) height while its width stays at its
  own `p-2`-plus-icon size — the fix belongs in the shared `IconButton`
  component, not a one-off override on this one usage. (2) the owner wants
  a way to open `RecordTransactionModal` for *any* existing asset directly
  from the wallet toolbar, without first finding that asset's row and
  clicking its own pencil icon.
- **`IconButton.tsx` base className gains `aspect-square`** (`src/components/
  IconButton.tsx`, see §4/§6) — added to the one shared className string
  every `<IconButton/>` instance renders with, so its width always tracks
  its actual rendered height in ANY context: the last-price button's
  flex-stretched height (fixed by this), plus every other existing usage
  (`AssetRow`'s history/edit/delete, `Toolbar`'s import/clear-all/add/
  add-transaction, `MarketWatchList`'s per-row trash, `AddMarketWatchItemModal`
  via `AssetSortMenu`, etc.) where height was already intrinsic and this
  changes nothing visually. No one-off override class was added to
  `RecordTransactionModal.tsx` itself — the fix is entirely in the shared
  component, per the owner's explicit instruction.
- **New `src/components/SelectAssetForTransactionModal.tsx`** (see §4) — the
  "ثبت تراکنش برای کدام دارایی؟" picker, shelled exactly like
  `RecordTransactionModal` (same backdrop/card/`CloseIcon`/`Escape`/
  `stopPropagation` classes and behavior). Takes `items: Asset[]`/`onClose`/
  `onSelect: (assetId: string) => void` props. A plain search `<input>`
  filters `items` by a case-insensitive substring match on `asset.name`
  (same convention as `AssetPicker`/`AddMarketWatchItemModal`'s catalog
  filters — no fuzzy-search library, and no need for `AssetPicker`'s full
  combobox/keyboard-nav machinery since this is a full modal, not a
  dropdown), rendered as a scrollable list of buttons — each showing
  `AssetIcon`/`iconTint[asset.icon]` + the asset's name, the same
  icon-rendering pattern `AssetRow` uses. Clicking a result calls
  `onSelect(asset.id)`; the modal itself does not close on selection — the
  caller (`App.tsx`) does, by unmounting it and mounting
  `RecordTransactionModal` for that id in the same state update. Guards an
  empty `items` list with a short "هنوز دارایی‌ای ثبت نشده" message instead
  of the search/list (though `App.tsx`'s `handleOpenAddTransaction` already
  prevents this modal from ever opening in that state — see below).
- **`Toolbar.tsx` gains a 4th `IconButton`** (see §4/§6), added to the
  existing right-side `<div className="flex gap-[8px]">` group after
  import/clear-all/add: `<IconButton icon={<PencilIcon/>}
  onClick={onAddTransaction} ariaLabel="ثبت تراکنش جدید" tone="neutral"/>`
  — reuses the exact same `PencilIcon` `AssetRow`'s own per-asset "record a
  transaction for this asset" button already uses, so the pencil glyph's
  meaning stays consistent across the app (per-row pencil = "record for
  this one", toolbar pencil = "record for any one, pick which"). New
  `onAddTransaction: () => void` prop, wired from `App.tsx`.
- **`App.tsx` wiring**: a new `isSelectAssetForTransactionOpen` boolean
  state, and `handleOpenAddTransaction` (called by the toolbar's new
  button) — if `items.length === 0`, shows `toast.warning('ابتدا یک
  دارایی اضافه کنید')` and returns without opening anything (a picker over
  zero assets would be pointless and `SelectAssetForTransactionModal`'s own
  empty-state guard would otherwise be the only thing preventing an empty
  modal); otherwise sets `isSelectAssetForTransactionOpen` to `true`.
  `SelectAssetForTransactionModal` is rendered as a sibling after `<main>`
  (see §6, layout step 7c) only while that flag is set, passed the existing
  `items` state; its `onSelect` callback closes the picker
  (`setIsSelectAssetForTransactionOpen(false)`) and sets the *already
  existing* `recordTransactionAssetId` state to the chosen id in the same
  update — this is exactly the state `AssetRow`'s pencil action already
  sets (see §6v), so the resulting `RecordTransactionModal` render is
  byte-for-byte the same component instance/props shape either way, with
  no new modal-rendering branch or duplicated transaction-recording logic.
- **Untouched by this task:** `AssetRow.tsx`, `TransactionHistoryModal.tsx`,
  the چشم بازار tab, `AssetSortMenu`, `fillLastPrice`'s calculation,
  `RecordTransactionModal`'s validation/submit logic, and every other
  `IconButton` usage's own click handler/icon/tone.
- **Verified via Playwright/Firefox**: every `IconButton` instance across
  the app (toolbar's 4 buttons, `AssetRow`'s pencil, and specifically the
  last-price button that motivated this fix) now measures an exactly-equal
  computed width/height (square), confirmed via `boundingBox()` assertions
  and a screenshot. Clicking the toolbar's new "ثبت تراکنش جدید" button
  opens `SelectAssetForTransactionModal`; searching by name (e.g. "تتر")
  filters the list correctly; selecting a result closes the picker and
  opens `RecordTransactionModal` for that exact asset with no picker left
  behind — the same خرید/فروش/جایگذاری toggle and last-price button render
  as when opened via that asset's own pencil icon, and `Escape` closes it
  fully. Closing the picker via its "×" button, `Escape`, or a backdrop
  click all leave no transaction modal open behind it. Clicking the
  toolbar button against an explicitly emptied wallet
  (`oracle_assets_v1: []`) shows the warning toast and never opens the
  picker. `npm run build` (typecheck + vite build) passes.

## 6aa. Consolidated "+" iconography, removed the standalone add-asset button, and taught the picker to add new assets

- **Owner request, four parts**, all about tidying up how a transaction gets
  recorded and how a brand-new asset gets added, now that both flows exist
  side by side (§6v/§6z):
  1. `AssetRow`'s per-asset record-transaction button used `PencilIcon` +
     `ariaLabel="ویرایش"` — stale on both counts (it never opened an edit
     form even before §6v, and a pencil no longer matches what "+" means
     everywhere else in the app). Swapped to `PlusIcon` +
     `ariaLabel="ثبت تراکنش"`.
  2. `Toolbar`'s standalone "افزودن دارایی جدید" button (`PlusIcon`, opened
     the old `AddAssetModal`) was removed entirely — redundant now that
     `SelectAssetForTransactionModal` can add a brand-new asset itself (part
     4 below), and having two different "+" buttons that did different
     things (one added an asset, one opened a transaction picker) was
     confusing.
  3. The toolbar's remaining "ثبت تراکنش جدید" button switched from
     `PencilIcon` to `PlusIcon` — after (1) and (2), "+" now consistently
     means "record a transaction" everywhere (toolbar and per-row), with no
     competing pencil icon left anywhere in the wallet UI.
  4. `SelectAssetForTransactionModal` gained a second capability: besides
     picking an existing wallet asset (unchanged), searching now also
     matches the full catalog (`getCatalogAssets()`) and offers up
     not-yet-owned results, each tagged "دارایی جدید". Picking one silently
     creates it (quantity 0) and proceeds straight into
     `RecordTransactionModal` — no separate "confirm adding this asset"
     step. This makes the picker the app's only remaining way to add a
     brand-new asset, so the old standalone modal (part 2) could be deleted
     outright rather than just hidden.
- **`src/components/AssetRow.tsx`** (see §4/§6): `PencilIcon` import replaced
  with `PlusIcon`; the record-transaction `<IconButton>`'s `icon`/`ariaLabel`
  updated to match. `onRecordTransaction` callback/behavior unchanged.
- **`src/components/Toolbar.tsx`** (see §4/§6): the "افزودن دارایی جدید"
  `<IconButton>` and its `onAdd` prop were deleted outright (not just
  hidden/disabled). The remaining "ثبت تراکنش جدید" button's icon changed
  `PencilIcon`→`PlusIcon`. The right-side icon group now holds exactly 3
  buttons (import/clear-all/add-transaction) instead of 4. Separately, the
  left-side `<span>` swapped its two children's order — "ارزش به تومان" now
  renders BEFORE `<AssetSortMenu>` (previously after) — no other change to
  either element's markup/props/behavior; since this row is RTL, "first in
  markup" renders on the right, so this visually moves the three-dot
  sort-menu icon from the label's right side to sit directly beside the
  word "تومان" at the label's own left end, which was the requested target
  position.
- **`src/components/SelectAssetForTransactionModal.tsx`** (see §4) rewritten
  to add the catalog-search capability, on top of everything it already did
  (see §6z for the unchanged baseline: shell/backdrop/`Escape`, existing
  wallet-asset name search+list, `onSelect(assetId)` callback contract):
  - New props: `prices: LivePrices | null` (threaded from `App.tsx`'s
    existing `useLivePrices()` call, same one `AssetRow`/`RecordTransactionModal`
    already receive) and `onAddAsset: (asset: Asset) => Promise<void>` (a
    new, deliberately narrow `App.tsx` handler — see below).
  - While a search query is active, catalog assets (`getCatalogAssets()`,
    same module-level static import `AssetPicker.tsx` uses) whose `name` OR
    `symbol` contains the query (case-insensitive substring, same convention
    as `AssetPicker`) are filtered down further to just the ones **not**
    already in the wallet. "Already owned" is checked two ways —
    `owned.code === catalogAsset.symbol` (the normal case for anything
    previously added via the catalog) **or** an exact case-insensitive
    `owned.name === catalogAsset.name` match — the second check exists
    because legacy/auto-coded assets (the default 7 samples, and anything
    added before catalog codes existed, see §5/§6h) carry an
    auto-generated `<PREFIX>-<NNNN>` code instead of the catalog symbol
    (e.g. the sample "تتر" is coded `USDT-0001`, not `USDT`) — without the
    name fallback, the catalog's own "تتر" (`USDT`) would incorrectly show
    up as a "new" pick-and-create option right next to the already-owned
    one. Matches are rendered below a "دارایی‌های جدید" heading, each row
    carrying a small rounded "دارایی جدید" badge (`bg-[#eef0ff]
    text-[#5264e8]`, the same neutral-tint token used elsewhere in the app)
    so it's visually distinct from an ordinary owned-asset row. With no
    query, this section doesn't render at all — behavior is identical to
    before §6aa.
  - Selecting a not-yet-owned catalog result (`pickCatalogAsset`) builds a
    new `Asset` — `id: crypto.randomUUID()`, `name`/`unit`/`icon` from the
    catalog entry (`getUnitLabel`/`getAssetIconForCatalogEntry`, same
    helpers `AddAssetModal` used to use), `code` = the catalog `symbol`,
    **`quantity: 0`** (deliberate — the very next screen is a خرید
    transaction that sets the real amount), and `unitPrice` from
    `getEffectiveUnitPrice(newAsset, prices)` (see §6k) — this resolves to
    the live mock rate for GOLD18/USDT and `0` for everything else (no new
    price source invented; `0` is fine since it's immediately overwritten
    by the first real transaction). Calls `onAddAsset(newAsset)` (awaited),
    then `onSelect(newAsset.id)` — from the picker's own perspective this is
    indistinguishable from selecting an existing asset; `App.tsx` doesn't
    know or care whether the id it received was pre-existing or just
    created. A `pendingSymbol` state (plus `disabled` on the catalog rows
    while it's set) guards against a double-click racing two creations of
    the same asset.
  - The old `items.length === 0` empty-state guard (which fully replaced
    the search input/list with a "هنوز دارایی‌ای ثبت نشده" message) is gone
    — an empty wallet is no longer a dead end, since the catalog search is
    always available regardless of how many assets are already owned. In
    its place, a small inline hint ("هنوز دارایی‌ای ثبت نشده — نام دارایی
    موردنظر را جست‌وجو کنید تا اضافه شود") renders above the (empty) list
    only while there's no active query and no owned assets, disappearing
    the moment either becomes true.
- **`App.tsx` wiring** (see §4/§6):
  - `handleAddAsset` (the old merge-by-catalog-code add-asset handler, plus
    its `AddAssetModal` import/render and `isAddOpen` state) was deleted
    entirely — confirmed via a full-repo search that `AddAssetModal`/
    `AssetPicker`/`isAddOpen`/`onAdd` had no other callers before removing
    anything, so nothing else in the app depended on them.
  - A new, much smaller `handleAddNewAsset` (renamed from the deleted
    handler's role, not its logic) replaces it: just
    `assetService.addAsset(newAsset)` + `setItems`/`setIsSample(false)` —
    **no transaction is written here** (unlike the old `handleAddAsset`,
    which always wrote an initial `buy`), because this asset is created at
    quantity 0 specifically so the immediately-following
    `RecordTransactionModal` submission is itself the first real
    transaction; writing a second, redundant zero-quantity "buy" here would
    double up history for no reason. Passed to
    `<SelectAssetForTransactionModal onAddAsset={handleAddNewAsset}>`.
  - `handleOpenAddTransaction`'s old `items.length === 0` guard (which
    showed `toast.warning('ابتدا یک دارایی اضافه کنید')` and refused to
    open the picker) was removed — the toolbar's "ثبت تراکنش جدید" button
    now always opens `SelectAssetForTransactionModal` unconditionally,
    matching that modal's own new empty-wallet-friendly behavior above.
  - `<Toolbar>`'s call site dropped `onAdd`; `<SelectAssetForTransactionModal>`'s
    call site gained `prices={prices}` and `onAddAsset={handleAddNewAsset}`.
- **`src/components/AddAssetModal.tsx` deleted outright** — confirmed via a
  full-repo search first that its only remaining reference was `App.tsx`'s
  own import/render (now removed); `src/components/AssetPicker.tsx` (the
  searchable catalog combobox `AddAssetModal` used) is **not** deleted —
  it has no functional problem, it's just currently orphaned (no caller),
  kept in the tree in case a future feature wants a full combobox again
  (§4 notes this explicitly so it isn't mistaken for dead code to prune
  blindly).
- **Untouched by this task:** `RecordTransactionModal.tsx`'s own
  validation/submit/toggle/last-price logic, `TransactionHistoryModal.tsx`,
  `AssetSortMenu.tsx`'s dropdown behavior itself (only its position in the
  parent row's markup changed), the چشم بازار tab/`MarketWatchList`, the
  Excel import, and every other `IconButton` usage's own click
  handler/tone/variant.
- **Verified via Playwright/Firefox**: the toolbar renders exactly 3 icon
  buttons (import/clear-all/add-transaction, no "افزودن دارایی جدید"), the
  add-transaction button's SVG matches `PlusIcon`'s path, `AssetRow`'s "+"
  button's SVG also matches `PlusIcon` and opens `RecordTransactionModal`
  for that row's asset, and no `aria-label="ویرایش"` button exists anywhere.
  The "ارزش به تومان" label's bounding box sits to the right of the
  sort-menu icon's bounding box (confirming the swap, in this RTL layout).
  Opening the picker with an empty query shows no "دارایی جدید"/"دارایی‌های
  جدید" text; searching "نیم سکه" (an unowned catalog asset) shows exactly
  one "دارایی جدید"-badged result under a "دارایی‌های جدید" heading;
  selecting it closes the picker, opens `RecordTransactionModal` for "نیم
  سکه" defaulting to خرید, and — after submitting a خرید of quantity 3 —
  the asset persists in `localStorage` with `code: 'COIN-HALF'` and
  `quantity: 3`, and appears as a normal row in the wallet list; reopening
  the picker and searching "نیم سکه" again now shows it as an owned result
  with no badge (no duplicate). Searching "تتر" (an already-owned, legacy
  auto-coded sample asset) still lists it as an owned result and shows no
  "دارایی جدید" badge for it, confirming the name-fallback owned-check.
  Against a fully empty wallet, opening the picker shows the inline hint
  (no warning toast, no dead end) and searching "اتریوم" successfully
  creates+selects it (persisted at `quantity: 0` before any transaction is
  submitted). A no-match search still shows "دارایی‌ای پیدا نشد". `npm run
  build` (typecheck + vite build) passes.

## 6ab. Mobile card around the tab switcher + header row

- **Owner-reported look-and-feel issue**: below the 1050px breakpoint, the
  assets `<section>` (App.tsx) only gets its card styling
  (`min-[1050px]:bg-white`/`border`/`rounded-[22px]`/`p-[22px]`) at
  desktop width — below 1050px the section has no card at all, so the
  "کیف پول"/"چشم بازار" tab switcher and whichever header row sits under it
  (`Toolbar` on the wallet tab, `MarketWatchList`'s own "+"/"بروزرسانی" row
  on the market tab) rendered "naked" directly on the gray page background,
  looking unfinished next to `SummaryCard`/`PortfolioTrendChart`'s own
  cards above them. Fix: wrap just the tab switcher + that tab's header row
  in one small white card below 1050px — the asset/market item lists stay
  OUTSIDE it (each row is already its own card).
- **`src/components/SectionTabs.tsx` (new)** — the tab-switcher markup moved
  out of `App.tsx` unchanged (same `grid grid-cols-2 ... border
  border-[#eef0f7] rounded-[10px] p-1` div, same two buttons,
  `WalletIcon`/`MarketEyeIcon`, same active/inactive `bg-[#5264e8]`
  styling), now a small component taking `{ activeTab: 'wallet' | 'market';
  onChange: (tab) => void }` props (`SectionTab` type also exported from
  here) instead of reading/writing `App.tsx`'s state directly. Its bottom
  margin changed from `mb-[15px] min-[1050px]:mb-[19px]` to `mb-[12px]
  min-[1050px]:mb-[19px]` — 12px instead of 15px below 1050px, since it now
  sits inside `SectionHeaderCard`'s own padded card rather than directly
  above the section's outer padding; unchanged at 19px on desktop.
- **`src/components/SectionHeaderCard.tsx` (new)** — a plain wrapper `<div>`
  whose card styling applies ONLY below 1050px, via Tailwind v4's
  `max-[1050px]:` variant (the exact complement of the outer section's own
  `min-[1050px]:` classes): `max-[1050px]:bg-white
  max-[1050px]:border max-[1050px]:border-[#eceef8]
  max-[1050px]:rounded-[20px] max-[1050px]:shadow-[0_12px_36px_#2734790b]
  max-[1050px]:p-[14px] max-[351px]:p-[10px] max-[1050px]:mb-[15px]` —
  reusing the exact large-card tokens `SummaryCard.tsx`/
  `PortfolioTrendChart.tsx` already use (`bg-white`/`border-[#eceef8]`/
  `shadow-[0_12px_36px_#2734790b]`), just scoped to mobile instead of
  always-on, plus the same `max-[351px]:` smaller-padding step
  `AssetRow.tsx`'s own card row uses at that width. At ≥1050px this
  component renders no bg/border/padding/margin at all — the outer section
  already IS the card there, so a second, nested card would double up the
  look. Takes only a `children` prop.
- **`App.tsx` wiring**: the standalone tab-switcher `<div>` was deleted from
  the assets `<section>`; the wallet branch now renders
  `<SectionHeaderCard><SectionTabs activeTab={activeSectionTab}
  onChange={setActiveSectionTab}/><Toolbar .../></SectionHeaderCard>`
  followed by the existing empty-state `<p>`/`<ul>` of `AssetRow`s
  (unchanged, outside the card); the market branch now renders
  `<MarketWatchList tabs={<SectionTabs activeTab={activeSectionTab}
  onChange={setActiveSectionTab}/>}/>` — `SectionTabs` is instantiated once
  per branch (never both at once, since only one branch renders at a time),
  so it still renders exactly once on screen. `WalletIcon`/`MarketEyeIcon`
  imports removed from `App.tsx` (moved into `SectionTabs.tsx`, no longer
  used at the call site); added imports for `SectionTabs`/
  `SectionHeaderCard`.
- **`src/components/MarketWatchList.tsx`**: gained an optional `tabs?:
  ReactNode` prop. Both of its early-return branches (the "در حال دریافت
  قیمت‌ها..." loading state and the normal populated state) now render
  `<SectionHeaderCard>{tabs}<div className="... header row ...">...</div>
  </SectionHeaderCard>` followed by the existing `<div className="grid
  gap-[18px]">` of category sections/items, outside the card — previously
  the loading state returned only a bare `<p>` with no tabs/card at all, so
  passing `tabs` here also fixes a rendering gap in the loading state (the
  tab switcher used to disappear entirely while the market snapshot was
  still loading). No other change to the category-grouping/add/remove
  logic.
- **`src/components/Toolbar.tsx`** and `MarketWatchList.tsx`'s own header
  row: both changed `mb-[15px] min-[1050px]:mb-[19px]` to
  `min-[1050px]:mb-[19px]` (dropped the mobile 15px) — on mobile the
  spacing to the list below now comes from `SectionHeaderCard`'s own
  `max-[1050px]:mb-[15px]` (the card's own bottom margin) instead of the
  header row's internal margin, so the two didn't stack into a doubled
  gap; on desktop the spacing is unchanged at 19px (still the header row's
  own margin, since `SectionHeaderCard` contributes nothing there).
- **Untouched**: the outer assets `<section>`'s own classes, button
  behavior/icons/order, RTL layout, `AssetRow.tsx`, the Excel import,
  every other modal.
- **Verified via Playwright/Chrome** at 320/340/360/390/480/800/1200px, both
  tabs: below 1050px (320-800px tested) the tab switcher + header row sit
  inside one visually distinct white rounded card (matching
  `SummaryCard`/`PortfolioTrendChart`'s look) with the asset/market item
  cards sitting below it with a normal gap, for both "کیف پول" and "چشم
  بازار"; no horizontal overflow (`scrollWidth > clientWidth`) at any
  tested width; the assets `<section>`'s own bounding-box top position was
  measured identical before and after switching tabs at 390px (no layout
  jump); at 1200px (≥1050px) screenshots before this change (via `git
  stash`, same session/data) and after are structurally identical — single
  card, same spacing, no nested/doubled card. `npm run build` (typecheck +
  vite build) passes.

## 6ac. 3-tab split: "investment" (renamed asset list) + new "wallet" placeholder

- **Context / intent**: the tab id previously labelled `"wallet"` (Persian
  "کیف پول", `WalletIcon`) was a misnomer — it actually rendered the
  investment/asset list (`SectionHeaderCard` + `Toolbar` + the `AssetRow`
  list). This task splits that one tab into two: the asset list is **renamed**
  to `"investment"` (Persian "سرمایه‌گذاری") and a **brand-new** `"wallet"` tab
  (Persian "کیف پول") is added, whose real content (cash/bank-account tracking)
  is intentionally **not** built yet — it is a placeholder for a follow-up task.
  This is part 1 of a 3-task sequence; only the 3-tab shell + routing is in
  scope here.
- **`SectionTab` type** (`src/components/SectionTabs.tsx`) changed from
  `'wallet' \| 'market'` to `'investment' \| 'market' \| 'wallet'`.
- **`SectionTabs.tsx` switcher** changed from a 2-button `grid grid-cols-2` to a
  3-button `grid grid-cols-3`, in this exact order, reusing the identical
  button markup/classes (active `bg-[#5264e8] text-white`, inactive
  `text-[#7a8097]`):
  1. `onChange('investment')` → new `InvestmentIcon` + "سرمایه‌گذاری"
  2. `onChange('market')` → `MarketEyeIcon` + "چشم بازار" (unchanged)
  3. `onChange('wallet')` → `WalletIcon` + "کیف پول" (the icon/label that used
     to sit on the old first/"کیف پول" button, moved here)
- **New `InvestmentIcon`** (`src/components/icons.tsx`) — a bag/coin-with-plus
  glyph, same 24x24/`stroke="currentColor"`/`strokeWidth="1.8"`/round-cap
  style as every other icon in that file.
- **`App.tsx`** changes (no behavior change to the existing tabs, only ids):
  - state is now `useState<SectionTab>('market')` (default tab unchanged — still
    "چشم بازار"); the inline `'wallet' \| 'market'` literal is gone in favor of
    the imported `SectionTab` type.
  - `SummaryCard`'s `onOpenWallet` (the top-left icon button, `aria-label="نمایش
    کیف پول"`) now calls `setActiveSectionTab('investment')` instead of
    `'wallet'` — it keeps opening the investment/asset-list tab exactly as
    before; only the tab id it targets changed.
  - the assets `<section>`'s `aria-label` now handles all 3 states:
    `"دارایی‌های من"` (investment) / `"چشم بازار"` (market) / `"کیف پول"`
    (wallet).
  - the section's conditional render is now a 3-way branch:
    - `activeSectionTab === 'investment'` → the **exact pre-existing** asset-list
      JSX (`SectionHeaderCard` + `SectionTabs` + `Toolbar` + `AssetRow` list /
      empty-state), unchanged.
    - `activeSectionTab === 'market'` → the **exact pre-existing**
      `<MarketWatchList tabs={<SectionTabs/>}/>` branch, unchanged.
    - `activeSectionTab === 'wallet'` (new) → a **temporary placeholder**: a
      `SectionHeaderCard` holding just `<SectionTabs activeTab onChange/>`,
      followed by a centered paragraph reusing the existing empty-state muted
      text style (`text-center text-[11px] leading-[1.9] text-[#969eb2] py-4`)
      reading "به‌زودی — پیگیری حساب‌های نقدی این‌جا اضافه می‌شود". Kept
      minimal on purpose — it is replaced by a real component in the next task.
- **Acceptance / no-op guarantees**: clicking "سرمایه‌گذاری" shows exactly what
  the old "کیف پول" tab showed (asset list, Toolbar, import/add/sort controls)
  with fully unchanged behavior, just under the new id/label; "چشم بازار" is
  fully unchanged; "کیف پول" shows the placeholder with no console/runtime
  errors; the SummaryCard icon button still opens the asset-list tab; no other
  visual/behavioral change. `npm run build` (typecheck + vite build) passes.

## 6ad. "کیف پول" (wallet) tab: cash/bank accounts (part 2 of the 3-task sequence from §6ac)

- **Context / intent**: the §6ac placeholder ("به‌زودی — پیگیری حساب‌های
  نقدی این‌جا اضافه می‌شود") is replaced with a real, fully dynamic list of the
  owner's cash/bank accounts — e.g. "نقد" ۵۰٬۰۰۰ / "کارت بانک ملی"
  ۱٬۲۰۰٬۰۰۰ / "کارت بانک رسالت" ۱۰۰٬۰۰۰٬۰۰۰ toman. There is no fixed
  sample set and no catalog: the owner adds/renames/edits/deletes any number of
  named accounts at will. These are **spendable cash balances** — deliberately
   unrelated to the `cash`-icon catalog asset or the "دارایی‌های من" list, and
   (at the time) not folded into the "ارزش کل دارایی" total — that fold-in is
   what part 3 of the sequence did (see §6ae).
- **Data shape / storage**: `WalletAccount = { id: string; name: string;
  balance: number }` (`src/services/walletService.ts`) — `balance` is a plain
  toman amount, displayed with `format()` + "تومان" (no quantity × unit-price).
  Since §6af the interface also carries four OPTIONAL bank-detail fields —
  `bankName?`, `cardNumber?`, `accountNumber?`, `shebaNumber?` — rendered as
  small muted lines under the account name when present; the
  `addAccount`/`updateAccount` signatures (`Omit`/`Partial<Omit<…,'id'>>`)
  picked them up without any signature change.
  New dedicated namespaced key `oracle_wallet_accounts_v1` in
  `src/walletStorage.ts` (`loadWalletAccounts`/`saveWalletAccounts`, same
  try/catch-safe, null-on-missing convention as `src/storage.ts` — `null` =
  never saved yet, `[]` = everything deleted). New
  `walletService`/`localWalletService` pair follows the singleton-swap
  service-layer pattern of every other service (§6d):
  `listAccounts()` resolves `null` when untouched (since §6af `App.tsx`'s
  mount effect uses that signal to seed the one-time default "نقدی"
  account — see there), and every mutation
  (`addAccount`/`updateAccount`/`deleteAccount`) resolves the **full updated
  list** — `App.tsx`'s `walletAccounts` state is kept canonical by always
  setting the service's returned list (the same `items` ↔ `assetService`
  pattern). Account `id`s are a manual UUID v4 from `crypto.getRandomValues()`
  — NOT `crypto.randomUUID()`, which is `[SecureContext]`-only and undefined on
  the current plain-HTTP deployment (the same reason `localAuthService`
  generates user IDs this way, §6g); adding a wallet account is an
  owner-facing action that must work there.
- **`WalletTab.tsx`** (new component, rendered by `App.tsx`'s
  `activeSectionTab === 'wallet'` branch — the placeholder JSX was replaced):
  props `{ tabs?: ReactNode; accounts: WalletAccount[] | null;
  onAccountsChanged: (accounts: WalletAccount[]) => void }` (mirrors
  `MarketWatchList`'s `tabs` prop, §6ab). `accounts === null` (before
  `App.tsx`'s mount-time `walletService.listAccounts()` resolves — which seeds
  the default "نقدی" account when the stored value is `null` and otherwise
  uses the stored array as-is, §6af) renders `SectionHeaderCard` + "در حال
  بارگذاری..." (same loading line style as `MarketWatchList`). Otherwise: `SectionHeaderCard`
  holding `{tabs}` + a header row (same `justify-between`/
  `min-[1050px]:mb-[19px]` shape as `MarketWatchList`'s) with the neutral/filled
  `PlusIcon` `IconButton` "افزودن حساب" on the right and a "حساب‌های نقدی"
  label on the left; outside the card, a `<ul class="list-none m-0 p-0 grid
  gap-[10px]">` of account rows or the muted empty-state
  "هنوز حسابی ثبت نشده" (same style as the other tabs' empty states).
- **Row styling**: reuses `AssetRow`'s exact card tokens (white card,
  `border-[#eef0f7]`, `rounded-[17px]`, `shadow-[0_4px_14px_#28377c03]`, the
  full responsive padding/width ladder) with the `cash`-tinted `AssetIcon`
  (`iconTint.cash`, the billfold glyph) in the same 46px/41px/35px icon badge —
  every account looks like a cash row since that's what they are. Right side:
  `format(balance)` + "تومان" in the same value styling as `AssetRow`, and
  two ghost `IconButton`s — `PencilIcon` "ویرایش" (neutral) and `TrashIcon`
  "حذف" (danger).
- **Add/edit**: one shared inner `WalletAccountModal` (shelled exactly like
  `RecordTransactionModal` — `fixed inset-0 z-50` backdrop, `Escape` listener,
  "×" button, `stopPropagation` on the card, `max-w-[440px]`, same input
   tokens). Add mode: empty name + `"0"` balance. Edit mode: pre-filled from the
   row's account. Original fields: "نام حساب" (text, placeholder "مثلا: کارت
   بانک ملی") and "موجودی به تومان" (numeric text input via the shared
   `stripToNumberString`/`formatWithThousands` pair); §6af inserted four more
   plain-text OPTIONAL fields between them (نام بانک/شماره کارت/شماره حساب/
   شماره شبا) — see §6af. Submit validates (non-empty
   trimmed name → `toast.error('نام حساب را وارد کنید.')`; finite balance ≥ 0 →
   `toast.error('موجودی را به‌درستی وارد کنید.')`; blank bank fields never
   block) and stores each blank one as `undefined` (not `''`), then calls
  `walletService.addAccount({name, balance})` or
  `updateAccount(id, {name, balance})`, toasts
  `حساب اضافه شد`/`تغییرات ذخیره شد` on success (red
  `toast.error('ذخیره حساب انجام نشد')` on failure), and pushes the returned
  full list up via `onAccountsChanged`; the modal closes itself only on
  success.
- **Delete**: immediate, **no confirmation** (the lighter-weight convention §6r
  chose for the market watchlist's per-item remove, and lighter than the
  wallet's clear-all toast-confirmation §6b — a single named account is low
  stakes): `walletService.deleteAccount(id)` → `toast.success('حساب حذف شد')`
  → list pushed up.
- **`App.tsx`** changes (nothing else touched): imports `walletService` +
  `WalletAccount` + `WalletTab`; new state `walletAccounts: WalletAccount[] |
  null` (starts `null` — no sample data exists for this tab, so no
  `isSample`-like flag is needed); a mount-time `useEffect` calls
  `walletService.listAccounts()` and sets the result (`null` → `[]`); the
  wallet branch now renders
  `<WalletTab tabs={<SectionTabs .../>} accounts={walletAccounts}
   onAccountsChanged={setWalletAccounts}/>`. The `investment` branch, the
   `market` branch, `SummaryCard`, and the "ارزش کل دارایی" `total` are
   completely unchanged (the total fold-in happened next, in §6ae).
- **Acceptance**: `npm run build` (typecheck + vite build) passes with no new
  errors. Add/edit/delete all work and persist across a reload (same
  `localStorage` key); the empty state shows when no accounts exist; the
  loading line shows only briefly before the mount load resolves; visual
   consistency with the other two tabs (RTL, card tokens, toasts); no behavior
   change to the investment/market tabs or the portfolio total.

## 6ae. "ارزش کل دارایی" grand total now includes the wallet accounts (part 3 of the 3-task sequence from §6ac — closes the sequence)

- **Context / intent**: the §6ad "کیف پول" tab tracks the owner's cash/bank
  account balances, but at that point they were deliberately kept OUT of the
  "ارزش کل دارایی" card. Part 3 folds them in: the grand total shown by
  `SummaryCard` is now **investment total + wallet-account balances**, so the
  card reflects the owner's whole net worth (invested assets + spendable
  cash), not just the investment list.
- **Change (display-only, `App.tsx` only — nothing else touched)**: a new
  `const walletTotal = (walletAccounts ?? []).reduce((sum, account) => sum +
  account.balance, 0);` right below the investment `total` (line ~314). The
  `?? []` guard is REQUIRED — `walletAccounts` is typed `WalletAccount[] |
  null` and stays `null` until the mount-time `walletService.listAccounts()`
  resolves, so a bare `.reduce` (the originally suggested snippet) would fail
  the `tsc` typecheck. `<SummaryCard total={total} .../>` became
  `<SummaryCard total={total + walletTotal} .../>` (line ~467).
- **Deliberately NOT changed**:
  - The `total` const itself is still the investment-only figure
    (`items.reduce(...)` over `getEffectiveUnitPrice`, §5) and keeps its name —
    it is still fed, investment-only, to the portfolio-history snapshot effect
    (`seedMockHistoryIfEmpty`/`recordSnapshotIfNeeded`, deps `[total, prices]`)
    and to `PortfolioTrendChart`. So the trend chart's history stays an
    investment-only series (existing snapshots were recorded that way; mixing
    in cash balances would make old/new points incomparable). Only the
    `SummaryCard` display gets the combined value.
  - `SummaryCard.tsx` is untouched — it derives everything (big toman number,
    the "≈ X دلار" and "≈ X گرم طلا" lines, and the hide-balance masking) from
    the same `total` prop, so the combined value propagates to all of it
    automatically. `count` stays `items.length` (the wallet has no "asset
    count" to add).
  - `WalletTab.tsx`, `walletService.ts`, `localWalletService.ts`,
    `walletStorage.ts` are all untouched — account `balance` was already a
    plain toman amount (§6ad), so no conversion is needed.
- **Acceptance**: with N wallet accounts, "ارزش کل دارایی" = investment total
  + Σ balances exactly (before the mount load resolves, `walletTotal` is 0, so
  the card briefly shows the investment-only total — same one-frame behavior as
  every other `walletAccounts === null` site). The دلار/طلا footer lines and
  the balance-hiding toggle all reflect the combined number. The
  `PortfolioTrendChart` history is unaffected (still investment-only).
   `npm run build` (typecheck + vite build) passes. This closes the 3-task
   sequence begun in §6ac (part 1 §6ac, part 2 §6ad, part 3 here).

## 6af. "کیف پول" accounts: optional bank details + one-time default "نقدی" account (builds on §6ad)

- **Context / intent**: two owner-requested additions to the §6ad wallet tab —
  (a) optional bank-detail fields on each account, and (b) a default "نقدی"
  (cash) account that exists from the very first visit, but is never recreated
  once the owner deletes it (**superseded by §6al — it is now re-seeded
  whenever missing**).
- **`WalletAccount` type** (`src/services/walletService.ts`): four OPTIONAL
  fields added after `balance` — `bankName?`, `cardNumber?`,
  `accountNumber?`, `shebaNumber?` (all `string`). No signature changes were
  needed elsewhere: `addAccount(account: Omit<WalletAccount, 'id'>)` and
  `updateAccount(id, changes: Partial<Omit<WalletAccount, 'id'>>)` derive from
  the interface and pick the new fields up automatically (verified by the
  typecheck). `localWalletService` needed no change either — it spreads the
  caller's object verbatim, so the optional fields flow through add/update as
  plain data (absent → simply not present on the stored object).
- **`WalletAccountModal` (add/edit)**: four new plain-text inputs inserted
  between "نام حساب" and "موجودی به تومان", in this order: "نام بانک"
  (bankName), "شماره کارت" (cardNumber), "شماره حساب" (accountNumber),
  "شماره شبا" (shebaNumber) — same `text-[11px] text-[#7a8097] grid gap-1`
  label wrapper + same input tokens as the other fields, each with its own
  `formX` string state (initialized from `account?.field ?? ''` in edit mode,
  `''` in add mode). Deliberately plain text — NO
  `stripToNumberString`/`formatWithThousands` grouping (unlike the balance
  field). All are optional: blanks never block submission (the only hard
  validations stay name non-empty + finite balance ≥ 0). On submit each value
  is trimmed and stored as **`undefined` when blank** (`value.trim() ||
  undefined`) — not `''` — so the object shape stays clean. Both `onSubmit`'s
  prop type and `WalletTab`'s `handleAccountSubmit` gained the four trailing
  optional params; `handleAccountSubmit` builds one `changes = { name,
  balance, bankName, cardNumber, accountNumber, shebaNumber }` object and
  passes it to BOTH `updateAccount` and `addAccount` (previously each call
  only sent `{ name, balance }`).
- **Blanking on edit works because of `updateAccount`'s spread**: passing all
  four keys (with `undefined` for the blanked ones) into
  `{ ...account, ...changes }` overwrites the stored value with `undefined`,
  which `JSON.stringify` then DROPS — so a field the user cleared on edit is
  genuinely removed from the stored JSON, and the row shows nothing for it.
- **Row rendering** (as originally shipped; **changed in §6ak — the row now
  only ever renders the `bankName` line, when set; the card/account/sheba
  number lines were removed from the row display**): the name cell
  (`flex-1 min-w-0`, under the `<h3>` name) rendered, only when at least one
  of the four fields was present, a `grid gap-[2px] mt-[3px]` block of small
  muted lines — `text-[11px] text-[#9096aa]` (the same muted tone already
  used for the balance "تومان" unit), one `<p>` per present field in the same
  bankName/cardNumber/accountNumber/shebaNumber order. The three number fields
  additionally carried `[font-variant-numeric:tabular-nums]
  [overflow-wrap:anywhere]` (long card/sheba digits should wrap, not overflow
  the card). The balance display on the right is unchanged; an account with
  no bank fields (e.g. the seeded "نقدی") renders exactly as before.
- **One-time "نقدی" seed** (`App.tsx`'s mount-time wallet effect; as
  originally shipped, **superseded by §6al — the seed is now self-healing: it
  checks for an account named "نقدی" by name on every load, and re-adds it
  whenever it is missing, regardless of whether the source was `null` or a
  real array**. The `walletSeededRef` StrictMode guard below is unchanged):
  `listAccounts()`
  resolving `null` means "never saved before" while an actual array — even
  `[]` — means "the owner has been here and chose this list" (§6ad's
  null-vs-`[]` storage contract). The effect now branches on exactly that: on
  `null` it calls `walletService.addAccount({ name: 'نقدی', balance: 0 })` and
  uses THAT call's returned list as the initial state (a real mutation — it
  persists the seeded list to `oracle_wallet_accounts_v1`, so from then on the
  key is never missing); on any stored array (including `[]`) it uses it
  as-is. A `walletSeededRef` (`useRef(false)`, set true on the effect's first
  run) dedupes the dev-only StrictMode double effect run — without it, both
  runs would read `null` before either seed writes, and a fresh browser would
  get TWO "نقدی" accounts; production runs the effect once, so the ref is a
  no-op there. Net behavior: a completely fresh browser (cleared localStorage)
  starts with exactly one account, "نقدی", balance 0, with no reload or
  manual action; deleting "نقدی" writes the remaining list (possibly `[]`),
  which resolves as an array on the next load, so it is NEVER re-seeded.
- **Deliberately NOT changed**: `SummaryCard`, the "ارزش کل دارایی"
  calculation (`total`/`walletTotal`, §5/§6ae) and the investment/market tabs
  — "نقدی" (balance 0) adds nothing to the grand total, and a later-balance
  "نقدی" counts exactly like any other wallet account. `localWalletService.ts`
  and `walletStorage.ts` are untouched.
- **Acceptance**: `npm run build` (typecheck + vite build) passes with no new
  TS errors. Fresh browser → the "کیف پول" tab shows exactly one account
  "نقدی" (۰ تومان, no bank-detail lines) immediately; deleting it + reloading
  keeps it gone (empty state "هنوز حسابی ثبت نشده" shows instead) — **the
  "keeps it gone" clause is superseded by §6al: "نقدی" is now re-seeded on
  reload whenever it is missing, so it can never stay deleted**. The add
  modal shows نام حساب + the four bank fields + موجودی; leaving the bank
  fields blank submits fine and the row shows no extra lines; filling them in
  shows them as muted lines under the name (tabular numerals for the three
  number fields); editing pre-fills the bank fields and a save updates /
  clears them correctly. `npm run build` passes. (Row-display note: as of
  §6ak the row shows only the bank-name line — the three number fields are
  still collected, stored, and pre-filled on edit, just no longer rendered in
  the list.)

## 6ag. Wallet-transaction data/service foundation (no UI yet, builds on §6ad/§6af)

- **Context / intent**: the investment side has a full transaction-history feature
  (`src/types/transaction.ts` + `src/services/transactionService.ts` +
  `localTransactionService` + `src/transactionStorage.ts`); this task adds the
  **equivalent data layer for wallet accounts, without any UI** — groundwork for a
  later wallet-history view. Simpler on purpose: a wallet transaction has a single
  plain-toman `amount`, not a `quantity` × `unitPrice` split (a cash/bank balance
  isn't priced like an asset).
- **`WalletTransaction` model** (`src/types/walletTransaction.ts`):
  `WalletTransactionType = 'increase' | 'decrease' | 'replace'`;
  `WalletTransaction = { id, accountId, type, amount, date, note? }` — `accountId`
  points to the related `WalletAccount.id`, `date` an ISO `YYYY-MM-DD`, `note`
  optional. The type vocabulary deliberately mirrors the investment side's
  `buy`/`sell`/`replace` 3-way shape (increase/decrease/replace) even though the
  UI that will consume it is a later task.
- **Storage** (`src/walletTransactionStorage.ts`): `loadWalletTransactions()`/
  `saveWalletTransactions()` under key `oracle_wallet_transactions_v1` — verified
  against every existing key (`oracle_assets_v1`, `oracle_transactions_v1`,
  `oracle_wallet_accounts_v1`, `oracle_users_v1`, `oracle_session_v1`,
  `oracle_profile_v1`, `oracle_code_counters_v1`, `oracle_asset_registry_v1`,
  `oracle_market_watchlist_v1`, `oracle_portfolio_history_v1`,
  `oracle_asset_sort_mode_v1`, `oracle_balance_hidden_v1`) — no collision. Mirrors
  `src/transactionStorage.ts`'s exact conventions: try/catch-safe and
  **`[]`-on-missing-or-invalid** (unlike `walletStorage.ts`, which needs a
  `null` "never saved" signal for the §6af one-time "نقدی" seed, a transaction
  log has no such signal — an absent key simply means "no transactions recorded
  yet").
- **Service** (`src/services/walletTransactionService.ts` +
  `localWalletTransactionService.ts`): the same singleton-swap-one-line pattern as
  every other service (`export const walletTransactionService:
  WalletTransactionService = localWalletTransactionService`). Interface is
  deliberately minimal — `listTransactionsForAccount(accountId)`,
  `addTransaction(input: Omit<WalletTransaction, 'id'>)`,
  `deleteTransactionsForAccount(accountId)` — with **no** `updateTransaction` or
  single-transaction `deleteTransaction` (the investment-side history is also
  append/bulk-clear only from the UI; the investment interface keeps those
  methods, the wallet one simply never needed them).
- **Validation** (local `assertValidWalletTransaction`): `amount > 0` for
  `'increase'`/`'decrease'` (the wallet analogue of `localTransactionService`'s
  `quantity <= 0` rejection), `amount >= 0` for `'replace'` (replacing a balance
  with exactly zero is a valid event). `date`/`note` are not validated here
  (matching the investment service, which also only validates the numerics).
- **ID generation / the `crypto.randomUUID()` constraint**: `addTransaction`
  generates its id with `generateUuidV4()` from new shared util
  `src/uuid.ts` — a manual UUID v4 from `crypto.getRandomValues()`. The app is
  deployed over plain HTTP (non-secure context), where `crypto.randomUUID()` is
  `undefined` (the `[SecureContext]`-only API that already forced `js-sha256` for
  hashing and manual UUIDs for wallet-account/user IDs, see §6ad/§6g). The helper
  previously existed as two identical private copies (`localWalletService.ts`'s
  `generateWalletAccountId`, `localAuthService.ts`'s `generateUserId`); this task
  extracted it into `src/uuid.ts` and re-pointed `localWalletService.ts` at it.
  `localAuthService.ts` was **left untouched** (minimal-edit scope; its local copy
  still works and its comment already documents the reason). NOTE:
  `localTransactionService.ts` still calls `crypto.randomUUID()` directly — a
  pre-existing bug on this deployment, explicitly out of scope here; do NOT copy
  that pattern.
- **Account deletion is NOT yet wired up**: unlike the investment side (where
  `App.tsx` calls `transactionService.deleteTransactionsForAsset(id)` after
  deleting an asset), `WalletTab.tsx`'s delete handler still does NOT call
   `walletTransactionService.deleteTransactionsForAccount(id)`. Even after the
   history UI in §6ai, deleting a wallet account still leaves any of its
   transactions in storage; this is separate from the per-account **clear history**
   action, which clears history without deleting the account or changing balance.
- **Deliberately NOT changed**: `walletService.ts`, `WalletTab.tsx`, `App.tsx`,
  and every investment-side file (`transactionService`/`localTransactionService`/
  `transactionStorage`/`types/transaction.ts`). This task adds **no UI** — the
  app must look byte-for-byte identical to before.
- **Acceptance**: `npm run build` (typecheck + vite build) passes with no new TS
  errors. Verified with a throwaway esbuild-bundled Node script (shimmed
  `localStorage`, `crypto.randomUUID` forced to throw — simulating the
  non-secure deployment): add persists under `oracle_wallet_transactions_v1`;
  ids are valid v4 UUIDs despite `randomUUID` being unavailable;
  `listTransactionsForAccount` returns only that account's rows (unknown id →
  `[]`); `deleteTransactionsForAccount` clears only the target (other accounts'
  rows untouched; nonexistent id is a no-op); `increase`/`decrease` reject
  `amount <= 0`; `replace` accepts `0` but rejects negatives;
  `oracle_wallet_accounts_v1` and `oracle_transactions_v1` never touched. A
  second smoke test confirmed `localWalletService` still works after the
   `generateWalletAccountId` → shared `generateUuidV4` re-point. No permanent test
   files were added.

## 6ah. "ثبت تراکنش" action on wallet accounts (builds on §6ad/§6ag)

- **Context / intent**: the investment side records buy/sell/replace transactions
  from a per-row "+" button (`AssetRow` → `RecordTransactionModal`); this task adds
  the wallet equivalent — a per-account "+" button on the "کیف پول" tab that
  records an increase/decrease/replace against a cash/bank account. It is simpler
  than the investment modal: **no unit-price concept** (a cash/bank balance isn't
  priced like an asset), so the form is just a toman amount + type + date + note.
- **New `RecordWalletTransactionModal.tsx`**: closely mirrors `RecordTransactionModal`'s
  shell (backdrop / Escape / "×" / `stopPropagation`, identical card classes) and
  its 3-way active-color toggle (green add / red subtract / amber replace), with the
  wallet labels افزایش / کاهش / جایگذاری instead of خرید / فروش / جایگذاری. One
  toman amount field (`formatWithThousands`/`stripToNumberString`, like the rest of
  the app; the label reads "مبلغ جدید به تومان" while جایگذاری is selected, mirroring
  the investment modal's "مقدار جدید" label flip), a date field defaulting to
  `todayLocalIso()`, and an optional note. No unit-price, no `isSample` badge, no
  `prices`/last-price button.
- **Dual write on submit** (the core of this task): the modal validates the amount
  client-side (finite `> 0` for افزایش/کاهش, `>= 0` for جایگذاری; non-empty date),
  then, in one submit, (1) appends a `WalletTransaction` via
  `walletTransactionService.addTransaction({ accountId, type, amount, date, note })`
  and (2) updates the account's stored balance via
  `walletService.updateAccount(account.id, { balance: newBalance })`, where
  `newBalance` = increase `account.balance + amount`, decrease
  `Math.max(0, account.balance - amount)` (floored at 0 — matching how the
  investment sell floors quantity at 0), or replace `amount` (set directly). On
  success it shows `toast.success('تراکنش ثبت شد')` (the same phrasing
  `RecordTransactionModal` uses) and calls `onTransactionRecorded(next)` with the
  service's returned full account list, then closes; on failure it shows an error
  toast and stays open (the app's error-toast convention). The transaction write
  happens BEFORE the balance write — the log is the source of truth for what
  occurred; the balance is the derived current state.
- **`WalletTab.tsx` wiring**: each account row's action group gained a `PlusIcon`
  ghost `IconButton` (`ariaLabel="ثبت تراکنش"`, `tone="neutral" variant="ghost"`) as
  the first of the three row buttons (before edit/delete — mirroring `AssetRow`'s
  record-transaction placement). It sets a new local `recordFor` state
  (`WalletAccount | null`); when set, the modal renders and its
  `onTransactionRecorded` is wired to the existing `onAccountsChanged` prop, so the
  row's displayed balance updates immediately (no reload) and `App.tsx`'s
  `walletAccounts` — and therefore the "ارزش کل دارایی" grand total, which is
  derived from it (`walletTotal` in `App.tsx`) — reflects the new balance
  automatically. `SummaryCard` and the grand-total calculation were NOT touched.
- **Deliberately NOT changed in this task**: the investment tab, the market tab,
  `SummaryCard`, and the `App.tsx` total calculation. At this point in the sequence,
  the data was written and retrievable via
  `walletTransactionService.listTransactionsForAccount(accountId)` but not yet
  displayed; §6ai adds the later wallet history UI.
- **Acceptance**: `npm run build` (typecheck + vite build) passes with no new TS
  errors. Each wallet row has a "ثبت تراکنش" icon in addition to edit/delete.
  افزایش of X raises the displayed balance by exactly X; کاهش lowers it, never
  below 0; جایگذاری sets it to exactly the entered amount (including 0). The
  recorded transaction is retrievable via `listTransactionsForAccount` afterward.
  Verified with a throwaway esbuild+Node script that replicates the modal's exact
  submit logic against the real bundled services (shimmed `localStorage`,
  `crypto.randomUUID` forced to throw): all balance-math cases, client-side
  validation rejections, per-account transaction retrieval, persistence under the
  correct keys (investment key untouched), and the grand-total derivation were
  confirmed. No permanent test files added.

## 6ai. Wallet transaction history modal + per-account clear history

- **Context / intent**: this builds on the wallet transaction service (§6ag) and the
  wallet "ثبت تراکنش" row action (§6ah). The investment side already has a
  read-only `TransactionHistoryModal`; the wallet side now has the analogous
  per-account history view, plus one wallet-only capability: clearing **one
  account's** transaction log without touching the account or its balance.
- **New `WalletTransactionHistoryModal.tsx`**: mirrors `TransactionHistoryModal`'s
  shell and list mechanics (backdrop click / "×" / Escape close,
  `stopPropagation` on the card, same `max-w-[440px]` card tokens,
  newest-first sorting by `date` with stable insertion fallback, 6 rows per page,
  and the same قبلی/بعدی pagination footer). It does not take transaction data
  from `WalletTab`; on open it calls
  `walletTransactionService.listTransactionsForAccount(account.id)`, matching the
  investment modal's independent-load pattern. Empty state copy is
  "هنوز تراکنشی برای این حساب ثبت نشده است.".
- **Row display**: wallet history rows are simplified for `WalletTransaction` — no
  quantity/unit-price split. Each row shows the type badge (`افزایش` green
  `#1f9d55`/`#d7f5e0`, `کاهش` red `#d95050`/`#fde3e3`, `جایگذاری` amber
  `#d7a144`/`#fff5df`, reusing the exact buy/sell/replace tones from the
  investment history modal), `formatDate(transaction.date)`, formatted
  `transaction.amount` + "تومان", and the optional note.
- **Per-account clear history**: the modal includes a danger-styled
  "پاک کردن کل تاریخچه" button. Clicking it uses the app's existing bulk
  destructive confirmation convention from `App.tsx`'s clear-all handler — a
  `sonner` `toast('کل تاریخچه‌ی این حساب پاک شود؟', { action, cancel })`, not a
  separate confirmation modal. Confirming calls
  `walletTransactionService.deleteTransactionsForAccount(account.id)`, then reloads
  the modal's own list (so the empty state appears immediately) and shows a
  success toast. It deliberately does **not** call `walletService`, does **not**
  change `account.balance`, does **not** delete the account, does **not** close
  the modal, and does **not** touch other accounts' transaction logs. This is
  different from the investment side, which only has the app-level all-assets
  clear path and no per-asset clear-history button.
- **`WalletTab.tsx` wiring**: each account row's action group now has a
  `HistoryIcon` ghost `IconButton` (`ariaLabel="تاریخچه"`, `tone="neutral"`,
  `variant="ghost"`) alongside the existing ثبت تراکنش/edit/delete buttons. It
  sets local `historyFor: WalletAccount | null` state and renders
  `WalletTransactionHistoryModal` for that account. `App.tsx`, `SummaryCard`, the
  investment tab, and the market tab were not touched.
- **Acceptance**: `npm run build` passes with no new TypeScript errors. The clear
  action is account-scoped through `deleteTransactionsForAccount(account.id)`, so
  reopening the same account's history shows the empty state while other accounts'
  histories, the current `balance`, and the grand total derived from
  `walletAccounts` remain unchanged.

## 6aj. Seeded "نقدی" account row: non-editable (no edit button) + centered row alignment

> **Partially superseded by §6ak**: the delete button is now hidden on the
> "نقدی" row too (fully locked), the per-row alignment ternary was removed in
> favor of a plain `items-center` for every row, and the row's detail block
> now shows only the bank name. Everything below still describes what §6aj
> itself shipped.

- **Context / intent**: the one-time default "نقدی" account seeded by `App.tsx`
  (§6af) has no `bankName`/`cardNumber`/`accountNumber`/`shebaNumber`, so its row
  only ever renders the `<h3>` name — no muted bank-detail lines below it. On a
  top-aligned (`items-start`) row, that left the "نقدی" text sitting high next to
  the internally-centered 46px round icon. Owner-requested fix: treat that one
  seeded row as a special, non-editable row — no pencil/edit button on it (تاریخچه,
  ثبت تراکنش and حذف all stay) — and vertically center the row so the name lines
  up with the middle of the icon.
- **Identification**: by the exact seeded name, `account.name === 'نقدی'`. This is
  deliberately a name match, not the account's `id` (the seeded id is a random
  UUID, not knowable at render time in `WalletTab`), and a user-created account
  literally named "نقدی" gets the same treatment — that is intended behavior.
- **`WalletTab.tsx` (only file changed)**: in the `accounts.map(account => ...)`
  row render, (1) the `PencilIcon` "ویرایش" `IconButton` is now wrapped in
  `{account.name !== 'نقدی' && ...}` so it does not render for the seeded row —
  the other three buttons (`HistoryIcon`/`PlusIcon`/`TrashIcon`) render exactly as
  before with their handlers untouched; (2) the `<li>`'s className switched from a
  static string to a template literal whose only conditional is
  `${account.name === 'نقدی' ? 'items-center' : 'items-start'}` — no other class,
  spacing, padding, or gap on the row changed, and every other account row keeps
  `items-start` exactly as before.
- **Not touched** (as of §6aj): no handler logic, `WalletAccountModal`,
  `walletService.ts`, `App.tsx`, or any other file — the edit modal still exists
  and works for every other account, and the seeded "نقدی" row can still be
  deleted or transacted on exactly as before. (The delete part changed in §6ak:
  the seeded "نقدی" row is no longer deletable from the UI.)

## 6ak. "نقدی" row fully locked + rows show name/bank-name only + uniform `items-center`

> **Partially superseded by §6am**: the "fully locked / no delete" part is
> gone — the danger `TrashIcon` button is no longer a delete at all (it now
> *resets* balance + history, behind a toast-confirm), and its
> `{account.name !== 'نقدی' && ...}` wrapper was dropped, so it renders on the
> "نقدی" row too. "نقدی" is now locked only for *editing* (no pencil button);
> it can still be transacted on and zeroed/reset. The row-display and
> `items-center` parts of §6ak are unchanged. Everything below still describes
> what §6ak itself shipped.

- **Context / intent**: owner-requested follow-up to §6aj. (1) The seeded
  "نقدی" account should be **fully** locked — non-deletable as well as
  non-editable. (2) For every other account, the row should stop showing
  card number / account number / sheba number — only the account name and,
  under it, the bank name (if set). (3) Since every row's content is now at
  most 2 lines for **every** account, the whole list should align the same way
  "نقدی" already did (vertically centered).
- **`WalletTab.tsx` (only file changed)**, all inside the
  `accounts.map(account => <li>...)` row render:
  1. **Delete button**: the danger `TrashIcon` "حذف" `IconButton` is now
     wrapped in `{account.name !== 'نقدی' && ...}` (the same pattern §6aj used
     for the edit button), so the "نقدی" row shows exactly **two** action icons
     — تاریخچه and ثبت تراکنش — with no ویرایش and no حذف, and no UI path
     left to edit or delete it. Every other account keeps all **four** icons
     exactly as before; `handleDelete` is untouched and still works for every
     other row.
  2. **Detail-lines block**: the condition changed from
     `(account.bankName || account.cardNumber || account.accountNumber ||
     account.shebaNumber)` to `account.bankName` alone, and the block now
     renders only the single bank-name `<p>` (same `m-0 text-[11px]
     text-[#9096aa]` styling as before). The three number-field `<p>` lines
     were dropped from the row display entirely. **Deliberately NOT removed**:
     the four fields on the `WalletAccount` type (§4/§6af), the four inputs in
     `WalletAccountModal`, the `handleAccountSubmit` pass-through, and
     `walletService` — the numbers are still collected, stored, and pre-filled
     when re-opening the edit form; they just no longer appear in the list.
  3. **Row alignment**: the `<li>`'s className reverted from the §6aj template
     literal (`${account.name === 'نقدی' ? 'items-center' : 'items-start'}`)
     to a plain static string with `items-center` for **every** row — no other
     class, spacing, padding, or gap changed.
- **Not touched**: `WalletAccountModal`, `walletService.ts`,
  `localWalletService.ts`, `walletStorage.ts`, `App.tsx`, `SummaryCard`, the
  grand-total calculation, the investment/market tabs, and every handler
  (`handleAccountSubmit`/`handleDelete`/history/record-transaction) — only the
  row's display changed.
- **Acceptance**: `npm run build` (typecheck + vite build) passes with no new
  TypeScript errors. "نقدی" row: exactly 2 icons, no edit/delete; other rows:
  all 4 icons and at most 2 text lines (name + bank name when set, numbers no
  longer visible). All rows vertically centered the same way. Editing an
  account still saves card/account/sheba numbers and re-opening its edit form
  still shows the previously-saved values.

## 6al. "نقدی" seed becomes self-healing + wallet rows sorted by balance descending (display only)

- **Context / intent**: two owner-requested changes, one per file. (1) Since
  §6aj/§6ak the "نقدی" row is fully locked in the UI — no edit, no delete —
  but some users deleted it *before* it was locked down: their `localStorage`
  holds a real, non-null `oracle_wallet_accounts_v1` array with no "نقدی"
  entry, so §6af's `stored === null`-only seed check could never re-add it.
  The seed must now be **self-healing**: re-create "نقدی" whenever it is
  missing, regardless of source. (2) The wallet account list renders in stored
  order; it should instead display by `balance`, highest first.
- **`App.tsx` (only file changed for 1)** — the mount-time wallet-seeding
  effect's inner condition only; the `walletSeededRef`
  (`useRef(false)`, set true on the effect's first run) StrictMode-dedup guard
  stays exactly as §6af shipped it. The `.then(stored => ...)` callback now
  does `const current = stored ?? [];` (a `null` "never saved" source becomes
  an empty list), then
  `const hasDefaultCashAccount = current.some(account =>
  account.name === 'نقدی')` — the same exact-name match §6aj/§6ak use to
  identify the locked row. When false it calls
  `walletService.addAccount({ name: 'نقدی', balance: 0 })` and sets THAT
  call's returned list as state (a real mutation — it persists the seeded
  list, so the very next load finds the account present and never re-adds
  it); when true it sets `current` as-is. The effect's comment was rewritten
  to document the self-healing behavior and the pre-lock-deletion reason.
  Net behavior: a fresh browser still gets exactly one "نقدی" (balance 0),
  no duplicates under StrictMode's double-invoke (the ref, unchanged,
  prevents the second run from ever reaching the check); a browser whose
  stored array lacks "نقدی" (deleted pre-lock) gets it back automatically on
  the next load; a browser that already has "نقدی" (any balance) is
  untouched — no second "نقدی" is ever created.
- **`WalletTab.tsx` (only file changed for 2)** — immediately after the
  `accounts === null` early return (so `accounts` is non-null there), a
  display-only sorted copy is computed: `const sortedAccounts =
  [...accounts].sort((a, b) => b.balance - a.balance);` — a copy, never
  mutating the `accounts` prop. Both rendered-list consumers switch from
  `accounts` to `sortedAccounts`: the empty-state check
  (`sortedAccounts.length === 0`) and the row list's `.map(...)`. **Every
  other use of `accounts` is untouched** — the prop itself, the `null`
  loading guard, and (importantly) nothing else: the modals are driven by
  their own `modal`/`recordFor`/`historyFor` state (selected by `account.id`/
  reference from the rows), `onAccountsChanged` pushes service-returned full
  lists (stored order) up to `App.tsx`, and `walletService` reads/writes the
  stored array verbatim — so sorting is purely a render-order concern:
  `App.tsx`'s `walletTotal` reduce, the add/edit/delete/record-transaction
  handlers, and what `localStorage` persists are all order-independent and
  unchanged. Because the sort runs on every render from the current `accounts`
  prop, any balance change (add, edit, or a recorded
  افزایش/کاهش/جایگذاری transaction) re-sorts the visible list immediately,
  no reload.
- **Not touched**: `walletService.ts`, `localWalletService.ts`,
  `walletTransactionService.ts`, `walletStorage.ts`, `WalletAccountModal`,
  `SummaryCard`, the grand-total calculation, the investment/market tabs, and
  every handler — only the seed's inner condition (App.tsx) and the
  rendered-list source (WalletTab.tsx) changed.
- **Acceptance**: `npm run build` (typecheck + vite build) passes with no new
  TypeScript errors. Stored array without any "نقدی" (simulating a
  pre-lock deletion) → reload adds "نقدی" (balance 0) back automatically; a
  second reload finds it present and creates no duplicate. Completely fresh
  browser → exactly one "نقدی" (0 تومان), no duplicates even under
  StrictMode's double-invoke (dev). The wallet list displays by balance,
  highest to lowest; adding an account, editing a balance, or recording a
  transaction that changes a balance re-sorts the visible list immediately,
   without a page reload, and `localStorage` keeps its own (unsorted) stored
   order.

 ## 6am. Wallet row trash icon now resets balance + history (with confirmation), shown on "نقدی" too

 - **Context / intent**: the "کیف پول" row's danger `TrashIcon` used to call
   `handleDelete` → `walletService.deleteAccount(id)` — a real, immediate,
   **unconfirmed** removal of the whole account (the lighter-weight
   no-confirmation convention §6r chose for the market watchlist, shipped in
   §6ad), and was hidden on the seeded "نقدی" row (§6aj/§6ak) precisely because
   it deleted that account. Owner-requested change: the button should no longer
   remove the account at all — it should **reset** it (zero the `balance` and
   wipe the account's entire transaction history) while leaving the account's
   identity (`name`, `bankName`, `cardNumber`, `accountNumber`, `shebaNumber`)
   intact. Because that permanently destroys balance + history with no undo, it
   must confirm first, using the app's established destructive-action pattern —
   a `sonner` toast with `action`/`cancel` (the same shape as `handleClearAllClick`
   in `App.tsx` and "پاک کردن کل تاریخچه" in
   `WalletTransactionHistoryModal.tsx`) — **not** a separate confirmation modal.
   And since the button no longer deletes the account, the "نقدی" row now shows
   it too (the reason for hiding it there no longer applies).
 - **`WalletTab.tsx` (only code file changed)**:
   1. **New import**: `walletTransactionService` (from
      `../services/walletTransactionService`) added alongside the existing
      `walletService` import — needed for the history wipe.
   2. **`handleDelete` replaced by `handleResetAccount(account: WalletAccount)`**
      (the old function is gone — `WalletTab.tsx` no longer calls
      `walletService.deleteAccount` anywhere): it shows the toast-confirm
      `toast('موجودی و کل تاریخچه‌ی این حساب پاک شود؟', { action: { label:
      'بله، پاک کن', onClick: reset }, cancel: { label: 'انصراف', onClick: ()
      => {} } })` — cancel is a no-op, leaving everything untouched. `reset`
      is `async` and, in a `try`, (a) awaits
      `walletTransactionService.deleteTransactionsForAccount(account.id)` (the
      existing bulk-clear that wipes that account's log without touching its
      balance), then (b) `const next = await walletService.updateAccount(account.id,
      { balance: 0 })` (updates **only** `balance` — the spread in
      `localWalletService.updateAccount` leaves `name`/bank fields
      untouched), then (c) `onAccountsChanged(next)` (the returned full list
      keeps `App.tsx` canonical, so the row's displayed balance drops to 0 and
      the grand total updates immediately, no reload), then `toast.success('موجودی
      و تاریخچه پاک شد')`; any thrown error → `toast.error('پاک کردن موجودی و
      تاریخچه انجام نشد')` — matching this file's existing try/catch + toast
      conventions (`handleAccountSubmit` and the history modal's
      `clearHistory`).
   3. **Row button**: the trash `IconButton` now calls
      `handleResetAccount(account)` and its `ariaLabel` changed from `"حذف"` to
      `"صفر کردن موجودی و تاریخچه"`; the `{account.name !== 'نقدی' && ...}`
      guard wrapping it was **dropped**, so it renders on every account row
      including "نقدی". The `PencilIcon` "ویرایش" button keeps its own
      `{account.name !== 'نقدی' && ...}` guard (that part of the "نقدی" lock is
      unchanged) — so the "نقدی" row now shows three action icons: تاریخچه, ثبت
      تراکنش, and the reset button; every other account keeps all four.
   4. The component's top-of-file comment was updated (it still said
      "delete immediately per row, no confirmation").
 - **Not touched**: `walletService.ts` (including its `deleteAccount` method —
   intentionally kept, a later task reuses it for real account deletion in a
   separate "manage accounts" view), `walletTransactionService.ts`,
   `localWalletService.ts`, `localWalletTransactionService.ts`,
   `walletStorage.ts`, `WalletAccountModal`, `WalletTransactionHistoryModal`,
   `RecordWalletTransactionModal`, `App.tsx`, `SummaryCard`, the grand-total
   calculation, and every other tab. The display-only balance-descending sort
   (§6al) and the "نقدی" self-healing seed (§6al/§6af) are unchanged.
 - **Acceptance**: `npm run build` (typecheck + vite build) passes with no new
   TypeScript errors. Clicking the trash icon on **any** row (including
   "نقدی") shows the confirmation toast before anything happens; canceling
   leaves balance + history + account list untouched. Confirming zeroes that
    account's balance (visible immediately), empties its transaction history
    (its "تاریخچه" modal shows the empty state), and leaves the account itself —
    name and bank details — present and unchanged; the row is **never** removed
     from the list by this button, for any account including "نقدی". `npm run
      build` (typecheck + vite build) passes. (**Was superseded by §6ap for the
     "نقدی" half:** "نقدی" then stopped rendering a main-list row at any balance,
     so this reset button rendered only on non-"نقدی" rows, leaving no UI path to
     reset "نقدی"'s balance. **Reinstated by §6au:** "نقدی" renders a main-list
     row at every balance again, so this reset button — like the history and
     record-transaction icons — renders on the "نقدی" row too, restoring the UI
     path to change/reset its balance; it stays excluded from "مدیریت حساب‌ها",
     where it was always locked (no edit/delete) anyway.)

 ## 6an. "مدیریت حساب‌ها" manage-accounts modal owns real add/edit/delete; per-row edit removed

 - **Context / intent**: the "کیف پول" tab's header "+" button used to open the
   add form (`WalletAccountModal`, add mode) directly, and each row had a per-row
   `PencilIcon` "ویرایش" button (edit mode) — real account creation/editing/
   deletion was scattered between the two, and the row's trash button had just
   become a *reset* (§6am), so there was **no** place left to actually delete an
   account. Owner-requested change: move real account creation/editing/deletion
   into a single dedicated **"مدیریت حساب‌ها" (manage accounts) view**, reached
   from that "+" button, which lists **every** account (no balance filter — a
   later task will filter the *main* row list down to non-zero balances) and
   offers edit + real-delete per account, plus adding a brand-new account from
   inside it. The seeded "نقدی" account stays **fully locked** there too (no
   edit, no delete).
 - **`WalletTab.tsx`**:
   1. `WalletAccountModal` (defined in this file) is now **exported** (nothing
      else about it changed) so `ManageWalletAccountsModal` can import it.
   2. The header row's `PlusIcon` `IconButton` now opens the manage view:
      `onClick={() => setIsManageOpen(true)}` with `ariaLabel` changed from
      `"افزودن حساب"` to `"مدیریت حساب‌ها"`.
   3. The local `modal` state, the `handleAccountSubmit` function, and the
      `{modal && <WalletAccountModal .../>}` render were **removed** (all moved
      to `ManageWalletAccountsModal`); a new `const [isManageOpen,
      setIsManageOpen] = useState(false)` was added, and
      `{isManageOpen && <ManageWalletAccountsModal accounts={accounts}
      onAccountsChanged={onAccountsChanged} onClose={() =>
      setIsManageOpen(false)}/>` is rendered — passing the **full, unfiltered**
      `accounts` array (not the display-sorted `sortedAccounts`), so the manage
      view shows every account including zero-balance ones.
   4. The per-row `PencilIcon` "ویرایش" `IconButton` (with its
      `{account.name !== 'نقدی' && ...}` guard) was **removed** — per the owner's
      call this task, editing now happens only inside the manage view, so each
      main row shows exactly three action buttons (تاریخچه / ثبت تراکنش / صفر
      کردن) for every account including "نقدی". (`PencilIcon` was dropped from
      the `./icons` import as it became unused.)
 - **New `src/components/ManageWalletAccountsModal.tsx`** (see §4 file-map for
   the full row): same modal shell as the others, header "مدیریت حساب‌ها" + an
   "افزودن حساب" `PlusIcon` button, a list of **all** `accounts` (no balance
   filter) with simplified rows (icon badge, `name` + optional `bankName`,
   muted balance), a `PencilIcon` edit + danger `TrashIcon` delete per row
   (both hidden for "نقدی"), the moved `handleAccountSubmit` (edit/add →
   `walletService` + `onAccountsChanged` + toast + return bool to
   `WalletAccountModal`) and `handleDelete` (real immediate
   `walletService.deleteAccount` + `onAccountsChanged` + toast, no
   confirmation), a defensive empty state, and the add/edit form rendered as a
   **sibling** (via a fragment, not DOM-nested in this backdrop — so the form's
   backdrop click doesn't bubble to close this modal; both are `z-50` and the
   form stacks above). Its `Escape` handler is guarded by `modal === null` so
   Escape dismisses the topmost form first, not both.
 - **Not touched**: `walletService.ts` (its `deleteAccount` is now actually used
   again — here), `walletTransactionService.ts`, `WalletTransactionHistoryModal`,
   `RecordWalletTransactionModal`, `App.tsx`, `SummaryCard`, the grand-total
   calculation, and every other tab. The main list's three row icons
   (تاریخچه/ثبت تراکنش/صفر کردن, from §6ah/§6ai/§6am) and the display-only
   balance-descending sort (§6al) are unchanged; the "نقدی" self-healing seed
   (§6al/§6af) is unchanged.
 - **Acceptance**: `npm run build` (typecheck + vite build) passes with no new
   TypeScript errors. The "کیف پول" tab's "+" button opens "مدیریت حساب‌ها"
   (not an add form). Inside it, every account is listed regardless of balance
   (including zero-balance ones); "نقدی" shows with no edit/delete icons; every
    other account has working edit and delete icons. Adding a new account from
    inside works and it appears in the main list only if it has a positive balance
    (a zero-balance new account stays hidden there until it gets one — see §6ao);
    deleting a non-"نقدی" account removes it immediately (no
   confirmation) and it also disappears from the main list; editing saves and is
    reflected on the main list. The main row's تاریخچه/ثبت تراکنش/صفر کردن icons
    are unaffected.

  ## 6ao. Main "کیف پول" list hides zero-balance accounts (except "نقدی") — display only

  - **Status**: the "نقدی" half of this section was superseded by §6ap and is
    now **reinstated by §6au** — "نقدی" is shown in the main list at any balance
    again, exactly as this section originally specified. The zero-balance-filter
    half (non-"نقدی" accounts with 0 balance are hidden) still holds.

  - **Context / intent**: now that "مدیریت حساب‌ها" (§6an) is the home of every
    account — including zero-balance ones — the owner wants the *main* "کیف پول"
    list to stop cluttering itself with accounts that hold nothing. Rule: the main
    list shows only accounts with a **positive** balance, **plus** the seeded
    "نقدی" account, which **always** shows regardless of its balance (including
    exactly 0). This is a **display-only** change: it touches only which rows the
    main list renders, not what is stored, and "مدیریت حساب‌ها" keeps receiving
    the full, unfiltered `accounts` array (it merely renders it without "نقدی"
    now — see §6au).
  - **`WalletTab.tsx` only** (no other file changes):
    1. Right before the list-rendering block (after the `null` guard, ahead of the
       §6al display sort) a new derived array is computed:
       `const visibleAccounts = accounts.filter(account => account.balance > 0 || account.name === 'نقدی');`
       — same exact-name-match convention as the rest of the "نقدی" handling
       (§6aj/§6ak/§6am), not an id match.
    2. The §6al display sort now derives from the filtered array instead of the
       raw prop: `const sortedAccounts = [...visibleAccounts].sort((a, b) => b.balance - a.balance);`
       — the balance-descending order is preserved, and both the `.length === 0`
       empty-state check and the row `.map` still use `sortedAccounts` exactly as
       before. The `accounts` prop itself is never mutated (filter + spread-copy
       only), and `onAccountsChanged` / storage order are untouched.
    3. `ManageWalletAccountsModal` is **deliberately** still rendered with the
       full, unfiltered `accounts` prop (not `visibleAccounts`/`sortedAccounts`)
       — so a hidden zero-balance account can still be seen, edited, or deleted
       there. `WalletAccountModal`, the history/record-transaction modals, and
       `handleResetAccount` are all unchanged.
   - **Resulting behavior**: resetting a non-"نقدی" account to 0 via the reset
     (§6am) trash button removes it from the main list immediately (no reload), and
     editing its balance from 0 back to a positive number in "مدیریت حساب‌ها"
     brings it straight back. (**Was superseded by §6ap for the "نقدی" half, now
     reinstated by §6au:** "نقدی" is in the main list at every balance again, so
     the "هنوز حسابی ثبت نشده" empty state is effectively unreachable — the
     self-healing seed guarantees at least one always-shown row.)
  - **Not touched**: `ManageWalletAccountsModal.tsx`, `walletService.ts`,
    `walletTransactionService.ts`, `App.tsx`, the grand-total calculation
    (§6ae — it still sums every account's balance regardless of this display
    filter, so a zero-balance account contributes 0 either way and the total is
    unaffected), `SummaryCard`, and every other tab.
   - **Acceptance**: `npm run build` (typecheck + vite build) passes with no new
     TypeScript errors. A zero-balance account (other than "نقدی") is absent from
     the main list but present in "مدیریت حساب‌ها" (editable/deletable); "نقدی"
     is always present in the main list regardless of balance; reset-to-0 and
     edit-0→positive both update the main list live without a reload; the
     empty-state message only appears when nothing is displayable.
     (**Was superseded by §6ap for the "نقدی" half — "نقدی" then no longer
     appeared in the main list at any balance — now reinstated by §6au:** "نقدی"
     is in the main list at every balance again, as this section originally
     specified; it is now absent from "مدیریت حساب‌ها" instead.)

  ## 6ap. Main "کیف پول" list unconditionally excludes "نقدی" — display only — **SUPERSEDED by §6au**

  - **Status**: **superseded by §6au** — the owner reversed this decision: "نقدی"
    must always appear in the *main* "کیف پول" list (at any balance, including 0),
    and is now excluded from "مدیریت حساب‌ها" instead. §6au reverts the "نقدی"
    half of §6ap back to the §6ao behavior. Kept below for historical context.

  - **Context / intent (historical)**: follow-up to §6ao. The owner no longer wants the seeded
    "نقدی" account in the *main* "کیف پول" list at all — not even when its
    balance is positive. Rule: the main list shows only **non-"نقدی"** accounts
    with a **positive** balance; "نقدی" is **never** rendered there, at any
    balance. "نقدی" itself is untouched: it still exists in storage, is still
    self-healing on load (§6al/§6af), and is still listed normally in "مدیریت
    حساب‌ها" (§6an) — still locked there (no edit/delete icons). This is a
    **display-only** change: it touches only which rows the main list renders,
    not what is stored or what "مدیریت حساب‌ها" shows. **Side effect (accepted):**
    the row-level reset button ("صفر کردن موجودی و تاریخچه", §6am) existed only
    on main-list rows — with "نقدی" excluded from the main list and locked in the
    manage modal, there is now **no UI path to change or reset "نقدی"'s balance**;
    it simply keeps counting (at its stored value) toward the grand total.
  - **`WalletTab.tsx` only** (no other file changes): the §6ao filter condition
    flipped from `account.balance > 0 || account.name === 'نقدی'` to
    `account.balance > 0 && account.name !== 'نقدی'` (same exact-name match
    convention as §6aj/§6ak/§6am/§6ao), and the comment above it was updated to
    describe the new rule. The §6al display sort still derives from
    `visibleAccounts`, and both the `.length === 0` empty-state check and the row
    `.map` still use the derived `sortedAccounts`.
  - **Consequences**: "نقدی"'s balance no longer affects the main list at all
    (it neither appears at 0 nor at any positive value — it now contributes only
    to the grand total, which `App.tsx` derives from the full `walletAccounts`).
    A newly added account with a 0 balance stays hidden from the main list until
    it gets a positive balance (as in §6ao, now independent of "نقدی"); a
    reset-to-0 (§6am) still drops a non-"نقدی" account from the main list
    immediately (no reload); editing its balance 0→positive in "مدیریت حساب‌ها"
    still brings it straight back. The "هنوز حسابی ثبت نشده" empty state now
    shows whenever there is no **positive-balance, non-"نقدی"** account to
    display — a normal, expected state right after a fresh start (the self-healing
    seed guarantees only "نقدی", which is excluded here), not an error.
  - **Not touched**: `ManageWalletAccountsModal.tsx` (still receives and shows the
    full, unfiltered `accounts` array, "نقدی" included), `walletService.ts`,
    `walletTransactionService.ts`, `App.tsx`, the grand-total calculation (§6ae —
    still sums every account's balance regardless of this display filter),
    `SummaryCard`, and every other tab.
  - **Acceptance**: `npm run build` (typecheck + vite build) passes with no new
    TypeScript errors. "نقدی" never appears in the main "کیف پول" list at any
    balance; "نقدی" still appears normally in "مدیریت حساب‌ها" (locked — no
    edit/delete icons); every other positive-balance account still appears in the
    main list exactly as before; zero-balance non-"نقدی" accounts stay hidden from
    the main list as before; no other changes.

  ## 6aq. Card-PIN reminder fields (`cardPin1`/`cardPin2`) + green/red per-field status lines

  - **Status**: the PIN-field and add/edit-form parts of this section are
    current; the green/red status-line **wording** it introduced ("ثبت
    شده"/"ثبت نشده") is **superseded by §6av** — each line now shows the
    field's actual value (green) or a red "—" placeholder (empty), never the
    words "ثبت شده"/"ثبت نشده". Kept below for historical context.
  - **Context / intent**: the owner wants to save their card's first and second
    PIN/password (رمز اول و رمز دوم) on an account as a plain-text personal
    reminder. This is the owner's own single-user personal-finance app (all data
    is `localStorage`-only, never shared), so plain text uses the same trust model
    as the `cardNumber`/`accountNumber`/`shebaNumber` fields already stored here.
    Along with that, the owner wanted each account row in "مدیریت حساب‌ها" to make
    it obvious at a glance which of the six detail fields are filled in, via a
    green/red status line per field.
  - **`walletService.ts`**: the `WalletAccount` interface gained two optional
    fields, `cardPin1?: string` and `cardPin2?: string` (after `shebaNumber?`).
    No `WalletService` signature changes were needed — `addAccount`/`updateAccount`
    already take `Omit<WalletAccount, 'id'>` / `Partial<Omit<WalletAccount, 'id'>>`
    objects, so the new fields flow through unchanged. `localWalletService` and
    `walletStorage` are untouched (they store the whole object; the existing
    accounts simply lack the keys until they're first saved, which is fine —
    backward compatible).
  - **`WalletTab.tsx` (`WalletAccountModal`)**: two new `formCardPin1`/`formCardPin2`
    states (initialized from `account?.cardPin1`/`account?.cardPin2` like the other
    optional fields), and two new plain-text inputs labeled **"رمز اول"** and
    **"رمز دوم"** (same `text-[11px] text-[#7a8097] grid gap-1` label + input
    classes as the bank fields), placed **right after the "شماره شبا" field and
    before "موجودی به تومان"**. `onSubmit`'s type and the call in `handleSubmit`
    were extended to pass `cardPin1`/`cardPin2` through with the same
    `trim() || undefined` handling as the other optional fields (blank → `undefined`,
    so a cleared field genuinely clears on save — `updateAccount`'s spread
    overwrites with `undefined`, which `JSON.stringify` drops, same as §6af).
  - **`ManageWalletAccountsModal.tsx`**: (1) `handleAccountSubmit`'s signature and
    the `changes` object it builds now accept and pass `cardPin1`/`cardPin2` the
    same way it already does for `shebaNumber`. (2) Each account row now renders
    a two-column grid of **six green/red status lines** — one per detail field, in
    the order **بانک / کارت / حساب / شبا / رمز اول / رمز دوم** (built by a small
    `statusLine(label, value)` helper added next to `accountIconBase`). Each line
    shows the field label on the right and, on the left, a green
    `text-[#1f9d55]` **"ثبت شده"** when that field is set (non-blank after trim)
    or a red `text-[#d95050]` **"ثبت نشده"** when empty — the same green/red
    status colors the app already uses for positive/negative amounts. The status
    block sits under the account `name` (and the existing muted `bankName` line).
  - **Not shown in the main list**: the main "کیف پول" tab list is unchanged — it
    still renders only the account `name`, the (optional) `bankName`, the balance,
    and the three row icons. The new PIN fields (and the other bank fields) are
    **never** displayed there, only collected in the add/edit form and surfaced as
    these status lines in "مدیریت حساب‌ها".
  - **Not touched**: `walletTransactionService.ts`, `localWalletService.ts`,
    `walletStorage.ts`, `App.tsx`, the main "کیف پول" list display, `SummaryCard`,
    the grand-total calculation, and every other tab.
  - **Note on a presumed dependency**: this task was framed as building on a
    "previous task" that added a green/red status-line block to
    `ManageWalletAccountsModal.tsx` (the four بانک/کارت/حساب/شبا lines). No such
    task/commit exists in the history of `main` or any branch/PR — so this task
    implements the **full six-line** block (the four bank-detail lines plus the two
    new PIN lines) to reach the stated end state of six status lines per account.
  - **Acceptance**: `npm run build` (typecheck + vite build) passes with no new
    TypeScript errors. The add/edit form has "رمز اول" and "رمز دوم" fields
    (blank is fine; filled-in values save and reload correctly when re-opening
    that account's edit form). "مدیریت حساب‌ها" shows six status lines per account
    (بانک/کارت/حساب/شبا/رمز اول/رمز دوم), each green "ثبت شده" or red
    "ثبت نشده" per the same rule — **superseded by §6av** for the line
    wording (actual value in green / red "—" when empty, see §6av). The main
    "کیف پول" list is unchanged (name, bank name, balance, 3 icons only).

  ## 6ar. "مدیریت حساب‌ها" header: "+" and "×" together on one line, flush left

  - **Context / intent**: the "مدیریت حساب‌ها" modal header (see §6an) had its
    "×" close button `absolute`-positioned at `top-4 left-4` while the "افزودن
    حساب" "+" `IconButton` lived in a separate `flex ... justify-between` row
    below it carrying `pr-1 pl-10` offset padding (there to keep the "+" clear of
    the absolutely-positioned "×"). Result: the "+" sat visibly lower and
    misaligned relative to the "×" instead of both sharing the title's line,
    flush to the left edge, at the same horizontal margins as the account rows
    below. Owner-requested layout fix (this modal only).
  - **`ManageWalletAccountsModal.tsx` (only file changed)**: the two header
    elements were replaced by a **single** header row —
    `<div className="flex items-center justify-between gap-3 mb-4">` holding the
    `<h2>` title on the right and a `flex items-center gap-2` group on the left
    with the "+" `IconButton` then the "×" `button` (`CloseIcon`). The close
    button lost its `absolute top-4 left-4` positioning (it keeps the same
    `text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb]
    transition-colors` look) and the row lost the `pr-1 pl-10` offset padding, so
    no `absolute`/`top-4`/`left-4`/`pr-1`/`pl-10` remains on or around these two
    buttons. The header row now sits flush to the section's own `p-5` (mobile
    `p-4`) padding, exactly like the account-row list below it.
  - **Unchanged behavior**: the "+" still calls `setModal({ account: null })`
    (opens `WalletAccountModal` in add mode), the "×" still calls `onClose`, and
    Escape still works via the `useEffect` keydown handler (guarded by
    `modal === null`). No other visual change to this modal. Note: this is a
    deliberate divergence from the app-wide absolute-"×" modal convention — the
    owner scoped the fix to this modal only (see §11).
  - **Not touched**: any other file; every other modal keeps its absolute "×".
  - **Acceptance**: `npm run build` (typecheck + vite build) passes with no new
    TypeScript errors. "+" and "×" sit next to each other on the same horizontal
    line as the "مدیریت حساب‌ها" title, both flush to the left edge, at the same
    left/right margins as the account rows below (no visual offset or overlap);
    both buttons behave exactly as before (add opens the add form, close closes
    the modal, Escape still works); no other visual change to this modal.
    **Superseded by §6as**: the owner asked for this to be undone — the close
    button is back to the app-wide absolute top-left-corner convention, and this
    single-line combined-buttons header is explicitly not the app's modal-header
    style (see §6as and the new §11 entry).

  ## 6as. "مدیریت حساب‌ها" close button reverted to the app-wide absolute top-left corner (supersedes §6ar)

  - **Context / intent**: every modal in the app — `ImportModal`,
    `ProfileModal`, `RecordTransactionModal`, `TransactionHistoryModal`,
    `RecordWalletTransactionModal`, `WalletTransactionHistoryModal`,
    `SelectAssetForTransactionModal`, `AddMarketWatchItemModal`,
    `ForgotPasswordModal`, `SideDrawer`, and `WalletTab.tsx`'s
    `WalletAccountModal` — uses the same absolutely-positioned close button:
    `className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1
    rounded-md hover:bg-[#f6f7fb] transition-colors"`, pinned to the top-left
    corner of the card with a small fixed gap and a hover state. The §6ar
    change made `ManageWalletAccountsModal` the one exception by moving its
    "×" inline next to the "+" `IconButton` in a shared flex row. The owner
    wants that undone: the "×" goes back to being its own absolutely-positioned
    corner element, completely separate from the "+", so this modal once again
    matches every other modal pixel-for-pixel. Going forward, **"+" and "×"
    must not be combined in this app's modal headers** — the convention is one
    absolute corner "×" per modal, and header actions like "+" stay in their
    own row.
  - **`ManageWalletAccountsModal.tsx` (only file changed)**: the §6ar single
    header row was replaced by the same two-piece structure the modal had
    before §6ar (and that every other modal uses): a standalone
    `<button ... onClick={onClose} aria-label="بستن" className="absolute top-4
    left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb]
    transition-colors"><CloseIcon/></button>` followed by a
    `<div className="flex items-center justify-between gap-3 mb-4 pr-1
    pl-10">` holding the `<h2>` title and the "افزودن حساب" `IconButton`. The
    `pl-10` on that row is deliberate clearance so the title/"+" row does not
    visually collide with the absolutely-positioned corner close button (this
    modal is RTL, so the corner sits on the same left side as the "+" and the
    padding keeps them apart). No other class, behavior, or element in this
    modal changed — the green/red status lines, account rows, empty state,
    `handleAccountSubmit`, `handleDelete`, and the `modal === null` Escape
    guard are all untouched.
  - **Not touched**: every other modal (they already follow the absolute-"×"
    convention correctly), `WalletTab.tsx`, `walletService.ts`, and all other
    files.
  - **Acceptance**: `npm run build` (typecheck + vite build) passes with no new
    TypeScript errors. In "مدیریت حساب‌ها", the "×" sits pinned to the top-left
    corner of the modal card (same classes as every other modal, visible hover
    state); the "+" is back in its own row next to the title with clearance
    from the "×" (no overlap); both buttons behave exactly as before; no visual
    or behavioral change to any other modal.
    **Superseded in layout detail by §6at**: the "×" corner button placement
    stands as-is, but the owner then asked for the "+" to leave the title row
    entirely and sit on its own right-aligned row below the title (see §6at).

  ## 6at. "مدیریت حساب‌ها": "افزودن حساب" "+" moved to its own right-aligned row below the title

  - **Context / intent**: after §6as restored the "×" to the app-wide absolute
    top-left corner, the "افزودن حساب" "+" `IconButton` still shared the
    title's `flex ... justify-between` row (title right, "+" left). The owner
    asked for the "+" to be moved out of that row: it should appear on its own
    row directly below the title, right-aligned (RTL: the right side of the
    modal). The "×" close button stays exactly as §6as left it — standalone
    `absolute top-4 left-4`, untouched — and the standing §6as rule holds:
    "+" and "×" are never combined in this app's modal headers.
  - **`ManageWalletAccountsModal.tsx` (only file changed)**: the title/"+" row
    `flex items-center justify-between gap-3 mb-4 pr-1 pl-10` became two rows:
    (1) a `mb-4 pr-1 pl-10` wrapper holding only the "مدیریت حساب‌ها" `<h2>`
    (the `pl-10` clearance for the corner "×" is kept on the title row), and
    (2) directly below it a `flex mb-4` row whose single child is the
    "افزودن حساب" `PlusIcon` `IconButton` — the app is RTL (`dir="rtl"` on `<html>`), so a plain flex
    row's start side is the right, and no extra alignment class is needed for
    the button to sit right-aligned. The button's look, icon,
    `onClick={() => setModal({ account: null })}`, and `ariaLabel="افزودن
    حساب"` are unchanged — only its position moved. The absolute "×" button
    and everything else in the modal (status lines, account rows, empty state,
    handlers, Escape guard) are untouched.
  - **Not touched**: every other modal, `WalletTab.tsx`, `walletService.ts`,
    and all other files.
   - **Acceptance**: `npm run build` (typecheck + vite build) passes with no new
     TypeScript errors. The "افزودن حساب" button is on its own row, under the
     title, aligned to the right; the "×" still sits alone in its absolute
     top-left corner, unaffected; no other visual or functional change to the
     modal.

  ## 6au. "نقدی" inverted: always in the main "کیف پول" list, never in "مدیریت حساب‌ها" (supersedes §6ap)

  - **Context / intent**: the owner reversed §6ap. The seeded "نقدی" account must
    now **always** appear in the *main* "کیف پول" list, at any balance (including
    exactly 0) — reverting the "نقدی" half of §6ap back to the §6ao behavior —
    while the mirror-image change lands in "مدیریت حساب‌ها": "نقدی" is filtered
    out of that modal's rendered list entirely, so it no longer appears there at
    all. "نقدی" itself is otherwise untouched: it still exists in storage, is
    still self-healing on load (§6al/§6af), and still contributes to the grand
    total (§6ae). Everything else — every other account's behavior in both
    places, the zero-balance hiding of non-"نقدی" accounts (§6ao), the
    balance-descending display sort (§6al) — is unchanged.
  - **`WalletTab.tsx` (one-line revert of §6ap)**: the display-only filter
    condition flipped from `account.balance > 0 && account.name !== 'نقدی'`
    back to `account.balance > 0 || account.name === 'نقدی'` (same exact-name
    match convention as §6aj/§6ak/§6am/§6ao/§6ap), and the comment above it was
    rewritten to describe the rule. "نقدی" is now sorted among the rest by the
    existing `sortedAccounts` balance-descending sort (§6al) — no special
    positioning. Consequence (accepted): the row-level action icons (تاریخچه /
    ثبت تراکنش / "صفر کردن موجودی و تاریخچه" reset, §6am) now render on the
    "نقدی" row at every balance, so there is again a UI path to record a
    transaction against it or reset its balance — the §6ap "no UI path" side
    effect is gone. The "هنوز حسابی ثبت نشده" empty state is effectively
    unreachable again (the self-healing seed guarantees ≥1 always-shown row).
  - **`ManageWalletAccountsModal.tsx` (new display-only filter)**: a new
    derived `const listedAccounts = accounts.filter(account => account.name !==
    'نقدی')` is computed (after the handlers, before the render) and both the
    `.length === 0` empty-state check and the row `.map` use it instead of the
    raw `accounts` prop — the component still **receives** the full, unfiltered
    `accounts` prop (its type is unchanged), it simply never renders "نقدی".
    The per-row `{account.name !== 'نقدی' && ...}` guards on the
    ویرایش/حذف `IconButton`s were deliberately **left in place** (defensive
    legacy — they are now no-ops, since "نقدی" no longer reaches the row
    render); the "هنوز حسابی ثبت نشده" empty state is now genuinely reachable
    (whenever the only stored account is the seeded "نقدی").
  - **Not touched**: `walletService.ts`, `walletTransactionService.ts`,
    `localWalletService.ts`, `walletStorage.ts`, `App.tsx` (the "نقدی"
    self-healing seed and the grand-total calculation are unchanged),
    `SummaryCard`, and every other tab/file. No storage, service, or type
    changes — this is a display-only visibility swap between two existing
    views.
  - **Acceptance**: `npm run build` (typecheck + vite build) passes with no new
    TypeScript errors. "نقدی" never appears in "مدیریت حساب‌ها" (not even
    locked); "نقدی" always appears in the main "کیف پول" list at any balance,
    including 0, sorted by balance among the rest; every other positive-balance
    account renders exactly as before; zero-balance non-"نقدی" accounts stay
    hidden from the main list but visible/editable/deletable in "مدیریت
    حساب‌ها"; "نقدی" is still self-healing on load and still counts toward the
    grand total.

  ## 6av. "مدیریت حساب‌ها" detail lines show the actual field values, not "ثبت شده"/"ثبت نشده" (supersedes the §6aq line wording)

  - **Context / intent**: the owner wants the six green/red detail lines under
    each account in "مدیریت حساب‌ها" to show **what** is stored, not just
    **whether** something is stored. Each line keeps its label (بانک/کارت/حساب/
    شبا/رمز اول/رمز دوم) on the right; on the left it now shows the field's
    actual value in green when set, or a short neutral red placeholder ("—")
    when empty — never the words "ثبت شده"/"ثبت نشده". Sensitive values (card
    number, account number, sheba, both PINs) are deliberately shown as plain
    text here: this is the same trust model as the rest of this single-user
    `localStorage`-only app (§6af/§6aq already store them as plain text).
    Display-only — `WalletAccount`, `walletService`, and the add/edit form
    (`WalletAccountModal`) are untouched.
  - **`ManageWalletAccountsModal.tsx` (only file changed)**: the
    `statusLine(label, value)` helper's value span now renders
    `{set ? value : '—'}` instead of `{set ? 'ثبت شده' : 'ثبت نشده'}` — same
    `set` rule (non-blank after trim), same row layout
    (`flex items-center justify-between gap-2`), same label span, same
    green `text-[#1f9d55]` / red `text-[#d95050]` classes, same
    `text-[11px] font-medium` sizing; the comment above the helper was
    rewritten to describe the new behavior (references §6av). Nothing else in
    the file changed — the six `statusLine(...)` call sites, their order, the
    `grid grid-cols-2` wrapper, the §6au `listedAccounts` filter, the
    edit/delete guards, and both handlers are all untouched.
  - **Not touched**: `WalletTab.tsx` (main list + `WalletAccountModal`),
    `walletService.ts`, `localWalletService.ts`, `walletStorage.ts`,
    `App.tsx`, `SummaryCard`, the grand-total calculation, and every other
    tab/file. No storage, service, type, or form changes.
  - **Acceptance**: `npm run build` (typecheck + vite build) passes with no
    new TypeScript errors. Each of the six rows shows the label plus the
    actual stored value (green) or a red "—" when empty — the words "ثبت
    شده"/"ثبت نشده" no longer appear in this modal; the same six fields in
    the same order, same layout; the main "کیف پول" list is unchanged.

  ## 6aw. "مدیریت حساب‌ها" rows: "ارسال مشخصات" button copies the account's shareable details to the clipboard

  - **Context / intent**: the owner wants a quick way to share an account's
    details with someone else (e.g. paste them into Telegram). Each account
    row in "مدیریت حساب‌ها" gets a new copy button, placed next to the pencil
    "ویرایش" button, that builds a plain-text block from the account's
    shareable fields and copies it to the clipboard. This is a new owner-
    requested convenience action scoped to this one modal — no new service,
    no storage, no form.
  - **`icons.tsx`**: new `SendIcon` (a paper-plane / send glyph, same
    24x24/`stroke="currentColor"`/`strokeWidth="1.8"` style as the file's
    other stroke icons) — the only icon addition in this task.
  - **`ManageWalletAccountsModal.tsx`**: (1) a new `handleCopyDetails(account)`
    async handler — it resolves the logged-in user's full name via
    `authService.getCurrentUser()` (the same source `App.tsx` already uses for
    `currentUser`; `user?.fullName` trimmed, and empty if somehow absent),
    then builds the line list from
    `[name, account.bankName, account.cardNumber, account.accountNumber,
    account.shebaNumber]`, filtering out empty/blank values (so no empty
    labels are printed) and trimming each remaining line, joins them with
    `\n`, and copies via `navigator.clipboard.writeText(...)`. On success it
    shows `toast.success('مشخصات کارت کپی شد')`; the whole `writeText` call is
    wrapped in try/catch so a rejected/failed clipboard write shows
    `toast.error('کپی مشخصات انجام نشد')`. The two card-PIN fields
    (`cardPin1`/`cardPin2`) are **deliberately excluded** from the copied text
    — they are personal reminders, not meant to be shared. (2) A new neutral
    `variant="ghost"` `IconButton` rendering `SendIcon` with
    `aria-label="ارسال مشخصات"` is added to each row's action group, placed
    **between the pencil and the trash** buttons (in the RTL action group that
    reads balance / pencil / send / trash). It is rendered on **every** row
    with **no** `account.name !== 'نقدی'` guard — it does not special-case
    "نقدی" (in practice it only ever shows on real accounts because §6au
    already filters "نقدی" out of `listedAccounts`). Its `onClick` is
    `() => handleCopyDetails(account)`, the same fire-and-forget async pattern
    the existing `handleDelete` button uses.
  - **Not touched**: `WalletAccount`/`walletService`/`localWalletService`/
    `walletStorage`, `WalletTab.tsx` (main list + `WalletAccountModal` form),
    `App.tsx`, `SummaryCard`, the grand total, and every other tab/file. No
    storage, service, type, or form changes — a display + clipboard action
    only.
  - **Acceptance**: `npm run build` (typecheck + vite build) passes with no new
    TypeScript errors. The new ghost `SendIcon` button appears on every account
    row in "مدیریت حساب‌ها" next to the pencil; clicking it copies a clean
    multi-line block (user full name, bank, card number, account number, sheba —
    empty fields skipped) to the clipboard and shows a success toast; a clipboard
    failure shows an error toast; the copied text never contains `cardPin1`/
    `cardPin2`; everything else in the modal is unchanged.

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
| 2026-09-25 | Owner-requested (see §6l): added "کیف پول"/"چشم بازار" tabs above the assets section, plus a new read-only market-watch list. `App.tsx` gained `activeSectionTab: 'wallet' \| 'market'` state and a two-button tab toggle (reusing `AuthScreen`'s exact login/signup tab-toggle styling — no new pattern) above the portfolio section's contents; "کیف پول" renders exactly today's `Toolbar` + asset list unchanged, "چشم بازار" renders new `src/components/MarketWatchList.tsx` instead (no toolbar), with the "دارایی‌های من" heading swapped for "چشم بازار" only on that tab. `SummaryCard`/the portfolio total above the tabs are unaffected either way. Extended the mock `LivePrices` type (`src/services/priceService.ts`) with `btcToman`/`ethToman` (starting values `10,500,000,000`/`360,000,000`, consistent with `src/assets.ts`'s existing sample BTC/ETH rows) and an `updatedAt: number` timestamp; `mockPriceService.ts`'s shared `jitterStep()` now also nudges these two by a fixed absolute toman amount (`±50,000,000`/`±5,000,000`) and stamps `updatedAt: Date.now()` on every run (both the 60s tick and `refreshNow()`), so both the automatic tick and the existing manual-refresh button drive the new list exactly like the existing two rates. `MarketWatchList` calls `useLivePrices()` directly (only ever mounted on the "چشم بازار" tab) and renders 5 rows — تتر/دلار (both reading the same mock `usdToman`, shown separately since they're commonly checked apart)/عیار گرمی (۱۸ عیار)/اتریوم/بیت‌کوین — each with an icon badge, `format()`-ed toman price, and a `new Intl.DateTimeFormat('fa-IR', { timeStyle: 'medium' })`-formatted "بروزرسانی: …" label from `prices.updatedAt`; shows "در حال دریافت قیمت‌ها..." while prices haven't resolved yet. `btcToman`/`ethToman` are **not** added to `livePriceMapping.ts`'s live-priced-asset allow-list (§6k) — out of scope for this task. Still entirely **mock** data, same as the rest of §6j. Build (`npm run build`) passes. |
| 2026-09-25 | Owner-requested (see §6m): added tab icons and turned "چشم بازار" into a categorized market list backed by a brand-new, independent mock feed. Tab toggle (§6l) buttons now show a small icon before each label — new `WalletIcon`/`MarketEyeIcon` (`src/components/icons.tsx`). `MarketWatchList` was rewritten from a flat 5-row list into 4 category sections (`ارزها`/`طلا`/`بورس`/`صندوق‌های درآمد ثابت`, each with its own icon heading — new `CryptoIcon`/`StockIcon`/`FixedIncomeIcon` plus the reused `GoldBarIcon`) holding 14 items total, with one shared update-time label instead of one per row. New `src/services/marketWatchService.ts` + `mockMarketWatchService.ts` (same singleton-swap/shared-`jitterStep()`/60s-interval pattern as `mockPriceService`, see §6j) and `src/hooks/useMarketWatch.ts` (same pattern as `useLivePrices`) — **deliberately independent from `priceService`/`LivePrices`**, so `SummaryCard`'s USD/gold-gram conversions and `AssetRow`'s GOLD18/USDT live pricing (§6j/§6k) were not touched. `SummaryCard`'s existing manual refresh button now calls `Promise.all([priceService.refreshNow(), marketWatchService.refreshNow()])` so one click refreshes both feeds together. As a side effect, `LivePrices.btcToman`/`ethToman` (added in the §6l task) now have no remaining UI consumer — left in place rather than removed, since touching `priceService`/`mockPriceService` was explicitly out of scope; noted in §6l as a candidate future cleanup. Build (`npm run build`) passes; manual Playwright/Firefox verification confirms tab icons, all 4 categories/14 items, single update-time label, unaffected wallet tab, and that the manual refresh button updates the market tab's timestamp. |
| 2026-09-25 | Owner-requested (see §6n): added daily portfolio-history snapshots and a growth-vs-USD/gold trend chart below `SummaryCard`. New `src/services/portfolioHistoryService.ts` + `localPortfolioHistoryService.ts` + `src/portfolioHistoryStorage.ts` (same singleton-swap/`localStorage`-try-catch pattern as every other service — see §6d), storing `PortfolioSnapshot[]` under `localStorage` key `oracle_portfolio_history_v1`, capped at 90 entries. `recordSnapshotIfNeeded` upserts today's entry (never duplicates same-day calls); `seedMockHistoryIfEmpty` backfills 30 synthetic days (ending yesterday) with small daily jitter the first time history is empty — clearly synthetic, never presented as real past data. `App.tsx` records/seeds a snapshot once per calendar date (ref-guarded against the 60s price-tick re-running it) once `total`/`prices` are both ready, then bumps a `historyVersion` counter passed to the new `PortfolioTrendChart` component as a `refreshKey` so it re-fetches history right after a snapshot changes. `PortfolioTrendChart` (new, `src/components/PortfolioTrendChart.tsx`) is a hand-rolled inline-SVG line chart — **no charting library added** — plotting 3 series normalized to "% change since day 1" (toman total, toman-total÷usdToman, toman-total÷goldGramToman, all starting at exactly 100) as 3 `<polyline>`s in brand-indigo/green/gold, with a legend (colored dot + label + latest ±% badge in the app's existing green/red convention) and a handful of `formatDate()` X-axis labels; shows a "داده کافی برای نمودار وجود ندارد" empty state below 2 points. Styled as its own card matching `SummaryCard`'s tokens, rendered directly below it in the same column. Still built on the existing mock `usdToman`/`goldGramToman` rates (§6j) — a real computation over real recorded totals, but not backed by a real market data source. Build (`npm run build`) passes; manual Playwright/Firefox verification confirms the chart renders 3 polylines + all 3 legend rows with correctly colored badges on desktop and mobile, and that `localStorage` correctly ends up with 31 entries (30 backfilled + today) after first load. |
| 2026-09-25 | Owner-requested follow-up (see §6n): replaced `PortfolioTrendChart`'s X-axis labels — sparse calendar dates (`formatDate()`, tiny 10px SVG `<text>`) were both too small to read on mobile and not meaningful at a glance. Now exactly 3 **relative-time** labels ("۳۰ روز پیش" for the oldest point / "{N} روز پیش" for the midpoint, both real `daysBetweenIso(...)`-computed day counts, never hardcoded / "امروز" for the newest point), rendered as real HTML `<span className="text-[11px]">` below the `<svg>` (not SVG `<text>`) so the size is literal on-screen pixels — reusing `AssetRow.tsx`'s existing small-sub-label size instead of inventing a new one — and reusing the existing `format()` helper for Persian digits rather than adding a second digit-conversion helper. The label row needs `dir="ltr"` to keep left(oldest)→right(today) ordering matching the SVG's own always-LTR coordinate space, since a plain RTL flex row on this RTL page would otherwise visually reverse the 3 labels relative to where the lines actually are (caught during Playwright verification by comparing each label's screen-x against the polyline's actual first/last point screen-x). `formatDate()` is no longer imported by this file. Only `src/components/PortfolioTrendChart.tsx` changed — the 3 polylines, legend, heading, index-series computation, and SVG structure are untouched. Build (`npm run build`) passes; Playwright/Firefox verification confirms 3 labels with correct computed day-counts, Persian digits, `11px` computed font size, zero SVG `<text>` elements, and label screen-x positions matching their corresponding data-point screen-x on both desktop and mobile. |
| 2026-09-26 | Owner-requested (see §6o): added a sort menu for "دارایی‌های من" on the "کیف پول" tab only. New three-dot `MoreVerticalIcon` (`src/components/icons.tsx`) opens a new `AssetSortMenu` component (`src/components/AssetSortMenu.tsx`) placed beside the existing "ارزش به تومان" label in the section's header row; the "چشم بازار" tab/header/`MarketWatchList` are untouched. Two radio-style options: "بیشترین ارزش (تومان)" (default) sorts all assets flat, descending by toman value; "بر اساس نوع دارایی" groups assets by catalog category (`getCatalogAssetBySymbol(asset.code)?.category`, `'other'` fallback), orders groups by total group value descending, and sorts assets within each group by their own value descending — both modes reuse the existing `getEffectiveUnitPrice(asset, prices)` value calculation (no reimplementation). `App.tsx` gained `sortMode: AssetSortMode` state, initialized from and persisted to `localStorage` (key `oracle_asset_sort_mode_v1`, the one deliberate exception to the service-layer-only rule — see the `App.tsx` file-map note, §4/§6d — since it's a tiny UI preference, not domain data) via small local try/catch-safe helpers, plus a `sortedItems` `useMemo` that is what actually renders (`items` itself stays insertion-ordered and is what add/edit/delete/import/clear still operate on). `AssetSortMenu`'s outside-click detection deliberately copies `AssetPicker`'s `document` `mousedown` + container-`ref` pattern (not a `fixed inset-0` overlay) specifically so it cannot block a parent modal's own close behavior — the exact bug class `AssetPicker.tsx`'s own comment documents from an earlier version of this app. `AssetRow.tsx` itself is unchanged (same props/logic, just a different item order). Build (`npm run build`) passes. |
| 2026-09-26 | Bug fix (owner-reported, see §6o): "بر اساس نوع دارایی" ("sort by type") appeared to do nothing — selecting it produced the identical order as "بیشترین ارزش (تومان)". Root cause: the grouping key was `getCatalogAssetBySymbol(asset.code)?.category`, which only resolves for assets whose `code` exactly matches a catalog `symbol` — true only for assets added through the catalog-driven `AddAssetModal`. Every legacy/auto-coded asset (`getOrCreateCode()` in `assetCodeRegistry.ts`, format `<PREFIX>-<NNNN>`, e.g. `GOLD-0001`) — **including all 7 default sample assets** (§6h) — never matches a catalog symbol, so `getCatalogAssetBySymbol` silently returned `undefined` for every one of them and they all fell into the single `'other'` bucket, which is then sorted by value descending — identical output to the `'value'` mode whenever most/all of a user's real assets are legacy-coded (the common case for anyone who hasn't only ever added via the catalog picker). Fix: `sortAssetsForDisplay()` (`App.tsx`) now derives the grouping key directly from `asset.icon` (`Asset['icon']`, see §5 — always populated for every asset regardless of `code`) instead of the code/catalog lookup; the `'|| other'` fallback was dropped since `icon` already covers `'other'` natively. Group-value-descending ordering and within-group value-descending ordering are unchanged. Catalog-driven assets are unaffected (a no-op for them, since `AddAssetModal` already sets `icon` consistent with the catalog entry's category via `getAssetIconForCatalogEntry`). Verified via Playwright/Chrome with the default 7 sample assets (all legacy-coded): "بر اساس نوع دارایی" now visibly reorders the list (3 gold-icon assets grouped and ranked first by combined group value, ahead of cash/btc/usdt/eth), "بیشترین ارزش (تومان)" is unchanged, and adding 2 more gold-category + 1 cash-category catalog assets still groups/orders them correctly by `icon`. Build (`npm run build`) passes. |
| 2026-09-26 | Owner-requested: reduced the vertical padding (`py`) on each `AssetRow` card by ~30% at every breakpoint — `AssetRow.tsx`'s outer `<li>` (§6): base `py-[17px]→[12px]`, the `351–480px` tier `py-[15px]→[11px]`, `<351px` `py-[13px]→[10px]`, and the `≥1050px` tier's previously-uniform `p-[14px]` was split into `py-[10px] px-[14px]` so only its vertical side shrinks. Horizontal padding (`px`), `gap`, `rounded`, `shadow`, and border values, plus all icon/text/button markup inside the `<li>`, are untouched — a padding-only tweak to make each card visually more compact (less empty space below the history/edit/delete icon row). Verified via Playwright/Chrome computed-style + screenshot checks at 320px/400px/700px/1200px viewport widths: all 4 `py` values match spec exactly, horizontal padding unchanged at each breakpoint, and no clipping/overlap of the icon/title/quantity/price/action-buttons. Build (`npm run build`) passes. |
| 2026-09-26 | Owner-requested (see §6p): added a single "hide balance" eye toggle in `SummaryCard`'s header row (beside the existing refresh button) that masks/unmasks every toman **holding value** shown in the wallet at once — `SummaryCard`'s total + دلار/گرم طلا equivalents, and every `AssetRow`'s own row value — driven by one shared `isBalanceHidden` state, not a per-row toggle. New `maskAmount(formatted)` in `src/format.ts` (`replace(/[0-9۰-۹]/g, '•')`) turns an already-`format()`-ed string into a bullet-masked placeholder while keeping thousands separators intact, always applied as `maskAmount(format(...))` rather than a separate code path. New `EyeClosedIcon` (`src/components/icons.tsx`, the existing `MarketEyeIcon` eye shape plus a diagonal slash) pairs with the existing `MarketEyeIcon` (reused directly, not duplicated) for the visible state; the toggle button's icon color itself flips green (`#1f9d55`, visible) ↔ grey (`#9096aa`, hidden) as a second state signal beyond the icon shape. `App.tsx` gained `isBalanceHidden: boolean`, persisted to `localStorage` (key `oracle_balance_hidden_v1`, default `false`/visible) via the exact same try/catch-safe tiny-UI-preference pattern as `sortMode` (§6o) — a second deliberate exception to the service-layer-only rule, since it's display-only, not owner asset data. Left fully visible regardless of the toggle: each row's own quantity/unit line, the GOLD18/USDT live per-unit-rate sub-text (§6k), and the "هر دلار/هر گرم … تومان" rate lines in `SummaryCard` — those are prices, not the owner's holding amount. `AssetRow.tsx`/`SummaryCard.tsx` otherwise unchanged (masking is a pure display wrapper, no new edit/delete/history logic). Verified via Playwright/Chrome: default state unmasked (matching prior behavior), one click masks the total + both equivalents + all 7 sample rows simultaneously and turns the icon grey/crossed-eye, a second click restores everything and the green open-eye, and the hidden state survives a page reload (`oracle_balance_hidden_v1` holds `"true"` in `localStorage` across it). Build (`npm run build`) passes. |
| 2026-09-26 | Owner-requested (see §6q): merged the "کیف پول" tab's two separate header rows above the asset list — `Toolbar` (import/clear-all/add icons) and its own following `<h2 id="assets-title">دارایی‌های من</h2>` + `AssetSortMenu` + "ارزش به تومان" row (added in the §6o sort-menu task) — into one single row: `Toolbar` now renders `justify-between` with the three icons on the right and the sort menu + label on the left (new `sortMode`/`onSortModeChange` props, threaded from `App.tsx`, which no longer imports `AssetSortMenu` itself), keeping the old heading row's `mb-[15px] min-[1050px]:mb-[19px]` spacing so the gap to the list below is unchanged. The "دارایی‌های من" heading `<h2>` was removed outright — that text no longer appears anywhere on screen. Since the wallet tab no longer has an `id="assets-title"` element, the assets `<section>` now switches its accessible-name attribute per tab instead of always using `aria-labelledby="assets-title"`: `aria-label="دارایی‌های من"` on the "کیف پول" tab, `aria-labelledby="assets-title"` (pointing at the market tab's own unchanged `<h2>`) on the "چشم بازار" tab — never a dangling reference. `AssetSortMenu.tsx`/`AssetRow.tsx`/`IconButton.tsx`/icons are unchanged; the "چشم بازار" tab's own header row/heading/`MarketWatchList` are untouched. Verified via Playwright/Chrome at 320/400/700/1200px: single aligned header row, heading text gone, sort menu still opens and actually re-sorts, market tab pixel-identical, section accessible name valid in both tab states. Build (`npm run build`) passes. |
| 2026-09-26 | Owner-requested (see §6r): removed the "چشم بازار" heading text (same treatment §6q gave the wallet tab) and turned the "چشم بازار" list from an always-show-all-14-items view into a personal, persisted watchlist. New `src/storage.ts` pair `loadWatchedMarketItemIds`/`saveWatchedMarketItemIds` (key `oracle_market_watchlist_v1`, null-on-missing convention). New `marketWatchService.getAllItems()` (the static 14-item catalog, no jitter) plus new `src/services/marketWatchlistService.ts`/`localMarketWatchlistService.ts` (`getWatchedIds`/`addItem`/`removeItem`, same singleton-swap pattern as every other service, §6d) — `getWatchedIds()` falls back to *all* catalog ids without persisting when nothing was ever saved, so existing/fresh installs keep seeing all 14 items until the first real add/remove, while an explicit empty watchlist (everything removed) stays a real `[]`, never reinterpreted as "uncustomized". New `src/services/marketCategoryMeta.tsx` extracts the category order/label/icon mapping out of `MarketWatchList.tsx` so the new `AddMarketWatchItemModal.tsx` can reuse it. `useMarketWatch.ts` gained a second hook, `useMarketWatchlist()` (loads watched ids once, `add`/`remove` update local state directly from the service's returned list). `MarketWatchList.tsx` now filters the live snapshot down to watched ids before grouping, adds a header "+" `IconButton` (opens the new `AddMarketWatchItemModal`, shelled like `AddAssetModal`) and a per-item danger/ghost trash `IconButton` (removes immediately, no confirmation — lighter-weight than the wallet's clear-all), plus a "چیزی به چشم بازار اضافه نشده" empty state when everything is removed. `App.tsx`'s assets `<section>` now uses `aria-label` on both tabs (`"دارایی‌های من"`/`"چشم بازار"`) instead of the §6q-era `aria-labelledby` fallback on the market tab, since neither tab has a visible `<h2>` anymore. Wallet tab (`SummaryCard`/`Toolbar`/`AssetSortMenu`/`AssetRow`/hide-balance toggle) completely untouched; still entirely mock data (§6j/§6m), only the shown subset changed, never a real feed. Verified via Playwright/Chrome: heading gone, first-load shows all 14 items unchanged, search-and-add flow (modal closes, item appears immediately), remove flow (immediate, item reappears as an add-modal candidate), persists across reload, empty state when all removed, manual refresh still updates the timestamp for remaining items, wallet tab unaffected. Build (`npm run build`) passes. |

| 2026-09-26 | Owner-requested (see §6s): moved the "+" (add-to-watchlist) button on the "چشم بازار" tab onto the same row as "ارزش به تومان", matching the wallet tab's merged `Toolbar` row layout (§6q) — "+" on the right, "ارزش به تومان" on the left, directly facing each other. Deleted `App.tsx`'s standalone `flex justify-end` row that used to render "ارزش به تومان" alone above `<MarketWatchList/>`; `MarketWatchList.tsx` gained a new first header row (same `mb-[15px] min-[1050px]:mb-[19px]` spacing reused from the deleted row) pairing the existing `PlusIcon` `IconButton` with that label, and the old "بروزرسانی"/"+" row lost its button and was simplified to a plain `<p>` on its own row below. Only these two files changed; `isAddOpen`/`AddMarketWatchItemModal`/category grouping/per-item remove and the wallet tab are all untouched. Verified via Playwright/Chrome at 320/400/700/1200px (bounding-box check confirms same row, "+" right of the label) plus a remove→re-add smoke test (14→13→14 items) and modal open/close. Build (`npm run build`) passes. |
| 2026-09-26 | Owner-requested (see §6t): replaced the "ارزش به تومان" label on the "چشم بازار" tab's header row (added in §6s) with the "بروزرسانی: …" update timestamp, and dropped the now-empty second row it used to occupy — redundant since every item row already shows its own "تومان" unit next to the price. `MarketWatchList.tsx` (the only file changed) merged the two rows into the single existing `justify-between` row: the `<span>` label became the `<p>` timestamp (same text/classes as before, "+" `IconButton` unchanged, first in JSX/right side), and the now-empty `<div className="px-1">` row that used to hold that `<p>` was deleted outright. Exactly one header row now sits above the category groups; "ارزش به تومان" no longer appears anywhere in the app. `App.tsx`, the wallet tab, `isAddOpen`/`AddMarketWatchItemModal`/category grouping/per-item remove all untouched. Verified via Playwright/Chrome at 320/400/700/1200px: same-row bounding-box check ("+" right of the timestamp), zero "ارزش به تومان" matches, no leftover gap where the second row used to be, timestamp still live/refresh-driven, "+" still opens the modal, remove→re-add smoke test (14→13→14 items). Build (`npm run build`) passes. |
| 2026-09-26 | Owner-requested (see §6u): removed the "ارزش کل دارایی‌ها" heading from `SummaryCard`'s wallet-tab card — judged unnecessary since the number's context is already obvious — and moved the hide-balance eye toggle (§6p) and manual-refresh button (§6j) that used to sit on that heading's own row up onto the card's very first row instead (which already held the wallet-icon button and the optional "نمایش نمونه" sample tag). `SummaryCard.tsx` (the only file changed): deleted the `<h1 id="total-title">`; the eye/refresh `<span>` group now renders on the left side of the first row, after the optional sample tag, both wrapped together in one `<span className="flex items-center gap-2">`; the now-empty second row was deleted outright; the big-total block's top margin changed from `mt-[5px]` to `mt-4 min-[1050px]:mt-5 max-[481px]:mt-3` to keep the vertical gap looking balanced with the removed row's height gone; the outer `<section>` switched from `aria-labelledby="total-title"` to `aria-label="ارزش کل دارایی‌ها"` to keep a valid accessible name. Every button's classes/`onClick`/`aria-label`/icon logic unchanged — only position moved. Nothing else (`App.tsx`, the wallet tab's `Toolbar`/`AssetRow`/`AssetSortMenu`, the "چشم بازار" tab, masking behavior, the USD/gold equivalent lines, the footer) touched. Verified via Playwright/Chrome at 320/400/700/1200px: zero visible matches for "ارزش کل دارایی‌ها" (still present only as the section's `aria-label`), first row holds wallet button (right) + sample tag/eye/refresh group (left) with no wrap/overlap at any breakpoint, eye toggle still masks/unmasks the total, refresh button still spins. Build (`npm run build`) passes. |
| 2026-09-26 | Owner-requested (see §6v): split `TransactionHistoryModal` (the history/clock icon's modal) away from the "ثبت تراکنش جدید" buy/sell form it used to embed, and repointed `AssetRow`'s pencil icon at the split-out form instead of the old direct-edit mechanism it used to open. Moved `todayLocalIso()` from a local definition in `TransactionHistoryModal.tsx` into shared `src/format.ts` (exported). `TransactionHistoryModal.tsx` lost its form state/`handleAddSubmit`/form JSX and the `onTransactionRecorded` prop — it is now history-only (list + pagination + empty/loading states + sample badge), taking just `{ asset, isSample, onClose }`. New `src/components/RecordTransactionModal.tsx` holds the moved form verbatim (same خرید/فروش toggle, مقدار/قیمت واحد/تاریخ/یادداشت fields, validation, `transactionService.addTransaction` call, toasts), titled "ثبت تراکنش جدید" with the asset's name shown below, taking `{ asset, isSample, onClose, onTransactionRecorded }` — the one behavior change is it now calls `onClose()` right after a successful submit instead of resetting its fields to stay open (single-purpose action modal, matching `AddAssetModal`'s pattern). `AssetRow.tsx`'s old inline-edit mechanism (`isEditing`/`draftQuantity`/`draftUnitPrice`/`error` state, `startEdit`/`save`, the two-visual-mode conditional branches, and the `onEdit` prop) was removed entirely — the row is now always the single static view; the pencil `IconButton` (unchanged icon/aria-label/tone/variant) now calls a new `onRecordTransaction(id)` prop instead of `startEdit`. `App.tsx` dropped `handleEdit` entirely, added `recordTransactionAssetId`/`recordTransactionAsset` state mirroring the existing `historyAssetId`/`historyAsset` pattern, updated the `<AssetRow>` call site (`onEdit={handleEdit}` → `onRecordTransaction={setRecordTransactionAssetId}`), and rendered the new `<RecordTransactionModal>` alongside the (now simplified) `<TransactionHistoryModal>` call, reusing the existing, unchanged `handleTransactionRecorded` handler as `onTransactionRecorded` for the new modal (no new quantity-update logic needed — that handler already implements the buy-adds/sell-subtracts-clamped-at-0 semantics a transaction-based edit requires). Verified via Playwright/Chrome: the history modal shows zero "ثبت تراکنش جدید" text anywhere; the pencil icon opens the separate, correctly-titled record-transaction modal; submitting there updates the asset's quantity and auto-closes; re-opening history shows the new transaction in the list; no inline edit inputs/ذخیره/انصراف markup exists anywhere on the page at any point; both modals are independently openable/closeable via their own state. Build (`npm run build`) passes. |

| 2026-09-26 | Owner-requested (see §6w): added a third "جایگذاری" (replace) `TransactionType` — `'buy' \| 'sell' \| 'replace'` in `src/types/transaction.ts` — as a **non-destructive history checkpoint**: recording one never deletes any earlier transaction (every prior row stays in `localStorage` and keeps showing in `TransactionHistoryModal` exactly as before), it only affects future *calculations* over the history. `computeHoldingSummary` (`src/services/transactionCalculations.ts`) now finds the most recent `'replace'` transaction (if any) after its existing chronological sort, drops everything before it from the calculation only, and seeds `quantity`/`averageCost`/`realizedPnL` from that replace's `quantity`/`unitPrice`/`0` before continuing the normal buy/sell accumulation loop over whatever comes after — a `'replace'` row is itself never treated as a buy or sell (explicitly skipped in the loop, never double-counted); with no `'replace'` present, behavior is unchanged. Verified with a temporary throwaway `tsx` script covering 5 scenarios (no-replace baseline, buys/sells before+after a replace, replace-as-last-transaction, multiple replaces where only the latest counts, same-date tie-breaking) — all passed; `computeHoldingSummary` still has no UI caller and no permanent test file. `RecordTransactionModal.tsx`'s خرید/فروش toggle became a 3-way `grid-cols-3` toggle (فروش/خرید/جایگذاری) — جایگذاری's active state reuses `SummaryCard`'s existing گرم طلا gold tone (`bg-[#d7a144] text-white`) rather than a new color; while جایگذاری is selected the مقدار/قیمت واحد به تومان field labels switch to "مقدار جدید"/"قیمت واحد جدید (تومان)" to make the new-total-not-a-delta meaning explicit (خرید/فروش labels untouched); validation is identical for all three types. `onTransactionRecorded` gained a 4th `unitPrice: number` parameter (خرید/فروش call sites ignore it, unchanged behavior). `App.tsx`'s `handleTransactionRecorded` gained the same 4th parameter and a new `if (type === 'replace')` branch, checked first, that calls `assetService.updateAsset(assetId, { quantity, unitPrice })` — both fields **set directly** to the entered values (not additive/subtractive) — while خرید/فروش remain byte-for-byte unchanged. `TransactionHistoryModal.tsx`'s per-row badge/card styling became a 3-way branch — خرید/فروش unchanged (green/red), جایگذاری new (amber card `border-[#f0dca0] bg-[#fffbf0]`, badge `text-[#d7a144] bg-[#fff5df]` — the exact `SummaryCard` gold pair), labeled "جایگذاری". Explicitly disambiguated in §6i from the same-named Excel-import `replace` mode (§6a), which is a functionally distinct mechanism that never writes a transaction row at all — a pencil-icon جایگذاری always does. `ensureInitialTransaction`, `TransactionHistoryModal`'s pagination/loading/empty states, and every AssetRow/AssetSortMenu/eye-toggle/چشم بازار feature untouched. Verified via Playwright/Chrome: 3-way toggle present; selecting جایگذاری relabels both number fields; submitting quantity=10/unitPrice=500,000 against an asset already holding 5 set its displayed quantity to exactly 10 (not 15, confirming exact-set) and stored `unitPrice` to exactly 500,000; modal auto-closed on success; re-opened history modal showed both the new amber جایگذاری row (computed colors matched `#fff5df`/`#d7a144` exactly) **and** the original untouched خرید row from before the replace (confirming non-destructive/no-deletion); zero "ثبت تراکنش جدید" text leaked into the history modal. Build (`npm run build`) passes. |

| 2026-09-26 | Owner-requested (see §6x): added an "آخرین قیمت" (fill last price) button beside `RecordTransactionModal`'s قیمت واحد input, and made its submit button color/label reactive to the selected type. New `prices: LivePrices | null` prop threaded from `App.tsx`'s existing `useLivePrices()` call (same one already passed to `AssetRow`/`SummaryCard`) — `lastPrice = getEffectiveUnitPrice(asset, prices)` computed at the top, reusing `AssetRow`'s exact live-vs-stored price helper (§6k) with no new price logic. The button (`flex` row inside the قیمت واحد `<label>`, beside the `<input>`) calls `fillLastPrice`, setting `formUnitPrice` to `String(Math.round(lastPrice))` (nearest whole toman, matching `format()`'s default `maximumFractionDigits: 0`); the field stays fully editable afterward. Submit button changed from a single static `bg-[#5264e8]`/"ثبت تراکنش" button to one whose className/label derive from `formType`, reusing the toggle's own three colors: خرید green `bg-[#1f9d55]`/"ثبت تراکنش خرید", فروش red `bg-[#d95050]`/"ثبت تراکنش فروش", جایگذاری amber `bg-[#d7a144]`/"ثبت تراکنش جایگذاری" — updates immediately on toggle switch, before submitting; the submit handler's own validation/save/toast/close logic is untouched. Found and fixed a layout bug during Playwright verification: the قیمت واحد `<label>` is a `grid` item and its inner `flex` wrapper defaulted to `min-width: auto`, so at the form's `min-[560px]:grid-cols-2` two-column breakpoint the input+button row overflowed sideways into the neighboring مقدار field instead of shrinking to its own column — fixed by adding `min-w-0` to both the `<label>` and the inner `<span>` (the `<input>`'s own `flex-1 min-w-0` alone wasn't enough; the ancestors needed it too). Verified via Playwright/Chrome at 320/400/700/1200px: button visible beside the input at every width with no overlap/overflow (confirmed both via computed-`width` measurements before/after the `min-w-0` fix and screenshots); clicking it filled the exact stored `unitPrice` for a non-live-priced sample asset (`7,500,000`) and the exact live rate for a freshly-added GOLD18 asset (`24,000,000`, matching `AssetRow`'s own displayed rate); submit button's computed background-color/label switched correctly across all three toggle selections without a reload. `TransactionHistoryModal`/`AssetRow`/the toggle segments/validation/`handleTransactionRecorded` untouched. `npm run build` (typecheck + vite build) passes. |

| 2026-09-26 | Owner-requested (see §6y): shrunk `RecordTransactionModal`'s "آخرین قیمت" (last-price fill) text button down to a small icon-only `IconButton` (`DollarIcon` + `ariaLabel="پر کردن با آخرین قیمت"`, `tone="neutral"`, `variant="filled"`) reusing the app's existing shared `IconButton` component and the existing `DollarIcon` (already used by `SummaryCard`'s دلار row, §6j) — no new components added, `fillLastPrice`'s own fill logic completely unchanged, only the trigger element replaced. Also wrapped just the مقدار/قیمت واحد fields (previously two direct children of the form's outer `grid gap-[10px] min-[560px]:grid-cols-2`) in their own inner `grid gap-[10px] min-[560px]:grid-cols-[2fr_3fr] min-[560px]:col-span-2` container, giving قیمت واحد 3 parts vs مقدار's 2 parts of the row's width at ≥560px (unit-price values run to many more digits than quantity values) while leaving the outer grid — and so تاریخ/یادداشت's existing equal-width layout below — completely untouched; below 560px both fields still stack full-width exactly as before. Verified via Playwright/Firefox at 320/400/700/1200px: icon button renders with no leftover "آخرین قیمت" text anywhere, no overlap/clipping at any width, قیمت واحد's column visibly wider than مقدار's at ≥560px while تاریخ/یادداشت stay equal, both fields still stack full-width below 560px, and clicking the icon still fills قیمت واحد with the asset's exact stored `unitPrice` (`7,500,000`) unchanged. `npm run build` (typecheck + vite build) passes. |
| 2026-09-26 | Owner-requested (see §6z): (1) added `aspect-square` to the one shared `IconButton` base className so every icon button in the app always renders as a true square, fixing the last-price button (§6y) rendering as a narrow rectangle inside its flex-stretched-height container — a shared-component fix, deliberately no one-off override added to `RecordTransactionModal.tsx` itself. (2) added a 4th toolbar `IconButton` ("ثبت تراکنش جدید", reusing `PencilIcon`) that opens a new `SelectAssetForTransactionModal.tsx` (searchable, name-filtered list of existing assets, shelled like `RecordTransactionModal`) — picking an asset there closes the picker and sets the app's existing `recordTransactionAssetId` state, opening the SAME `RecordTransactionModal` already wired to it (no duplicate transaction-recording logic). `App.tsx`'s new `handleOpenAddTransaction` shows a `toast.warning('ابتدا یک دارایی اضافه کنید')` instead of opening the picker when the wallet is empty. Verified via Playwright/Firefox: every `IconButton` (toolbar's 4 + `AssetRow`'s pencil + the last-price button) now measures as an exact square; toolbar button → search → select → `RecordTransactionModal` opens for that exact asset with the same toggle/last-price button/no leftover picker; closing the picker via ×/Escape/backdrop leaves no transaction modal open; empty-wallet click shows the warning toast and never opens the picker. `npm run build` passes. |
| 2026-09-26 | Owner-requested (see §6aa), four related UI refinements: (1) `AssetRow`'s per-asset record-transaction button switched `PencilIcon`/`ariaLabel="ویرایش"` → `PlusIcon`/`ariaLabel="ثبت تراکنش"` (fixing a stale label — it never opened an edit form). (2) `Toolbar`'s standalone "افزودن دارایی جدید" `IconButton`/`onAdd` prop was deleted outright (confirmed via a full-repo search that nothing besides `App.tsx`'s own now-removed `isAddOpen`/`handleAddAsset`/`<AddAssetModal>` wiring depended on it before deleting `src/components/AddAssetModal.tsx` itself; `AssetPicker.tsx`, `AddAssetModal`'s own searchable-combobox dependency, was left in place as now-orphaned-but-harmless, not deleted). (3) the remaining "ثبت تراکنش جدید" toolbar button switched `PencilIcon`→`PlusIcon`, so "+" now consistently means "record a transaction" everywhere with no competing pencil icon left in the wallet UI. (4) `SelectAssetForTransactionModal.tsx` gained a second capability: while a search query is active, it now also matches the full asset catalog (`getCatalogAssets()`) down to entries not already owned (checked by `code === symbol` OR an exact-name fallback — the latter needed because legacy/auto-coded assets, e.g. the default samples, carry a `<PREFIX>-<NNNN>` code instead of the catalog symbol) and lists them below a "دارایی‌های جدید" heading with a "دارایی جدید" badge; picking one silently creates a new `Asset` at `quantity: 0` (`unitPrice` from `getEffectiveUnitPrice`, so GOLD18/USDT default to their live mock rate) via a new, deliberately transaction-free `handleAddNewAsset` in `App.tsx`, then proceeds straight into the same `RecordTransactionModal` flow as any existing-asset pick — no separate confirmation step, and the first submitted transaction is what sets the real quantity/price. The old `items.length === 0` guard (empty-state message replacing the whole search/list, plus `App.tsx`'s empty-wallet warning-toast guard before even opening the picker) was removed — an empty wallet now just shows a small inline hint above the list, since catalog search is always available. Separately, `Toolbar`'s "ارزش به تومان" label and `AssetSortMenu` swapped order (label now renders first in markup), which — in this RTL row — moves the three-dot sort-menu icon to sit directly beside "تومان" at the label's own left end. Verified via Playwright/Firefox: toolbar shows exactly 3 icon buttons (no "افزودن دارایی جدید") with the add-transaction button's SVG confirmed as `PlusIcon`; `AssetRow`'s "+" button SVG likewise confirmed as `PlusIcon` and still opens `RecordTransactionModal`; zero `aria-label="ویرایش"` buttons remain; the sort-menu icon's bounding box sits left of (before, in RTL) the label's; searching an unowned catalog asset ("نیم سکه") shows exactly one "دارایی جدید"-badged result, selecting it opens `RecordTransactionModal` defaulting to خرید, and after submitting a خرید of quantity 3 the asset persists in `localStorage` with `code: 'COIN-HALF'`/`quantity: 3` and appears as a normal (now unbadged, owned) row on a second search; searching an already-owned legacy-coded sample ("تتر") still shows no badge (confirming the name-fallback); against a fully empty wallet the picker opens with no warning toast, shows the inline hint, and successfully creates+selects a new asset at `quantity: 0`; a no-match search still shows "دارایی‌ای پیدا نشد". `npm run build` (typecheck + vite build) passes. |
| 2026-09-26 | Owner-requested (see §6ab): put the "کیف پول"/"چشم بازار" tab switcher + that tab's own header row (`Toolbar` on wallet, `MarketWatchList`'s own "+"/"بروزرسانی" row on market) inside one white card below the 1050px breakpoint — previously the assets `<section>` only got its card styling (`bg-white`/`border`/`rounded-[22px]`/`p-[22px]`) at `min-[1050px]:`, so on mobile the switcher/header row rendered naked on the gray page background, unlike `SummaryCard`/`PortfolioTrendChart` above them. New `src/components/SectionTabs.tsx` (the tab-switcher markup moved out of `App.tsx` unchanged, now taking `{ activeTab, onChange }` props, bottom margin `mb-[15px]`→`mb-[12px]` on mobile) and new `src/components/SectionHeaderCard.tsx` (a wrapper `<div>` whose card styling — reusing `SummaryCard`/`PortfolioTrendChart`'s exact large-card tokens — applies ONLY via Tailwind v4's `max-[1050px]:` variant, the exact complement of the section's own `min-[1050px]:` classes; renders nothing at all at ≥1050px, where the outer section is already the card). `App.tsx`'s wallet branch now renders `<SectionHeaderCard><SectionTabs/><Toolbar/></SectionHeaderCard>` followed by the existing asset list outside the card; the market branch passes `<SectionTabs/>` as a new `tabs?: ReactNode` prop into `MarketWatchList`, which wraps `{tabs}` + its own header row in `<SectionHeaderCard>` in both its loading and populated returns (the loading state previously showed no tabs at all — also fixed). `Toolbar.tsx`'s and `MarketWatchList`'s own header rows dropped their mobile `mb-[15px]` (kept `min-[1050px]:mb-[19px]`) since `SectionHeaderCard`'s own `max-[1050px]:mb-[15px]` now provides that mobile gap instead, avoiding a doubled margin. The asset/market item lists themselves stay OUTSIDE the card (each row is already its own card). Verified via Playwright/Chrome at 320/340/360/390/480/800/1200px, both tabs: below 1050px the switcher+header row sit inside one visually distinct white rounded card with the item lists below it at a normal gap; no horizontal overflow at any width; the assets `<section>`'s bounding-box top measured identical before/after a tab switch at 390px (no layout jump); 1200px screenshots taken before (via `git stash` to the pre-change code) and after this change are structurally identical (single card, same spacing, no nested/doubled card). `npm run build` (typecheck + vite build) passes. |
| 2026-09-26 | Owner-requested (see §6ac): split the old single "wallet" tab (which actually rendered the investment/asset list) into a renamed **"investment" (سرمایه‌گذاری)** tab that now holds that exact asset-list content, plus a brand-new **"wallet" (کیف پول)** placeholder tab whose real content (cash/bank-account tracking) is built in a follow-up task. The tab switcher went from 2 buttons (`grid-cols-2`) to 3 (`grid-cols-3`) in the order **سرمایه‌گذاری** (new `InvestmentIcon`, bag/coin glyph) / **چشم بازار** (unchanged `MarketEyeIcon`) / **کیف پول** (`WalletIcon`, moved here from the old first button). `SectionTab` is now `'investment' \| 'market' \| 'wallet'` (`SectionTabs.tsx`); `App.tsx`'s state is now `useState<SectionTab>('market')` (default tab unchanged — still "چشم بازار"), `onOpenWallet` (the top-left icon button on the "ارزش کل دارایی" card) now targets `'investment'` instead of `'wallet'` so it keeps opening the asset list, the section's `aria-label` handles all 3 states, and the section's conditional render became a 3-way branch: `investment` = the exact pre-existing asset-list JSX (unchanged), `market` = the exact pre-existing `MarketWatchList` (unchanged), `wallet` = a temporary `SectionHeaderCard` holding just `<SectionTabs/>` + a centered placeholder paragraph ("به‌زودی — پیگیری حساب‌های نقدی این‌جا اضافه می‌شود") reusing the empty-state muted text style — to be replaced by a real component in the next task. Part 1 of a 3-task sequence. `npm run build` (typecheck + vite build) passes. |
| 2026-09-27 | Owner-requested (see §6ad, part 2 of the 3-task sequence from §6ac): replaced the "کیف پول" (wallet) tab's placeholder with a real, fully dynamic list of the owner's cash/bank accounts (e.g. "نقد", "کارت بانک ملی" — spendable cash balances, deliberately unrelated to the `cash`-icon catalog asset and NOT folded into the "ارزش کل دارایی" total; that's part 3). New `src/services/walletService.ts` (`WalletAccount = { id, name, balance }` — `balance` a plain toman amount — + `WalletService` interface: `listAccounts(): Promise<WalletAccount[] \| null>`, `addAccount`/`updateAccount`/`deleteAccount` all returning the full updated list) and `src/services/localWalletService.ts` (localStorage-backed, mirrors `localAssetService`; account IDs are a manual UUID v4 from `crypto.getRandomValues()`, NOT `crypto.randomUUID()` — the latter is `[SecureContext]`-only/undefined on the plain-HTTP deployment, the same reason `localAuthService` generates user IDs this way, §6g). New `src/walletStorage.ts` (`loadWalletAccounts`/`saveWalletAccounts`, key `oracle_wallet_accounts_v1`, same try/catch-safe null-on-missing convention as `src/storage.ts`). New `src/components/WalletTab.tsx` (props `{ tabs, accounts: WalletAccount[] \| null, onAccountsChanged }`, mirroring `MarketWatchList`'s `tabs` prop): `SectionHeaderCard` (`{tabs}` + header row with the "افزودن حساب" `PlusIcon` button on the right / "حساب‌های نقدی" label on the left) + a `<ul>` of rows reusing `AssetRow`'s exact card tokens with a cash-tinted `AssetIcon`, `format(balance)` + "تومان", and ghost pencil (`ویرایش`)/danger-trash (`حذف` — immediate, no confirmation, the §6r lighter-weight convention) buttons — or the "هنوز حسابی ثبت نشده" empty state, or a "در حال بارگذاری..." line while `accounts` is still `null`. One shared inner add/edit modal (shelled like `RecordTransactionModal`: backdrop/Escape/"×"/`stopPropagation`, `stripToNumberString`/`formatWithThousands` numeric input) validates name/balance client-side with red error toasts, calls the matching `walletService` method, toasts success (green) / failure (red), and closes only on success. `App.tsx` gained `walletAccounts: WalletAccount[] | null` state + a mount-time `walletService.listAccounts()` effect (`null` → `[]`), and the wallet branch now renders `<WalletTab .../>` instead of the placeholder; the `investment`/`market` branches, `SummaryCard`, and the portfolio total are completely unchanged. `README.md`'s two-tab description updated to the three-tab one incl. the wallet behavior. `npm run build` (typecheck + vite build) passes. |
| 2026-09-27 | Owner-requested (see §6ae, part 3 of the 3-task sequence from §6ac — **closes the sequence**): the "ارزش کل دارایی" grand total now includes the "کیف پول" wallet accounts — `App.tsx` gained `const walletTotal = (walletAccounts ?? []).reduce((sum, account) => sum + account.balance, 0);` (the `?? []` guard is required because `walletAccounts` is `WalletAccount[] \| null` until the mount-time load resolves — the suggested bare `.reduce` would fail `tsc`) and `<SummaryCard total={total} .../>` became `<SummaryCard total={total + walletTotal} .../>`. Display-only and `App.tsx`-only: the investment `total` const is unchanged in name/value and still feeds the portfolio-history snapshot effect (and `PortfolioTrendChart`) investment-only, so the trend chart's series stays comparable to the snapshots already recorded; `SummaryCard.tsx` is untouched and derives its دلار/طلا footer lines and the hide-balance masking from the same `total` prop, so the combined value propagates automatically; `WalletTab`/`walletService`/`localWalletService`/`walletStorage` are all untouched. `README.md`'s "not counted in the total" sentence updated accordingly. `npm run build` (typecheck + vite build) passes. |
| 2026-09-27 | Owner-requested (see §6af, builds on §6ad): two "کیف پول" tab additions — (1) optional bank-detail fields on accounts: `WalletAccount` gained `bankName?`/`cardNumber?`/`accountNumber?`/`shebaNumber?` (all optional strings — the `addAccount`/`updateAccount` `Omit`/`Partial<Omit<…,'id'>>` signatures needed no change, `localWalletService`/`walletStorage` untouched), the add/edit `WalletAccountModal` gained four plain-text optional inputs between نام حساب and موجودی (no digit-grouping, never block submit; trimmed + stored `undefined`-not-`''` when blank), `handleAccountSubmit`/`onSubmit` pass all four through to both service methods, and each account row renders the present fields as small muted `text-[11px] text-[#9096aa]` lines under the name (tabular-nums + wrap for the three number fields; blanking a field on edit genuinely clears it because `updateAccount`'s spread overwrites with `undefined`, which `JSON.stringify` drops). (2) One-time default account: `App.tsx`'s mount-time wallet effect now branches on `listAccounts()` — `null` (never saved before) → `addAccount({ name: 'نقدی', balance: 0 })` whose returned list becomes the initial state (persisted, so the key is never missing again); any stored array (even `[]`) → used as-is (a `walletSeededRef` guard dedupes the dev-only StrictMode double run, which would otherwise seed twice) — so a fresh browser shows exactly one "نقدی" account (0 تومان) immediately, and deleting it never re-seeds it. `SummaryCard`, the grand-total calculation (§5/§6ae), and the investment/market tabs are unchanged. `AI-KNOWLEDGE.md`/`README.md` updated. `npm run build` (typecheck + vite build) passes. |
| 2026-09-27 | Owner-requested (see §6ag, builds on §6ad/§6af): added the **wallet-transaction data/service foundation — no UI, nothing visibly changes in the app**: new `src/types/walletTransaction.ts` (`WalletTransactionType = 'increase' \| 'decrease' \| 'replace'`; `WalletTransaction = { id, accountId, type, amount, date, note? }` — a single plain-toman `amount`, no `quantity`/`unitPrice` split, since a cash/bank balance isn't priced like an asset), new `src/walletTransactionStorage.ts` (`loadWalletTransactions`/`saveWalletTransactions` under the new, collision-checked key `oracle_wallet_transactions_v1`, mirroring `transactionStorage.ts`'s try/catch-safe **`[]`-on-missing** convention — not `walletStorage.ts`'s null-on-missing, since a transaction log has no "never saved" signal to preserve), new `src/services/walletTransactionService.ts` (`WalletTransactionService` interface — `listTransactionsForAccount`/`addTransaction`/`deleteTransactionsForAccount` only, deliberately no `updateTransaction`/single-`deleteTransaction`, matching the investment side's append/bulk-clear-only usage) + `src/services/localWalletTransactionService.ts` (validates `amount > 0` for increase/decrease and `amount >= 0` for replace, mirroring `localTransactionService`'s quantity check; `deleteTransactionsForAccount` removes only the targeted `accountId`'s rows). **UUID note**: `crypto.randomUUID()` is `[SecureContext]`-only and unavailable on the plain-HTTP deployment, so instead of copying it the previously duplicated manual-UUID helpers (`localWalletService.generateWalletAccountId`, `localAuthService.generateUserId`) were de-duplicated into a new shared `src/uuid.ts` `generateUuidV4()`, which both wallet services use; `localWalletService.ts` was re-pointed at the shared util and `localAuthService.ts` left untouched (out of scope). `localTransactionService.ts` still calls `crypto.randomUUID()` directly — pre-existing issue, explicitly out of scope, not copied. Account-deletion → transaction-cleanup wiring is deliberately NOT done yet (no UI writes wallet transactions yet) and belongs to the follow-up wallet-history task. `walletService.ts`, `WalletTab.tsx`, `App.tsx`, and all investment-side files are untouched; README unchanged (no user-visible behavior). Verified with a throwaway esbuild+Node script under a simulated non-secure context (`crypto.randomUUID` forced to throw, shimmed `localStorage`): persistence under the new key, valid v4 ids, per-account listing, targeted-only bulk delete, and all validation rules; plus a `localWalletService` smoke test after the re-point. `npm run build` (typecheck + vite build) passes. |
| 2026-09-27 | Owner-requested (see §6ah, builds on §6ad/§6ag): added the **"ثبت تراکنش" (record-transaction) action on wallet accounts** — the wallet-side equivalent of the investment per-row "+" button. New `src/components/RecordWalletTransactionModal.tsx` closely mirrors `RecordTransactionModal` (same shell — backdrop/Escape/"×"/`stopPropagation` — and the same 3-way active-color toggle, but with wallet labels افزایش green `#1f9d55` / کاهش red `#d95050` / جایگذاری amber `#d7a144`) and is simplified to a single toman **amount** field (`formatWithThousands`/`stripToNumberString`, label flips to "مبلغ جدید به تومان" on replace) + date (`todayLocalIso()` default) + optional note — **no unit-price field** (a cash/bank balance isn't priced like an asset). On submit it validates the amount client-side (finite `> 0` for increase/decrease, `>= 0` for replace; non-empty date), then does **two writes together**: `walletTransactionService.addTransaction({ accountId, type, amount, date, note })` (append to the log) AND `walletService.updateAccount(account.id, { balance })` with `balance` = increase `balance + amount`, decrease `Math.max(0, balance - amount)` (floored at 0, matching the investment sell), or replace `amount` (set directly); on success it toasts `تراکنش ثبت شد` (same phrasing as `RecordTransactionModal`) and pushes the returned full account list up via `onTransactionRecorded`, then closes (error toast + stays open on failure). `WalletTab.tsx` added a `PlusIcon` ghost `IconButton` (`ariaLabel="ثبت تراکنش"`, `tone="neutral" variant="ghost"`) as the first of each row's three action buttons, backed by a new `recordFor` state that renders the modal wired to the existing `onAccountsChanged`, so the row's balance updates immediately without a reload and the "ارزش کل دارایی" grand total (derived from `walletAccounts` in `App.tsx`) reflects it automatically — `SummaryCard` and that calculation were NOT touched. The wallet-transaction history UI was added later in §6ai; the data is retrievable via `walletTransactionService.listTransactionsForAccount`. The investment and market tabs are unchanged. Verified with a throwaway esbuild+Node script (shimmed `localStorage`, `crypto.randomUUID` forced to throw) replicating the modal's exact submit logic against the real services: all balance-math cases (increase/ decrease-floor-at-0 / replace-to-exact / replace-to-0), client-side validation rejections, per-account transaction retrieval, correct persistence keys (investment key untouched), and the unchanged grand-total derivation all confirmed. `npm run build` (typecheck + vite build) passes. |
| 2026-09-27 | Owner-requested (see §6ai, builds on §6ag/§6ah): added the wallet-side **per-account transaction-history modal** and wallet-only clear-history capability. New `src/components/WalletTransactionHistoryModal.tsx` mirrors the investment `TransactionHistoryModal` shell and list behavior (backdrop/Escape/"×"/`stopPropagation`, newest-first by date, 6 rows per page, same pagination footer) but displays `WalletTransaction`s as a single formatted toman amount plus date and optional note, with افزایش/کاهش/جایگذاری badges using the same green/red/amber tokens as خرید/فروش/جایگذاری. `WalletTab.tsx` now adds a `HistoryIcon` ghost button (`ariaLabel="تاریخچه"`) to each account row and opens the modal via local `historyFor` state; the modal loads its own rows via `walletTransactionService.listTransactionsForAccount(account.id)` and never relies on parent transaction state. The new "پاک کردن کل تاریخچه" button is deliberately account-scoped: it confirms with the existing `sonner` toast `action`/`cancel` pattern (`کل تاریخچه‌ی این حساب پاک شود؟`, action label `بله، پاک کن`) and on confirm calls `walletTransactionService.deleteTransactionsForAccount(account.id)`, reloads that modal to the empty state, and shows a success toast. It does **not** change `account.balance`, does **not** delete the account, does **not** close the modal, and does **not** affect other accounts' histories; this differs from the investment side, which has no per-asset clear-history action, only the broader app-level all-assets clear path. `App.tsx`, `SummaryCard`, investment tab, and market tab were untouched. `npm run build` passes. |
| 2026-09-28 | Owner-requested (see §6aj, builds on §6ad/§6af/§6ah/§6ai): the seeded "نقدی" account is now treated as a special, non-editable row, identified by the exact seeded name (`account.name === 'نقدی'` — a name match, not the random seeded `id`; a user-created account literally named "نقدی" gets the same treatment, intentionally). In `WalletTab.tsx`'s `accounts.map` row render only: (1) the `PencilIcon` "ویرایش" `IconButton` is wrapped in `{account.name !== 'نقدی' && ...}` so the seeded row shows only its three remaining action icons — تاریخچه/ثبت تراکنش/حذف — with all handlers untouched (history/record-transaction/delete still work exactly as before); (2) the row `<li>`'s className became a template literal whose only conditional is `${account.name === 'نقدی' ? 'items-center' : 'items-start'}` — because the seeded account has no bank-detail fields, its name block contains only the `<h3>`, and top alignment made the text sit high next to the internally-centered 46px round icon; centering the one line makes it line up with the icon's middle. No other class/spacing/padding/gap on the row changed, and every other account row (with or without bank details) is completely unchanged: still `items-start`, still all four icons including edit. `WalletAccountModal`, `walletService.ts`, `App.tsx`, and all other files untouched. `AI-KNOWLEDGE.md` updated (this entry + §4 file-map + new §6aj). `npm run build` (typecheck + vite build) passes. |
| 2026-09-28 | Owner-requested (see §6ak, builds on §6aj/§6af/§6ad): two "کیف پول" tab row changes, both scoped to `WalletTab.tsx`'s `accounts.map` row render. (1) The seeded "نقدی" account is now **fully locked** — identified by the exact seeded name `account.name === 'نقدی'` as before: the danger `TrashIcon` "حذف" button got the same `{account.name !== 'نقدی' && ...}` wrapper the edit button already had, so the "نقدی" row now shows exactly two action icons (تاریخچه, ثبت تراکنش) with no ویرایش and no حذف — no UI path left to edit or delete it; every other account keeps all four icons and `handleDelete` is untouched. (2) The row detail block no longer renders `cardNumber`/`accountNumber`/`shebaNumber` — its condition changed from the four-field OR to `account.bankName` alone and the block now holds only the single bank-name `<p>` (same styling); the three number fields stay on `WalletAccount`, in `WalletAccountModal`'s form, and in `handleAccountSubmit` (still collected/stored/pre-filled on edit — only the list no longer shows them). (3) Since every row is now at most 2 text lines, the §6aj per-row `items-center`/`items-start` ternary was removed in favor of a plain `items-center` on every row's `<li>` (no other class/spacing changed). `WalletAccountModal`, `walletService.ts`, `App.tsx`, `SummaryCard`, the grand-total calculation, and every other tab untouched. `AI-KNOWLEDGE.md` updated (§4 file-map, §6af row-rendering note, §6aj superseded notes, new §6ak, this entry). `npm run build` (typecheck + vite build) passes. |
| 2026-09-28 | Owner-requested (see §6al, builds on §6af/§6aj/§6ak): two "کیف پول" changes, one per file. (1) The "نقدی" seed in `App.tsx`'s mount-time wallet effect is now **self-healing** — the inner condition changed from "seed only when `listAccounts()` resolves `null`" to "seed whenever the loaded list has no account named 'نقدی'": `const current = stored ?? []; const hasDefaultCashAccount = current.some(account => account.name === 'نقدی');` then `addAccount({ name: 'نقدی', balance: 0 })` (returned list → state) when absent, else `current` as-is. This specifically covers users who deleted "نقدی" *before* it was locked in the UI (§6aj/§6ak) — their storage holds a real, non-null array without it, which the old `null`-only check would never repair. The `walletSeededRef` StrictMode-dedup guard is unchanged, so a fresh browser still gets exactly one "نقدی" with no duplicate under StrictMode's double-invoke, and a browser that already has "نقدی" is never re-seeded (no duplicates ever). The effect's comment was rewritten to document this. (2) In `WalletTab.tsx`, the rendered account list is now a **display-only** sort by `balance` descending: `const sortedAccounts = [...accounts].sort((a, b) => b.balance - a.balance);` (a copy — the `accounts` prop is never mutated), computed after the `null` guard; both the `.length === 0` empty-state check and the row `.map` use `sortedAccounts`, and no other use of `accounts` changed (modals are state-driven, `onAccountsChanged`/`walletService` still see stored order). Any balance change (add/edit/recorded transaction) re-sorts the visible list immediately without a reload; `localStorage` keeps its own stored order. `walletService.ts`, `walletTransactionService.ts`, `SummaryCard`, the grand-total calculation, and every other tab untouched. `AI-KNOWLEDGE.md` updated (§4 file-map App.tsx + WalletTab, §6af seed + acceptance notes, new §6al, this entry). `npm run build` (typecheck + vite build) passes. |
 | 2026-09-28 | Owner-requested (see §6am, builds on §6ad/§6af/§6ak/§6ai/§6ag): the "کیف پول" row's danger `TrashIcon` now **resets** an account instead of deleting it, and it is shown on the "نقدی" row too. In `WalletTab.tsx` only: (1) `walletTransactionService` is now imported; (2) `handleDelete` (which called `walletService.deleteAccount` immediately, no confirmation, and was hidden on "نقدی") is replaced by `handleResetAccount(account)`, which first shows a `sonner` toast-confirm (`موجودی و کل تاریخچه‌ی این حساب پاک شود؟` / "بله، پاک کن" / "انصراف" — the established destructive-action pattern, no separate modal; cancel is a no-op) and, on confirm, in order: `walletTransactionService.deleteTransactionsForAccount(account.id)` (wipes the account's transaction history), then `walletService.updateAccount(account.id, { balance: 0 })` (zeroes the balance only — `name`/bank fields untouched), then `onAccountsChanged(next)` with the returned full list (row balance + grand total update immediately, no reload), then `toast.success('موجودی و تاریخچه پاک شد')`; any failure → `toast.error('پاک کردن موجودی و تاریخچه انجام نشد')`. (3) The trash button now calls `handleResetAccount(account)` with `ariaLabel="صفر کردن موجودی و تاریخچه"`, and the `{account.name !== 'نقدی' && ...}` guard around it was dropped — so it renders on every account including "نقدی" (the reason for hiding it, "it deleted the account", no longer applies); the `PencilIcon` "ویرایش" button keeps its "نقدی" guard, so "نقدی" stays locked for *editing* only. `walletService.ts` keeps its `deleteAccount` method (a later task reuses it for real deletion in a separate manage-accounts view); `walletTransactionService.ts`, `WalletAccountModal`, `App.tsx`, `SummaryCard`, the grand-total calculation, and every other tab untouched. `AI-KNOWLEDGE.md` updated (§4 file-map WalletTab row, §6ak superseded note, new §6am, this entry) + `README.md` wallet paragraph. `npm run build` (typecheck + vite build) passes. |
 | 2026-09-28 | Owner-requested (see §6an, builds on §6ad/§6af/§6ak/§6am): real wallet-account add/edit/delete moved into a new **"مدیریت حساب‌ها" (manage accounts) modal**, reached from the "کیف پول" tab's header "+" button. New `src/components/ManageWalletAccountsModal.tsx` (same modal shell) lists **every** account (no balance filter — a later task will filter the main row list to non-zero balances) as simplified rows (icon, name + bank name, muted balance), each with a `PencilIcon` edit + danger `TrashIcon` **real, immediate, unconfirmed** delete — both hidden for the seeded "نقدی" account, which stays fully locked (no edit, no delete) in this view too; it also has an "افزودن حساب" `PlusIcon` button and renders the add/edit form (imported `WalletAccountModal`) as a **sibling** via a fragment (not DOM-nested) so its backdrop click doesn't bubble to the manage backdrop, with its own `Escape` guard (`modal === null`) so Escape dismisses the topmost form first, not both. In `WalletTab.tsx`: (1) the in-file `WalletAccountModal` is now **exported** (unchanged otherwise) so the manage modal imports it; (2) the header "+" `IconButton` now sets a new `isManageOpen` state (was `setModal({ account: null })`), `ariaLabel` "افزودن حساب" → "مدیریت حساب‌ها"; (3) the local `modal` state, `handleAccountSubmit`, and the `{modal && <WalletAccountModal .../>}` render were removed (moved to the manage modal, along with the §6am-removed `handleDelete`, which now again calls `walletService.deleteAccount`); the manage modal is rendered with the **full, unfiltered** `accounts` array; (4) the per-row `PencilIcon` "ویرایش" button was removed (owner decision) so each main row shows exactly تاریخچه/ثبت تراکنش/صفر کردن for every account including "نقدی". `walletService.ts`/`walletTransactionService.ts`/`WalletTransactionHistoryModal`/`RecordWalletTransactionModal`/`App.tsx`/`SummaryCard`/grand-total/other tabs untouched; the main list's row icons and the §6al display-sort are unchanged. `AI-KNOWLEDGE.md` updated (§4 file-map: WalletTab row + new ManageWalletAccountsModal row, new §6an, this entry) + `README.md` wallet paragraph. `npm run build` (typecheck + vite build) passes. |
| 2026-09-28 | Owner-requested (see §6an, dedicated follow-up to it): the redundant per-row `PencilIcon` "ویرایش" button on the "کیف پول" tab's **main** account list is now explicitly gone — every row (including the seeded "نقدی") shows exactly three action icons: `HistoryIcon` "تاریخچه", `PlusIcon` "ثبت تراکنش", and the `TrashIcon` "صفر کردن موجودی و تاریخچه" reset (§6am). Editing an account is only possible via "مدیریت حساب‌ها" (the header "+" button → `ManageWalletAccountsModal`), which is what makes the row-level pencil redundant now that that view owns edit. The code change (deleting the per-row button + its `{account.name !== 'نقدی' && ...}` guard, and dropping the now-unused `PencilIcon` from `WalletTab.tsx`'s `./icons` import) had already landed in §6an (PR #81) as part of that task's scope — so this task is a **docs-only** pass: it confirmed `WalletTab.tsx` carries zero `PencilIcon` references and that the three row icons are intact (no `WalletTab.tsx` edit was needed), and added this decision-log entry to make the per-row-edit removal a first-class decision rather than a side-note buried inside §6an. `npm run build` (typecheck + vite build) passes. |
| 2026-09-28 | Owner-requested (see §6ao, builds on §6ad/§6al/§6an/§6am): the "کیف پول" tab's **main** account list now shows only accounts with a **positive balance**, plus the seeded "نقدی" account which **always** shows regardless of its balance (including exactly 0). Display-only, `WalletTab.tsx` only: a new `const visibleAccounts = accounts.filter(account => account.balance > 0 || account.name === 'نقدی')` is computed right before the list block (same exact-name "نقدی" match convention as §6aj/§6ak/§6am), and the §6al display sort now derives from it (`[...visibleAccounts].sort((a, b) => b.balance - a.balance)`) — both the `.length === 0` empty-state check and the row `.map` still use that derived array, and the `accounts` prop itself is never mutated (filter + spread-copy only). Zero-balance accounts (other than "نقدی") are therefore hidden from the main list but still exist in storage and remain fully visible/editable/deletable in "مدیریت حساب‌ها" (§6an), which **keeps receiving the full, unfiltered `accounts` prop** — deliberately not `visibleAccounts`. Consequences: reset-to-0 (§6am) drops a non-"نقدی" account from the main list immediately (no reload); editing its balance 0→positive in "مدیریت حساب‌ها" brings it straight back; "نقدی" never leaves; the "هنوز حسابی ثبت نشده" empty state now only shows when there are genuinely zero displayable accounts (effectively never, since the self-healing "نقدی" seed guarantees ≥1 always-shown row). `ManageWalletAccountsModal.tsx`, `walletService.ts`, `walletTransactionService.ts`, `App.tsx`, `SummaryCard`, the grand-total calculation (§6ae — unaffected: a zero-balance account contributes 0 either way), and every other tab are unchanged. `AI-KNOWLEDGE.md` updated (§4 WalletTab + ManageWalletAccountsModal rows, §6an acceptance note, new §6ao, this entry). `npm run build` (typecheck + vite build) passes. |
| 2026-09-28 | Owner-requested (see §6ap, follow-up to §6ao): the "کیف پول" tab's **main** account list now **unconditionally excludes** the seeded "نقدی" account — it no longer appears there at *any* balance (neither 0 nor positive). Display-only, `WalletTab.tsx` only: the §6ao filter condition flipped from `account.balance > 0 \|\| account.name === 'نقدی'` to `account.balance > 0 && account.name !== 'نقدی'` (same exact-name match convention as §6aj/§6ak/§6am/§6ao) + the comment above it rewritten; the §6al display sort and the `sortedAccounts`-based empty-state/row render are unchanged, and the `accounts` prop is still never mutated. "نقدی" itself is untouched: still exists in storage, still self-healing on load (§6al/§6af), still listed normally in "مدیریت حساب‌ها" (§6an) — still locked there (no edit/delete icons) — and "مدیریت حساب‌ها" keeps receiving the **full, unfiltered** `accounts` array, "نقدی" included. Consequences: a positive-balance "نقدی" now contributes only to the grand total (§6ae), never to a main-list row; the "هنوز حسابی ثبت نشده" empty state can now show whenever there is no positive-balance, non-"نقدی" account (a normal state right after a fresh start, since the self-healing seed guarantees only "نقدی", which is excluded); every other positive-balance account renders exactly as before; zero-balance non-"نقدی" accounts stay hidden; reset-to-0 (0→hidden) and edit-0→positive (hidden→shown) both remain live with no reload. `ManageWalletAccountsModal.tsx`, `walletService.ts`, `walletTransactionService.ts`, `App.tsx`, `SummaryCard`, the grand-total calculation, and every other tab are unchanged. `AI-KNOWLEDGE.md` updated (§4 WalletTab + ManageWalletAccountsModal rows, §6ao behavior/acceptance supersession notes, new §6ap, this entry) + `README.md` wallet paragraph. `npm run build` (typecheck + vite build) passes. |
| 2026-09-28 | Owner-requested (see §6aq, builds on §6ad/§6af/§6an): (1) `WalletAccount` gained two optional plain-text card-PIN reminder fields, `cardPin1?`/`cardPin2?` (رمز اول/رمز دوم), so the owner can store their card's first/second PIN as a personal reminder — plain text, same trust model as the existing `cardNumber`/`accountNumber`/`shebaNumber` (single-user `localStorage`-only app). No `WalletService` signature change (the `Omit`/`Partial<Omit<…,'id'>>` params already cover them); `localWalletService`/`walletStorage` untouched (backward compatible — old accounts just lack the keys). (2) The add/edit `WalletAccountModal` (`WalletTab.tsx`) gained `formCardPin1`/`formCardPin2` states + two plain-text inputs "رمز اول"/"رمز دوم" placed right after "شماره شبا" and before "موجودی به تومان"; `onSubmit`'s type + call pass them through with the same `trim() || undefined` handling as the other optional fields (blank clears on save). (3) `ManageWalletAccountsModal.tsx`: `handleAccountSubmit`'s signature + `changes` object now pass `cardPin1`/`cardPin2` through, and each account row now renders a two-column grid of **six green/red status lines** (بانک/کارت/حساب/شبا/رمز اول/رمز دوم) via a new `statusLine(label, value)` helper — green `text-[#1f9d55]` "ثبت شده" when the field is set (non-blank after trim), red `text-[#d95050]` "ثبت نشده" when empty — the app's existing positive/negative status colors. Note: this task was framed as building on a "previous task" that had added a green/red status-line block to that modal, but **no such task/commit exists in `main` or any branch/PR history** — so this task implements the full six-line block (the four bank-detail lines + the two new PIN lines) to reach the stated six-lines end state (documented in §6aq). The main "کیف پول" list is unchanged — it still renders only name, bank name, balance, and the 3 row icons; the PIN/bank fields are never shown there. `walletTransactionService.ts`, `App.tsx`, `SummaryCard`, the grand-total calculation, and every other tab untouched. `AI-KNOWLEDGE.md` updated (§4 walletService + WalletTab + ManageWalletAccountsModal rows, new §6aq, this entry) + `README.md` wallet paragraph. `npm run build` (typecheck + vite build) passes. |
| 2026-09-28 | Owner-requested (see §6ar, follow-up to §6an): layout fix to the "مدیریت حساب‌ها" (`ManageWalletAccountsModal.tsx`) header only. The header's "×" close button was `absolute top-4 left-4` while the "افزودن حساب" "+" `IconButton` sat in a separate `flex ... justify-between` row below it with `pr-1 pl-10` offset padding (to keep the "+" clear of the absolutely-positioned "×") — which left the "+" visibly lower and misaligned relative to the "×" instead of both sharing the title's line. Replaced both with a **single** `flex items-center justify-between gap-3 mb-4` header row: the "مدیریت حساب‌ها" `<h2>` title flush right, and a `flex items-center gap-2` group on the left holding the "+" `IconButton` then the "×" `button` — the close button dropped its `absolute top-4 left-4` (keeping its `text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors` look) and the row dropped the `pr-1 pl-10` offset, so no `absolute`/`top-4`/`left-4`/`pr-1`/`pl-10` remains on or around these two buttons; the header now sits flush to the section's own `p-5`/`p-4` padding, matching the account rows below. Behavior unchanged: "+" still `setModal({ account: null })` (opens `WalletAccountModal` add mode), "×" still `onClose`, Escape still works (`modal === null` guard). Deliberate, owner-scoped divergence from the app-wide absolute-"×" modal convention — **only this modal** changed; every other modal keeps its absolute "×". `WalletTab.tsx`, `walletService.ts`, and every other file untouched. `AI-KNOWLEDGE.md` updated (§4 ManageWalletAccountsModal row, new §6ar, this entry). `npm run build` (typecheck + vite build) passes. **Superseded by the next entry.** |
| 2026-09-28 | Owner-requested (see §6as, supersedes §6ar): the "مدیریت حساب‌ها" (`ManageWalletAccountsModal.tsx`) close button was **reverted to the app-wide standard** — every modal in the app (`ImportModal`, `ProfileModal`, `RecordTransactionModal`, `TransactionHistoryModal`, `RecordWalletTransactionModal`, `WalletTransactionHistoryModal`, `SelectAssetForTransactionModal`, `AddMarketWatchItemModal`, `ForgotPasswordModal`, `SideDrawer`, and `WalletTab.tsx`'s `WalletAccountModal`) uses a standalone absolutely-positioned "×" pinned to the top-left corner with the exact classes `absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors`, and §6ar had made this modal the one exception by combining the "×" inline next to the "+" `IconButton` in a single flex row. `ManageWalletAccountsModal.tsx` (only file changed) is now back to the two-piece structure it had before §6ar: the "×" is again its own `absolute top-4 left-4` corner button (identical classes to every other modal, hover state included), and the title/"+" row is again `flex items-center justify-between gap-3 mb-4 pr-1 pl-10` — the `pl-10` is deliberate clearance so the title/"+" row (RTL: "+" on the left) does not visually collide with the corner "×". Nothing else in this modal changed (green/red status lines, account rows, empty state, handlers, Escape guard all untouched), and no other modal was touched (they already follow the convention). Standing rule for future work: **"+" and "×" must not be combined in this app's modal headers** — one absolute corner "×" per modal, header actions in their own row. `AI-KNOWLEDGE.md` updated (new §6as with §6ar supersession note, §4 ManageWalletAccountsModal row rewritten, this entry). `npm run build` (typecheck + vite build) passes. |
| 2026-09-28 | Owner-requested (see §6at, builds on §6as): layout change to the "مدیریت حساب‌ها" (`ManageWalletAccountsModal.tsx`) header only — the "افزودن حساب" "+" `IconButton` was moved out of the title's `flex ... justify-between` row onto **its own row directly below the title, right-aligned**. `ManageWalletAccountsModal.tsx` (only file changed): the title/"+" row `flex items-center justify-between gap-3 mb-4 pr-1 pl-10` became two rows — (1) a `mb-4 pr-1 pl-10` wrapper holding only the "مدیریت حساب‌ها" `<h2>` (the `pl-10` clearance that keeps the title clear of the absolute corner "×" is kept on the title row), and (2) directly below it a `flex mb-4` row whose single child is the "افزودن حساب" `PlusIcon` `IconButton`; because the app is RTL (`dir="rtl"` on `<html>`), a plain flex row's start side is the right, so the button sits right-aligned with no extra alignment class. The button's look, icon, `onClick={() => setModal({ account: null })}`, and `ariaLabel="افزودن حساب"` are unchanged — only its position moved. The "×" close button is exactly as §6as left it (standalone `absolute top-4 left-4`, untouched), and the §6as standing rule still holds: "+" and "×" are never combined in this app's modal headers. Nothing else in this modal changed (green/red status lines, account rows, empty state, handlers, Escape guard all untouched), and no other modal was touched. `AI-KNOWLEDGE.md` updated (§4 ManageWalletAccountsModal row, new §6at with §6as supersession-in-layout-detail note, this entry). `npm run build` (typecheck + vite build) passes. |
| 2026-09-28 | Owner-requested (see §6au, supersedes §6ap): the visibility of the seeded "نقدی" account was **inverted** across the two wallet views — (1) `WalletTab.tsx`'s display-only `visibleAccounts` filter flipped from `account.balance > 0 && account.name !== 'نقدی'` (§6ap) back to `account.balance > 0 \|\| account.name === 'نقدی'` (the §6ao form), so "نقدی" now **always** renders in the main "کیف پول" list at any balance (including 0), sorted among the rest by the existing balance-descending sort (§6al); (2) `ManageWalletAccountsModal.tsx` gained a new display-only `listedAccounts = accounts.filter(account => account.name !== 'نقدی')` used for both the empty-state check and the row `.map`, so "نقدی" **never** appears in "مدیریت حساب‌ها" anymore (it still receives the full, unfiltered `accounts` prop; the per-row `account.name !== 'نقدی'` edit/delete guards were left as defensive no-ops). "نقدی" itself is otherwise unchanged: still in storage, still self-healing on load (§6al/§6af), still counted in the grand total (§6ae). Side effect (accepted, restoring pre-§6ap behavior): the main-list row icons (تاریخچه/ثبت تراکنش/صفر کردن) render on the "نقدی" row at every balance again, so there is again a UI path to record/reset its balance. Every other account behaves exactly as before in both views; no storage/service/type changes. `AI-KNOWLEDGE.md` updated (§4 WalletTab + ManageWalletAccountsModal rows, §6am/§6ao supersession notes, §6ap marked SUPERSEDED, new §6au, this entry) + `README.md` wallet paragraph. `npm run build` (typecheck + vite build) passes. |
| 2026-09-28 | Owner-requested (see §6av, builds on §6aq/§6au): the six green/red detail lines under each account in "مدیریت حساب‌ها" (`ManageWalletAccountsModal.tsx` only) now show the field's **actual stored value** instead of the static "ثبت شده"/"ثبت نشده" wording from §6aq — the `statusLine(label, value)` helper's value span renders `{set ? value : '—'}` (same `set` rule: non-blank after trim; same green `text-[#1f9d55]` / red `text-[#d95050]` classes, same row/label layout, same `text-[11px] font-medium`). Empty fields show a neutral red "—" placeholder; the words "ثبت شده"/"ثبت نشده" no longer appear in this modal. Sensitive values (card number, account number, sheba, both PINs) are shown as plain text here — explicitly accepted by the owner as the same trust model as the rest of this single-user `localStorage`-only app. Same six fields, same order (بانک/کارت/حساب/شبا/رمز اول/رمز دوم), same two-column grid. Display-only: `WalletAccount`, `walletService`, `localWalletService`, `walletStorage`, `WalletTab.tsx` (main list + `WalletAccountModal` add/edit form), `App.tsx`, the grand total, and every other tab untouched. `AI-KNOWLEDGE.md` updated (§4 ManageWalletAccountsModal row, §6aq status/acceptance supersession notes, new §6av, this entry) + `README.md` wallet paragraph. `npm run build` (typecheck + vite build) passes. |
| 2026-09-28 | Owner-requested (see §6aw, builds on §6an/§6aq/§6au): each account row in "مدیریت حساب‌ها" (`ManageWalletAccountsModal.tsx`) gained a new **"ارسال مشخصات" (send/copy details)** ghost icon button, placed between the pencil "ویرایش" and the danger "حذف" buttons, that copies the account's shareable details to the clipboard as a plain-text block (ready to paste e.g. into Telegram). `icons.tsx` gained a new `SendIcon` (paper-plane/send glyph, same stroke style). The new `handleCopyDetails(account)` resolves the logged-in user's full name via `authService.getCurrentUser()` (the same source `App.tsx` uses — no new field invented), builds the block with one trimmed line per non-empty value in the order [user full name, `bankName`, `cardNumber`, `accountNumber`, `shebaNumber`] (empty lines skipped — no empty labels printed), and copies it via `navigator.clipboard.writeText(...)`; on success `toast.success('مشخصات کارت کپی شد')`, on a failed/rejected write (try/catch) `toast.error('کپی مشخصات انجام نشد')`. The button renders on **every** row with no "نقدی" guard (it does not special-case "نقدی"; in practice it only shows on real accounts because §6au already filters "نقدی" out of `listedAccounts`). The two card-PIN fields (`cardPin1`/`cardPin2`) are **never** included in the copied text (personal reminders, not for sharing). No storage/service/type/form changes: `WalletAccount`, `walletService`/`localWalletService`/`walletStorage`, `WalletTab.tsx` (main list + `WalletAccountModal`), `App.tsx`, `SummaryCard`, the grand total, and every other tab untouched. `AI-KNOWLEDGE.md` updated (§4 `ManageWalletAccountsModal` + `icons.tsx` rows, new §6aw, this entry) + `README.md` wallet paragraph. `npm run build` (typecheck + vite build) passes. |
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
