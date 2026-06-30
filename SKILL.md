---
name: validate-gcs-storage
description: Guides and validates Google Cloud Storage integration work for Python and FastAPI services, including GCS object operations, Signed URL flows, PUT direct upload, CORS, ADC, IAM, metadata, generation preconditions, and smoke tests against real buckets. Use when the user asks to design, review, debug, or verify GCS storage logic and requires official docs verification before conclusions.
---

# Validate GCS Storage

Use this skill to guide and verify Google Cloud Storage (GCS) integration logic. It is self-contained because some skill installers copy only the root `SKILL.md`.

## Core Contract

1. Treat Google Cloud official documentation and the Python client reference as the primary source of truth.
2. Re-check official docs before making claims about Signed URLs, CORS, request preconditions, ADC, IAM, or SDK method behavior.
3. Do not expose credentials, service account files, dotenv content, full Signed URLs, signature query strings, or usable temporary authorization links.
4. Do not mutate real buckets, CORS settings, IAM bindings, lifecycle rules, or production configuration unless the user explicitly approves that action.
5. Separate mock/unit-test confidence from real-bucket confidence. Unit tests validate code paths; real GCS conclusions require configured credentials and a real smoke run.
6. Preserve caller and data boundaries: frontend callers can request object creation or temporary authorization, but backend code should generate object names, validate prefix, and confirm metadata.

## Official Sources To Verify

Open the exact official page relevant to the user's question before finalizing a design or bug diagnosis:

| Topic | Official source | Check before claiming |
| --- | --- | --- |
| Signed URLs | https://cloud.google.com/storage/docs/access-control/signed-urls | Supported operations, endpoint restrictions, expiration, and security meaning |
| V4 Signed URL helpers | https://cloud.google.com/storage/docs/access-control/signing-urls-with-helpers | Helper behavior, signing requirements, language examples |
| PUT Signed URL sample | https://cloud.google.com/storage/docs/samples/storage-generate-upload-signed-url-v4 | Required method, content type handling, generated upload URL shape |
| CORS | https://cloud.google.com/storage/docs/using-cors | Bucket CORS format, allowed origins, methods, response headers |
| Request preconditions | https://cloud.google.com/storage/docs/request-preconditions | Generation and metageneration precondition semantics |
| Python Blob reference | https://cloud.google.com/python/docs/reference/storage/latest/google.cloud.storage.blob.Blob | `upload_from_file`, `download_as_bytes`, `reload`, `delete`, and `generate_signed_url` parameters |
| Application Default Credentials | https://cloud.google.com/docs/authentication/application-default-credentials | Local and deployed authentication behavior |
| Cloud Storage authentication | https://cloud.google.com/storage/docs/authentication | Auth approaches and credential expectations |

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

## Validation Workflows

### Configuration And Authentication

Check:

- Project id, bucket name, and object prefix are required by startup or deployment checks.
- Local credentials are provided through ADC or a secure local credential path, not committed files.
- Deployed environments prefer platform service accounts or secret-mounted credentials.
- Config responses redact credential paths and never expose credential content.

Failure mapping:

- Missing project, bucket, or prefix: configuration error before object operations.
- Invalid local credentials: authentication failure.
- Valid credentials with insufficient bucket permissions: permission denied.
- Wrong bucket name or deleted object: not found.

### Object Naming And Prefix Safety

- Backend should own bucket name, object prefix, object name generation, and destructive operation checks.
- Frontend should not submit full object paths for writes unless the product has a deliberate authorization model for that.
- User-provided filenames are treated as display names or basename input only.
- All read, download, delete, and metadata operations verify the object is under the configured prefix.
- Prefix changes are data isolation changes, not code behavior changes.

Risk: accepting arbitrary object paths from the frontend can allow cross-tenant or cross-prefix access unless a separate authorization model prevents it.

### Service-Side Upload

Recommended flow:

1. Receive file in the backend.
2. Validate content type and size.
3. Generate object name under the configured prefix.
4. Upload with a create-only generation precondition when overwrite is not intended.
5. Return bucket, name, generation, size, and content type.

Verify:

- Duplicate create-only upload should fail with a precondition error.
- Upload result should contain object generation when available.
- Server logs should not print file content or credential material.

### PUT Signed URL Direct Upload

Recommended flow:

1. Frontend submits filename, content type, and size to the backend.
2. Backend validates those values and generates the final object name.
3. Backend creates a V4 Signed URL with method `PUT`.
4. Backend returns the upload URL plus required request headers.
5. Browser sends `PUT` directly to GCS with the exact required headers.
6. Backend confirmation endpoint reloads metadata and verifies expected size and content type.

Check:

- Content type sent by the browser matches the value used when signing.
- Required signed headers are present on the browser request.
- Create-only behavior uses a generation precondition when the product forbids overwrite.
- The direct upload is not considered complete until metadata confirmation succeeds.
- Complete upload URLs are treated as temporary credentials and must be redacted in logs, tickets, and chat.

Common failure causes:

- Browser uses a different content type from the signed value.
- Missing signed header on the browser `PUT`.
- Bucket CORS does not allow the browser origin.
- Bucket CORS does not allow `PUT` or required request headers.
- Object already exists and create-only precondition is active.
- The confirmation request uses the wrong object name, expected size, or expected content type.

### GET Signed URL Download

Recommended flow:

1. Backend verifies object name and optional generation.
2. Backend generates a short-lived GET Signed URL.
3. Caller or backend verification performs HTTP GET without GCS credentials.
4. Verification records HTTP status and byte count, not the full URL.

Check:

- The object exists before or during signing when the product needs user-friendly errors.
- Generation is used when stable version access matters.
- Logs redact the URL query string.

