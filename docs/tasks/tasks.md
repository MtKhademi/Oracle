# Oracle frontend task queue

This queue coordinates with the sibling backend at `../Atlas`. Login and password recovery already exist and are recorded as done rather than reimplemented.

| ID | Slug | Status | Dependencies | Backend gate |
| --- | --- | --- | --- | --- |
| ORA-FE-LOGIN | server-login | done | - | done: existing login contract |
| ORA-FE-FORGOT | forgot-reset-password | done | ORA-FE-LOGIN | `IAM-04` |
| ORA-FE-AUTH-CONTEXT | product-aware-auth | done | ORA-FE-LOGIN | `IAM-06` |
| ORA-FE-ACCESS-GATE | oracle-access-gate | done | ORA-FE-AUTH-CONTEXT | `ORA-ACCESS-01` |
| ORA-FE-CONTRACT-AUDIT | backend-contract-audit | done | ORA-FE-ACCESS-GATE | `UA-02`..`BA-04`, `MD-05` |
| ORA-FE-LIVE-PRICES | live-market-prices | in progress | ORA-FE-CONTRACT-AUDIT | `MD-05` |
| ORA-FE-HOLDINGS | server-backed-holdings | planned | ORA-FE-CONTRACT-AUDIT | `UA-02`..`UA-05` |
| ORA-FE-BANK-ACCOUNTS | server-backed-bank-accounts | planned | ORA-FE-CONTRACT-AUDIT | `BA-01`..`BA-04` |
| ORA-FE-WATCHLIST | server-backed-watchlist | planned | ORA-FE-CONTRACT-AUDIT | `ORA-WATCHLIST-01` |
| ORA-FE-PORTFOLIO-SUMMARY | portfolio-summary | planned | ORA-FE-HOLDINGS, ORA-FE-LIVE-PRICES | `ORA-PORTFOLIO-01` |
| ORA-FE-PORTFOLIO-PERFORMANCE | portfolio-performance | planned | ORA-FE-PORTFOLIO-SUMMARY | `ORA-PORTFOLIO-02` |
| ORA-FE-TRANSACTION-HISTORY | server-transaction-history | planned | ORA-FE-HOLDINGS | backend transaction contract |
| ORA-FE-REPORT-EXPORT | portfolio-report-export | planned | ORA-FE-PORTFOLIO-PERFORMANCE | `ORA-REPORT-01` |
| ORA-FE-SESSION-RELIABILITY | session-and-request-observability | planned | ORA-FE-ACCESS-GATE | `X-Log-System-Id` |

## ORA-FE-AUTH-CONTEXT — Product-aware authentication

- Adapt existing registration/login requests to the backend contract delivered by `IAM-06`.
- Preserve the current Persian login, registration and forgot-password experiences; do not redesign or duplicate them.
- Store only the returned session data required by the existing server-backed auth service.
- Never infer Oracle entitlement from a successful password check.
- Handle backward-compatible sessions deterministically and keep credentials/tokens out of logs.
- Verify with `npm run typecheck` and `npm run build`.

## ORA-FE-ACCESS-GATE — Oracle access bootstrap

- After authentication, call `GET /oracle/api/access/me` before loading any portfolio or market feature.
- Show a dedicated Persian access-denied state for authenticated accounts without active Oracle access.
- Treat `401` as session expiry and `403` as missing Oracle entitlement; do not collapse them into one message.
- Do not load or briefly reveal user-scoped Oracle data before the access check succeeds.
- Preserve existing health-check and backend-unavailable behavior.
- Verify with `npm run typecheck` and `npm run build`.

## ORA-FE-CONTRACT-AUDIT — Backend contract audit

Create one typed API boundary for every backend-backed Oracle feature.

- Inventory every request/response against the current Atlas contracts and remove stale local fallback assumptions from active development mode.
- Centralize authenticated requests, 401 session expiry, 403 product-access denial, 404 empty-state handling and `X-Log-System-Id` capture.
- Keep local-only features explicitly marked as local until their backend contract exists.
- Verify with `npm run typecheck` and `npm run build`.

## ORA-FE-LIVE-PRICES — Live market prices

Make the authenticated market-price feed a first-class Oracle service.

- Consume `GET /oracle/api/market/prices` with the user's selected catalog symbols.
- Show quote freshness, unavailable and stale states without generating fallback prices.
- Deduplicate refreshes and handle 401/403/404 consistently.
- Verify with `npm run typecheck` and `npm run build`.

## ORA-FE-HOLDINGS — Server-backed holdings

Complete the current-user holdings flow against the Oracle API.

- Use the authenticated `/oracle/api/me/assets` contracts for list/create/update/delete.
- Keep asset identity tied to server catalog symbols and never mix another user's state into local storage.
- Preserve safe loading, empty, validation, conflict and session-expiry states.
- Verify with `npm run typecheck` and `npm run build`.

## ORA-FE-BANK-ACCOUNTS — Server-backed bank accounts

Keep bank-account identity and masked details synchronized with the backend.

- Use the `/oracle/api/me/bank-accounts` contracts and preserve local-only wallet metadata only where explicitly documented.
- Never send masked values back as full values and never expose secrets in logs or UI errors.
- Handle default-account, conflict, validation and unauthorized states.
- Verify with `npm run typecheck` and `npm run build`.

## ORA-FE-WATCHLIST — Server-backed market watchlist

Move the personal market watchlist from browser-only storage to its dedicated backend contract.

- Preserve the existing picker UX while synchronizing add/remove operations for the current user.
- Handle duplicate, size-limit, empty and offline states without silently losing selections.
- Use server catalog symbols as the stable identity.
- Verify with `npm run typecheck` and `npm run build`.

## ORA-FE-PORTFOLIO-SUMMARY — Portfolio summary

Render the backend portfolio summary when `ORA-PORTFOLIO-01` is delivered.

- Consume server-calculated valuation and profit/loss; do not duplicate financial calculations in the browser.
- Show stale-price and empty-portfolio states clearly and preserve the one-row-per-asset design constraint.
- Verify with `npm run typecheck` and `npm run build`.

## ORA-FE-PORTFOLIO-PERFORMANCE — Portfolio performance

Render bounded historical portfolio performance from the backend time series.

- Use the server's timezone, date bounds and freshness semantics.
- Keep the UI readable on mobile and do not invent missing points.
- Verify with `npm run typecheck` and `npm run build`.

## ORA-FE-TRANSACTION-HISTORY — Server transaction history

Replace browser-only asset transaction history after the backend transaction read contract is delivered.

- Use server ordering and pagination; preserve the existing history modal only as presentation.
- Handle empty, unavailable and partial-history states honestly.
- Do not write directly to local storage as a second source of truth.

## ORA-FE-REPORT-EXPORT — Portfolio report export

Add a safe download flow for the backend portfolio report contract.

- Respect server content type, filename, date bounds and authorization.
- Do not calculate or assemble financial report data from browser-local fragments.
- Verify download errors and session expiry.

## ORA-FE-SESSION-RELIABILITY — Session and request observability

Make request failures diagnosable without exposing credentials.

- Capture and surface `X-Log-System-Id` in safe error states and support references.
- Keep access tokens, passwords, reset codes and financial secrets out of logs and telemetry.
- Distinguish session expiry, missing Oracle access, backend unavailable and validation errors.
