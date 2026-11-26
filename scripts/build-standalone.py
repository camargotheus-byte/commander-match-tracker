#!/usr/bin/env python3
"""
Zero-dependency standalone HTML bundler for MTG Match Tracker.
Walks the ES module graph starting from src/main.js in topological order,
inlines src/styles/*.css and logo.svg favicon, and produces a single-file
HTML bundle (useful for offline file:// opening or personal local builds).

Usage:
  python scripts/build-standalone.py [output_path] [--seed path/to/backup.json]

Options:
  --seed <file.json>  Optional personal Hub backup JSON whose `matches` array is
                      embedded as the initial default dataset for local PC usage.
                      Without --seed, the bundle starts blank (Public Beta mode).
"""

import argparse
import json
import os
import re
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


def load_seed_payload(seed_path):
    with open(seed_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if isinstance(data, dict) and isinstance(data.get('matches'), list):
        return {
            'matches': data['matches'],
            'favorites': data.get('favorites') if isinstance(data.get('favorites'), list) else [],
            'deckStyles': data.get('deckStyles') if isinstance(data.get('deckStyles'), dict) else {},
            'deckMeta': data.get('deckMeta') if isinstance(data.get('deckMeta'), dict) else {},
            'registeredDecks': data.get('registeredDecks') if isinstance(data.get('registeredDecks'), list) else [],
        }
    if isinstance(data, list):
        return {'matches': data, 'favorites': [], 'deckStyles': {}, 'deckMeta': {}, 'registeredDecks': []}
    raise ValueError(f'Invalid seed JSON format in {seed_path}: expected object with "matches" array or array.')


def inject_marker(code, tag, value):
    start = f'/*{tag}_START*/'
    end = f'/*{tag}_END*/'
    if start not in code:
        return code
    safe_json = json.dumps(value, ensure_ascii=False).replace('</', '<\\/')
    return re.sub(
        rf'/\*{re.escape(tag)}_START\*/[\s\S]*?/\*{re.escape(tag)}_END\*/',
        lambda _: f'{start}{safe_json}{end}',
        code
    )


def build_bundle(out_path, seed_path=None):
    modules = collect_modules(ENTRY)
    seed_payload = load_seed_payload(seed_path) if seed_path else None

    js_chunks = []
    for mod in modules:
        rel = os.path.relpath(mod, ROOT).replace('\\', '/')
        with open(mod, 'r', encoding='utf-8') as f:
            raw = f.read()
        cleaned = strip_module_syntax(raw)
        if seed_payload is not None:
            cleaned = inject_marker(cleaned, 'CMT_INITIAL_SEED', seed_payload['matches'])
            cleaned = inject_marker(cleaned, 'CMT_INITIAL_FAVS', seed_payload['favorites'])
            cleaned = inject_marker(cleaned, 'CMT_INITIAL_STYLES', seed_payload['deckStyles'])
            cleaned = inject_marker(cleaned, 'CMT_INITIAL_DECK_META', seed_payload['deckMeta'])
            cleaned = inject_marker(cleaned, 'CMT_INITIAL_REG_DECKS', seed_payload['registeredDecks'])
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
    html = re.sub(r'\s*<link rel="apple-touch-icon"[^>]*>\n?', '\n', html)
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
    seed_info = f' with {len(seed_payload["matches"])} seeded matches' if seed_payload is not None else ' (blank beta mode)'
    print(f'Bundled {len(modules)} modules{seed_info} -> {out_path} ({os.path.getsize(out_path)} bytes)')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Bundle MTG Match Tracker into a standalone HTML file.')
    parser.add_argument('output', nargs='?', default=DEFAULT_OUT, help='Destination .html path')
    parser.add_argument('--seed', dest='seed', default=None, help='Optional personal backup .json to embed as initial seed')
    args = parser.parse_args()
    build_bundle(args.output, args.seed)
