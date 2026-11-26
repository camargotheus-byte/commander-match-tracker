import { state } from '../../core/state/store.js';
import {
  isFavDeck,
  getRegisteredDecks,
  deckDisplayName,
  getDeckCommanderInfo
} from '../../shared/utils/deck-style.service.js';
import { groupDecks } from '../../shared/utils/stats.utils.js';

export function prepareDeckLists(filtered) {
  let decks = groupDecks(filtered);

  // Merge manually registered decks (0 games) when no match-only filter excludes them
  const matchOnlyFilter = state.month !== 'all' || state.player !== 'all' || state.pod !== 'all' || Boolean(state.enemyCmdFilter);
  if (!matchOnlyFilter) {
    const existing = new Set(decks.map(d => d.deck));
    const regList = getRegisteredDecks(state.format);
    const qs = state.quickSearch.trim().toLowerCase();
    for (const dk of regList) {
      if (existing.has(dk)) continue;
      const borrowed = dk.toLowerCase().includes('(emprestado)');
      if (state.deck !== 'all' && dk !== state.deck) continue;
      if (state.origin === 'own' && borrowed) continue;
      if (state.origin === 'borrowed' && !borrowed) continue;
      if (state.onlyFavorites && !isFavDeck(dk)) continue;
      if (qs) {
        const info = getDeckCommanderInfo(dk);
        const hay = `${dk} ${deckDisplayName(dk)} ${info.cmd1} ${info.cmd2}`.toLowerCase();
        if (!hay.includes(qs)) continue;
      }
      decks.push({
        deck: dk,
        borrowed,
        games: 0,
        w: 0,
        l: 0,
        d: 0,
        wr: 0,
        expWr: 0,
        delta: 0,
        wilson: 0,
        recent: [],
        matches: [],
        isRegisteredOnly: true
      });
    }
  }

  if (state.deckSearch.trim()) {
    const q = state.deckSearch.trim().toLowerCase();
    decks = decks.filter(d => {
      const info = getDeckCommanderInfo(d.deck);
      return d.deck.toLowerCase().includes(q)
        || deckDisplayName(d.deck).toLowerCase().includes(q)
        || info.cmd1.toLowerCase().includes(q)
        || info.cmd2.toLowerCase().includes(q);
    });
  }

  const totalBeforeMin = decks.length;
  const visibleDecks = decks.filter(d => d.games >= state.deckMinGames);

  visibleDecks.sort((a, b) => {
    if (state.deckSort === 'weighted') return (b.wilson - a.wilson) || (b.games - a.games);
    if (state.deckSort === 'fav') {
      const fa = isFavDeck(a.deck) ? 1 : 0;
      const fb = isFavDeck(b.deck) ? 1 : 0;
      if (fb !== fa) return fb - fa;
      return (b.games - a.games) || (b.wr - a.wr) || deckDisplayName(a.deck).localeCompare(deckDisplayName(b.deck), 'pt-BR');
    }
    if (state.deckSort === 'wr') {
      const qa = a.games >= 5 ? 1 : 0;
      const qb = b.games >= 5 ? 1 : 0;
      if (qb !== qa) return qb - qa;
      const ha = a.games > 0 ? 1 : 0;
      const hb = b.games > 0 ? 1 : 0;
      if (hb !== ha) return hb - ha;
      return (b.wr - a.wr) || (b.games - a.games);
    }
    if (state.deckSort === 'wins') return (b.w - a.w) || (b.wr - a.wr);
    if (state.deckSort === 'name') return deckDisplayName(a.deck).localeCompare(deckDisplayName(b.deck), 'pt-BR');
    return (b.games - a.games) || (b.wr - a.wr) || deckDisplayName(a.deck).localeCompare(deckDisplayName(b.deck), 'pt-BR');
  });

  const splitHonorable = state.deckSort === 'wr' && visibleDecks.some(d => d.games >= 5) && visibleDecks.some(d => d.games < 5);
  const mainDecks = splitHonorable ? visibleDecks.filter(d => d.games >= 5) : visibleDecks;
  const honorableDecks = splitHonorable ? visibleDecks.filter(d => d.games < 5) : [];
  const showWeighted = state.deckSort === 'weighted';
  const activeDeckObj = visibleDecks.find(d => d.deck === state.selectedDeck) || mainDecks[0] || visibleDecks[0] || null;

  return { totalBeforeMin, visibleDecks, splitHonorable, mainDecks, honorableDecks, showWeighted, activeDeckObj };
}
