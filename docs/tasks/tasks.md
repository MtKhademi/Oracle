# Oracle frontend task queue

This queue coordinates with the sibling backend at `../Atlas`. Login and password recovery already exist and are recorded as done rather than reimplemented.

| ID | Slug | Status | Dependencies | Backend gate |
| --- | --- | --- | --- | --- |
| ORA-FE-LOGIN | server-login | done | - | done: existing login contract |
| ORA-FE-FORGOT | forgot-reset-password | done | ORA-FE-LOGIN | `IAM-04` |
| ORA-FE-AUTH-CONTEXT | product-aware-auth | planned | ORA-FE-LOGIN | `IAM-06` |
| ORA-FE-ACCESS-GATE | oracle-access-gate | planned | ORA-FE-AUTH-CONTEXT | `ORA-ACCESS-01` |

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
