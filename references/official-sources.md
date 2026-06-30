# Official Sources

Use these official sources before making claims about Google Cloud Storage behavior. Prefer the current Google Cloud pages over memory, blog posts, or copied examples.

## Required Sources

| Topic | Official source | Check before claiming |
| --- | --- | --- |
| Signed URLs | https://cloud.google.com/storage/docs/access-control/signed-urls | Supported operations, endpoint restrictions, expiration, and security meaning |
| V4 Signed URL helpers | https://cloud.google.com/storage/docs/access-control/signing-urls-with-helpers | Helper behavior, signing requirements, language examples |
| PUT Signed URL sample | https://cloud.google.com/storage/docs/samples/storage-generate-upload-signed-url-v4 | Required method, content type handling, generated upload URL shape |
| CORS | https://cloud.google.com/storage/docs/using-cors | Bucket CORS format, allowed origins, methods, response headers |
| Request preconditions | https://cloud.google.com/storage/docs/request-preconditions | Generation and metageneration precondition semantics |
| Python Blob reference | https://cloud.google.com/python/docs/reference/storage/latest/google.cloud.storage.blob.Blob | `upload_from_file`, `download_as_bytes`, `reload`, `delete`, and `generate_signed_url` parameters |
| Application Default Credentials | https://cloud.google.com/docs/authentication/application-default-credentials | Local and deployed authentication behavior |
| Cloud Storage authentication | https://cloud.google.com/storage/docs/authentication | Auth approaches and credential expectations for Cloud Storage |

## Verification Rules

- Open the exact official page relevant to the user's question before finalizing a design or bug diagnosis.
- Cite the official URL in user-facing conclusions when a GCS behavior or limitation matters.
- If an SDK method signature appears uncertain, inspect the Python Blob reference instead of inferring from older code.
- If official docs and a local project conflict, treat the official docs as source of truth and then explain the compatibility impact.
- Do not paste long passages from docs; summarize the relevant rule and link to the source.

## High-Risk Topics

- Signed URL upload and download semantics.
- Browser direct upload CORS behavior.
- Header matching in signed requests.
- Generation preconditions for create-only writes and safe deletes.
- Auth mode differences between local keys, ADC, impersonation, and platform service accounts.
- IAM permissions required for object create, get, list, delete, and remote signing.
