import { state, getActiveFormat } from '../../core/state/store.js';
import { isEn, tr, resLabelOf, resCodeDisp, fmtRecord, oppDisplayStr } from '../../core/i18n/i18n.service.js';
import { ICONS, ICON_CATALOG, PALETTE_OPTIONS } from '../../shared/constants/icons.js';
import { MANA_ORDER, MANA_DEFS } from '../../shared/constants/mana-identity.data.js';
import {
  favoriteDecks,
  isFavDeck,
  deckStyles,
  deckMeta,
  isRegisteredDeck,
  getDeckCommanderInfo,
  deckDisplayName,
  getDeckColorIdentity,
  getColorComboLabel,
  deckAccent
} from '../../shared/utils/deck-style.service.js';
import { calcStats, calcTurnStats, groupPlayers } from '../../shared/utils/stats.utils.js';
import { esc, fmtPct, fmtTurns, shortDeck, wrClass, wrBarColor, fmtDateDisp, matchDateLabel, scryfallCardUrl } from '../../shared/utils/formatters.js';
import { renderManaIdentityHtml } from '../../shared/components/mana-identity.view.js';
import { getDeckBadges, renderBadgesHtml } from '../../shared/components/badges.view.js';
import { renderDeckFolderCard } from '../../shared/components/deck-folder-card.view.js';
import { wrapHScroll } from '../../shared/components/hscroll-table.js';
import { prepareDeckLists } from './decks.service.js';
import { renderDeckTrajectoryChart } from './deck-trajectory.view.js';

function renderNewDeckPanel() {
  if (!state.showNewDeckForm) return '';
  const activeFmt = getActiveFormat();
  const draft = state.newDeckDraft || { name: '', cmd1: '', cmd2: '', partner: false, colors: [], url: '', borrowed: false };

  return `
    <div class="nb-folder">
      <div class="nb-folder-tab" style="background:#C8CF7A"></div>
      <div class="nb-folder-body p-4 sm:p-5 space-y-4">
        <div class="flex items-start justify-between gap-3 pb-3 border-b-2 border-[#4E3626]">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2 py-0.5 rounded text-xs badge-pop-purple">${esc(isEn() ? activeFmt.en : activeFmt.pt)}</span>
              <h2 class="text-base font-black">${tr('Cadastrar Novo Deck', 'Register New Deck')}</h2>
            </div>
            <p class="text-xs font-medium text-muted mt-0.5">${tr('Monte sua garagem de decks: dê um nome, defina comandante(s), cores de mana e link da decklist — ele já aparece pronto na aba Reportar.', 'Build your deck shelf: name your deck, set commander(s), mana colors, and decklist link — ready to pick when logging matches.')}</p>
          </div>
          <button type="button" data-close-new-deck="1" class="nb-btn px-2.5 py-1 text-xs shrink-0" aria-label="${esc(tr('Fechar', 'Close'))}">✕</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <div class="flex items-center justify-between gap-2 mb-1">
              <label for="new-deck-name" class="text-xs font-extrabold">${tr('Nome do Deck', 'Deck Name')} *</label>
              <label class="inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none">
                <input id="new-deck-borrowed" type="checkbox" ${draft.borrowed ? 'checked' : ''} class="accent-[#4E3626]" />
                ${tr('Emprestado', 'Borrowed')}
              </label>
            </div>
            <input id="new-deck-name" type="text" value="${esc(draft.name)}"
              placeholder="${esc(activeFmt.cmdFormat ? tr('Ex.: Vampiros do Caos ou Edgar Markov', 'e.g. Chaos Vampires or Edgar Markov') : tr('Ex.: Mono Red Burn, Dimir Tempo...', 'e.g. Mono Red Burn, Dimir Tempo...'))}"
              class="w-full px-3 py-2 text-xs" />
          </div>

          <div>
            <label for="new-deck-url" class="block text-xs font-extrabold mb-1">${tr('Link da Decklist', 'Decklist URL')} <span class="font-medium text-muted">(${tr('opcional', 'optional')})</span></label>
            <input id="new-deck-url" type="url" value="${esc(draft.url)}" placeholder="https://moxfield.com/decks/..." class="w-full px-3 py-2 text-xs" />
          </div>

          <div>
            <div class="flex items-center justify-between gap-2 mb-1">
              <label for="new-deck-cmd1" class="text-xs font-extrabold">
                ${activeFmt.cmdFormat ? (draft.partner ? tr('Comandante 1', 'Commander 1') : tr('Comandante', 'Commander')) : tr('Carta-chave / Arquétipo', 'Key Card / Archetype')}
                <span class="font-medium text-muted">(${tr('opcional', 'optional')})</span>
              </label>
              ${activeFmt.cmdFormat ? `
                <button type="button" data-new-deck-partner="1"
                  class="nb-pill px-2 py-0.5 text-xs ${draft.partner ? 'nb-pill-active' : ''}">
                  ${draft.partner ? '✓ Partner' : '+ Partner'}
                </button>
              ` : ''}
            </div>
            <input id="new-deck-cmd1" type="text" value="${esc(draft.cmd1)}"
              placeholder="${esc(activeFmt.cmdFormat ? tr('Se deixar vazio, usa o nome do deck', 'Leave blank to use deck name') : tr('Ex.: Monastery Swiftspear...', 'e.g. Monastery Swiftspear...'))}"
              class="w-full px-3 py-2 text-xs" />
          </div>

          ${draft.partner && activeFmt.cmdFormat ? `
            <div>
              <label for="new-deck-cmd2" class="block text-xs font-extrabold mb-1">${tr('Comandante 2 (Partner)', 'Commander 2 (Partner)')}</label>
              <input id="new-deck-cmd2" type="text" value="${esc(draft.cmd2)}" placeholder="${esc(tr('Nome do segundo comandante...', 'Second commander name...'))}" class="w-full px-3 py-2 text-xs" />
            </div>
          ` : `
            <div>
              <span class="block text-xs font-extrabold mb-1.5">${tr('Identidade de Cor (Mana)', 'Color Identity (Mana)')}</span>
              <div class="flex items-center gap-1.5 flex-wrap">
                ${MANA_ORDER.map(code => {
                  const def = MANA_DEFS[code];
                  const active = (draft.colors || []).includes(code);
                  return `
                    <button type="button" data-new-deck-color="${code}"
                      data-tip="${esc(isEn() ? def.en : def.pt)}"
                      class="w-8 h-8 rounded-full border-2 border-[#4E3626] inline-flex items-center justify-center cursor-pointer transition-all ${active ? 'shadow-[2px_2px_0_#4E3626] scale-105' : 'opacity-35 hover:opacity-75'}"
                      style="background:${def.bg}; color:${def.fg};">
                      ${def.svg}
                    </button>
                  `;
                }).join('')}
                <span class="text-xs font-bold text-muted ml-1">${(draft.colors && draft.colors.length) ? esc(getColorComboLabel(draft.colors)) : tr('Incolor', 'Colorless')}</span>
              </div>
            </div>
          `}
        </div>

        ${draft.partner && activeFmt.cmdFormat ? `
          <div>
            <span class="block text-xs font-extrabold mb-1.5">${tr('Identidade de Cor (Mana)', 'Color Identity (Mana)')}</span>
            <div class="flex items-center gap-1.5 flex-wrap">
              ${MANA_ORDER.map(code => {
                const def = MANA_DEFS[code];
                const active = (draft.colors || []).includes(code);
                return `
                  <button type="button" data-new-deck-color="${code}"
                    data-tip="${esc(isEn() ? def.en : def.pt)}"
                    class="w-8 h-8 rounded-full border-2 border-[#4E3626] inline-flex items-center justify-center cursor-pointer transition-all ${active ? 'shadow-[2px_2px_0_#4E3626] scale-105' : 'opacity-35 hover:opacity-75'}"
                    style="background:${def.bg}; color:${def.fg};">
                    ${def.svg}
                  </button>
                `;
              }).join('')}
              <span class="text-xs font-bold text-muted ml-1">${(draft.colors && draft.colors.length) ? esc(getColorComboLabel(draft.colors)) : tr('Incolor', 'Colorless')}</span>
            </div>
          </div>
        ` : ''}

        <div class="flex items-center justify-end gap-2 pt-2 border-t-2 border-[#DCCBAE]">
          <button type="button" data-close-new-deck="1" class="nb-btn px-3.5 py-2 text-xs">${tr('Cancelar', 'Cancel')}</button>
          <button type="button" id="btn-save-new-deck" class="nb-btn nb-btn-yellow px-4 py-2 text-xs">${tr('Salvar Deck →', 'Save Deck →')}</button>
        </div>
      </div>
    </div>
  `;
}

