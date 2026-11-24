import { state, getActiveFormat, setActiveFormat, saveLang, resetProfileFilters } from '../../core/state/store.js';
import { MTG_FORMAT_GROUPS, MTG_FORMATS } from '../../core/formats/formats.config.js';
import { isEn, tr, monthName } from '../../core/i18n/i18n.service.js';
import { getMatches, getFormatMatches, rebuildMatches } from '../../core/data/matches.repository.js';
import { esc } from '../utils/formatters.js';
import { showToast } from './toast.js';

export function syncHeaderAndI18n() {
  document.documentElement.lang = isEn() ? 'en' : 'pt-BR';
  const fmt = getActiveFormat();
  document.title = `${isEn() ? fmt.en : fmt.pt} — Match Tracker`;

  const fmtBtn = document.getElementById('btn-format-menu');
  const fmtLbl = document.getElementById('format-label');
  const fmtChev = document.getElementById('format-chevron');
  const fmtDrop = document.getElementById('format-dropdown');
  if (fmtLbl) fmtLbl.textContent = fmt.badge;
  if (fmtBtn) {
    fmtBtn.setAttribute('aria-expanded', state.formatMenuOpen ? 'true' : 'false');
    fmtBtn.setAttribute('data-tip', tr(`Formato ativo: ${fmt.pt}. Clique para escolher outro formato de MTG.`, `Active format: ${fmt.en}. Click to switch MTG format.`));
  }
  if (fmtChev) fmtChev.style.transform = state.formatMenuOpen ? 'rotate(180deg)' : '';
  if (fmtDrop) {
    fmtDrop.classList.toggle('hidden', !state.formatMenuOpen);
    fmtDrop.innerHTML = MTG_FORMAT_GROUPS.map(g => `
      <div class="space-y-0.5">
        <div class="px-2 pt-1 pb-0.5 text-xs font-black uppercase tracking-wider text-muted">${esc(isEn() ? g.en : g.pt)}</div>
        ${g.items.map(item => {
          const active = item.key === state.format;
          const cnt = getFormatMatches(item.key).length;
          return `
            <button type="button" role="menuitem" data-set-format="${esc(item.key)}"
              class="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between gap-2 cursor-pointer ${active ? 'bg-[#F1D27A] border-[1.5px] border-[#4E3626]' : 'hover:bg-[#F3ECE0]'}">
              <span class="min-w-0">
                <span class="block text-xs font-extrabold text-[#4E3626] leading-tight">${esc(isEn() ? item.en : item.pt)}</span>
                <span class="block text-xs font-medium text-muted leading-tight mt-0.5">${esc(isEn() ? item.descEn : item.descPt)}</span>
              </span>
              <span class="inline-flex items-center gap-1.5 shrink-0">
                ${cnt > 0 ? `<span class="px-1.5 py-0.2 rounded text-xs font-black tabular-nums ${active ? 'bg-[#FCF8F0] border border-[#4E3626] text-[#4E3626]' : 'badge-neutral'}">${cnt}</span>` : ''}
                <span class="font-black text-xs ${active ? 'text-[#4E3626]' : 'hidden'}">✓</span>
              </span>
            </button>
          `;
        }).join('')}
      </div>
    `).join('<div class="border-t border-[#DCCBAE]"></div>');
  }

  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  setText('hero-tagline', tr('Seu legado em números.', 'The numbers of your legacy.'));
  setText('nav-lbl-overview', tr('Visão Geral', 'Overview'));
  setText('nav-lbl-decks', 'Decks');
  setText('nav-lbl-opponents', tr('Oponentes', 'Opponents'));
  setText('nav-lbl-performance', 'Performance');
  setText('nav-lbl-history', tr('Histórico', 'History'));
  setText('nav-lbl-report', tr('Reportar', 'Report'));
  setText('lbl-fav-quick', tr('Favoritos', 'Favorites'));
  setText('lbl-filters-quick', tr('Filtros', 'Filters'));
  setText('lbl-f-month', tr('Mês', 'Month'));
  setText('lbl-f-deck', tr('Meu Deck', 'My Deck'));
  setText('lbl-f-player', tr('Oponente (Jogador)', 'Opponent (Player)'));
  setText('lbl-f-pod', tr('Tamanho da Mesa', 'Pod Size'));
  setText('lbl-f-origin', tr('Origem do Deck', 'Deck Origin'));
  setText('pod-pill-all', tr('Todas', 'All'));
  setText('origin-pill-all', tr('Todos', 'All'));
  setText('origin-pill-own', tr('Próprios', 'Own'));
  setText('origin-pill-borrowed', tr('Emprest.', 'Borrowed'));
  setText('btn-reset-filters', tr('Limpar filtros ×', 'Clear filters ×'));

  const qs = document.getElementById('quick-search');
  if (qs) qs.placeholder = tr('Busca rápida: digite um deck, jogador, comandante ou CMD-212...', 'Quick search: type a deck, player, commander, or CMD-212...');
  const favBtn = document.getElementById('btn-toggle-fav-filter');
  if (favBtn) favBtn.setAttribute('data-tip', tr('Filtrar apenas decks favoritados', 'Filter favorite decks only'));
  const addBtn = document.getElementById('btn-add-quick');
  if (addBtn) {
    addBtn.setAttribute('data-tip', tr('Reportar nova partida', 'Report new match'));
    addBtn.setAttribute('aria-label', tr('Reportar nova partida', 'Report new match'));
  }

  const langBtn = document.getElementById('btn-lang-menu');
  const langDrop = document.getElementById('lang-dropdown');
  if (langBtn) {
    langBtn.setAttribute('aria-expanded', state.langMenuOpen ? 'true' : 'false');
    langBtn.setAttribute('data-tip', tr('Alterar idioma (Português BR / English)', 'Switch language (Português BR / English)'));
    langBtn.classList.toggle('nb-btn-yellow', state.langMenuOpen);
  }
  if (langDrop) langDrop.classList.toggle('hidden', !state.langMenuOpen);
  document.querySelectorAll('[data-lang-check]').forEach(el => {
    el.classList.toggle('hidden', el.dataset.langCheck !== state.lang);
  });
}

