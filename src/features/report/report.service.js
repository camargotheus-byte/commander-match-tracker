import { state, getActiveFormat } from '../../core/state/store.js';
import { getFormatDef } from '../../core/formats/formats.config.js';
import { MONTHS, tr } from '../../core/i18n/i18n.service.js';
import { getMatches, addPendingMatch, nextSuggestedId } from '../../core/data/matches.repository.js';
import { fmtDateBr, parseDateToIso } from '../../shared/utils/formatters.js';
import { showToast } from '../../shared/components/toast.js';

export function getDeckLabelFromReport(rep) {
  const d = (rep.deck || '').trim();
  if (!d) return '';
  if (rep.borrowed && !/\(emprestado\)/i.test(d)) return `${d} (emprestado)`;
  return d;
}

export function formatOpponentsLines(rep) {
  const filled = rep.opponents.filter(o => o.cmd.trim() || o.player.trim());
  const source = filled.length ? filled : rep.opponents;
  return source.map(o => {
    const cmd = o.cmd.trim() || '[Comandante]';
    const pl = o.player.trim();
    const isWin = rep.res === 'D' && o.winner;
    if (pl) return `- ${cmd} (${pl}${isWin ? ' - VENCEDOR' : ''})`;
    if (isWin) return `- ${cmd} (VENCEDOR)`;
    return `- ${cmd}`;
  });
}

export function formatOppSummary(opponents, res) {
  const filled = opponents.filter(o => o.cmd.trim() || o.player.trim());
  const items = filled.map(o => {
    const cmd = o.cmd.trim() || 'Desconhecido';
    const pl = o.player.trim();
    const isWin = res === 'D' && o.winner;
    if (pl) return `${cmd} (${pl}${isWin ? ' - VENCEDOR' : ''})`;
    if (isWin) return `${cmd} (VENCEDOR)`;
    return cmd;
  });
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} e ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

export function parseTurnsVal(v) {
  const n = parseInt(String(v ?? '').trim(), 10);
  return Number.isFinite(n) && n >= 1 && n <= 99 ? n : null;
}

export function buildReportText(rep) {
  const lines = [];
  const fmt = getActiveFormat();
  if (fmt.key !== 'commander') lines.push(`Formato: ${fmt.pt}`);
  if (rep.date) lines.push(`Data: ${fmtDateBr(rep.date)}`);
  lines.push(
    `Mês: ${MONTHS[rep.monthIdx] || 'Novembro'}`,
    `Meu Deck: ${getDeckLabelFromReport(rep) || '[Seu Deck]'}`,
    `Resultado: ${rep.res}`
  );
  if (rep.ordem) lines.push(`Ordem de Jogada: ${rep.ordem}`);
  const tVal = parseTurnsVal(rep.turns);
  if (tVal) lines.push(`Turnos: ${tVal}`);
  lines.push('', 'Oponentes:');
  formatOpponentsLines(rep).forEach(l => lines.push(l));
  lines.push('', 'Notas:');
  if (rep.notes.trim()) lines.push(rep.notes.trim());
  return lines.join('\n');
}

export function buildReportTextFromMatch(m) {
  const lines = [];
  const fmt = getFormatDef(m.format || 'commander');
  if (fmt.key !== 'commander') lines.push(`Formato: ${fmt.pt}`);
  if (m.date) lines.push(`Data: ${fmtDateBr(m.date)}`);
  lines.push(`Mês: ${m.month}`, `Meu Deck: ${m.deck}`, `Resultado: ${m.res}`);
  if (m.ordem) lines.push(`Ordem de Jogada: ${m.ordem}`);
  if (m.turns) lines.push(`Turnos: ${m.turns}`);
  lines.push('', 'Oponentes:');
  if (m.rawOpponents && m.rawOpponents.length) {
    m.rawOpponents.forEach(o => {
      const isWin = m.res === 'D' && o.winner;
      if (o.player) lines.push(`- ${o.cmd} (${o.player}${isWin ? ' - VENCEDOR' : ''})`);
      else if (isWin) lines.push(`- ${o.cmd} (VENCEDOR)`);
      else lines.push(`- ${o.cmd}`);
    });
  } else lines.push(`- ${m.oppStr}`);
  lines.push('', 'Notas:');
  if (m.note) lines.push(m.note);
  return lines.join('\n');
}

export function buildSheetsTsv(rep) {
  const resLabel = rep.res === 'V' ? 'Vitória' : (rep.res === 'D' ? 'Derrota' : 'Empate');
  let fullNotes = `Oponentes: ${formatOppSummary(rep.opponents, rep.res)}.`;
  if (rep.notes.trim()) fullNotes += ` Notas: ${rep.notes.trim()}`;
  const tVal = parseTurnsVal(rep.turns);
  return [
    nextSuggestedId(),
    MONTHS[rep.monthIdx] || 'Novembro',
    rep.year || '2026',
    getDeckLabelFromReport(rep),
    rep.ordem || '',
    resLabel,
    fullNotes,
    tVal ? String(tVal) : '',
    rep.date ? fmtDateBr(rep.date) : ''
  ].join('\t');
}

function parseOpponentBullet(raw, targetArr) {
  const clean = raw.replace(/^[-•*]\s*/, '').trim();
  if (!clean) return;
  const parenMatch = clean.match(/\(([^)]+)\)\s*$/);
  let cmd = clean, player = '', winner = false;
  if (parenMatch) {
    cmd = clean.slice(0, parenMatch.index).trim();
    const inside = parenMatch[1].trim();
    winner = /vencedor/i.test(inside);
    player = inside.replace(/\s*-?\s*vencedor/i, '').trim();
  }
  targetArr.push({ cmd, player, winner });
}

