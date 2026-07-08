---
name: lark-paste-pack
description: Builds a local Lark-friendly paste/import pack from Markdown, including HTML, TXT, optional DOCX, report, and checklist outputs. Use when the user wants to move local Markdown into Lark Docs without Lark app credentials, especially when the document contains local images, Mermaid, wide tables, API fields, file paths, or needs manual paste/import verification.
---

# Lark Paste Pack

Use this skill to prepare Markdown for manual insertion into Lark Docs when API/MCP publishing is unavailable. The skill stops at generating and verifying local files; the user manually copies, pastes, imports, and accepts the final Lark document.

## Boundaries

- Do not log in to Lark, call Lark APIs, install Lark MCP servers, or overwrite cloud documents.
- Do not mutate the source Markdown unless the user explicitly asks.
- Do not output real API keys, Bearer tokens, private keys, R2 secrets, signed URLs, or credential files.
- Treat DOCX generation as Pandoc-backed. If Pandoc is unavailable, report it clearly instead of pretending a DOCX was produced.

## Resource Routing

- Read [references/workflow.md](references/workflow.md) before running the pack builder.
- Read [references/conversion-rules.md](references/conversion-rules.md) when handling tables, images, Mermaid, and security limits.
- Read [references/output-contract.md](references/output-contract.md) before changing generated filenames or report fields.
- Use [examples/usage.md](examples/usage.md) for command examples and operator handoff text.
- Run [scripts/validate-skill.sh](scripts/validate-skill.sh) before claiming the skill package is valid.

## Standard Workflow

1. Confirm the source Markdown path and output root.
2. Run `npm run build-pack -- --source <markdown> --out /tmp/lark-paste-pack --mode all --docx optional`.
3. Run `npm run verify-pack -- --pack <generated-pack-dir>`.
4. Open `copy.html` locally and visually check the rich copy view.
5. Tell the user to paste into a new Lark page or known empty area, then use `CHECKLIST.md` for manual acceptance.

## Required Outputs

Each pack should contain `copy.html`, `copy.txt`, `report.md`, `report.json`, `CHECKLIST.md`, `01-normalized.md`, and `00-source-scan.json`. `import.docx` is required only when Pandoc is installed or `--docx required` is used.
