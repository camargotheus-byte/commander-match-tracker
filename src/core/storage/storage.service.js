/**
 * Centralized persistence adapter.
 * Currently backed by localStorage (plus optional File System Access auto-sync
 * via backup.service.js). Structured as a single module so future native app
 * targets (Capacitor SQLite / Supabase / GitHub API) can swap storage cleanly
 * without touching any feature module.
 */

export const STORAGE_KEYS = Object.freeze({
  LANG: 'cmt_lang_v1',
  THEME: 'cmt_theme_v1',
  PLAYER_NAME: 'cmt_player_name_v1',
  FORMAT: 'cmt_format_v1',
  HUB_MATCHES: 'cmt_hub_matches_v1',
  HUB_META: 'cmt_hub_meta_v1',
  PENDING_REPORTS: 'cmt_pending_reports_v1',
  FAVORITE_DECKS: 'cmt_favorite_decks_v1',
  DECK_STYLES: 'cmt_deck_styles_v1',
  DECK_META: 'cmt_deck_meta_v1',
  REGISTERED_DECKS: 'cmt_registered_decks_v1'
});

const mutationListeners = new Set();

export function onStorageMutated(fn) {
  if (typeof fn === 'function') mutationListeners.add(fn);
  return () => mutationListeners.delete(fn);
}

function notifyMutation(key) {
  if (key === STORAGE_KEYS.HUB_META) return;
  mutationListeners.forEach(fn => {
    try { fn(key); } catch (_) {}
  });
}

export function readString(key, fallback = '') {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch (_) {
    return fallback;
  }
}

export function writeString(key, value, { silent = false } = {}) {
  try {
    localStorage.setItem(key, String(value));
    if (!silent) notifyMutation(key);
  } catch (_) {}
}

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

export function writeJson(key, value, { silent = false } = {}) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (!silent) notifyMutation(key);
  } catch (_) {}
}

export function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch (_) {}
}
