#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SKILL_ROOT/../.." && pwd)"
SCAN_ROOT="$SKILL_ROOT"
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
require_file "agents/openai.yaml"
require_file "references/workflow.md"
require_file "references/dependency-skills.md"
require_file "references/mcp-decision-guide.md"
require_file "examples/planning-only-prompt.md"
require_file "examples/external-api-research-prompt.md"
require_file "examples/execution-prompt.md"
require_file "scripts/validate-skill.sh"

if [[ -f "$REPO_ROOT/README.md" || -d "$REPO_ROOT/.git" ]]; then
  SCAN_ROOT="$REPO_ROOT"
  require_file "$REPO_ROOT/README.md"
  require_absent "$REPO_ROOT/SKILL.md"
  require_absent "$REPO_ROOT/agents"
  require_absent "$REPO_ROOT/scripts"
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
printf '%s\n' "$frontmatter" | grep -qx 'name: codex-task-prompt' || fail "skill name must be codex-task-prompt"

description="$(printf '%s\n' "$frontmatter" | sed -n 's/^description: //p')"
description_lower="$(printf '%s' "$description" | tr '[:upper:]' '[:lower:]')"

for term in \
  "codex" \
  "execution prompt" \
  "skill" \
  "mcp" \
  "task planning" \
  "handoff" \
  "verification"; do
  case "$description_lower" in
    *"$term"*) ;;
    *) fail "description missing trigger term: $term" ;;
  esac
done

for path in \
  "references/workflow.md" \
  "references/dependency-skills.md" \
  "references/mcp-decision-guide.md" \
  "examples/planning-only-prompt.md" \
  "examples/external-api-research-prompt.md" \
  "examples/execution-prompt.md"; do
  rg -qF "$path" SKILL.md || fail "SKILL.md must route to $path"
done

for required in \
  "依赖 Skill 列表" \
  "https://github.com/vercel-labs/skills" \
  "https://github.com/mattpocock/skills" \
  "https://github.com/obra/superpowers" \
  "https://skills.sh/mattpocock/skills/handoff" \
  "npx skills@latest add ndgwww/agent-skills-storage -g -a codex -s codex-task-prompt -y --full-depth" \
  "npx skills@latest add mattpocock/skills -g -a codex -s handoff -y --full-depth" \
  "npx skills@latest add obra/superpowers -g -a codex -s verification-before-completion -y --full-depth"; do
  rg -qF "$required" README.md || fail "README.md missing required text: $required"
done

for required in \
  "find-skills" \
  "zoom-out" \
  "grill-with-docs" \
  "grill-me" \
  "handoff" \
  "to-issues" \
  "verification-before-completion"; do
  rg -qF "$required" references/dependency-skills.md || fail "dependency guide missing: $required"
done

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
  if rg -n --hidden --glob '!.git/**' --glob '!skills/codex-task-prompt/scripts/validate-skill.sh' --glob '!skills/validate-gcs-storage/scripts/validate-skill.sh' "$pattern" "$SCAN_ROOT" >/tmp/codex-task-prompt-sensitive.txt 2>/dev/null; then
    cat /tmp/codex-task-prompt-sensitive.txt >&2
    fail "sensitive pattern found"
  fi
done

printf 'codex-task-prompt skill package is valid\n'
