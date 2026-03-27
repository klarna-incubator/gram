#!/usr/bin/env python3
"""
list-component-classes.py — Gram component class catalog generator

Reads all installed Gram plugin class files and prints every available
component class (id, name, icon path, source plugin).  Useful for AI
agents and developers when assigning tech-stack classes to components
in a threat-model JSON.

Usage (run from repo root):
    python3 scripts/list-component-classes.py
    python3 scripts/list-component-classes.py --format json
    python3 scripts/list-component-classes.py --filter aws
"""

import argparse
import json
import re
import sys
from pathlib import Path


PLUGIN_CLASS_FILES = {
    "klarna":    "plugins/klarna/src/classes.ts",
    "aws":       "plugins/aws/src/classes.ts",
    "azure":     "plugins/azure/src/classes.ts",
    "svgporn":   "plugins/svgporn/src/classes.ts",
    "kubernetes":"plugins/kubernetes/src/classes.ts",
    "cncf":      "plugins/cncf/src/classes.ts",
}


def parse_ts_classes(filepath: Path) -> list[dict]:
    """Parse { id, name, icon, componentType } object literals from a TS file."""
    content = filepath.read_text()
    entries = []
    for block in re.findall(r'\{[^{}]+\}', content, re.DOTALL):
        id_m   = re.search(r'id:\s*["\']([^"\']+)["\']', block)
        name_m = re.search(r'name:\s*["\']([^"\']+)["\']', block)
        icon_m = re.search(r'icon:\s*["\']([^"\']+)["\']', block)
        type_m = re.search(r'componentType:\s*["\']([^"\']+)["\']', block)
        if id_m and name_m:
            entries.append({
                "id":            id_m.group(1),
                "name":          name_m.group(1),
                "icon":          icon_m.group(1) if icon_m else "",
                "componentType": type_m.group(1) if type_m else "any",
            })
    return entries


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--format", choices=["table", "json"], default="table",
                        help="Output format (default: table)")
    parser.add_argument("--filter", metavar="TERM",
                        help="Case-insensitive substring filter on class name")
    parser.add_argument("--plugin", choices=list(PLUGIN_CLASS_FILES.keys()),
                        help="Restrict to a single plugin")
    args = parser.parse_args()

    repo_root = Path(__file__).parent.parent
    all_classes = []

    plugins = {args.plugin: PLUGIN_CLASS_FILES[args.plugin]} if args.plugin else PLUGIN_CLASS_FILES
    for plugin_name, rel_path in plugins.items():
        fpath = repo_root / rel_path
        if not fpath.exists():
            print(f"WARNING: {fpath} not found — skipping", file=sys.stderr)
            continue
        for entry in parse_ts_classes(fpath):
            all_classes.append({**entry, "plugin": plugin_name})

    if args.filter:
        term = args.filter.lower()
        all_classes = [c for c in all_classes if term in c["name"].lower()]

    all_classes.sort(key=lambda c: (c["plugin"], c["name"].lower()))

    if args.format == "json":
        print(json.dumps(all_classes, indent=2))
        return

    # Table output
    col_w = {"plugin": 10, "name": 50, "id": 36, "icon": 70}
    header = (f"{'PLUGIN':<{col_w['plugin']}}  {'NAME':<{col_w['name']}}  "
              f"{'ID':<{col_w['id']}}  ICON")
    sep = "-" * (len(header) + 10)
    print(sep)
    print(header)
    print(sep)
    for c in all_classes:
        print(f"{c['plugin']:<{col_w['plugin']}}  "
              f"{c['name']:<{col_w['name']}}  "
              f"{c['id']:<{col_w['id']}}  "
              f"{c['icon']}")
    print(sep)
    print(f"Total: {len(all_classes)} classes")


if __name__ == "__main__":
    main()
