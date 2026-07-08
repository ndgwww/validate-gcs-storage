# Planning-Only Prompt Template

```text
Use codex-task-prompt.

This round is planning-only. Do not edit files, do not implement code, do not install skills or MCP servers, and do not create formal project docs unless I explicitly approve it later.

Goal:
[Describe the target I want to clarify.]

Context:
- Repository/path: [absolute path if known]
- Current known docs/code entrypoints: [paths or unknown]
- External docs/resources: [URLs or files]
- Current uncertainty: [what I do not understand yet]

Please:
1. Inspect the local repository and current environment first.
2. Identify the task phase and success criteria.
3. Define scope and explicit non-scope.
4. Recommend which skills/tools/MCP, if any, should be used and why.
5. List open questions that materially change the task.
6. Produce an execution path, but do not execute it.
7. Stop before implementation.

Output:
- Current phase
- Verified local facts
- Recommended skills/tools/MCP
- Task breakdown
- Open questions
- Proposed next Codex execution prompt
```
