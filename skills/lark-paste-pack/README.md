# Lark Paste Pack

Generate a local Lark-friendly paste/import package from Markdown when the user does not have Lark app credentials.

## Outputs

- `copy.html`: rich-text copy entrypoint for browser `Cmd+A` / `Cmd+C`.
- `copy.txt`: plain-text fallback.
- `import.docx`: optional Lark import file generated through Pandoc or the macOS `textutil` fallback.
- `report.md` and `report.json`: conversion and verification report.
- `CHECKLIST.md`: manual Lark paste/import acceptance checklist.
- `00-source-scan.json` and `01-normalized.md`: intermediate evidence.

## Commands

```bash
cd /Users/mac004/Desktop/ndgwww/agent-skills-storage/skills/lark-paste-pack
npm run build-pack -- --source /path/to/source.md --out /tmp/lark-paste-pack --mode all --docx optional
npm run verify-pack -- --pack /tmp/lark-paste-pack/<generated-pack-dir>
```

DOCX generation prefers Pandoc. On macOS the script falls back to `textutil`, but Pandoc is still recommended when image fidelity matters:

```bash
brew install pandoc
```

The skill does not publish to Lark. The operator manually opens `copy.html`, copies all rendered content, pastes it into a new Lark page or known empty area, and checks `CHECKLIST.md`.
