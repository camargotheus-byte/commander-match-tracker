# Architecture & Engineering Standards — MTG Match Tracker

> [!IMPORTANT]
> **PERMANENT GOVERNANCE RULE (MANDATORY FOR ALL CONTRIBUTORS & AI AGENTS):**
> Every new feature, tab, UI component, service, or structural adjustment **MUST** follow the Feature-Based Modular Architecture defined in this document. Whenever a new folder, tab/route, storage key, or convention is created or modified, **`ARCHITECTURE.md` MUST be updated in the same change**.

---

## 1. Architectural Overview

**MTG Match Tracker** is structured as a **Zero-Build Native ES Modules (`type="module"`)** web application with a **Feature-Based** modular architecture:

- **GitHub Pages Ready:** Runs directly as static files (`index.html` + `src/**`) over HTTPS with zero build step or external bundler required.
- **App-Packaging Ready:** Includes `manifest.webmanifest` for instant **PWA** installation on Android, iOS, and desktop, and follows a clean `index.html` + `src/` boundary that plugs directly into **Capacitor** (native Android/iOS) or **Vite** without rewriting feature code.
- **Single-File Standalone Export:** Includes `scripts/build-standalone.py` to compile the entire modular ES dependency graph into a single standalone `.html` file for offline `file://` usage or inline artifact previews.

---

## 2. Complete Directory Tree & Folder Responsibilities

