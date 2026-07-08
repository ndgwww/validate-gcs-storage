# Dependency Skills

`codex-task-prompt` is an orchestration skill. It does not replace the skills below; it decides when to use or recommend them.

## Core Companions

| Skill | Use When | Source | Install |
| --- | --- | --- | --- |
| `find-skills` | The user asks whether a skill, MCP, connector, or tool exists or should be installed. | `https://github.com/vercel-labs/skills` / `https://skills.sh/vercel-labs/skills/find-skills` | `npx skills@latest add vercel-labs/skills -g -a codex -s find-skills -y` |
| `zoom-out` | The user is unfamiliar with a repo, subsystem, module, or code flow. | `https://github.com/mattpocock/skills` / `https://skills.sh/mattpocock/skills/zoom-out` | `npx skills@latest add mattpocock/skills -g -a codex -s zoom-out -y --full-depth` |
| `grill-with-docs` | The plan must be checked against local project docs, glossary, ADRs, or domain language. | `https://github.com/mattpocock/skills` / `https://skills.sh/mattpocock/skills/grill-with-docs` | `npx skills@latest add mattpocock/skills -g -a codex -s grill-with-docs -y --full-depth` |
| `grill-me` | Important preferences, tradeoffs, and unknowns remain after local inspection. | `https://github.com/mattpocock/skills` / `https://skills.sh/mattpocock/skills/grill-me` | `npx skills@latest add mattpocock/skills -g -a codex -s grill-me -y --full-depth` |
| `handoff` | The current conversation must be compacted for another agent or a follow-up session. | `https://github.com/mattpocock/skills` / `https://skills.sh/mattpocock/skills/handoff` | `npx skills@latest add mattpocock/skills -g -a codex -s handoff -y --full-depth` |
| `to-issues` | An approved plan should be broken into independently grabbable implementation issues. | `https://github.com/mattpocock/skills` / `https://skills.sh/mattpocock/skills/to-issues` | `npx skills@latest add mattpocock/skills -g -a codex -s to-issues -y --full-depth` |
| `verification-before-completion` | Implementation work needs a hard evidence-before-claims rule. | `https://github.com/obra/superpowers` / `https://skills.sh/obra/superpowers/verification-before-completion` | `npx skills@latest add obra/superpowers -g -a codex -s verification-before-completion -y --full-depth` |

## Optional Planning Skills

- `prd-development`: use only when the user wants a structured PRD artifact.
- `to-prd`: use only when the conversation should become a PRD and be published to the project issue tracker.
- `user-stories`: use when the next artifact is user stories and acceptance criteria.
- `triage`: use when the work should move through issue-tracker triage states.

## Tool Capabilities

These are tools or plugins, not installable skills from `npx skills`:

- `chrome:control-chrome`: logged-in pages, password-protected docs, extension/session-dependent work.
- `browser:control-in-app-browser`: local preview, public web pages, screenshots, basic UI checks.
- `chrome-devtools-mcp@latest`: browser debugging and DevTools-style inspection.
- `node_repl`: structured local JavaScript execution and browser automation helpers.

## Routing Rules

1. Use the smallest set of skills that changes the outcome.
2. Do not load PRD, issue, TDD, or verification skills during a planning-only round unless the user asks for that artifact.
3. Include `verification-before-completion` in generated implementation prompts even if it is not needed during prompt design.
4. Never recommend installation based only on a name match. Check whether the existing local skill set already covers the need.
