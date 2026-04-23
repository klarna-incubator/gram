#!/usr/bin/env node
/**
 * list-component-classes.mjs — Gram component class catalog generator
 *
 * Reads all installed Gram plugin class files and prints every available
 * component class (id, name, icon path, source plugin). Useful for AI
 * agents and developers when assigning tech-stack classes to components
 * in a threat-model JSON.
 *
 * Usage (run from repo root):
 *   node scripts/list-component-classes.mjs
 *   node scripts/list-component-classes.mjs --format json
 *   node scripts/list-component-classes.mjs --filter aws
 *   node scripts/list-component-classes.mjs --plugin aws
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const PLUGIN_CLASS_FILES = {
  aws: "plugins/aws/src/classes.ts",
  azure: "plugins/azure/src/classes.ts",
  svgporn: "plugins/svgporn/src/classes.ts",
  kubernetes: "plugins/kubernetes/src/classes.ts",
  cncf: "plugins/cncf/src/classes.ts",
};

function parseTsClasses(filepath) {
  const content = readFileSync(filepath, "utf8");
  const blocks = content.match(/\{[^{}]+\}/g) ?? [];
  const entries = [];
  for (const block of blocks) {
    const idMatch = block.match(/id:\s*["']([^"']+)["']/);
    const nameMatch = block.match(/name:\s*["']([^"']+)["']/);
    const iconMatch = block.match(/icon:\s*["']([^"']+)["']/);
    const typeMatch = block.match(/componentType:\s*["']([^"']+)["']/);
    if (idMatch && nameMatch) {
      entries.push({
        id: idMatch[1],
        name: nameMatch[1],
        icon: iconMatch ? iconMatch[1] : "",
        componentType: typeMatch ? typeMatch[1] : "any",
      });
    }
  }
  return entries;
}

function printHelp() {
  process.stdout.write(
    [
      "Usage: node scripts/list-component-classes.mjs [options]",
      "",
      "Options:",
      "  --format <table|json>   Output format (default: table)",
      "  --filter <term>         Case-insensitive substring filter on class name",
      `  --plugin <name>         Restrict to a single plugin (${Object.keys(PLUGIN_CLASS_FILES).join("|")})`,
      "  --help                  Show this help and exit",
      "",
    ].join("\n")
  );
}

function padRight(str, width) {
  const s = String(str);
  return s.length >= width ? s : s + " ".repeat(width - s.length);
}

function main() {
  const { values } = parseArgs({
    options: {
      format: { type: "string", default: "table" },
      filter: { type: "string" },
      plugin: { type: "string" },
      help: { type: "boolean", default: false },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    printHelp();
    return;
  }

  if (!["table", "json"].includes(values.format)) {
    process.stderr.write(`Invalid --format: ${values.format} (use table|json)\n`);
    process.exit(2);
  }

  if (values.plugin && !(values.plugin in PLUGIN_CLASS_FILES)) {
    process.stderr.write(
      `Unknown --plugin: ${values.plugin} (use ${Object.keys(PLUGIN_CLASS_FILES).join("|")})\n`
    );
    process.exit(2);
  }

  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const plugins = values.plugin
    ? { [values.plugin]: PLUGIN_CLASS_FILES[values.plugin] }
    : PLUGIN_CLASS_FILES;

  let allClasses = [];
  for (const [pluginName, relPath] of Object.entries(plugins)) {
    const fpath = resolve(repoRoot, relPath);
    if (!existsSync(fpath)) {
      process.stderr.write(`WARNING: ${fpath} not found — skipping\n`);
      continue;
    }
    for (const entry of parseTsClasses(fpath)) {
      allClasses.push({ ...entry, plugin: pluginName });
    }
  }

  if (values.filter) {
    const term = values.filter.toLowerCase();
    allClasses = allClasses.filter((c) => c.name.toLowerCase().includes(term));
  }

  allClasses.sort((a, b) => {
    if (a.plugin !== b.plugin) return a.plugin < b.plugin ? -1 : 1;
    const an = a.name.toLowerCase();
    const bn = b.name.toLowerCase();
    if (an !== bn) return an < bn ? -1 : 1;
    return 0;
  });

  if (values.format === "json") {
    process.stdout.write(JSON.stringify(allClasses, null, 2) + "\n");
    return;
  }

  const colW = { plugin: 10, name: 50, id: 36, icon: 70 };
  const header =
    `${padRight("PLUGIN", colW.plugin)}  ` +
    `${padRight("NAME", colW.name)}  ` +
    `${padRight("ID", colW.id)}  ` +
    "ICON";
  const sep = "-".repeat(header.length + 10);

  process.stdout.write(sep + "\n");
  process.stdout.write(header + "\n");
  process.stdout.write(sep + "\n");
  for (const c of allClasses) {
    process.stdout.write(
      `${padRight(c.plugin, colW.plugin)}  ` +
        `${padRight(c.name, colW.name)}  ` +
        `${padRight(c.id, colW.id)}  ` +
        `${c.icon}\n`
    );
  }
  process.stdout.write(sep + "\n");
  process.stdout.write(`Total: ${allClasses.length} classes\n`);
}

main();
