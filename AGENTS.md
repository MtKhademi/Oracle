# Darayi development

- Persian mobile-first native Expo app. Keep UI RTL, bundled Persian fonts, amounts in toman.
- Work in one agent. Keep the first version simple and entirely local; no backend, auth or market API.
- Read README.md and src/domain.ts before changing behavior.
- Never commit personal spreadsheets, account data or credentials.
- Demo data is illustrative and must never be persisted as the user's holdings automatically.
- Imports are explicit-preview upserts by stable ID; reject the whole input on validation errors.
- Persist before showing success. Do not replace unreadable storage with an empty portfolio.
- Keep blank cost basis distinct from zero; profit must not include unknown purchase costs.
- Update README.md when scope or import format changes. Run typecheck, domain tests and an export before delivery.
