import { DEMO_MATCHES } from './demo-dataset.js';
import { STORAGE_KEYS, readJson, writeJson, removeKey } from '../storage/storage.service.js';
import { getFormatDef } from '../formats/formats.config.js';
import { MONTHS } from '../i18n/i18n.service.js';
import { state, activeFormatKey, setActiveFormat, resetProfileFilters } from '../state/store.js';
import { favoriteDecks } from '../../shared/utils/deck-style.service.js';

/**
 * Default initial matches for a brand-new browser session.
 * Empty (`[]`) in the public GitHub Pages beta build; can be optionally populated
 * when building a personal standalone bundle via `scripts/build-standalone.py --seed <backup.json>`.
 */
const INITIAL_SEED_MATCHES = /*CMT_INITIAL_SEED_START*/[]/*CMT_INITIAL_SEED_END*/;

export function hasPersonalSeed() {
  return Array.isArray(INITIAL_SEED_MATCHES) && INITIAL_SEED_MATCHES.length > 0;
}

export function buildSeedMatches() {
  return Array.isArray(INITIAL_SEED_MATCHES) ? INITIAL_SEED_MATCHES.map(normalizeMatchRecord) : [];
}

function normalizeMatchRecord(m, idx) {
  const res = m.res === 'D' ? 'D' : (m.res === 'E' ? 'E' : 'V');
  const monthIdx = Number.isFinite(Number(m.monthIdx)) ? Math.max(0, Math.min(11, Number(m.monthIdx))) : 0;
  const deck = String(m.deck || '').trim();
  const pod = Math.max(2, Number(m.pod) || (Array.isArray(m.players) ? m.players.length + 1 : 2));
  return {
    n: Number(m.n) || (idx + 1),
    id: String(m.id || `CMD-${String(idx + 1).padStart(3, '0')}`),
    format: String(m.format || 'commander'),
    monthIdx,
    month: MONTHS[monthIdx] || String(m.month || 'Janeiro'),
    year: String(m.year || new Date().getFullYear()),
    deckIdx: Number.isFinite(Number(m.deckIdx)) ? Number(m.deckIdx) : -1,
    deck,
    borrowed: Boolean(m.borrowed || deck.toLowerCase().includes('(emprestado)') || deck.toLowerCase().includes('(borrowed)')),
    res,
    resLabel: res === 'V' ? 'Vitória' : (res === 'D' ? 'Derrota' : 'Empate'),
    pod,
    players: Array.isArray(m.players) ? m.players.filter(Boolean) : [],
    winnerPlayer: String(m.winnerPlayer || ''),
    enemyCmds: Array.isArray(m.enemyCmds) ? m.enemyCmds.filter(Boolean) : [],
    ordem: String(m.ordem || ''),
    oppStr: String(m.oppStr || ''),
    note: String(m.note || ''),
    turns: Number(m.turns) > 0 ? Number(m.turns) : null,
    date: String(m.date || ''),
    rawOpponents: Array.isArray(m.rawOpponents) ? m.rawOpponents : undefined,
    isDemo: Boolean(m.isDemo),
    pending: Boolean(m.pending)
  };
}

function loadHubMatches() {
  const stored = readJson(STORAGE_KEYS.HUB_MATCHES, null);
  if (Array.isArray(stored)) {
    return stored.map(normalizeMatchRecord);
  }
  const base = buildSeedMatches();
  const legacyPending = readJson(STORAGE_KEYS.PENDING_REPORTS, []);
  const seedIds = new Set(base.map(m => m.id));
  const extra = Array.isArray(legacyPending)
    ? legacyPending
        .map(m => ({ ...m, format: m.format || 'commander', pending: true }))
        .filter(m => !((m.format || 'commander') === 'commander' && seedIds.has(m.id)))
    : [];
  const merged = base.concat(extra).map(normalizeMatchRecord);
  if (merged.length > 0) {
    writeJson(STORAGE_KEYS.HUB_MATCHES, merged, { silent: true });
  }
  return merged;
}

let hubMatches = loadHubMatches();
let activeMatchesCache = [];

function persistHubMatches({ silent = false } = {}) {
  writeJson(STORAGE_KEYS.HUB_MATCHES, hubMatches, { silent });
}

export function rebuildMatches() {
  activeMatchesCache = hubMatches.filter(m => (m.format || 'commander') === activeFormatKey);
}

rebuildMatches();

export function getAllMatches() {
  return hubMatches;
}

