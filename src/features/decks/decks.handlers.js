import { state } from '../../core/state/store.js';
import { tr } from '../../core/i18n/i18n.service.js';
import { MANA_ORDER } from '../../shared/constants/mana-identity.data.js';
import {
  favoriteDecks,
  saveFavoriteDecks,
  deckStyles,
  saveDeckStyles,
  deckMeta,
  saveDeckMeta,
  registerDeck,
  unregisterDeck,
  getDeckCommanderInfo,
  getDeckColorIdentity,
  getEnemyCmdColorIdentity,
  deckDisplayName,
  pruneDeckMetaEntry
} from '../../shared/utils/deck-style.service.js';
import { todayIso, sanitizeDeckUrl } from '../../shared/utils/formatters.js';
import { showToast } from '../../shared/components/toast.js';

function blankNewDeckDraft() {
  return { name: '', cmd1: '', cmd2: '', partner: false, colors: [], colorsTouched: false, url: '', borrowed: false };
}

function syncNewDeckDraftFromDom() {
  if (!state.newDeckDraft) state.newDeckDraft = blankNewDeckDraft();
  const nEl = document.getElementById('new-deck-name');
  const c1El = document.getElementById('new-deck-cmd1');
  const c2El = document.getElementById('new-deck-cmd2');
  const uEl = document.getElementById('new-deck-url');
  const bEl = document.getElementById('new-deck-borrowed');
  if (nEl) state.newDeckDraft.name = nEl.value;
  if (c1El) state.newDeckDraft.cmd1 = c1El.value;
  if (c2El) state.newDeckDraft.cmd2 = c2El.value;
  if (uEl) state.newDeckDraft.url = uEl.value;
  if (bEl) state.newDeckDraft.borrowed = bEl.checked;
}