export function updateHeaderScope(filtered) {
  const matches = getMatches();
  const activeFmt = getActiveFormat();
  const scopeEl = document.getElementById('header-scope');
  if (!scopeEl) return;
  if (matches.length === 0) {
    scopeEl.textContent = tr(
      `Perfil ${activeFmt.pt} · Nenhuma partida registrada ainda`,
      `${activeFmt.en} profile · No matches recorded yet`
    );
  } else if (filtered.length === matches.length) {
    const mIndices = matches.map(x => x.monthIdx).filter(Number.isFinite);
    const minM = Math.min(...mIndices);
    const maxM = Math.max(...mIndices);
    const yrs = Array.from(new Set(matches.map(x => x.year || '2026'))).sort();
    const yrLbl = yrs.length > 1 ? `${yrs[0]}–${yrs[yrs.length - 1]}` : (yrs[0] || '2026');
    const span = minM === maxM ? `${monthName(minM)} ${yrLbl}` : `${monthName(minM)} – ${monthName(maxM)} ${yrLbl}`;
    scopeEl.textContent = tr(
      `${span} · ${matches.length} ${matches.length === 1 ? 'partida registrada' : 'partidas registradas'}`,
      `${span} · ${matches.length} ${matches.length === 1 ? 'match recorded' : 'matches recorded'}`
    );
  } else {
    scopeEl.textContent = tr(
      `Exibindo ${filtered.length} de ${matches.length} partidas filtradas`,
      `Showing ${filtered.length} of ${matches.length} filtered matches`
    );
  }
}

export function handleHeaderClick(e, { render, onDataChange }) {
  // MTG Format dropdown toggle & selection
  const fmtBtn = e.target.closest('#btn-format-menu');
  if (fmtBtn) {
    state.formatMenuOpen = !state.formatMenuOpen;
    if (state.formatMenuOpen) state.langMenuOpen = false;
    syncHeaderAndI18n();
    return true;
  }
  const setFmtBtn = e.target.closest('[data-set-format]');
  if (setFmtBtn) {
    const nextFmt = setFmtBtn.dataset.setFormat;
    if (MTG_FORMATS.some(f => f.key === nextFmt)) {
      const changed = nextFmt !== state.format;
      setActiveFormat(nextFmt);
      state.formatMenuOpen = false;
      if (changed) {
        resetProfileFilters();
        const chosen = getActiveFormat();
        const isRepBlank = !state.report.deck.trim() && state.report.opponents.every(o => !o.cmd.trim() && !o.player.trim());
        if (isRepBlank) {
          state.report.opponents = Array.from({ length: chosen.defaultOpps || 1 }, () => ({ cmd: '', player: '', winner: false }));
        }
        rebuildMatches();
        onDataChange();
        showToast(tr(`Perfil alterado para ${chosen.pt} (${getMatches().length} partidas)`, `Switched to ${chosen.en} profile (${getMatches().length} matches)`));
      } else {
        syncHeaderAndI18n();
      }
    } else {
      state.formatMenuOpen = false;
      syncHeaderAndI18n();
    }
    return true;
  }
  if (state.formatMenuOpen && !e.target.closest('#format-menu-wrap')) {
    state.formatMenuOpen = false;
    syncHeaderAndI18n();
  }

  // Language dropdown toggle & selection
  const langBtn = e.target.closest('#btn-lang-menu');
  if (langBtn) {
    state.langMenuOpen = !state.langMenuOpen;
    if (state.langMenuOpen) state.formatMenuOpen = false;
    syncHeaderAndI18n();
    return true;
  }
  const setLangBtn = e.target.closest('[data-set-lang]');
  if (setLangBtn) {
    const nextLang = setLangBtn.dataset.setLang === 'en' ? 'en' : 'pt';
    state.lang = nextLang;
    state.langMenuOpen = false;
    saveLang(nextLang);
    onDataChange();
    showToast(nextLang === 'en' ? 'Language switched to English' : 'Idioma alterado para Português (BR)');
    return true;
  }
  if (state.langMenuOpen && !e.target.closest('#lang-menu-wrap')) {
    state.langMenuOpen = false;
    syncHeaderAndI18n();
  }

  // Tab switch
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) {
    state.tab = tabBtn.dataset.tab;
    render();
    return true;
  }

  return false;
}