```text
commander-match-tracker/
├── index.html                                  # Thin HTML shell: header, nav, filters markup, CSS links, <script type="module" src="./src/main.js">
├── manifest.webmanifest                        # PWA manifest (standalone display, theme color, brand icon)
├── logo.svg                                    # Official vector brand mark (3 fanned cards + chart, Sun-Washed Laguna)
├── .nojekyll                                   # Disables Jekyll processing on GitHub Pages for fast raw static ES module delivery
├── .gitignore                                  # Ignores OS/editor files, dist builds, and personal local .json/.csv backups
├── ARCHITECTURE.md                             # Canonical architecture map, coding conventions & permanent governance rules (this file)
├── README.md                                   # Project overview, feature list, changelog & deployment instructions
│
├── scripts/
│   └── build-standalone.py                     # Zero-dependency Python ES-module bundler for single-file standalone HTML output
│
└── src/
    ├── main.js                                 # Application bootstrap: binds tooltips, header, filters, feature handlers & master render loop
    │
    ├── styles/
    │   ├── tokens.css                          # Sun-Washed Laguna palette colors, body surface & semantic win-rate text colors
    │   └── components.css                      # Neo-Brutalist Pop-Folder primitives (.nb-card, .nb-folder, .nb-btn, badges, scrollbars, animations)
    │
    ├── core/                                   # Global application infrastructure (format-agnostic, no feature-specific UI)
    │   ├── data/
    │   │   ├── raw-dataset.js                  # Embedded verified snapshot of Google Sheets match records (RAW)
    │   │   └── matches.repository.js           # Unified local CRUD hub (BASE_MATCHES auto-migration, edit/delete, per-format isolation, ID gen & filtering)
    │   ├── formats/
    │   │   └── formats.config.js               # Catalog of 23 playable MTG formats, ID prefixes, default opponent counts & commander-format flags
    │   ├── i18n/
    │   │   └── i18n.service.js                 # Bilingual PT-BR / EN helpers (tr, months, result labels/codes, numeric/turn-order formatting)
    │   ├── router/
    │   │   └── tabs.registry.js                # Canonical registry mapping each tab ID to its feature renderer
    │   ├── state/
    │   │   ├── store.js                        # Centralized reactive app state, active format key & cross-profile filter reset
    │   │   └── types.js                        # Shared JSDoc @typedef domain contracts (MatchRecord, DeckMetaEntry, FormatDefinition, ManaCode)
    │   ├── storage/
    │   │   ├── storage.service.js              # Single persistence adapter + mutation events (localStorage today; swap point for SQLite/Cloud)
    │   │   └── backup.service.js               # Versioned .json Backup Export/Import (schemaVersion: 1) & File System Access API auto-sync
    │
    ├── shared/                                 # Reusable UI primitives, static catalogs & pure utilities shared across 2+ features
    │   ├── components/
    │   │   ├── badges.view.js                  # Dynamic deck badge evaluator & renderer (CLASSIC, ON FIRE, UNDEFEATED, TOP, BORROWED, HONORABLE)
    │   │   ├── data-hub-modal.view.js          # Personal Data Hub modal: Export/Import .json backup, Auto-Save file link & seed restore
    │   │   ├── deck-folder-card.view.js        # Reusable Pop-Folder deck card (used by Overview & Decks)
    │   │   ├── empty-state.view.js             # Empty profile onboarding card, empty favorites & empty filter views
    │   │   ├── filters-bar.view.js             # Quick search, favorites toggle, structured filter drawer & active filter chips
    │   │   ├── header.view.js                  # Top bar i18n sync, MTG format profile dropdown, language switcher & header scope summary
    │   │   ├── hscroll-table.js                # Mobile-first horizontal table scroll wrapper + interactive top mini-scrollbar
    │   │   ├── mana-identity.view.js           # Renders minimalist WUBRG mana icons (Sun, Droplet, Skull, Flame, Tree) + Colorless Diamond (C)
    │   │   ├── toast.js                        # Floating toast notifications & clipboard copy helper
    │   │   └── tooltip.js                      # Universal delayed tooltip engine (1.5s desktop hover · tap / 500ms mobile long-press)
    │   ├── constants/
    │   │   ├── icons.js                        # 17 minimalist SVG deck icons + Sun-Washed Laguna folder palette options
    │   │   └── mana-identity.data.js           # Verified WUBRG/Colorless identity maps (25 user decks + 126 enemy commanders) & combo labels
    │   └── utils/
    │       ├── deck-style.service.js           # Favorites, custom deck icon/color styles & deck metadata (commander, partner, colors, decklist URL)
    │       ├── formatters.js                   # HTML escaping, percentages, turns, BR/EN date formatting, URL sanitization & Scryfall links
    │       └── stats.utils.js                  # Pure analytics math (calcStats, calcTurnStats, wilsonScore, groupDecks, groupPlayers, groupEnemyCmds)
    │
    └── features/                               # Self-contained vertical slices — one folder per main tab/section
        ├── overview/
        │   ├── overview.service.js             # Monthly volume/WR series & cumulative WR series builders
        │   ├── overview.view.js                # 5 KPI folder cards, top decks grid, monthly chart, pod breakdown, cumulative curve & turn pace
        │   └── overview.handlers.js            # Month click filter, pod-size click filter & quick tab jumps
        │
        ├── decks/
        │   ├── decks.service.js                # Filtering, Wilson/WR/volume sorting & Honorable Mentions (<5 games) split
        │   ├── deck-trajectory.view.js         # Chronological deck performance SVG chart + before/after decklist update marker
        │   ├── decks.view.js                   # Folder/table deck views, scatter plot & sticky Deck X-Ray (commander/partner/colors/decklist/style)
        │   └── decks.handlers.js               # Deck selection, customizer, commander/partner/mana editor & decklist metadata form handlers
        │
        ├── opponents/
        │   ├── opponents.service.js            # Rival commander attribution (with player aliases) & enemy commander search (name/pilot/color combo)
        │   ├── opponents.view.js               # Players table + sticky Rival X-Ray, Enemy Commanders table (WUBRG + Scryfall) & Deck × Opponent heatmap
        │   └── opponents.handlers.js           # Rival selection, cross-navigation to History/Deck X-Ray, sub-tab switches & heatmap cell drills
        │
        ├── performance/
        │   ├── performance.data.js             # Verified MTG win-rate benchmarks, Playgroup.gg seat-order curve & trusted primary source links
        │   ├── performance.service.js          # 1v1 & 4P skill-tier classifiers, automated diagnostics, pod-adjusted Δ efficiency & seat-order stats
        │   └── performance.view.js             # 1v1/4P benchmark gauges, insight cards, Δ Real deck table, seat-order comparison & reference table
        │
        ├── history/
        │   ├── history.service.js              # Local history filtering, sort order & format-tagged UTF-8 CSV export
        │   ├── history.view.js                 # Full match log table with inline match editor (edit/delete directly in Hub)
        │   └── history.handlers.js             # History search, result pills, inline edit/delete CRUD & CSV export click handler
        │
        └── report/
            ├── report.service.js               # Template text & Google Sheets TSV generators, paste-to-import parser & match submission
            ├── report.view.js                  # Structured match form (date picker, turns, adaptive opponents), live preview & format-scoped local queue
            └── report.handlers.js              # Form inputs, pod presets, winner toggles, paste parser & local queue copy/remove actions
```

