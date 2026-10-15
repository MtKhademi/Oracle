---
description: Execute the next Oracle frontend task and stop for frontend acceptance before commit
---

Execute exactly one task from `docs/tasks/tasks.md`. Optional exact task ID: `$ARGUMENTS`.

With no argument, select the first `planned` task whose local dependencies are `done` and whose backend gate is `review` or `done`.

1. Require sibling Git roots `../Atlas` and `../Atlas.Admin`; report the exact missing path and stop before changes if the three-repository layout is incomplete.
2. Read `AGENTS.md`, `TASK-WORKFLOW.md`, `AI-KNOWLEDGE.md`, `README.md`, `src/assets.ts` and the task queue completely.
3. Require a clean `main`, fetch `origin`, and require local `main` to match `origin/main` before editing. Preserve unrelated work and stop if the worktree is not clean. Never stash, reset, clean or discard it.
4. Check the selected row's backend gate in `../Atlas/docs/tasks/tasks.md`; stop and report it unless it is `review` or `done`.
5. Work directly on the clean, updated `main`, mark only that row `in_progress`, and implement only its specification through existing services and UI conventions. Do not create a task branch.
6. Run `npm run typecheck` and `npm run build`, update durable docs, review the diff, start `npm run dev` and open the feature for behavior testing.
7. Mark the row `review`, report evidence, ask the owner to test and wait for explicit frontend acceptance before commit/push. After acceptance, mark it `done`, commit and push `main` without force.

Never start another task in the same invocation.
