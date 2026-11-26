import { getActiveFormat } from '../../core/state/store.js';
import { isEn, tr, fmtRecord, fmtNum } from '../../core/i18n/i18n.service.js';
import { deckDisplayName, getDeckColorIdentity } from '../../shared/utils/deck-style.service.js';
import { esc, fmtPct, wrClass } from '../../shared/utils/formatters.js';
import { renderManaIdentityHtml } from '../../shared/components/mana-identity.view.js';
import { renderEmptyState } from '../../shared/components/empty-state.view.js';
import { wrapHScroll } from '../../shared/components/hscroll-table.js';
import { SEAT_BENCHMARKS, PERFORMANCE_SOURCES } from './performance.data.js';
import {
  classify1v1Tier,
  classify4pTier,
  deltaBadgeCls,
  deltaTxtCls,
  computePerformanceModel
} from './performance.service.js';

export function renderPerformance(filtered) {
  const activeFmt = getActiveFormat();

  const referenceBlockHtml = `
    <div class="nb-card overflow-hidden min-w-0">
      <div class="p-4 pb-3 border-b-2 border-[#4E3626] bg-[#FCF8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 class="text-sm font-black">${tr('Tabela de Referência — Taxas de Vitória no Magic', 'Benchmark Reference Table — Magic Win Rates')}</h2>
          <p class="text-xs font-medium text-muted">${tr('Faixas empíricas consolidadas para 1v1 e Commander Multiplayer (4P)', 'Consolidated empirical ranges for 1v1 and 4-Player Commander')}</p>
        </div>
        <span class="px-2 py-0.5 rounded-md text-xs badge-neutral self-start sm:self-auto">${tr('Fontes verificadas', 'Verified sources')}</span>
      </div>
      ${wrapHScroll(`
        <table class="w-full min-w-[680px] text-xs text-left border-collapse">
          <thead>
            <tr class="border-b-2 border-[#4E3626] bg-[#F1D27A]">
              <th class="py-2.5 px-4 font-black whitespace-nowrap">${tr('Nível / Perfil', 'Skill Tier / Profile')}</th>
              <th class="py-2.5 px-3 font-black whitespace-nowrap">${tr('1v1 (Construído / Limitado)', '1v1 (Constructed / Limited)')}</th>
              <th class="py-2.5 px-3 font-black whitespace-nowrap">${tr('Commander 4P (Mesão)', '4P Commander Pod')}</th>
              <th class="py-2.5 px-4 font-black">${tr('Leitura Prática', 'Practical Takeaway')}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#DCCBAE]">
            <tr>
              <td class="py-2.5 px-4 font-black whitespace-nowrap">
                <span class="px-2 py-0.5 rounded-md badge-pop-yellow">${tr('Casual / Média', 'Casual / Average')}</span>
              </td>
              <td class="py-2.5 px-3 font-extrabold tabular-nums whitespace-nowrap">45% – 52%</td>
              <td class="py-2.5 px-3 font-extrabold tabular-nums whitespace-nowrap">20% – 30% <span class="text-muted font-semibold">(${tr('base 25%', '25% base')})</span></td>
              <td class="py-2.5 px-4 font-medium text-muted">${tr('Soma zero natural (50% em 1v1 · 25% em 4P). Faixa saudável em grupos equilibrados.', 'Natural zero-sum baseline (50% in 1v1 · 25% in 4P). Healthy range for balanced pods.')}</td>
            </tr>
            <tr>
              <td class="py-2.5 px-4 font-black whitespace-nowrap">
                <span class="px-2 py-0.5 rounded-md badge-win">${tr('Intermediário (Leão de Lojinha)', 'LGS Regular / Grinder')}</span>
              </td>
              <td class="py-2.5 px-3 font-extrabold tabular-nums whitespace-nowrap">55% – 65% <span class="text-muted font-semibold">(${tr('até 70%+ em FNM misto', '70%+ vs. mixed FNM')})</span></td>
              <td class="py-2.5 px-3 font-extrabold tabular-nums whitespace-nowrap">30% – 40%</td>
              <td class="py-2.5 px-4 font-medium text-muted">${tr('Estuda metagame, otimiza curva/interações e domina mesas locais; acima de 35–40% em 4P indica vantagem forte de deck ou pilotagem.', 'Studies meta, tightens lists & sequencing; sustained 35–40%+ in 4P signals strong skill or power-level edge.')}</td>
            </tr>
            <tr>
              <td class="py-2.5 px-4 font-black whitespace-nowrap">
                <span class="px-2 py-0.5 rounded-md text-xs font-extrabold border border-[#4E3626]" style="background:#4A5530; color:#FCF8F0">${tr('Profissional / Elite', 'Pro / Hall of Fame')}</span>
              </td>
              <td class="py-2.5 px-3 font-extrabold tabular-nums whitespace-nowrap">60% – 67% <span class="text-muted font-semibold">(${tr('contra pares no PT', 'vs. PT peers')})</span></td>
              <td class="py-2.5 px-3 font-extrabold tabular-nums whitespace-nowrap">${tr('cEDH: 1º assento ~30–34%', 'cEDH: Seat 1 ~30–34%')}</td>
              <td class="py-2.5 px-4 font-medium text-muted">${tr('No Pro Tour (contra a elite mundial), a variância de terrenos/compras limita até lendas do Hall da Fama a ~65–68% no longo prazo.', 'At Pro Tour level against world-class peers, land/draw variance caps even Hall of Famers near ~65–68% long-term.')}</td>
            </tr>
          </tbody>
        </table>
      `)}
      <div class="p-4 bg-[#F3ECE0] border-t-2 border-[#DCCBAE] space-y-2">
        <div class="text-xs font-black uppercase tracking-wider text-muted">${tr('Fontes Confiáveis', 'Trusted Sources')}</div>
        <div class="flex flex-wrap gap-1.5">
          ${PERFORMANCE_SOURCES.map(src => `
            <a href="${esc(src.url)}" target="_blank" rel="noopener noreferrer"
              data-tip="${esc(isEn() ? src.descEn : src.descPt)}"
              class="px-2.5 py-1 rounded-lg text-xs font-bold border border-[#4E3626] bg-[#FCF8F0] hover:bg-[#F1D27A] text-[#4E3626] inline-flex items-center gap-1 transition">
              <span>${esc(src.name)}</span><span class="text-muted">↗</span>
            </a>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  if (!filtered.length) {
    return `${renderEmptyState()}${referenceBlockHtml}`;
  }

  const { sAll, s1v1, s3p, s4p, effDecks, usedMin5, insights, seatMap, seatTotalLogged } = computePerformanceModel(filtered);

  const pos1v1 = Math.max(2, Math.min(98, (s1v1.wr / 0.85) * 100));
  const tier1v1 = classify1v1Tier(s1v1.wr);
  const gauge1v1Html = `
    <div class="nb-folder">
      <div class="nb-folder-tab" style="background:#C8CF7A"></div>
      <div class="nb-folder-body p-4 sm:p-5 space-y-3.5">
        <div class="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <span class="px-2 py-0.5 rounded-md text-xs badge-neutral">1v1 (2P)</span>
            <h3 class="text-base font-black mt-1">${tr('Régua de Nível — 1v1', 'Skill Benchmark — 1v1')}</h3>
          </div>
          ${s1v1.total ? `
            <span class="px-2.5 py-1 rounded-md text-xs font-black border border-[#4E3626]" style="background:${tier1v1.bg}; color:${tier1v1.fg}">
              ${esc(isEn() ? tier1v1.en : tier1v1.pt)}
            </span>
          ` : `<span class="px-2 py-0.5 rounded-md text-xs badge-neutral">${tr('Sem jogos 1v1', 'No 1v1 games')}</span>`}
        </div>

        ${s1v1.total ? `
          <div class="flex items-baseline justify-between gap-2 flex-wrap">
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-black tabular-nums ${wrClass(s1v1.wr)}">${fmtPct(s1v1.wr)}</span>
              <span class="text-xs font-bold text-muted tabular-nums">${fmtRecord(s1v1.w, s1v1.l, s1v1.d)} · ${s1v1.total} ${tr('jogos', 'games')}</span>
            </div>
            <span class="px-2 py-0.5 rounded-md text-xs tabular-nums ${deltaBadgeCls(s1v1.delta * 100)}">
              ${s1v1.delta >= 0 ? '+' : ''}${fmtNum(s1v1.delta * 100, 1)} pp ${tr('vs. 50%', 'vs. 50%')}
            </span>
          </div>

          <div class="pt-5 pb-1 relative">
            <div class="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none" style="left:${pos1v1.toFixed(1)}%">
              <span class="px-1.5 py-0.2 rounded text-xs font-black bg-[#4E3626] text-[#FCF8F0] whitespace-nowrap tabular-nums">${tr('Você', 'You')} · ${fmtPct(s1v1.wr, 0)}</span>
            </div>
            <div class="relative h-4 rounded-full border-2 border-[#4E3626] overflow-hidden flex bg-[#DCCBAE]">
              <div style="width:52.9%; background:#DCCBAE" data-tip="${esc(tr('0–45%: Em desenvolvimento', '0–45%: Developing'))}"></div>
              <div style="width:11.8%; background:#F1D27A" data-tip="${esc(tr('45–55%: Casual / Média geral (base 50%)', '45–55%: Casual / Field average (50% base)'))}"></div>
              <div style="width:11.8%; background:#C8CF7A" data-tip="${esc(tr('55–65%: Intermediário / Leão de Lojinha', '55–65%: LGS Regular / Strong Grinder'))}"></div>
              <div style="width:23.5%; background:#4A5530" data-tip="${esc(tr('65%+: Topo de loja (ou faixa Pro Tour contra pares)', '65%+: LGS shark (or Pro Tour tier vs. peers)'))}"></div>
              <div class="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-[#4E3626]" style="left:58.8%" data-tip="${esc(tr('Linha neutra justa 1v1: 50%', 'Fair 1v1 baseline: 50%'))}"></div>
              <div class="absolute top-0 bottom-0 w-1 bg-[#4E3626]" style="left:${pos1v1.toFixed(1)}%"></div>
            </div>
            <div class="flex justify-between text-xs font-bold text-muted tabular-nums mt-1.5">
              <span>0%</span><span>45%</span><span>55%</span><span>65%</span><span>85%</span>
            </div>
          </div>
          <p class="text-xs font-medium text-muted leading-relaxed">
            *${tr('A faixa Pro Tour (60–67%) é medida contra outros profissionais. Em lojas/FNM ou entre amigos, jogadores experientes podem superar 65–70%.', 'The Pro Tour tier (60–67%) is measured against world-class peers. At local FNM or friend pods, seasoned regulars can exceed 65–70%.')}
          </p>
        ` : `
          <div class="nb-subtle p-4 text-xs font-medium text-muted">
            ${tr('Nenhuma partida 1v1 registrada neste recorte.', 'No 1v1 matches recorded in this filter.')}
          </div>
        `}
      </div>
    </div>
  `;

  const pos4p = Math.max(2, Math.min(98, (s4p.wr / 0.55) * 100));
  const tier4p = classify4pTier(s4p.wr);
  const gauge4pHtml = `
    <div class="nb-folder">
      <div class="nb-folder-tab" style="background:#F1D27A"></div>
      <div class="nb-folder-body p-4 sm:p-5 space-y-3.5">
        <div class="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <span class="px-2 py-0.5 rounded-md text-xs badge-neutral">4+P ${tr('Mesão', 'Multiplayer')}</span>
            <h3 class="text-base font-black mt-1">${tr('Régua de Nível — Commander 4P', 'Skill Benchmark — 4P Commander')}</h3>
          </div>
          ${s4p.total ? `
            <span class="px-2.5 py-1 rounded-md text-xs font-black border border-[#4E3626]" style="background:${tier4p.bg}; color:${tier4p.fg}">
              ${esc(isEn() ? tier4p.en : tier4p.pt)}
            </span>
          ` : `<span class="px-2 py-0.5 rounded-md text-xs badge-neutral">${tr('Sem jogos 4+P', 'No 4+P games')}</span>`}
        </div>

        ${s4p.total ? `
          <div class="flex items-baseline justify-between gap-2 flex-wrap">
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-black tabular-nums ${deltaTxtCls(s4p.delta * 100)}">${fmtPct(s4p.wr)}</span>
              <span class="text-xs font-bold text-muted tabular-nums">${fmtRecord(s4p.w, s4p.l, s4p.d)} · ${s4p.total} ${tr('jogos', 'games')}</span>
            </div>
            <span class="px-2 py-0.5 rounded-md text-xs tabular-nums ${deltaBadgeCls(s4p.delta * 100)}">
              ${s4p.delta >= 0 ? '+' : ''}${fmtNum(s4p.delta * 100, 1)} pp ${tr('vs. esperado', 'vs. exp.')}
            </span>
          </div>

          <div class="pt-5 pb-1 relative">
            <div class="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none" style="left:${pos4p.toFixed(1)}%">
              <span class="px-1.5 py-0.2 rounded text-xs font-black bg-[#4E3626] text-[#FCF8F0] whitespace-nowrap tabular-nums">${tr('Você', 'You')} · ${fmtPct(s4p.wr, 0)}</span>
            </div>
            <div class="relative h-4 rounded-full border-2 border-[#4E3626] overflow-hidden flex bg-[#DCCBAE]">
              <div style="width:36.4%; background:#DCCBAE" data-tip="${esc(tr('0–20%: Abaixo da média justa', '0–20%: Below fair share'))}"></div>
              <div style="width:18.2%; background:#F1D27A" data-tip="${esc(tr('20–30%: Casual saudável (base justa 25%)', '20–30%: Healthy casual pod (25% fair share)'))}"></div>
              <div style="width:18.2%; background:#C8CF7A" data-tip="${esc(tr('30–40%: Otimizado / Leão de Lojinha em 4P', '30–40%: Optimized / strong 4P regular'))}"></div>
              <div style="width:27.2%; background:#D7653A" data-tip="${esc(tr('40%+: Outlier / possível desequilíbrio de power level', '40%+: Outlier / potential power-level mismatch'))}"></div>
              <div class="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-[#4E3626]" style="left:45.5%" data-tip="${esc(tr('Linha neutra justa 4P: 25%', 'Fair 4P baseline: 25%'))}"></div>
              <div class="absolute top-0 bottom-0 w-1 bg-[#4E3626]" style="left:${pos4p.toFixed(1)}%"></div>
            </div>
            <div class="flex justify-between text-xs font-bold text-muted tabular-nums mt-1.5">
              <span>0%</span><span>20%</span><span>25%</span><span>30%</span><span>40%</span><span>55%</span>
            </div>
          </div>
          <p class="text-xs font-medium text-muted leading-relaxed">
            ${tr('Em mesões 4P equilibrados (EDHREC / Playgroup.gg), 20%–30% é a zona saudável; superar 35–40% em 30+ jogos costuma indicar forte vantagem de power level ou experiência.', 'In balanced 4P pods (EDHREC / Playgroup.gg), 20%–30% is the healthy zone; exceeding 35–40% over 30+ games usually signals strong power-level or skill advantage.')}
          </p>
        ` : `
          <div class="nb-subtle p-4 text-xs font-medium text-muted">
            ${tr('Nenhuma partida 4+P registrada neste recorte.', 'No 4+P matches recorded in this filter.')}
          </div>
        `}
      </div>
    </div>
  `;

  const pod3BannerHtml = s3p.total ? `
    <div class="nb-card-sm px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap bg-[#FCF8F0]">
      <div class="flex items-center gap-2 flex-wrap text-xs">
        <span class="px-2 py-0.5 rounded-md badge-pop-purple">3P</span>
        <span class="font-extrabold">${tr('Mesas de 3 Jogadores:', '3-Player Pods:')}</span>
        <span class="font-black tabular-nums ${deltaTxtCls(s3p.delta * 100)}">${fmtPct(s3p.wr)}</span>
        <span class="text-muted font-semibold tabular-nums">(${fmtRecord(s3p.w, s3p.l, s3p.d)} · ${s3p.total} ${tr('jogos', 'games')})</span>
      </div>
      <span class="px-2 py-0.5 rounded-md text-xs tabular-nums ${deltaBadgeCls(s3p.delta * 100)}">
        ${s3p.delta >= 0 ? '+' : ''}${fmtNum(s3p.delta * 100, 1)} pp ${tr('vs. 33,3% esperado', 'vs. 33.3% expected')}
      </span>
    </div>
  ` : '';

  return `
    <div class="space-y-5">
      <div class="grid grid-cols-1 ${activeFmt.cmdFormat || s4p.total ? 'lg:grid-cols-2' : ''} gap-4">
        ${gauge1v1Html}
        ${(activeFmt.cmdFormat || s4p.total) ? gauge4pHtml : ''}
      </div>

      ${pod3BannerHtml}

      <div class="space-y-2.5">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <h2 class="text-sm font-black">${tr('Diagnóstico & Insights Automáticos', 'Automated Diagnostics & Insights')}</h2>
          <span class="text-xs font-semibold text-muted">${tr('Atualiza automaticamente conforme seus filtros e perfil ativo', 'Updates dynamically with your active filters and format profile')}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${insights.map(ins => `
            <div class="nb-card-sm p-4 space-y-1.5 flex flex-col justify-between">
              <div class="space-y-1.5">
                <span class="inline-block px-2 py-0.5 rounded-md text-xs font-black border border-[#4E3626]" style="background:${ins.accent}; color:#4E3626">${esc(ins.tag)}</span>
                <div class="text-sm font-black leading-snug">${esc(ins.title)}</div>
                <p class="text-xs font-medium text-muted leading-relaxed">${ins.body}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div class="nb-card overflow-hidden lg:col-span-8 min-w-0">
          <div class="p-4 pb-3 border-b-2 border-[#4E3626] bg-[#FCF8F0] flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h2 class="text-sm font-black">${tr('Eficiência Real por Deck (Ajustada pelo Tamanho de Mesa)', 'True Deck Efficiency (Pod-Size Adjusted)')}</h2>
              <p class="text-xs font-medium text-muted">${tr('Elimina o viés entre 1v1 (50%) e 4P (25%) ordenando pelo saldo Δ vs. Esperado · Clique no deck para abrir o Raio-X', 'Removes 1v1 (50%) vs. 4P (25%) bias by ranking on Δ vs. Expected · Click any deck to open X-Ray')}</p>
            </div>
            <span class="px-2 py-0.5 rounded-md text-xs badge-neutral">${usedMin5 ? tr('5+ jogos', '5+ games') : tr('Todos os decks', 'All decks')}</span>
          </div>
          ${wrapHScroll(`
            <table class="w-full min-w-[640px] text-xs text-left border-collapse">
              <thead>
                <tr class="border-b-2 border-[#4E3626] bg-[#F1D27A]">
                  <th class="py-2.5 px-3 sm:px-4 font-black whitespace-nowrap">Deck</th>
                  <th class="py-2.5 px-2.5 font-black whitespace-nowrap">${tr('Mix de Mesas', 'Pod Mix')}</th>
                  <th class="py-2.5 px-2.5 font-black text-right whitespace-nowrap">${tr('WR Real', 'Actual WR')}</th>
                  <th class="py-2.5 px-2.5 font-black text-right whitespace-nowrap">${tr('Esperado', 'Expected')}</th>
                  <th class="py-2.5 px-3 sm:px-4 font-black text-right whitespace-nowrap">${tr('Δ Real (pp)', 'True Δ (pp)')}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#DCCBAE]">
                ${effDecks.map(d => {
                  const cols = getDeckColorIdentity(d.deck);
                  const manaHtml = cols.length ? renderManaIdentityHtml(cols, { size: 'sm' }) : '';
                  const mixParts = [];
                  if (d.c2) mixParts.push(`${d.c2}×1v1`);
                  if (d.c3) mixParts.push(`${d.c3}×3P`);
                  if (d.c4) mixParts.push(`${d.c4}×4+P`);
                  return `
                    <tr data-jump-deck="${esc(d.deck)}" class="interactive-row cursor-pointer" data-tip="${esc(tr(`<strong>${deckDisplayName(d.deck)}</strong><br/>${fmtRecord(d.w, d.l, d.d)} em ${d.games} jogos · WR ${fmtPct(d.wr)} vs. Esperado ${fmtPct(d.expWr)} (${d.deltaPP >= 0 ? '+' : ''}${fmtNum(d.deltaPP, 1)} pp).<br/><em>Clique para abrir o Raio-X</em>`, `<strong>${deckDisplayName(d.deck)}</strong><br/>${fmtRecord(d.w, d.l, d.d)} in ${d.games} games · WR ${fmtPct(d.wr)} vs. Expected ${fmtPct(d.expWr)} (${d.deltaPP >= 0 ? '+' : ''}${fmtNum(d.deltaPP, 1)} pp).<br/><em>Click to open X-Ray</em>`))}">
                      <td class="py-2.5 px-3 sm:px-4 font-extrabold">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span>${esc(deckDisplayName(d.deck))}</span>
                          ${manaHtml}
                        </div>
                      </td>
                      <td class="py-2.5 px-2.5 text-muted font-semibold tabular-nums whitespace-nowrap">${mixParts.join(' · ')}</td>
                      <td class="py-2.5 px-2.5 text-right font-black tabular-nums whitespace-nowrap">${fmtPct(d.wr)}</td>
                      <td class="py-2.5 px-2.5 text-right font-semibold text-muted tabular-nums whitespace-nowrap">${fmtPct(d.expWr)}</td>
                      <td class="py-2.5 px-3 sm:px-4 text-right whitespace-nowrap">
                        <span class="px-2 py-0.5 rounded-md tabular-nums ${deltaBadgeCls(d.deltaPP)}">
                          ${d.deltaPP >= 0 ? '+' : ''}${fmtNum(d.deltaPP, 1)} pp
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `)}
        </div>

        <div class="nb-folder lg:col-span-4">
          <div class="nb-folder-tab" style="background:#E2A64B"></div>
          <div class="nb-folder-body p-4 space-y-3.5">
            <div>
              <span class="px-2 py-0.5 rounded-md text-xs badge-neutral">Playgroup.gg · 600k+ 4P</span>
              <h3 class="text-sm font-black mt-1">${tr('Ordem de Jogada vs. Benchmark', 'Seat Order vs. Benchmark')}</h3>
              <p class="text-xs font-medium text-muted mt-0.5">
                ${tr(`Você registrou ordem em <strong>${seatTotalLogged}</strong> de ${sAll.total} partidas.`, `Turn order logged in <strong>${seatTotalLogged}</strong> of ${sAll.total} matches.`)}
              </p>
            </div>

            <div class="space-y-2.5">
              ${SEAT_BENCHMARKS.map(sb => {
                const mine = seatMap.get(sb.seat);
                const myWr = mine && mine.n ? mine.w / mine.n : null;
                return `
                  <div class="nb-subtle p-2.5 space-y-1.5" data-tip="${esc(tr(`${sb.pt}: referência global 4P de ${fmtPct(sb.ref)} (Playgroup.gg).${myWr !== null ? ` Seu histórico: ${mine.w}/${mine.n} (${fmtPct(myWr)}).` : ' Sem partidas registradas nesta posição ainda.'}`, `${sb.en}: 4P global reference ${fmtPct(sb.ref)} (Playgroup.gg).${myWr !== null ? ` Your record: ${mine.w}/${mine.n} (${fmtPct(myWr)}).` : ' No matches logged in this seat yet.'}`))}">
                    <div class="flex items-center justify-between gap-2 text-xs">
                      <span class="font-black">${esc(isEn() ? sb.en : sb.pt)}</span>
                      <span class="tabular-nums font-bold text-muted">
                        ${tr('Ref.', 'Ref.')}: <strong class="text-[#4E3626]">${fmtPct(sb.ref)}</strong>
                        ${myWr !== null ? ` · ${tr('Você', 'You')}: <strong class="${wrClass(myWr)}">${fmtPct(myWr, 0)}</strong> (${mine.w}/${mine.n})` : ''}
                      </span>
                    </div>
                    <div class="h-2.5 rounded-full bg-[#FCF8F0] border border-[#4E3626] overflow-hidden relative">
                      <div class="h-full" style="width:${Math.min(100, sb.ref * 250).toFixed(1)}%; background:#E2A64B"></div>
                      <div class="absolute top-0 bottom-0 w-0.5 border-l border-dashed border-[#4E3626]" style="left:62.5%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <p class="text-xs font-medium text-muted leading-relaxed">
              ${tr('Ir em 1º no Commander 4P gera quase +8 pp de vantagem sobre ir em 4º (29,1% vs. 21,5%). Continue preenchendo a <strong>Ordem de Jogada</strong> no Reportar para comparar sua própria curva!', 'Going 1st in 4P Commander yields nearly +8 pp over going 4th (29.1% vs. 21.5%). Keep logging <strong>Turn Order</strong> in Report to build your personal curve!')}
            </p>
          </div>
        </div>
      </div>

      ${referenceBlockHtml}
    </div>
  `;
}
