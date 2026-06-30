# GCS Validation Workflows

This reference defines reusable checks for Google Cloud Storage integration work.

## 1. Configuration And Authentication

Check:

- Project id, bucket name, and object prefix are required by application startup or deployment checks.
- Local credentials are provided through ADC or a secure local credential path, not committed files.
- Deployed environments prefer platform service accounts or secret-mounted credentials.
- Config responses redact credential paths and never expose credential content.

Failure mapping:

- Missing project, bucket, or prefix: configuration error before object operations.
- Invalid local credentials: authentication failure.
- Valid credentials with insufficient bucket permissions: permission denied.
- Wrong bucket name or deleted object: not found.

## 2. Object Naming And Prefix Safety

Check:

- Backend generates object names for writes.
- User-provided filenames are treated as display names or basename input only.
- All read, download, delete, and metadata operations verify the object is under the configured prefix.
- Prefix changes are treated as data isolation changes, not code behavior changes.

Risk:

- Accepting arbitrary object paths from the frontend can allow cross-tenant or cross-prefix access unless there is a separate authorization model.

## 3. Service-Side Upload

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

## 4. PUT Signed URL Direct Upload

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
- Complete upload URLs are treated as temporary credentials.

Common failure causes:

- Browser uses a different content type from the signed value.
- Missing signed header on the browser `PUT`.
- Bucket CORS does not allow the browser origin.
- Bucket CORS does not allow `PUT` or required request headers.
- Object already exists and create-only precondition is active.
- The confirmation request uses the wrong object name, expected size, or expected content type.

## 5. GET Signed URL Download

Recommended flow:

1. Backend verifies object name and optional generation.
2. Backend generates a short-lived GET Signed URL.
3. Caller or backend verification performs HTTP GET without GCS credentials.
4. Verification records HTTP status and byte count, not the full URL.

Check:

- The object exists before or during signing when the product needs user-friendly errors.
- Generation is used when stable version access matters.
- Logs redact the URL query string.

## 6. Metadata, List, SDK Download, And Delete

Check:

- List operations are scoped by prefix and max result limits.
- Metadata reads use object reload and return generation, metageneration, size, content type, hashes, and update time when available.
- SDK download confirms backend service account read access.
- Delete requires generation when stale delete protection matters.
- Delete should be treated as a real destructive action requiring explicit user approval when run against a real bucket.

## 7. CORS Debugging

Use browser Network details:

- Confirm the real `Origin`.
- Confirm whether the failure is preflight or actual `PUT`.
- Compare request method and headers with bucket CORS policy.
- Do not validate browser CORS from local file pages; use a local HTTP origin.

Bucket CORS policy should include:

- The local or deployed frontend origin.
- The required methods, especially `PUT` for direct upload.
- Required request/response headers used by browser direct upload.
- A reasonable max age for browser preflight caching.

## 8. Verification Evidence

Separate evidence levels:

- Unit tests: prove local validation, routing, object naming, and mock SDK behavior.
- API smoke against a configured app: proves backend routes and error mapping.
- Browser direct upload: proves CORS plus Signed URL upload behavior.
- Real bucket smoke: proves credentials, IAM, GCS object operations, Signed URLs, and cleanup.

Do not say a real GCS flow works unless the evidence includes a real bucket operation.
