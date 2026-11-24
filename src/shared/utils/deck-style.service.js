import { STORAGE_KEYS, readJson, writeJson } from '../../core/storage/storage.service.js';
import { isEn, tr } from '../../core/i18n/i18n.service.js';
import { ICONS, PALETTE_OPTIONS, LEGACY_PALETTE_MAP } from '../constants/icons.js';
import {
  MANA_ORDER,
  DECK_COLOR_IDENTITY,
  ENEMY_CMD_COLOR_IDENTITY,
  CMD_COLOR_LOWER_LOOKUP,
  COLOR_COMBO_NAMES
} from '../constants/mana-identity.data.js';

// Favorites
const loadedFavs = readJson(STORAGE_KEYS.FAVORITE_DECKS, []);
export const favoriteDecks = new Set(Array.isArray(loadedFavs) ? loadedFavs : []);

export function saveFavoriteDecks() {
  writeJson(STORAGE_KEYS.FAVORITE_DECKS, Array.from(favoriteDecks));
}

export function isFavDeck(name) {
  return favoriteDecks.has(name);
}

export function toggleFavoriteDeck(name) {
  if (favoriteDecks.has(name)) {
    favoriteDecks.delete(name);
    saveFavoriteDecks();
    return false;
  }
  favoriteDecks.add(name);
  saveFavoriteDecks();
  return true;
}

// Custom Deck Styles (Icon & Accent)
const loadedStyles = readJson(STORAGE_KEYS.DECK_STYLES, {});
export const deckStyles = (loadedStyles && typeof loadedStyles === 'object') ? loadedStyles : {};

export function saveDeckStyles() {
  writeJson(STORAGE_KEYS.DECK_STYLES, deckStyles);
}

// Deck Metadata (Commander, Partner, Custom Colors, Decklist URL, Last Update)
const loadedMeta = readJson(STORAGE_KEYS.DECK_META, {});
export const deckMeta = (loadedMeta && typeof loadedMeta === 'object') ? loadedMeta : {};

export function saveDeckMeta() {
  writeJson(STORAGE_KEYS.DECK_META, deckMeta);
}

export function getDeckCommanderInfo(deckName) {
  const clean = String(deckName || '').replace(/\s*\(emprestado\)/i, '').trim();
  const autoParts = clean.split(/\s*\/\/\s*/).filter(Boolean);
  const autoPartner = autoParts.length >= 2;
  const autoCmd1 = autoParts[0] || clean;
  const autoCmd2 = autoPartner ? autoParts.slice(1).join(' // ') : '';
  const m = deckMeta[deckName];
  if (m && m.cmdCustom) {
    const partner = Boolean(m.partner);
    const cmd1 = (m.cmd1 || '').trim() || autoCmd1;
    const cmd2 = partner ? (m.cmd2 || '').trim() : '';
    return { partner, cmd1, cmd2, isCustom: true };
  }
  return { partner: autoPartner, cmd1: autoCmd1, cmd2: autoCmd2, isCustom: false };
}

export function pruneDeckMetaEntry(dk) {
  const m = deckMeta[dk];
  if (!m) return;
  if (!m.url && !m.lastUpdated && !m.note && !m.cmdCustom && !m.colorsCustom) {
    delete deckMeta[dk];
  }
}

export function deckDisplayName(name) {
  const raw = String(name || '');
  const borrowed = /\(emprestado\)/i.test(raw);
  const info = getDeckCommanderInfo(raw);
  const base = info ? (info.partner && info.cmd2 ? `${info.cmd1} // ${info.cmd2}` : info.cmd1) : raw.replace(/\s*\(emprestado\)/i, '').trim();
  if (!borrowed) return base;
  return `${base} ${isEn() ? '(borrowed)' : '(emprestado)'}`;
}

export function getDeckColorIdentity(deckName) {
  const m = deckMeta[deckName];
  if (m && m.colorsCustom && Array.isArray(m.colors)) {
    return MANA_ORDER.filter(c => m.colors.includes(c));
  }
  const clean = String(deckName || '').replace(/\s*\((?:emprestado|borrowed)\)/gi, '').trim();
  const base = DECK_COLOR_IDENTITY[clean] || [];
  return MANA_ORDER.filter(c => base.includes(c));
}

export function getEnemyCmdColorIdentity(cmdName) {
  const clean = String(cmdName || '').trim();
  if (!clean) return null;
  if (Object.prototype.hasOwnProperty.call(ENEMY_CMD_COLOR_IDENTITY, clean)) {
    return MANA_ORDER.filter(c => ENEMY_CMD_COLOR_IDENTITY[clean].includes(c));
  }
  if (Object.prototype.hasOwnProperty.call(DECK_COLOR_IDENTITY, clean)) {
    return MANA_ORDER.filter(c => DECK_COLOR_IDENTITY[clean].includes(c));
  }
  const low = clean.toLowerCase();
  if (CMD_COLOR_LOWER_LOOKUP.has(low)) {
    const arr = CMD_COLOR_LOWER_LOOKUP.get(low);
    return MANA_ORDER.filter(c => arr.includes(c));
  }
  return null;
}

export function getColorComboLabel(colors) {
  if (!Array.isArray(colors)) return '';
  if (!colors.length) return tr('Incolor', 'Colorless');
  const key = MANA_ORDER.filter(c => colors.includes(c)).join('');
  const entry = COLOR_COMBO_NAMES[key];
  return entry ? (isEn() ? entry[1] : entry[0]) : key;
}

export function autoDeckAccent(d) {
  if (d.borrowed) return { color: '#DCCBAE', ink: '#4E3626', iconKey: 'folder', icon: ICONS.folder };
  if (d.wr === 1 && d.games >= 3) return { color: '#4A5530', ink: '#F3ECE0', iconKey: 'crown', icon: ICONS.crown };
  if (d.wr >= 0.7) return { color: '#C8CF7A', ink: '#4E3626', iconKey: 'bolt', icon: ICONS.bolt };
  if (d.wr >= 0.55) return { color: '#F1D27A', ink: '#4E3626', iconKey: 'star', icon: ICONS.star };
  if (d.wr >= 0.45) return { color: '#E2A64B', ink: '#4E3626', iconKey: 'book', icon: ICONS.book };
  return { color: '#D7653A', ink: '#FCF8F0', iconKey: 'heart', icon: ICONS.heart };
}

export function deckAccent(d) {
  const base = autoDeckAccent(d);
  const custom = deckStyles[d.deck];
  if (!custom) return { ...base, customIcon: false, customColor: false };
  let color = base.color, ink = base.ink, customColor = false;
  if (custom.color) {
    const mappedKey = LEGACY_PALETTE_MAP[custom.color] || custom.color;
    const pal = PALETTE_OPTIONS.find(p => p.key === mappedKey);
    if (pal) { color = pal.color; ink = pal.ink; customColor = true; }
  }
  let icon = base.icon, iconKey = base.iconKey, customIcon = false;
  if (custom.icon && ICONS[custom.icon]) {
    icon = ICONS[custom.icon];
    iconKey = custom.icon;
    customIcon = true;
  }
  return { color, ink, icon, iconKey, customIcon, customColor };
}
