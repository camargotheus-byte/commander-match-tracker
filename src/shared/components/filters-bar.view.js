import { state } from '../../core/state/store.js';
import { tr, monthName } from '../../core/i18n/i18n.service.js';
import { getMatches } from '../../core/data/matches.repository.js';
import { favoriteDecks, deckDisplayName, toggleFavoriteDeck } from '../utils/deck-style.service.js';
import { groupDecks, groupPlayers } from '../utils/stats.utils.js';
import { esc } from '../utils/formatters.js';
import { syncHeaderAndI18n } from './header.view.js';
import { showToast } from './toast.js';

export function initFilterSelects() {
  const matches = getMatches();
  const hasDec = matches.some(x => x.monthIdx === 11);
  const visibleCount = hasDec ? 12 : 11;
  const monthEl = document.getElementById('f-month');
  if (monthEl) {
    monthEl.innerHTML = `<option value="all">${tr(`Todos os meses (Jan–${hasDec ? 'Dez' : 'Nov'})`, `All months (Jan–${hasDec ? 'Dec' : 'Nov'})`)}</option>` +
      Array.from({ length: visibleCount }, (_, i) => {
        const cnt = matches.filter(x => x.monthIdx === i).length;
        return `<option value="${i}">${esc(monthName(i))} (${cnt})</option>`;
      }).join('');
  }

  const allDecks = groupDecks(matches).sort((a, b) => b.games - a.games);
  const deckEl = document.getElementById('f-deck');
  if (deckEl) {
    deckEl.innerHTML = `<option value="all">${tr(`Todos os decks (${allDecks.length})`, `All decks (${allDecks.length})`)}</option>` +
      allDecks.map(d => `<option value="${esc(d.deck)}">${esc(deckDisplayName(d.deck))} (${d.games})</option>`).join('');
  }

  const allPlayers = groupPlayers(matches).sort((a, b) => b.games - a.games);
  const playerEl = document.getElementById('f-player');
  if (playerEl) {
    playerEl.innerHTML = `<option value="all">${tr(`Todos os oponentes (${allPlayers.length})`, `All opponents (${allPlayers.length})`)}</option>` +
      allPlayers.map(p => `<option value="${esc(p.player)}">${esc(p.player)} (${p.games})</option>`).join('');
  }
}

export function syncFilterControls() {
  syncHeaderAndI18n();
  const matches = getMatches();
  const mEl = document.getElementById('f-month');
  const dEl = document.getElementById('f-deck');
  const pEl = document.getElementById('f-player');
  if (mEl) mEl.value = state.month;
  if (dEl) dEl.value = state.deck;
  if (pEl) pEl.value = state.player;
  const qs = document.getElementById('quick-search');
  if (qs && qs.value !== state.quickSearch) qs.value = state.quickSearch;

  document.querySelectorAll('.pod-pill').forEach(btn => {
    btn.classList.toggle('nb-pill-active', btn.dataset.pod === state.pod);
  });
  document.querySelectorAll('.origin-pill').forEach(btn => {
    btn.classList.toggle('nb-pill-active', btn.dataset.origin === state.origin);
  });
  document.querySelectorAll('nav [data-tab]').forEach(btn => {
    const active = btn.dataset.tab === state.tab;
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
    if (btn.dataset.tab === 'report') {
      btn.classList.toggle('nb-btn-black', active);
      btn.classList.toggle('nb-btn-yellow', !active);
    } else {
      btn.classList.toggle('nb-btn-yellow', active);
    }
  });

  const favBtn = document.getElementById('btn-toggle-fav-filter');
  const favCount = document.getElementById('fav-count-badge');
  const profileDecks = new Set(matches.map(m => m.deck));
  const favInProfile = Array.from(favoriteDecks).filter(d => profileDecks.has(d)).length;
  if (favCount) favCount.textContent = `(${favInProfile})`;
  if (favBtn) {
    favBtn.classList.toggle('bg-[#F1D27A]', state.onlyFavorites);
    favBtn.classList.toggle('bg-[#F3ECE0]', !state.onlyFavorites);
    favBtn.classList.toggle('shadow-[2px_2px_0_#4E3626]', state.onlyFavorites);
  }

  const chips = [];
  if (state.onlyFavorites) chips.push({ key: 'onlyFavorites', label: tr(`★ Apenas Favoritos (${favInProfile})`, `★ Favorites Only (${favInProfile})`) });
  if (state.quickSearch.trim()) chips.push({ key: 'quickSearch', label: tr(`Busca: "${state.quickSearch.trim()}"`, `Search: "${state.quickSearch.trim()}"`) });
  if (state.month !== 'all') chips.push({ key: 'month', label: `${tr('Mês', 'Month')}: ${monthName(Number(state.month))}` });
  if (state.deck !== 'all') chips.push({ key: 'deck', label: `Deck: ${deckDisplayName(state.deck)}` });
  if (state.player !== 'all') chips.push({ key: 'player', label: `${tr('Oponente', 'Opponent')}: ${state.player}` });
  if (state.pod !== 'all') chips.push({ key: 'pod', label: `${tr('Mesa', 'Pod')}: ${state.pod === '2' ? '1v1' : state.pod + 'P'}` });
  if (state.origin !== 'all') chips.push({ key: 'origin', label: `${tr('Origem', 'Origin')}: ${state.origin === 'own' ? tr('Próprios', 'Own') : tr('Emprestados', 'Borrowed')}` });
  if (state.enemyCmdFilter) chips.push({ key: 'enemyCmdFilter', label: `${tr('Contra', 'Vs.')}: ${state.enemyCmdFilter}` });

  const drawer = document.getElementById('filters-drawer');
  if (drawer) drawer.classList.toggle('hidden', !state.showFilters && chips.length === 0);

  const bar = document.getElementById('active-filters-bar');
  const container = document.getElementById('active-filter-chips');
  if (bar && container) {
    if (chips.length) {
      bar.classList.remove('hidden');
      container.innerHTML = `<span class="font-extrabold">${tr('Filtros ativos:', 'Active filters:')}</span>` +
        chips.map(c => `
          <button data-clear-filter="${esc(c.key)}" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md badge-pop-yellow cursor-pointer hover:opacity-85">
            <span>${esc(c.label)}</span><span aria-hidden="true">×</span>
          </button>
        `).join('');
    } else {
      bar.classList.add('hidden');
      container.innerHTML = '';
    }
  }
}

