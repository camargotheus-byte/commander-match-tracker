import { state } from '../../core/state/store.js';
import { tr } from '../../core/i18n/i18n.service.js';
import { updateMatchById, deleteMatchById, getMatches } from '../../core/data/matches.repository.js';
import { getRegisteredDecks, resolveDeckKeyFromInput } from '../../shared/utils/deck-style.service.js';
import { showToast } from '../../shared/components/toast.js';
import { exportFilteredCsv } from './history.service.js';

export function handleHistoryClick(e, { render, onDataChange }) {
  const histRes = e.target.closest('[data-hist-res]');
  if (histRes) { state.histRes = histRes.dataset.histRes; render(); return true; }

  if (e.target.id === 'btn-hist-order') {
    state.histOrder = state.histOrder === 'desc' ? 'asc' : 'desc';
    render();
    return true;
  }

  if (e.target.id === 'btn-export-csv') {
    exportFilteredCsv();
    return true;
  }

  const editBtn = e.target.closest('[data-hist-edit]');
  if (editBtn) {
    state.editingMatchId = editBtn.dataset.histEdit;
    state.confirmDeleteMatchId = null;
    render();
    return true;
  }

  if (e.target.closest('[data-hist-cancel-edit]')) {
    state.editingMatchId = null;
    render();
    return true;
  }

  const saveEditBtn = e.target.closest('[data-hist-save-edit]');
  if (saveEditBtn) {
    const id = saveEditBtn.dataset.histSaveEdit;
    const rawDeck = (document.getElementById('hist-edit-deck')?.value || '').trim();
    if (!rawDeck) {
      showToast(tr('Informe o nome do deck.', 'Please enter the deck name.'), 'error');
      return true;
    }
    const knownDecks = Array.from(new Set([...getRegisteredDecks(state.format), ...getMatches().map(m => m.deck)]));
    const deck = resolveDeckKeyFromInput(rawDeck, knownDecks);
    const date = (document.getElementById('hist-edit-date')?.value || '').trim();
    const res = document.getElementById('hist-edit-res')?.value || 'V';
    const rawTurns = parseInt(document.getElementById('hist-edit-turns')?.value || '', 10);
    const turns = Number.isFinite(rawTurns) && rawTurns >= 1 && rawTurns <= 99 ? rawTurns : null;
    const ordem = document.getElementById('hist-edit-ordem')?.value || '';
    const note = (document.getElementById('hist-edit-note')?.value || '').trim();
    const oppStr = (document.getElementById('hist-edit-opp')?.value || '').trim();
    const patch = { deck, res, turns, ordem, note, oppStr, date };
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      patch.year = date.slice(0, 4);
      patch.monthIdx = parseInt(date.slice(5, 7), 10) - 1;
    }
    updateMatchById(id, patch, state.format);
    state.editingMatchId = null;
    onDataChange();
    showToast(tr(`Partida ${id} atualizada no seu Hub!`, `Match ${id} updated in your Hub!`));
    return true;
  }

  const askDelBtn = e.target.closest('[data-hist-ask-del]');
  if (askDelBtn) {
    state.confirmDeleteMatchId = askDelBtn.dataset.histAskDel;
    state.editingMatchId = null;
    render();
    return true;
  }

  if (e.target.closest('[data-hist-cancel-del]')) {
    state.confirmDeleteMatchId = null;
    render();
    return true;
  }

  const confirmDelBtn = e.target.closest('[data-hist-confirm-del]');
  if (confirmDelBtn) {
    const id = confirmDelBtn.dataset.histConfirmDel;
    const removed = deleteMatchById(id, state.format);
    state.confirmDeleteMatchId = null;
    if (removed) {
      onDataChange();
      showToast(tr(`Partida ${id} removida do seu Hub.`, `Match ${id} removed from your Hub.`));
    }
    return true;
  }

  return false;
}

export function handleHistoryInput(e, { render }) {
  if (e.target.id === 'hist-search') { state.histSearch = e.target.value; render('hist-search'); return true; }
  return false;
}
