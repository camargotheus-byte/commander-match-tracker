<p align="center">
  <img src="./logo.svg" alt="MTG Match Tracker Logo" width="84" height="84" />
</p>

<h1 align="center">MTG Match Tracker — Retro Edition</h1>

<p align="center">
  <strong>The numbers of your legacy.</strong><br/>
  An interactive, modular, zero-build analytics dashboard &amp; PWA for tracking <strong>Magic: The Gathering</strong> matches across 23 format profiles, deck performance, mana identity, pod-size metrics, benchmarks, and head-to-head rivalries — styled with a <strong>Sun-Washed Laguna</strong> neo-brutalist pop-folder aesthetic.
</p>

---

## Features

- **Multi-Format Profiles (23 MTG Formats):** Switch seamlessly between isolated format profiles from the header dropdown — **Commander & Multiplayer** (*Commander / EDH, cEDH, Duel Commander, Pauper Commander, Brawl, Oathbreaker, 2HG, Planechase*), **Constructed** (*Standard, Pioneer, Modern, Legacy, Vintage, Pauper, Historic, Timeless, Alchemy, Premodern*), **Limited** (*Booster Draft, Sealed Deck, Cube Draft, Jumpstart*), and **Casual**. Each profile keeps its own isolated KPIs, charts, decks, opponents, history, local queue, and format-prefixed match IDs (`CMD-`, `PAU-`, `PIO-`, `MOD-`, etc.).
- **Overview & KPIs:** High-level metrics (total matches, win rate vs. expected `1/N` pod odds, win/loss streaks, top deck, and biggest rival), monthly volume & win-rate trends, cumulative win-rate curve, pod-size breakdown (`1v1`, `3P`, `4+P`), and **Table Pace** (turn-duration distribution).
- **Deck Analytics & X-Ray:** Folder-card and table views, Wilson 90% lower-bound weighted performance ranking, automatic **Honorable Mentions** split (`< 5` games), Volume × Win Rate scatter plot, and a sticky **Deck X-Ray** sidebar featuring:
  - Per-deck **Commander Editor** with **Partner toggle** (1 or 2 individual commanders) and direct **Scryfall** card links (`↗`)
  - **Minimalist WUBRG + Colorless Identity Icons** (Sun, Droplet, Skull, Flame, Tree, and Colorless Diamond)
  - **Decklist URL**, **Last Update Date**, and **Performance Trajectory** chart comparing win rate before and after decklist updates
  - **Deck Pace** (turn duration) and clickable cross-navigation to **Rival X-Ray**
- **Multi-Badge System:** Dynamic tags with delayed hover / mobile tap tooltips — `CLASSIC` (5 oldest decks with 5+ games), `ON FIRE` (3+ win streak), `UNDEFEATED` (100% WR with 3+ games), `TOP` (70%+ WR with 10+ games), and `BORROWED`.
- **Opponents & Meta Breakdown:** Head-to-head **Players** table with **Rival X-Ray** (including 3rd-party pod losses and two-way navigation to Deck X-Ray), **Enemy Commanders** catalog with verified WUBRG/Colorless icons, Scryfall links, and color-combo search, plus a **Deck × Opponent** win-rate heatmap.
- **Performance & Benchmarks Tab:** Visual 1v1 and 4P Commander skill-tier gauges (*Casual → LGS Regular → Pro / Elite*), automated diagnostics (wins above expected, 1v1 vs. 4P gap, recent 20-game form, turn pace), pod-adjusted **True Deck Efficiency (`Δ vs. Expected`)** ranking, seat-order comparison vs. Playgroup.gg's 600k+ pod dataset, and linked primary sources.
- **Bilingual UI (PT-BR / English):** Instant top-nav language switcher (`🌐 ▾`) translating all views, tooltips, charts, months, dates, decimals, and `W/L/D` codes, persisted in `localStorage`.
- **Built-in Match Reporter & Export:** Structured form with calendar date picker, turn duration quick-pills (`5t–12t`), adaptive opponent count per format, autocomplete, paste-to-import parser, format-scoped local queue, Google Sheets TSV output, and filtered **CSV export**.
- **Mobile-First & PWA Ready:** Horizontal table scroll containers with interactive top mini-scrollbars plus `manifest.webmanifest` for home-screen app installation.

