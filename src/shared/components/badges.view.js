import { tr, monthName, fmtRecord } from '../../core/i18n/i18n.service.js';
import { getMatches } from '../../core/data/matches.repository.js';
import { getClassicDeckMap, getDeckCurrentWinStreak } from '../utils/stats.utils.js';
import { esc, fmtPct } from '../utils/formatters.js';

export function getDeckBadges(d, opts = {}) {
  const matches = getMatches();
  const badges = [];
  const classicInfo = getClassicDeckMap().get(d.deck);
  const streak = getDeckCurrentWinStreak(d.deck, d.matches || matches);

  if (d.games === 0) {
    badges.push({
      label: tr('NOVO', 'NEW'),
      cls: 'badge-pop-purple',
      tip: tr('Deck cadastrado manualmente — ainda sem partidas registradas.', 'Manually registered deck — no matches logged yet.')
    });
  }
  if (d.borrowed) {
    badges.push({
      label: tr('EMPREST.', 'BORROWED'),
      cls: 'badge-neutral',
      tip: tr('Deck emprestado utilizado em partidas registradas.', 'Borrowed deck played in recorded matches.')
    });
  }
  if (!d.borrowed && d.wr === 1 && d.games >= 3) {
    badges.push({
      label: tr('INVICTO', 'UNDEFEATED'),
      cls: 'badge-win',
      tip: tr(`100% de aproveitamento com 3 ou mais jogos (${fmtRecord(d.w, 0, 0)}).`, `100% win rate across 3 or more games (${fmtRecord(d.w, 0, 0)}).`)
    });
  }
  if (!d.borrowed && d.wr >= 0.7 && d.games >= 10) {
    badges.push({
      label: 'TOP',
      cls: 'badge-pop-pink',
      tip: tr(`Desempenho de elite: 70%+ de Win Rate com pelo menos 10 partidas (${fmtPct(d.wr)} em ${d.games} jogos).`, `Elite performance: 70%+ Win Rate with at least 10 games (${fmtPct(d.wr)} in ${d.games} games).`)
    });
  }
  if (streak >= 3) {
    badges.push({
      label: tr('EM ALTA', 'ON FIRE'),
      cls: 'badge-pop-yellow',
      tip: tr(`Em grande fase: ${streak} vitórias seguidas nas partidas mais recentes deste deck!`, `Hot streak: ${streak} consecutive wins in this deck's most recent games!`)
    });
  }
  if (classicInfo) {
    const cMonth = monthName(matches.find(m => m.id === classicInfo.id)?.monthIdx ?? 0) || classicInfo.month;
    badges.push({
      label: tr('CLÁSSICO', 'CLASSIC'),
      cls: 'badge-pop-purple',
      tip: tr(`Deck de assinatura (#${classicInfo.rank} entre os 5 mais antigos com mais de 5 jogos) — estreou na ${classicInfo.id} (${cMonth}/2026).`, `Signature deck (#${classicInfo.rank} of the 5 oldest decks with 5+ games) — debuted in ${classicInfo.id} (${cMonth} 2026).`)
    });
  }
  if (opts.honorable && !d.borrowed && d.games > 0) {
    badges.push({
      label: tr('MENÇÃO', 'HONORABLE'),
      cls: 'badge-neutral',
      tip: tr('Menos de 5 partidas registradas — amostra pequena (Menção Honrosa).', 'Under 5 recorded matches — small sample (Honorable Mention).')
    });
  }
  return badges;
}

export function renderBadgesHtml(badges) {
  if (!badges.length) return '';
  return badges.map(b => `<span class="px-1.5 py-0.2 rounded text-xs ${b.cls}" data-tip="${esc(b.tip)}">${esc(b.label)}</span>`).join('');
}
