<p align="center">
  <img src="./logo.svg" alt="MTG Match Tracker Logo" width="84" height="84" />
</p>

<h1 align="center">MTG Match Tracker — Retro Edition</h1>

<p align="center">
  <strong>The numbers of your legacy.</strong><br/>
  An interactive, zero-build single-file analytics dashboard for tracking <strong>Magic: The Gathering</strong> matches across 23 format profiles, deck performance, mana identity, pod-size metrics, and head-to-head rivalries — styled with a <strong>Sun-Washed Laguna</strong> neo-brutalist pop-folder aesthetic.
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
- **Bilingual UI (PT-BR / English):** Instant top-nav language switcher (`🌐 ▾`) translating all views, tooltips, charts, months, dates, decimals, and `W/L/D` codes, persisted in `localStorage`.
- **Built-in Match Reporter & Export:** Structured form with calendar date picker, turn duration quick-pills (`5t–12t`), adaptive opponent count per format, autocomplete, paste-to-import parser, format-scoped local queue, Google Sheets TSV output, and filtered **CSV export**.
- **Mobile-First Table Ergonomics:** Smooth horizontal scrolling with right-edge fade cues and interactive top mini-scrollbars across all data tables.

---

## Changelog

### Version 1.0.1
- **Brand Identity & Palette:**
  - Created custom vector brand logo (`logo.svg`) depicting 3 fanned cards with an inner trend chart on the front card; applied to the top-left header badge and browser favicon.
  - Refreshed the entire UI to the **Sun-Washed Laguna** color palette (*Seashell, Light Seashell, Flax Linen, Palm Shadow, Key Lime, Butter Sun, Golden Hour, Tangerine, Aperol, Espresso*).
  - Updated hero tagline (`The numbers of your legacy.` / `Seu legado em números.`).
- **Multi-Format Profiles:**
  - Replaced the static `MTG COMMANDER · 2026` badge with a categorized dropdown supporting **23 MTG formats** with per-format match counters.
  - Added full **Profile Isolation** so Commander, Pauper, Pioneer, Modern, Standard, Draft, and other formats maintain independent dashboards, histories, local queues, ID prefixes, and default opponent layouts.
- **Mana Identity Icons & Scryfall Links:**
  - Added 5 minimalist SVG mana icons (**W** Sun, **U** Droplet, **B** Skull, **R** Flame, **G** Tree) plus a **Colorless (`C`)** diamond icon across all **25 user decks** (editable in Deck X-Ray) and all **126 enemy commanders** (in *Opponents → Enemy Commanders* and *Rival X-Ray*).
  - Added **Commander Editor** with **Partner toggle** inside Deck X-Ray and clickable **Scryfall** (`↗`) card links across user and enemy commanders.
- **Dates, Turn Duration & Decklist Trajectory:**
  - Added calendar **Date Picker** (`Data`) and **Turn Duration** (`Turnos`) tracking across Match Reporter, Overview, Deck X-Ray, History, CSV/TSV export, and Google Sheets schema.
  - Added **Decklist Link**, **Last Update Date**, and **Performance Trajectory** chart with before/after comparison inside Deck X-Ray.
- **Bilingual Support & Mobile UX:**
  - Added full **Português (BR) / English** dropdown toggle persisted in `localStorage`.
  - Added mobile-friendly horizontal table containers with interactive top mini-scrollbars.
  - Enabled two-way cross-navigation between **Deck X-Ray** and **Rival X-Ray**, and removed truncated deck/commander names across views.
  - Removed the deprecated `Download HTML` button and the Opponents notice banner.
- **Data Cleanup:**
  - Unified `Rafa` and `Rafael` player records, and corrected commander names (`Osgir, the Reconstructor`, `Kefka, Court Mage // Kefka, Ruler of Ruin`, and `Muddle, the Ever-Changing`) across both the dashboard and Google Sheets.

### Version 1.0.0
- Initial standalone dashboard release synced with the 2026 Commander Google Sheets dataset (212 matches), Neo-Brutalist Pop-Folder UI, Overview KPIs, Deck/Rival X-Rays, Wilson ranking, customizable deck icons/colors, favorites, and built-in Match Reporter.

---

## Project Structure

```text
commander-match-tracker/
├── index.html   # Standalone single-file dashboard (GitHub Pages entry point)
├── logo.svg     # Standalone vector brand mark (Sun-Washed Laguna)
└── README.md    # Project documentation & changelog
```

## Tech Stack

- **Zero-build standalone HTML** (Vanilla JavaScript + custom SVG charts/icons + Tailwind CSS)
- **Data persistence:** Embedded Google Sheets snapshot + `localStorage` for format profiles, pending matches, favorites, deck metadata/commanders, custom icons/colors, and language preference
- **Hosting:** Ready for GitHub Pages out of the box (no backend or build pipeline required)

## Running Locally

Open `index.html` directly in any modern browser — no installation or build step required.