export function getMatches() {
  return activeMatchesCache;
}

export function getFormatMatches(fmtKey) {
  return hubMatches.filter(m => (m.format || 'commander') === fmtKey);
}

export function getFormatPendingMatches(fmtKey = activeFormatKey) {
  return hubMatches.filter(m => (m.format || 'commander') === fmtKey && m.pending);
}

export function getPendingMatches() {
  return hubMatches.filter(m => m.pending);
}

export function isDemoMode() {
  return hubMatches.length > 0 && hubMatches.every(m => m.isDemo);
}

export function loadDemoMatches() {
  hubMatches = DEMO_MATCHES.map(normalizeMatchRecord);
  setActiveFormat('commander');
  resetProfileFilters();
  persistHubMatches();
  rebuildMatches();
  return hubMatches.length;
}

export function clearDemoMatches() {
  hubMatches = hubMatches.filter(m => !m.isDemo);
  resetProfileFilters();
  persistHubMatches();
  rebuildMatches();
}

export function addPendingMatch(match) {
  const rec = normalizeMatchRecord({ ...match, isDemo: false, pending: true }, hubMatches.length);
  hubMatches.push(rec);
  persistHubMatches();
  rebuildMatches();
  return rec;
}

export function removePendingMatchById(id, fmtKey = activeFormatKey) {
  return deleteMatchById(id, fmtKey);
}

export function deleteMatchById(id, fmtKey = activeFormatKey) {
  const idx = hubMatches.findIndex(x => x.id === id && (x.format || 'commander') === fmtKey);
  if (idx < 0) return null;
  const removed = hubMatches.splice(idx, 1)[0];
  persistHubMatches();
  rebuildMatches();
  return removed;
}

export function updateMatchById(id, patch, fmtKey = activeFormatKey) {
  const idx = hubMatches.findIndex(x => x.id === id && (x.format || 'commander') === fmtKey);
  if (idx < 0) return null;
  const cur = hubMatches[idx];
  const next = normalizeMatchRecord({ ...cur, ...patch, id: cur.id, format: cur.format }, idx);
  hubMatches[idx] = next;
  persistHubMatches();
  rebuildMatches();
  return next;
}

export function replaceAllMatches(matchesArray, { silent = false } = {}) {
  if (!Array.isArray(matchesArray)) return;
  hubMatches = matchesArray.map(normalizeMatchRecord);
  persistHubMatches({ silent });
  removeKey(STORAGE_KEYS.PENDING_REPORTS);
  rebuildMatches();
}

export function clearAllHubMatches() {
  hubMatches = [];
  resetProfileFilters();
  persistHubMatches();
  removeKey(STORAGE_KEYS.PENDING_REPORTS);
  rebuildMatches();
}

export function resetHubToSeed() {
  hubMatches = buildSeedMatches();
  resetProfileFilters();
  persistHubMatches();
  removeKey(STORAGE_KEYS.PENDING_REPORTS);
  rebuildMatches();
}

export function nextSuggestedId(fmtKey = activeFormatKey) {
  const def = getFormatDef(fmtKey);
  const list = getFormatMatches(fmtKey);
  const used = new Set(list.map(m => m.id));
  let n = list.length + 1;
  let candidate = `${def.prefix}-${String(n).padStart(3, '0')}`;
  while (used.has(candidate)) {
    n++;
    candidate = `${def.prefix}-${String(n).padStart(3, '0')}`;
  }
  return candidate;
}

export function getFilteredMatches() {
  const q = state.quickSearch.trim().toLowerCase();
  return activeMatchesCache.filter(m => {
    if (state.month !== 'all' && m.monthIdx !== Number(state.month)) return false;
    if (state.deck !== 'all' && m.deck !== state.deck) return false;
    if (state.player !== 'all' && !m.players.includes(state.player)) return false;
    if (state.pod === '2' && m.pod !== 2) return false;
    if (state.pod === '3' && m.pod !== 3) return false;
    if (state.pod === '4+' && m.pod < 4) return false;
    if (state.origin === 'own' && m.borrowed) return false;
    if (state.origin === 'borrowed' && !m.borrowed) return false;
    if (state.onlyFavorites && !favoriteDecks.has(m.deck)) return false;
    if (state.enemyCmdFilter && !m.enemyCmds.includes(state.enemyCmdFilter)) return false;
    if (q) {
      const hay = `${m.id} ${m.month} ${m.deck} ${m.oppStr} ${m.note}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
