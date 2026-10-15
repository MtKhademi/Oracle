---
description: Execute the next Oracle frontend task and stop for frontend acceptance before commit
subagent: false
---

Execute exactly one task from `docs/tasks/tasks.md`.

Optional argument: `$ARGUMENTS`

Accept no argument or one exact task ID such as `ORA-FE-AUTH-CONTEXT`. With no argument, select the first `planned` row in table order whose local dependencies are all `done` and whose backend gate is `review` or `done`.

1. Resolve the parent directory of this Git root and require sibling Git roots named exactly `Atlas` and `Atlas.Admin`. Expected layout: `<root>/Atlas`, `<root>/Atlas.Admin`, `<root>/Oracle`. If either sibling is absent or not a Git repository, report the exact expected path and stop before changing anything.
2. Read `AGENTS.md`, `TASK-WORKFLOW.md`, `AI-KNOWLEDGE.md`, `README.md`, `src/assets.ts` and `docs/tasks/tasks.md` completely before implementation.
3. Confirm Git root, branch and status. Preserve unrelated local changes; never stash, reset, clean or discard user work.
4. Stop if the selected task is `done` or a local dependency is unfinished. Read its backend gate in `../Atlas/docs/tasks/tasks.md`; continue only when that task is `review` or `done`, otherwise report the exact blocking backend task.
5. Create or recover `feature/<id-lowercase>-<branch-slug>` from an updated `main` without overwriting local work, then change only the selected row to `in_progress`.
6. Implement only the selected task using the existing service layer, auth storage, RTL design system and backend contracts. Keep credentials, tokens and private financial data out of logs and source control.
7. Update `AI-KNOWLEDGE.md` and `README.md` when behavior or durable decisions change.
8. Run `npm run typecheck` and `npm run build`, fix in-scope failures, review the full diff, then start `npm run dev` and open the relevant route for visual and functional testing.
9. Change only the selected row to `review`. Report behavior, files, checks, backend gate, preview URL, risks, branch and proposed commit message, then wait for frontend behavior acceptance.
10. Do not commit, push or open a pull request before acceptance. After acceptance, mark the task `done`, commit, push without force and open a pull request to `main`.

Never start a second task in the same invocation.
