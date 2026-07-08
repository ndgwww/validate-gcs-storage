# Codex Task Prompt Workflow

Use this workflow to turn a conversation into a scoped execution prompt. The goal is to make the next Codex session decision-complete without prematurely implementing.

## 1. Lock The Phase

Classify the user's current request:

- Goal setting: the user wants objectives, success criteria, or problem framing.
- Requirement scoping: the user wants scope, non-scope, tradeoffs, or open questions.
- Research planning: the user wants Codex to read code/docs and produce findings.
- Execution preparation: the user wants a copy-paste execution prompt.
- Implementation: the user explicitly wants code/files changed.
- Verification: the user wants proof that prior work is correct.

If the user says "do not code", "planning only", "task prompt", "target setting", or similar, keep the output non-mutating.

## 2. Ground In The Environment

Before recommending a path, inspect what is locally true:

- Current working directory and repository identity.
- Git status and branch.
- Top-level modules and manifests.
- Existing docs, AGENTS files, ADRs, or project guides.
- Relevant code entrypoints for the requested area.
- Installed skills visible to Codex.
- Current MCP/tool configuration when the user asks about MCP or external systems.

Prefer `rg`, `rg --files`, `find`, and targeted reads. Do not ask the user for facts that can be discovered locally.

## 3. Classify The Task

Common categories:

- New project handover.
- External API integration research.
- Payment provider alignment.
- Cloud/storage provider integration.
- Documentation-only planning.
- Bug diagnosis.
- Approved implementation.
- Post-implementation verification.

The category determines skill routing, output format, and whether implementation is allowed.

## 4. Route Skills And Tools

Use existing skills as companions:

- `zoom-out` for unfamiliar code or architecture.
- `grill-with-docs` when project docs and domain language should constrain the plan.
- `grill-me` when the decision tree needs aggressive clarification.
- `find-skills` when the user asks whether more skills or tools are needed.
- `handoff` when context must be carried to another session.
- `to-issues` after an approved plan needs issue decomposition.
- `verification-before-completion` in any implementation prompt that will claim work is complete.

Use Chrome or in-app browser tools when web pages require rendering, login, screenshots, or browser state.

## 5. Decide MCP Need

Use the MCP decision guide before recommending MCP. Default to no MCP for one-off reads. Prefer exported Markdown, OpenAPI, Postman, Apifox, CSV, PDF, or HTML files when available.

Recommend MCP only when there is repeated access need, available authentication, and a clear structured-data advantage.

## 6. Build The Task Structure

Produce:

- Background.
- Objective.
- Verified local facts.
- Scope.
- Explicit non-scope.
- Required reads and order.
- Skill/tool routing.
- Execution steps.
- Open questions.
- Validation and acceptance criteria.
- Stop conditions.

Stop conditions should tell the next agent when to pause rather than guess.

## 7. Generate The Execution Prompt

The final prompt should be directly copy-pasteable. It must include enough context for a new Codex session to act without reading the previous conversation.

Include exact paths and commands where they are known. Do not include credentials, live secrets, or sensitive URLs.
