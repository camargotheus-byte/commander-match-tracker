import { tr, resLabelOf } from '../../core/i18n/i18n.service.js';
import { esc, fmtPct, wrClass, fmtDateDisp, fmtShortDateBr, matchDateLabel } from '../../shared/utils/formatters.js';

export function renderDeckTrajectoryChart(dm, meta, acc) {
  if (!dm.length) return '';
  const W = 360, H = 148, pL = 34, pR = 14, pT = 18, pB = 26;
  const plotW = W - pL - pR, plotH = H - pT - pB;

  const ordered = dm.slice().sort((a, b) => {
    const ka = a.date || `${a.year || '2026'}-${String(a.monthIdx + 1).padStart(2, '0')}-00`;
    const kb = b.date || `${b.year || '2026'}-${String(b.monthIdx + 1).padStart(2, '0')}-00`;
    if (ka !== kb) return ka.localeCompare(kb);
    return a.n - b.n;
  });

  let wins = 0;
  const pts = ordered.map((m, idx) => {
    if (m.res === 'V') wins++;
    const wr = wins / (idx + 1);
    const x = ordered.length === 1 ? pL + plotW / 2 : pL + (idx / (ordered.length - 1)) * plotW;
    const y = pT + plotH * (1 - wr);
    return { m, idx, wr, x, y };
  });

  const linePath = pts.length > 1 ? pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') : '';
  const areaPath = pts.length > 1 ? `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(pT + plotH).toFixed(1)} L${pts[0].x.toFixed(1)},${(pT + plotH).toFixed(1)} Z` : '';

  let updateMarkerSvg = '';
  let beforeAfterHtml = '';
  const updIso = meta && meta.lastUpdated ? meta.lastUpdated : '';
  if (updIso) {
    const isAfterUpdate = m => {
      if (m.date) return m.date >= updIso;
      const mYM = `${m.year || '2026'}-${String(m.monthIdx + 1).padStart(2, '0')}`;
      return mYM > updIso.slice(0, 7);
    };
    let splitIdx = ordered.findIndex(isAfterUpdate);
    if (splitIdx === -1) splitIdx = ordered.length;

    let markerX = W - pR;
    if (splitIdx === 0) markerX = pL;
    else if (splitIdx < ordered.length) markerX = (pts[splitIdx - 1].x + pts[splitIdx].x) / 2;

    const shortU = fmtShortDateBr(updIso);
    const labelAnchor = markerX > W - 64 ? 'end' : (markerX < pL + 54 ? 'start' : 'middle');
    const labelX = labelAnchor === 'end' ? markerX - 3 : (labelAnchor === 'start' ? markerX + 3 : markerX);
    const markerTip = esc(tr(
      `<strong>Última mudança na decklist: ${fmtDateDisp(updIso)}</strong>${meta.note ? `<br/>${meta.note}` : ''}`,
      `<strong>Last decklist update: ${fmtDateDisp(updIso)}</strong>${meta.note ? `<br/>${meta.note}` : ''}`
    ));
    updateMarkerSvg = `
      <g data-tip="${markerTip}">
        <line x1="${markerX.toFixed(1)}" y1="${pT - 2}" x2="${markerX.toFixed(1)}" y2="${pT + plotH}" stroke="#D7653A" stroke-width="1.8" stroke-dasharray="4,3" />
        <circle cx="${markerX.toFixed(1)}" cy="${pT - 2}" r="3" fill="#D7653A" stroke="#4E3626" stroke-width="1" />
        <text x="${labelX.toFixed(1)}" y="${pT - 6}" text-anchor="${labelAnchor}" fill="#D7653A" font-size="9.5" font-weight="900">Update ${shortU}</text>
      </g>
    `;

    const beforeList = ordered.slice(0, splitIdx);
    const afterList = ordered.slice(splitIdx);
    if (beforeList.length && afterList.length) {
      const bWr = beforeList.filter(x => x.res === 'V').length / beforeList.length;
      const aWr = afterList.filter(x => x.res === 'V').length / afterList.length;
      const diff = (aWr - bWr) * 100;
      beforeAfterHtml = `
        <div class="flex items-center justify-between gap-2 text-xs nb-subtle px-2.5 py-1.5 flex-wrap" data-tip="${esc(tr(`Comparativo de aproveitamento antes e depois da mudança na decklist em ${fmtDateDisp(updIso)}.`, `Win rate comparison before and after the decklist update on ${fmtDateDisp(updIso)}.`))}">
          <span class="font-bold text-muted">${tr('Antes', 'Before')}: <strong class="text-[#4E3626] tabular-nums">${fmtPct(bWr, 0)}</strong> (${beforeList.length}${tr('j', 'g')})</span>
          <span class="font-black">→</span>
          <span class="font-bold text-muted">${tr('Depois', 'After')}: <strong class="${wrClass(aWr)} tabular-nums">${fmtPct(aWr, 0)}</strong> (${afterList.length}${tr('j', 'g')})</span>
          <span class="px-1.5 py-0.2 rounded text-xs ${diff >= 0 ? 'badge-win' : 'badge-loss'} tabular-nums">${diff >= 0 ? '+' : ''}${diff.toFixed(0)} pp</span>
        </div>
      `;
    } else if (beforeList.length && !afterList.length) {
      beforeAfterHtml = `
        <div class="text-xs font-semibold text-muted nb-subtle px-2.5 py-1.5" data-tip="${esc(tr('A linha tracejada à direita marca a última mudança na decklist. Novas partidas com data a partir deste dia aparecerão depois da linha.', 'The dashed line on the right marks the latest decklist update. New dated games from this day onward will appear after the line.'))}">
          ${tr(`Decklist atualizada em <strong>${fmtDateDisp(updIso)}</strong> · aguardando 1º jogo pós-mudança.`, `Decklist updated on <strong>${fmtDateDisp(updIso)}</strong> · awaiting 1st post-update game.`)}
        </div>
      `;
    }
  }

  const dotR = ordered.length > 18 ? 3.2 : 4;
  const dotsSvg = pts.map(p => {
    const fill = p.m.res === 'V' ? '#C8CF7A' : (p.m.res === 'D' ? '#D7653A' : '#F1D27A');
    const tip = esc(tr(
      `<strong>#${p.idx + 1} · ${p.m.id}</strong> (${matchDateLabel(p.m)})<br/>Resultado: <strong>${resLabelOf(p.m.res)}</strong> · Mesa ${p.m.pod}P${p.m.turns ? ` · ${p.m.turns}t` : ''}<br/>WR acumulado: <strong>${fmtPct(p.wr)}</strong>`,
      `<strong>#${p.idx + 1} · ${p.m.id}</strong> (${matchDateLabel(p.m)})<br/>Result: <strong>${resLabelOf(p.m.res)}</strong> · Pod ${p.m.pod}P${p.m.turns ? ` · ${p.m.turns}t` : ''}<br/>Cumulative WR: <strong>${fmtPct(p.wr)}</strong>`
    ));
    return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${dotR}" fill="${fill}" stroke="#4E3626" stroke-width="1.4" class="cursor-pointer" data-tip="${tip}" />`;
  }).join('');

  const firstLbl = matchDateLabel(ordered[0]);
  const lastLbl = matchDateLabel(ordered[ordered.length - 1]);
  const midPt = ordered.length >= 4 ? pts[Math.floor((ordered.length - 1) / 2)] : null;

  return `
    <div class="space-y-1.5">
      <div class="flex items-center justify-between gap-2">
        <div class="text-xs font-extrabold" data-tip="${esc(tr('Evolução cronológica do Win Rate acumulado deste deck partida a partida. Pontos verdes = Vitória, corais = Derrota, amarelos = Empate.', 'Chronological cumulative Win Rate trajectory match by match. Green dots = Win, coral = Loss, yellow = Draw.'))}">${tr('Trajetória de Performance', 'Performance Trajectory')}</div>
        <span class="text-xs font-semibold text-muted tabular-nums">${ordered.length} ${tr(ordered.length === 1 ? 'jogo' : 'jogos', ordered.length === 1 ? 'game' : 'games')}</span>
      </div>
      <div class="nb-subtle p-2.5 bg-[#FCF8F0]">
        <svg viewBox="0 0 ${W} ${H}" class="w-full h-auto overflow-visible">
          ${[0, 0.5, 1].map(f => {
            const y = pT + plotH * (1 - f);
            return `
              <line x1="${pL}" y1="${y.toFixed(1)}" x2="${W - pR}" y2="${y.toFixed(1)}" stroke="#4E3626" stroke-opacity="${f === 0.5 ? '0.45' : '0.14'}" stroke-width="${f === 0.5 ? '1.3' : '1'}" stroke-dasharray="${f === 0.5 ? '4,4' : '2,3'}" />
              <text x="${pL - 5}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" fill="#745A46" font-size="9.5" font-weight="700">${Math.round(f * 100)}%</text>
            `;
          }).join('')}
          ${areaPath ? `<path d="${areaPath}" fill="${acc.color}" fill-opacity="0.22" />` : ''}
          ${linePath ? `<path d="${linePath}" fill="none" stroke="#4E3626" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" />` : ''}
          ${updateMarkerSvg}
          ${dotsSvg}
          <text x="${pL}" y="${H - 5}" fill="#745A46" font-size="9.5" font-weight="700">${esc(firstLbl)}</text>
          ${midPt ? `<text x="${midPt.x.toFixed(1)}" y="${H - 5}" text-anchor="middle" fill="#745A46" font-size="9.5" font-weight="700">${esc(matchDateLabel(midPt.m))}</text>` : ''}
          ${ordered.length > 1 ? `<text x="${W - pR}" y="${H - 5}" text-anchor="end" fill="#745A46" font-size="9.5" font-weight="700">${esc(lastLbl)}</text>` : ''}
        </svg>
      </div>
      ${beforeAfterHtml}
    </div>
  `;
}