---

## Architecture

This repository follows a strict **Feature-Based Modular Architecture** using native browser ES Modules (`type="module"`) so it deploys with **zero build step** on GitHub Pages while remaining cleanly prepared for future native app packaging (PWA / Capacitor / Vite).

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the full directory map, tab/route registry, persistence contracts, coding conventions, and permanent contribution rules.

```text
commander-match-tracker/
├── index.html                    # Thin shell loading styles & src/main.js
├── manifest.webmanifest          # PWA app manifest
├── logo.svg                      # Official vector brand mark
├── ARCHITECTURE.md               # Architecture documentation & permanent rules
├── README.md                     # Project overview & changelog
├── scripts/
│   └── build-standalone.py       # Optional zero-dependency standalone HTML bundler
└── src/
    ├── main.js                   # Bootstrap & global event wiring
    ├── styles/                   # Sun-Washed Laguna tokens & Neo-Brutalist primitives
    ├── core/                     # State store, storage adapter, i18n, formats, dataset & tab registry
    ├── shared/                   # Reusable UI components, icons, mana identity data & stats utils
    └── features/                 # Isolated feature slices: overview, decks, opponents, performance, history, report
```

---

## Running Locally & Deploying

### GitHub Pages (Recommended — Zero Build)
Push the repository to GitHub and enable **GitHub Pages** on your branch root (`/`). Every ES module in `src/` loads natively over HTTPS.

### Local Development Server
Because modern browsers block ES module imports over `file://`, start any static local server from the project root:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

### Optional Single-File Standalone Bundle (Offline `file://` & Personal Build)
Build a blank standalone `.html` file, or embed your own personal `.json` backup as the local default seed:

```bash
# Blank public standalone build
python scripts/build-standalone.py dist/commander-match-tracker-standalone.html

# Personal local PC build seeded with your own Hub backup
python scripts/build-standalone.py dist/my-personal-tracker.html --seed path/to/mtg-match-tracker-hub.json
```

---

## Changelog

### Version 1.5.0 (MTG Guild Themes)
- **11 Retro Color Themes (`cmt_theme_v1`):** Added a clean top-nav palette switcher (`🎨 ▾`) featuring **Default (Sun-Washed Laguna)** plus all **10 2-Color MTG Guilds** (*Azorius, Dimir, Rakdos, Gruul, Selesnya, Orzhov, Izzet, Golgari, Boros, Simic*) with mana identity icons, variable-driven Neo-Brutalist styling (`body[data-theme="..."]`), mobile `<meta name="theme-color">` sync, and `.json` backup persistence.

### Version 1.4.0 (Deck Garage, Custom Deck Naming & Player Profile)
- **Player Name Badge (`cmt_player_name_v1`):** Optional player display name settable on the welcome card or directly in the top header (visible across all tabs and screenshots), persisted in `localStorage` and included in `.json` backup metadata and export filenames.
- **Bilingual Welcome Card (PT-BR / EN):** Added an inline language toggle (`Português` | `English`) and welcoming onboarding introduction directly on the first-run screen.
- **Manual Deck Registration (`+ New Deck`):** Add decks directly inside the **Decks** tab (even with 0 matches) with a custom **Deck Name**, optional **Commander(s) / Partner**, auto-detected or manual **WUBRG / Colorless** mana identity, **Decklist URL**, and borrowed flag — isolated per MTG format (`cmt_registered_decks_v1`) and included in `.json` backups.
- **Custom Deck Naming / Renaming (`✎`):** Rename any existing or newly registered deck inside **Deck X-Ray** without losing match history or breaking Scryfall commander links; cards and tables display your custom deck name with the commander as a subtle subtitle.
- **1-Tap Match Reporting Integration:** Registered decks appear immediately as quick-pick pills and autocomplete options in the **+ Report** tab, and Deck X-Ray includes a **"+ Log match with this deck"** shortcut (plus **"Remove"** for unused 0-game decks).

