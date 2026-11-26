import { state } from '../../core/state/store.js';
import { tr, resLabelOf, resCodeDisp, fmtRecord, fmtNum, oppDisplayStr } from '../../core/i18n/i18n.service.js';
import { ICONS } from '../../shared/constants/icons.js';
import { favoriteDecks, deckMeta, deckDisplayName } from '../../shared/utils/deck-style.service.js';
import { calcStats, calcTurnStats, groupDecks, groupPlayers } from '../../shared/utils/stats.utils.js';
import { esc, fmtPct, fmtTurns, wrClass, wrBarColor, fmtDateDisp, fmtShortDateBr, matchDateLabel } from '../../shared/utils/formatters.js';
import { renderDeckFolderCard } from '../../shared/components/deck-folder-card.view.js';
import { renderEmptyState } from '../../shared/components/empty-state.view.js';
import { updateHeaderScope } from '../../shared/components/header.view.js';
import { buildMonthlySeries, buildCumulativeSeries } from './overview.service.js';

export function renderKPIs(filtered) {
  const s = calcStats(filtered);
  const decks = groupDecks(filtered);
  const players = groupPlayers(filtered);

  let eligible = decks.filter(d => d.games >= 5);
  if (!eligible.length) eligible = decks.filter(d => d.games >= 2);
  if (!eligible.length) eligible = decks;
  const topDeck = eligible.slice().sort((a, b) => (b.wr - a.wr) || (b.games - a.games))[0] || null;
  const topRival = players.slice().sort((a, b) => b.games - a.games)[0] || null;

  const deltaPP = fmtNum(s.delta * 100, 1);
  const deltaSign = s.delta >= 0 ? '+' : '';
  updateHeaderScope(filtered);

  const kpi1Tip = esc(tr(
    `<strong>Total de Partidas</strong><br/>${s.total} partidas no recorte atual distribuídas entre ${decks.length} decks: ${s.w} vitória(s), ${s.l} derrota(s)${s.d ? ` e ${s.d} empate(s)` : ''}.`,
    `<strong>Total Matches</strong><br/>${s.total} matches in the current filter across ${decks.length} decks: ${s.w} win(s), ${s.l} loss(es)${s.d ? ` and ${s.d} draw(s)` : ''}.`
  ));
  const kpi2Tip = esc(s.total
    ? tr(
        `<strong>Taxa de Vitória Global</strong><br/>Você venceu ${fmtPct(s.wr)} das partidas (${s.w}/${s.total}), ficando <strong>${deltaSign}${deltaPP} pontos percentuais</strong> ${s.delta >= 0 ? 'acima' : 'abaixo'} da probabilidade base de vitória (${fmtPct(s.expWr)}) para o tamanho real das mesas jogadas.`,
        `<strong>Global Win Rate</strong><br/>You won ${fmtPct(s.wr)} of games (${s.w}/${s.total}), which is <strong>${deltaSign}${deltaPP} percentage points</strong> ${s.delta >= 0 ? 'above' : 'below'} the base win probability (${fmtPct(s.expWr)}) for the pod sizes played.`
      )
    : tr('Taxa de vitória no recorte filtrado.', 'Win rate in the current filter.'));
  const kpi3Tip = esc(tr(
    `<strong>Sequências (Streaks)</strong><br/>Melhor sequência: <strong>${s.bestWin} vitória(s) seguidas</strong>.<br/>Pior sequência: <strong>${s.worstLoss} derrota(s) seguidas</strong>.<br/>Sequência atual: <strong>${s.currentStreakLabel}</strong>.`,
    `<strong>Streaks</strong><br/>Best streak: <strong>${s.bestWin} consecutive win(s)</strong>.<br/>Worst streak: <strong>${s.worstLoss} consecutive loss(es)</strong>.<br/>Current streak: <strong>${s.currentStreakLabel}</strong>.`
  ));
  const kpi4Tip = esc(topDeck
    ? tr(
        `<strong>Deck Destaque (${deckDisplayName(topDeck.deck)})</strong><br/>Maior taxa de vitória entre seus decks qualificados (mín. 5 jogos quando disponível): ${fmtPct(topDeck.wr)} (${fmtRecord(topDeck.w, topDeck.l, topDeck.d)} em ${topDeck.games} jogos).<br/><em>Clique para abrir o Raio-X deste deck</em>`,
        `<strong>Top Deck (${deckDisplayName(topDeck.deck)})</strong><br/>Highest win rate among qualified decks (5+ games when available): ${fmtPct(topDeck.wr)} (${fmtRecord(topDeck.w, topDeck.l, topDeck.d)} across ${topDeck.games} games).<br/><em>Click to open this deck's X-Ray</em>`
      )
    : tr('Nenhum deck no recorte atual.', 'No decks in the current filter.'));
  const kpi5Tip = esc(topRival
    ? tr(
        `<strong>Maior Rival (${topRival.player})</strong><br/>Jogador mais enfrentado neste recorte: ${topRival.games} mesas (${fmtRecord(topRival.w, topRival.l, topRival.d)} · ${fmtPct(topRival.wr)} de win rate).<br/><em>Clique para abrir o Raio-X do Rival na aba Oponentes</em>`,
        `<strong>Biggest Rival (${topRival.player})</strong><br/>Most faced opponent in this filter: ${topRival.games} games (${fmtRecord(topRival.w, topRival.l, topRival.d)} · ${fmtPct(topRival.wr)} win rate).<br/><em>Click to open Rival X-Ray in Opponents</em>`
      )
    : tr('Nenhum oponente nomeado no recorte atual.', 'No named opponent in the current filter.'));

  const strip = document.getElementById('kpi-strip');
  if (!strip) return;
  strip.innerHTML = `
    <div class="nb-folder" data-tip="${kpi1Tip}">
      <div class="nb-folder-tab" style="background:#E2A64B"></div>
      <div class="nb-folder-body p-3.5 flex flex-col justify-between gap-2.5">
        <div class="flex items-start gap-2.5">
          <div class="nb-icon-box" style="background:#E2A64B; color:#4E3626">${ICONS.folder}</div>
          <div class="min-w-0">
            <div class="text-xs font-bold text-muted">${decks.length} decks</div>
            <div class="text-2xl font-black tabular-nums leading-tight">${s.total}</div>
          </div>
        </div>
        <div class="flex items-center justify-between gap-1 flex-wrap pt-1 border-t-2 border-[#F3ECE0]">
          <span class="text-xs font-extrabold">${tr('Partidas', 'Matches')}</span>
          <div class="flex items-center gap-1 text-xs tabular-nums">
            <span class="px-1.5 py-0.2 rounded badge-win">${s.w}${resCodeDisp('V')}</span>
            <span class="px-1.5 py-0.2 rounded badge-loss">${s.l}${resCodeDisp('D')}</span>
            ${s.d ? `<span class="px-1.5 py-0.2 rounded badge-draw">${s.d}${resCodeDisp('E')}</span>` : ''}
          </div>
        </div>
      </div>
    </div>

    <div class="nb-folder" data-tip="${kpi2Tip}">
      <div class="nb-folder-tab" style="background:#C8CF7A"></div>
      <div class="nb-folder-body p-3.5 flex flex-col justify-between gap-2.5">
        <div class="flex items-start gap-2.5">
          <div class="nb-icon-box" style="background:#C8CF7A; color:#4E3626">${ICONS.bolt}</div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-bold text-muted" data-tip="${esc(tr('Probabilidade base de vitória (1/N) calculada pelo tamanho real das mesas jogadas.', 'Base win probability (1/N) based on the pod sizes played.'))}">${tr('Prob.', 'Prob.')} ${s.total ? fmtPct(s.expWr, 0) : '—'}</span>
              ${s.total ? `<span class="px-1.5 py-0.2 rounded text-xs ${s.delta >= 0 ? 'badge-win' : 'badge-loss'}" data-tip="${esc(tr(`Diferença em pontos percentuais em relação à probabilidade de vitória (${fmtPct(s.expWr)}) calculada como 1/N para cada mesa jogada.`, `Percentage-point difference vs. win probability (${fmtPct(s.expWr)}) calculated as 1/N per pod.`))}">${deltaSign}${deltaPP}pp</span>` : ''}
            </div>
            <div class="text-2xl font-black tabular-nums leading-tight">${s.total ? fmtPct(s.wr) : '—'}</div>
          </div>
        </div>
        <div class="pt-1 border-t-2 border-[#F3ECE0] space-y-1">
          <div class="w-full h-2.5 rounded-full bg-[#F3ECE0] border-2 border-[#4E3626] overflow-hidden">
            <div class="h-full" style="width:${(s.wr * 100).toFixed(1)}%; background:${wrBarColor(s.wr)}"></div>
          </div>
          <div class="text-xs font-extrabold">${tr('Taxa de Vitória', 'Win Rate')}</div>
        </div>
      </div>
    </div>

    <div class="nb-folder" data-tip="${kpi3Tip}">
      <div class="nb-folder-tab" style="background:#F1D27A"></div>
      <div class="nb-folder-body p-3.5 flex flex-col justify-between gap-2.5">
        <div class="flex items-start gap-2.5">
          <div class="nb-icon-box" style="background:#F1D27A; color:#4E3626">${ICONS.flame}</div>
          <div class="min-w-0">
            <div class="text-xs font-bold text-muted">${tr('Pior', 'Worst')}: ${s.worstLoss}${resCodeDisp('D')}</div>
            <div class="text-2xl font-black tabular-nums leading-tight">${s.bestWin}${resCodeDisp('V')}</div>
          </div>
        </div>
        <div class="flex items-center justify-between gap-1 pt-1 border-t-2 border-[#F3ECE0]">
          <span class="text-xs font-extrabold">${tr('Melhor Streak', 'Best Streak')}</span>
          <span class="px-1.5 py-0.2 rounded text-xs ${s.currentStreakType === 'win' ? 'badge-win' : s.currentStreakType === 'loss' ? 'badge-loss' : 'badge-draw'}">${esc(s.currentStreakLabel)}</span>
        </div>
      </div>
    </div>

    <div ${topDeck ? `data-jump-deck="${esc(topDeck.deck)}"` : ''} data-tip="${kpi4Tip}" class="nb-folder nb-folder-clickable">
      <div class="nb-folder-tab" style="background:#D7653A"></div>
      <div class="nb-folder-body p-3.5 flex flex-col justify-between gap-2.5">
        <div class="flex items-start gap-2.5">
          <div class="nb-icon-box" style="background:#D7653A; color:#F3ECE0">${ICONS.crown}</div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-bold text-muted">${topDeck ? `${topDeck.games} ${tr(topDeck.games === 1 ? 'jogo' : 'jogos', topDeck.games === 1 ? 'game' : 'games')}` : '—'}</span>
              <span class="px-1.5 py-0.2 rounded text-xs badge-pop-pink">TOP</span>
            </div>
            <div class="text-xl font-black tabular-nums leading-tight">${topDeck ? fmtPct(topDeck.wr) : '—'}</div>
          </div>
        </div>
        <div class="pt-1 border-t-2 border-[#F3ECE0]">
          <div class="text-xs font-extrabold leading-snug">${topDeck ? esc(deckDisplayName(topDeck.deck)) : '—'}</div>
        </div>
      </div>
    </div>

    <div ${topRival ? `data-jump-rival="${esc(topRival.player)}"` : ''} data-tip="${kpi5Tip}" class="nb-folder nb-folder-clickable col-span-2 lg:col-span-1">
      <div class="nb-folder-tab" style="background:#E2A64B"></div>
      <div class="nb-folder-body p-3.5 flex flex-col justify-between gap-2.5">
        <div class="flex items-start gap-2.5">
          <div class="nb-icon-box" style="background:#E2A64B; color:#4E3626">${ICONS.heart}</div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-bold text-muted">${topRival ? `${topRival.games} ${tr('mesas', 'games')}` : '—'}</span>
              <span class="px-1.5 py-0.2 rounded text-xs badge-pop-purple">${tr('RAIO-X', 'X-RAY')}</span>
            </div>
            <div class="text-xl font-black tabular-nums leading-tight">${topRival ? fmtPct(topRival.wr) : '—'}</div>
          </div>
        </div>
        <div class="flex items-center justify-between gap-1 pt-1 border-t-2 border-[#F3ECE0]">
          <span class="text-xs font-extrabold truncate">Rival: ${topRival ? esc(topRival.player) : '—'}</span>
          <span class="text-xs font-bold text-muted tabular-nums">${topRival ? `${topRival.w}–${topRival.l}` : ''}</span>
        </div>
      </div>
    </div>
  `;
}

