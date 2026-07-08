#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
const source = args.source ? resolve(String(args.source)) : "";
const outRoot = resolve(String(args.out || "/tmp/lark-paste-pack"));
const mode = String(args.mode || "paste");
const docxMode = String(args.docx || "optional");
const keepTables = Boolean(args["keep-tables"]);
const strict = Boolean(args.strict);

if (!source) fail("missing --source <markdown>");
if (!existsSync(source)) fail(`source does not exist: ${source}`);
if (!["paste", "import", "all"].includes(mode)) fail("--mode must be paste, import, or all");
if (!["required", "optional", "skip"].includes(docxMode)) fail("--docx must be required, optional, or skip");

const sourceText = readFileSync(source, "utf8");
const sourceDir = dirname(source);
const sourceBase = basename(source, extname(source));
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
const outputDir = join(outRoot, `${sourceBase}-${timestamp}`);
const assetsOriginal = join(outputDir, "assets", "original");
const assetsMermaid = join(outputDir, "assets", "mermaid");
mkdirSync(assetsOriginal, { recursive: true });
mkdirSync(assetsMermaid, { recursive: true });

const report = {
  source,
  outputDir,
  generatedAt: new Date().toISOString(),
  options: { mode, docx: docxMode, keepTables, strict },
  stats: {
    lines: sourceText.split(/\r?\n/).length,
    headings: 0,
    images: 0,
    mermaidBlocks: 0,
    tableBlocks: 0,
    convertedTables: 0,
    keptTables: 0,
  },
  outputs: {
    sourceScan: join(outputDir, "00-source-scan.json"),
    normalizedMarkdown: join(outputDir, "01-normalized.md"),
    html: join(outputDir, "copy.html"),
    text: join(outputDir, "copy.txt"),
    docx: join(outputDir, "import.docx"),
    reportMarkdown: join(outputDir, "report.md"),
    reportJson: join(outputDir, "report.json"),
    checklist: join(outputDir, "CHECKLIST.md"),
  },
  checks: {
    htmlTableCount: 0,
    htmlImageCount: 0,
    missingImages: [],
    fileSchemeReferences: false,
    sensitiveContentFound: false,
    docxGenerated: false,
    docxRenderer: "",
    docxSkippedReason: "",
  },
  warnings: [],
  errors: [],
  manualActions: [
    "Open copy.html in a browser.",
    "Press Cmd+A and Cmd+C.",
    "Paste into a new Lark page or a confirmed empty area.",
    "Use CHECKLIST.md to verify the Lark result.",
  ],
};

const sensitiveMatches = findSensitive(sourceText);
if (sensitiveMatches.length > 0) {
  report.checks.sensitiveContentFound = true;
  report.errors.push(`source appears to contain sensitive content: ${sensitiveMatches.join(", ")}`);
}

const blocks = parseBlocks(sourceText);
const normalized = [];
const textOut = [];
const htmlParts = [];

