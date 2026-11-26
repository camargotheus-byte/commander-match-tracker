import { state } from '../../core/state/store.js';
import { tr, resLabelOf, resCodeDisp, fmtRecord, oppDisplayStr } from '../../core/i18n/i18n.service.js';
import { deckDisplayName, getEnemyCmdColorIdentity } from '../../shared/utils/deck-style.service.js';
import { calcStats, groupDecks, groupPlayers, groupEnemyCmds } from '../../shared/utils/stats.utils.js';
import { esc, fmtPct, wrClass, wrBarColor, matchDateLabel, scryfallCardUrl } from '../../shared/utils/formatters.js';
import { renderManaIdentityHtml } from '../../shared/components/mana-identity.view.js';
import { renderEmptyState } from '../../shared/components/empty-state.view.js';
import { wrapHScroll } from '../../shared/components/hscroll-table.js';
import { getRivalCommanders, filterEnemyCommanders } from './opponents.service.js';

export function renderOpponents(filtered) {
  if (!filtered.length) return renderEmptyState();

  const subNav = `
    <div class="nb-card-sm p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center gap-1.5 flex-wrap">
        <button data-opp-sub="players" class="nb-pill px-3 py-1.5 text-xs ${state.oppSubTab === 'players' ? 'nb-pill-active' : ''}">${tr('Jogadores', 'Players')} (${groupPlayers(filtered).length})</button>
        <button data-opp-sub="ecmds" class="nb-pill px-3 py-1.5 text-xs ${state.oppSubTab === 'ecmds' ? 'nb-pill-active' : ''}">${tr('Comandantes Inimigos', 'Enemy Commanders')} (${groupEnemyCmds(filtered).length})</button>
        <button data-opp-sub="heatmap" class="nb-pill px-3 py-1.5 text-xs ${state.oppSubTab === 'heatmap' ? 'nb-pill-active' : ''}">${tr('Matriz Deck × Oponente', 'Deck × Opponent Matrix')}</button>
      </div>
      ${state.oppSubTab !== 'heatmap' ? `<input id="opp-search" type="search" value="${esc(state.oppSearch)}" placeholder="${esc(state.oppSubTab === 'players' ? tr('Buscar jogador...', 'Search player...') : tr('Buscar comandante inimigo...', 'Search enemy commander...'))}" class="px-3 py-1.5 text-xs w-full sm:w-64" />` : `<span class="text-xs font-bold text-muted">${tr('Clique numa célula para abrir no Histórico', 'Click any cell to open in History')}</span>`}
    </div>
  `;

  if (state.oppSubTab === 'players') {
    let players = groupPlayers(filtered).sort((a, b) => b.games - a.games);
    if (state.oppSearch.trim()) {
      const q = state.oppSearch.trim().toLowerCase();
      players = players.filter(p => p.player.toLowerCase().includes(q));
    }

    const activeRival = players.find(p => p.player === state.selectedPlayer) || players[0] || null;
    let rivalXrayHtml = '';
    if (activeRival) {
      const rm = filtered.filter(m => m.players.includes(activeRival.player));
      const rs = calcStats(rm);
      const rDecks = groupDecks(rm).sort((a, b) => b.games - a.games).slice(0, 5);
      const rCmds = getRivalCommanders(rm, activeRival.player).slice(0, 5);
      const rPods = [
        { label: '1v1', list: rm.filter(x => x.pod === 2) },
        { label: '3P', list: rm.filter(x => x.pod === 3) },
        { label: '4+P', list: rm.filter(x => x.pod >= 4) }
      ];
      const isFilteredByRival = state.player === activeRival.player;
      const bothLost = Math.max(0, rs.l - activeRival.oppWins);
      rivalXrayHtml = `
        <div class="nb-folder">
          <div class="nb-folder-tab" style="background:#E2A64B"></div>
          <div class="nb-folder-body p-4 space-y-3.5">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <span class="px-2 py-0.5 rounded text-xs badge-pop-purple">${tr('RAIO-X DO RIVAL', 'RIVAL X-RAY')}</span>
                <h3 class="text-lg font-black mt-1 leading-snug truncate">${esc(activeRival.player)}</h3>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button data-jump-player="${esc(activeRival.player)}" data-tip="${esc(isFilteredByRival ? tr('Remove o filtro global deste rival.', 'Removes the global filter for this rival.') : tr(`Filtra todo o painel para exibir apenas mesas em que ${activeRival.player} participou.`, `Filters the entire dashboard to show only pods featuring ${activeRival.player}.`))}" class="nb-btn ${isFilteredByRival ? 'nb-btn-pink' : 'nb-btn-yellow'} px-2.5 py-1 text-xs">
                  ${isFilteredByRival ? tr('Limpar', 'Clear') : tr('Filtrar', 'Filter')}
                </button>
                <button data-rival-history="${esc(activeRival.player)}" data-tip="${esc(tr(`Abre a aba Histórico já filtrada por todas as mesas contra ${activeRival.player}.`, `Opens History filtered to all pods against ${activeRival.player}.`))}" class="nb-btn nb-btn-green px-2.5 py-1 text-xs">
                  ${tr('Histórico →', 'History →')}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-center">
              <div class="nb-subtle p-2.5" data-tip="${esc(tr(`Sua taxa de vitória nas ${rs.total} mesas em que ${activeRival.player} participou (${rs.w} vitórias ÷ ${rs.total} partidas).`, `Your win rate across the ${rs.total} pods featuring ${activeRival.player} (${rs.w} wins ÷ ${rs.total} games).`))}">
                <div class="text-xs font-bold text-muted">${tr('Meu WR', 'My WR')}</div>
                <div class="text-lg font-black tabular-nums ${wrClass(rs.wr)}">${fmtPct(rs.wr)}</div>
                <div class="text-xs font-semibold text-muted tabular-nums">${rs.total} ${tr('mesas', 'games')}${rs.d ? ` · ${rs.d}${resCodeDisp('E')}` : ''}</div>
              </div>
              <div class="nb-subtle p-2.5" data-tip="${esc(tr(`Quantas vezes você venceu a mesa jogando contra ${activeRival.player}.`, `How many times you won the pod against ${activeRival.player}.`))}">
                <div class="text-xs font-bold text-muted">${tr('Minhas vitórias', 'My Wins')}</div>
                <div class="text-lg font-black tabular-nums wr-high">${rs.w}x</div>
                <div class="text-xs font-semibold text-muted tabular-nums">${fmtPct(rs.total ? rs.w / rs.total : 0, 0)} ${tr('das mesas', 'of games')}</div>
              </div>
              <div class="nb-subtle p-2.5" data-tip="${esc(tr(`Quantas vezes ${activeRival.player} foi registrado como o vencedor da mesa.`, `How many times ${activeRival.player} was recorded as the pod winner.`))}">
                <div class="text-xs font-bold text-muted">${tr('Ele venceu', 'They Won')}</div>
                <div class="text-lg font-black tabular-nums wr-low">${activeRival.oppWins}x</div>
                <div class="text-xs font-semibold text-muted tabular-nums">${fmtPct(rs.total ? activeRival.oppWins / rs.total : 0, 0)} ${tr('das mesas', 'of games')}</div>
              </div>
              <div class="nb-subtle p-2.5" data-tip="${esc(tr(`Partidas em que você e ${activeRival.player} perderam para um terceiro jogador na mesa.`, `Games where both you and ${activeRival.player} lost to a 3rd player at the table.`))}">
                <div class="text-xs font-bold text-muted">${tr('Fomos derrotados', 'Both Lost')}</div>
                <div class="text-lg font-black tabular-nums wr-mid">${bothLost}x</div>
                <div class="text-xs font-semibold text-muted tabular-nums">${tr('por 3º jogador', 'to 3rd player')}</div>
              </div>
            </div>

            <div class="space-y-1.5">
              <div class="text-xs font-extrabold" data-tip="${esc(tr(`Seu aproveitamento contra ${activeRival.player} separado pela quantidade de jogadores na mesa.`, `Your win rate vs. ${activeRival.player} broken down by pod size.`))}">${tr('Por Tamanho de Mesa', 'By Pod Size')}</div>
              <div class="grid grid-cols-3 gap-2">
                ${rPods.map(p => {
                  const pw = p.list.filter(x => x.res === 'V').length;
                  const pwr = p.list.length ? pw / p.list.length : null;
                  const pTip = esc(p.list.length
                    ? tr(`Seu aproveitamento em mesas ${p.label} contra ${activeRival.player}: ${pw} vitória(s) em ${p.list.length} partida(s) (${fmtPct(pwr)}).`, `Your win rate in ${p.label} pods vs. ${activeRival.player}: ${pw} win(s) in ${p.list.length} game(s) (${fmtPct(pwr)}).`)
                    : tr(`Nenhuma partida em mesas ${p.label} contra ${activeRival.player}.`, `No ${p.label} matches vs. ${activeRival.player}.`));
                  return `
                    <div class="nb-subtle px-2.5 py-1.5 text-xs" data-tip="${pTip}">
                      <div class="font-bold text-muted">${p.label}</div>
                      <div class="font-black tabular-nums mt-0.5 ${pwr !== null ? wrClass(pwr) : ''}">${pwr !== null ? fmtPct(pwr, 0) : '—'}</div>
                      <div class="text-muted font-semibold tabular-nums">${p.list.length ? `${pw}${resCodeDisp('V')}/${p.list.length}${tr('j', 'g')}` : `0${tr('j', 'g')}`}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="space-y-1">
              <div class="text-xs font-extrabold" data-tip="${esc(tr(`Comandantes mais pilotados por ${activeRival.player} contra você e o seu aproveitamento contra cada um.`, `Commanders most piloted by ${activeRival.player} against you and your win rate vs. each.`))}">${tr(`Comandantes Mais Usados por ${activeRival.player}`, `Top Commanders Piloted by ${activeRival.player}`)}</div>
              ${rCmds.length ? rCmds.map(c => {
                const cwr = c.games ? c.w / c.games : 0;
                const cCols = getEnemyCmdColorIdentity(c.cmd);
                const cMana = cCols !== null ? renderManaIdentityHtml(cCols, { size: 'sm', showColorless: true }) : '';
                const cTip = esc(tr(`<strong>${c.cmd}</strong> (${activeRival.player})<br/>Seu desempenho contra este comandante: ${fmtRecord(c.w, c.l, c.d)} (${fmtPct(cwr)}).<br/><em>Clique na linha para abrir no Histórico</em>`, `<strong>${c.cmd}</strong> (${activeRival.player})<br/>Your record vs. this commander: ${fmtRecord(c.w, c.l, c.d)} (${fmtPct(cwr)}).<br/><em>Click row to open in History</em>`));
                const parts = c.cmd.split(/\s*\/\/\s*/).filter(Boolean);
                const scryLinks = parts.map(pt => `<a href="${esc(scryfallCardUrl(pt))}" target="_blank" rel="noopener noreferrer" data-tip="${esc(tr(`Abrir "${pt}" no Scryfall (nova aba).`, `View "${pt}" on Scryfall (new tab).`))}" class="hover:underline text-[#4E3626]">${esc(pt)}<span class="text-muted"> ↗</span></a>`).join(' <span class="text-muted">//</span> ');
                return `
                  <div data-filter-ecmd="${esc(c.cmd)}" data-filter-ecmd-player="${esc(activeRival.player)}" data-tip="${cTip}" class="w-full flex items-start justify-between gap-2 text-xs py-1.5 border-b border-[#DCCBAE] last:border-0 hover:bg-[#F3ECE0] rounded px-1 cursor-pointer text-left">
                    <div class="flex flex-col gap-1 min-w-0">
                      <span class="font-bold leading-snug">${scryLinks}</span>
                      ${cMana ? `<div>${cMana}</div>` : ''}
                    </div>
                    <span class="tabular-nums shrink-0 whitespace-nowrap"><strong class="${wrClass(cwr)}">${fmtPct(cwr, 0)}</strong> <span class="text-muted font-semibold">(${fmtRecord(c.w, c.l, 0)})</span></span>
                  </div>
                `;
              }).join('') : `<p class="text-xs text-muted">${tr('Sem comandantes identificados.', 'No identified commanders.')}</p>`}
            </div>

            <div class="space-y-1">
              <div class="text-xs font-extrabold" data-tip="${esc(tr(`Seus decks mais utilizados em mesas contra ${activeRival.player} e o seu aproveitamento com cada um.`, `Your most played decks in pods against ${activeRival.player} and your win rate with each.`))}">${tr('Meus Decks Mais Usados contra ele', 'My Top Decks vs. Them')}</div>
              ${rDecks.map(d => {
                const dTip = esc(tr(`<strong>${deckDisplayName(d.deck)}</strong> vs. ${activeRival.player}<br/>Seu desempenho: ${fmtRecord(d.w, d.l, d.d)} (${fmtPct(d.wr)}).<br/><em>Clique para abrir o Raio-X deste deck</em>`, `<strong>${deckDisplayName(d.deck)}</strong> vs. ${activeRival.player}<br/>Your record: ${fmtRecord(d.w, d.l, d.d)} (${fmtPct(d.wr)}).<br/><em>Click to open this deck's X-Ray</em>`));
                return `
                  <button data-jump-deck="${esc(d.deck)}" data-tip="${dTip}" class="w-full flex items-start justify-between gap-2 text-xs py-1.5 border-b border-[#DCCBAE] last:border-0 hover:bg-[#F3ECE0] rounded px-1 cursor-pointer text-left">
                    <span class="font-bold leading-snug">${esc(deckDisplayName(d.deck))}</span>
                    <span class="tabular-nums shrink-0 whitespace-nowrap"><strong class="${wrClass(d.wr)}">${fmtPct(d.wr, 0)}</strong> <span class="text-muted font-semibold">(${fmtRecord(d.w, d.l, 0)})</span></span>
                  </button>
                `;
              }).join('')}
            </div>

            <div class="space-y-1.5">
              <div class="text-xs font-extrabold" data-tip="${esc(tr(`Sequência cronológica dos seus últimos resultados contra ${activeRival.player} (da esquerda para a direita, sendo a última à direita a mais recente).`, `Chronological sequence of your latest results vs. ${activeRival.player} (left to right, rightmost is most recent).`))}">${tr(`Últimas ${Math.min(10, rm.length)} Partidas contra ${activeRival.player}`, `Last ${Math.min(10, rm.length)} Matches vs. ${activeRival.player}`)}</div>
              <div class="flex items-center gap-1 flex-wrap">
                ${rm.slice(-10).map(m => {
                  const cls = m.res === 'V' ? 'badge-win' : (m.res === 'D' ? 'badge-loss' : 'badge-draw');
                  const tip = esc(`<strong>${m.id}</strong> (${matchDateLabel(m)})<br/>${tr('Meu Deck', 'My Deck')}: ${deckDisplayName(m.deck)}<br/>${tr('Mesa', 'Pod')} ${m.pod}P${m.turns ? ` · ${m.turns}t` : ''} · <strong>${resLabelOf(m.res)}</strong><br/>vs. ${oppDisplayStr(m.oppStr)}`);
                  return `<span class="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs ${cls}" data-tip="${tip}">${resCodeDisp(m.res)}</span>`;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return `
      ${subNav}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div class="nb-card overflow-hidden lg:col-span-2 min-w-0">
          ${wrapHScroll(`
            <table class="w-full min-w-[560px] text-xs text-left border-collapse">
              <thead>
                <tr class="border-b-2 border-[#4E3626] bg-[#F1D27A]">
                  <th class="py-2.5 px-3 sm:px-4 font-black whitespace-nowrap">${tr('Oponente', 'Opponent')}</th>
                  <th class="py-2.5 px-2.5 font-black text-right whitespace-nowrap">${tr('Mesas', 'Games')}</th>
                  <th class="py-2.5 px-2.5 font-black text-right whitespace-nowrap">${tr('V–D–E', 'W–L–D')}</th>
                  <th class="py-2.5 px-2.5 font-black text-right whitespace-nowrap">${tr('Venceu', 'Won')}</th>
                  <th class="py-2.5 px-3 font-black min-w-[155px] whitespace-nowrap">${tr('Minha Taxa de Vitória', 'My Win Rate')}</th>
                  <th class="py-2.5 px-3 font-black text-right whitespace-nowrap">${tr('Ação', 'Action')}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#DCCBAE]">
                ${players.map(p => {
                  const isSel = activeRival && activeRival.player === p.player;
                  return `
                    <tr data-select-player="${esc(p.player)}" class="interactive-row cursor-pointer ${isSel ? 'bg-[#F3ECE0]' : ''}">
                      <td class="py-2.5 px-3 sm:px-4 font-extrabold whitespace-nowrap">${esc(p.player)}</td>
                      <td class="py-2.5 px-2.5 text-right tabular-nums font-black whitespace-nowrap">${p.games}</td>
                      <td class="py-2.5 px-2.5 text-right tabular-nums font-bold whitespace-nowrap">${p.w}–${p.l}${p.d ? `–${p.d}` : ''}</td>
                      <td class="py-2.5 px-2.5 text-right tabular-nums font-bold text-muted whitespace-nowrap">${p.oppWins}x</td>
                      <td class="py-2.5 px-3 whitespace-nowrap">
                        <div class="flex items-center gap-2">
                          <div class="flex-1 min-w-[72px] h-2.5 rounded-full bg-[#F3ECE0] border border-[#4E3626] overflow-hidden">
                            <div class="h-full" style="width:${(p.wr * 100).toFixed(1)}%; background:${wrBarColor(p.wr)}"></div>
                          </div>
                          <span class="w-12 text-right font-black tabular-nums shrink-0 ${wrClass(p.wr)}">${fmtPct(p.wr)}</span>
                        </div>
                      </td>
                      <td class="py-2.5 px-3 text-right whitespace-nowrap">
                        <button data-rival-history="${esc(p.player)}" class="nb-pill px-2 py-1 text-xs">${tr('Histórico', 'History')}</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `)}
        </div>
        <div id="rival-xray" class="lg:sticky lg:top-4 scroll-mt-4">${rivalXrayHtml}</div>
      </div>
    `;
  }

  if (state.oppSubTab === 'ecmds') {
    const ecmds = filterEnemyCommanders(filtered, state.oppSearch);
    return `
      ${subNav}
      <div class="nb-card overflow-hidden min-w-0">
        ${wrapHScroll(`
          <table class="w-full min-w-[720px] text-xs text-left border-collapse">
            <thead>
              <tr class="border-b-2 border-[#4E3626] bg-[#F1D27A]">
                <th class="py-2.5 px-3 sm:px-4 font-black whitespace-nowrap">${tr('Comandante Inimigo', 'Enemy Commander')}</th>
                <th class="py-2.5 px-3 font-black whitespace-nowrap">${tr('Cores', 'Colors')}</th>
                <th class="py-2.5 px-3 font-black whitespace-nowrap">${tr('Pilotos na mesa', 'Pilots')}</th>
                <th class="py-2.5 px-3 font-black text-right whitespace-nowrap">${tr('Encontros', 'Encounters')}</th>
                <th class="py-2.5 px-3 font-black text-right whitespace-nowrap">${tr('V–D–E', 'W–L–D')}</th>
                <th class="py-2.5 px-3 sm:px-4 font-black min-w-[165px] whitespace-nowrap">${tr('Minha Taxa de Vitória', 'My Win Rate')}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#DCCBAE]">
              ${ecmds.map(c => {
                const parts = c.cmd.split(/\s*\/\/\s*/).filter(Boolean);
                const cmdLinks = parts.map(pt => `<a href="${esc(scryfallCardUrl(pt))}" target="_blank" rel="noopener noreferrer" data-tip="${esc(tr(`Abrir "${pt}" no Scryfall (nova aba).`, `View "${pt}" on Scryfall (new tab).`))}" class="hover:underline text-[#4E3626] inline-flex items-center gap-0.5">${esc(pt)}<span class="text-muted text-xs">↗</span></a>`).join(' <span class="text-muted">//</span> ');
                const cols = getEnemyCmdColorIdentity(c.cmd);
                const manaHtml = cols !== null ? renderManaIdentityHtml(cols, { size: 'sm', showColorless: true }) : '<span class="text-muted">—</span>';
                return `
                  <tr data-filter-ecmd="${esc(c.cmd)}" class="interactive-row cursor-pointer">
                    <td class="py-2.5 px-3 sm:px-4 font-extrabold">${cmdLinks}</td>
                    <td class="py-2.5 px-3 whitespace-nowrap">${manaHtml}</td>
                    <td class="py-2.5 px-3 text-muted font-semibold">${esc(c.playersList.slice(0, 4).join(', '))}${c.playersList.length > 4 ? ` +${c.playersList.length - 4}` : ''}</td>
                    <td class="py-2.5 px-3 text-right tabular-nums font-black whitespace-nowrap">${c.games}</td>
                    <td class="py-2.5 px-3 text-right tabular-nums font-bold whitespace-nowrap">${c.w}–${c.l}${c.d ? `–${c.d}` : ''}</td>
                    <td class="py-2.5 px-3 sm:px-4 whitespace-nowrap">
                      <div class="flex items-center gap-2">
                        <div class="flex-1 min-w-[72px] h-2.5 rounded-full bg-[#F3ECE0] border border-[#4E3626] overflow-hidden">
                          <div class="h-full" style="width:${(c.wr * 100).toFixed(1)}%; background:${wrBarColor(c.wr)}"></div>
                        </div>
                        <span class="w-12 text-right font-black tabular-nums shrink-0 ${wrClass(c.wr)}">${fmtPct(c.wr)}</span>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `)}
      </div>
    `;
  }

  const topDecks = groupDecks(filtered).sort((a, b) => b.games - a.games).slice(0, 12);
  const topPlayers = groupPlayers(filtered).sort((a, b) => b.games - a.games).slice(0, 10);

  return `
    ${subNav}
    <div class="nb-card overflow-hidden min-w-0">
      <div class="p-4 pb-3">
        <h2 class="text-sm font-black">${tr('Matriz Deck × Oponente', 'Deck × Opponent Matrix')}</h2>
        <p class="text-xs font-medium text-muted">${tr('Verde (Key Lime) ≥ 60% · Amarelo (Butter Sun) 45–59% · Coral (Aperol) &lt; 45%', 'Green (Key Lime) ≥ 60% · Yellow (Butter Sun) 45–59% · Coral (Aperol) &lt; 45%')}</p>
      </div>
      ${wrapHScroll(`
        <table class="w-full text-xs border-collapse">
          <thead>
            <tr class="border-b-2 border-[#4E3626]">
              <th class="py-2 px-3 text-left font-black min-w-[180px] whitespace-nowrap">Deck</th>
              ${topPlayers.map(p => `<th class="py-2 px-2 text-center font-black min-w-[72px] whitespace-nowrap">${esc(p.player)}</th>`).join('')}
            </tr>
          </thead>
          <tbody class="divide-y divide-[#DCCBAE]">
            ${topDecks.map(d => `
              <tr>
                <td class="py-2 px-3 font-extrabold leading-snug min-w-[200px]">${esc(deckDisplayName(d.deck))}</td>
                ${topPlayers.map(p => {
                  const sub = filtered.filter(m => m.deck === d.deck && m.players.includes(p.player));
                  if (!sub.length) return `<td class="p-1 text-center text-muted opacity-40 font-bold">·</td>`;
                  const w = sub.filter(x => x.res === 'V').length;
                  const l = sub.filter(x => x.res === 'D').length;
                  const dr = sub.filter(x => x.res === 'E').length;
                  const wr = w / sub.length;
                  const bg = wr >= 0.6 ? '#C8CF7A' : (wr >= 0.45 ? '#F1D27A' : '#D7653A');
                  const fg = wr < 0.45 ? '#F3ECE0' : '#4E3626';
                  const tip = esc(tr(`<strong>${deckDisplayName(d.deck)}</strong> vs. <strong>${p.player}</strong><br/>Placar: ${fmtRecord(w, l, dr)} (${sub.length} jogos)<br/>Win Rate: <strong>${fmtPct(wr)}</strong>`, `<strong>${deckDisplayName(d.deck)}</strong> vs. <strong>${p.player}</strong><br/>Record: ${fmtRecord(w, l, dr)} (${sub.length} games)<br/>Win Rate: <strong>${fmtPct(wr)}</strong>`));
                  return `
                    <td class="p-1 text-center">
                      <button data-heatmap-deck="${esc(d.deck)}" data-heatmap-player="${esc(p.player)}" data-tip="${tip}"
                        class="w-full py-1.5 px-1 rounded-lg font-black tabular-nums border-2 border-[#4E3626] cursor-pointer hover:shadow-[2px_2px_0_#4E3626] transition-all"
                        style="background:${bg}; color:${fg};">
                        ${w}–${l}${dr ? `–${dr}` : ''}
                      </button>
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `)}
    </div>
  `;
}
