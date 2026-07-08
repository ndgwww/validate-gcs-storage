# External API Research Prompt Template

```text
Use codex-task-prompt.

I need a planning/research task for aligning external API documentation with the current codebase. Do not implement code yet.

Repository/path:
[absolute path]

External docs:
[URLs, exported Markdown/OpenAPI/Postman/Apifox files, or browser-only docs]

Business target:
[provider or integration target]

Please:
1. First inspect the local project structure and relevant existing integration code.
2. Determine whether the external docs should be read through local files, browser/Chrome, web fetch, exported artifacts, or MCP.
3. Do not recommend MCP unless it is clearly better than browser/exported docs and required credentials are available.
4. Map the current local flow before proposing changes.
5. Design the research task only: document map, local code map, external API fact table, alignment matrix, gap/risk list, open questions, and future implementation phases.
6. Include recommended companion skills, such as zoom-out, grill-with-docs, find-skills, handoff, or verification-before-completion.

Output a copy-pasteable prompt for a new Codex session that will perform the research. The prompt must include scope, non-scope, reading order, stop conditions, and acceptance criteria.
```
