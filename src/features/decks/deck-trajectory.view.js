import { tr, resLabelOf } from '../../core/i18n/i18n.service.js';
import { esc, fmtPct, wrClass, fmtDateDisp, fmtShortDateBr, matchDateLabel } from '../../shared/utils/formatters.js';

export function renderDeckTrajectoryChart(dm, meta, acc) {
  if (!dm.length) return '';
  const W = 360, H = 160, pL = 34, pR = 14, pT = 26, pB = 26;
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

  let postUpdateShadeSvg = '';
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

    const beforeList = ordered.slice(0, splitIdx);
    const afterList = ordered.slice(splitIdx);

    if (afterList.length > 0 && markerX < W - pR) {
      postUpdateShadeSvg = `
        <rect x="${markerX.toFixed(1)}" y="${pT}" width="${Math.max(0, (W - pR) - markerX).toFixed(1)}" height="${plotH}" fill="#C8CF7A" fill-opacity="0.16" />
      `;
    }

    const shortU = fmtShortDateBr(updIso);
    const flagTxt = tr(`⚑ Atualiz. ${shortU}`, `⚑ Updated ${shortU}`);
    const pillW = Math.max(76, flagTxt.length * 5.6 + 10);
    const pillH = 16;
    const pillX = Math.max(pL, Math.min((W - pR) - pillW, markerX - pillW / 2));
    const pillY = 3;

    let deltaSummary = '';
    if (beforeList.length && afterList.length) {
      const bWr = beforeList.filter(x => x.res === 'V').length / beforeList.length;
      const aWr = afterList.filter(x => x.res === 'V').length / afterList.length;
      const diff = (aWr - bWr) * 100;
      deltaSummary = tr(
        `<br/>Antes: ${fmtPct(bWr, 0)} (${beforeList.length}j) → Depois: <strong>${fmtPct(aWr, 0)}</strong> (${afterList.length}j · ${diff >= 0 ? '+' : ''}${diff.toFixed(0)} pp)`,
        `<br/>Before: ${fmtPct(bWr, 0)} (${beforeList.length}g) → After: <strong>${fmtPct(aWr, 0)}</strong> (${afterList.length}g · ${diff >= 0 ? '+' : ''}${diff.toFixed(0)} pp)`
      );
    }

    const markerTip = esc(tr(
      `<strong>⚑ Marco de Atualização (${fmtDateDisp(updIso)})</strong>${meta.note ? `<br/>${meta.note}` : ''}${deltaSummary}`,
      `<strong>⚑ Decklist Update Milestone (${fmtDateDisp(updIso)})</strong>${meta.note ? `<br/>${meta.note}` : ''}${deltaSummary}`
    ));
    updateMarkerSvg = `
      <g class="cursor-pointer" data-tip="${markerTip}" data-tip-instant="1">
        <line x1="${markerX.toFixed(1)}" y1="${pT - 4}" x2="${markerX.toFixed(1)}" y2="${pT + plotH}" stroke="#D7653A" stroke-width="2.2" stroke-dasharray="4,3" />
        <polygon points="${markerX.toFixed(1)},${pT - 5} ${(markerX + 4.5).toFixed(1)},${pT} ${markerX.toFixed(1)},${pT + 5} ${(markerX - 4.5).toFixed(1)},${pT}" fill="#D7653A" stroke="#4E3626" stroke-width="1.2" />
        <rect x="${pillX.toFixed(1)}" y="${pillY}" width="${pillW.toFixed(1)}" height="${pillH}" rx="4" fill="#D7653A" stroke="#4E3626" stroke-width="1.4" />
        <text x="${(pillX + pillW / 2).toFixed(1)}" y="${pillY + pillH / 2 + 0.5}" text-anchor="middle" dominant-baseline="central" fill="#FCF8F0" font-size="8.8" font-weight="900">${esc(flagTxt)}</text>
      </g>
    `;

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
        <div class="text-xs font-semibold text-muted nb-subtle px-2.5 py-1.5" data-tip="${esc(tr('O marco à direita sinaliza a última atualização da decklist. Novas partidas com data a partir deste dia aparecerão depois da linha.', 'The milestone on the right marks the latest decklist update. New dated games from this day onward will appear after the line.'))}">
          ${tr(`⚑ Atualizado em <strong>${fmtDateDisp(updIso)}</strong> · aguardando 1º jogo pós-mudança.`, `⚑ Updated on <strong>${fmtDateDisp(updIso)}</strong> · awaiting 1st post-update game.`)}
        </div>
      `;
    }
  }

  const dotR = ordered.length > 18 ? 3.2 : 4;
  const dotsSvg = pts.map(p => {
    const fill = p.m.res === 'V' ? '#C8CF7A' : (p.m.res === 'D' ? '#D7653A' : '#F1D27A');
    const tip = esc(tr(
      `<strong>#${p.idx + 1} · ${p.m.id}</strong> (${matchDateLabel(p.m)})<br/>Resultado: <strong>${resLabelOf(p.m.res)}</strong> · Mesa ${p.m.pod}P${p.m.turns ? ` · ${p.m.turns}t` : ''}<br/>Taxa acumulada: <strong>${fmtPct(p.wr)}</strong>`,
      `<strong>#${p.idx + 1} · ${p.m.id}</strong> (${matchDateLabel(p.m)})<br/>Result: <strong>${resLabelOf(p.m.res)}</strong> · Pod ${p.m.pod}P${p.m.turns ? ` · ${p.m.turns}t` : ''}<br/>Cumulative WR: <strong>${fmtPct(p.wr)}</strong>`
    ));
    return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${dotR}" fill="${fill}" stroke="#4E3626" stroke-width="1.4" class="cursor-pointer" data-tip="${tip}" data-tip-instant="1" />`;
  }).join('');

  const firstLbl = matchDateLabel(ordered[0]);
  const lastLbl = matchDateLabel(ordered[ordered.length - 1]);
  const midPt = ordered.length >= 4 ? pts[Math.floor((ordered.length - 1) / 2)] : null;

  return `
    <div class="space-y-1.5">
      <div class="flex items-center justify-between gap-2">
        <div class="text-xs font-extrabold" data-tip="${esc(tr('Evolução cronológica da Taxa de Vitória acumulada deste deck partida a partida. Pontos verdes = Vitória, corais = Derrota, amarelos = Empate. Marcos vermelhos = Atualizações da decklist.', 'Chronological cumulative Win Rate trajectory match by match. Green dots = Win, coral = Loss, yellow = Draw. Coral flags = Decklist updates.'))}">${tr('Trajetória de Performance', 'Performance Trajectory')}</div>
        <span class="text-xs font-semibold text-muted tabular-nums">${ordered.length} ${tr(ordered.length === 1 ? 'jogo' : 'jogos', ordered.length === 1 ? 'game' : 'games')}</span>
      </div>
      <div class="nb-subtle p-2.5 bg-[#FCF8F0]">
        <svg viewBox="0 0 ${W} ${H}" class="w-full h-auto overflow-visible">
          ${postUpdateShadeSvg}
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