export function resetAllFilters(render) {
  state.month = 'all';
  state.deck = 'all';
  state.player = 'all';
  state.pod = 'all';
  state.origin = 'all';
  state.onlyFavorites = false;
  state.quickSearch = '';
  state.enemyCmdFilter = '';
  state.histSearch = '';
  state.histRes = 'all';
  state.deckSearch = '';
  state.oppSearch = '';
  render();
}

export function bindFilterInputs(render) {
  document.getElementById('f-month')?.addEventListener('change', e => { state.month = e.target.value; render(); });
  document.getElementById('f-deck')?.addEventListener('change', e => { state.deck = e.target.value; render(); });
  document.getElementById('f-player')?.addEventListener('change', e => { state.player = e.target.value; render(); });
  document.getElementById('btn-reset-filters')?.addEventListener('click', () => resetAllFilters(render));
}

export function handleFilterClick(e, { render }) {
  // Favorite star toggle MUST be handled before card/row navigation
  const toggleFav = e.target.closest('[data-toggle-fav]');
  if (toggleFav) {
    const dk = toggleFav.dataset.toggleFav;
    const added = toggleFavoriteDeck(dk);
    showToast(added
      ? tr(`★ ${deckDisplayName(dk)} adicionado aos favoritos!`, `★ ${deckDisplayName(dk)} added to favorites!`)
      : tr(`${deckDisplayName(dk)} removido dos favoritos.`, `${deckDisplayName(dk)} removed from favorites.`));
    render();
    return true;
  }

  if (e.target.closest('#btn-toggle-fav-filter') || e.target.closest('[data-toggle-fav-filter]')) {
    state.onlyFavorites = !state.onlyFavorites;
    render();
    return true;
  }

  if (e.target.closest('#btn-toggle-filters')) {
    state.showFilters = !state.showFilters;
    render();
    return true;
  }

  if (e.target.id === 'btn-empty-reset') {
    resetAllFilters(render);
    return true;
  }

  const podPill = e.target.closest('.pod-pill');
  if (podPill) { state.pod = podPill.dataset.pod; render(); return true; }

  const originPill = e.target.closest('.origin-pill');
  if (originPill) { state.origin = originPill.dataset.origin; render(); return true; }

  const clearChip = e.target.closest('[data-clear-filter]');
  if (clearChip) {
    const k = clearChip.dataset.clearFilter;
    if (k === 'enemyCmdFilter' || k === 'quickSearch') state[k] = '';
    else if (k === 'onlyFavorites') state.onlyFavorites = false;
    else state[k] = 'all';
    render();
    return true;
  }

  return false;
}
