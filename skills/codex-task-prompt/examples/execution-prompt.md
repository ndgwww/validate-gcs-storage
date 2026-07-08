# Execution Prompt Template

```text
Use codex-task-prompt for the task boundary and use verification-before-completion before claiming completion.

Task:
[Concrete implementation task.]

Repository/path:
[absolute path]

Background:
[Relevant confirmed facts from prior planning.]

Scope:
- [What to change]
- [What to preserve]

Non-scope:
- [Explicitly forbidden work]
- [No unrelated refactors]
- [No production/cloud/payment mutation unless explicitly authorized]

Required reads first:
1. [Path or doc]
2. [Path or doc]
3. [Path or doc]

Implementation requirements:
- Follow existing project patterns.
- Keep edits scoped.
- Do not expose secrets or credentials.
- Add or update tests proportional to risk.

Verification:
- [Command 1]
- [Command 2]
- git diff --check

Stop conditions:
- If required credentials, external access, or product decisions are missing, stop and report the blocker.
- If tests reveal unrelated failures, report them separately and do not hide them.

Final report:
- Files changed
- Behavior changed
- Verification commands and results
- Remaining risks or follow-up tasks
```
