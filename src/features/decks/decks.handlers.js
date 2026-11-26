import { state } from '../../core/state/store.js';
import { tr } from '../../core/i18n/i18n.service.js';
import { MANA_ORDER } from '../../shared/constants/mana-identity.data.js';
import {
  deckStyles,
  saveDeckStyles,
  deckMeta,
  saveDeckMeta,
  getDeckCommanderInfo,
  getDeckColorIdentity,
  pruneDeckMetaEntry
} from '../../shared/utils/deck-style.service.js';
import { todayIso, sanitizeDeckUrl } from '../../shared/utils/formatters.js';
import { showToast } from '../../shared/components/toast.js';

export function handleDecksClick(e, { render, onDataChange, scrollToSection }) {
  const jumpDeck = e.target.closest('[data-jump-deck]');
  if (jumpDeck) {
    state.selectedDeck = jumpDeck.dataset.jumpDeck;
    state.showDeckMetaEditor = false;
    state.showDeckCmdEditor = false;
    state.cmdDraft = null;
    state.deckMinGames = 1;
    state.tab = 'decks';
    render();
    scrollToSection('deck-xray');
    return true;
  }

  const filterDeck = e.target.closest('[data-filter-deck]');
  if (filterDeck) { state.deck = filterDeck.dataset.filterDeck; render(); return true; }

  if (e.target.closest('[data-toggle-customizer]')) {
    state.showDeckCustomizer = !state.showDeckCustomizer;
    render();
    return true;
  }

  const toggleCmdBtn = e.target.closest('[data-toggle-cmd-editor]');
  if (toggleCmdBtn) {
    const dk = toggleCmdBtn.dataset.toggleCmdEditor;
    if (state.showDeckCmdEditor) {
      state.showDeckCmdEditor = false;
      state.cmdDraft = null;
    } else {
      const info = getDeckCommanderInfo(dk);
      const cols = getDeckColorIdentity(dk);
      state.showDeckCmdEditor = true;
      state.cmdDraft = { deck: dk, partner: info.partner, cmd1: info.cmd1, cmd2: info.cmd2, colors: cols.slice() };
    }
    render();
    return true;
  }

  const toggleCmdColorBtn = e.target.closest('[data-toggle-cmd-color]');
  if (toggleCmdColorBtn && state.cmdDraft) {
    const code = toggleCmdColorBtn.dataset.toggleCmdColor;
    state.cmdDraft.cmd1 = document.getElementById('deck-cmd-1')?.value ?? state.cmdDraft.cmd1;
    const inp2 = document.getElementById('deck-cmd-2');
    if (inp2) state.cmdDraft.cmd2 = inp2.value;
    const cur = new Set(state.cmdDraft.colors || []);
    if (cur.has(code)) cur.delete(code);
    else cur.add(code);
    state.cmdDraft.colors = MANA_ORDER.filter(c => cur.has(c));
    render();
    return true;
  }

  if (e.target.closest('[data-toggle-cmd-partner]')) {
    if (state.cmdDraft) {
      state.cmdDraft.cmd1 = document.getElementById('deck-cmd-1')?.value ?? state.cmdDraft.cmd1;
      const inp2 = document.getElementById('deck-cmd-2');
      if (inp2) state.cmdDraft.cmd2 = inp2.value;
      state.cmdDraft.partner = !state.cmdDraft.partner;
      render();
    }
    return true;
  }

  const saveCmdBtn = e.target.closest('[data-save-deck-cmd]');
  if (saveCmdBtn) {
    const dk = saveCmdBtn.dataset.saveDeckCmd;
    const partner = Boolean(state.cmdDraft && state.cmdDraft.partner);
    const cmd1 = (document.getElementById('deck-cmd-1')?.value || '').trim();
    const cmd2 = partner ? (document.getElementById('deck-cmd-2')?.value || '').trim() : '';
    if (!cmd1) {
      showToast(tr('Informe o nome do comandante.', 'Please enter the commander name.'), 'error');
      return true;
    }
    if (partner && !cmd2) {
      showToast(tr('Informe o nome do 2º comandante ou desligue a opção Partner.', 'Enter the 2nd commander name or turn off Partner.'), 'error');
      return true;
    }
    const colors = MANA_ORDER.filter(c => (state.cmdDraft?.colors || []).includes(c));
    deckMeta[dk] = { ...(deckMeta[dk] || {}), cmdCustom: true, partner, cmd1, cmd2, colorsCustom: true, colors };
    saveDeckMeta();
    state.showDeckCmdEditor = false;
    state.cmdDraft = null;
    onDataChange();
    showToast(partner ? tr('Comandantes Partner salvos!', 'Partner commanders saved!') : tr('Comandante atualizado!', 'Commander updated!'));
    return true;
  }

  const resetCmdBtn = e.target.closest('[data-reset-deck-cmd]');
  if (resetCmdBtn) {
    const dk = resetCmdBtn.dataset.resetDeckCmd;
    if (deckMeta[dk]) {
      delete deckMeta[dk].cmdCustom;
      delete deckMeta[dk].partner;
      delete deckMeta[dk].cmd1;
      delete deckMeta[dk].cmd2;
      delete deckMeta[dk].colorsCustom;
      delete deckMeta[dk].colors;
      pruneDeckMetaEntry(dk);
      saveDeckMeta();
    }
    state.showDeckCmdEditor = false;
    state.cmdDraft = null;
    onDataChange();
    showToast(tr('Comandante restaurado para o padrão.', 'Commander reset to default.'));
    return true;
  }

  if (e.target.closest('[data-toggle-deck-meta]')) {
    state.showDeckMetaEditor = !state.showDeckMetaEditor;
    render();
    return true;
  }

  if (e.target.closest('[data-deck-meta-today]')) {
    const inp = document.getElementById('deck-meta-date');
    if (inp) inp.value = todayIso();
    return true;
  }

  if (e.target.closest('[data-deck-meta-clear-date]')) {
    const inp = document.getElementById('deck-meta-date');
    if (inp) inp.value = '';
    return true;
  }

  const saveMetaBtn = e.target.closest('[data-save-deck-meta]');
  if (saveMetaBtn) {
    const dk = saveMetaBtn.dataset.saveDeckMeta;
    const rawUrl = (document.getElementById('deck-meta-url')?.value || '').trim();
    const url = sanitizeDeckUrl(rawUrl);
    if (rawUrl && !url) {
      showToast(tr('Link inválido. Use um endereço como https://moxfield.com/...', 'Invalid URL. Use a link like https://moxfield.com/...'), 'error');
      return true;
    }
    const lastUpdated = (document.getElementById('deck-meta-date')?.value || '').trim();
    const note = (document.getElementById('deck-meta-note')?.value || '').trim();
    deckMeta[dk] = { ...(deckMeta[dk] || {}), url, lastUpdated, note };
    pruneDeckMetaEntry(dk);
    saveDeckMeta();
    state.showDeckMetaEditor = false;
    render();
    showToast(tr('Decklist e data de mudança salvas!', 'Decklist and update date saved!'));
    return true;
  }

  const setIconBtn = e.target.closest('[data-set-deck-icon]');
  if (setIconBtn) {
    const dk = setIconBtn.dataset.styleDeck;
    const val = setIconBtn.dataset.setDeckIcon;
    if (!deckStyles[dk]) deckStyles[dk] = {};
    if (val === 'auto') delete deckStyles[dk].icon;
    else deckStyles[dk].icon = val;
    if (!deckStyles[dk].icon && !deckStyles[dk].color) delete deckStyles[dk];
    saveDeckStyles();
    render();
    return true;
  }

  const setColorBtn = e.target.closest('[data-set-deck-color]');
  if (setColorBtn) {
    const dk = setColorBtn.dataset.styleDeck;
    const val = setColorBtn.dataset.setDeckColor;
    if (!deckStyles[dk]) deckStyles[dk] = {};
    if (val === 'auto') delete deckStyles[dk].color;
    else deckStyles[dk].color = val;
    if (!deckStyles[dk].icon && !deckStyles[dk].color) delete deckStyles[dk];
    saveDeckStyles();
    render();
    return true;
  }

  const resetStyleBtn = e.target.closest('[data-reset-deck-style]');
  if (resetStyleBtn) {
    delete deckStyles[resetStyleBtn.dataset.resetDeckStyle];
    saveDeckStyles();
    render();
    showToast(tr('Estilo restaurado para o modo automático.', 'Style reset to automatic mode.'));
    return true;
  }

  const selDeck = e.target.closest('[data-select-deck]');
  if (selDeck) {
    state.selectedDeck = selDeck.dataset.selectDeck;
    state.showDeckMetaEditor = false;
    state.showDeckCmdEditor = false;
    state.cmdDraft = null;
    render();
    scrollToSection('deck-xray');
    return true;
  }

  const deckViewBtn = e.target.closest('[data-deck-view]');
  if (deckViewBtn) { state.deckView = deckViewBtn.dataset.deckView; render(); return true; }

  const minG = e.target.closest('[data-min-games]');
  if (minG) { state.deckMinGames = Number(minG.dataset.minGames); render(); return true; }

  return false;
}

export function handleDecksInput(e, { render }) {
  if (e.target.id === 'deck-search') { state.deckSearch = e.target.value; render('deck-search'); return true; }
  if (e.target.id === 'deck-cmd-1') { if (state.cmdDraft) state.cmdDraft.cmd1 = e.target.value; return true; }
  if (e.target.id === 'deck-cmd-2') { if (state.cmdDraft) state.cmdDraft.cmd2 = e.target.value; return true; }
  return false;
}

export function handleDecksChange(e, { render }) {
  if (e.target.id === 'deck-sort') { state.deckSort = e.target.value; render(); return true; }
  return false;
}
