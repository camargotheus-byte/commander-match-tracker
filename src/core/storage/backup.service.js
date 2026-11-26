import { STORAGE_KEYS, readJson, writeJson, onStorageMutated } from './storage.service.js';
import { state, setActiveFormat, setActiveTheme, saveLang, savePlayerName, resetProfileFilters } from '../state/store.js';
import { MTG_FORMATS } from '../formats/formats.config.js';
import { MTG_THEMES } from '../theme/themes.config.js';
import { getAllMatches, replaceAllMatches, rebuildMatches } from '../data/matches.repository.js';
import {
  favoriteDecks,
  saveFavoriteDecks,
  deckStyles,
  saveDeckStyles,
  deckMeta,
  saveDeckMeta,
  registeredDecks,
  replaceRegisteredDecks
} from '../../shared/utils/deck-style.service.js';
import { todayIso } from '../../shared/utils/formatters.js';

export const BACKUP_SCHEMA_VERSION = 1;

let linkedFileHandle = null;
let autoSaveTimer = null;

export function getHubMeta() {
  const m = readJson(STORAGE_KEYS.HUB_META, {});
  return (m && typeof m === 'object') ? m : {};
}

export function updateHubMeta(patch) {
  const next = { ...getHubMeta(), ...patch };
  writeJson(STORAGE_KEYS.HUB_META, next, { silent: true });
  return next;
}

export function supportsFileLink() {
  return typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function';
}

export function getLinkedFileName() {
  return linkedFileHandle ? (linkedFileHandle.name || 'mtg-match-tracker-hub.json') : '';
}

export function buildBackupPayload() {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    app: 'mtg-match-tracker',
    exportedAt: new Date().toISOString(),
    preferences: {
      format: state.format,
      lang: state.lang,
      theme: state.theme || 'default',
      playerName: state.playerName || ''
    },
    matches: getAllMatches(),
    registeredDecks: registeredDecks.slice(),
    favorites: Array.from(favoriteDecks),
    deckStyles: { ...deckStyles },
    deckMeta: { ...deckMeta }
  };
}

export function exportBackupJson() {
  const payload = buildBackupPayload();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const nameSlug = (state.playerName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  a.download = nameSlug
    ? `mtg-match-tracker-backup-${nameSlug}-${todayIso()}.json`
    : `mtg-match-tracker-backup-${todayIso()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  updateHubMeta({ lastBackupAt: payload.exportedAt });
  return payload;
}

async function writeToLinkedHandle() {
  if (!linkedFileHandle) return false;
  try {
    const writable = await linkedFileHandle.createWritable();
    const payload = buildBackupPayload();
    await writable.write(JSON.stringify(payload, null, 2));
    await writable.close();
    updateHubMeta({ lastBackupAt: payload.exportedAt, lastLinkedFile: linkedFileHandle.name || '' });
    return true;
  } catch (_) {
    return false;
  }
}

export async function linkLocalBackupFile() {
  if (!supportsFileLink()) return { ok: false, reason: 'unsupported' };
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'mtg-match-tracker-hub.json',
      types: [{ description: 'MTG Match Tracker Backup (JSON)', accept: { 'application/json': ['.json'] } }]
    });
    linkedFileHandle = handle;
    const saved = await writeToLinkedHandle();
    return { ok: saved, name: handle.name || 'mtg-match-tracker-hub.json' };
  } catch (err) {
    if (err && err.name === 'AbortError') return { ok: false, reason: 'cancelled' };
    return { ok: false, reason: 'error' };
  }
}

export function unlinkLocalBackupFile() {
  linkedFileHandle = null;
}

export function initAutoFileSync() {
  onStorageMutated(() => {
    if (!linkedFileHandle) return;
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => { writeToLinkedHandle(); }, 250);
  });
}

export function importBackupJsonText(rawText) {
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (_) {
    return { ok: false, reason: 'invalid_json' };
  }
  if (!data || typeof data !== 'object' || !Array.isArray(data.matches)) {
    return { ok: false, reason: 'invalid_schema' };
  }

  replaceAllMatches(data.matches, { silent: true });

  if (Array.isArray(data.registeredDecks)) {
    replaceRegisteredDecks(data.registeredDecks);
  }

  if (Array.isArray(data.favorites)) {
    favoriteDecks.clear();
    data.favorites.forEach(d => { if (d) favoriteDecks.add(String(d)); });
    saveFavoriteDecks();
  }

  if (data.deckStyles && typeof data.deckStyles === 'object') {
    Object.keys(deckStyles).forEach(k => delete deckStyles[k]);
    Object.assign(deckStyles, data.deckStyles);
    saveDeckStyles();
  }

  if (data.deckMeta && typeof data.deckMeta === 'object') {
    Object.keys(deckMeta).forEach(k => delete deckMeta[k]);
    Object.assign(deckMeta, data.deckMeta);
    saveDeckMeta();
  }

  if (data.preferences && typeof data.preferences === 'object') {
    if (data.preferences.format && MTG_FORMATS.some(f => f.key === data.preferences.format)) {
      setActiveFormat(data.preferences.format);
    }
    if (data.preferences.lang === 'en' || data.preferences.lang === 'pt') {
      state.lang = data.preferences.lang;
      saveLang(data.preferences.lang);
    }
    if (typeof data.preferences.playerName === 'string') {
      savePlayerName(data.preferences.playerName);
    }
    if (data.preferences.theme && MTG_THEMES.some(t => t.key === data.preferences.theme)) {
      setActiveTheme(data.preferences.theme);
    }
  }

  resetProfileFilters();
  rebuildMatches();
  updateHubMeta({ lastImportAt: new Date().toISOString() });
  return { ok: true, count: data.matches.length };
}
