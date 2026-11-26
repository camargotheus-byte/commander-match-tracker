import { tr } from '../../core/i18n/i18n.service.js';
import { esc } from '../utils/formatters.js';

let toastTimer = null;

export function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  const dot = type === 'error' ? '#D7653A' : '#C8CF7A';
  el.innerHTML = `<span class="w-2.5 h-2.5 rounded-full border border-[#4E3626] inline-block" style="background:${dot}"></span><span>${esc(msg)}</span>`;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3200);
}

function fallbackCopy(text, successMsg) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast(successMsg);
  } catch (_) {
    showToast(tr('Selecione e copie o texto da prévia manualmente.', 'Select and copy the preview text manually.'), 'error');
  }
  ta.remove();
}

export function copyTextToClipboard(text, successMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast(successMsg)).catch(() => fallbackCopy(text, successMsg));
  } else {
    fallbackCopy(text, successMsg);
  }
}
