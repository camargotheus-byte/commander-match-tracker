import { state, getActiveFormat } from '../../core/state/store.js';
import { getFilteredMatches } from '../../core/data/matches.repository.js';
import { fmtDateBr } from '../../shared/utils/formatters.js';

export function filterHistoryMatches(filtered) {
  let list = filtered.slice();
  if (state.histRes !== 'all') list = list.filter(m => m.res === state.histRes);
  if (state.histSearch.trim()) {
    const q = state.histSearch.trim().toLowerCase();
    list = list.filter(m =>
      m.id.toLowerCase().includes(q) || m.deck.toLowerCase().includes(q) ||
      m.oppStr.toLowerCase().includes(q) || m.note.toLowerCase().includes(q) ||
      m.month.toLowerCase().includes(q)
    );
  }
  if (state.histOrder === 'desc') list.reverse();
  return list;
}

export function exportFilteredCsv() {
  let list = getFilteredMatches();
  if (state.histRes !== 'all') list = list.filter(m => m.res === state.histRes);
  if (state.histSearch.trim()) {
    const q = state.histSearch.trim().toLowerCase();
    list = list.filter(m =>
      m.id.toLowerCase().includes(q) || m.deck.toLowerCase().includes(q) ||
      m.oppStr.toLowerCase().includes(q) || m.note.toLowerCase().includes(q)
    );
  }
  const csvCell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const activeFmt = getActiveFormat();
  const lines = [['ID', 'Formato', 'Data', 'Mês', 'Ano', 'Deck', 'Mesa', 'Ordem', 'Turnos', 'Resultado', 'Oponentes', 'Notas'].map(csvCell).join(',')];
  for (const m of list) {
    lines.push([m.id, activeFmt.pt, m.date ? fmtDateBr(m.date) : '', m.month, m.year || '2026', m.deck, m.pod + 'P', m.ordem, m.turns || '', m.resLabel, m.oppStr, m.note].map(csvCell).join(','));
  }
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.format}-match-tracker-filtrado.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