---

## 3. Route / Tab Registry Map

All top-level navigation tabs are registered in `src/core/router/tabs.registry.js`:

| Tab ID (`state.tab`) | PT-BR Label | English Label | Feature Directory | Primary View |
| :--- | :--- | :--- | :--- | :--- |
| `overview` | Visão Geral | Overview | `src/features/overview/` | `overview.view.js` |
| `decks` | Decks | Decks | `src/features/decks/` | `decks.view.js` |
| `opponents` | Oponentes | Opponents | `src/features/opponents/` | `opponents.view.js` |
| `performance` | Performance | Performance | `src/features/performance/` | `performance.view.js` |
| `history` | Histórico | History | `src/features/history/` | `history.view.js` |
| `report` | Reportar | Report | `src/features/report/` | `report.view.js` |

---

## 4. Dependency Graph & Architectural Rules

### Strict Layering (Zero Circular Dependencies)
Dependencies flow strictly downward:

```text
src/main.js
  └── src/core/router/tabs.registry.js
        └── src/features/<feature>/*      (views, services, handlers, feature data)
              ├── src/shared/*            (reusable components, constants, utils)
              └── src/core/*              (state, data repository, i18n, formats, storage)
```

### Mandatory Boundary Rules
1. **No Cross-Feature Imports:** A file inside `src/features/A/` **MUST NEVER** import directly from `src/features/B/`. If logic or UI is needed by two or more features, promote it to `src/shared/` or `src/core/`.
2. **Handler Context Injection:** Feature `*.handlers.js` modules **MUST NOT** import `src/main.js`. Instead, `main.js` passes `{ render, onDataChange, scrollToSection }` into each handler function.
3. **Single Persistence Gateway:** Direct calls to `localStorage` are forbidden outside `src/core/storage/storage.service.js`. All persistent features must read/write via `storage.service.js` so future native/cloud backends require changing only one file.

---

## 5. Data Persistence Contract

All client-side persistence uses versioned keys declared in `STORAGE_KEYS` (`src/core/storage/storage.service.js`):

| Storage Key | Type | Owner Module | Purpose |
| :--- | :--- | :--- | :--- |
| `cmt_format_v1` | `string` | `core/formats/formats.config.js` | Active MTG format profile key (default: `'commander'`) |
| `cmt_lang_v1` | `'pt' \| 'en'` | `core/state/store.js` | Active UI language (default: `'pt'`) |
| `cmt_hub_matches_v1` | `MatchRecord[]` | `core/data/matches.repository.js` | Unified Personal Hub database (migrated from seed + all added/edited matches across all formats) |
| `cmt_hub_meta_v1` | `Object` | `core/storage/backup.service.js` | Backup timestamps (`lastBackupAt`, `lastImportAt`, `lastLinkedFile`) |
| `cmt_pending_reports_v1` | `MatchRecord[]` | `core/data/matches.repository.js` | Legacy migration key (auto-merged into `cmt_hub_matches_v1` on first boot) |
| `cmt_favorite_decks_v1` | `string[]` | `shared/utils/deck-style.service.js` | Starred favorite deck names |
| `cmt_deck_styles_v1` | `Record<string, {icon?, color?}>` | `shared/utils/deck-style.service.js` | Custom SVG icon and Sun-Washed Laguna folder color per deck |
| `cmt_deck_meta_v1` | `Record<string, DeckMetaEntry>` | `shared/utils/deck-style.service.js` | Commander(s), Partner toggle, custom WUBRG colors, decklist URL & update date |

