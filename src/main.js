import { state } from './core/state/store.js';
import { tr } from './core/i18n/i18n.service.js';
import { initAutoFileSync } from './core/storage/backup.service.js';
import { getMatches, getFilteredMatches, isDemoMode, rebuildMatches } from './core/data/matches.repository.js';
import { renderActiveTab } from './core/router/tabs.registry.js';
import { initTooltipSystem, normalizeNativeTitles } from './shared/components/tooltip.js';
import { initTableScrollbars } from './shared/components/hscroll-table.js';
import { syncHeaderAndI18n, handleHeaderClick } from './shared/components/header.view.js';
import { initFilterSelects, syncFilterControls, bindFilterInputs, handleFilterClick } from './shared/components/filters-bar.view.js';
import { renderDataHubModal, handleDataHubClick, handleDataHubChange } from './shared/components/data-hub-modal.view.js';
import { renderKPIs } from './features/overview/overview.view.js';
import { handleOverviewClick } from './features/overview/overview.handlers.js';
import { handleDecksClick, handleDecksInput, handleDecksChange } from './features/decks/decks.handlers.js';
import { handleOpponentsClick, handleOpponentsInput } from './features/opponents/opponents.handlers.js';
import { handleHistoryClick, handleHistoryInput } from './features/history/history.handlers.js';
import { handleReportClick, handleReportInput, handleReportChange } from './features/report/report.handlers.js';

function scrollToSection(id) {
  requestAnimationFrame(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const fullyVisible = rect.top >= 12 && rect.top <= window.innerHeight * 0.55;
    if (!fullyVisible) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const card = el.querySelector('.nb-folder-body') || el;
    card.classList.remove('xray-flash');
    void card.offsetWidth;
    card.classList.add('xray-flash');
  });
}

function render(preserveFocusId = null) {
  let selStart = null;
  let selEnd = null;
  if (preserveFocusId) {
    const el = document.getElementById(preserveFocusId);
    if (el) {
      selStart = el.selectionStart;
      selEnd = el.selectionEnd;
    }
  }

  syncFilterControls();
  const matches = getMatches();
  const filtered = getFilteredMatches();
  renderKPIs(filtered);

  const kpiStrip = document.getElementById('kpi-strip');
  if (kpiStrip) kpiStrip.classList.toggle('hidden', state.tab !== 'overview' || matches.length === 0);

  const filterBar = document.getElementById('global-filter-bar');
  if (filterBar) filterBar.classList.toggle('hidden', state.tab === 'report' || matches.length === 0);

  const pBadge = document.getElementById('pending-tab-badge');
  if (pBadge) pBadge.classList.add('hidden');

  const demoBanner = document.getElementById('demo-banner');
  if (demoBanner) {
    if (isDemoMode()) {
      demoBanner.classList.remove('hidden');
      demoBanner.innerHTML = `
        <div class="nb-card-sm bg-[#F1D27A] px-3.5 py-2.5 flex items-center justify-between gap-3 flex-wrap text-xs">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-2 py-0.5 rounded-md badge-pop-purple">DEMO</span>
            <span class="font-extrabold">${tr('Modo Demonstração (10 partidas fictícias) — explore todos os gráficos, Raio-X e Performance à vontade!', 'Demo Mode (10 sample matches) — explore all charts, X-Ray, and Performance freely!')}</span>
          </div>
          <button type="button" id="btn-clear-demo-matches" class="nb-btn px-3 py-1 text-xs shrink-0">
            ${tr('Limpar exemplo e começar do zero ×', 'Clear demo & start fresh ×')}
          </button>
        </div>
      `;
    } else {
      demoBanner.classList.add('hidden');
      demoBanner.innerHTML = '';
    }
  }

  const root = document.getElementById('view-root');
  if (root) root.innerHTML = renderActiveTab(state.tab, filtered);
  renderDataHubModal();

  normalizeNativeTitles(document);
  requestAnimationFrame(initTableScrollbars);

  if (preserveFocusId) {
    const el = document.getElementById(preserveFocusId);
    if (el) {
      el.focus();
      if (selStart !== null && el.setSelectionRange) el.setSelectionRange(selStart, selEnd);
    }
  }
}

function onDataChange() {
  initFilterSelects();
  render();
}

const ctx = { render, onDataChange, scrollToSection };

initAutoFileSync();

initTooltipSystem({
  onEscape: () => {
    if (state.dataHubOpen) {
      state.dataHubOpen = false;
      state.confirmResetHub = false;
      renderDataHubModal();
    }
    if (state.langMenuOpen || state.formatMenuOpen) {
      state.langMenuOpen = false;
      state.formatMenuOpen = false;
      syncHeaderAndI18n();
    }
  }
});

bindFilterInputs(render);

document.addEventListener('click', e => {
  if (handleDataHubClick(e, ctx)) return;
  if (handleHeaderClick(e, ctx)) return;
  if (e.target.closest('a[href]')) return;
  if (handleFilterClick(e, ctx)) return;
  if (handleOverviewClick(e, ctx)) return;
  if (handleDecksClick(e, ctx)) return;
  if (handleOpponentsClick(e, ctx)) return;
  if (handleHistoryClick(e, ctx)) return;
  handleReportClick(e, ctx);
});

document.addEventListener('input', e => {
  if (e.target.id === 'quick-search') { state.quickSearch = e.target.value; render('quick-search'); return; }
  if (handleDecksInput(e, ctx)) return;
  if (handleOpponentsInput(e, ctx)) return;
  if (handleHistoryInput(e, ctx)) return;
  handleReportInput(e);
});

document.addEventListener('change', e => {
  if (handleDataHubChange(e, ctx)) return;
  if (handleDecksChange(e, ctx)) return;
  handleReportChange(e, ctx);
});

window.addEventListener('resize', () => requestAnimationFrame(initTableScrollbars), { passive: true });

rebuildMatches();
initFilterSelects();
render();
