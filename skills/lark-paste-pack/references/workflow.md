# Lark Paste Pack Workflow

## Purpose

This skill prepares a local Markdown document for manual insertion into Lark Docs. It is for the no-app-credentials path: no `LARK_APP_ID`, no `LARK_APP_SECRET`, no OpenAPI write, and no MCP publishing.

## Local Tooling

Required:

- Node.js 18+.
- npm only for command convenience; the bundled scripts currently use Node standard libraries.

Optional:

- Pandoc for best-effort `import.docx`.
- macOS `textutil` as a no-install DOCX fallback when Pandoc is unavailable.
- Mermaid CLI (`mmdc`) for Mermaid-to-PNG rendering. If unavailable, Mermaid remains a code block and the report marks manual review.
- A browser for opening `copy.html`.

Install recommended DOCX support:

```bash
brew install pandoc
```

Install optional Mermaid support:

```bash
npm install -g @mermaid-js/mermaid-cli
```

## Standard Run

```bash
cd /Users/mac004/Desktop/ndgwww/agent-skills-storage/skills/lark-paste-pack
npm run build-pack -- --source /path/to/source.md --out /tmp/lark-paste-pack --mode all --docx optional
npm run verify-pack -- --pack /tmp/lark-paste-pack/<generated-pack-dir>
open /tmp/lark-paste-pack/<generated-pack-dir>/copy.html
```

## Operator Handoff

After verification:

1. Open `copy.html`.
2. Press `Cmd+A`.
3. Press `Cmd+C`.
4. Open a new Lark document or a confirmed empty area.
5. Press `Cmd+V`.
6. Use `CHECKLIST.md` to verify headings, images, Mermaid, table-list sections, and security-sensitive content.

Do not edit native Lark tables cell by cell. If a pasted section is malformed, fix conversion rules and rebuild the pack.
