import { state } from '../../core/state/store.js';
import { isEn, tr } from '../../core/i18n/i18n.service.js';
import { getAllMatches, resetHubToSeed } from '../../core/data/matches.repository.js';
import {
  BACKUP_SCHEMA_VERSION,
  getHubMeta,
  supportsFileLink,
  getLinkedFileName,
  exportBackupJson,
  linkLocalBackupFile,
  unlinkLocalBackupFile,
  importBackupJsonText
} from '../../core/storage/backup.service.js';
import { esc, fmtDateDisp } from '../utils/formatters.js';
import { showToast } from './toast.js';

function formatBackupTimestamp(iso) {
  if (!iso) return tr('Nenhum backup exportado ainda', 'No backup exported yet');
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dateIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${fmtDateDisp(dateIso)} ${hh}:${mm}`;
}

export function renderDataHubModal() {
  const host = document.getElementById('data-hub-modal');
  if (!host) return;

  const btn = document.getElementById('btn-data-hub');
  const linkedName = getLinkedFileName();
  if (btn) {
    btn.classList.toggle('nb-btn-yellow', state.dataHubOpen);
    btn.setAttribute('aria-expanded', state.dataHubOpen ? 'true' : 'false');
    btn.setAttribute('data-tip', linkedName
      ? tr(`Hub de Dados (Auto-save ativo: ${linkedName})`, `Data Hub (Auto-save active: ${linkedName})`)
      : tr('Hub de Dados: Exportar, Importar ou vincular backup (.json)', 'Data Hub: Export, Import, or link local backup (.json)'));
    const dot = document.getElementById('data-hub-dot');
    if (dot) dot.classList.toggle('hidden', !linkedName);
  }

  if (!state.dataHubOpen) {
    host.classList.add('hidden');
    host.innerHTML = '';
    return;
  }

  const allMatches = getAllMatches();
  const activeFormatsCount = new Set(allMatches.map(m => m.format || 'commander')).size;
  const meta = getHubMeta();
  const canLink = supportsFileLink();

  host.classList.remove('hidden');
  host.innerHTML = `
    <div id="data-hub-backdrop" class="fixed inset-0 z-50 bg-[#4E3626]/50 flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="data-hub-title"
        class="nb-card w-full max-w-lg max-h-[90vh] overflow-y-auto scroll-thin p-5 space-y-4">
        <div class="flex items-start justify-between gap-3 pb-3 border-b-2 border-[#4E3626]">
          <div>
            <span class="px-2 py-0.5 rounded-md text-xs badge-pop-purple">LOCAL HUB · v${BACKUP_SCHEMA_VERSION}</span>
            <h2 id="data-hub-title" class="text-lg font-black mt-1">${tr('Hub de Dados & Backup Próprio', 'Personal Data Hub & Backup')}</h2>
            <p class="text-xs font-medium text-muted mt-0.5">${tr('Suas partidas, decks, cores e decklists ficam salvos direto no app — sem precisar colar no chat.', 'Your matches, decks, colors, and decklists stay saved directly in the app — no chat copy-paste required.')}</p>
          </div>
          <button type="button" id="btn-close-data-hub" class="nb-btn px-2.5 py-1 text-xs shrink-0" aria-label="${esc(tr('Fechar', 'Close'))}">✕</button>
        </div>

        <div class="grid grid-cols-2 gap-2.5 text-xs">
          <div class="nb-subtle p-3">
            <div class="font-bold text-muted">${tr('Registros no Hub', 'Matches in Hub')}</div>
            <div class="text-xl font-black tabular-nums mt-0.5">${allMatches.length}</div>
            <div class="font-semibold text-muted">${activeFormatsCount} ${tr(activeFormatsCount === 1 ? 'formato ativo' : 'formatos ativos', activeFormatsCount === 1 ? 'active format' : 'active formats')}</div>
          </div>
          <div class="nb-subtle p-3">
            <div class="font-bold text-muted">${tr('Último Backup (.json)', 'Last Backup (.json)')}</div>
            <div class="text-xs font-black mt-1 leading-snug">${esc(formatBackupTimestamp(meta.lastBackupAt))}</div>
            <div class="font-semibold mt-1 ${linkedName ? 'wr-high' : 'text-muted'}">
              ${linkedName ? `● ${tr('Auto-save:', 'Auto-save:')} ${esc(linkedName)}` : tr('Salvo no navegador', 'Saved in browser')}
            </div>
          </div>
        </div>

        <div class="space-y-2.5">
          <div class="nb-subtle p-3.5 space-y-2">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div class="text-xs font-black">${tr('1. Exportar / Importar Backup Completo (.json)', '1. Export / Import Full Backup (.json)')}</div>
                <p class="text-xs font-medium text-muted mt-0.5">${tr('Ideal para guardar cópia de segurança ou transferir tudo entre celular e computador em segundos.', 'Ideal for safe backups or moving all data between phone and PC in seconds.')}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-wrap pt-1">
              <button type="button" id="btn-export-backup-json" class="nb-btn nb-btn-yellow px-3.5 py-2 text-xs">
                ${tr('↓ Exportar Backup (.json)', '↓ Export Backup (.json)')}
              </button>
              <button type="button" id="btn-import-backup-json" class="nb-btn nb-btn-green px-3.5 py-2 text-xs">
                ${tr('↑ Importar Backup (.json)', '↑ Import Backup (.json)')}
              </button>
              <input id="input-import-backup-json" type="file" accept=".json,application/json" class="hidden" />
            </div>
          </div>

          <div class="nb-subtle p-3.5 space-y-2">
            <div class="text-xs font-black">${tr('2. Vincular Arquivo Local (Auto-Save no PC)', '2. Link Local File (Desktop Auto-Save)')}</div>
            ${canLink ? `
              <p class="text-xs font-medium text-muted leading-relaxed">
                ${tr('Escolha um arquivo <code>.json</code> na sua pasta do <strong>Google Drive, OneDrive ou Documentos</strong>: toda partida ou edição feita nesta sessão será gravada automaticamente nele.', 'Pick a <code>.json</code> file inside your <strong>Google Drive, OneDrive, or Documents</strong> folder: every match or edit in this session auto-saves straight to it.')}
              </p>
              <div class="flex items-center gap-2 flex-wrap pt-1">
                ${linkedName ? `
                  <span class="px-2.5 py-1 rounded-lg text-xs badge-win font-extrabold">● ${esc(linkedName)}</span>
                  <button type="button" id="btn-unlink-backup-file" class="nb-btn px-3 py-1.5 text-xs">${tr('Desvincular', 'Unlink')}</button>
                ` : `
                  <button type="button" id="btn-link-backup-file" class="nb-btn nb-btn-purple px-3.5 py-2 text-xs">${tr('Vincular arquivo .json →', 'Link .json file →')}</button>
                `}
              </div>
            ` : `
              <p class="text-xs font-medium text-muted leading-relaxed">
                ${tr('Disponível no Chrome/Edge para computador. No celular ou Safari, use os botões de <strong>Exportar / Importar Backup (.json)</strong> acima.', 'Available in desktop Chrome/Edge. On mobile or Safari, use the <strong>Export / Import Backup (.json)</strong> buttons above.')}
              </p>
            `}
          </div>

          <div class="nb-subtle p-3 flex items-center justify-between gap-2 flex-wrap">
            <div class="min-w-0">
              <div class="text-xs font-extrabold">${tr('Base inicial do Google Sheets (212 partidas)', 'Original Google Sheets seed (212 matches)')}</div>
              <div class="text-xs text-muted font-medium">${tr('Restaura apenas as 212 partidas originais de Commander caso precise recomeçar.', 'Restores only the original 212 Commander matches if you ever need a fresh start.')}</div>
            </div>
            ${state.confirmResetHub ? `
              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" id="btn-cancel-reset-hub" class="nb-btn px-2.5 py-1 text-xs">${tr('Cancelar', 'Cancel')}</button>
                <button type="button" id="btn-confirm-reset-hub" class="nb-btn nb-btn-pink px-2.5 py-1 text-xs">${tr('Confirmar restauração', 'Confirm restore')}</button>
              </div>
            ` : `
              <button type="button" id="btn-ask-reset-hub" class="nb-pill px-2.5 py-1 text-xs shrink-0">${tr('Restaurar base', 'Restore seed')}</button>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function handleDataHubClick(e, { render, onDataChange }) {
  if (e.target.closest('#btn-data-hub')) {
    state.dataHubOpen = !state.dataHubOpen;
    state.confirmResetHub = false;
    state.formatMenuOpen = false;
    state.langMenuOpen = false;
    renderDataHubModal();
    return true;
  }

  if (e.target.closest('#btn-close-data-hub') || e.target.id === 'data-hub-backdrop') {
    state.dataHubOpen = false;
    state.confirmResetHub = false;
    renderDataHubModal();
    return true;
  }

  if (e.target.closest('#btn-export-backup-json')) {
    const payload = exportBackupJson();
    renderDataHubModal();
    showToast(tr(`Backup exportado com ${payload.matches.length} partidas!`, `Backup exported with ${payload.matches.length} matches!`));
    return true;
  }

  if (e.target.closest('#btn-import-backup-json')) {
    document.getElementById('input-import-backup-json')?.click();
    return true;
  }

  if (e.target.closest('#btn-link-backup-file')) {
    linkLocalBackupFile().then(res => {
      if (res.ok) {
        renderDataHubModal();
        showToast(tr(`Auto-save ativado em "${res.name}"!`, `Auto-save active on "${res.name}"!`));
      } else if (res.reason !== 'cancelled') {
        showToast(tr('Não foi possível vincular o arquivo local.', 'Could not link local file.'), 'error');
      }
    });
    return true;
  }

  if (e.target.closest('#btn-unlink-backup-file')) {
    unlinkLocalBackupFile();
    renderDataHubModal();
    showToast(tr('Arquivo local desvinculado.', 'Local file unlinked.'));
    return true;
  }

  if (e.target.closest('#btn-ask-reset-hub')) {
    state.confirmResetHub = true;
    renderDataHubModal();
    return true;
  }

  if (e.target.closest('#btn-cancel-reset-hub')) {
    state.confirmResetHub = false;
    renderDataHubModal();
    return true;
  }

  if (e.target.closest('#btn-confirm-reset-hub')) {
    resetHubToSeed();
    state.confirmResetHub = false;
    state.dataHubOpen = false;
    onDataChange();
    showToast(tr('Base original de 212 partidas restaurada.', 'Original 212-match seed restored.'));
    return true;
  }

  return false;
}

export function handleDataHubChange(e, { onDataChange }) {
  if (e.target.id !== 'input-import-backup-json') return false;
  const file = e.target.files && e.target.files[0];
  if (!file) return true;
  const reader = new FileReader();
  reader.onload = () => {
    const res = importBackupJsonText(String(reader.result || ''));
    if (res.ok) {
      state.dataHubOpen = false;
      state.confirmResetHub = false;
      onDataChange();
      showToast(tr(`Backup restaurado: ${res.count} partidas carregadas!`, `Backup restored: ${res.count} matches loaded!`));
    } else {
      showToast(tr('Arquivo .json inválido. Use um backup exportado por este tracker.', 'Invalid .json file. Please select a backup exported from this tracker.'), 'error');
    }
  };
  reader.readAsText(file, 'utf-8');
  e.target.value = '';
  return true;
}
