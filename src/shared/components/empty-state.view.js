import { state, getActiveFormat } from '../../core/state/store.js';
import { tr } from '../../core/i18n/i18n.service.js';
import { getMatches, getFormatMatches } from '../../core/data/matches.repository.js';
import { favoriteDecks } from '../utils/deck-style.service.js';
import { esc } from '../utils/formatters.js';

export function renderEmptyState() {
  const activeFmt = getActiveFormat();
  const matches = getMatches();
  if (matches.length === 0) {
    const cmdCount = getFormatMatches('commander').length;
    return `
      <div class="nb-card p-8 sm:p-10 text-center space-y-4 max-w-2xl mx-auto">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs badge-pop-purple">
          ${esc(activeFmt.badge)}
        </div>
        <div class="text-lg font-black">${esc(tr(`Nenhuma partida registrada em ${activeFmt.pt} ainda`, `No matches recorded in ${activeFmt.en} yet`))}</div>
        <p class="text-xs font-medium text-muted leading-relaxed max-w-md mx-auto">
          ${tr(
            `Cada formato funciona como um <strong>perfil independente</strong>: seus decks, oponentes, gráficos e histórico de <strong>${esc(activeFmt.pt)}</strong> ficam separados dos outros formatos.`,
            `Each format works as an <strong>independent profile</strong>: your decks, opponents, charts, and history for <strong>${esc(activeFmt.en)}</strong> stay separate from other formats.`
          )}
        </p>
        <div class="flex items-center justify-center gap-2.5 flex-wrap pt-1">
          <button data-tab="report" class="nb-btn nb-btn-yellow px-4 py-2 text-xs">
            ${esc(tr(`+ Reportar 1ª partida em ${activeFmt.pt}`, `+ Report 1st ${activeFmt.en} match`))}
          </button>
          ${activeFmt.key !== 'commander' && cmdCount > 0 ? `
            <button type="button" data-set-format="commander" class="nb-btn px-4 py-2 text-xs">
              ${esc(tr(`Voltar para Commander (${cmdCount})`, `Back to Commander (${cmdCount})`))}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
  const profileDecks = new Set(matches.map(m => m.deck));
  const favInProfile = Array.from(favoriteDecks).filter(d => profileDecks.has(d)).length;
  if (state.onlyFavorites && favInProfile === 0) {
    return `
      <div class="nb-card p-10 text-center space-y-3">
        <div class="text-base font-black">${tr('Nenhum deck favoritado ainda ★', 'No favorite decks yet ★')}</div>
        <p class="text-xs font-medium text-muted">${tr('Clique na estrela <strong>☆</strong> em qualquer pasta ou linha de deck para marcá-lo como favorito.', 'Click the <strong>☆</strong> star on any deck folder or table row to mark it as a favorite.')}</p>
        <button id="btn-empty-reset" class="nb-btn nb-btn-yellow px-4 py-2 text-xs">${tr('Voltar a mostrar todos os decks', 'Show all decks again')}</button>
      </div>
    `;
  }
  return `
    <div class="nb-card p-10 text-center space-y-3">
      <div class="text-base font-black">${tr('Nenhuma partida encontrada para esses filtros', 'No matches found for these filters')}</div>
      <p class="text-xs font-medium text-muted">${tr('Ajuste os filtros ou limpe a busca para voltar a ver os dados.', 'Adjust your filters or clear the search to see your data again.')}</p>
      <button id="btn-empty-reset" class="nb-btn nb-btn-yellow px-4 py-2 text-xs">${tr('Limpar todos os filtros', 'Clear all filters')}</button>
    </div>
  `;
}
