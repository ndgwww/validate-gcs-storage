# Agent Skills Storage

Codex skills for reviewing and validating cloud storage integration work.

This repository is a skill package. The repository root is only for GitHub-facing documentation; the installable skill lives under `skills/validate-gcs-storage/`.

GitHub repository: `ndgwww/agent-skills-storage`.

## What It Covers

- Google Cloud Storage object operation review
- Python and FastAPI storage integration checks
- Signed URL upload and download flows
- Browser `PUT` direct upload validation
- CORS, ADC, IAM, metadata, generation preconditions, and real bucket smoke evidence
- Official Google Cloud documentation verification before conclusions

## Install

```bash
npx skills@latest add ndgwww/agent-skills-storage -g -a codex -s validate-gcs-storage -y --full-depth
```

Restart Codex after installation so the skill metadata is reloaded.

## Use

Example prompts:

```text
Use validate-gcs-storage to inspect this GCS direct upload flow against official Google Cloud docs.
```

```text
Use validate-gcs-storage to debug this browser PUT upload CORS failure.
```

```text
Use validate-gcs-storage to review whether our GCS delete flow is protected by generation preconditions.
```

## Notes

- `README.md` is not part of the skill instructions.
- `skills/validate-gcs-storage/SKILL.md` is the runtime entrypoint.
- Supporting resources live in `examples/`, `references/`, and `scripts/` inside the skill directory.
- Do not put credentials, full temporary URLs, or service account files in issues, logs, prompts, or docs.
