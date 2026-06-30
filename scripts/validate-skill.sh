#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

require_file() {
  [[ -f "$1" ]] || fail "missing required file: $1"
}

require_absent() {
  [[ ! -e "$1" ]] || fail "file should not exist in this single-skill repo: $1"
}

require_file "SKILL.md"
require_file "agents/openai.yaml"
require_file "references/official-sources.md"
require_file "references/gcs-validation-workflows.md"
require_file "references/gcs-python-basic-smoke-map.md"
require_file "scripts/validate-skill.sh"

require_absent "README.md"
require_absent "INSTALLATION_GUIDE.md"
require_absent "QUICK_REFERENCE.md"
require_absent "CHANGELOG.md"

first_line="$(sed -n '1p' SKILL.md)"
[[ "$first_line" == "---" ]] || fail "SKILL.md must start with frontmatter delimiter"

frontmatter="$(awk '
  NR == 1 && $0 == "---" { in_frontmatter = 1; next }
  in_frontmatter && $0 == "---" { exit }
  in_frontmatter { print }
' SKILL.md)"

name_count="$(printf '%s\n' "$frontmatter" | grep -c '^name: ' || true)"
description_count="$(printf '%s\n' "$frontmatter" | grep -c '^description: ' || true)"
other_keys="$(printf '%s\n' "$frontmatter" | grep -Ev '^(name|description): ' || true)"

[[ "$name_count" == "1" ]] || fail "frontmatter must contain exactly one name"
[[ "$description_count" == "1" ]] || fail "frontmatter must contain exactly one description"
[[ -z "$other_keys" ]] || fail "frontmatter must contain only name and description"
printf '%s\n' "$frontmatter" | grep -qx 'name: validate-gcs-storage' || fail "skill name must be validate-gcs-storage"

description="$(printf '%s\n' "$frontmatter" | sed -n 's/^description: //p')"
description_lower="$(printf '%s' "$description" | tr '[:upper:]' '[:lower:]')"

for term in \
  "gcs" \
  "google cloud storage" \
  "signed url" \
  "put direct upload" \
  "cors" \
  "adc" \
  "iam" \
  "python" \
  "fastapi" \
  "official docs"; do
  case "$description_lower" in
    *"$term"*) ;;
    *) fail "description missing trigger term: $term" ;;
  esac
done

for url in \
  "https://cloud.google.com/storage/docs/access-control/signed-urls" \
  "https://cloud.google.com/storage/docs/access-control/signing-urls-with-helpers" \
  "https://cloud.google.com/storage/docs/samples/storage-generate-upload-signed-url-v4" \
  "https://cloud.google.com/storage/docs/using-cors" \
  "https://cloud.google.com/storage/docs/request-preconditions" \
  "https://cloud.google.com/python/docs/reference/storage/latest/google.cloud.storage.blob.Blob" \
  "https://cloud.google.com/docs/authentication/application-default-credentials"; do
  rg -qF "$url" references/official-sources.md || fail "official source missing: $url"
done

patterns=(
  "BEGIN PRIVATE ""KEY"
  "private""_key"
  "X-Goog-""Signature"
  "GOOGLE_APPLICATION_""CREDENTIALS"
  "\.""env"
  "prot""ons-.*\.""json"
)

for pattern in "${patterns[@]}"; do
  if rg -n --hidden --glob '!.git/**' --glob '!scripts/validate-skill.sh' "$pattern" . >/tmp/validate-gcs-storage-sensitive.txt; then
    cat /tmp/validate-gcs-storage-sensitive.txt >&2
    fail "sensitive pattern found"
  fi
done

printf 'validate-gcs-storage skill structure is valid\n'
