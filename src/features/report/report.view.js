import { state, getActiveFormat } from '../../core/state/store.js';
import { isEn, tr, monthName, resLabelOf, resCodeDisp, ordemDisplay, oppDisplayStr } from '../../core/i18n/i18n.service.js';
import { getMatches, getAllMatches, getFormatPendingMatches, nextSuggestedId } from '../../core/data/matches.repository.js';
import { deckDisplayName } from '../../shared/utils/deck-style.service.js';
import { esc, fmtShortDateBr } from '../../shared/utils/formatters.js';
import { buildReportText, buildSheetsTsv } from './report.service.js';

export function renderReport() {
  const rep = state.report;
  const activeFmt = getActiveFormat();
  const fmtPending = getFormatPendingMatches();
  const matches = getMatches();
  const allMatches = getAllMatches();
  const allDecks = Array.from(new Set(matches.map(m => m.deck))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const allPlayers = Array.from(new Set(allMatches.flatMap(m => m.players))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const allCmds = Array.from(new Set([...matches.flatMap(m => m.enemyCmds), ...allDecks.map(d => d.replace(/\s*\(emprestado\)/i, ''))])).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  return `
    <datalist id="dl-decks">${allDecks.map(d => `<option value="${esc(d)}"></option>`).join('')}</datalist>
    <datalist id="dl-players">${allPlayers.map(p => `<option value="${esc(p)}"></option>`).join('')}</datalist>
    <datalist id="dl-ecmds">${allCmds.map(c => `<option value="${esc(c)}"></option>`).join('')}</datalist>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div class="nb-folder lg:col-span-7">
        <div class="nb-folder-tab" style="background:#F1D27A"></div>
        <div class="nb-folder-body p-4 sm:p-5 space-y-4">
          <div class="flex items-start justify-between gap-3 flex-wrap pb-3 border-b-2 border-[#4E3626]">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-lg font-black">${tr('Reportar Nova Partida', 'Report New Match')}</h2>
                <span class="px-2 py-0.5 rounded-md text-xs font-mono badge-pop-yellow">${esc(nextSuggestedId())}</span>
                <span class="px-2 py-0.5 rounded-md text-xs badge-pop-purple">${esc(isEn() ? activeFmt.en : activeFmt.pt)}</span>
              </div>
              <p class="text-xs font-medium text-muted mt-0.5">${tr(`Salva no perfil ${activeFmt.pt} — separado dos demais formatos.`, `Saves to your ${activeFmt.en} profile — isolated from other formats.`)}</p>
            </div>
            <button id="btn-toggle-paste" class="nb-btn px-3 py-1.5 text-xs">
              ${rep.showPasteBox ? tr('Fechar importador', 'Close importer') : tr('Colar texto pronto', 'Paste report text')}
            </button>
          </div>

          ${rep.showPasteBox ? `
            <div class="nb-subtle p-3 space-y-2">
              <label for="rep-paste-area" class="block text-xs font-extrabold">${tr('Cole o report pronto:', 'Paste your match report:')}</label>
              <textarea id="rep-paste-area" rows="5" placeholder="Data: 23/11/2026&#10;Mês: Novembro&#10;Meu Deck: Zada, Hedron Grinder&#10;Resultado: V&#10;Turnos: 7&#10;&#10;Oponentes:&#10;- Brago, King Eternal (Theo)&#10;&#10;Notas:" class="w-full p-2.5 text-xs font-mono">${esc(rep.pasteText)}</textarea>
              <div class="flex justify-end">
                <button id="btn-parse-paste" class="nb-btn nb-btn-yellow px-3 py-1.5 text-xs">${tr('Preencher formulário', 'Fill form')}</button>
              </div>
            </div>
          ` : ''}

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div class="sm:col-span-5">
              <div class="flex items-center justify-between gap-2 mb-1">
                <label for="rep-date" class="text-xs font-extrabold">${tr('Data da Partida', 'Match Date')}</label>
                <div class="flex items-center gap-1.5">
                  <button type="button" id="btn-rep-date-today" class="text-xs font-extrabold underline cursor-pointer">${tr('Hoje', 'Today')}</button>
                  ${rep.date ? `<button type="button" id="btn-rep-date-clear" class="text-xs font-bold text-muted underline cursor-pointer">${tr('Só mês', 'Month only')}</button>` : ''}
                </div>
              </div>
              <input id="rep-date" type="date" value="${esc(rep.date || '')}" class="w-full px-2.5 py-1.5 text-xs" />
            </div>
            <div class="sm:col-span-3">
              <label for="rep-month" class="block text-xs font-extrabold mb-1">${tr('Mês', 'Month')}</label>
              <select id="rep-month" class="w-full px-2.5 py-2 text-xs">
                ${Array.from({ length: 12 }, (_, i) => `<option value="${i}" ${rep.monthIdx === i ? 'selected' : ''}>${esc(monthName(i))}</option>`).join('')}
              </select>
            </div>
            <div class="sm:col-span-4">
              <span class="block text-xs font-extrabold mb-1">${tr('Resultado', 'Result')}</span>
              <div class="grid grid-cols-3 gap-1.5">
                <button data-rep-res="V" class="nb-btn py-2 px-1 text-xs ${rep.res === 'V' ? 'nb-btn-green' : ''}">${resCodeDisp('V')}</button>
                <button data-rep-res="D" class="nb-btn py-2 px-1 text-xs ${rep.res === 'D' ? 'nb-btn-pink' : ''}">${resCodeDisp('D')}</button>
                <button data-rep-res="E" class="nb-btn py-2 px-1 text-xs ${rep.res === 'E' ? 'nb-btn-yellow' : ''}">${resCodeDisp('E')}</button>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <div class="flex items-center justify-between gap-2 mb-1">
                <label for="rep-deck" class="text-xs font-extrabold">${tr('Meu Deck', 'My Deck')}</label>
                <label class="inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none">
                  <input id="rep-borrowed" type="checkbox" ${rep.borrowed ? 'checked' : ''} class="accent-[#4E3626]" />
                  ${tr('Deck emprestado', 'Borrowed deck')}
                </label>
              </div>
              <input id="rep-deck" type="text" list="dl-decks" value="${esc(rep.deck)}" placeholder="${esc(activeFmt.cmdFormat ? tr('Digite ou selecione um comandante...', 'Type or select a commander...') : tr('Digite ou selecione seu deck...', 'Type or select your deck...'))}" class="w-full px-3 py-2 text-xs" />
            </div>

            <div>
              <span class="block text-xs font-extrabold mb-1">${tr('Ordem de Jogada', 'Turn Order')} <span class="font-medium text-muted">(${tr('opcional', 'optional')})</span></span>
              <div class="flex items-center gap-1.5 flex-wrap">
                ${['', '1º a jogar', '2º a jogar', '3º a jogar', '4º a jogar'].map(ord => `
                  <button data-rep-ordem="${esc(ord)}" class="nb-pill px-2.5 py-1 text-xs ${rep.ordem === ord ? 'nb-pill-active' : ''}">${ord ? ordemDisplay(ord) : tr('Não informada', 'Not set')}</button>
                `).join('')}
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between gap-2 mb-1">
                <label for="rep-turns" class="text-xs font-extrabold">${tr('Duração do Jogo (Turnos)', 'Game Duration (Turns)')} <span class="font-medium text-muted">(${tr('opcional', 'optional')})</span></label>
                <span class="text-xs font-semibold text-muted" data-tip="${esc(tr('Informe em qual turno a partida terminou (ex.: 7 para um jogo que acabou no 7º turno).', 'Enter which turn the game ended on (e.g. 7 for a game ending on turn 7).'))}">${tr('Quantos turnos durou?', 'How many turns?')}</span>
              </div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <input id="rep-turns" type="number" min="1" max="99" step="1" value="${esc(rep.turns)}" placeholder="${esc(tr('Ex.: 7', 'e.g. 7'))}" class="w-24 px-2.5 py-1 text-xs tabular-nums" />
                <button type="button" data-rep-turns="" class="nb-pill px-2.5 py-1 text-xs ${!rep.turns ? 'nb-pill-active' : ''}">${tr('Não informada', 'Not set')}</button>
                ${[5, 6, 7, 8, 9, 10, 12].map(t => `
                  <button type="button" data-rep-turns="${t}" class="nb-pill px-2.5 py-1 text-xs tabular-nums ${String(rep.turns) === String(t) ? 'nb-pill-active' : ''}">${t}t</button>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="space-y-2.5 pt-2 border-t-2 border-[#DCCBAE]">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <span class="text-xs font-extrabold">${tr('Oponentes', 'Opponents')} (${rep.opponents.length} · ${tr('Mesa', 'Pod')} ${rep.opponents.length + 1 === 2 ? '1v1' : (rep.opponents.length + 1) + 'P'})</span>
              <div class="flex items-center gap-1 text-xs">
                <button data-rep-preset="1" class="nb-pill px-2 py-0.5 text-xs ${rep.opponents.length === 1 ? 'nb-pill-active' : ''}">1v1</button>
                <button data-rep-preset="2" class="nb-pill px-2 py-0.5 text-xs ${rep.opponents.length === 2 ? 'nb-pill-active' : ''}">3P</button>
                <button data-rep-preset="3" class="nb-pill px-2 py-0.5 text-xs ${rep.opponents.length === 3 ? 'nb-pill-active' : ''}">4P</button>
              </div>
            </div>

            <div class="space-y-2">
              ${rep.opponents.map((o, idx) => `
                <div class="nb-subtle p-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div class="sm:col-span-6">
                    <input type="text" list="dl-ecmds" data-opp-idx="${idx}" data-opp-field="cmd" value="${esc(o.cmd)}" placeholder="${esc(activeFmt.cmdFormat ? tr(`Comandante do oponente ${idx + 1}`, `Opponent ${idx + 1} commander`) : tr(`Deck / arquétipo do oponente ${idx + 1}`, `Opponent ${idx + 1} deck / archetype`))}" class="w-full px-2.5 py-1.5 text-xs" />
                  </div>
                  <div class="sm:col-span-3">
                    <input type="text" list="dl-players" data-opp-idx="${idx}" data-opp-field="player" value="${esc(o.player)}" placeholder="${esc(tr('Jogador', 'Player'))}" class="w-full px-2.5 py-1.5 text-xs" />
                  </div>
                  <div class="sm:col-span-3 flex items-center justify-end gap-1.5">
                    <button data-opp-winner="${idx}" ${rep.res !== 'D' ? 'disabled' : ''}
                      class="nb-btn flex-1 px-2 py-1.5 text-xs ${o.winner && rep.res === 'D' ? 'nb-btn-pink' : ''}">
                      ${o.winner && rep.res === 'D' ? tr('★ Vencedor', '★ Winner') : tr('Vencedor?', 'Winner?')}
                    </button>
                    ${rep.opponents.length > 1 ? `<button data-opp-remove="${idx}" class="nb-btn px-2 py-1.5 text-xs" data-tip="${esc(tr('Remover', 'Remove'))}">×</button>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>

            <button id="btn-add-opp" class="text-xs font-extrabold underline cursor-pointer">${tr('+ Adicionar outro oponente', '+ Add another opponent')}</button>
          </div>

          <div class="pt-2 border-t-2 border-[#DCCBAE]">
            <label for="rep-notes" class="block text-xs font-extrabold mb-1">${tr('Notas', 'Notes')} <span class="font-medium text-muted">(${tr('opcional', 'optional')})</span></label>
            <textarea id="rep-notes" rows="3" placeholder="${esc(tr('Ex.: Turno decisivo, estreia do deck, jogadas marcantes...', 'e.g. Winning turn, deck debut, key plays...'))}" class="w-full p-2.5 text-xs">${esc(rep.notes)}</textarea>
          </div>

          <div class="flex items-center justify-between gap-2 pt-2 flex-wrap">
            <button id="btn-clear-report" class="nb-btn px-3 py-2 text-xs">${tr('Limpar', 'Clear')}</button>
            <div class="flex items-center gap-2 flex-wrap">
              <button id="btn-copy-current-report" class="nb-btn nb-btn-purple px-3.5 py-2 text-xs">${tr('Copiar p/ Chat', 'Copy for Chat')}</button>
              <button id="btn-submit-report" class="nb-btn nb-btn-yellow px-4 py-2 text-xs">${tr('Adicionar ao Painel →', 'Add to Dashboard →')}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-5 space-y-4">
        <div class="nb-folder">
          <div class="nb-folder-tab" style="background:#C8CF7A"></div>
          <div class="nb-folder-body p-4 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h3 class="text-sm font-black">${tr('Prévia no Modelo', 'Template Preview')}</h3>
                <p class="text-xs font-medium text-muted">${tr('Cole no chat para gravar na planilha', 'Paste in chat to save to Google Sheets')}</p>
              </div>
              <button id="btn-copy-preview" class="nb-btn nb-btn-yellow px-3 py-1 text-xs">${tr('Copiar', 'Copy')}</button>
            </div>
            <pre id="rep-preview" class="nb-subtle p-3 text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto select-all">${esc(buildReportText(rep))}</pre>
            <div class="flex items-center justify-between gap-2 pt-1">
              <span class="text-xs font-bold text-muted">${tr('Formato planilha (TSV)', 'Spreadsheet format (TSV)')}</span>
              <button id="btn-copy-tsv" class="text-xs font-extrabold underline cursor-pointer">${tr('Copiar linha TSV', 'Copy TSV row')}</button>
            </div>
            <div id="rep-tsv-preview" class="hidden">${esc(buildSheetsTsv(rep))}</div>
          </div>
        </div>

        <div class="nb-folder">
          <div class="nb-folder-tab" style="background:#E2A64B"></div>
          <div class="nb-folder-body p-4 space-y-3">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 class="text-sm font-black">${tr('Recém-adicionadas no Hub', 'Recently Added in Hub')} (${fmtPending.length})</h3>
                <p class="text-xs font-medium text-muted">${tr(`Já salvas no perfil ${activeFmt.pt}`, `Saved in ${activeFmt.en} profile`)}</p>
              </div>
              <div class="flex items-center gap-1.5">
                <button type="button" id="btn-export-backup-json" class="nb-btn nb-btn-yellow px-2.5 py-1 text-xs">${tr('Backup .json', '.json Backup')}</button>
                ${fmtPending.length ? `<button id="btn-copy-all-pending" class="nb-btn nb-btn-green px-2.5 py-1 text-xs">${tr('Copiar', 'Copy')} (${fmtPending.length})</button>` : ''}
              </div>
            </div>
            ${fmtPending.length ? `
              <div class="space-y-2 max-h-60 overflow-y-auto scroll-thin pr-1">
                ${fmtPending.slice().reverse().map(m => {
                  const rCls = m.res === 'V' ? 'badge-win' : (m.res === 'D' ? 'badge-loss' : 'badge-draw');
                  return `
                    <div class="nb-subtle p-2.5 text-xs space-y-1">
                      <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span class="font-mono font-black">${esc(m.id)}</span>
                          <span class="px-1.5 py-0.2 rounded ${rCls}">${esc(resLabelOf(m.res))}</span>
                          ${m.date ? `<span class="px-1.5 py-0.2 rounded badge-neutral tabular-nums">${esc(fmtShortDateBr(m.date))}</span>` : ''}
                          ${m.turns ? `<span class="px-1.5 py-0.2 rounded badge-pop-yellow tabular-nums">T${m.turns}</span>` : ''}
                        </div>
                        <div class="flex items-center gap-2">
                          <button data-copy-pending-id="${esc(m.id)}" class="font-extrabold underline cursor-pointer">${tr('Copiar', 'Copy')}</button>
                          <button data-remove-pending-id="${esc(m.id)}" class="font-black hover:text-[#D7653A] cursor-pointer">×</button>
                        </div>
                      </div>
                      <div class="font-extrabold truncate">${esc(deckDisplayName(m.deck))}</div>
                      <div class="text-muted font-medium truncate">vs. ${esc(oppDisplayStr(m.oppStr))}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div class="nb-subtle p-3 text-xs font-medium text-muted leading-relaxed">
                ${tr(`Nenhuma partida local em <strong>${activeFmt.pt}</strong>. Ao clicar em <strong>Adicionar ao Painel</strong>, a partida fica salva neste perfil e atualiza todos os gráficos na hora.`, `No local matches in <strong>${activeFmt.en}</strong> yet. Click <strong>Add to Dashboard</strong> to save to this profile and update all charts instantly.`)}
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}
