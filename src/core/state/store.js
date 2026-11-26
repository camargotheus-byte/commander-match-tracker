import { STORAGE_KEYS, readString, writeString } from '../storage/storage.service.js';
import { getFormatDef, loadFormat, saveFormat } from '../formats/formats.config.js';
import { loadTheme, saveTheme, applyTheme } from '../theme/themes.config.js';

const DEFAULT_LANG = 'pt';

function loadLang() {
  const raw = readString(STORAGE_KEYS.LANG, DEFAULT_LANG);
  return (raw === 'en' || raw === 'pt') ? raw : DEFAULT_LANG;
}

export function saveLang(lang) {
  writeString(STORAGE_KEYS.LANG, lang);
}

function loadPlayerName() {
  return readString(STORAGE_KEYS.PLAYER_NAME, '').trim();
}

export function savePlayerName(name) {
  const clean = String(name || '').trim().slice(0, 40);
  state.playerName = clean;
  writeString(STORAGE_KEYS.PLAYER_NAME, clean);
  return clean;
}

function todayIsoLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export let activeFormatKey = loadFormat();

export function getActiveFormat() {
  return getFormatDef(activeFormatKey);
}

export function setActiveFormat(nextKey) {
  activeFormatKey = nextKey;
  state.format = nextKey;
  saveFormat(nextKey);
}

export function setActiveTheme(nextKey) {
  const def = applyTheme(nextKey);
  state.theme = def.key;
  saveTheme(def.key);
  return def;
}

export const state = {
  lang: loadLang(),
  langMenuOpen: false,
  theme: loadTheme(),
  themeMenuOpen: false,
  playerName: loadPlayerName(),
  editingPlayerName: false,
  format: activeFormatKey,
  formatMenuOpen: false,
  dataHubOpen: false,
  confirmResetHub: false,
  tab: 'overview',
  showFilters: false,
  onlyFavorites: false,
  quickSearch: '',
  month: 'all',
  deck: 'all',
  player: 'all',
  pod: 'all',
  origin: 'all',
  enemyCmdFilter: '',
  // Overview tab controls
  monthlyChartMode: 'wr',
  // Decks tab controls
  deckView: 'cards',
  deckMinGames: 0,
  deckSort: 'games',
  deckSearch: '',
  selectedDeck: null,
  showDeckCustomizer: false,
  showDeckMetaEditor: false,
  showDeckCmdEditor: false,
  showDeckRenameEditor: false,
  cmdDraft: null,
  showNewDeckForm: false,
  newDeckDraft: null,
  // Opponents tab controls
  oppSubTab: 'players',
  oppSearch: '',
  selectedPlayer: null,
  // History tab controls
  histSearch: '',
  histRes: 'all',
  histOrder: 'desc',
  editingMatchId: null,
  confirmDeleteMatchId: null,
  // Report tab form state
  report: {
    date: todayIsoLocal(),
    monthIdx: new Date().getMonth(),
    year: String(new Date().getFullYear()),
    deck: '',
    borrowed: false,
    res: 'V',
    ordem: '',
    turns: '',
    opponents: Array.from({ length: getFormatDef(activeFormatKey).defaultOpps || 3 }, () => ({ cmd: '', player: '', winner: false })),
    notes: '',
    showPasteBox: false,
    pasteText: ''
  }
};

export function resetProfileFilters() {
  state.month = 'all';
  state.deck = 'all';
  state.player = 'all';
  state.pod = 'all';
  state.origin = 'all';
  state.onlyFavorites = false;
  state.quickSearch = '';
  state.enemyCmdFilter = '';
  state.selectedDeck = null;
  state.selectedPlayer = null;
  state.showDeckCustomizer = false;
  state.showDeckMetaEditor = false;
  state.showDeckCmdEditor = false;
  state.showDeckRenameEditor = false;
  state.cmdDraft = null;
  state.showNewDeckForm = false;
  state.newDeckDraft = null;
  state.deckSearch = '';
  state.oppSearch = '';
  state.histSearch = '';
  state.histRes = 'all';
}
