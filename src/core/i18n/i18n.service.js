import { state } from '../state/store.js';

export const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTHS_SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const isEn = () => state.lang === 'en';
export const tr = (pt, en) => (state.lang === 'en' ? en : pt);
export const monthName = idx => (isEn() ? MONTHS_EN[idx] : MONTHS[idx]) || '';
export const monthShort = idx => (isEn() ? MONTHS_SHORT_EN[idx] : MONTHS_SHORT[idx]) || '';
export const resLabelOf = res => (res === 'V' ? tr('Vitória', 'Win') : (res === 'D' ? tr('Derrota', 'Loss') : tr('Empate', 'Draw')));
export const resCodeDisp = res => (isEn() ? (res === 'V' ? 'W' : (res === 'D' ? 'L' : 'D')) : res);
export const fmtRecord = (w, l, d) => (isEn() ? `${w}W–${l}L${d ? `–${d}D` : ''}` : `${w}V–${l}D${d ? `–${d}E` : ''}`);

export const fmtNum = (n, decimals = 1) => {
  const s = Number(n).toFixed(decimals);
  return isEn() ? s : s.replace('.', ',');
};

export const ordemDisplay = ord => {
  if (!ord) return '';
  if (!isEn()) return ord;
  return ord
    .replace(/^1º a jogar$/i, '1st to play')
    .replace(/^2º a jogar$/i, '2nd to play')
    .replace(/^3º a jogar$/i, '3rd to play')
    .replace(/^4º a jogar$/i, '4th to play');
};

export const oppDisplayStr = str => {
  if (!isEn()) return str;
  return String(str || '')
    .replace(/\bVENCEDOR\b/g, 'WINNER')
    .replace(/\bVencedor\b/g, 'Winner')
    .replace(/\(emprestado\)/gi, '(borrowed)');
};
