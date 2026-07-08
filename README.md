# Agent Skills Storage

Codex skills for task planning, execution-prompt handoff, and cloud storage integration review.

This repository is a skill collection. The repository root is only for GitHub-facing documentation; installable skills live under `skills/<skill-name>/`.

GitHub repository: `ndgwww/agent-skills-storage`.

## Maintainer Docs

- [AGENTS.md](AGENTS.md): short rules for Codex and other agents working in this repository.
- [SKILL_CREATION_GUIDE.md](SKILL_CREATION_GUIDE.md): Chinese guide for creating, packaging, publishing, and verifying skills in this collection.

## What It Covers

- Codex task definition and execution prompt generation
- Skill, tool, browser, and MCP routing before coding
- Lark-friendly Markdown paste/import pack generation without Lark app credentials
- HTML, TXT, optional DOCX, report, and checklist outputs for manual Lark Docs insertion
- Google Cloud Storage object operation review
- Python and FastAPI storage integration checks
- Signed URL upload and download flows
- Browser `PUT` direct upload validation
- CORS, ADC, IAM, metadata, generation preconditions, and real bucket smoke evidence
- Official Google Cloud documentation verification before conclusions

## Install

Install the task-prompt skill:

```bash
npx skills@latest add ndgwww/agent-skills-storage -g -a codex -s codex-task-prompt -y --full-depth
```

Install the GCS validation skill:

```bash
npx skills@latest add ndgwww/agent-skills-storage -g -a codex -s validate-gcs-storage -y --full-depth
```

Install the Lark paste-pack skill:

```bash
npx skills@latest add ndgwww/agent-skills-storage -g -a codex -s lark-paste-pack -y --full-depth
```

Restart Codex after installation so the skill metadata is reloaded.

Install all skills in this collection:

```bash
npx skills@latest add ndgwww/agent-skills-storage -g -a codex -s '*' -y --full-depth
```

## Use

Task prompt examples:

```text
Use codex-task-prompt to turn this discussion into a planning-only Codex execution prompt. Include required skills, tools, MCP decision, scope, non-scope, reading order, and verification requirements.
```

```text
Use codex-task-prompt to decide whether this external API documentation task needs Chrome, exported docs, MCP, or only repo search. Do not implement code yet.
```

GCS examples:

```text
Use validate-gcs-storage to inspect this GCS direct upload flow against official Google Cloud docs.
```

```text
Use validate-gcs-storage to debug this browser PUT upload CORS failure.
```

```text
Use validate-gcs-storage to review whether our GCS delete flow is protected by generation preconditions.
```

Lark paste-pack example:

```text
Use lark-paste-pack to convert /Users/mac004/Desktop/ndgwww/tenant_portal/docs/Codex业务模块接入指南.md into a Lark-friendly HTML/TXT/DOCX/report/checklist pack. Do not publish to Lark; tell me how to manually paste and verify it.
```

## Notes

- `README.md` is not part of the skill instructions.
- `skills/<skill-name>/SKILL.md` is the runtime entrypoint.
- Supporting resources live in `examples/`, `references/`, and `scripts/` inside each skill directory.
- Do not put credentials, full temporary URLs, or service account files in issues, logs, prompts, or docs.
