# Task Workflow

Any AI agent working on this repository (Claude, Qwen, DeepSeek, ChatGPT, or any other) must read this file first and follow it for every task, regardless of which tool is being used.

1. Require a clean `main` and make sure it is the active branch.
2. Fetch `origin` and require local `main` to match `origin/main` before touching anything. Stop rather than stashing, resetting, cleaning or discarding work.
3. Fully read the project's knowledge base before making any change: `AI-KNOWLEDGE.md`, `AGENTS.md`, and `README.md` (in that order), so the hard constraints, tech stack, file map, and design tokens are all known before editing anything.
4. Read the task description given, and turn it into an explicit todo list (a step-by-step checklist) that covers every requirement in the task — do this before writing any code.
5. Work directly on `main`; do not create a task branch in the current owner-plus-agent workflow.
6. Work through the todo list one item at a time, checking each one off as it's completed, until all items are done. Run `npm run build` before considering the work finished (typecheck + build must pass), then leave the relevant route running for owner testing.
7. Before committing, check whether this task changed anything that AI-KNOWLEDGE.md documents — behavior, structure, tech stack, file map, design tokens, constraints, or decisions. If it did, update the relevant section(s) of AI-KNOWLEDGE.md (and AGENTS.md/README.md if needed) in the same commit, including a new row in the decision log (§11) when the change is a notable decision. If nothing documented there changed, skip this step.
8. Stop before commit and wait for explicit owner behavior acceptance. After acceptance, commit with a clear message and push `main` without force, then report the commit hash.
