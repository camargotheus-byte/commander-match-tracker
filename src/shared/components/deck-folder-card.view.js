import { tr, fmtRecord, resCodeDisp } from '../../core/i18n/i18n.service.js';
import { deckAccent, isFavDeck, deckDisplayName, getDeckCommanderInfo } from '../utils/deck-style.service.js';
import { getDeckBadges, renderBadgesHtml } from './badges.view.js';
import { esc, fmtPct, wrClass } from '../utils/formatters.js';

export function renderDeckFolderCard(d, isSelected = false, mode = 'select', opts = {}) {
  const acc = deckAccent(d);
  const fav = isFavDeck(d.deck);
  const badges = getDeckBadges(d, opts);
  const attr = mode === 'jump' ? `data-jump-deck="${esc(d.deck)}"` : `data-select-deck="${esc(d.deck)}"`;
  const displayName = deckDisplayName(d.deck).replace(/\s*\((?:emprestado|borrowed)\)/i, '');
  const cmdInfo = getDeckCommanderInfo(d.deck);
  const cmdLabel = cmdInfo.partner && cmdInfo.cmd2 ? `${cmdInfo.cmd1} // ${cmdInfo.cmd2}` : cmdInfo.cmd1;
  const showCmdSub = Boolean(cmdLabel && cmdLabel.toLowerCase() !== displayName.toLowerCase());

  const footerRight = d.games === 0
    ? `<span class="text-xs font-bold text-muted">${tr('Sem partidas ainda', 'No matches yet')}</span>`
    : (opts.showWeighted
        ? `<span class="px-1.5 py-0.2 rounded text-xs badge-pop-yellow tabular-nums" data-tip="${esc(tr(`Score Ponderado (Wilson 90%): ${fmtPct(d.wilson)}. Estima o limite inferior confiável do win rate combinando ${fmtPct(d.wr)} com o volume de ${d.games} jogo(s).`, `Weighted Score (Wilson 90%): ${fmtPct(d.wilson)}. Estimates the reliable win-rate floor combining ${fmtPct(d.wr)} across ${d.games} game(s).`))}">Score ${fmtPct(d.wilson)}</span>`
        : `<span class="text-xs font-bold text-muted tabular-nums" data-tip="${esc(tr(`Probabilidade de vitória base (${fmtPct(d.expWr)}) calculada pelo tamanho das mesas jogadas com este deck.`, `Base win probability (${fmtPct(d.expWr)}) based on the pod sizes played with this deck.`))}">${tr('Prob.', 'Prob.')} ${fmtPct(d.expWr, 0)}</span>`);
  const favLabel = fav ? tr('Remover dos favoritos', 'Remove from favorites') : tr('Favoritar deck', 'Favorite deck');
  return `
    <div ${attr} class="nb-folder nb-folder-clickable">
      <div class="nb-folder-tab" style="background:${acc.color}"></div>
      <div class="nb-folder-body p-3.5 flex flex-col justify-between gap-2.5 ${isSelected ? 'ring-2 ring-[#F1D27A] bg-[#F6EDD6]' : ''}">
        <div class="flex items-start gap-3">
          <div class="nb-icon-box" style="background:${acc.color}; color:${acc.ink || '#4E3626'}">${acc.icon}</div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-1.5">
              <span class="text-xs font-bold text-muted tabular-nums">${d.games} ${tr(d.games === 1 ? 'jogo' : 'jogos', d.games === 1 ? 'game' : 'games')}</span>
              <button data-toggle-fav="${esc(d.deck)}" data-tip="${esc(favLabel)}" aria-label="${esc(favLabel)}"
                class="w-6 h-6 rounded-md border-[1.5px] border-[#4E3626] inline-flex items-center justify-center text-xs font-black shrink-0 cursor-pointer transition-transform hover:scale-105 ${fav ? 'bg-[#F1D27A] text-[#4E3626] shadow-[1px_1px_0_#4E3626]' : 'bg-[#F3ECE0] text-[#745A46] hover:bg-[#F1D27A] hover:text-[#4E3626]'}">
                ${fav ? '★' : '☆'}
              </button>
            </div>
            <div class="flex items-baseline gap-2 mt-0.5">
              ${d.games > 0 ? `
                <span class="text-lg font-black tabular-nums ${wrClass(d.wr)}">${fmtPct(d.wr)}</span>
                <span class="text-xs font-bold text-muted tabular-nums">${fmtRecord(d.w, d.l, d.d)}</span>
              ` : `
                <span class="text-lg font-black tabular-nums text-muted">—</span>
                <span class="text-xs font-bold text-muted">${tr('Pronto p/ estrear', 'Ready to play')}</span>
              `}
            </div>
          </div>
        </div>

        ${badges.length ? `<div class="flex items-center gap-1 flex-wrap">${renderBadgesHtml(badges)}</div>` : ''}

        <div class="space-y-2">
          <div>
            <div class="font-extrabold text-sm leading-snug" title="${esc(displayName)}">
              ${esc(displayName)}
            </div>
            ${showCmdSub ? `<div class="text-xs font-semibold text-muted truncate mt-0.5">★ ${esc(cmdLabel)}</div>` : ''}
          </div>
          <div class="flex items-center justify-between gap-2 pt-2 border-t-2 border-[#DCCBAE]">
            <div class="flex items-center gap-1">
              ${d.recent.length
                ? d.recent.map(r => `<span class="inline-flex items-center justify-center w-5 h-5 rounded text-xs ${r === 'V' ? 'badge-win' : (r === 'D' ? 'badge-loss' : 'badge-draw')}">${resCodeDisp(r)}</span>`).join('')
                : `<span class="text-xs font-semibold text-muted">${tr('0 partidas', '0 games')}</span>`}
            </div>
            ${footerRight}
          </div>
        </div>
      </div>
    </div>
  `;
}
