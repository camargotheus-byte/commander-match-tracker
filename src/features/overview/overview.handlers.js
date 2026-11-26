import { state } from '../../core/state/store.js';

export function handleOverviewClick(e, { render }) {
  const gotoTab = e.target.closest('[data-goto-tab]');
  if (gotoTab) {
    state.tab = gotoTab.dataset.gotoTab;
    render();
    return true;
  }

  const clickMonth = e.target.closest('[data-click-month]');
  if (clickMonth) {
    const idx = clickMonth.dataset.clickMonth;
    state.month = (state.month === idx) ? 'all' : idx;
    render();
    return true;
  }

  const chartModeBtn = e.target.closest('[data-monthly-chart]');
  if (chartModeBtn) {
    state.monthlyChartMode = chartModeBtn.dataset.monthlyChart === 'volume' ? 'volume' : 'wr';
    render();
    return true;
  }

  const clickPod = e.target.closest('[data-click-pod]');
  if (clickPod) {
    const k = clickPod.dataset.clickPod;
    state.pod = (state.pod === k) ? 'all' : k;
    render();
    return true;
  }

  return false;
}
