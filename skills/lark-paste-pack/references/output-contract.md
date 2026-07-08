# Output Contract

Generated packs live under:

```text
/tmp/lark-paste-pack/<source-basename>-<timestamp>/
```

Required files:

```text
00-source-scan.json
01-normalized.md
copy.html
copy.txt
report.md
report.json
CHECKLIST.md
assets/original/
assets/mermaid/
```

Optional file:

```text
import.docx
```

`import.docx` is present when Pandoc succeeds or, on macOS, when the `textutil` fallback succeeds. Pandoc is preferred; `textutil` DOCX output must be visually checked because image embedding can vary.

## Report JSON Fields

`report.json` must include:

- `source`: original source path.
- `outputDir`: generated pack directory.
- `stats`: line, heading, image, table, Mermaid, and converted table counts.
- `outputs`: generated file paths and booleans.
- `checks`: table count in HTML, image count in HTML, missing images, `file://` checks, and sensitive content status.
- `checks.docxRenderer`: `pandoc`, `textutil`, or empty when no DOCX renderer ran.
- `warnings`: non-fatal issues.
- `errors`: fatal issues.
- `manualActions`: steps the developer must run in Lark.

## Verification Rules

`verify-pack` fails when:

- Required files are missing.
- `report.json` has errors.
- `copy.html` contains `file://`.
- `copy.html` contains `<table>` but the report does not explicitly allow it.
- Generated output appears to contain real credentials.
