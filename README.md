# Commander Match Tracker — Retro Edition

An interactive, single-file analytics dashboard for tracking **Magic: The Gathering Commander (EDH)** matches, deck performance, pod-size metrics, and head-to-head rivalries — styled with a **Neo-Brutalist Pop-Folder** retro aesthetic.

## Features

- **Overview & KPIs:** High-level metrics (total matches, win rate vs. expected `1/N` pod odds, best win streak, top deck, and biggest rival), monthly volume & win rate trends, cumulative win rate curve, and pod-size breakdown (`1v1`, `3P`, `4+P`).
- **Deck Analytics & X-Ray:** Folder-card and table views, Wilson 90% lower-bound weighted performance ranking, automatic **Honorable Mentions** split (`< 5` games), interactive Volume × Win Rate scatter plot, and a detailed **Deck X-Ray** sidebar with auto-scroll.
- **Multi-Badge System:** Dynamic tags with hover/touch tooltips — `CLÁSSICO` (oldest signature decks with 5+ games), `EM ALTA` (3+ win streak), `INVICTO` (100% WR with 3+ games), `TOP` (70%+ WR with 10+ games), and `EMPREST.` (borrowed decks).
- **Rival & Meta Breakdown:** Player head-to-head table with **Rival X-Ray** (including 3rd-party pod losses), Enemy Commanders catalog, and a **Deck × Opponent** win-rate heatmap.
- **Personalization & Persistence:** Favorite decks (`★`), customizable SVG deck icons and retro color accents saved locally in `localStorage`, plus 1-click **Download HTML** (preserving custom styles & favorites) and **Export CSV**.
- **Built-in Match Reporter:** Structured form with autocomplete, paste-to-import parser, and local pending queue synced with Google Sheets.

## Tech Stack

- **Zero-build standalone HTML** (Vanilla JavaScript + SVG charts + Tailwind CSS)
- **Data source:** Synced from Google Sheets (2026 season)
- **Hosting:** Ready for GitHub Pages out of the box (no backend required)

## Running Locally

Open `index.html` directly in any modern browser — no build step or dependencies required.
