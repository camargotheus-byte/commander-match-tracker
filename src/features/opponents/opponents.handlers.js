import { state } from '../../core/state/store.js';

export function handleOpponentsClick(e, { render, scrollToSection }) {
  const rivalHist = e.target.closest('[data-rival-history]');
  if (rivalHist) {
    const pl = rivalHist.dataset.rivalHistory;
    state.player = pl;
    state.selectedPlayer = pl;
    state.tab = 'history';
    render();
    return true;
  }

  const jumpRival = e.target.closest('[data-jump-rival]');
  if (jumpRival) {
    const pl = jumpRival.dataset.jumpRival;
    state.selectedPlayer = pl;
    state.oppSubTab = 'players';
    state.tab = 'opponents';
    render();
    scrollToSection('rival-xray');
    return true;
  }

  const selPlayer = e.target.closest('[data-select-player]');
  if (selPlayer) {
    state.selectedPlayer = selPlayer.dataset.selectPlayer;
    render();
    scrollToSection('rival-xray');
    return true;
  }

  const jumpPlayer = e.target.closest('[data-jump-player]');
  if (jumpPlayer) {
    const pl = jumpPlayer.dataset.jumpPlayer;
    state.player = state.player === pl ? 'all' : pl;
    render();
    return true;
  }

  const oppSub = e.target.closest('[data-opp-sub]');
  if (oppSub) {
    state.oppSubTab = oppSub.dataset.oppSub;
    state.oppSearch = '';
    render();
    return true;
  }

  const filterEcmd = e.target.closest('[data-filter-ecmd]');
  if (filterEcmd) {
    state.enemyCmdFilter = filterEcmd.dataset.filterEcmd;
    if (filterEcmd.dataset.filterEcmdPlayer) state.player = filterEcmd.dataset.filterEcmdPlayer;
    state.tab = 'history';
    render();
    return true;
  }

  const hmCell = e.target.closest('[data-heatmap-deck]');
  if (hmCell) {
    state.deck = hmCell.dataset.heatmapDeck;
    state.player = hmCell.dataset.heatmapPlayer;
    state.tab = 'history';
    render();
    return true;
  }

  return false;
}

export function handleOpponentsInput(e, { render }) {
  if (e.target.id === 'opp-search') { state.oppSearch = e.target.value; render('opp-search'); return true; }
  return false;
}
