import { esc } from '../utils/formatters.js';

const TIP_HOVER_DELAY_MS = 1500;
const TIP_LONG_PRESS_MS = 500;
const TIP_INTERACTIVE_SEL = 'button, a, input, select, [data-jump-deck], [data-jump-rival], [data-click-month], [data-click-pod], [data-filter-ecmd], [data-heatmap-deck], [data-select-deck], [data-select-player]';

let tooltipEl = null;
let tipTarget = null;
let tipTimer = null;
let tipVisible = false;
let tipLastPos = { x: 0, y: 0 };
let touchTimer = null;
let touchStartPos = null;
let lastTouchTime = 0;
let suppressNextClick = false;
let initialized = false;

function positionTooltipAt(x, y) {
  if (!tooltipEl) return;
  const pad = 12;
  const rect = tooltipEl.getBoundingClientRect();
  let left = x + pad;
  let top = y + pad;
  if (left + rect.width > window.innerWidth - 8) left = x - rect.width - pad;
  if (top + rect.height > window.innerHeight - 8) top = y - rect.height - pad;
  tooltipEl.style.left = Math.max(8, left) + 'px';
  tooltipEl.style.top = Math.max(8, top) + 'px';
}

function showTooltipAt(x, y, html) {
  if (!tooltipEl) return;
  tooltipEl.innerHTML = html;
  tooltipEl.classList.remove('hidden');
  tipVisible = true;
  positionTooltipAt(x, y);
}

export function hideTooltip() {
  clearTimeout(tipTimer);
  clearTimeout(touchTimer);
  tipTimer = null;
  touchTimer = null;
  tipTarget = null;
  tipVisible = false;
  if (tooltipEl) tooltipEl.classList.add('hidden');
}

export function normalizeNativeTitles(rootEl = document) {
  rootEl.querySelectorAll('[title]').forEach(el => {
    const t = el.getAttribute('title');
    el.removeAttribute('title');
    if (t && !el.hasAttribute('data-tip')) {
      el.setAttribute('data-tip', esc(t));
    }
  });
}

function resolveTipTarget(node) {
  if (!node || !node.closest) return null;
  const el = node.closest('[data-tip], [title]');
  if (!el) return null;
  if (el.hasAttribute('title')) {
    const t = el.getAttribute('title');
    el.removeAttribute('title');
    if (t && !el.hasAttribute('data-tip')) el.setAttribute('data-tip', esc(t));
  }
  return el.hasAttribute('data-tip') ? el : null;
}

export function initTooltipSystem({ onEscape } = {}) {
  if (initialized) return;
  initialized = true;
  tooltipEl = document.getElementById('tooltip');

  document.addEventListener('mousemove', e => {
    if (Date.now() - lastTouchTime < 800) return;
    const target = resolveTipTarget(e.target);
    if (!target) {
      if (tipTarget || tipVisible) hideTooltip();
      return;
    }
    tipLastPos = { x: e.clientX, y: e.clientY };
    if (target !== tipTarget) {
      clearTimeout(tipTimer);
      if (tooltipEl) tooltipEl.classList.add('hidden');
      tipVisible = false;
      tipTarget = target;
      tipTimer = setTimeout(() => {
        if (tipTarget === target && document.contains(target)) {
          showTooltipAt(tipLastPos.x, tipLastPos.y, target.getAttribute('data-tip'));
        }
      }, TIP_HOVER_DELAY_MS);
    } else if (tipVisible) {
      positionTooltipAt(e.clientX, e.clientY);
    }
  });

  document.addEventListener('mouseleave', hideTooltip);
  document.addEventListener('mousedown', hideTooltip);
  window.addEventListener('scroll', hideTooltip, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      hideTooltip();
      if (typeof onEscape === 'function') onEscape();
    }
  });

  document.addEventListener('touchstart', e => {
    lastTouchTime = Date.now();
    clearTimeout(touchTimer);
    const t = e.touches[0];
    touchStartPos = { x: t.clientX, y: t.clientY };
    const target = resolveTipTarget(e.target);
    if (!target) {
      if (tipVisible) hideTooltip();
      return;
    }
    const isInteractive = Boolean(target.closest(TIP_INTERACTIVE_SEL));
    if (!isInteractive) {
      if (tipVisible && tipTarget === target) {
        hideTooltip();
      } else {
        hideTooltip();
        tipTarget = target;
        showTooltipAt(t.clientX, t.clientY, target.getAttribute('data-tip'));
      }
    } else {
      touchTimer = setTimeout(() => {
        tipTarget = target;
        suppressNextClick = true;
        showTooltipAt(touchStartPos.x, touchStartPos.y, target.getAttribute('data-tip'));
      }, TIP_LONG_PRESS_MS);
    }
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!touchStartPos) return;
    const t = e.touches[0];
    if (Math.hypot(t.clientX - touchStartPos.x, t.clientY - touchStartPos.y) > 10) {
      clearTimeout(touchTimer);
      touchTimer = null;
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    lastTouchTime = Date.now();
    clearTimeout(touchTimer);
    touchTimer = null;
  }, { passive: true });

  document.addEventListener('click', e => {
    if (suppressNextClick) {
      suppressNextClick = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
}
