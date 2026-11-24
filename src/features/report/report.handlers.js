import { state, getActiveFormat } from '../../core/state/store.js';
import { tr } from '../../core/i18n/i18n.service.js';
import { getFormatPendingMatches, removePendingMatchById } from '../../core/data/matches.repository.js';
import { todayIso } from '../../shared/utils/formatters.js';
import { showToast, copyTextToClipboard } from '../../shared/components/toast.js';
import {
  buildReportText,
  buildReportTextFromMatch,
  buildSheetsTsv,
  parseTemplateText,
  submitReportToPanel,
  updateReportPreviewLive
} from './report.service.js';

export function handleReportClick(e, { render, onDataChange }) {
  const repRes = e.target.closest('[data-rep-res]');
  if (repRes) {
    state.report.res = repRes.dataset.repRes;
    if (state.report.res !== 'D') state.report.opponents.forEach(o => { o.winner = false; });
    render();
    return true;
  }

  const repOrdem = e.target.closest('[data-rep-ordem]');
  if (repOrdem) { state.report.ordem = repOrdem.dataset.repOrdem; render(); return true; }

  const repTurns = e.target.closest('[data-rep-turns]');
  if (repTurns) { state.report.turns = repTurns.dataset.repTurns; render(); return true; }

  if (e.target.id === 'btn-rep-date-today') {
    const iso = todayIso();
    state.report.date = iso;
    state.report.year = iso.slice(0, 4);
    state.report.monthIdx = parseInt(iso.slice(5, 7), 10) - 1;
    render();
    return true;
  }
  if (e.target.id === 'btn-rep-date-clear') {
    state.report.date = '';
    render();
    return true;
  }

  const repPreset = e.target.closest('[data-rep-preset]');
  if (repPreset) {
    const len = Number(repPreset.dataset.repPreset);
    while (state.report.opponents.length < len) state.report.opponents.push({ cmd: '', player: '', winner: false });
    if (state.report.opponents.length > len) state.report.opponents = state.report.opponents.slice(0, len);
    render();
    return true;
  }

  const oppWin = e.target.closest('[data-opp-winner]');
  if (oppWin && state.report.res === 'D') {
    const idx = Number(oppWin.dataset.oppWinner);
    const already = state.report.opponents[idx].winner;
    state.report.opponents.forEach((o, i) => { o.winner = i === idx ? !already : false; });
    render();
    return true;
  }

  const oppRem = e.target.closest('[data-opp-remove]');
  if (oppRem && state.report.opponents.length > 1) {
    state.report.opponents.splice(Number(oppRem.dataset.oppRemove), 1);
    render();
    return true;
  }

  if (e.target.id === 'btn-add-opp') {
    state.report.opponents.push({ cmd: '', player: '', winner: false });
    render();
    return true;
  }

  if (e.target.id === 'btn-toggle-paste') {
    state.report.showPasteBox = !state.report.showPasteBox;
    render();
    return true;
  }

  if (e.target.id === 'btn-parse-paste') {
    const parsed = parseTemplateText(state.report.pasteText || '');
    state.report = { ...state.report, ...parsed, showPasteBox: false, pasteText: '' };
    render();
    showToast(tr('Formulário preenchido!', 'Form filled!'));
    return true;
  }

  if (e.target.id === 'btn-clear-report') {
    state.report.deck = '';
    state.report.borrowed = false;
    state.report.res = 'V';
    state.report.ordem = '';
    state.report.turns = '';
    state.report.notes = '';
    const defaultCount = getActiveFormat().defaultOpps || 3;
    state.report.opponents = Array.from({ length: defaultCount }, () => ({ cmd: '', player: '', winner: false }));
    render();
    return true;
  }

  if (e.target.id === 'btn-submit-report') {
    submitReportToPanel({ onDataChange });
    return true;
  }

  if (e.target.id === 'btn-copy-current-report' || e.target.id === 'btn-copy-preview') {
    copyTextToClipboard(buildReportText(state.report), tr('Report copiado! Cole no chat para gravar na planilha.', 'Report copied! Paste in chat to save to Sheets.'));
    return true;
  }

  if (e.target.id === 'btn-copy-tsv') {
    copyTextToClipboard(buildSheetsTsv(state.report), tr('Linha TSV copiada!', 'TSV row copied!'));
    return true;
  }

  if (e.target.id === 'btn-copy-all-pending') {
    const fmtPend = getFormatPendingMatches();
    copyTextToClipboard(fmtPend.map(buildReportTextFromMatch).join('\n\n---\n\n'), tr(`${fmtPend.length} report(s) copiado(s)!`, `${fmtPend.length} report(s) copied!`));
    return true;
  }

  const copyPend = e.target.closest('[data-copy-pending-id]');
  if (copyPend) {
    const pid = copyPend.dataset.copyPendingId;
    const m = getFormatPendingMatches().find(x => x.id === pid);
    if (m) copyTextToClipboard(buildReportTextFromMatch(m), tr(`Report da ${m.id} copiado!`, `Report for ${m.id} copied!`));
    return true;
  }

  const remPend = e.target.closest('[data-remove-pending-id]');
  if (remPend) {
    const removed = removePendingMatchById(remPend.dataset.removePendingId, state.format);
    if (removed) {
      onDataChange();
      showToast(tr(`${removed.id} removida da fila local.`, `${removed.id} removed from local queue.`));
    }
    return true;
  }

  return false;
}

export function handleReportInput(e) {
  if (e.target.id === 'rep-deck') { state.report.deck = e.target.value; updateReportPreviewLive(); return true; }
  if (e.target.id === 'rep-turns') {
    state.report.turns = e.target.value;
    document.querySelectorAll('[data-rep-turns]').forEach(btn => {
      btn.classList.toggle('nb-pill-active', btn.dataset.repTurns === String(state.report.turns).trim());
    });
    updateReportPreviewLive();
    return true;
  }
  if (e.target.id === 'rep-notes') { state.report.notes = e.target.value; updateReportPreviewLive(); return true; }
  if (e.target.id === 'rep-paste-area') { state.report.pasteText = e.target.value; return true; }
  if (e.target.dataset && e.target.dataset.oppField) {
    const idx = Number(e.target.dataset.oppIdx);
    if (state.report.opponents[idx]) {
      state.report.opponents[idx][e.target.dataset.oppField] = e.target.value;
      updateReportPreviewLive();
      return true;
    }
  }
  return false;
}

export function handleReportChange(e, { render }) {
  if (e.target.id === 'rep-date') {
    const iso = e.target.value;
    state.report.date = iso;
    if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      state.report.year = iso.slice(0, 4);
      state.report.monthIdx = parseInt(iso.slice(5, 7), 10) - 1;
    }
    render();
    return true;
  }
  if (e.target.id === 'rep-month') {
    state.report.monthIdx = Number(e.target.value);
    if (state.report.date && parseInt(state.report.date.slice(5, 7), 10) - 1 !== state.report.monthIdx) {
      state.report.date = '';
    }
    render();
    return true;
  }
  if (e.target.id === 'rep-borrowed') {
    state.report.borrowed = e.target.checked;
    updateReportPreviewLive();
    return true;
  }
  return false;
}