### Version 1.3.0 (Public Beta / Blank-First Product Edition)
- **Blank-First Public Default:** Removed personal match records from the public repository so every new user starts with a clean personal workspace directly in their browser (`localStorage`), with zero account friction.
- **Opt-In Demo Mode (10 Fictional Matches):** Added a 1-click **"Preview with 10 sample matches"** onboarding action (`src/core/data/demo-dataset.js`) plus a top Demo Mode banner and 1-click **"Clear demo & start fresh"** button so new testers can explore every chart, X-Ray, heatmap, and Performance gauge before logging their own games.
- **Commercial UX Polish:** Updated onboarding copy with mobile PWA Home Screen tip, replaced internal spreadsheet/chat wording with shareable **Match Summary** copy (WhatsApp/Discord ready), and added direct `.json` backup import right from the welcome screen.
- **Single-Codebase Personal Local Builds:** Added `--seed <backup.json>` support to `scripts/build-standalone.py` so you maintain one codebase while generating a seeded local standalone `.html` for personal PC use.

### Version 1.2.0 (Self-Contained Personal Data Hub & Backup)
- **Unified Personal Hub (`cmt_hub_matches_v1`):** Automatically migrates the 212 initial Google Sheets records into a full local CRUD hub — log, edit, or delete any match directly inside the app without needing to paste reports into chat.
- **Data Hub & Versioned Backup (`.json`):** Added a top-nav Data Hub modal with 1-click **Export Full Backup (`.json`)** (`schemaVersion: 1`, containing all formats, matches, favorites, commanders/partners, mana colors, decklists, and styles) and **Import / Restore Backup (`.json`)** for cross-device transfer and future cloud migration (Supabase / GitHub API).
- **Desktop Auto-Save File Link:** On desktop Chrome/Edge, link a `.json` file inside Google Drive, OneDrive, or Documents using the File System Access API so every match or edit auto-saves directly to your own file.
- **Inline Match Editing & Deletion:** Added direct `✎` edit and 2-click `×` delete controls on every match row in the **History** tab.

### Version 1.1.0 (Modular Architecture & Performance Tab)
- **Feature-Based Modular Refactor:** Split the 5,329-line monolith into 42 clean native ES modules organized under `src/core/`, `src/shared/`, `src/styles/`, and `src/features/` (`overview`, `decks`, `opponents`, `performance`, `history`, `report`) with zero circular or cross-feature dependencies.
- **App & PWA Readiness:** Added `manifest.webmanifest`, centralized persistence in `src/core/storage/storage.service.js`, added `scripts/build-standalone.py` for optional single-file export, and created permanent governance docs in `ARCHITECTURE.md`.
- **Performance & Benchmarks Tab:** Added 1v1 and 4P Commander skill gauges, automated personalized insights, pod-adjusted `Δ vs. Expected` deck efficiency ranking, Playgroup.gg seat-order comparison, and linked primary sources.

### Version 1.0.1
- **Brand Identity & Palette:** Created custom vector logo (`logo.svg`), refreshed UI to **Sun-Washed Laguna**, and updated hero tagline.
- **Multi-Format Profiles:** Replaced `MTG COMMANDER · 2026` badge with a 23-format profile switcher with full data isolation.
- **Mana Identity Icons & Scryfall Links:** Added 5 minimalist WUBRG icons + Colorless diamond across all 25 user decks and 126 enemy commanders, plus Commander Editor with Partner toggle and Scryfall links.
- **Dates, Turn Duration & Decklist Trajectory:** Added calendar date picker, turn duration analytics, decklist URL, update date, and before/after performance trajectory chart.
- **Bilingual Support, Mobile UX & Data Cleanup:** Added PT-BR/EN toggle, mobile table mini-scrollbars, two-way X-Ray cross-navigation, unified `Rafael`, and corrected `Osgir`, `Kefka`, and `Muddle`.

### Version 1.0.0
- Initial standalone dashboard release synced with the 2026 Commander Google Sheets dataset (212 matches).
