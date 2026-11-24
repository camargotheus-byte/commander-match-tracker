import { state } from '../../core/state/store.js';
import { isFavDeck } from '../../shared/utils/deck-style.service.js';
import { groupDecks } from '../../shared/utils/stats.utils.js';

export function prepareDeckLists(filtered) {
  let decks = groupDecks(filtered);
  if (state.deckSearch.trim()) {
    const q = state.deckSearch.trim().toLowerCase();
    decks = decks.filter(d => d.deck.toLowerCase().includes(q));
  }
  const visibleDecks = decks.filter(d => d.games >= state.deckMinGames);

  visibleDecks.sort((a, b) => {
    if (state.deckSort === 'weighted') return (b.wilson - a.wilson) || (b.games - a.games);
    if (state.deckSort === 'fav') {
      const fa = isFavDeck(a.deck) ? 1 : 0;
      const fb = isFavDeck(b.deck) ? 1 : 0;
      if (fb !== fa) return fb - fa;
      return (b.games - a.games) || (b.wr - a.wr);
    }
    if (state.deckSort === 'wr') {
      const qa = a.games >= 5 ? 1 : 0;
      const qb = b.games >= 5 ? 1 : 0;
      if (qb !== qa) return qb - qa;
      return (b.wr - a.wr) || (b.games - a.games);
    }
    if (state.deckSort === 'wins') return (b.w - a.w) || (b.wr - a.wr);
    if (state.deckSort === 'name') return a.deck.localeCompare(b.deck, 'pt-BR');
    return (b.games - a.games) || (b.wr - a.wr);
  });

  const splitHonorable = state.deckSort === 'wr' && visibleDecks.some(d => d.games >= 5) && visibleDecks.some(d => d.games < 5);
  const mainDecks = splitHonorable ? visibleDecks.filter(d => d.games >= 5) : visibleDecks;
  const honorableDecks = splitHonorable ? visibleDecks.filter(d => d.games < 5) : [];
  const showWeighted = state.deckSort === 'weighted';
  const activeDeckObj = visibleDecks.find(d => d.deck === state.selectedDeck) || mainDecks[0] || visibleDecks[0] || null;

  return { visibleDecks, splitHonorable, mainDecks, honorableDecks, showWeighted, activeDeckObj };
}
