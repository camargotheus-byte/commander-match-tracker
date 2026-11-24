#!/usr/bin/env python3
"""
Zero-dependency standalone HTML bundler for MTG Match Tracker.
Walks the ES module graph starting from src/main.js in topological order,
inlines src/styles/*.css and logo.svg favicon, and produces a single-file
HTML bundle (useful for offline file:// opening or inline chat artifacts).

Usage:
  python scripts/build-standalone.py [output_path]
"""

import os
import re
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTRY = os.path.normpath(os.path.join(ROOT, 'src', 'main.js'))
INDEX_HTML = os.path.join(ROOT, 'index.html')
LOGO_SVG = os.path.join(ROOT, 'logo.svg')
DEFAULT_OUT = os.path.join(ROOT, 'dist', 'commander-match-tracker-standalone.html')

IMPORT_RE = re.compile(
    r'^\s*import\s+(?:[\s\S]*?\s+from\s+)?[\'"]([^\'"]+)[\'"]\s*;?\s*$',
    re.MULTILINE
)


def collect_modules(entry_path):
    visited = set()
    visiting = set()
    order = []

    def dfs(path):
        norm = os.path.normpath(path)
        if norm in visited:
            return
        if norm in visiting:
            raise RuntimeError(f'Circular ES module import detected at: {norm}')
        visiting.add(norm)
        with open(norm, 'r', encoding='utf-8') as f:
            code = f.read()
        for m in IMPORT_RE.finditer(code):
            rel = m.group(1)
            dep = os.path.normpath(os.path.join(os.path.dirname(norm), rel))
            if not os.path.exists(dep):
                raise FileNotFoundError(f'Missing import {rel} from {norm}')
            dfs(dep)
        visiting.remove(norm)
        visited.add(norm)
        order.append(norm)

    dfs(entry_path)
    return order


def strip_module_syntax(code):
    code = IMPORT_RE.sub('', code)
    code = re.sub(r'^\s*export\s+\{\s*\}\s*;?\s*$', '', code, flags=re.MULTILINE)
    code = re.sub(r'^(\s*)export\s+(?=(?:const|let|var|function|class|async\s+function)\b)', r'\1', code, flags=re.MULTILINE)
    return code.strip()


def build_bundle(out_path):
    modules = collect_modules(ENTRY)
    js_chunks = []
    for mod in modules:
        rel = os.path.relpath(mod, ROOT).replace('\\', '/')
        with open(mod, 'r', encoding='utf-8') as f:
            raw = f.read()
        cleaned = strip_module_syntax(raw)
        if cleaned:
            js_chunks.append(f'// --- MODULE: {rel} ---\n{cleaned}')

    bundled_js = '(function () {\n"use strict";\n\n' + '\n\n'.join(js_chunks) + '\n})();'

    css_files = [
        os.path.join(ROOT, 'src', 'styles', 'tokens.css'),
        os.path.join(ROOT, 'src', 'styles', 'components.css')
    ]
    bundled_css = '\n\n'.join(open(p, 'r', encoding='utf-8').read().strip() for p in css_files)

    with open(LOGO_SVG, 'r', encoding='utf-8') as f:
        logo_uri = 'data:image/svg+xml,' + urllib.parse.quote(f.read().strip(), safe='')

    with open(INDEX_HTML, 'r', encoding='utf-8') as f:
        html = f.read()

    html = re.sub(r'\s*<link rel="manifest"[^>]*>\n?', '\n', html)
    html = html.replace('href="./logo.svg"', f'href="{logo_uri}"')
    html = re.sub(
        r'\s*<link rel="stylesheet" href="\./src/styles/tokens\.css"\s*/>\s*\n\s*<link rel="stylesheet" href="\./src/styles/components\.css"\s*/>',
        f'\n  <style id="cmt-base-style">\n{bundled_css}\n  </style>',
        html
    )
    html = html.replace(
        '<script type="module" src="./src/main.js"></script>',
        f'<script id="cmt-app-script">\n{bundled_js}\n  </script>'
    )

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'Bundled {len(modules)} modules -> {out_path} ({os.path.getsize(out_path)} bytes)')


if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUT
    build_bundle(target)
