import { state } from '../../core/state/store.js';
import { tr, resLabelOf, resCodeDisp, ordemDisplay, oppDisplayStr } from '../../core/i18n/i18n.service.js';
import { deckDisplayName } from '../../shared/utils/deck-style.service.js';
import { esc, matchDateLabel } from '../../shared/utils/formatters.js';
import { renderEmptyState } from '../../shared/components/empty-state.view.js';
import { wrapHScroll } from '../../shared/components/hscroll-table.js';
import { filterHistoryMatches } from './history.service.js';

export function renderHistory(filtered) {
  const list = filterHistoryMatches(filtered);

  return `
    <div class="nb-card-sm p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div class="flex items-center gap-2 flex-wrap flex-1">
        <input id="hist-search" type="search" value="${esc(state.histSearch)}" placeholder="${esc(tr('Filtrar no histórico...', 'Filter match history...'))}" class="px-3 py-1.5 text-xs flex-1 min-w-[200px]" />
        <div class="flex items-center gap-1">
          ${[{ k: 'all', l: tr('Todos', 'All') }, { k: 'V', l: tr('Vitórias', 'Wins') }, { k: 'D', l: tr('Derrotas', 'Losses') }, { k: 'E', l: tr('Empates', 'Draws') }].map(x => `
            <button data-hist-res="${x.k}" class="nb-pill px-2.5 py-1.5 text-xs ${state.histRes === x.k ? 'nb-pill-active' : ''}">${x.l}</button>
          `).join('')}
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <button id="btn-hist-order" class="nb-btn px-3 py-1.5 text-xs">${state.histOrder === 'desc' ? tr('↓ Recentes', '↓ Latest') : tr('↑ Cronológica', '↑ Chronological')}</button>
        <button id="btn-export-csv" class="nb-btn nb-btn-yellow px-3 py-1.5 text-xs">${tr('Exportar CSV', 'Export CSV')} (${list.length})</button>
      </div>
    </div>

    ${list.length ? `
      <div class="nb-card overflow-hidden min-w-0">
        ${wrapHScroll(`
          <table class="w-full min-w-[740px] text-xs text-left border-collapse">
            <thead>
              <tr class="border-b-2 border-[#4E3626] bg-[#F1D27A]">
                <th class="py-2.5 px-3 font-black w-28 whitespace-nowrap">${tr('ID / Data', 'ID / Date')}</th>
                <th class="py-2.5 px-3 font-black min-w-[190px] whitespace-nowrap">${tr('Meu Deck', 'My Deck')}</th>
                <th class="py-2.5 px-2 font-black text-center w-16 whitespace-nowrap">${tr('Mesa', 'Pod')}</th>
                <th class="py-2.5 px-2 font-black text-center w-16 whitespace-nowrap" data-tip="${esc(tr('Duração total da partida em turnos (quando informada).', 'Total match duration in turns (when recorded).'))}">${tr('Turnos', 'Turns')}</th>
                <th class="py-2.5 px-2 font-black text-center w-24 whitespace-nowrap">${tr('Resultado', 'Result')}</th>
                <th class="py-2.5 px-3 font-black whitespace-nowrap">${tr('Oponentes &amp; Notas', 'Opponents &amp; Notes')}</th>
                <th class="py-2.5 px-2.5 font-black text-right w-20 whitespace-nowrap">${tr('Ações', 'Actions')}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#DCCBAE]">
              ${list.map(m => {
                const isEditing = state.editingMatchId === m.id;
                const isConfirmDel = state.confirmDeleteMatchId === m.id;
                if (isEditing) {
                  return `
                    <tr class="bg-[#F6EDD6] align-top">
                      <td colspan="7" class="p-3.5">
                        <div class="space-y-3">
                          <div class="flex items-center justify-between gap-2 flex-wrap">
                            <span class="font-black text-xs">${tr(`Editando partida ${m.id}`, `Editing match ${m.id}`)}</span>
                            <div class="flex items-center gap-1.5">
                              <button type="button" data-hist-cancel-edit="1" class="nb-btn px-2.5 py-1 text-xs">${tr('Cancelar', 'Cancel')}</button>
                              <button type="button" data-hist-save-edit="${esc(m.id)}" class="nb-btn nb-btn-yellow px-3 py-1 text-xs">${tr('Salvar alterações', 'Save changes')}</button>
                            </div>
                          </div>
                          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                            <div class="sm:col-span-3">
                              <label class="block text-xs font-bold mb-1">${tr('Data', 'Date')}</label>
                              <input id="hist-edit-date" type="date" value="${esc(m.date || '')}" class="w-full px-2 py-1.5 text-xs" />
                            </div>
                            <div class="sm:col-span-3">
                              <label class="block text-xs font-bold mb-1">${tr('Resultado', 'Result')}</label>
                              <select id="hist-edit-res" class="w-full px-2 py-1.5 text-xs">
                                <option value="V" ${m.res === 'V' ? 'selected' : ''}>${tr('Vitória', 'Win')} (${resCodeDisp('V')})</option>
                                <option value="D" ${m.res === 'D' ? 'selected' : ''}>${tr('Derrota', 'Loss')} (${resCodeDisp('D')})</option>
                                <option value="E" ${m.res === 'E' ? 'selected' : ''}>${tr('Empate', 'Draw')} (${resCodeDisp('E')})</option>
                              </select>
                            </div>
                            <div class="sm:col-span-2">
                              <label class="block text-xs font-bold mb-1">${tr('Turnos', 'Turns')}</label>
                              <input id="hist-edit-turns" type="number" min="1" max="99" value="${esc(m.turns || '')}" placeholder="—" class="w-full px-2 py-1.5 text-xs tabular-nums" />
                            </div>
                            <div class="sm:col-span-4">
                              <label class="block text-xs font-bold mb-1">${tr('Ordem de Jogada', 'Turn Order')}</label>
                              <select id="hist-edit-ordem" class="w-full px-2 py-1.5 text-xs">
                                ${['', '1º a jogar', '2º a jogar', '3º a jogar', '4º a jogar'].map(ord => `
                                  <option value="${esc(ord)}" ${m.ordem === ord ? 'selected' : ''}>${ord ? ordemDisplay(ord) : tr('Não informada', 'Not set')}</option>
                                `).join('')}
                              </select>
                            </div>
                            <div class="sm:col-span-6">
                              <label class="block text-xs font-bold mb-1">${tr('Meu Deck', 'My Deck')}</label>
                              <input id="hist-edit-deck" type="text" value="${esc(m.deck)}" class="w-full px-2.5 py-1.5 text-xs" />
                            </div>
                            <div class="sm:col-span-6">
                              <label class="block text-xs font-bold mb-1">${tr('Notas', 'Notes')}</label>
                              <input id="hist-edit-note" type="text" value="${esc(m.note || '')}" placeholder="${esc(tr('Opcional...', 'Optional...'))}" class="w-full px-2.5 py-1.5 text-xs" />
                            </div>
                            <div class="sm:col-span-12">
                              <label class="block text-xs font-bold mb-1">${tr('Oponentes (texto)', 'Opponents (text)')}</label>
                              <input id="hist-edit-opp" type="text" value="${esc(m.oppStr || '')}" class="w-full px-2.5 py-1.5 text-xs" />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  `;
                }
                const rCls = m.res === 'V' ? 'badge-win' : (m.res === 'D' ? 'badge-loss' : 'badge-draw');
                const highlightedOpp = esc(oppDisplayStr(m.oppStr)).replace(/(\([^)]*(?:Vencedor|Winner)[^)]*\))/gi, '<strong class="px-1 rounded bg-[#F4D8C6] text-[#4E3626]">$1</strong>');
                return `
                  <tr class="interactive-row align-top">
                    <td class="py-2.5 px-3 whitespace-nowrap">
                      <div class="flex items-center gap-1">
                        <span class="font-mono font-black">${esc(m.id)}</span>
                        ${m.pending ? '<span class="px-1 rounded text-xs badge-pop-purple">Hub</span>' : ''}
                      </div>
                      <div class="text-muted font-semibold tabular-nums">${esc(matchDateLabel(m))}</div>
                    </td>
                    <td class="py-2.5 px-3">
                      <div class="font-extrabold">${esc(deckDisplayName(m.deck))}</div>
                      ${m.ordem ? `<span class="inline-block mt-1 px-1.5 py-0.2 rounded badge-neutral">${esc(ordemDisplay(m.ordem))}</span>` : ''}
                    </td>
                    <td class="py-2.5 px-2 text-center whitespace-nowrap">
                      <span class="inline-block px-2 py-0.5 rounded-md badge-neutral">${m.pod === 2 ? '1v1' : m.pod + 'P'}</span>
                    </td>
                    <td class="py-2.5 px-2 text-center whitespace-nowrap">
                      ${m.turns ? `<span class="inline-block px-2 py-0.5 rounded-md badge-pop-yellow tabular-nums" data-tip="${esc(tr(`Esta partida durou ${m.turns} turno(s).`, `This match lasted ${m.turns} turn(s).`))}">T${m.turns}</span>` : '<span class="text-muted font-bold">—</span>'}
                    </td>
                    <td class="py-2.5 px-2 text-center whitespace-nowrap">
                      <span class="inline-block px-2 py-0.5 rounded-md ${rCls}">${esc(resLabelOf(m.res))}</span>
                    </td>
                    <td class="py-2.5 px-3 leading-relaxed font-medium">
                      <div>${highlightedOpp}</div>
                      ${m.note ? `<div class="mt-1 text-muted italic">${esc(m.note)}</div>` : ''}
                    </td>
                    <td class="py-2.5 px-2.5 text-right whitespace-nowrap">
                      ${isConfirmDel ? `
                        <div class="inline-flex items-center gap-1">
                          <button type="button" data-hist-confirm-del="${esc(m.id)}" class="px-1.5 py-0.5 rounded text-xs badge-loss cursor-pointer">${tr('Excluir', 'Delete')}</button>
                          <button type="button" data-hist-cancel-del="1" class="px-1.5 py-0.5 rounded text-xs badge-neutral cursor-pointer">✕</button>
                        </div>
                      ` : `
                        <div class="inline-flex items-center gap-1">
                          <button type="button" data-hist-edit="${esc(m.id)}" data-tip="${esc(tr('Editar esta partida no seu Hub.', 'Edit this match in your Hub.'))}" class="w-6 h-6 rounded-md border border-[#4E3626] bg-[#FCF8F0] hover:bg-[#F1D27A] inline-flex items-center justify-center font-bold cursor-pointer">✎</button>
                          <button type="button" data-hist-ask-del="${esc(m.id)}" data-tip="${esc(tr('Excluir esta partida do seu Hub.', 'Delete this match from your Hub.'))}" class="w-6 h-6 rounded-md border border-[#4E3626] bg-[#FCF8F0] hover:bg-[#D7653A] hover:text-[#FCF8F0] inline-flex items-center justify-center font-black cursor-pointer">×</button>
                        </div>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `)}
      </div>
    ` : renderEmptyState()}
  `;
}
