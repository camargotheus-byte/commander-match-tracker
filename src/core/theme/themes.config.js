import { STORAGE_KEYS, readString, writeString } from '../storage/storage.service.js';

export const MTG_THEMES = [
  {
    key: 'default',
    pt: 'Padrão (Laguna)',
    en: 'Default (Laguna)',
    descPt: 'Sun-Washed Laguna · Clássico',
    descEn: 'Sun-Washed Laguna · Classic',
    colors: [],
    swatches: ['#F1D27A', '#E2A64B', '#4A5530'],
    themeColor: '#F1D27A'
  },
  {
    key: 'azorius',
    pt: 'Azorius',
    en: 'Azorius',
    descPt: 'Branco · Azul (WU)',
    descEn: 'White · Blue (WU)',
    colors: ['W', 'U'],
    swatches: ['#9EC5E5', '#F4E4B6', '#1C3144'],
    themeColor: '#9EC5E5'
  },
  {
    key: 'dimir',
    pt: 'Dimir',
    en: 'Dimir',
    descPt: 'Azul · Preto (UB)',
    descEn: 'Blue · Black (UB)',
    colors: ['U', 'B'],
    swatches: ['#8EA4C4', '#3A4E6C', '#1B2333'],
    themeColor: '#8EA4C4'
  },
  {
    key: 'rakdos',
    pt: 'Rakdos',
    en: 'Rakdos',
    descPt: 'Preto · Vermelho (BR)',
    descEn: 'Black · Red (BR)',
    colors: ['B', 'R'],
    swatches: ['#E66E5E', '#47262B', '#2E1618'],
    themeColor: '#E66E5E'
  },
  {
    key: 'gruul',
    pt: 'Gruul',
    en: 'Gruul',
    descPt: 'Vermelho · Verde (RG)',
    descEn: 'Red · Green (RG)',
    colors: ['R', 'G'],
    swatches: ['#E5894B', '#8EB56B', '#322419'],
    themeColor: '#E5894B'
  },
  {
    key: 'selesnya',
    pt: 'Selesnya',
    en: 'Selesnya',
    descPt: 'Verde · Branco (WG)',
    descEn: 'Green · White (WG)',
    colors: ['W', 'G'],
    swatches: ['#A7CE86', '#F2E4B5', '#233824'],
    themeColor: '#A7CE86'
  },
  {
    key: 'orzhov',
    pt: 'Orzhov',
    en: 'Orzhov',
    descPt: 'Branco · Preto (WB)',
    descEn: 'White · Black (WB)',
    colors: ['W', 'B'],
    swatches: ['#D7C49E', '#4A4052', '#231E26'],
    themeColor: '#D7C49E'
  },
  {
    key: 'izzet',
    pt: 'Izzet',
    en: 'Izzet',
    descPt: 'Azul · Vermelho (UR)',
    descEn: 'Blue · Red (UR)',
    colors: ['U', 'R'],
    swatches: ['#6BA8E5', '#EC7755', '#1F2544'],
    themeColor: '#6BA8E5'
  },
  {
    key: 'golgari',
    pt: 'Golgari',
    en: 'Golgari',
    descPt: 'Preto · Verde (BG)',
    descEn: 'Black · Green (BG)',
    colors: ['B', 'G'],
    swatches: ['#8FB06A', '#48543C', '#222B1E'],
    themeColor: '#8FB06A'
  },
  {
    key: 'boros',
    pt: 'Boros',
    en: 'Boros',
    descPt: 'Vermelho · Branco (WR)',
    descEn: 'Red · White (WR)',
    colors: ['W', 'R'],
    swatches: ['#EE7B5C', '#F5D88E', '#3D1C19'],
    themeColor: '#EE7B5C'
  },
  {
    key: 'simic',
    pt: 'Simic',
    en: 'Simic',
    descPt: 'Verde · Azul (UG)',
    descEn: 'Green · Blue (UG)',
    colors: ['U', 'G'],
    swatches: ['#6EC2B5', '#9BD08F', '#173332'],
    themeColor: '#6EC2B5'
  }
];

export function getThemeDef(key) {
  return MTG_THEMES.find(t => t.key === key) || MTG_THEMES[0];
}

export function loadTheme() {
  const saved = readString(STORAGE_KEYS.THEME, 'default');
  return MTG_THEMES.some(t => t.key === saved) ? saved : 'default';
}

export function saveTheme(key) {
  const safe = MTG_THEMES.some(t => t.key === key) ? key : 'default';
  writeString(STORAGE_KEYS.THEME, safe);
}

export function applyTheme(key) {
  const def = getThemeDef(key);
  if (typeof document !== 'undefined' && document.body) {
    if (def.key === 'default') document.body.removeAttribute('data-theme');
    else document.body.setAttribute('data-theme', def.key);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', def.themeColor);
  }
  return def;
}
