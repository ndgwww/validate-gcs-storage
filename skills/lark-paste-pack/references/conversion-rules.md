# Conversion Rules

## Tables

Default rule: do not keep Markdown tables as Lark tables.

Convert a table into grouped lists when any condition is true:

- It has 3 or more columns.
- A cell contains an API path, URL, file path, inline code, shell command, or long field description.
- Any cell is longer than 60 characters.
- The table documents request/response fields, error codes, source files, or integration capabilities.

Only short 2-column key/value tables may remain as tables, and only when `--keep-tables` is explicitly used.

Preferred list shape:

```text
**Capability: Upload file**

- Interface: `POST /api/v1/...`
- Field: `file_id`
- Notes: call confirm-upload after object upload
```

## Images

- Resolve relative image paths from the source Markdown directory.
- Copy local images into `assets/original/`.
- Embed local images into `copy.html` as data URIs for browser copy.
- Fail when a local image is missing.
- Do not leave `file://` references in generated outputs.

## Mermaid

- If `mmdc` is available, render Mermaid blocks to PNG under `assets/mermaid/`.
- If rendering fails or `mmdc` is absent, keep the Mermaid code block and mark `manual_check_required` in the report.
- Do not rely on native Lark Mermaid blocks.

## Security

Stop generation when the source appears to contain:

- Private keys.
- Bearer tokens with real-looking token material.
- Real API keys, access tokens, or secrets.
- Signed URL signature query strings from cloud object storage providers.

Allow placeholders such as `<your-api-key>`, `$API_KEY`, `API_KEY`, and `SIGNED_URL_PLACEHOLDER`.
