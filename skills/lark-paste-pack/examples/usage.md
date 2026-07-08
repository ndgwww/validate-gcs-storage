# Usage Examples

## Build A Paste Pack

```bash
cd /Users/mac004/Desktop/ndgwww/agent-skills-storage/skills/lark-paste-pack
npm run build-pack -- \
  --source /Users/mac004/Desktop/ndgwww/tenant_portal/docs/Codex业务模块接入指南.md \
  --out /tmp/lark-paste-pack \
  --mode all \
  --docx optional
```

## Verify The Pack

```bash
npm run verify-pack -- --pack /tmp/lark-paste-pack/Codex业务模块接入指南-YYYYMMDD-HHMMSS
```

## Manual Lark Handoff

```text
Open copy.html, press Cmd+A and Cmd+C, then paste into a new Lark page or confirmed empty area. Use CHECKLIST.md to verify headings, images, Mermaid handling, converted tables, and sensitive-content safety. Do not repair malformed Lark native tables cell by cell; rebuild the paste pack instead.
```
