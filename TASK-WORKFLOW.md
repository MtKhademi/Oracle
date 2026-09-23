# Task Workflow

Any AI agent working on this repository (Claude, Qwen, DeepSeek, ChatGPT, or any other) must read this file first and follow it for every task, regardless of which tool is being used.

1. Check out `main` and make sure it's the active branch (`git checkout main`).
2. Fully pull the latest `main` (`git pull origin main`) before touching anything.
3. Fully read the project's knowledge base before making any change: `AI-KNOWLEDGE.md`, `AGENTS.md`, and `README.md` (in that order), so the hard constraints, tech stack, file map, and design tokens are all known before editing anything.
4. Read the task description given, and turn it into an explicit todo list (a step-by-step checklist) that covers every requirement in the task — do this before writing any code.
5. Create a new feature branch off `main` (a short, descriptive branch name related to the task).
6. Work through the todo list one item at a time, checking each one off as it's completed, until all items are done. Run `npm run build` before considering the work finished (typecheck + build must pass).
7. Before committing, check whether this task changed anything that AI-KNOWLEDGE.md documents — behavior, structure, tech stack, file map, design tokens, constraints, or decisions. If it did, update the relevant section(s) of AI-KNOWLEDGE.md (and AGENTS.md/README.md if needed) in the same commit, including a new row in the decision log (§11) when the change is a notable decision. If nothing documented there changed, skip this step.
8. Commit the work with a clear message, push the branch, and open a pull request to `main` describing what was done — then report the PR link back.
