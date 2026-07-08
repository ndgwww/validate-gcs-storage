#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SKILL_ROOT/../.." && pwd)"
SCAN_ROOT="$SKILL_ROOT"
TMP_ROOT="/tmp/lark-paste-pack-skill-test"
cd "$SKILL_ROOT"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

require_file() {
  [[ -f "$1" ]] || fail "missing required file: $1"
}

require_absent() {
  [[ ! -e "$1" ]] || fail "path should not exist: $1"
}

require_file "SKILL.md"
require_file "README.md"
require_file "package.json"
require_file "agents/openai.yaml"
require_file "references/workflow.md"
require_file "references/conversion-rules.md"
require_file "references/output-contract.md"
require_file "examples/usage.md"
require_file "scripts/build-lark-paste-pack.mjs"
require_file "scripts/verify-pack.mjs"
require_file "scripts/validate-skill.sh"
require_file "tests/fixtures/sample.md"

if [[ -f "$REPO_ROOT/README.md" || -d "$REPO_ROOT/.git" ]]; then
  SCAN_ROOT="$REPO_ROOT"
  require_file "$REPO_ROOT/README.md"
  require_absent "$REPO_ROOT/SKILL.md"
fi

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
printf '%s\n' "$frontmatter" | grep -qx 'name: lark-paste-pack' || fail "skill name must be lark-paste-pack"

description="$(printf '%s\n' "$frontmatter" | sed -n 's/^description: //p')"
description_lower="$(printf '%s' "$description" | tr '[:upper:]' '[:lower:]')"

for term in \
  "lark" \
  "markdown" \
  "html" \
  "txt" \
  "docx" \
  "report" \
  "checklist" \
  "mermaid" \
  "tables"; do
  case "$description_lower" in
    *"$term"*) ;;
    *) fail "description missing trigger term: $term" ;;
  esac
done

for path in \
  "references/workflow.md" \
  "references/conversion-rules.md" \
  "references/output-contract.md" \
  "examples/usage.md" \
  "scripts/validate-skill.sh"; do
  rg -qF "$path" SKILL.md || fail "SKILL.md must route to $path"
done

node --check scripts/build-lark-paste-pack.mjs
node --check scripts/verify-pack.mjs

rm -rf "$TMP_ROOT"
pack_dir="$(node scripts/build-lark-paste-pack.mjs --source tests/fixtures/sample.md --out "$TMP_ROOT" --mode all --docx optional | tail -n 1)"
node scripts/verify-pack.mjs --pack "$pack_dir"

rg -q '<table' "$pack_dir/copy.html" && fail "sample output should not contain HTML tables"
rg -q 'Capability: Upload' "$pack_dir/copy.html" || fail "sample table was not converted into grouped list content"
rg -q 'CHECKLIST.md' "$pack_dir/report.md" || fail "report must list checklist output"

patterns=(
  "BEGIN PRIVATE ""KEY"
  "private""_key"
  "X-Goog-""Signature"
  "GOOGLE_APPLICATION_""CREDENTIALS"
  "\.""env"
  "api_""key="
  "access_""token="
)

for pattern in "${patterns[@]}"; do
  if rg -n --hidden --glob '!.git/**' --glob '!skills/*/scripts/validate-skill.sh' "$pattern" "$SCAN_ROOT" >/tmp/lark-paste-pack-sensitive.txt 2>/dev/null; then
    cat /tmp/lark-paste-pack-sensitive.txt >&2
    fail "sensitive pattern found"
  fi
done

printf 'lark-paste-pack skill package is valid\n'
