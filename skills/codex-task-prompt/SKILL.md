---
name: codex-task-prompt
description: Turns a clarified Codex conversation and local repository context into a scoped execution prompt with goals, boundaries, skill/tool routing, MCP decisions, implementation path, and verification requirements. Use when the user wants task planning, target setting, requirement scoping, handoff prompts, execution prompts, or wants to decide which skills/MCP/tools Codex should use before coding.
---

# Codex Task Prompt

Use this skill when the user is not ready for direct implementation and wants to turn discussion into a concrete Codex task prompt. It is an orchestration skill: it routes to existing skills and tools, defines boundaries, and produces a copy-pasteable prompt for a later Codex session.

## Core Rules

1. Respect the user's current phase. If the user says this round is only for planning, task definition, requirement discussion, or prompt generation, do not implement code or create repo artifacts unless explicitly asked.
2. Ground in the local environment before deciding. Inspect the current path, repository structure, relevant docs/code entrypoints, installed skills, and MCP/tool availability.
3. Do not install skills, add MCP servers, mutate production/cloud/payment systems, or create formal project docs unless the user explicitly approves that action.
4. Separate facts, assumptions, open questions, recommended skills/tools, and execution steps.
5. Treat README examples, third-party API examples, and sample fields as examples unless the user or source docs establish them as contracts.
6. The final output must be usable as the next Codex execution prompt.

## Resource Routing

- Read [references/workflow.md](references/workflow.md) for the standard task-shaping workflow.
- Read [references/dependency-skills.md](references/dependency-skills.md) when deciding which existing skills to recommend or invoke.
- Read [references/mcp-decision-guide.md](references/mcp-decision-guide.md) before recommending MCP installation.
- Use [examples/planning-only-prompt.md](examples/planning-only-prompt.md) when the next task must stay read-only or planning-only.
- Use [examples/external-api-research-prompt.md](examples/external-api-research-prompt.md) for external API documentation and local code alignment work.
- Use [examples/execution-prompt.md](examples/execution-prompt.md) when the user has approved implementation.

## Standard Output

Return these sections unless the user asks for a different shape:

1. Current phase and goal.
2. Local facts already verified.
3. Scope and explicit non-scope.
4. Skill/tool/MCP routing.
5. Step-by-step execution path.
6. Open questions that block or materially change execution.
7. Copy-paste Codex execution prompt.

If the user only asked to design the task and not to generate the final prompt yet, stop before section 7 and state what remains to confirm.
