import { isEn, tr } from '../../core/i18n/i18n.service.js';
import { MANA_DEFS, COLORLESS_DEF } from '../constants/mana-identity.data.js';
import { getColorComboLabel } from '../utils/deck-style.service.js';
import { esc } from '../utils/formatters.js';

export function renderManaIdentityHtml(colors, opts = {}) {
  if (!Array.isArray(colors)) return '';
  const isSm = opts.size === 'sm';
  const boxCls = isSm
    ? 'w-5 h-5 rounded-full border-[1.5px] border-[#4E3626] shadow-[1px_1px_0_#4E3626] inline-flex items-center justify-center shrink-0'
    : 'w-6 h-6 rounded-full border-[1.5px] border-[#4E3626] shadow-[1.5px_1.5px_0_#4E3626] inline-flex items-center justify-center shrink-0';
  const scaleSvg = s => (isSm ? s.replace(/width="13" height="13"/g, 'width="11" height="11"') : s);

  if (!colors.length) {
    if (!opts.showColorless) return '';
    const lbl = isEn() ? COLORLESS_DEF.en : COLORLESS_DEF.pt;
    return `
      <div class="inline-flex items-center gap-1 flex-nowrap" data-tip="${esc(tr('Identidade de cor: Incolor (C)', 'Color identity: Colorless (C)'))}">
        <span class="${boxCls}" style="background:${COLORLESS_DEF.bg}; color:${COLORLESS_DEF.fg};" data-tip="${esc(lbl)}" aria-label="${esc(lbl)}">
          ${scaleSvg(COLORLESS_DEF.svg)}
        </span>
      </div>
    `;
  }
  const combo = getColorComboLabel(colors);
  return `
    <div class="inline-flex items-center ${isSm ? 'gap-0.5 flex-nowrap' : 'gap-1 flex-wrap'}" data-tip="${esc(tr(`Identidade de cor: ${combo} (${colors.join('')})`, `Color identity: ${combo} (${colors.join('')})`))}">
      ${colors.map(code => {
        const def = MANA_DEFS[code];
        if (!def) return '';
        return `
          <span class="${boxCls}"
            style="background:${def.bg}; color:${def.fg};"
            data-tip="${esc(isEn() ? def.en : def.pt)}" aria-label="${esc(isEn() ? def.en : def.pt)}">
            ${scaleSvg(def.svg)}
          </span>
        `;
      }).join('')}
    </div>
  `;
}