export function parseTemplateText(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const rep = {
    date: state.report.date || '',
    monthIdx: state.report.monthIdx,
    year: state.report.year || '2026',
    deck: '',
    borrowed: false,
    res: 'V',
    ordem: '',
    turns: '',
    opponents: [],
    notes: ''
  };
  let section = 'header';
  const notesLines = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^formato\s*:/i.test(line)) continue;
    if (/^data\s*:/i.test(line)) {
      const iso = parseDateToIso(line.replace(/^data\s*:/i, '').trim());
      if (iso) {
        rep.date = iso;
        rep.year = iso.slice(0, 4);
        rep.monthIdx = Math.max(0, Math.min(11, parseInt(iso.slice(5, 7), 10) - 1));
      }
      continue;
    }
    if (/^m[eê]s\s*:/i.test(line)) {
      const val = line.replace(/^m[eê]s\s*:/i, '').trim().toLowerCase();
      const idx = MONTHS.findIndex(m => m.toLowerCase().startsWith(val.slice(0, 3)));
      if (idx >= 0) rep.monthIdx = idx;
      continue;
    }
    if (/^(?:meu\s*)?deck\s*:/i.test(line)) {
      const val = line.replace(/^(?:meu\s*)?deck\s*:/i, '').trim();
      rep.borrowed = /\(emprestado\)/i.test(val);
      rep.deck = val;
      continue;
    }
    if (/^resultado\s*:/i.test(line)) {
      const val = line.replace(/^resultado\s*:/i, '').trim().toUpperCase();
      rep.res = val.startsWith('D') ? 'D' : (val.startsWith('E') ? 'E' : 'V');
      continue;
    }
    if (/^ordem(?:\s+de\s+jogada)?\s*:/i.test(line)) {
      rep.ordem = line.replace(/^ordem(?:\s+de\s+jogada)?\s*:/i, '').trim();
      continue;
    }
    if (/^(?:turnos(?:\s+do\s+jogo)?|dura[cç][aã]o(?:\s*\(turnos\)|\s+em\s+turnos)?)\s*:/i.test(line)) {
      const mNum = line.match(/(\d+)/);
      if (mNum) {
        const tv = parseTurnsVal(mNum[1]);
        if (tv) rep.turns = String(tv);
      }
      continue;
    }
    if (/^oponentes?\s*:/i.test(line)) {
      section = 'opponents';
      const inline = line.replace(/^oponentes?\s*:/i, '').trim();
      if (inline) parseOpponentBullet(inline, rep.opponents);
      continue;
    }
    if (/^notas?\s*:/i.test(line)) {
      section = 'notes';
      const inline = line.replace(/^notas?\s*:/i, '').trim();
      if (inline) notesLines.push(inline);
      continue;
    }
    if (section === 'opponents' || line.startsWith('-')) {
      section = 'opponents';
      parseOpponentBullet(line, rep.opponents);
    } else if (section === 'notes') {
      notesLines.push(rawLine.trim());
    }
  }
  if (!rep.opponents.length) rep.opponents = [{ cmd: '', player: '', winner: false }];
  rep.notes = notesLines.join('\n').trim();
  return rep;
}

export function submitReportToPanel({ onDataChange }) {
  const rep = state.report;
  const deckName = getDeckLabelFromReport(rep);
  const validOpps = rep.opponents
    .map(o => ({ cmd: o.cmd.trim(), player: o.player.trim(), winner: rep.res === 'D' && !!o.winner }))
    .filter(o => o.cmd || o.player);

  if (!deckName) { showToast(tr('Informe o nome do seu deck.', 'Please enter your deck name.'), 'error'); return; }
  if (!validOpps.length) { showToast(tr('Adicione pelo menos um oponente.', 'Add at least one opponent.'), 'error'); return; }

  const players = [], enemyCmds = [];
  let winnerPlayer = '';
  validOpps.forEach(o => {
    if (o.cmd) enemyCmds.push(o.cmd);
    if (o.player) {
      const np = o.player.trim();
      if (np && !players.includes(np)) players.push(np);
      if (o.winner && np) winnerPlayer = np;
    }
  });

  const activeFmt = getActiveFormat();
  const newMatch = {
    n: getMatches().length + 1,
    id: nextSuggestedId(),
    format: activeFmt.key,
    monthIdx: rep.monthIdx,
    month: MONTHS[rep.monthIdx],
    year: rep.year || '2026',
    date: rep.date || '',
    deckIdx: -1,
    deck: deckName,
    borrowed: deckName.toLowerCase().includes('(emprestado)'),
    res: rep.res,
    resLabel: rep.res === 'V' ? 'Vitória' : (rep.res === 'D' ? 'Derrota' : 'Empate'),
    pod: validOpps.length + 1,
    players,
    winnerPlayer,
    enemyCmds,
    ordem: rep.ordem || '',
    turns: parseTurnsVal(rep.turns),
    oppStr: formatOppSummary(validOpps, rep.res),
    note: rep.notes.trim(),
    rawOpponents: validOpps,
    pending: true
  };

  addPendingMatch(newMatch);

  const keepCount = rep.opponents.length;
  state.report.deck = '';
  state.report.borrowed = false;
  state.report.ordem = '';
  state.report.turns = '';
  state.report.notes = '';
  state.report.opponents = Array.from({ length: keepCount }, () => ({ cmd: '', player: '', winner: false }));

  onDataChange();
  showToast(tr(`${newMatch.id} salva no perfil ${activeFmt.pt}!`, `${newMatch.id} saved to ${activeFmt.en} profile!`));
}

export function updateReportPreviewLive() {
  const pre = document.getElementById('rep-preview');
  if (pre) pre.textContent = buildReportText(state.report);
  const tsv = document.getElementById('rep-tsv-preview');
  if (tsv) tsv.textContent = buildSheetsTsv(state.report);
}