### Metadata, List, SDK Download, And Delete

Check:

- List operations are scoped by prefix and max result limits.
- Metadata reads use object reload and return generation, metageneration, size, content type, hashes, and update time when available.
- SDK download confirms backend service account read access.
- Delete requires generation when stale delete protection matters.
- Delete is a real destructive action and requires explicit user approval when run against a real bucket.

### CORS Debugging

Use browser Network details:

- Confirm the real `Origin`.
- Confirm whether the failure is preflight or actual `PUT`.
- Compare request method and headers with bucket CORS policy.
- Do not validate browser CORS from local file pages; use a local HTTP origin.

Bucket CORS policy should include:

- The local or deployed frontend origin.
- Required methods, especially `PUT` for direct upload.
- Required request and response headers used by browser direct upload.
- A reasonable max age for browser preflight caching.

### Verification Evidence

Separate evidence levels:

- Unit tests: prove local validation, routing, object naming, and mock SDK behavior.
- API smoke against a configured app: proves backend routes and error mapping.
- Browser direct upload: proves CORS plus Signed URL upload behavior.
- Real bucket smoke: proves credentials, IAM, GCS object operations, Signed URLs, and cleanup.

Do not say a real GCS flow works unless the evidence includes a real bucket operation.

## Reference Project Map

When working with `/Users/mac004/Desktop/ndgwww/gcs-python-basic-smoke` or adapting its validation model, use this map.

The reference project validates:

```text
Python backend
  -> GCS authentication
  -> target project and bucket
  -> service-side object upload
  -> browser PUT Signed URL direct upload
  -> list and metadata
  -> SDK download
  -> GET Signed URL download
  -> generation-bound delete
```

Important entry points:

| Area | Path | Purpose |
| --- | --- | --- |
| App setup | `src/gcs_basic_smoke/app.py` | FastAPI app and static web serving |
| Config | `src/gcs_basic_smoke/config.py` | Required project, bucket, prefix, limits, content types, credential path redaction |
| Routes | `src/gcs_basic_smoke/api/routes_objects.py` | Upload, direct upload URL, confirm, list, metadata, download, Signed URL, verify, delete |
| Smoke route | `src/gcs_basic_smoke/api/routes_smoke.py` | End-to-end create/read/download/sign/delete smoke run |
| GCS operations | `src/gcs_basic_smoke/gcs/operations.py` | SDK calls and mapped behavior |
| Object names | `src/gcs_basic_smoke/gcs/object_names.py` | Prefix enforcement and safe filename handling |
| Schemas | `src/gcs_basic_smoke/schemas.py` | API request and response contracts |
| Tests | `tests/` | Mocked local confidence, not a substitute for real bucket smoke |

API to SDK map:

| API | Real GCS action | SDK method or behavior |
| --- | --- | --- |
| `GET /healthz` | No | Health only |
| `GET /api/config` | No | Redacted config only |
| `POST /api/objects` | Yes | `blob.upload_from_file(..., if_generation_match=0)` |
| `POST /api/objects/upload-url` | Yes | `blob.generate_signed_url(version="v4", method="PUT")` |
| `POST /api/objects/upload-confirm` | Yes | `blob.reload()` |
| `GET /api/objects` | Yes | `client.list_blobs(bucket, prefix=..., max_results=...)` |
| `GET /api/objects/metadata` | Yes | `blob.reload()` |
| `GET /api/objects/download` | Yes | `blob.download_as_bytes()` |
| `POST /api/objects/signed-url` | Yes | `blob.generate_signed_url(version="v4", method="GET")` |
| `POST /api/objects/signed-url/verify` | Yes | Generate URL, then plain HTTP GET |
| `DELETE /api/objects` | Yes | `blob.delete(if_generation_match=generation)` |
| `POST /api/smoke/run` | Yes | End-to-end create, duplicate failure, metadata, list, download, signed download, delete |

Preserve these behaviors when reusing the pattern:

- Startup requires project id, bucket name, and object prefix. Do not silently fall back to fake values for real smoke runs.
- Frontend filenames are sanitized and only influence the final basename.
- Backend-generated object names stay under the configured prefix.
- Service-side upload uses create-only semantics to avoid overwrite.
- Direct upload signs method `PUT`, content type, and required headers, then confirms metadata after browser upload.
- Signed URL verification performs a real HTTP GET and reports status and byte count.
- Delete requires generation to avoid deleting a newer object version.
- Tests using fake clients are useful but cannot prove real bucket access.

Error mapping:

| HTTP | Meaning |
| --- | --- |
| 400 | Invalid object name or missing generation for delete |
| 401 | Authentication failure |
| 403 | Permission denied |
| 404 | Bucket or object not found |
| 409 | Precondition failure or direct upload metadata mismatch |
| 413 | Upload too large |
| 415 | Unsupported content type |
| 502 | GCS API or Signed URL verification failure |

Safe extraction rule: when building docs, prompts, or skills from this project, extract only API names, SDK method names, validation flow, failure mapping, and non-sensitive configuration concepts.

## User-Facing Output Format

When using this skill, return:

1. Official source checks performed, with links.
2. Current repo findings, with file paths if applicable.
3. GCS flow assessment grouped by configuration, auth/IAM, object naming, upload, Signed URL, CORS, metadata/list/download/delete, and tests.
4. Concrete verification steps, clearly marking mock-only checks versus real-bucket checks.
5. Safety notes for credentials, temporary URLs, and destructive operations.

## Install Command

Install from GitHub:

```bash
npx skills@latest add ndgwww/validate-gcs-storage -g -a codex -y
```

After installation, restart Codex so the skill metadata is reloaded.
