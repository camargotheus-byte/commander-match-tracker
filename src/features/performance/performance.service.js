import { tr, fmtRecord, fmtNum } from '../../core/i18n/i18n.service.js';
import { deckDisplayName } from '../../shared/utils/deck-style.service.js';
import { calcStats, calcTurnStats, groupDecks } from '../../shared/utils/stats.utils.js';
import { esc, fmtPct, fmtTurns } from '../../shared/utils/formatters.js';

export function classify1v1Tier(wr) {
  if (wr >= 0.65) return { pt: 'Topo de Loja / Faixa Pro*', en: 'LGS Shark / Pro-Tier Range*', bg: '#4A5530', fg: '#FCF8F0' };
  if (wr >= 0.55) return { pt: 'Intermediário (Leão de Lojinha)', en: 'LGS Regular / Strong Grinder', bg: '#C8CF7A', fg: '#4E3626' };
  if (wr >= 0.45) return { pt: 'Casual / Média Geral', en: 'Casual / Field Average', bg: '#F1D27A', fg: '#4E3626' };
  return { pt: 'Em Desenvolvimento', en: 'Developing', bg: '#DCCBAE', fg: '#4E3626' };
}

export function classify4pTier(wr) {
  if (wr > 0.40) return { pt: 'Outlier / Alto Power Level', en: 'Outlier / High Power Level', bg: '#D7653A', fg: '#FCF8F0' };
  if (wr > 0.30) return { pt: 'Otimizado (Leão de Lojinha 4P)', en: 'Optimized (Strong 4P Regular)', bg: '#C8CF7A', fg: '#4E3626' };
  if (wr >= 0.20) return { pt: 'Casual Saudável', en: 'Healthy Casual Pod', bg: '#F1D27A', fg: '#4E3626' };
  return { pt: 'Abaixo da Média Justa', en: 'Below Fair Baseline', bg: '#DCCBAE', fg: '#4E3626' };
}

export function deltaBadgeCls(pp) {
  if (pp >= 8) return 'badge-win';
  if (pp <= -5) return 'badge-loss';
  return 'badge-pop-yellow';
}

export function deltaTxtCls(pp) {
  if (pp >= 8) return 'wr-high';
  if (pp <= -5) return 'wr-low';
  return 'wr-mid';
}