export function renderOverview(filtered) {
  if (!filtered.length) return renderEmptyState();

  const monthly = buildMonthlySeries(filtered);
  const maxM = Math.max(1, ...monthly.map(m => m.total));
  const chartMode = state.monthlyChartMode === 'volume' ? 'volume' : 'wr';
  const hasMonthlyDraws = monthly.some(m => m.d > 0);

  const W = 720, H = 240, padL = 40, padR = 18, padT = 24, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const stepX = plotW / monthly.length;
  const barW = Math.min(36, stepX * 0.56);

  let monthlySvgContent = '';
  if (chartMode === 'volume') {
    const volTicks = [0, 0.25, 0.5, 0.75, 1];
    const gridLines = volTicks.map(frac => {
      const y = padT + plotH * (1 - frac);
      return `
        <line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#4E3626" stroke-opacity="${frac === 0 ? '0.9' : '0.14'}" stroke-width="${frac === 0 ? '2' : '1'}" stroke-dasharray="${frac === 0 ? '' : '4,4'}" />
        <text x="${padL - 8}" y="${y + 4}" text-anchor="end" fill="#745A46" font-size="11" font-weight="700">${Math.round(maxM * frac)}</text>
      `;
    }).join('');

    const barsSvg = monthly.map((m, idx) => {
      const cx = padL + stepX * idx + stepX / 2;
      const bx = cx - barW / 2;
      const hW = (m.w / maxM) * plotH;
      const hD = (m.d / maxM) * plotH;
      const hL = (m.l / maxM) * plotH;
      const yW = padT + plotH - hW;
      const yD = yW - hD;
      const yL = yD - hL;
      const topY = m.total > 0 ? yL : (padT + plotH);
      const tip = esc(tr(
        `<strong>${m.name}</strong><br/>Partidas: <strong>${m.total}</strong><br/>Vitórias: ${m.w} · Derrotas: ${m.l}${m.d ? ` · Empates: ${m.d}` : ''}<br/>Taxa de Vitória: <strong>${m.wr !== null ? fmtPct(m.wr) : '—'}</strong><br/><em>Clique para filtrar</em>`,
        `<strong>${m.name}</strong><br/>Matches: <strong>${m.total}</strong><br/>Wins: ${m.w} · Losses: ${m.l}${m.d ? ` · Draws: ${m.d}` : ''}<br/>Win Rate: <strong>${m.wr !== null ? fmtPct(m.wr) : '—'}</strong><br/><em>Click to filter</em>`
      ));
      const isSel = state.month !== 'all' && Number(state.month) === idx;
      return `
        <g class="cursor-pointer" data-click-month="${idx}" data-tip="${tip}">
          <rect x="${bx - 5}" y="${padT}" width="${barW + 10}" height="${plotH}" rx="6" fill="${isSel ? '#F1D27A' : 'transparent'}" fill-opacity="${isSel ? '0.45' : '0'}" />
          ${m.w ? `<rect x="${bx}" y="${yW}" width="${barW}" height="${hW}" rx="3" fill="#C8CF7A" stroke="#4E3626" stroke-width="1.8" />` : ''}
          ${m.d ? `<rect x="${bx}" y="${yD}" width="${barW}" height="${hD}" fill="#F1D27A" stroke="#4E3626" stroke-width="1.8" />` : ''}
          ${m.l ? `<rect x="${bx}" y="${yL}" width="${barW}" height="${hL}" rx="3" fill="#D7653A" stroke="#4E3626" stroke-width="1.8" />` : ''}
          ${m.total > 0 ? `<text x="${cx}" y="${Math.max(13, topY - 6).toFixed(1)}" text-anchor="middle" fill="#4E3626" font-weight="800" font-size="11">${m.total}</text>` : ''}
          <text x="${cx}" y="${H - 9}" text-anchor="middle" fill="#4E3626" font-weight="${isSel ? '900' : '700'}" font-size="11">${m.short}</text>
        </g>
      `;
    }).join('');
    monthlySvgContent = `${gridLines}${barsSvg}`;
  } else {
    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(frac => {
      const y = padT + plotH * (1 - frac);
      const isHalf = frac === 0.5;
      return `
        <line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#4E3626" stroke-opacity="${frac === 0 ? '0.9' : (isHalf ? '0.45' : '0.14')}" stroke-width="${frac === 0 ? '2' : (isHalf ? '1.5' : '1')}" stroke-dasharray="${frac === 0 ? '' : (isHalf ? '5,4' : '3,4')}" />
        <text x="${padL - 8}" y="${y + 4}" text-anchor="end" fill="#745A46" font-size="11" font-weight="700">${Math.round(frac * 100)}%</text>
      `;
    }).join('');

    const linePts = [];
    const monthCols = monthly.map((m, idx) => {
      const cx = padL + stepX * idx + stepX / 2;
      const bx = cx - barW / 2;
      const isSel = state.month !== 'all' && Number(state.month) === idx;
      if (m.wr !== null) linePts.push({ x: cx, y: padT + plotH * (1 - m.wr), m });
      const tip = esc(tr(
        `<strong>${m.name}</strong><br/>Taxa de Vitória: <strong>${m.wr !== null ? fmtPct(m.wr) : '—'}</strong> (${m.w}V–${m.l}D${m.d ? `–${m.d}E` : ''} em ${m.total} jogos)<br/><em>Clique para filtrar</em>`,
        `<strong>${m.name}</strong><br/>Win Rate: <strong>${m.wr !== null ? fmtPct(m.wr) : '—'}</strong> (${m.w}W–${m.l}L${m.d ? `–${m.d}D` : ''} in ${m.total} games)<br/><em>Click to filter</em>`
      ));
      return `
        <g class="cursor-pointer" data-click-month="${idx}" data-tip="${tip}">
          <rect x="${bx - 5}" y="${padT}" width="${barW + 10}" height="${plotH}" rx="6" fill="${isSel ? '#F1D27A' : 'transparent'}" fill-opacity="${isSel ? '0.42' : '0'}" />
          <text x="${cx}" y="${H - 9}" text-anchor="middle" fill="#4E3626" font-weight="${isSel ? '900' : '700'}" font-size="11">${m.short}</text>
        </g>
      `;
    }).join('');

    const areaPath = linePts.length > 1
      ? `<path d="M ${linePts[0].x.toFixed(1)},${(padT + plotH).toFixed(1)} L ${linePts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')} L ${linePts[linePts.length - 1].x.toFixed(1)},${(padT + plotH).toFixed(1)} Z" fill="#C8CF7A" fill-opacity="0.22" />`
      : '';
    const linePath = linePts.length > 1
      ? `<path d="${linePts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')}" fill="none" stroke="#4E3626" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`
      : '';
    const lineDots = linePts.map(p => {
      const tip = esc(tr(
        `<strong>${p.m.name}</strong><br/>Taxa de Vitória: <strong>${fmtPct(p.m.wr)}</strong> (${p.m.w}/${p.m.total} jogos)<br/><em>Clique para filtrar</em>`,
        `<strong>${p.m.name}</strong><br/>Win Rate: <strong>${fmtPct(p.m.wr)}</strong> (${p.m.w}/${p.m.total} games)<br/><em>Click to filter</em>`
      ));
      const lblY = p.y < padT + 18 ? p.y + 18 : p.y - 10;
      return `
        <g class="cursor-pointer" data-click-month="${p.m.i}" data-tip="${tip}">
          <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="6" fill="${wrBarColor(p.m.wr)}" stroke="#4E3626" stroke-width="2.2" />
          <text x="${p.x.toFixed(1)}" y="${lblY.toFixed(1)}" text-anchor="middle" fill="#4E3626" font-weight="800" font-size="10.5">${Math.round(p.m.wr * 100)}%</text>
        </g>
      `;
    }).join('');
    monthlySvgContent = `${gridLines}${monthCols}${areaPath}${linePath}${lineDots}`;
  }

  const podBuckets = [
    { key: '2', label: tr('1v1 (Duelo)', '1v1 (Duel)'), exp: 0.50, color: '#C8CF7A', list: filtered.filter(m => m.pod === 2) },
    { key: '3', label: tr('Mesa de 3 Jog.', '3-Player Pod'), exp: 1 / 3, color: '#F1D27A', list: filtered.filter(m => m.pod === 3) },
    { key: '4+', label: tr('Mesa de 4+ Jog.', '4+ Player Pod'), exp: 0.25, color: '#EC8B33', list: filtered.filter(m => m.pod >= 4) }
  ];

  const cumPts = buildCumulativeSeries(filtered);
  const CW = 680, CH = 168, cpL = 38, cpR = 14, cpT = 24, cpB = 24;
  const cPlotW = CW - cpL - cpR, cPlotH = CH - cpT - cpB;
  const cPointsStr = cumPts.map((pt, i) => {
    const x = cpL + (cumPts.length === 1 ? cPlotW / 2 : (i / (cumPts.length - 1)) * cPlotW);
    const y = cpT + cPlotH * (1 - pt.wr);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const cLinePath = cumPts.length > 1 ? `M ${cPointsStr.join(' L ')}` : '';
  const cAreaPath = cumPts.length > 1 ? `M ${cpL},${cpT + cPlotH} L ${cPointsStr.join(' L ')} L ${(cpL + cPlotW).toFixed(1)},${cpT + cPlotH} Z` : '';

  // Temporal deck-update milestones along the cumulative win-rate curve
  const decksInView = Array.from(new Set(filtered.map(m => m.deck)));
  const updatesByDate = new Map();
  for (const dk of decksInView) {
    const dm = deckMeta[dk];
    if (dm && dm.lastUpdated) {
      if (!updatesByDate.has(dm.lastUpdated)) updatesByDate.set(dm.lastUpdated, []);
      updatesByDate.get(dm.lastUpdated).push({ deck: dk, name: deckDisplayName(dk), note: dm.note || '' });
    }
  }
  const cumMilestoneEntries = Array.from(updatesByDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const cMilestonesSvg = cumMilestoneEntries.map(([updIso, items]) => {
    const isAfterUpdate = m => {
      if (m.date) return m.date >= updIso;
      const mYM = `${m.year || '2026'}-${String(m.monthIdx + 1).padStart(2, '0')}`;
      return mYM > updIso.slice(0, 7);
    };
    let splitIdx = cumPts.findIndex(pt => isAfterUpdate(pt.m));
    if (splitIdx === -1) splitIdx = cumPts.length;
    const xOfIdx = idx => cpL + (cumPts.length === 1 ? cPlotW / 2 : (idx / (cumPts.length - 1)) * cPlotW);
    let mx = CW - cpR;
    if (splitIdx === 0) mx = cpL;
    else if (splitIdx < cumPts.length) mx = (xOfIdx(splitIdx - 1) + xOfIdx(splitIdx)) / 2;

    const shortU = fmtShortDateBr(updIso);
    const badgeLbl = items.length === 1 && state.deck !== 'all'
      ? tr(`⚑ Atualiz. ${shortU}`, `⚑ Updated ${shortU}`)
      : `⚑ ${shortU}${items.length > 1 ? ` (${items.length})` : ''}`;
    const pillW = Math.max(54, badgeLbl.length * 5.8 + 10);
    const pillH = 16;
    const pillX = Math.max(cpL, Math.min((CW - cpR) - pillW, mx - pillW / 2));
    const pillY = 2;
    const lines = items.map(it => `• <strong>${it.name}</strong>${it.note ? ` — ${it.note}` : ''}`).join('<br/>');
    const tip = esc(tr(
      `<strong>⚑ Atualização de Decklist (${fmtDateDisp(updIso)})</strong><br/>${lines}`,
      `<strong>⚑ Decklist Update (${fmtDateDisp(updIso)})</strong><br/>${lines}`
    ));
    return `
      <g class="cursor-pointer" data-tip="${tip}" data-tip-instant="1">
        <line x1="${mx.toFixed(1)}" y1="${cpT - 3}" x2="${mx.toFixed(1)}" y2="${cpT + cPlotH}" stroke="#D7653A" stroke-width="2" stroke-dasharray="4,3" />
        <polygon points="${mx.toFixed(1)},${cpT - 4} ${(mx + 4).toFixed(1)},${cpT} ${mx.toFixed(1)},${cpT + 4} ${(mx - 4).toFixed(1)},${cpT}" fill="#D7653A" stroke="#4E3626" stroke-width="1.2" />
        <rect x="${pillX.toFixed(1)}" y="${pillY}" width="${pillW.toFixed(1)}" height="${pillH}" rx="4" fill="#D7653A" stroke="#4E3626" stroke-width="1.3" />
        <text x="${(pillX + pillW / 2).toFixed(1)}" y="${pillY + pillH / 2 + 0.5}" text-anchor="middle" dominant-baseline="central" fill="#FCF8F0" font-size="9" font-weight="900">${esc(badgeLbl)}</text>
      </g>
    `;
  }).join('');

  const stepHover = Math.max(1, Math.floor(cumPts.length / 45));
  const cHoverCircles = cumPts.filter((_, i) => i % stepHover === 0 || i === cumPts.length - 1).map(pt => {
    const i = pt.idx - 1;
    const x = cpL + (cumPts.length === 1 ? cPlotW / 2 : (i / (cumPts.length - 1)) * cPlotW);
    const y = cpT + cPlotH * (1 - pt.wr);
    const tip = esc(tr(
      `<strong>Partida #${pt.idx} (${pt.m.id})</strong><br/>${matchDateLabel(pt.m)} · ${deckDisplayName(pt.m.deck)}<br/>Resultado: <strong>${resLabelOf(pt.m.res)}</strong><br/>Taxa de Vitória acumulada: <strong>${fmtPct(pt.wr)}</strong>`,
      `<strong>Match #${pt.idx} (${pt.m.id})</strong><br/>${matchDateLabel(pt.m)} · ${deckDisplayName(pt.m.deck)}<br/>Result: <strong>${resLabelOf(pt.m.res)}</strong><br/>Cumulative Win Rate: <strong>${fmtPct(pt.wr)}</strong>`
    ));
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="transparent" data-tip="${tip}" data-tip-instant="1" class="cursor-crosshair" />`;
  }).join('');

  const recent20 = filtered.slice(-20);
  const allFilteredDecks = groupDecks(filtered);
  const topDecks = allFilteredDecks.slice().sort((a, b) => b.games - a.games).slice(0, 6);
  const topPlayers = groupPlayers(filtered).sort((a, b) => b.games - a.games).slice(0, 6);
  const maxPlayerGames = Math.max(1, ...topPlayers.map(p => p.games));
  const profileDeckSet = new Set(allFilteredDecks.map(d => d.deck));
  const favInFiltered = Array.from(favoriteDecks).filter(d => profileDeckSet.has(d)).length;

  const ts = calcTurnStats(filtered);
  const podTurnBuckets = [
    { label: '1v1', list: filtered.filter(m => m.pod === 2) },
    { label: '3P', list: filtered.filter(m => m.pod === 3) },
    { label: '4+P', list: filtered.filter(m => m.pod >= 4) }
  ].map(b => ({ label: b.label, stats: calcTurnStats(b.list) }));

  return `
    <section class="space-y-3">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 class="text-lg font-black tracking-tight">${state.onlyFavorites ? tr('★ Meus Decks Favoritos', '★ My Favorite Decks') : tr('Meus Principais Decks', 'My Top Decks')}</h2>
          <p class="text-xs font-semibold text-muted">${tr('Clique na estrela ☆ para favoritar ou na pasta para abrir o Raio-X', 'Click the ☆ star to favorite or any folder to open its X-Ray')}</p>
        </div>
        <div class="flex items-center gap-2">
          <button data-toggle-fav-filter="1" class="nb-btn ${state.onlyFavorites ? 'nb-btn-yellow' : ''} px-3 py-1.5 text-xs">★ ${tr('Favoritos', 'Favorites')} (${favInFiltered})</button>
          <button data-goto-tab="decks" class="nb-btn px-3 py-1.5 text-xs">${tr('Ver todos', 'View all')} (${allFilteredDecks.length}) →</button>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${topDecks.map(d => renderDeckFolderCard(d, false, 'jump')).join('')}
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="nb-card p-4 lg:col-span-2 flex flex-col justify-between space-y-2">
        <div class="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h2 class="text-sm font-black">${chartMode === 'volume' ? tr('Volume Mensal (Vitórias &amp; Derrotas)', 'Monthly Volume (Wins &amp; Losses)') : tr('Taxa de Vitória Mensal', 'Monthly Win Rate')}</h2>
            <p class="text-xs font-medium text-muted">${tr('Clique em qualquer mês para filtrar o painel', 'Click any month to filter the dashboard')}</p>
          </div>
          <div class="flex items-center gap-1.5" role="group" aria-label="${esc(tr('Alternar gráfico mensal', 'Switch monthly chart'))}">
            <button type="button" data-monthly-chart="wr" class="nb-pill px-2.5 py-1 text-xs ${chartMode === 'wr' ? 'nb-pill-active' : ''}">${tr('Taxa de Vitória', 'Win Rate')}</button>
            <button type="button" data-monthly-chart="volume" class="nb-pill px-2.5 py-1 text-xs ${chartMode === 'volume' ? 'nb-pill-active' : ''}">${tr('Volume (V/D)', 'Volume (W/L)')}</button>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 text-xs font-bold flex-wrap">
          ${chartMode === 'volume' ? `
            <span class="inline-flex items-center gap-1"><span class="w-3 h-3 rounded-sm inline-block border border-[#4E3626]" style="background:#C8CF7A"></span>${tr('Vitórias', 'Wins')}</span>
            <span class="inline-flex items-center gap-1"><span class="w-3 h-3 rounded-sm inline-block border border-[#4E3626]" style="background:#D7653A"></span>${tr('Derrotas', 'Losses')}</span>
            ${hasMonthlyDraws ? `<span class="inline-flex items-center gap-1"><span class="w-3 h-3 rounded-sm inline-block border border-[#4E3626]" style="background:#F1D27A"></span>${tr('Empates', 'Draws')}</span>` : ''}
          ` : `
            <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full inline-block border border-[#4E3626]" style="background:#C8CF7A"></span>≥55%</span>
            <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full inline-block border border-[#4E3626]" style="background:#F1D27A"></span>40–54%</span>
            <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full inline-block border border-[#4E3626]" style="background:#D7653A"></span>&lt;40%</span>
          `}
        </div>
        <svg viewBox="0 0 ${W} ${H}" class="w-full h-auto overflow-visible">
          ${monthlySvgContent}
        </svg>
      </div>

      <div class="nb-card p-4 flex flex-col justify-between space-y-3">
        <div>
          <h2 class="text-sm font-black">${tr('Desempenho por Mesa', 'Performance by Pod Size')}</h2>
          <p class="text-xs font-medium text-muted">${tr('Taxa de vitória real vs. probabilidade (1 / jogadores)', 'Actual win rate vs. win probability (1 / players)')}</p>
        </div>
        <div class="space-y-2.5 flex-1 flex flex-col justify-center">
          ${podBuckets.map(b => {
            const cnt = b.list.length;
            const w = b.list.filter(x => x.res === 'V').length;
            const wr = cnt ? w / cnt : 0;
            const diff = (wr - b.exp) * 100;
            const isSel = state.pod === b.key;
            return `
              <button data-click-pod="${b.key}" class="w-full text-left nb-subtle p-3 cursor-pointer hover:bg-[#FFFDF2] transition-colors ${isSel ? 'bg-[#F3ECE0] shadow-[3px_3px_0_#4E3626]' : ''}">
                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="font-extrabold">${esc(b.label)}</span>
                  <span class="font-bold text-muted tabular-nums">${cnt} ${tr(cnt === 1 ? 'jogo' : 'jogos', cnt === 1 ? 'game' : 'games')} (${w}${resCodeDisp('V')})</span>
                </div>
                <div class="flex items-baseline justify-between gap-2 mt-1">
                  <span class="text-lg font-black tabular-nums">${cnt ? fmtPct(wr) : '—'}</span>
                  ${cnt ? `<span class="text-xs px-1.5 py-0.2 rounded ${diff >= 0 ? 'badge-win' : 'badge-loss'}">${diff >= 0 ? '+' : ''}${fmtNum(diff, 1)} pp</span>` : ''}
                </div>
                <div class="relative w-full h-3 rounded-full bg-[#FFFFFF] border-2 border-[#4E3626] mt-2 overflow-hidden">
                  <div class="h-full" style="width:${(wr * 100).toFixed(1)}%; background:${b.color};"></div>
                  <div class="absolute top-0 bottom-0 w-1 bg-[#4E3626]" style="left:${(b.exp * 100).toFixed(1)}%;" data-tip="${tr('Probabilidade de Vitória', 'Win Probability')}: ${fmtPct(b.exp)}"></div>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="nb-card p-4 lg:col-span-2 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 class="text-sm font-black">${tr('Curva de Taxa de Vitória Acumulada &amp; Forma Recente', 'Cumulative Win Rate Curve &amp; Recent Form')}</h2>
            <p class="text-xs font-medium text-muted">${tr(`Ao longo das ${filtered.length} partidas (tracejado = 50%)`, `Across ${filtered.length} matches (dashed = 50%)`)}${cumMilestoneEntries.length ? ` · <span class="font-extrabold text-[#D7653A]">${tr('⚑ = atualização de deck', '⚑ = deck update')}</span>` : ''}</p>
          </div>
          <div class="flex items-center gap-1 flex-wrap">
            ${recent20.map(m => {
              const cls = m.res === 'V' ? 'badge-win' : (m.res === 'D' ? 'badge-loss' : 'badge-draw');
              const tip = esc(`<strong>${m.id}</strong> (${matchDateLabel(m)})<br/>Deck: ${deckDisplayName(m.deck)}<br/>${tr('Mesa', 'Pod')} ${m.pod}P${m.turns ? ` · ${m.turns} ${tr('turnos', 'turns')}` : ''} · <strong>${resLabelOf(m.res)}</strong><br/>vs. ${oppDisplayStr(m.oppStr)}`);
              return `<span class="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs ${cls} cursor-default" data-tip="${tip}">${resCodeDisp(m.res)}</span>`;
            }).join('')}
          </div>
        </div>
        <svg viewBox="0 0 ${CW} ${CH}" class="w-full h-auto overflow-visible">
          ${[0, 0.25, 0.5, 0.75, 1].map(f => {
            const y = cpT + cPlotH * (1 - f);
            return `
              <line x1="${cpL}" y1="${y}" x2="${CW - cpR}" y2="${y}" stroke="#4E3626" stroke-opacity="${f === 0.5 ? '0.6' : '0.12'}" stroke-width="${f === 0.5 ? '1.8' : '1'}" stroke-dasharray="${f === 0.5 ? '5,5' : '2,3'}" />
              <text x="${cpL - 6}" y="${y + 4}" text-anchor="end" fill="#745A46" font-size="11" font-weight="700">${Math.round(f * 100)}%</text>
            `;
          }).join('')}
          ${cAreaPath ? `<path d="${cAreaPath}" fill="#F1D27A" fill-opacity="0.32" />` : ''}
          ${cLinePath ? `<path d="${cLinePath}" fill="none" stroke="#4E3626" stroke-width="2.6" stroke-linejoin="round" />` : ''}
          ${cMilestonesSvg}
          ${cHoverCircles}
          <text x="${cpL}" y="${CH - 4}" fill="#745A46" font-size="11" font-weight="700">#1 (${esc(filtered[0].id)})</text>
          <text x="${CW - cpR}" y="${CH - 4}" text-anchor="end" fill="#745A46" font-size="11" font-weight="700">#${filtered.length} (${esc(filtered[filtered.length - 1].id)})</text>
        </svg>
      </div>

      <div class="nb-card p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-black">${tr('Rivais Frequentes', 'Frequent Rivals')}</h2>
          <button data-goto-tab="opponents" class="text-xs font-extrabold underline cursor-pointer">${tr('Ver todos →', 'View all →')}</button>
        </div>
        <div class="space-y-2.5">
          ${topPlayers.length ? topPlayers.map(p => `
            <button data-jump-rival="${esc(p.player)}" class="w-full text-left group cursor-pointer">
              <div class="flex items-center justify-between text-xs gap-2 mb-1">
                <span class="font-extrabold truncate group-hover:underline">${esc(p.player)} <span class="text-muted font-semibold">· ${p.games}${tr('j', 'g')}</span></span>
                <span class="tabular-nums font-black ${wrClass(p.wr)}">${fmtPct(p.wr)} <span class="text-muted font-bold">(${p.w}–${p.l})</span></span>
              </div>
              <div class="w-full h-3 rounded-full bg-[#F3ECE0] border-2 border-[#4E3626] overflow-hidden flex">
                <div style="width:${(p.w / maxPlayerGames * 100).toFixed(1)}%; background:#C8CF7A"></div>
                ${p.d ? `<div style="width:${(p.d / maxPlayerGames * 100).toFixed(1)}%; background:#F1D27A"></div>` : ''}
                <div style="width:${(p.l / maxPlayerGames * 100).toFixed(1)}%; background:#D7653A"></div>
              </div>
            </button>
          `).join('') : `<p class="text-xs text-muted">${tr('Nenhum jogador nomeado neste recorte.', 'No named players in this filter.')}</p>`}
        </div>
      </div>
    </div>

    <div class="nb-card p-4 space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="text-sm font-black">${tr('Ritmo das Mesas (Duração em Turnos)', 'Game Pace (Turn Duration)')}</h2>
            <span class="px-2 py-0.5 rounded text-xs ${ts.count ? 'badge-pop-yellow' : 'badge-neutral'}">${ts.count ? tr(`${ts.count} ${ts.count === 1 ? 'jogo' : 'jogos'} com turnos`, `${ts.count} ${ts.count === 1 ? 'game' : 'games'} with turns`) : tr('Pronto para novas partidas', 'Ready for new matches')}</span>
          </div>
          <p class="text-xs font-medium text-muted mt-0.5">${tr('Velocidade média das partidas — ideal para comparar vitórias rápidas, mesas longas e ritmo por deck', 'Average match speed — ideal for comparing fast wins, long pods, and deck tempo')}</p>
        </div>
        ${ts.count === 0 ? `<button data-goto-tab="report" class="nb-btn nb-btn-yellow px-3 py-1.5 text-xs shrink-0">${tr('+ Reportar com turnos', '+ Report with turns')}</button>` : ''}
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="nb-subtle p-3" data-tip="${esc(tr('Duração média em turnos de todas as partidas que possuem registro de turnos neste recorte.', 'Average turn duration across all matches with turn counts recorded in this filter.'))}">
          <div class="text-xs font-bold text-muted">${tr('Média Geral', 'Overall Avg')}</div>
          <div class="text-xl font-black tabular-nums mt-0.5">${fmtTurns(ts.avg)}</div>
          <div class="text-xs font-semibold text-muted">${ts.count ? tr(`em ${ts.count} partida(s)`, `across ${ts.count} game(s)`) : tr('aguardando 1º registro', 'awaiting 1st entry')}</div>
        </div>
        <div class="nb-subtle p-3" data-tip="${esc(tr('Em quantos turnos, em média, você fecha o jogo quando vence.', 'Average turn on which you close out the game when winning.'))}">
          <div class="text-xs font-bold text-muted">${tr('Nas Vitórias', 'In Wins')}</div>
          <div class="text-xl font-black tabular-nums mt-0.5 ${ts.avgWin !== null ? 'wr-high' : ''}">${fmtTurns(ts.avgWin)}</div>
          <div class="text-xs font-semibold text-muted">${ts.winCount ? tr(`${ts.winCount} vitória(s)`, `${ts.winCount} win(s)`) : tr('sem dados ainda', 'no data yet')}</div>
        </div>
        <div class="nb-subtle p-3" data-tip="${esc(tr('Em quantos turnos, em média, a mesa termina quando você é derrotado.', 'Average turn on which the pod ends when you lose.'))}">
          <div class="text-xs font-bold text-muted">${tr('Nas Derrotas', 'In Losses')}</div>
          <div class="text-xl font-black tabular-nums mt-0.5 ${ts.avgLoss !== null ? 'wr-low' : ''}">${fmtTurns(ts.avgLoss)}</div>
          <div class="text-xs font-semibold text-muted">${ts.lossCount ? tr(`${ts.lossCount} derrota(s)`, `${ts.lossCount} loss(es)`) : tr('sem dados ainda', 'no data yet')}</div>
        </div>
        <div class="nb-subtle p-3" data-tip="${esc(tr('Menor e maior duração registrada em turnos neste recorte.', 'Shortest and longest recorded turn counts in this filter.'))}">
          <div class="text-xs font-bold text-muted">${tr('Mais Rápida / Longa', 'Fastest / Longest')}</div>
          <div class="text-xl font-black tabular-nums mt-0.5">${ts.count ? `${ts.min}t – ${ts.max}t` : '—'}</div>
          <div class="text-xs font-semibold text-muted">${ts.count ? tr('intervalo de turnos', 'turn range') : tr('mín. e máx. de turnos', 'min & max turns')}</div>
        </div>
      </div>

      ${ts.count ? `
        <div class="grid grid-cols-3 gap-2 pt-1">
          ${podTurnBuckets.map(b => `
            <div class="nb-subtle px-3 py-2 flex items-center justify-between text-xs" data-tip="${esc(b.stats.count ? tr(`Duração média em mesas ${b.label}: ${fmtTurns(b.stats.avg)} (${b.stats.count} partida(s)).`, `Average duration in ${b.label} pods: ${fmtTurns(b.stats.avg)} (${b.stats.count} game(s)).`) : tr(`Ainda sem registros de turnos em mesas ${b.label}.`, `No turn counts recorded for ${b.label} pods yet.`))}">
              <span class="font-extrabold">${tr('Mesa', 'Pod')} ${b.label}</span>
              <span class="font-black tabular-nums">${fmtTurns(b.stats.avg)} <span class="text-muted font-semibold">(${b.stats.count}${tr('j', 'g')})</span></span>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="nb-subtle px-3.5 py-2.5 text-xs font-medium text-muted">
          ${tr('Nenhuma partida anterior possui registro de turnos ainda — basta preencher o campo <strong>Duração (Turnos)</strong> na aba <strong>+ Reportar</strong> (ou informar no chat) a partir das próximas mesas para estes indicadores preencherem automaticamente.', 'No past matches have turn counts recorded yet — fill in <strong>Game Duration (Turns)</strong> in the <strong>+ Report</strong> tab on your upcoming games to populate these metrics automatically.')}
        </div>
      `}
    </div>
  `;
}
