# validate-gcs-storage

Codex skill for reviewing and validating Google Cloud Storage integration work.

The skill itself is fully contained in `SKILL.md`. This README is only a human-facing note for GitHub visitors and is not required by Codex at runtime.

## What It Covers

- Google Cloud Storage object operation review.
- Python and FastAPI storage integration checks.
- Signed URL upload and download flows.
- Browser `PUT` direct upload validation.
- CORS, ADC, IAM, metadata, generation preconditions, and real bucket smoke evidence.
- Official Google Cloud documentation verification before conclusions.

## Install

```bash
npx skills@latest add ndgwww/validate-gcs-storage -g -a codex -y
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
- `SKILL.md` is intentionally self-contained because some installers copy only that file.
- Do not put credentials, full temporary URLs, or service account files in issues, logs, prompts, or docs.
