import { renderOverview } from '../../features/overview/overview.view.js';
import { renderDecks } from '../../features/decks/decks.view.js';
import { renderOpponents } from '../../features/opponents/opponents.view.js';
import { renderPerformance } from '../../features/performance/performance.view.js';
import { renderHistory } from '../../features/history/history.view.js';
import { renderReport } from '../../features/report/report.view.js';

/**
 * Canonical tab/route registry.
 * Any new tab MUST be registered here and documented in ARCHITECTURE.md.
 */
export const TABS_REGISTRY = Object.freeze([
  { id: 'overview', labelPt: 'Visão Geral', labelEn: 'Overview', featurePath: 'src/features/overview/', render: renderOverview },
  { id: 'decks', labelPt: 'Decks', labelEn: 'Decks', featurePath: 'src/features/decks/', render: renderDecks },
  { id: 'opponents', labelPt: 'Oponentes', labelEn: 'Opponents', featurePath: 'src/features/opponents/', render: renderOpponents },
  { id: 'performance', labelPt: 'Performance', labelEn: 'Performance', featurePath: 'src/features/performance/', render: renderPerformance },
  { id: 'history', labelPt: 'Histórico', labelEn: 'History', featurePath: 'src/features/history/', render: renderHistory },
  { id: 'report', labelPt: 'Reportar', labelEn: 'Report', featurePath: 'src/features/report/', render: renderReport }
]);

const TAB_RENDERERS = new Map(TABS_REGISTRY.map(t => [t.id, t.render]));

export function renderActiveTab(tabId, filtered) {
  const fn = TAB_RENDERERS.get(tabId) || renderOverview;
  return fn(filtered);
}
