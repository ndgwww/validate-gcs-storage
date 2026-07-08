#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
const pack = args.pack ? resolve(String(args.pack)) : "";
if (!pack) fail("missing --pack <generated-pack-dir>");
if (!existsSync(pack)) fail(`pack directory does not exist: ${pack}`);

const required = [
  "00-source-scan.json",
  "01-normalized.md",
  "copy.html",
  "copy.txt",
  "report.md",
  "report.json",
  "CHECKLIST.md",
];

for (const file of required) {
  if (!existsSync(join(pack, file))) fail(`missing required output: ${file}`);
}

const report = JSON.parse(readFileSync(join(pack, "report.json"), "utf8"));
const html = readFileSync(join(pack, "copy.html"), "utf8");
const text = readFileSync(join(pack, "copy.txt"), "utf8");

if (Array.isArray(report.errors) && report.errors.length > 0) {
  fail(`report contains errors: ${report.errors.join("; ")}`);
}

if (html.includes("file://") || text.includes("file://")) {
  fail("generated outputs contain file:// references");
}

const htmlTableCount = countMatches(html, /<table\b/gi);
if (htmlTableCount > 0 && !report.options?.keepTables) {
  fail(`copy.html contains ${htmlTableCount} table(s) but keepTables is not enabled`);
}

if (findSensitive(`${html}\n${text}`).length > 0) {
  fail("generated outputs appear to contain sensitive content");
}

console.log(`lark paste pack is valid: ${pack}`);

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

function countMatches(value, pattern) {
  return [...String(value).matchAll(pattern)].length;
}

function findSensitive(text) {
  const allowed = text
    .replaceAll("<your-api-key>", "")
    .replaceAll("$API_KEY", "")
    .replaceAll("API_KEY", "")
    .replaceAll("SIGNED_URL_PLACEHOLDER", "");
  return [
    /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/,
    /Bearer\s+[A-Za-z0-9._~+/=-]{20,}/,
    /\b(api[_-]?key|secret|access[_-]?token)\b\s*[:=]\s*["']?[A-Za-z0-9_\-]{24,}/i,
    new RegExp("X-Goog-" + "Signature=[0-9a-f]{32,}", "i"),
  ].filter((pattern) => pattern.test(allowed));
}
