import { tr } from '../../core/i18n/i18n.service.js';
import { getMatches } from '../../core/data/matches.repository.js';

export function calcStats(list) {
  let w = 0, l = 0, d = 0, expSum = 0;
  let curWin = 0, bestWin = 0, curLoss = 0, worstLoss = 0;
  for (const m of list) {
    expSum += 1 / m.pod;
    if (m.res === 'V') {
      w++; curWin++; curLoss = 0;
      if (curWin > bestWin) bestWin = curWin;
    } else if (m.res === 'D') {
      l++; curLoss++; curWin = 0;
      if (curLoss > worstLoss) worstLoss = curLoss;
    } else {
      d++; curWin = 0; curLoss = 0;
    }
  }
  const total = list.length;
  const wr = total ? w / total : 0;
  const expWr = total ? expSum / total : 0;
  let currentStreakLabel = '—';
  let currentStreakType = 'neutral';
  if (total) {
    const last = list[list.length - 1];
    let cnt = 0;
    for (let i = list.length - 1; i >= 0 && list[i].res === last.res; i--) cnt++;
    if (last.res === 'V') { currentStreakLabel = tr(`+${cnt}V seguidas`, `+${cnt}W streak`); currentStreakType = 'win'; }
    else if (last.res === 'D') { currentStreakLabel = tr(`${cnt}D seguidas`, `${cnt}L streak`); currentStreakType = 'loss'; }
    else { currentStreakLabel = tr('Empate recente', 'Recent draw'); currentStreakType = 'draw'; }
  }
  return { total, w, l, d, wr, expWr, delta: wr - expWr, bestWin, worstLoss, currentStreakLabel, currentStreakType };
}

export function calcTurnStats(list) {
  const valid = list.filter(m => Number(m.turns) > 0);
  if (!valid.length) {
    return { count: 0, avg: null, avgWin: null, avgLoss: null, winCount: 0, lossCount: 0, min: null, max: null };
  }
  const nums = valid.map(m => Number(m.turns));
  const wins = valid.filter(m => m.res === 'V').map(m => Number(m.turns));
  const losses = valid.filter(m => m.res === 'D').map(m => Number(m.turns));
  const avgOf = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  return {
    count: valid.length,
    avg: avgOf(nums),
    avgWin: avgOf(wins),
    avgLoss: avgOf(losses),
    winCount: wins.length,
    lossCount: losses.length,
    min: Math.min(...nums),
    max: Math.max(...nums)
  };
}

export function wilsonScore(w, n, z = 1.645) {
  if (!n) return 0;
  const p = w / n;
  const denom = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return Math.max(0, (center - margin) / denom);
}

export function groupDecks(list) {
  const map = new Map();
  for (const m of list) {
    if (!map.has(m.deck)) {
      map.set(m.deck, { deck: m.deck, borrowed: m.borrowed, games: 0, w: 0, l: 0, d: 0, expSum: 0, matches: [] });
    }
    const g = map.get(m.deck);
    g.games++;
    g.expSum += 1 / m.pod;
    if (m.res === 'V') g.w++;
    else if (m.res === 'D') g.l++;
    else g.d++;
    g.matches.push(m);
  }
  return Array.from(map.values()).map(g => ({
    ...g,
    wr: g.games ? g.w / g.games : 0,
    expWr: g.games ? g.expSum / g.games : 0,
    wilson: wilsonScore(g.w, g.games),
    recent: g.matches.slice(-5).map(x => x.res)
  }));
}

export function groupPlayers(list) {
  const map = new Map();
  for (const m of list) {
    for (const p of m.players) {
      if (!map.has(p)) {
        map.set(p, { player: p, games: 0, w: 0, l: 0, d: 0, oppWins: 0, expSum: 0 });
      }
      const g = map.get(p);
      g.games++;
      g.expSum += 1 / m.pod;
      if (m.res === 'V') g.w++;
      else if (m.res === 'D') g.l++;
      else g.d++;
      if (m.winnerPlayer === p) g.oppWins++;
    }
  }
  return Array.from(map.values()).map(g => ({
    ...g,
    wr: g.games ? g.w / g.games : 0,
    expWr: g.games ? g.expSum / g.games : 0
  }));
}

export function groupEnemyCmds(list) {
  const map = new Map();
  for (const m of list) {
    const seen = new Set();
    for (const c of m.enemyCmds) {
      if (seen.has(c)) continue;
      seen.add(c);
      if (!map.has(c)) map.set(c, { cmd: c, games: 0, w: 0, l: 0, d: 0, players: new Set() });
      const g = map.get(c);
      g.games++;
      if (m.res === 'V') g.w++;
      else if (m.res === 'D') g.l++;
      else g.d++;
      m.players.forEach(p => g.players.add(p));
    }
  }
  return Array.from(map.values()).map(g => ({
    ...g,
    wr: g.games ? g.w / g.games : 0,
    playersList: Array.from(g.players)
  }));
}

export function getClassicDeckMap() {
  const matches = getMatches();
  const counts = new Map();
  const firstSeen = new Map();
  for (const m of matches) {
    if (m.borrowed) continue;
    counts.set(m.deck, (counts.get(m.deck) || 0) + 1);
    if (!firstSeen.has(m.deck)) firstSeen.set(m.deck, { n: m.n, id: m.id, month: m.month });
  }
  const qualified = Array.from(firstSeen.entries())
    .filter(([deck]) => (counts.get(deck) || 0) > 5)
    .sort((a, b) => a[1].n - b[1].n)
    .slice(0, 5);
  const result = new Map();
  qualified.forEach(([deck, info], idx) => {
    result.set(deck, { rank: idx + 1, id: info.id, month: info.month, totalGames: counts.get(deck) });
  });
  return result;
}

export function getDeckCurrentWinStreak(deckName, matchesList) {
  let streak = 0;
  for (let i = matchesList.length - 1; i >= 0; i--) {
    if (matchesList[i].deck !== deckName) continue;
    if (matchesList[i].res === 'V') streak++;
    else break;
  }
  return streak;
}
