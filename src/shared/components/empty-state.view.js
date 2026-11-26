import { state, getActiveFormat } from '../../core/state/store.js';
import { isEn, tr } from '../../core/i18n/i18n.service.js';
import { getAllMatches, getMatches, getFormatMatches } from '../../core/data/matches.repository.js';
import { favoriteDecks } from '../utils/deck-style.service.js';
import { esc } from '../utils/formatters.js';

export function renderEmptyState() {
  const activeFmt = getActiveFormat();
  const matches = getMatches();
  const totalAcrossAll = getAllMatches().length;

  if (matches.length === 0) {
    const cmdCount = getFormatMatches('commander').length;
    const isFreshUser = totalAcrossAll === 0;
    const enActive = isEn();
    return `
      <div class="nb-card p-6 sm:p-9 text-center space-y-4 max-w-2xl mx-auto">
        <div class="flex items-center justify-center gap-2 flex-wrap">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs badge-pop-purple">
            ${esc(activeFmt.badge)}
          </div>
          ${isFreshUser ? `
            <div class="inline-flex items-center gap-1" role="group" aria-label="${esc(tr('Idioma', 'Language'))}">
              <button type="button" data-set-lang="pt"
                class="nb-pill px-2.5 py-0.5 text-xs ${!enActive ? 'nb-pill-active' : ''}">Português</button>
              <button type="button" data-set-lang="en"
                class="nb-pill px-2.5 py-0.5 text-xs ${enActive ? 'nb-pill-active' : ''}">English</button>
            </div>
          ` : ''}
        </div>

        ${isFreshUser ? `
          <div class="nb-subtle p-4 sm:p-5 text-left space-y-2 max-w-xl mx-auto">
            <div class="text-sm font-black leading-snug text-[#4E3626]">
              ${esc(tr(
                'E aí, eu sou o Mat! Se você chegou até aqui, ou é um dos meus amigos que recebeu o link ou alguém curioso! De qualquer forma, bem-vindo(a)!',
                "Hey, I'm Mat! If you're here, you are one of my friends who got the link or a curious person! Either way, welcome!"
              ))}
            </div>
            <p class="text-xs font-medium text-muted leading-relaxed">
              ${tr(
                'Criei este app para você <strong>analisar suas estatísticas como jogador de Magic</strong>, <strong>cadastrar e organizar os seus decks</strong>, se divertir no caminho e <strong>se comparar com os seus amigos</strong> — acompanhando win rate, ritmo das mesas, rivais e quem realmente manda no playgroup.',
                'I built this app so you can <strong>analyze your stats as a Magic player</strong>, <strong>add and organize your own decks</strong>, have fun along the way, and <strong>compare your numbers with your friends</strong> — tracking win rates, game pace, rivalries, and who really runs the table.'
              )}
            </p>
            <div class="pt-2.5 mt-1 border-t border-[#DCCBAE] flex flex-col sm:flex-row sm:items-center gap-2">
              ${state.playerName ? `
                <div class="flex items-center justify-between gap-2 w-full flex-wrap text-xs">
                  <span class="font-extrabold text-[#4E3626]">✓ ${esc(tr(`Jogando como ${state.playerName}`, `Playing as ${state.playerName}`))}</span>
                  <button type="button" id="btn-edit-player-name" class="font-extrabold underline cursor-pointer">${tr('Alterar nome', 'Change name')}</button>
                </div>
              ` : `
                <label for="welcome-player-name-input" class="text-xs font-extrabold text-[#4E3626] shrink-0">
                  ${tr('Como você se chama?', "What's your name?")}
                </label>
                <div class="flex items-center gap-1.5 flex-1">
                  <input id="welcome-player-name-input" type="text" maxlength="40"
                    placeholder="${esc(tr('Seu nome ou apelido (aparece no topo e nos prints)...', 'Your name or nickname (shown in header & screenshots)...'))}"
                    class="flex-1 px-2.5 py-1.5 text-xs bg-[#FCF8F0]" />
                  <button type="button" id="btn-save-welcome-player-name" class="nb-btn nb-btn-yellow px-3 py-1.5 text-xs shrink-0">${tr('Salvar', 'Save')}</button>
                </div>
              `}
            </div>
          </div>
        ` : ''}

        <div class="space-y-2 pt-1">
          <div class="text-xl font-black leading-snug">
            ${esc(isFreshUser
              ? tr('Comece a registrar seu legado no Magic.', 'Start tracking your Magic legacy.')
              : tr(`Nenhuma partida registrada em ${activeFmt.pt} ainda`, `No matches recorded in ${activeFmt.en} yet`)
            )}
          </div>
          <p class="text-xs font-medium text-muted leading-relaxed max-w-md mx-auto">
            ${isFreshUser
              ? tr(
                  `Todas as partidas, decks, cores e estatísticas ficam salvas <strong>direto no seu navegador</strong> — sem precisar criar conta. Você pode fazer backup em <code>.json</code> a qualquer momento no <strong>Hub de Dados</strong>.`,
                  `All matches, decks, mana colors, and stats are saved <strong>directly in your browser</strong> — no account required. Export a <code>.json</code> backup anytime from the <strong>Data Hub</strong>.`
                )
              : tr(
                  `Cada formato funciona como um <strong>perfil independente</strong>: seus decks, oponentes, gráficos e histórico de <strong>${esc(activeFmt.pt)}</strong> ficam separados dos outros formatos.`,
                  `Each format works as an <strong>independent profile</strong>: your decks, opponents, charts, and history for <strong>${esc(activeFmt.en)}</strong> stay separate from other formats.`
                )}
          </p>
        </div>

        <div class="flex items-center justify-center gap-2.5 flex-wrap pt-1">
          <button type="button" data-open-new-deck="1" class="nb-btn nb-btn-yellow px-4 py-2 text-xs">
            ${esc(tr('+ Cadastrar meus Decks', '+ Register my Decks'))}
          </button>
          <button type="button" data-tab="report" class="nb-btn px-4 py-2 text-xs">
            ${esc(tr('+ Registrar 1ª partida', '+ Log 1st match'))}
          </button>
          ${isFreshUser ? `
            <button type="button" id="btn-load-demo-matches" class="nb-btn nb-btn-green px-4 py-2 text-xs">
              ${esc(tr('★ Ver com 10 partidas de exemplo', '★ Preview with 10 sample matches'))}
            </button>
            <button type="button" id="btn-import-backup-json" class="nb-btn px-3.5 py-2 text-xs">
              ${esc(tr('↑ Importar Backup (.json)', '↑ Import Backup (.json)'))}
            </button>
          ` : ''}
          ${activeFmt.key !== 'commander' && cmdCount > 0 ? `
            <button type="button" data-set-format="commander" class="nb-btn px-4 py-2 text-xs">
              ${esc(tr(`Voltar para Commander (${cmdCount})`, `Back to Commander (${cmdCount})`))}
            </button>
          ` : ''}
        </div>
        ${isFreshUser ? `
          <div class="nb-subtle p-3 text-xs font-medium text-muted max-w-lg mx-auto leading-relaxed">
            ${tr(
              '<strong>Dica no celular:</strong> adicione esta página à <strong>Tela Inicial</strong> para usar como aplicativo e manter seus dados protegidos no Safari/Chrome.',
              '<strong>Mobile tip:</strong> add this page to your <strong>Home Screen</strong> to use it as an app and keep browser storage safe on Safari/Chrome.'
            )}
          </div>
        ` : ''}
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