### Backup JSON Schema (`schemaVersion: 1`)
Exported via `backup.service.js` (`mtg-match-tracker-backup-YYYY-MM-DD.json`) and designed for lossless future migration to **Supabase** or **GitHub API**:
- `schemaVersion`: `1`
- `app`: `'mtg-match-tracker'`
- `exportedAt`: ISO-8601 timestamp
- `preferences`: `{ format, lang }`
- `matches`: full `MatchRecord[]` array across all 23 formats
- `favorites`, `deckStyles`, `deckMeta`: all deck customizations and metadata

### Profile Isolation Contract
- Every `MatchRecord` carries a `format` field (e.g., `'commander'`, `'pauper'`, `'pioneer'`).
- Embedded historical records in `raw-dataset.js` default to `'commander'`.
- `getMatches()` and `getFilteredMatches()` always return records strictly scoped to `activeFormatKey`.
- Switching format profiles resets cross-profile filters (`resetProfileFilters()`) and updates default report opponent slots (`defaultOpps`).

---

## 6. Coding, Naming & UI Conventions

- **File Naming (`kebab-case` + role suffix):**
  - `*.view.js` — pure HTML/SVG template rendering functions (no direct event binding)
  - `*.service.js` — business logic, sorting, parsing, aggregations, exports
  - `*.handlers.js` — DOM click/input/change delegation returning `true` when an event was handled
  - `*.data.js` / `*.config.js` — static domain tables, benchmarks, icon/color registries
  - `*.repository.js` — dataset hydration, querying and mutation
- **Bilingual Parity:** Every user-facing string, tooltip (`data-tip`), placeholder, aria-label, and toast **MUST** use `tr(pt, en)` from `src/core/i18n/i18n.service.js`.
- **Design System (*Sun-Washed Laguna*):**
  - Reuse `.nb-card`, `.nb-card-sm`, `.nb-folder`, `.nb-subtle`, `.nb-btn`, `.nb-pill`, and `.badge-*` from `src/styles/components.css`.
  - Keep minimum readable text at `text-xs` (`12px`) and wrap every wide data table with `wrapHScroll()` from `src/shared/components/hscroll-table.js`.
- **Tooltips:** Always use `data-tip="..."` (escaped via `esc()`) so all desktop (1.5s hover delay) and mobile (tap / 500ms long-press) tooltips follow one universal rule.
- **Unique Top-Level Symbols:** Keep exported and top-level function/constant names unique across `src/` so `scripts/build-standalone.py` can bundle all modules into a single IIFE without collisions.

---

## 7. Running, Bundling & Future App Packaging

- **GitHub Pages (Production):** Push the repository root (`index.html`, `manifest.webmanifest`, `logo.svg`, `src/`). No build step needed.
- **Local Development:** Run `python -m http.server 8080` inside the project root and open `http://localhost:8080` (browsers restrict ES module imports over `file://`).
- **Standalone Offline / Artifact Bundle:** Run `python scripts/build-standalone.py [output.html]` to generate a single self-contained HTML file.
- **Future Native Mobile App (Capacitor):** Because `index.html`, `manifest.webmanifest`, `logo.svg`, and `src/` are already cleanly separated and storage is centralized in `src/core/storage/storage.service.js`, wrapping into iOS/Android requires only initializing Capacitor pointing `webDir` to the root (or Vite `dist/`) and optionally swapping `storage.service.js` to Capacitor Preferences/SQLite.

---

## 8. Mandatory Maintenance Checklist

Before merging any new feature, tab, or structural refactor:
1. Place feature-specific UI, logic, handlers, and data inside `src/features/<feature-name>/`.
2. Promote anything shared by 2+ features into `src/shared/` or `src/core/`.
3. Register any new tab in `src/core/router/tabs.registry.js` and add its button in `index.html` + `src/shared/components/header.view.js`.
4. Ensure full PT-BR / EN translation via `tr(pt, en)` and mobile table responsiveness via `wrapHScroll()`.
5. **Update this `ARCHITECTURE.md`** with any new directories, routes, storage keys, or conventions.
