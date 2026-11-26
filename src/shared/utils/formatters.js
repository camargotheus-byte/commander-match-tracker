import { isEn, monthShort } from '../../core/i18n/i18n.service.js';

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function fmtPct(v, decimals = 1) {
  const s = (v * 100).toFixed(decimals) + '%';
  return isEn() ? s : s.replace('.', ',');
}

export function fmtTurns(v, decimals = 1) {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  const raw = Number.isInteger(v) ? String(v) : v.toFixed(decimals);
  return (isEn() ? raw : raw.replace('.', ',')) + 't';
}

export function shortDeck(name, maxLen = 28) {
  const clean = String(name || '').replace(/\s*\((?:emprestado|borrowed)\)/i, '');
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 1) + '…';
}

export function wrClass(wr) {
  if (wr >= 0.55) return 'wr-high';
  if (wr >= 0.40) return 'wr-mid';
  return 'wr-low';
}

export function wrBarColor(wr) {
  if (wr >= 0.55) return '#C8CF7A';
  if (wr >= 0.40) return '#F1D27A';
  return '#D7653A';
}

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fmtDateBr(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function fmtDateDisp(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return isEn() ? `${m}/${d}/${y}` : `${d}/${m}/${y}`;
}

export function fmtShortDateBr(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [, m, d] = iso.split('-');
  return isEn() ? `${m}/${d}` : `${d}/${m}`;
}

export function parseDateToIso(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (m) {
    const y = m[3].length === 2 ? '20' + m[3] : m[3];
    return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return '';
}

export function matchDateLabel(m) {
  if (m.date) return fmtDateDisp(m.date);
  return `${monthShort(m.monthIdx) || m.month}/${m.year || '2026'}`;
}

export function sanitizeDeckUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(s)) return 'https://' + s;
  return '';
}

export function scryfallCardUrl(cardName) {
  const clean = String(cardName || '').replace(/\s*\((?:emprestado|borrowed)\)/gi, '').trim();
  if (!clean) return 'https://scryfall.com/';
  return `https://scryfall.com/search?q=${encodeURIComponent(`!"${clean}"`)}`;
}