for (const block of blocks) {
  if (block.type === "heading") {
    report.stats.headings += 1;
    normalized.push(`${"#".repeat(block.level)} ${block.text}`);
    textOut.push(`${"#".repeat(block.level)} ${block.text}`);
    htmlParts.push(`<h${block.level}>${inlineHtml(block.text)}</h${block.level}>`);
    continue;
  }

  if (block.type === "paragraph") {
    normalized.push(block.text);
    textOut.push(block.text);
    htmlParts.push(`<p>${inlineHtml(block.text)}</p>`);
    continue;
  }

  if (block.type === "list") {
    normalized.push(...block.lines);
    textOut.push(...block.lines);
    htmlParts.push(renderListHtml(block.lines));
    continue;
  }

  if (block.type === "code") {
    const fence = block.lang ? `\`\`\`${block.lang}` : "```";
    normalized.push(fence, block.code, "```");
    textOut.push(fence, block.code, "```");
    htmlParts.push(`<pre><code${block.lang ? ` class="language-${escapeAttr(block.lang)}"` : ""}>${escapeHtml(block.code)}</code></pre>`);
    continue;
  }

  if (block.type === "mermaid") {
    report.stats.mermaidBlocks += 1;
    const rendered = tryRenderMermaid(block.code, report.stats.mermaidBlocks);
    if (rendered) {
      normalized.push(`![Mermaid diagram](${relative(outputDir, rendered).replaceAll("\\", "/")})`);
      textOut.push("[Mermaid diagram rendered as image]");
      htmlParts.push(`<figure><img src="${dataUri(rendered)}" alt="Mermaid diagram"><figcaption>Mermaid diagram</figcaption></figure>`);
    } else {
      report.warnings.push("Mermaid CLI was unavailable or failed; Mermaid remained as a code block and requires manual review.");
      normalized.push("```mermaid", block.code, "```");
      textOut.push("```mermaid", block.code, "```");
      htmlParts.push(`<pre><code class="language-mermaid">${escapeHtml(block.code)}</code></pre>`);
    }
    continue;
  }

  if (block.type === "image") {
    report.stats.images += 1;
    const resolved = resolveImage(block.href);
    if (!resolved || !existsSync(resolved)) {
      report.checks.missingImages.push(block.href);
      report.errors.push(`missing image: ${block.href}`);
      normalized.push(`![${block.alt}](${block.href})`);
      textOut.push(`[missing image: ${block.alt || block.href}]`);
      htmlParts.push(`<p><strong>Missing image:</strong> ${escapeHtml(block.href)}</p>`);
      continue;
    }
    const copied = copyImage(resolved, report.stats.images);
    normalized.push(`![${block.alt}](${relative(outputDir, copied).replaceAll("\\", "/")})`);
    textOut.push(`[image: ${block.alt || basename(copied)}]`);
    htmlParts.push(`<figure><img src="${dataUri(copied)}" alt="${escapeAttr(block.alt)}"><figcaption>${escapeHtml(block.alt || basename(copied))}</figcaption></figure>`);
    continue;
  }

  if (block.type === "table") {
    report.stats.tableBlocks += 1;
    const table = parseTable(block.lines);
    const shouldKeep = keepTables && isShortKeyValueTable(table);
    if (shouldKeep) {
      report.stats.keptTables += 1;
      normalized.push(...block.lines);
      textOut.push(...block.lines);
      htmlParts.push(renderTableHtml(table));
    } else {
      report.stats.convertedTables += 1;
      const converted = renderTableAsList(table);
      normalized.push(...converted.markdown);
      textOut.push(...converted.text);
      htmlParts.push(converted.html);
    }
  }
}

const normalizedText = normalized.join("\n\n").replace(/\n{3,}/g, "\n\n") + "\n";
const plainText = textOut.join("\n\n").replace(/\n{3,}/g, "\n\n") + "\n";
const html = buildHtmlDocument(sourceBase, htmlParts.join("\n"));
report.checks.htmlTableCount = countMatches(html, /<table\b/gi);
report.checks.htmlImageCount = countMatches(html, /<img\b/gi);
report.checks.fileSchemeReferences = html.includes("file://");

writeFileSync(report.outputs.sourceScan, JSON.stringify(scanSource(sourceText), null, 2));
writeFileSync(report.outputs.normalizedMarkdown, normalizedText);
writeFileSync(report.outputs.html, html);
writeFileSync(report.outputs.text, plainText);
writeFileSync(report.outputs.checklist, buildChecklist(report));