export function handleDecksClick(e, { render, onDataChange, scrollToSection }) {
  // Open "+ New Deck" from onboarding or empty state (switches to Decks tab if needed)
  if (e.target.closest('[data-open-new-deck]')) {
    state.tab = 'decks';
    state.showNewDeckForm = true;
    state.newDeckDraft = blankNewDeckDraft();
    render();
    return true;
  }

  if (e.target.closest('[data-toggle-new-deck]')) {
    state.showNewDeckForm = !state.showNewDeckForm;
    if (state.showNewDeckForm && !state.newDeckDraft) state.newDeckDraft = blankNewDeckDraft();
    render();
    return true;
  }

  if (e.target.closest('[data-close-new-deck]')) {
    state.showNewDeckForm = false;
    state.newDeckDraft = null;
    render();
    return true;
  }

  if (e.target.closest('[data-new-deck-partner]')) {
    syncNewDeckDraftFromDom();
    state.newDeckDraft.partner = !state.newDeckDraft.partner;
    render();
    return true;
  }

  const newColorBtn = e.target.closest('[data-new-deck-color]');
  if (newColorBtn) {
    syncNewDeckDraftFromDom();
    const code = newColorBtn.dataset.newDeckColor;
    const cur = new Set(state.newDeckDraft.colors || []);
    if (cur.has(code)) cur.delete(code);
    else cur.add(code);
    state.newDeckDraft.colors = MANA_ORDER.filter(c => cur.has(c));
    state.newDeckDraft.colorsTouched = true;
    render();
    return true;
  }

  if (e.target.id === 'btn-save-new-deck') {
    syncNewDeckDraftFromDom();
    const d = state.newDeckDraft;
    const rawName = (d.name || '').trim();
    if (!rawName) {
      showToast(tr('Informe o nome do deck.', 'Please enter the deck name.'), 'error');
      return true;
    }
    const rawUrl = (d.url || '').trim();
    const cleanUrl = sanitizeDeckUrl(rawUrl);
    if (rawUrl && !cleanUrl) {
      showToast(tr('Link inválido. Use um endereço como https://moxfield.com/...', 'Invalid URL. Use a link like https://moxfield.com/...'), 'error');
      return true;
    }

    const borrowed = Boolean(d.borrowed) || /\(emprestado\)/i.test(rawName);
    const baseName = rawName.replace(/\s*\((?:emprestado|borrowed)\)/gi, '').trim();
    const deckKey = borrowed ? `${baseName} (emprestado)` : baseName;

    const cmd1 = (d.cmd1 || '').trim();
    const partner = Boolean(d.partner);
    const cmd2 = partner ? (d.cmd2 || '').trim() : '';

    // Resolve colors: user-picked OR auto-detected from commander / deck name
    let colors = MANA_ORDER.filter(c => (d.colors || []).includes(c));
    if (!d.colorsTouched && !colors.length) {
      const merged = new Set();
      const c1 = getEnemyCmdColorIdentity(cmd1 || baseName);
      if (Array.isArray(c1)) c1.forEach(x => merged.add(x));
      if (partner && cmd2) {
        const c2 = getEnemyCmdColorIdentity(cmd2);
        if (Array.isArray(c2)) c2.forEach(x => merged.add(x));
      }
      colors = MANA_ORDER.filter(c => merged.has(c));
    }

    registerDeck(deckKey, state.format);

    const nextMeta = { ...(deckMeta[deckKey] || {}), customName: baseName };
    if (cmd1 || partner) {
      nextMeta.cmdCustom = true;
      nextMeta.partner = partner;
      nextMeta.cmd1 = cmd1 || baseName;
      nextMeta.cmd2 = cmd2;
    }
    if (d.colorsTouched || colors.length) {
      nextMeta.colorsCustom = true;
      nextMeta.colors = colors;
    }
    if (cleanUrl) nextMeta.url = cleanUrl;
    deckMeta[deckKey] = nextMeta;
    saveDeckMeta();

    state.selectedDeck = deckKey;
    state.deckMinGames = 0;
    state.showNewDeckForm = false;
    state.newDeckDraft = null;
    state.showDeckRenameEditor = false;
    state.showDeckCmdEditor = false;
    state.showDeckMetaEditor = false;
    onDataChange();
    showToast(tr(`Deck "${baseName}" adicionado à sua garagem!`, `Deck "${baseName}" added to your shelf!`));
    return true;
  }

  // Rename deck inline in Deck X-Ray
  if (e.target.closest('[data-toggle-deck-rename]')) {
    state.showDeckRenameEditor = !state.showDeckRenameEditor;
    render();
    return true;
  }

  const saveRenameBtn = e.target.closest('[data-save-deck-rename]');
  if (saveRenameBtn) {
    const dk = saveRenameBtn.dataset.saveDeckRename;
    const nextName = (document.getElementById('deck-rename-input')?.value || '').trim();
    if (!nextName) {
      showToast(tr('Informe um nome para o deck.', 'Please enter a deck name.'), 'error');
      return true;
    }
    deckMeta[dk] = { ...(deckMeta[dk] || {}), customName: nextName };
    saveDeckMeta();
    state.showDeckRenameEditor = false;
    onDataChange();
    showToast(tr(`Deck renomeado para "${nextName}"!`, `Deck renamed to "${nextName}"!`));
    return true;
  }

  const resetRenameBtn = e.target.closest('[data-reset-deck-rename]');
  if (resetRenameBtn) {
    const dk = resetRenameBtn.dataset.resetDeckRename;
    if (deckMeta[dk]) {
      delete deckMeta[dk].customName;
      pruneDeckMetaEntry(dk);
      saveDeckMeta();
    }
    state.showDeckRenameEditor = false;
    onDataChange();
    showToast(tr('Nome padrão do deck restaurado.', 'Default deck name restored.'));
    return true;
  }

  // Quick action: "+ Log match with this deck" from Deck X-Ray
  const reportWithBtn = e.target.closest('[data-report-with-deck]');
  if (reportWithBtn) {
    const dk = reportWithBtn.dataset.reportWithDeck;
    const borrowed = /\(emprestado\)/i.test(dk);
    state.report.deck = dk.replace(/\s*\(emprestado\)/i, '').trim();
    state.report.borrowed = borrowed;
    state.tab = 'report';
    render();
    return true;
  }

  // Remove unused (0 games) registered deck
  const remDeckBtn = e.target.closest('[data-remove-registered-deck]');
  if (remDeckBtn) {
    const dk = remDeckBtn.dataset.removeRegisteredDeck;
    const disp = deckDisplayName(dk);
    if (unregisterDeck(dk, state.format)) {
      if (favoriteDecks.has(dk)) { favoriteDecks.delete(dk); saveFavoriteDecks(); }
      if (deckStyles[dk]) { delete deckStyles[dk]; saveDeckStyles(); }
      if (deckMeta[dk]) { delete deckMeta[dk]; saveDeckMeta(); }
      if (state.selectedDeck === dk) state.selectedDeck = null;
      onDataChange();
      showToast(tr(`Deck "${disp}" removido da garagem.`, `Deck "${disp}" removed from shelf.`));
    }
    return true;
  }

  const jumpDeck = e.target.closest('[data-jump-deck]');
  if (jumpDeck) {
    state.selectedDeck = jumpDeck.dataset.jumpDeck;
    state.showDeckMetaEditor = false;
    state.showDeckCmdEditor = false;
    state.showDeckRenameEditor = false;
    state.cmdDraft = null;
    state.deckMinGames = 0;
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
    state.showDeckRenameEditor = false;
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
  if (e.target.id === 'new-deck-name' && state.newDeckDraft) {
    state.newDeckDraft.name = e.target.value;
    if (!state.newDeckDraft.colorsTouched && !state.newDeckDraft.cmd1.trim()) {
      const auto = getEnemyCmdColorIdentity(e.target.value);
      if (Array.isArray(auto)) {
        state.newDeckDraft.colors = auto;
        render('new-deck-name');
      }
    }
    return true;
  }
  if (e.target.id === 'new-deck-cmd1' && state.newDeckDraft) {
    state.newDeckDraft.cmd1 = e.target.value;
    if (!state.newDeckDraft.colorsTouched) {
      const auto = getEnemyCmdColorIdentity(e.target.value);
      if (Array.isArray(auto)) {
        state.newDeckDraft.colors = auto;
        render('new-deck-cmd1');
      }
    }
    return true;
  }
  if (e.target.id === 'new-deck-cmd2' && state.newDeckDraft) { state.newDeckDraft.cmd2 = e.target.value; return true; }
  if (e.target.id === 'new-deck-url' && state.newDeckDraft) { state.newDeckDraft.url = e.target.value; return true; }
  return false;
}

export function handleDecksChange(e, { render }) {
  if (e.target.id === 'deck-sort') { state.deckSort = e.target.value; render(); return true; }
  if (e.target.id === 'new-deck-borrowed' && state.newDeckDraft) { state.newDeckDraft.borrowed = e.target.checked; return true; }
  return false;
}
