# Oracle development

See TASK-WORKFLOW.md for the required step-by-step process to follow for every task.
Follow `.claude/skills/task-workflow/SKILL.md` for how to execute every task.
For queued work, `/task-run` uses `docs/tasks/tasks.md` and requires the sibling repositories `../Atlas` and `../Atlas.Admin` before it may start.

- Plain React + TypeScript + Vite web app. Persian RTL; responsive mobile and desktop.
- Work in one agent. Read README.md and src/assets.ts before changing behavior.
- User explicitly wants ONLY a toman total and one row per asset. Do not add forms, charts, imports, navigation, backend, native app tooling or other features unless asked.
- Use light grey, white cards and blue/violet accents matching the supplied references.
- Static sample values must be clearly identified as samples, never as real holdings or live prices.
- Never commit private financial data or credentials.
- Update README.md when behavior changes. Run npm run build before delivery.
- Read AI-KNOWLEDGE.md for full app context, constraints, and the agent playbook.

## Governance

- Owner (approver): MtKhademi (GitHub).
- Admin (maintainer): the AI agent working in this repo, alongside the owner.
- Progress this app only with the owner. For queued solo development, work directly on a clean, updated `main`, leave the feature running for owner testing, and commit/push only after explicit acceptance. Never force-push.
- Keep AI-KNOWLEDGE.md current whenever behavior, structure, or decisions change.