export function renderDecks(filtered) {
  const activeFmt = getActiveFormat();
  const { totalBeforeMin, visibleDecks, splitHonorable, mainDecks, honorableDecks, showWeighted, activeDeckObj } = prepareDeckLists(filtered);

  // If there are no decks at all in this profile (0 matches and 0 registered decks)
  if (!totalBeforeMin && !state.deckSearch.trim() && !state.onlyFavorites) {
    return `
      ${renderNewDeckPanel()}
      <div class="nb-card p-8 sm:p-10 text-center space-y-4 max-w-2xl mx-auto">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs badge-pop-purple">
          ${esc(activeFmt.badge)}
        </div>
        <div class="text-lg font-black">${esc(tr(`Sua garagem de decks em ${activeFmt.pt} está vazia`, `Your ${activeFmt.en} deck shelf is empty`))}</div>
        <p class="text-xs font-medium text-muted leading-relaxed max-w-md mx-auto">
          ${tr(
            'Cadastre seus decks agora com nome, comandante(s), cores de mana e link da decklist — eles já ficam prontos para selecionar na hora de registrar partidas!',
            'Register your decks now with custom names, commander(s), mana colors, and decklist links — ready to pick whenever you log matches!'
          )}
        </p>
        <div class="flex items-center justify-center gap-2.5 flex-wrap pt-1">
          <button type="button" data-open-new-deck="1" class="nb-btn nb-btn-yellow px-4 py-2 text-xs">
            ${tr('+ Cadastrar 1º Deck', '+ Register 1st Deck')}
          </button>
          <button type="button" data-tab="report" class="nb-btn px-4 py-2 text-xs">
            ${tr('+ Registrar partida', '+ Log match')}
          </button>
        </div>
      </div>
    `;
  }

  // Scatter SVG (only decks with 1+ games)
  const playedDecks = visibleDecks.filter(d => d.games > 0);
  const SW = 620, SH = 230, spL = 42, spR = 24, spT = 18, spB = 34;
  const sPlotW = SW - spL - spR, sPlotH = SH - spT - spB;
  const maxG = Math.max(5, ...playedDecks.map(d => d.games));
  const xMax = Math.ceil((maxG + 2) / 5) * 5;
  const xTicks = [];
  for (let v = 0; v <= xMax; v += (xMax <= 10 ? 2 : 5)) xTicks.push(v);

  const bubbles = playedDecks.map(d => {
    const cx = spL + (d.games / xMax) * sPlotW;
    const cy = spT + sPlotH * (1 - d.wr);
    const r = Math.max(6, Math.min(15, 5 + Math.sqrt(d.games) * 1.8));
    const isSel = activeDeckObj && activeDeckObj.deck === d.deck;
    const tip = esc(tr(
      `<strong>${deckDisplayName(d.deck)}</strong><br/>Jogos: ${d.games} (${fmtRecord(d.w, d.l, d.d)})<br/>Win Rate: <strong>${fmtPct(d.wr)}</strong> (esp. ${fmtPct(d.expWr)})`,
      `<strong>${deckDisplayName(d.deck)}</strong><br/>Games: ${d.games} (${fmtRecord(d.w, d.l, d.d)})<br/>Win Rate: <strong>${fmtPct(d.wr)}</strong> (exp. ${fmtPct(d.expWr)})`
    ));
    return `
      <g class="cursor-pointer" data-select-deck="${esc(d.deck)}" data-tip="${tip}">
        <circle cx="${(cx + 2).toFixed(1)}" cy="${(cy + 2).toFixed(1)}" r="${r.toFixed(1)}" fill="#4E3626" />
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${wrBarColor(d.wr)}" stroke="#4E3626" stroke-width="${isSel ? '3' : '2'}" />
        ${d.games >= 8 || isSel ? `<text x="${cx.toFixed(1)}" y="${(cy - r - 5).toFixed(1)}" text-anchor="middle" fill="#4E3626" font-size="10.5" font-weight="800">${esc(shortDeck(deckDisplayName(d.deck), 14))}</text>` : ''}
      </g>
    `;
  }).join('');

  let xrayHtml = '';
  if (activeDeckObj) {
    const dm = activeDeckObj.matches;
    const ds = calcStats(dm);
    const acc = deckAccent(activeDeckObj);
    const activeBadges = getDeckBadges(activeDeckObj, { honorable: activeDeckObj.games > 0 && activeDeckObj.games < 5 });
    const dPlayers = groupPlayers(dm).sort((a, b) => b.games - a.games).slice(0, 6);
    const dPods = [
      { label: '1v1', list: dm.filter(x => x.pod === 2) },
      { label: '3P', list: dm.filter(x => x.pod === 3) },
      { label: '4+P', list: dm.filter(x => x.pod >= 4) }
    ];
    const customStyle = deckStyles[activeDeckObj.deck] || {};
    const dMeta = deckMeta[activeDeckObj.deck] || {};
    const cmdInfo = getDeckCommanderInfo(activeDeckObj.deck);
    const deckColors = getDeckColorIdentity(activeDeckObj.deck);
    const colorCombo = getColorComboLabel(deckColors);
    const cmdDraft = (state.showDeckCmdEditor && state.cmdDraft && state.cmdDraft.deck === activeDeckObj.deck)
      ? state.cmdDraft
      : { deck: activeDeckObj.deck, partner: cmdInfo.partner, cmd1: cmdInfo.cmd1, cmd2: cmdInfo.cmd2, colors: deckColors.slice() };
    const deckTrajHtml = dm.length ? renderDeckTrajectoryChart(dm, dMeta, acc) : '';
    const dt = calcTurnStats(dm);
    const canDeleteUnused = activeDeckObj.games === 0 && isRegisteredDeck(activeDeckObj.deck, state.format);
    const cleanDisplayName = deckDisplayName(activeDeckObj.deck).replace(/\s*\((?:emprestado|borrowed)\)/i, '');

    xrayHtml = `
      <div class="nb-folder">
        <div class="nb-folder-tab" style="background:${acc.color}"></div>
        <div class="nb-folder-body p-4 space-y-3.5">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-start gap-2.5 min-w-0">
              <button data-toggle-customizer="1" data-tip="${esc(tr('Clique para escolher o ícone e a cor da pasta deste deck.', 'Click to choose this deck\'s folder icon and color.'))}"
                class="nb-icon-box cursor-pointer hover:scale-105 transition-transform shadow-[2px_2px_0_#4E3626]"
                style="background:${acc.color}; color:${acc.ink || '#4E3626'}">
                ${acc.icon}
              </button>
              <div class="min-w-0">
                <span class="px-2 py-0.5 rounded text-xs badge-pop-yellow">${tr('RAIO-X DO DECK', 'DECK X-RAY')}</span>
                <div class="flex items-center gap-1.5 mt-1">
                  <h3 class="text-base font-black leading-snug break-words">${esc(deckDisplayName(activeDeckObj.deck))}</h3>
                  <button type="button" data-toggle-deck-rename="1"
                    data-tip="${esc(tr('Renomear ou dar um apelido para este deck sem alterar o comandante.', 'Rename or give a custom nickname to this deck without changing its commander.'))}"
                    class="w-6 h-6 rounded-md border-[1.5px] border-[#4E3626] bg-[#F3ECE0] hover:bg-[#F1D27A] inline-flex items-center justify-center text-xs font-black shrink-0 cursor-pointer"
                    aria-label="${esc(tr('Renomear deck', 'Rename deck'))}">✎</button>
                </div>
                ${activeBadges.length ? `<div class="flex items-center gap-1 flex-wrap mt-1.5">${renderBadgesHtml(activeBadges)}</div>` : ''}
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button data-toggle-fav="${esc(activeDeckObj.deck)}" data-tip="${esc(isFavDeck(activeDeckObj.deck) ? tr('Remover este deck dos favoritos.', 'Remove this deck from favorites.') : tr('Marcar este deck como favorito.', 'Mark this deck as favorite.'))}"
                class="nb-btn ${isFavDeck(activeDeckObj.deck) ? 'nb-btn-yellow' : ''} px-2.5 py-1 text-xs">
                ${isFavDeck(activeDeckObj.deck) ? '★' : '☆'}
              </button>
              ${activeDeckObj.games > 0 ? `
                <button data-filter-deck="${esc(activeDeckObj.deck)}" data-tip="${esc(tr('Filtra todo o painel para mostrar apenas partidas com este deck.', 'Filters the entire dashboard to show only matches played with this deck.'))}" class="nb-btn nb-btn-yellow px-2.5 py-1 text-xs">${tr('Filtrar', 'Filter')}</button>
              ` : ''}
            </div>
          </div>

          ${state.showDeckRenameEditor ? `
            <div class="nb-subtle p-3 space-y-2">
              <label for="deck-rename-input" class="block text-xs font-extrabold">${tr('Nome / Apelido do Deck', 'Deck Name / Nickname')}</label>
              <input id="deck-rename-input" type="text" value="${esc(dMeta.customName || cleanDisplayName)}"
                placeholder="${esc(tr('Ex.: Vampiros do Caos, Storm da Zada...', 'e.g. Chaos Vampires, Zada Storm...'))}"
                class="w-full px-2.5 py-1.5 text-xs" />
              <div class="flex items-center justify-between gap-2 flex-wrap">
                ${dMeta.customName ? `<button type="button" data-reset-deck-rename="${esc(activeDeckObj.deck)}" class="text-xs font-extrabold underline cursor-pointer">${tr('Usar nome padrão', 'Use default name')}</button>` : '<span></span>'}
                <div class="flex items-center gap-1.5">
                  <button type="button" data-toggle-deck-rename="1" class="nb-btn px-2.5 py-1 text-xs">${tr('Cancelar', 'Cancel')}</button>
                  <button type="button" data-save-deck-rename="${esc(activeDeckObj.deck)}" class="nb-btn nb-btn-yellow px-3 py-1 text-xs">${tr('Salvar nome', 'Save name')}</button>
                </div>
              </div>
            </div>
          ` : ''}

          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" data-report-with-deck="${esc(activeDeckObj.deck)}"
              class="nb-btn nb-btn-yellow px-3 py-1.5 text-xs flex-1">
              ${tr('+ Registrar partida com este deck', '+ Log match with this deck')}
            </button>
            ${canDeleteUnused ? `
              <button type="button" data-remove-registered-deck="${esc(activeDeckObj.deck)}"
                data-tip="${esc(tr('Remove este deck da sua garagem (ele ainda não possui partidas).', 'Removes this unused deck from your shelf (it has 0 matches).'))}"
                class="nb-btn nb-btn-pink px-2.5 py-1.5 text-xs shrink-0">
                ${tr('Remover', 'Remove')}
              </button>
            ` : ''}
          </div>

          <div class="nb-subtle p-3 space-y-2">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-xs font-extrabold uppercase tracking-wide text-muted">${activeFmt.cmdFormat ? (cmdInfo.partner ? tr('Comandantes', 'Commanders') : tr('Comandante', 'Commander')) : tr('Carta-chave / Cores', 'Key Card / Colors')}</span>
                ${cmdInfo.partner ? `<span class="px-1.5 py-0.2 rounded text-xs badge-pop-purple" data-tip="${esc(tr('Este deck utiliza 2 comandantes (Partner, Friends Forever, Background, etc.).', 'This deck runs 2 commanders (Partner, Friends Forever, Background, etc.).'))}">PARTNER</span>` : ''}
              </div>
              <div class="flex items-center gap-2">
                ${deckColors.length && !state.showDeckCmdEditor ? `
                  <div class="inline-flex items-center gap-1.5">
                    ${renderManaIdentityHtml(deckColors)}
                    ${colorCombo ? `<span class="text-xs font-bold text-muted hidden sm:inline">${esc(colorCombo)}</span>` : ''}
                  </div>
                ` : ''}
                <button type="button" data-toggle-cmd-editor="${esc(activeDeckObj.deck)}"
                  data-tip="${esc(tr('Corrija o nome do comandante, ative o modo Partner ou ajuste as cores de mana do deck.', 'Edit commander name, toggle Partner mode, or adjust deck mana colors.'))}"
                  class="text-xs font-extrabold underline cursor-pointer">${state.showDeckCmdEditor ? tr('Fechar', 'Close') : tr('Editar', 'Edit')}</button>
              </div>
            </div>

            ${!state.showDeckCmdEditor ? `
              <div class="space-y-1.5">
                <a href="${esc(scryfallCardUrl(cmdInfo.cmd1))}" target="_blank" rel="noopener noreferrer"
                  data-tip="${esc(tr(`Abrir "${cmdInfo.cmd1}" no Scryfall (nova aba).`, `View "${cmdInfo.cmd1}" on Scryfall (new tab).`))}"
                  class="group flex items-center justify-between gap-2 text-xs bg-[#FCF8F0] hover:bg-[#F3ECE0] border-[1.5px] border-[#4E3626] rounded-lg px-2.5 py-1.5 no-underline text-[#4E3626] transition-colors">
                  <span class="flex items-center gap-2 min-w-0">
                    <span class="w-5 h-5 rounded-md badge-pop-yellow inline-flex items-center justify-center font-black shrink-0">${cmdInfo.partner ? '1' : '★'}</span>
                    <span class="font-extrabold truncate group-hover:underline">${esc(cmdInfo.cmd1)}</span>
                  </span>
                  <span class="text-xs font-bold text-muted group-hover:text-[#4E3626] shrink-0 inline-flex items-center gap-0.5">Scryfall ↗</span>
                </a>
                ${cmdInfo.partner ? (cmdInfo.cmd2 ? `
                  <a href="${esc(scryfallCardUrl(cmdInfo.cmd2))}" target="_blank" rel="noopener noreferrer"
                    data-tip="${esc(tr(`Abrir "${cmdInfo.cmd2}" no Scryfall (nova aba).`, `View "${cmdInfo.cmd2}" on Scryfall (new tab).`))}"
                    class="group flex items-center justify-between gap-2 text-xs bg-[#FCF8F0] hover:bg-[#F3ECE0] border-[1.5px] border-[#4E3626] rounded-lg px-2.5 py-1.5 no-underline text-[#4E3626] transition-colors">
                    <span class="flex items-center gap-2 min-w-0">
                      <span class="w-5 h-5 rounded-md badge-pop-purple inline-flex items-center justify-center font-black shrink-0">2</span>
                      <span class="font-extrabold truncate group-hover:underline">${esc(cmdInfo.cmd2)}</span>
                    </span>
                    <span class="text-xs font-bold text-muted group-hover:text-[#4E3626] shrink-0 inline-flex items-center gap-0.5">Scryfall ↗</span>
                  </a>
                ` : `
                  <div class="flex items-center gap-2 text-xs bg-[#FCF8F0] border-[1.5px] border-[#4E3626] rounded-lg px-2.5 py-1.5">
                    <span class="w-5 h-5 rounded-md badge-pop-purple inline-flex items-center justify-center font-black shrink-0">2</span>
                    <span class="font-extrabold truncate text-muted">${esc(tr('Definir 2º comandante...', 'Set 2nd commander...'))}</span>
                  </div>
                `) : ''}
              </div>
            ` : `
              <div class="space-y-2.5 pt-1">
                <div class="flex items-center justify-between gap-2 bg-[#FCF8F0] border-[1.5px] border-[#4E3626] rounded-lg px-2.5 py-2">
                  <div class="min-w-0">
                    <div class="text-xs font-extrabold">${tr('Habilidade Partner (2 comandantes)', 'Partner Ability (2 commanders)')}</div>
                    <div class="text-xs text-muted font-medium">${tr('Ligue para cadastrar dois comandantes separados', 'Toggle on to enter two separate commanders')}</div>
                  </div>
                  <button type="button" role="switch" aria-checked="${cmdDraft.partner ? 'true' : 'false'}"
                    data-toggle-cmd-partner="1"
                    data-tip="${esc(tr('Liga ou desliga o suporte a 2 comandantes (Partner, Friends Forever, Background, Doctor\'s Companion).', 'Toggles 2-commander support (Partner, Friends Forever, Background, Doctor\'s Companion).'))}"
                    class="relative inline-flex items-center w-12 h-6 rounded-full border-2 border-[#4E3626] transition-colors shrink-0 cursor-pointer ${cmdDraft.partner ? 'bg-[#C8CF7A]' : 'bg-[#F3ECE0]'}">
                    <span class="inline-block w-4 h-4 rounded-full bg-[#4E3626] transition-transform ${cmdDraft.partner ? 'translate-x-6' : 'translate-x-1'}"></span>
                  </button>
                </div>

                <div>
                  <label for="deck-cmd-1" class="block text-xs font-extrabold mb-1">${cmdDraft.partner ? tr('Comandante 1', 'Commander 1') : tr('Comandante', 'Commander')}</label>
                  <input id="deck-cmd-1" type="text" value="${esc(cmdDraft.cmd1)}" placeholder="${esc(tr('Nome do comandante...', 'Commander name...'))}" class="w-full px-2.5 py-1.5 text-xs" />
                </div>

                ${cmdDraft.partner ? `
                  <div>
                    <label for="deck-cmd-2" class="block text-xs font-extrabold mb-1">${tr('Comandante 2 (Partner)', 'Commander 2 (Partner)')}</label>
                    <input id="deck-cmd-2" type="text" value="${esc(cmdDraft.cmd2)}" placeholder="${esc(tr('Nome do segundo comandante...', 'Second commander name...'))}" class="w-full px-2.5 py-1.5 text-xs" />
                  </div>
                ` : ''}

                <div>
                  <span class="block text-xs font-extrabold mb-1.5">${tr('Identidade de Cor (Mana)', 'Color Identity (Mana)')}</span>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    ${MANA_ORDER.map(code => {
                      const def = MANA_DEFS[code];
                      const active = (cmdDraft.colors || []).includes(code);
                      return `
                        <button type="button" data-toggle-cmd-color="${code}"
                          data-tip="${esc(isEn() ? def.en : def.pt)}"
                          class="w-8 h-8 rounded-full border-2 border-[#4E3626] inline-flex items-center justify-center cursor-pointer transition-all ${active ? 'shadow-[2px_2px_0_#4E3626] scale-105' : 'opacity-35 hover:opacity-75'}"
                          style="background:${def.bg}; color:${def.fg};">
                          ${def.svg}
                        </button>
                      `;
                    }).join('')}
                    ${(cmdDraft.colors && cmdDraft.colors.length) ? `<span class="text-xs font-bold text-muted ml-1">${esc(getColorComboLabel(cmdDraft.colors))}</span>` : `<span class="text-xs font-bold text-muted ml-1">${tr('Incolor', 'Colorless')}</span>`}
                  </div>
                </div>

                <div class="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                  ${(cmdInfo.isCustom || dMeta.colorsCustom) ? `<button type="button" data-reset-deck-cmd="${esc(activeDeckObj.deck)}" class="text-xs font-extrabold underline cursor-pointer">${tr('Restaurar padrão', 'Reset default')}</button>` : '<span></span>'}
                  <div class="flex items-center gap-1.5">
                    <button type="button" data-toggle-cmd-editor="${esc(activeDeckObj.deck)}" class="nb-btn px-2.5 py-1 text-xs">${tr('Cancelar', 'Cancel')}</button>
                    <button type="button" data-save-deck-cmd="${esc(activeDeckObj.deck)}" class="nb-btn nb-btn-yellow px-3 py-1 text-xs">${tr('Salvar', 'Save')}</button>
                  </div>
                </div>
              </div>
            `}
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-1.5 flex-wrap">
                ${dMeta.url ? `
                  <a href="${esc(dMeta.url)}" target="_blank" rel="noopener noreferrer"
                    data-tip="${esc(tr(`Abre a decklist salva em nova aba: ${dMeta.url}`, `Opens the saved decklist in a new tab: ${dMeta.url}`))}"
                    class="nb-btn nb-btn-green px-3 py-1.5 text-xs inline-flex items-center gap-1.5 no-underline">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    <span>${tr('Abrir Decklist', 'Open Decklist')}</span>
                  </a>
                ` : `
                  <button type="button" data-toggle-deck-meta="1"
                    data-tip="${esc(tr('Salve o link da sua decklist (Moxfield, Archidekt, LigaMagic, etc.) para abrir direto daqui.', 'Save your decklist link (Moxfield, Archidekt, etc.) to open it directly from here.'))}"
                    class="nb-btn px-3 py-1.5 text-xs inline-flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    <span>${tr('+ Link da Decklist', '+ Decklist Link')}</span>
                  </button>
                `}
                <button type="button" data-toggle-deck-meta="1"
                  data-tip="${esc(dMeta.lastUpdated ? tr(`Última mudança na decklist: ${fmtDateDisp(dMeta.lastUpdated)}${dMeta.note ? ` · ${dMeta.note}` : ''}. Clique para editar o link ou a data.`, `Last decklist change: ${fmtDateDisp(dMeta.lastUpdated)}${dMeta.note ? ` · ${dMeta.note}` : ''}. Click to edit link or date.`) : tr('Marque a data da última mudança na decklist para comparar o desempenho antes e depois no gráfico.', 'Mark the last decklist change date to compare performance before and after on the chart.'))}"
                  class="nb-pill px-2.5 py-1.5 text-xs inline-flex items-center gap-1 ${state.showDeckMetaEditor ? 'nb-pill-active' : ''}">
                  <span>${dMeta.lastUpdated ? `${tr('Mudança', 'Updated')}: ${fmtDateDisp(dMeta.lastUpdated)}` : tr('+ Data de mudança', '+ Update Date')}</span>
                </button>
              </div>
              ${dMeta.url ? `
                <button type="button" data-toggle-deck-meta="1" data-tip="${esc(tr('Editar link da decklist ou data da última mudança.', 'Edit decklist link or last update date.'))}"
                  class="text-xs font-extrabold underline cursor-pointer">${state.showDeckMetaEditor ? tr('Fechar', 'Close') : tr('Editar', 'Edit')}</button>
              ` : ''}
            </div>

            ${dMeta.note && !state.showDeckMetaEditor ? `
              <div class="text-xs font-medium text-muted bg-[#F3ECE0] border border-[#4E3626] rounded-lg px-2.5 py-1.5">
                <strong>${tr('Último ajuste:', 'Latest tweak:')}</strong> ${esc(dMeta.note)}
              </div>
            ` : ''}

            ${state.showDeckMetaEditor ? `
              <div class="nb-subtle p-3 space-y-2.5">
                <div>
                  <label for="deck-meta-url" class="block text-xs font-extrabold mb-1">${tr('Link da Decklist (Moxfield, Archidekt, LigaMagic...)', 'Decklist Link (Moxfield, Archidekt, EDHREC...)')}</label>
                  <input id="deck-meta-url" type="url" value="${esc(dMeta.url || '')}" placeholder="https://moxfield.com/decks/..." class="w-full px-2.5 py-1.5 text-xs" />
                </div>
                <div>
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <label for="deck-meta-date" class="text-xs font-extrabold">${tr('Última mudança na decklist', 'Last decklist update')}</label>
                    <div class="flex items-center gap-1.5">
                      <button type="button" data-deck-meta-today="1" class="text-xs font-extrabold underline cursor-pointer">${tr('Hoje', 'Today')}</button>
                      <button type="button" data-deck-meta-clear-date="1" class="text-xs font-bold text-muted underline cursor-pointer">${tr('Limpar', 'Clear')}</button>
                    </div>
                  </div>
                  <input id="deck-meta-date" type="date" value="${esc(dMeta.lastUpdated || '')}" class="w-full px-2.5 py-1.5 text-xs" />
                </div>
                <div>
                  <label for="deck-meta-note" class="block text-xs font-extrabold mb-1">${tr('Nota da mudança', 'Update note')} <span class="font-medium text-muted">(${tr('opcional', 'optional')})</span></label>
                  <input id="deck-meta-note" type="text" value="${esc(dMeta.note || '')}" placeholder="${esc(tr('Ex.: Entrou Rhystic Study, ajustei base de mana...', 'e.g. Added Rhystic Study, tuned mana base...'))}" class="w-full px-2.5 py-1.5 text-xs" />
                </div>
                <div class="flex items-center justify-end gap-2 pt-0.5">
                  <button type="button" data-toggle-deck-meta="1" class="nb-btn px-2.5 py-1 text-xs">${tr('Cancelar', 'Cancel')}</button>
                  <button type="button" data-save-deck-meta="${esc(activeDeckObj.deck)}" class="nb-btn nb-btn-yellow px-3 py-1 text-xs">${tr('Salvar', 'Save')}</button>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="space-y-2">
            <button data-toggle-customizer="1" class="w-full nb-pill px-3 py-1.5 text-xs flex items-center justify-between ${state.showDeckCustomizer ? 'nb-pill-active' : ''}" data-tip="${esc(tr('Personalize o ícone temático e a cor da pasta deste deck (salvo no navegador).', 'Customize this deck\'s thematic icon and folder color (saved in browser).'))}">
              <span>${tr('Personalizar ícone e cor da pasta', 'Customize folder icon & color')}</span>
              <span>${state.showDeckCustomizer ? '▲' : '▼'}</span>
            </button>
            ${state.showDeckCustomizer ? `
              <div class="nb-subtle p-3 space-y-3">
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-extrabold">${tr('Cor da pasta', 'Folder color')}</span>
                    ${(customStyle.color || customStyle.icon) ? `<button data-reset-deck-style="${esc(activeDeckObj.deck)}" class="text-xs font-extrabold underline cursor-pointer" data-tip="${esc(tr('Volta o ícone e a cor para o modo automático por faixa de Win Rate.', 'Reset icon and color back to automatic Win Rate tier.'))}">${tr('Restaurar auto', 'Reset auto')}</button>` : ''}
                  </div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <button data-set-deck-color="auto" data-style-deck="${esc(activeDeckObj.deck)}" data-tip="${esc(tr('Automático: define a cor pela faixa de Win Rate do deck.', 'Automatic: sets color based on the deck\'s Win Rate tier.'))}"
                      class="nb-pill px-2 py-1 text-xs ${!customStyle.color ? 'nb-pill-active' : ''}">Auto</button>
                    ${PALETTE_OPTIONS.map(p => `
                      <button data-set-deck-color="${p.key}" data-style-deck="${esc(activeDeckObj.deck)}" data-tip="${esc(isEn() ? p.labelEn : p.label)}"
                        class="w-7 h-7 rounded-lg border-2 border-[#4E3626] cursor-pointer transition-transform hover:scale-105 ${customStyle.color === p.key ? 'ring-2 ring-[#4E3626] ring-offset-1 shadow-[2px_2px_0_#4E3626]' : ''}"
                        style="background:${p.color};"></button>
                    `).join('')}
                  </div>
                </div>

                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-extrabold">${tr('Ícone do deck', 'Deck icon')}</span>
                    <button data-set-deck-icon="auto" data-style-deck="${esc(activeDeckObj.deck)}" data-tip="${esc(tr('Voltar o ícone para o padrão automático por Win Rate.', 'Reset icon to automatic Win Rate tier.'))}"
                      class="nb-pill px-2 py-0.5 text-xs ${!customStyle.icon ? 'nb-pill-active' : ''}">Auto</button>
                  </div>
                  <div class="grid grid-cols-8 gap-1.5">
                    ${ICON_CATALOG.map(ic => {
                      const isActive = customStyle.icon === ic.key;
                      return `
                        <button data-set-deck-icon="${ic.key}" data-style-deck="${esc(activeDeckObj.deck)}" data-tip="${esc(isEn() ? ic.labelEn : ic.label)}"
                          class="h-8 rounded-lg border-2 border-[#4E3626] inline-flex items-center justify-center cursor-pointer transition-all ${isActive ? 'bg-[#F1D27A] shadow-[2px_2px_0_#4E3626]' : 'bg-[#FCF8F0] hover:bg-[#F1D27A]'}">
                          ${ICONS[ic.key]}
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="nb-subtle p-2" data-tip="${esc(ds.total ? tr(`Taxa de vitória geral com este deck: ${ds.w} vitória(s) em ${ds.total} partida(s) (taxa esperada pelas mesas: ${fmtPct(ds.expWr)}).`, `Overall win rate with this deck: ${ds.w} win(s) in ${ds.total} game(s) (expected pod baseline: ${fmtPct(ds.expWr)}).`) : tr('Nenhuma partida registrada com este deck ainda.', 'No matches recorded with this deck yet.'))}">
              <div class="text-xs font-bold text-muted">Win Rate</div>
              <div class="text-lg font-black tabular-nums ${ds.total ? wrClass(ds.wr) : 'text-muted'}">${ds.total ? fmtPct(ds.wr) : '—'}</div>
            </div>
            <div class="nb-subtle p-2" data-tip="${esc(ds.total ? tr(`Total de Vitórias–Derrotas${ds.d ? '–Empates' : ''} com este deck (${fmtRecord(ds.w, ds.l, ds.d)}).`, `Total Wins–Losses${ds.d ? '–Draws' : ''} with this deck (${fmtRecord(ds.w, ds.l, ds.d)}).`) : tr('Aguardando 1ª partida.', 'Awaiting 1st match.'))}">
              <div class="text-xs font-bold text-muted">${tr('Placar', 'Record')}</div>
              <div class="text-lg font-black tabular-nums">${ds.total ? `${ds.w}–${ds.l}${ds.d ? `–${ds.d}` : ''}` : '0–0'}</div>
            </div>
            <div class="nb-subtle p-2" data-tip="${esc(ds.total ? tr(`Maior sequência consecutiva de vitórias alcançada com este deck (pior sequência de derrotas: ${ds.worstLoss}D).`, `Longest consecutive win streak with this deck (worst loss streak: ${ds.worstLoss}L).`) : tr('Sem sequência ainda.', 'No streak yet.'))}">
              <div class="text-xs font-bold text-muted">Streak</div>
              <div class="text-lg font-black tabular-nums">${ds.total ? `${ds.bestWin}${resCodeDisp('V')}` : '—'}</div>
            </div>
          </div>

          ${deckTrajHtml}

          ${dm.length ? `
            <div class="space-y-1.5">
              <div class="text-xs font-extrabold" data-tip="${esc(tr('Separa o aproveitamento deste deck por quantidade de jogadores na mesa (1v1, 3 jogadores ou 4+ jogadores).', 'Breaks down this deck\'s win rate by pod size (1v1, 3-player, or 4+ players).'))}">${tr('Por Tamanho de Mesa', 'By Pod Size')}</div>
              <div class="grid grid-cols-3 gap-2">
                ${dPods.map(p => {
                  const pw = p.list.filter(x => x.res === 'V').length;
                  const pwr = p.list.length ? pw / p.list.length : null;
                  const pTip = esc(p.list.length
                    ? tr(`Aproveitamento com este deck em mesas ${p.label}: ${pw} vitória(s) em ${p.list.length} partida(s) (${fmtPct(pwr)}).`, `Win rate with this deck in ${p.label} pods: ${pw} win(s) in ${p.list.length} game(s) (${fmtPct(pwr)}).`)
                    : tr(`Nenhuma partida registrada com este deck em mesas ${p.label}.`, `No matches recorded with this deck in ${p.label} pods.`));
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

            <div class="space-y-1.5">
              <div class="text-xs font-extrabold" data-tip="${esc(tr('Velocidade média das partidas com este deck (em turnos), separando média geral, vitórias e derrotas.', 'Average game pace with this deck (in turns), split by overall, wins, and losses.'))}">${tr('Ritmo do Deck (Turnos)', 'Deck Pace (Turns)')}</div>
              ${!dt.count
                ? `<div class="nb-subtle px-2.5 py-2 text-xs text-muted font-medium" data-tip="${esc(tr('Preencha o campo Duração (Turnos) nos próximos reports deste deck para acompanhar a velocidade média dele.', 'Fill in Game Duration (Turns) on upcoming reports for this deck to track its average pace.'))}">${tr('Sem registro de turnos ainda neste deck.', 'No turn counts recorded for this deck yet.')}</div>`
                : `
                  <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="nb-subtle px-2 py-1.5 text-xs" data-tip="${esc(tr(`Duração média de todas as ${dt.count} partida(s) com registro de turnos neste deck (mín. ${dt.min}t · máx. ${dt.max}t).`, `Average duration across ${dt.count} game(s) with turn data for this deck (min ${dt.min}t · max ${dt.max}t).`))}">
                      <div class="font-bold text-muted">${tr('Média', 'Avg')}</div>
                      <div class="font-black tabular-nums mt-0.5">${fmtTurns(dt.avg)}</div>
                      <div class="text-muted font-semibold tabular-nums">${dt.count}${tr('j', 'g')}</div>
                    </div>
                    <div class="nb-subtle px-2 py-1.5 text-xs" data-tip="${esc(dt.winCount ? tr(`Turno médio em que este deck vence (${dt.winCount} vitória(s) com turnos).`, `Average winning turn for this deck (${dt.winCount} win(s) with turn data).`) : tr('Sem vitórias com turnos registrados ainda.', 'No wins with turn data yet.'))}">
                      <div class="font-bold text-muted">${tr('Vitórias', 'Wins')}</div>
                      <div class="font-black tabular-nums mt-0.5 ${dt.avgWin !== null ? 'wr-high' : ''}">${fmtTurns(dt.avgWin)}</div>
                      <div class="text-muted font-semibold tabular-nums">${dt.winCount}${resCodeDisp('V')}</div>
                    </div>
                    <div class="nb-subtle px-2 py-1.5 text-xs" data-tip="${esc(dt.lossCount ? tr(`Turno médio em que este deck perde (${dt.lossCount} derrota(s) com turnos).`, `Average losing turn for this deck (${dt.lossCount} loss(es) with turn data).`) : tr('Sem derrotas com turnos registrados ainda.', 'No losses with turn data yet.'))}">
                      <div class="font-bold text-muted">${tr('Derrotas', 'Losses')}</div>
                      <div class="font-black tabular-nums mt-0.5 ${dt.avgLoss !== null ? 'wr-low' : ''}">${fmtTurns(dt.avgLoss)}</div>
                      <div class="text-muted font-semibold tabular-nums">${dt.lossCount}${resCodeDisp('D')}</div>
                    </div>
                  </div>
                `}
            </div>

            <div class="space-y-1">
              <div class="text-xs font-extrabold" data-tip="${esc(tr('Jogadores mais enfrentados quando você pilotou este deck e o seu placar contra eles.', 'Most frequently faced players when piloting this deck and your record against them.'))}">${tr('Principais Oponentes', 'Top Opponents')}</div>
              ${dPlayers.length ? dPlayers.map(p => `
                <button data-jump-rival="${esc(p.player)}" data-tip="${esc(tr(`Seu histórico usando ${deckDisplayName(activeDeckObj.deck)} contra ${p.player}: ${fmtRecord(p.w, p.l, p.d)} (${fmtPct(p.wr)}). Clique para abrir o Raio-X de ${p.player}.`, `Your record piloting ${deckDisplayName(activeDeckObj.deck)} vs. ${p.player}: ${fmtRecord(p.w, p.l, p.d)} (${fmtPct(p.wr)}). Click to open ${p.player}'s Rival X-Ray.`))}" class="w-full flex items-center justify-between text-xs py-1 border-b border-[#DCCBAE] last:border-0 hover:bg-[#F3ECE0] rounded px-1 cursor-pointer text-left">
                  <span class="font-bold">${esc(p.player)}</span>
                  <span class="tabular-nums"><strong class="${wrClass(p.wr)}">${fmtPct(p.wr, 0)}</strong> <span class="text-muted font-semibold">(${fmtRecord(p.w, p.l, 0)})</span></span>
                </button>
              `).join('') : `<p class="text-xs text-muted">${tr('Sem oponentes nomeados.', 'No named opponents.')}</p>`}
            </div>

            <div class="space-y-1.5">
              <div class="text-xs font-extrabold">${tr(`Últimas ${Math.min(10, dm.length)} Partidas`, `Last ${Math.min(10, dm.length)} Matches`)}</div>
              <div class="flex items-center gap-1 flex-wrap">
                ${dm.slice(-10).map(m => {
                  const cls = m.res === 'V' ? 'badge-win' : (m.res === 'D' ? 'badge-loss' : 'badge-draw');
                  const tip = esc(`<strong>${m.id}</strong> (${matchDateLabel(m)})<br/>${tr('Mesa', 'Pod')} ${m.pod}P${m.turns ? ` · ${m.turns} ${tr('turnos', 'turns')}` : ''} · <strong>${resLabelOf(m.res)}</strong><br/>vs. ${oppDisplayStr(m.oppStr)}`);
                  return `<span class="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs ${cls}" data-tip="${tip}">${resCodeDisp(m.res)}</span>`;
                }).join('')}
              </div>
            </div>
          ` : `
            <div class="nb-subtle p-3 text-xs font-medium text-muted leading-relaxed">
              ${tr('Este deck está pronto na sua garagem! Assim que você registrar a 1ª partida com ele, os gráficos de Win Rate, ritmo em turnos, trajetória de decklist e rivais aparecerão aqui automaticamente.', 'This deck is ready on your shelf! As soon as you log its 1st match, win rate, turn pace, decklist trajectory, and rival charts will appear here automatically.')}
            </div>
          `}
        </div>
      </div>
    `;
  }

  const renderDeckTable = (list) => `
    <div class="nb-card overflow-hidden min-w-0">
      ${wrapHScroll(`
        <table class="w-full min-w-[600px] text-xs text-left border-collapse">
          <thead>
            <tr class="border-b-2 border-[#4E3626] bg-[#F1D27A]">
              <th class="py-2.5 px-3 sm:px-4 font-black whitespace-nowrap">Deck</th>
              <th class="py-2.5 px-3 font-black text-right whitespace-nowrap">${tr('Jogos', 'Games')}</th>
              <th class="py-2.5 px-3 font-black text-right whitespace-nowrap">${tr('V–D–E', 'W–L–D')}</th>
              <th class="py-2.5 px-3 sm:px-4 font-black min-w-[150px] whitespace-nowrap">Win Rate</th>
              ${showWeighted ? `<th class="py-2.5 px-3 font-black text-right whitespace-nowrap" data-tip="${esc(tr('Score Ponderado (limite inferior de Wilson a 90%): equilibra taxa de vitória e quantidade de jogos.', 'Weighted Score (90% Wilson lower bound): balances win rate and sample size.'))}">Score</th>` : ''}
              <th class="py-2.5 px-3 font-black text-right whitespace-nowrap">${tr('Últimos 5', 'Last 5')}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#DCCBAE]">
            ${list.map(d => {
              const isSel = activeDeckObj && activeDeckObj.deck === d.deck;
              const fav = isFavDeck(d.deck);
              const dispName = deckDisplayName(d.deck);
              const cInfo = getDeckCommanderInfo(d.deck);
              const cLbl = cInfo.partner && cInfo.cmd2 ? `${cInfo.cmd1} // ${cInfo.cmd2}` : cInfo.cmd1;
              const showSub = Boolean(cLbl && cLbl.toLowerCase() !== dispName.replace(/\s*\((?:emprestado|borrowed)\)/i, '').toLowerCase());
              return `
                <tr data-select-deck="${esc(d.deck)}" class="interactive-row cursor-pointer ${isSel ? 'bg-[#F3ECE0]' : ''}">
                  <td class="py-2.5 px-3 sm:px-4 font-bold">
                    <div class="flex items-center gap-2">
                      <button data-toggle-fav="${esc(d.deck)}" data-tip="${esc(fav ? tr('Remover dos favoritos', 'Remove from favorites') : tr('Favoritar deck', 'Favorite deck'))}"
                        class="w-6 h-6 rounded-md border-[1.5px] border-[#4E3626] inline-flex items-center justify-center text-xs font-black shrink-0 cursor-pointer ${fav ? 'bg-[#F1D27A] text-[#4E3626]' : 'bg-[#F3ECE0] text-[#745A46] hover:bg-[#F1D27A]'}">
                        ${fav ? '★' : '☆'}
                      </button>
                      <div>
                        <div>${esc(dispName)}</div>
                        ${showSub ? `<div class="text-xs font-medium text-muted">★ ${esc(cLbl)}</div>` : ''}
                      </div>
                    </div>
                  </td>
                  <td class="py-2.5 px-3 text-right tabular-nums font-black whitespace-nowrap">${d.games}</td>
                  <td class="py-2.5 px-3 text-right tabular-nums font-bold whitespace-nowrap">${d.games ? `${d.w}–${d.l}${d.d ? `–${d.d}` : ''}` : '—'}</td>
                  <td class="py-2.5 px-3 sm:px-4 whitespace-nowrap">
                    ${d.games ? `
                      <div class="flex items-center gap-2">
                        <div class="flex-1 min-w-[68px] h-2.5 rounded-full bg-[#F3ECE0] border border-[#4E3626] overflow-hidden">
                          <div class="h-full" style="width:${(d.wr * 100).toFixed(1)}%; background:${wrBarColor(d.wr)}"></div>
                        </div>
                        <span class="w-12 text-right font-black tabular-nums shrink-0 ${wrClass(d.wr)}">${fmtPct(d.wr)}</span>
                      </div>
                    ` : `<span class="text-xs font-bold text-muted">${tr('Novo (0 jogos)', 'New (0 games)')}</span>`}
                  </td>
                  ${showWeighted ? `<td class="py-2.5 px-3 text-right tabular-nums font-black whitespace-nowrap">${d.games ? fmtPct(d.wilson) : '—'}</td>` : ''}
                  <td class="py-2.5 px-3 text-right whitespace-nowrap">
                    <div class="inline-flex items-center gap-1 justify-end">
                      ${d.recent.length
                        ? d.recent.map(r => `<span class="inline-flex items-center justify-center w-5 h-5 rounded text-xs ${r === 'V' ? 'badge-win' : (r === 'D' ? 'badge-loss' : 'badge-draw')}">${resCodeDisp(r)}</span>`).join('')
                        : '<span class="text-muted">—</span>'}
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

  const renderDeckGroup = (list, honorable = false) =>
    state.deckView === 'cards'
      ? `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">${list.map(d => renderDeckFolderCard(d, activeDeckObj && activeDeckObj.deck === d.deck, 'select', { showWeighted, honorable })).join('')}</div>`
      : renderDeckTable(list);

  const visibleDeckSet = new Set(visibleDecks.map(d => d.deck));
  const favInVisible = Array.from(favoriteDecks).filter(d => visibleDeckSet.has(d)).length;

  return `
    <div class="nb-card-sm p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div class="flex items-center gap-2 flex-wrap">
        <button type="button" data-toggle-new-deck="1" class="nb-btn ${state.showNewDeckForm ? 'nb-btn-black' : 'nb-btn-yellow'} px-3 py-1.5 text-xs shrink-0">
          ${state.showNewDeckForm ? tr('Fechar ×', 'Close ×') : tr('+ Novo Deck', '+ New Deck')}
        </button>
        <input id="deck-search" type="search" value="${esc(state.deckSearch)}" placeholder="${esc(tr('Buscar deck ou comandante...', 'Search deck or commander...'))}" class="px-3 py-1.5 text-xs w-48" />
        <div class="flex items-center gap-1 text-xs">
          <span class="font-extrabold mr-1">${tr('Mín. jogos:', 'Min. games:')}</span>
          ${[0, 1, 3, 5, 10].map(n => `
            <button data-min-games="${n}" class="nb-pill px-2.5 py-1 text-xs ${state.deckMinGames === n ? 'nb-pill-active' : ''}">${n === 0 ? tr('Todos', 'All') : `${n}+`}</button>
          `).join('')}
        </div>
        <button data-toggle-fav-filter="1" class="nb-pill px-2.5 py-1 text-xs ${state.onlyFavorites ? 'nb-pill-active' : ''}">★ ${tr('Só Favoritos', 'Favorites Only')} (${favInVisible})</button>
      </div>
      <div class="flex items-center gap-2 flex-wrap text-xs">
        <div class="flex items-center gap-1">
          <button data-deck-view="cards" class="nb-pill px-2.5 py-1.5 text-xs ${state.deckView === 'cards' ? 'nb-pill-active' : ''}">${tr('Pastas', 'Folders')}</button>
          <button data-deck-view="table" class="nb-pill px-2.5 py-1.5 text-xs ${state.deckView === 'table' ? 'nb-pill-active' : ''}">${tr('Tabela', 'Table')}</button>
        </div>
        <select id="deck-sort" class="px-2.5 py-1.5 text-xs">
          <option value="games" ${state.deckSort === 'games' ? 'selected' : ''}>${tr('Mais jogados', 'Most played')}</option>
          <option value="wr" ${state.deckSort === 'wr' ? 'selected' : ''}>${tr('Maior Win Rate (5+ jogos)', 'Highest Win Rate (5+ games)')}</option>
          <option value="weighted" ${state.deckSort === 'weighted' ? 'selected' : ''}>${tr('Desempenho Ponderado (Wilson)', 'Weighted Performance (Wilson)')}</option>
          <option value="fav" ${state.deckSort === 'fav' ? 'selected' : ''}>${tr('★ Favoritos primeiro', '★ Favorites first')}</option>
          <option value="wins" ${state.deckSort === 'wins' ? 'selected' : ''}>${tr('Mais vitórias', 'Most wins')}</option>
          <option value="name" ${state.deckSort === 'name' ? 'selected' : ''}>${tr('Nome (A–Z)', 'Name (A–Z)')}</option>
        </select>
      </div>
    </div>

    ${renderNewDeckPanel()}

    ${showWeighted ? `
      <div class="nb-subtle px-4 py-2.5 text-xs font-medium flex items-start gap-2" data-tip="${esc(tr('Fórmula de Wilson (90% de confiança): calcula o piso estatístico da taxa de vitória, premiando decks que mantêm win rate alto em mais partidas e evitando que 1V–0D supere 14V–3D.', 'Wilson 90% lower bound: calculates the statistical win-rate floor, rewarding decks that sustain high win rates across more games instead of letting 1W–0L outrank 14W–3L.'))}">
        <span class="px-1.5 py-0.2 rounded badge-pop-yellow shrink-0">WILSON 90%</span>
        <span>${tr('Ordenando pelo <strong>Desempenho Ponderado (Win Rate × Volume)</strong>: decks consistentes com mais jogos prevalecem sobre amostras pequenas como 1V–0D.', 'Sorting by <strong>Weighted Performance (Win Rate × Volume)</strong>: consistent high-volume decks outrank tiny samples like 1W–0L.')}</span>
      </div>
    ` : ''}

    ${!visibleDecks.length ? `
      <div class="nb-card p-8 text-center space-y-3">
        <div class="text-base font-black">${tr('Nenhum deck encontrado para este filtro', 'No decks match this filter')}</div>
        <p class="text-xs font-medium text-muted">${tr('Ajuste o mínimo de jogos, a busca ou clique em "+ Novo Deck" para cadastrar um deck.', 'Adjust the min games filter, search term, or click "+ New Deck" to add a deck.')}</p>
        <button type="button" data-min-games="0" class="nb-btn nb-btn-yellow px-4 py-2 text-xs">${tr('Mostrar todos os decks', 'Show all decks')}</button>
      </div>
    ` : `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div class="lg:col-span-2 space-y-5 min-w-0">
          <div class="space-y-3">
            ${splitHonorable ? `
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-xs badge-win">${tr('5+ JOGOS', '5+ GAMES')}</span>
                  <h2 class="text-sm font-black">${tr('Ranking Principal', 'Main Ranking')} (${mainDecks.length} decks)</h2>
                </div>
                <span class="text-xs font-semibold text-muted" data-tip="${esc(tr('Decks com 5 ou mais partidas registradas aparecem primeiro por terem amostra estatística mais confiável.', 'Decks with 5 or more recorded matches rank first for a more reliable statistical sample.'))}">${tr('Amostra confiável', 'Reliable sample')}</span>
              </div>
            ` : ''}
            ${renderDeckGroup(mainDecks, false)}
          </div>

          ${honorableDecks.length ? `
            <div class="space-y-3 pt-3 border-t-2 border-dashed border-[#4E3626]">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-xs badge-pop-purple">${tr('MENÇÕES HONROSAS', 'HONORABLE MENTIONS')}</span>
                  <h2 class="text-sm font-black">${tr(`Amostra Pequena · menos de 5 jogos (${honorableDecks.length} decks)`, `Small Sample · under 5 games (${honorableDecks.length} decks)`)}</h2>
                </div>
                <span class="text-xs font-semibold text-muted" data-tip="${esc(tr('Estes decks têm menos de 5 partidas. Continuam visíveis, mas separados do Ranking Principal até atingirem 5 jogos.', 'These decks have under 5 recorded games. They stay visible, separated from the Main Ranking until reaching 5 games.'))}">${tr('Menos de 5 partidas', 'Under 5 games')}</span>
              </div>
              ${renderDeckGroup(honorableDecks, true)}
            </div>
          ` : ''}

          ${playedDecks.length ? `
            <div class="nb-card p-4">
              <div class="mb-2">
                <h2 class="text-sm font-black">${tr('Mapa de Desempenho: Volume × Win Rate', 'Performance Map: Volume × Win Rate')}</h2>
                <p class="text-xs font-medium text-muted">${tr('Clique em qualquer bolha para abrir o Raio-X ao lado', 'Click any bubble to open its X-Ray')}</p>
              </div>
              <svg viewBox="0 0 ${SW} ${SH}" class="w-full h-auto overflow-visible">
                ${[0, 0.25, 0.5, 0.75, 1].map(f => {
                  const y = spT + sPlotH * (1 - f);
                  return `
                    <line x1="${spL}" y1="${y}" x2="${SW - spR}" y2="${y}" stroke="#4E3626" stroke-opacity="${f === 0.5 ? '0.6' : '0.12'}" stroke-width="${f === 0.5 ? '1.8' : '1'}" stroke-dasharray="${f === 0.5 ? '5,5' : '2,3'}" />
                    <text x="${spL - 6}" y="${y + 4}" text-anchor="end" fill="#745A46" font-size="11" font-weight="700">${Math.round(f * 100)}%</text>
                  `;
                }).join('')}
                ${xTicks.map(v => {
                  const x = spL + (v / xMax) * sPlotW;
                  return `
                    <line x1="${x}" y1="${spT}" x2="${x}" y2="${spT + sPlotH}" stroke="#4E3626" stroke-opacity="0.1" stroke-dasharray="2,3" />
                    <text x="${x}" y="${SH - 12}" text-anchor="middle" fill="#745A46" font-size="11" font-weight="700">${v}</text>
                  `;
                }).join('')}
                ${bubbles}
              </svg>
            </div>
          ` : ''}
        </div>

        <div id="deck-xray" class="lg:sticky lg:top-4 scroll-mt-4">${xrayHtml}</div>
      </div>
    `}
  `;
}
