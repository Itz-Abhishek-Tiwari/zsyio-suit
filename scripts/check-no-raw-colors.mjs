// CI guard for §6.6: no raw hex codes / inline color styles outside tokens/primitives.json.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { existsSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const SCAN_DIRS = [
  "apps/pms/src",
  "apps/notes/src",
  "packages/ui/src",
  "packages/editor/src",
  "packages/auth/src",
  "packages/validators/src",
  "packages/database/src",
  "plugins",
];
const IGNORE = new Set(["tokens.css", "primitives.json", "email.ts"]);
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;

async function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, files);
    } else if (/\.(tsx?|css)$/.test(entry.name) && !IGNORE.has(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

let violations = [];
for (const dir of SCAN_DIRS) {
  const dirPath = path.join(root, dir);
  if (!existsSync(dirPath)) continue;
  const files = await walk(dirPath);
  for (const file of files) {
    const content = await readFile(file, "utf-8");
    const lines = content.split("\n");
    lines.forEach((line, i) => {
      if (HEX_RE.test(line)) {
        violations.push(`${path.relative(root, file)}:${i + 1}: ${line.trim()}`);
      }
    });
  }
}

if (violations.length) {
  console.error("Raw hex colors found outside tokens/primitives.json:\n");
  violations.forEach((v) => console.error(`  ${v}`));
  process.exit(1);
} else {
  console.log("No raw hex colors found outside tokens/primitives.json.");
}
