import { tr } from '../../core/i18n/i18n.service.js';
import { esc } from '../utils/formatters.js';

export function wrapHScroll(innerHtml) {
  return `
    <div class="hscroll-shell relative min-w-0">
      <div class="hscroll-bar hidden items-center gap-2.5 px-3 py-1.5 bg-[#F3ECE0] border-b-2 border-[#DCCBAE] select-none">
        <span class="text-xs font-extrabold text-muted shrink-0">${tr('← Arraste →', '← Swipe →')}</span>
        <div class="hscroll-track relative flex-1 h-2.5 rounded-full bg-[#FCF8F0] border border-[#4E3626] overflow-hidden cursor-pointer" data-tip="${esc(tr('Toque ou arraste para rolar a tabela horizontalmente.', 'Tap or drag to scroll the table horizontally.'))}">
          <div class="hscroll-thumb absolute top-0 bottom-0 left-0 rounded-full bg-[#4E3626]"></div>
        </div>
      </div>
      <div class="relative min-w-0">
        <div class="hscroll-viewport overflow-x-auto scroll-thin">${innerHtml}</div>
        <div class="hscroll-fade-right pointer-events-none hidden absolute top-0 right-0 bottom-0 w-7"></div>
      </div>
    </div>
  `;
}

function updateSingleHScroll(shell) {
  const vp = shell.querySelector('.hscroll-viewport');
  const bar = shell.querySelector('.hscroll-bar');
  const thumb = shell.querySelector('.hscroll-thumb');
  const fade = shell.querySelector('.hscroll-fade-right');
  if (!vp || !bar || !thumb) return;
  const maxScroll = vp.scrollWidth - vp.clientWidth;
  if (maxScroll <= 6) {
    bar.classList.add('hidden');
    bar.classList.remove('flex');
    if (fade) fade.classList.add('hidden');
    return;
  }
  bar.classList.remove('hidden');
  bar.classList.add('flex');
  const ratio = vp.clientWidth / vp.scrollWidth;
  const thumbW = Math.max(18, ratio * 100);
  const progress = maxScroll > 0 ? vp.scrollLeft / maxScroll : 0;
  thumb.style.width = thumbW.toFixed(1) + '%';
  thumb.style.left = (progress * (100 - thumbW)).toFixed(1) + '%';
  if (fade) {
    fade.classList.toggle('hidden', vp.scrollLeft >= maxScroll - 6);
  }
}

export function initTableScrollbars() {
  document.querySelectorAll('.hscroll-shell').forEach(shell => {
    const vp = shell.querySelector('.hscroll-viewport');
    const track = shell.querySelector('.hscroll-track');
    if (!vp) return;
    if (!vp.dataset.hscrollBound) {
      vp.dataset.hscrollBound = '1';
      vp.addEventListener('scroll', () => updateSingleHScroll(shell), { passive: true });
      if (track) {
        const scrollToClientX = clientX => {
          const rect = track.getBoundingClientRect();
          const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
          vp.scrollLeft = pct * (vp.scrollWidth - vp.clientWidth);
        };
        track.addEventListener('click', e => scrollToClientX(e.clientX));
        let dragging = false;
        track.addEventListener('pointerdown', e => {
          dragging = true;
          if (track.setPointerCapture) track.setPointerCapture(e.pointerId);
          scrollToClientX(e.clientX);
        });
        track.addEventListener('pointermove', e => { if (dragging) scrollToClientX(e.clientX); });
        track.addEventListener('pointerup', () => { dragging = false; });
        track.addEventListener('pointercancel', () => { dragging = false; });
      }
    }
    updateSingleHScroll(shell);
  });
}
