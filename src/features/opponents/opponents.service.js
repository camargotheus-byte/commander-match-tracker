import { getEnemyCmdColorIdentity, getColorComboLabel } from '../../shared/utils/deck-style.service.js';
import { groupEnemyCmds } from '../../shared/utils/stats.utils.js';

function foldName(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function getRivalCommanders(matches, playerName) {
  const target = foldName(playerName);
  const map = new Map();
  for (const m of matches) {
    const chunks = m.oppStr.split(/\)\s*(?:,\s*|\s+e\s+)/);
    let foundCmd = '';
    for (const rawCh of chunks) {
      const ch = rawCh.trim();
      const pMatch = ch.match(/\(([^)]+)\)?\s*$/);
      if (!pMatch) continue;
      const inside = foldName(pMatch[1]).replace(/\s*-\s*vencedor.*$/, '').replace(/\s*-\s*winner.*$/, '').trim();
      const parts = inside.split(/\/\/|\//).map(x => x.trim());
      if (parts.some(pt => pt === target || (pt.length >= 4 && (target.startsWith(pt) || pt.startsWith(target))))) {
        foundCmd = ch.slice(0, pMatch.index).replace(/^[,.\s]+|[,.\s]+$/g, '');
        break;
      }
    }
    if (foundCmd) {
      const fLow = foundCmd.toLowerCase().replace(/[^a-z0-9]/g, '');
      const canonical = (m.enemyCmds || []).find(ec => {
        const eLow = ec.toLowerCase().replace(/[^a-z0-9]/g, '');
        return eLow === fLow || eLow.startsWith(fLow) || fLow.startsWith(eLow);
      }) || foundCmd;
      if (!map.has(canonical)) map.set(canonical, { cmd: canonical, games: 0, w: 0, l: 0, d: 0 });
      const g = map.get(canonical);
      g.games++;
      if (m.res === 'V') g.w++;
      else if (m.res === 'D') g.l++;
      else g.d++;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.games - a.games);
}

export function filterEnemyCommanders(filtered, query) {
  let ecmds = groupEnemyCmds(filtered).sort((a, b) => (b.games - a.games) || (b.wr - a.wr));
  const q = (query || '').trim().toLowerCase();
  if (!q) return ecmds;
  return ecmds.filter(c => {
    const cols = getEnemyCmdColorIdentity(c.cmd);
    const combo = cols !== null ? getColorComboLabel(cols).toLowerCase() : '';
    const codeStr = Array.isArray(cols) ? (cols.length ? cols.join('').toLowerCase() : 'c') : '';
    return c.cmd.toLowerCase().includes(q)
      || c.playersList.some(p => p.toLowerCase().includes(q))
      || combo.includes(q)
      || (q.length >= 2 && codeStr === q);
  });
}