export function computePerformanceModel(filtered) {
  const sAll = calcStats(filtered);
  const s1v1 = calcStats(filtered.filter(m => m.pod === 2));
  const s3p = calcStats(filtered.filter(m => m.pod === 3));
  const s4p = calcStats(filtered.filter(m => m.pod >= 4));

  const expWinsAll = filtered.reduce((acc, m) => acc + (1 / m.pod), 0);
  const winsAboveExp = sAll.w - expWinsAll;
  const recentSlice = filtered.slice(-20);
  const sRecent = calcStats(recentSlice);
  const recentDiffPP = (sRecent.delta - sAll.delta) * 100;
  const turnStats = calcTurnStats(filtered);

  const decksAll = groupDecks(filtered).map(d => ({
    ...d,
    deltaPP: (d.wr - d.expWr) * 100,
    c2: d.matches.filter(x => x.pod === 2).length,
    c3: d.matches.filter(x => x.pod === 3).length,
    c4: d.matches.filter(x => x.pod >= 4).length
  }));
  let effDecks = decksAll.filter(d => d.games >= 5);
  const usedMin5 = effDecks.length > 0;
  if (!effDecks.length) effDecks = decksAll.slice();
  effDecks.sort((a, b) => (b.deltaPP - a.deltaPP) || (b.games - a.games));
  const positiveDecksCount = effDecks.filter(d => d.deltaPP > 0).length;

  const insights = [];
  insights.push({
    tag: tr('Saldo Real', 'True Edge'),
    accent: winsAboveExp >= 0 ? '#C8CF7A' : '#D7653A',
    title: winsAboveExp >= 0
      ? tr(`+${fmtNum(winsAboveExp, 1)} vitórias acima do esperado`, `+${fmtNum(winsAboveExp, 1)} wins above expected`)
      : tr(`${fmtNum(winsAboveExp, 1)} vitórias vs. esperado`, `${fmtNum(winsAboveExp, 1)} wins vs. expected`),
    body: tr(
      `Pelo tamanho real das ${sAll.total} mesas jogadas, um jogador perfeitamente mediano venceria ${fmtNum(expWinsAll, 1)} vezes (${fmtPct(sAll.expWr)}). Você venceu ${sAll.w} (${fmtPct(sAll.wr)} · ${sAll.delta >= 0 ? '+' : ''}${fmtNum(sAll.delta * 100, 1)} pp).`,
      `Given the pod sizes of your ${sAll.total} matches, an average player would win ${fmtNum(expWinsAll, 1)} times (${fmtPct(sAll.expWr)}). You won ${sAll.w} (${fmtPct(sAll.wr)} · ${sAll.delta >= 0 ? '+' : ''}${fmtNum(sAll.delta * 100, 1)} pp).`
    )
  });

  if (s1v1.total >= 5 && s4p.total >= 5) {
    const gapPP = (s1v1.delta - s4p.delta) * 100;
    insights.push({
      tag: tr('1v1 vs. Mesão 4P', '1v1 vs. 4P Pod'),
      accent: '#F1D27A',
      title: Math.abs(gapPP) >= 8
        ? (gapPP > 0
            ? tr(`Mais dominante no 1v1 (+${fmtNum(s1v1.delta * 100, 1)} pp) que no 4P`, `Stronger edge in 1v1 (+${fmtNum(s1v1.delta * 100, 1)} pp) than 4P`)
            : tr(`Mais eficiente no Mesão 4P (+${fmtNum(s4p.delta * 100, 1)} pp) que no 1v1`, `Stronger edge in 4P (+${fmtNum(s4p.delta * 100, 1)} pp) than 1v1`))
        : tr('Consistência equilibrada entre 1v1 e 4P', 'Balanced consistency across 1v1 & 4P'),
      body: gapPP > 8
        ? tr(
            `No 1v1 você performa como "Leão de Lojinha" (${fmtPct(s1v1.wr)} em ${s1v1.total} jogos), enquanto no 4P fica em ${fmtPct(s4p.wr)} (${s4p.delta >= 0 ? '+' : ''}${fmtNum(s4p.delta * 100, 1)} pp vs. 25%). No mesão, segurar explosão cedo (política) e priorizar card advantage/resiliência contra 3 oponentes costuma destravar mais vitórias.`,
            `In 1v1 you post strong LGS-regular numbers (${fmtPct(s1v1.wr)} across ${s1v1.total} games), while 4P sits at ${fmtPct(s4p.wr)} (${s4p.delta >= 0 ? '+' : ''}${fmtNum(s4p.delta * 100, 1)} pp vs. 25%). In 4P pods, pacing early threats (politics) and packing resilient card advantage against 3 opponents typically unlocks extra wins.`
          )
        : tr(
            `Seu saldo relativo ao esperado está em ${s1v1.delta >= 0 ? '+' : ''}${fmtNum(s1v1.delta * 100, 1)} pp no 1v1 (${fmtPct(s1v1.wr)}) e ${s4p.delta >= 0 ? '+' : ''}${fmtNum(s4p.delta * 100, 1)} pp no 4P (${fmtPct(s4p.wr)}).`,
            `Your expected-adjusted edge stands at ${s1v1.delta >= 0 ? '+' : ''}${fmtNum(s1v1.delta * 100, 1)} pp in 1v1 (${fmtPct(s1v1.wr)}) and ${s4p.delta >= 0 ? '+' : ''}${fmtNum(s4p.delta * 100, 1)} pp in 4P (${fmtPct(s4p.wr)}).`
          )
    });
  } else if (s3p.total >= 5) {
    insights.push({
      tag: tr('Mesas 3P', '3P Pods'),
      accent: '#F1D27A',
      title: tr(`3P: ${fmtPct(s3p.wr)} (${s3p.delta >= 0 ? '+' : ''}${fmtNum(s3p.delta * 100, 1)} pp vs. 33,3%)`, `3P: ${fmtPct(s3p.wr)} (${s3p.delta >= 0 ? '+' : ''}${fmtNum(s3p.delta * 100, 1)} pp vs. 33.3%)`),
      body: tr(
        `Nas ${s3p.total} mesas de 3 jogadores, você soma ${fmtRecord(s3p.w, s3p.l, s3p.d)} — bem ${s3p.delta >= 0 ? 'acima' : 'abaixo'} da linha base de 33,3%.`,
        `Across ${s3p.total} 3-player pods, your record is ${fmtRecord(s3p.w, s3p.l, s3p.d)} — ${s3p.delta >= 0 ? 'above' : 'below'} the 33.3% fair baseline.`
      )
    });
  }

  insights.push({
    tag: tr(`Momento (Últimos ${recentSlice.length})`, `Recent Form (Last ${recentSlice.length})`),
    accent: recentDiffPP >= 3 ? '#C8CF7A' : (recentDiffPP <= -5 ? '#D7653A' : '#E2A64B'),
    title: `${fmtPct(sRecent.wr)} (${sRecent.delta >= 0 ? '+' : ''}${fmtNum(sRecent.delta * 100, 1)} pp ${tr('vs. esperado', 'vs. exp.')})`,
    body: tr(
      `Nos seus últimos ${recentSlice.length} jogos (${fmtRecord(sRecent.w, sRecent.l, sRecent.d)}), seu saldo relativo está ${Math.abs(recentDiffPP) < 3 ? 'estável em linha com' : (recentDiffPP > 0 ? `${fmtNum(recentDiffPP, 1)} pp acima da` : `${fmtNum(Math.abs(recentDiffPP), 1)} pp abaixo da`)} sua média geral do recorte.`,
      `Over your last ${recentSlice.length} matches (${fmtRecord(sRecent.w, sRecent.l, sRecent.d)}), your relative edge is ${Math.abs(recentDiffPP) < 3 ? 'right in line with' : (recentDiffPP > 0 ? `${fmtNum(recentDiffPP, 1)} pp above` : `${fmtNum(Math.abs(recentDiffPP), 1)} pp below`)} your overall average.`
    )
  });

  if (turnStats.count >= 4 && turnStats.avgWin !== null && turnStats.avgLoss !== null) {
    const fasterWins = turnStats.avgWin <= turnStats.avgLoss;
    insights.push({
      tag: tr('Ritmo de Turnos', 'Turn Pace'),
      accent: '#E2A64B',
      title: fasterWins
        ? tr(`Vitórias mais rápidas (${fmtTurns(turnStats.avgWin)} vs. ${fmtTurns(turnStats.avgLoss)})`, `Faster wins (${fmtTurns(turnStats.avgWin)} vs. ${fmtTurns(turnStats.avgLoss)})`)
        : tr(`Vitórias no late-game (${fmtTurns(turnStats.avgWin)} vs. ${fmtTurns(turnStats.avgLoss)})`, `Late-game wins (${fmtTurns(turnStats.avgWin)} vs. ${fmtTurns(turnStats.avgLoss)})`),
      body: tr(
        `Com base em ${turnStats.count} partidas com duração registrada, você vence em média no turno ${fmtTurns(turnStats.avgWin)} e perde no turno ${fmtTurns(turnStats.avgLoss)}.`,
        `Based on ${turnStats.count} matches with turn duration logged, your wins average ${fmtTurns(turnStats.avgWin)} and losses average ${fmtTurns(turnStats.avgLoss)}.`
      )
    });
  } else {
    const bestEff = effDecks[0];
    insights.push({
      tag: tr('Consistência da Coleção', 'Deck Portfolio'),
      accent: '#E2A64B',
      title: tr(`${positiveDecksCount} de ${effDecks.length} decks batem o esperado`, `${positiveDecksCount} of ${effDecks.length} decks beat expected WR`),
      body: bestEff
        ? tr(
            `Entre os decks${usedMin5 ? ' com 5+ jogos' : ''}, o destaque em eficiência real ajustada por tamanho de mesa é <strong>${esc(deckDisplayName(bestEff.deck))}</strong> (${bestEff.deltaPP >= 0 ? '+' : ''}${fmtNum(bestEff.deltaPP, 1)} pp acima do esperado).`,
            `Among decks${usedMin5 ? ' with 5+ games' : ''}, your top pod-adjusted performer is <strong>${esc(deckDisplayName(bestEff.deck))}</strong> (${bestEff.deltaPP >= 0 ? '+' : ''}${fmtNum(bestEff.deltaPP, 1)} pp above expected).`
          )
        : tr('Registre mais partidas para comparar a eficiência entre decks.', 'Log more matches to compare deck efficiency.')
    });
  }

  const seatMap = new Map([[1, { n: 0, w: 0 }], [2, { n: 0, w: 0 }], [3, { n: 0, w: 0 }], [4, { n: 0, w: 0 }]]);
  let seatTotalLogged = 0;
  for (const m of filtered) {
    const mo = String(m.ordem || '').match(/[1-4]/);
    if (!mo) continue;
    const entry = seatMap.get(Number(mo[0]));
    if (entry) {
      entry.n++;
      if (m.res === 'V') entry.w++;
      seatTotalLogged++;
    }
  }

  return { sAll, s1v1, s3p, s4p, effDecks, usedMin5, insights, seatMap, seatTotalLogged };
}
