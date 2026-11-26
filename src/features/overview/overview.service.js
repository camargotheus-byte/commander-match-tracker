import { monthName, monthShort } from '../../core/i18n/i18n.service.js';
import { getMatches } from '../../core/data/matches.repository.js';

export function buildMonthlySeries(filtered) {
  const hasDec = getMatches().some(x => x.monthIdx === 11);
  const activeCount = hasDec ? 12 : 11;
  return Array.from({ length: activeCount }, (_, i) => {
    const list = filtered.filter(m => m.monthIdx === i);
    const w = list.filter(x => x.res === 'V').length;
    const l = list.filter(x => x.res === 'D').length;
    const d = list.filter(x => x.res === 'E').length;
    const total = list.length;
    return { i, name: monthName(i), short: monthShort(i), total, w, l, d, wr: total ? w / total : null };
  });
}

export function buildCumulativeSeries(filtered) {
  const cumPts = [];
  let cw = 0;
  filtered.forEach((m, idx) => {
    if (m.res === 'V') cw++;
    cumPts.push({ idx: idx + 1, wr: cw / (idx + 1), m });
  });
  return cumPts;
}