if (["import", "all"].includes(mode) && docxMode !== "skip") {
  if (commandExists("pandoc")) {
    try {
      execFileSync("pandoc", [report.outputs.normalizedMarkdown, "-o", report.outputs.docx], {
        cwd: outputDir,
        stdio: "pipe",
      });
      report.checks.docxGenerated = existsSync(report.outputs.docx);
      report.checks.docxRenderer = "pandoc";
    } catch (error) {
      report.checks.docxSkippedReason = `pandoc failed: ${error.message}`;
      report[docxMode === "required" ? "errors" : "warnings"].push(report.checks.docxSkippedReason);
    }
  } else if (commandExists("textutil")) {
    try {
      execFileSync("textutil", ["-convert", "docx", "-output", report.outputs.docx, report.outputs.html], {
        cwd: outputDir,
        stdio: "pipe",
      });
      report.checks.docxGenerated = existsSync(report.outputs.docx);
      report.checks.docxRenderer = "textutil";
      report.warnings.push("DOCX was generated with macOS textutil fallback; verify image embedding in Lark import.");
    } catch (error) {
      report.checks.docxSkippedReason = `textutil fallback failed: ${error.message}`;
      report[docxMode === "required" ? "errors" : "warnings"].push(report.checks.docxSkippedReason);
    }
  } else {
    report.checks.docxSkippedReason = "pandoc and textutil not found; install with `brew install pandoc` to generate import.docx";
    report[docxMode === "required" ? "errors" : "warnings"].push(report.checks.docxSkippedReason);
  }
}

if (strict && report.warnings.length > 0) {
  report.errors.push("strict mode treats warnings as errors");
}

writeFileSync(report.outputs.reportJson, JSON.stringify(report, null, 2));
writeFileSync(report.outputs.reportMarkdown, buildReportMarkdown(report));

if (report.errors.length > 0) {
  console.error(`lark paste pack generated with errors: ${outputDir}`);
  console.error(report.errors.join("\n"));
  process.exit(1);
}

console.log(outputDir);

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function parseBlocks(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].trim() });
      i += 1;
      continue;
    }

    const fence = /^```([A-Za-z0-9_-]+)?\s*$/.exec(line);
    if (fence) {
      const lang = fence[1] || "";
      const codeLines = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: lang.toLowerCase() === "mermaid" ? "mermaid" : "code", lang, code: codeLines.join("\n") });
      continue;
    }

    if (isTableStart(lines, i)) {
      const tableLines = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        tableLines.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: "table", lines: tableLines });
      continue;
    }

    const image = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/.exec(line.trim());
    if (image) {
      blocks.push({ type: "image", alt: image[1], href: image[2] });
      i += 1;
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const listLines = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        listLines.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: "list", lines: listLines });
      continue;
    }

    const paragraph = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !isTableStart(lines, i) &&
      !/^!\[([^\]]*)\]\(([^)]+)\)\s*$/.test(lines[i].trim())
    ) {
      paragraph.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
  }
  return blocks;
}

function isTableStart(lines, index) {
  return /^\s*\|.+\|\s*$/.test(lines[index] || "") && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1] || "");
}

function parseTable(lines) {
  const rows = lines.map((line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()));
  const headers = rows[0] || [];
  const body = rows.slice(2);
  return { headers, body };
}

function isShortKeyValueTable(table) {
  return table.headers.length === 2 && table.body.every((row) => row.every((cell) => cell.length <= 60 && !looksLongOrTechnical(cell)));
}

function renderTableAsList(table) {
  const markdown = [];
  const text = [];
  const sections = [];
  for (const row of table.body) {
    const titleHeader = table.headers[0] || "Item";
    const titleValue = row[0] || "Item";
    markdown.push(`**${titleHeader}: ${titleValue}**`);
    text.push(`${titleHeader}: ${titleValue}`);
    const items = [];
    for (let i = 1; i < table.headers.length; i += 1) {
      const label = table.headers[i] || `Column ${i + 1}`;
      const value = row[i] || "";
      markdown.push(`- ${label}: ${value}`);
      text.push(`- ${label}: ${value}`);
      items.push(`<li><strong>${inlineHtml(label)}:</strong> ${inlineHtml(value)}</li>`);
    }
    markdown.push("");
    text.push("");
    sections.push(`<section class="converted-table"><p><strong>${inlineHtml(titleHeader)}: ${inlineHtml(titleValue)}</strong></p><ul>${items.join("")}</ul></section>`);
  }
  return { markdown, text, html: sections.join("\n") };
}

function renderTableHtml(table) {
  const head = `<tr>${table.headers.map((cell) => `<th>${inlineHtml(cell)}</th>`).join("")}</tr>`;
  const body = table.body.map((row) => `<tr>${row.map((cell) => `<td>${inlineHtml(cell)}</td>`).join("")}</tr>`).join("");
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function renderListHtml(lines) {
  return `<ul>${lines.map((line) => `<li>${inlineHtml(line.replace(/^\s*[-*+]\s+/, ""))}</li>`).join("")}</ul>`;
}

function looksLongOrTechnical(cell) {
  return cell.length > 60 || /(`|https?:\/\/|\/api\/|src\/|\.ts|\.py|\.md|[A-Z_]{3,}|curl\s+)/.test(cell);
}

