---
name: validate-gcs-storage
description: Guides and validates Google Cloud Storage integration work for Python and FastAPI services, including GCS object operations, Signed URL flows, PUT direct upload, CORS, ADC, IAM, metadata, generation preconditions, and smoke tests against real buckets. Use when the user asks to design, review, debug, or verify GCS storage logic and requires official docs verification before conclusions.
---

# Validate GCS Storage

Use this skill to guide and verify Google Cloud Storage (GCS) integration logic. It is built from a Python/FastAPI smoke project, but it should be used as a reusable validation workflow rather than as a direct copy of that project.

## Core Rules

1. Treat Google Cloud official documentation and the Python client reference as the primary source of truth.
2. Re-check official docs before making claims about Signed URLs, CORS, request preconditions, ADC, IAM, or SDK method behavior.
3. Do not expose credentials, service account files, dotenv content, full Signed URLs, signature query strings, or usable temporary authorization links.
4. Do not mutate real buckets, CORS settings, IAM bindings, lifecycle rules, or production configuration unless the user explicitly approves that action.
5. Separate mock/unit-test confidence from real-bucket confidence. Unit tests validate code paths; real GCS conclusions require configured credentials and a real smoke run.
6. Preserve caller and data boundaries: frontend callers can request object creation or temporary authorization, but backend code should generate object names, validate prefix, and confirm metadata.

## Source Routing

- Read `references/official-sources.md` before giving GCS behavior claims or implementation advice.
- Read `references/gcs-validation-workflows.md` for end-to-end validation, debugging, and safety checklists.
- Read `references/gcs-python-basic-smoke-map.md` when working in or comparing against the `gcs-python-basic-smoke` reference project.

## Standard Workflow

1. Identify the user's intent: design, implementation review, debugging, local smoke verification, production hardening, or documentation.
2. Inspect the current repository first. Locate config loading, object naming, API routes, GCS client creation, upload/download methods, Signed URL generation, CORS docs, and tests.
3. Verify official source facts for the specific topic. Do not rely on memory for time-sensitive behavior, SDK signatures, IAM requirements, or current docs.
4. Map the flow:
   - backend authentication and bucket selection
   - prefix/object naming and path safety
   - service-side upload and overwrite behavior
   - PUT Signed URL issuance and browser headers
   - direct upload confirmation through object metadata
   - list, metadata, SDK download, GET Signed URL, verify, and delete
5. Check failure paths before success claims: auth failure, permission denied, not found, precondition failed, unsupported content type, upload too large, CORS preflight, signature mismatch, and stale generation.
6. End with concrete verification commands or browser/API steps. State which checks are mock-only and which prove real GCS behavior.

## GCS Validation Defaults

- Backend should own bucket name, object prefix, object name generation, and destructive operation checks.
- Frontend should not submit full object paths for writes unless the product has a deliberate authorization model for that.
- Use generation preconditions for create-only uploads and generation-bound deletes where the product requires overwrite/delete safety.
- For browser PUT direct upload, require exact signed headers on the browser request and confirm the uploaded object through metadata after the PUT returns.
- Treat complete Signed URLs as bearer-style temporary credentials. Show redacted URLs only.
- Prefer Application Default Credentials or platform service accounts in deployed environments; local service account key files need strict handling and should not be committed.

## Installation And Publication Notes

This repository is intended to be a single-skill repository whose root contains `SKILL.md`.

Install from GitHub with:

```bash
npx skills@latest add ndgwww/validate-gcs-storage -g -a codex -y
```

After installation, restart Codex so the skill metadata is reloaded.

## Validation

Before claiming the skill is ready, run:

```bash
bash scripts/validate-skill.sh
npx skills@latest ls -g -a codex --json
```

If publishing to GitHub, also validate a clean install from `ndgwww/validate-gcs-storage`.