function resolveImage(href) {
  if (/^[a-z]+:\/\//i.test(href) || href.startsWith("data:")) return "";
  const clean = href.replace(/^<|>$/g, "").split("#")[0].split("?")[0];
  return isAbsolute(clean) ? clean : resolve(sourceDir, clean);
}

function copyImage(path, index) {
  const ext = extname(path) || ".bin";
  const target = join(assetsOriginal, `${String(index).padStart(2, "0")}-${basename(path, ext)}${ext}`);
  copyFileSync(path, target);
  return target;
}

function tryRenderMermaid(code, index) {
  if (!commandExists("mmdc")) return "";
  const input = join(assetsMermaid, `diagram-${index}.mmd`);
  const output = join(assetsMermaid, `diagram-${index}.png`);
  writeFileSync(input, code);
  const result = spawnSync("mmdc", ["-i", input, "-o", output, "-b", "transparent"], { encoding: "utf8" });
  if (result.status === 0 && existsSync(output)) return output;
  return "";
}

function commandExists(command) {
  const result = spawnSync("sh", ["-lc", `command -v ${shellQuote(command)} >/dev/null 2>&1`]);
  return result.status === 0;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function dataUri(path) {
  const ext = extname(path).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".gif" ? "image/gif" : ext === ".svg" ? "image/svg+xml" : "image/png";
  return `data:${mime};base64,${readFileSync(path).toString("base64")}`;
}

function buildHtmlDocument(title, body) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { max-width: 920px; margin: 32px auto; padding: 0 24px; font: 16px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1f2328; }
    h1, h2, h3, h4, h5, h6 { line-height: 1.3; margin: 1.4em 0 .55em; }
    code { background: #f6f8fa; padding: .12em .32em; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .92em; }
    pre { background: #f6f8fa; padding: 14px 16px; overflow-x: auto; border-radius: 6px; }
    pre code { background: transparent; padding: 0; }
    img { max-width: 100%; height: auto; }
    figure { margin: 18px 0; }
    figcaption { color: #59636e; font-size: 13px; margin-top: 6px; }
    .converted-table { border-left: 3px solid #d0d7de; padding-left: 14px; margin: 16px 0; }
    .converted-table p { margin: 0 0 6px; }
    .converted-table ul { margin-top: 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d0d7de; padding: 6px 8px; vertical-align: top; }
  </style>
</head>
<body>
${body}
</body>
</html>
`;
}

function scanSource(markdown) {
  return {
    source,
    lineCount: markdown.split(/\r?\n/).length,
    headingCount: countMatches(markdown, /^#{1,6}\s+/gm),
    imageCount: countMatches(markdown, /!\[[^\]]*]\([^)]+\)/g),
    mermaidCount: countMatches(markdown, /^```mermaid\s*$/gm),
    tableLineCount: countMatches(markdown, /^\s*\|/gm),
    sensitiveContentFound: findSensitive(markdown).length > 0,
  };
}

function buildChecklist(currentReport) {
  return `# Lark Paste Pack Checklist

## Before Paste

- [ ] \`copy.html\` opens locally.
- [ ] \`report.md\` has no fatal errors.
- [ ] HTML table count is acceptable: ${currentReport.checks.htmlTableCount}.
- [ ] Image count in HTML is ${currentReport.checks.htmlImageCount}; source image count is ${currentReport.stats.images}.
- [ ] Mermaid is rendered as image or marked for manual review.
- [ ] No \`file://\` references remain.
- [ ] No real API Key, Bearer token, private key, R2 Secret, or signed URL is present.

## Paste To Lark

- [ ] Open \`copy.html\`.
- [ ] Press \`Cmd+A\`.
- [ ] Press \`Cmd+C\`.
- [ ] Paste into a new Lark page or confirmed empty area.
- [ ] Do not repair malformed native Lark tables cell by cell; rebuild the pack if layout is wrong.

## After Paste

- [ ] Headings and outline are readable.
- [ ] Images are visible in Lark.
- [ ] Mermaid is visible as an image or preserved as a code block.
- [ ] Converted table sections are readable as grouped lists.
- [ ] API paths, file paths, and field names are not squeezed into narrow table cells.
`;
}

function buildReportMarkdown(currentReport) {
  const outputRows = Object.entries(currentReport.outputs).map(([name, path]) => `- ${name}: \`${path}\``).join("\n");
  return `# Lark Paste Pack Report

## Source

\`${currentReport.source}\`

## Output Directory

\`${currentReport.outputDir}\`

## Stats

- Lines: ${currentReport.stats.lines}
- Headings: ${currentReport.stats.headings}
- Images: ${currentReport.stats.images}
- Mermaid blocks: ${currentReport.stats.mermaidBlocks}
- Table blocks: ${currentReport.stats.tableBlocks}
- Converted tables: ${currentReport.stats.convertedTables}
- Kept tables: ${currentReport.stats.keptTables}

## Checks

- HTML table count: ${currentReport.checks.htmlTableCount}
- HTML image count: ${currentReport.checks.htmlImageCount}
- Missing images: ${currentReport.checks.missingImages.length}
- Contains file://: ${currentReport.checks.fileSchemeReferences}
- Sensitive content found: ${currentReport.checks.sensitiveContentFound}
- DOCX generated: ${currentReport.checks.docxGenerated}
- DOCX renderer: ${currentReport.checks.docxRenderer || "n/a"}
- DOCX note: ${currentReport.checks.docxSkippedReason || "n/a"}

## Warnings

${currentReport.warnings.length ? currentReport.warnings.map((item) => `- ${item}`).join("\n") : "- None"}

## Errors

${currentReport.errors.length ? currentReport.errors.map((item) => `- ${item}`).join("\n") : "- None"}

## Outputs

${outputRows}

## Manual Actions

${currentReport.manualActions.map((item) => `- ${item}`).join("\n")}
`;
}

function findSensitive(text) {
  const allowed = text
    .replaceAll("<your-api-key>", "")
    .replaceAll("$API_KEY", "")
    .replaceAll("API_KEY", "")
    .replaceAll("SIGNED_URL_PLACEHOLDER", "");
  const matches = [];
  const patterns = [
    ["private key", /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/],
    ["bearer token", /Bearer\s+[A-Za-z0-9._~+/=-]{20,}/],
    ["secret assignment", /\b(api[_-]?key|secret|access[_-]?token)\b\s*[:=]\s*["']?[A-Za-z0-9_\-]{24,}/i],
    ["signed url signature", new RegExp("X-Goog-" + "Signature=[0-9a-f]{32,}", "i")],
  ];
  for (const [label, pattern] of patterns) {
    if (pattern.test(allowed)) matches.push(label);
  }
  return matches;
}

function inlineHtml(value) {
  let html = escapeHtml(value);
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');
  return html;
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

function countMatches(value, pattern) {
  return [...String(value).matchAll(pattern)].length;
}
