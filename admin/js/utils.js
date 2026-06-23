/**
 * utils.js
 * Funções utilitárias compartilhadas pelo painel admin:
 * toast de feedback, loading global, formatação e confirmação.
 */

// ── Toast ──────────────────────────────────────────────────────────────────────

const Toast = (() => {
  let container;

  function init() {
    container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
  }

  /**
   * Exibe um toast.
   * @param {string} mensagem
   * @param {'success'|'error'|'info'|'warning'} tipo
   * @param {number} duracao ms
   */
  function show(mensagem, tipo = 'success', duracao = 3500) {
    if (!container) init();

    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${tipo}`;
    toast.innerHTML = `
      <span class="toast__icon">${icons[tipo]}</span>
      <span class="toast__msg">${mensagem}</span>
      <button class="toast__close" aria-label="Fechar">×</button>
    `;

    container.appendChild(toast);

    // Anima entrada
    requestAnimationFrame(() => toast.classList.add('toast--visible'));

    const remover = () => {
      toast.classList.remove('toast--visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    };

    toast.querySelector('.toast__close').addEventListener('click', remover);
    setTimeout(remover, duracao);
  }

  return {
    success: (msg, dur) => show(msg, 'success', dur),
    error:   (msg, dur) => show(msg, 'error',   dur || 5000),
    warning: (msg, dur) => show(msg, 'warning', dur),
    info:    (msg, dur) => show(msg, 'info',    dur),
  };
})();

// ── Loading global ─────────────────────────────────────────────────────────────

const Loading = (() => {
  let overlay;
  let count = 0;

  function init() {
    overlay = document.getElementById('loading-overlay');
  }

  function show(texto = 'Salvando…') {
    if (!overlay) init();
    count++;
    if (overlay) {
      overlay.querySelector('.loading-text').textContent = texto;
      overlay.classList.add('is-visible');
    }
  }

  function hide() {
    count = Math.max(0, count - 1);
    if (count === 0 && overlay) {
      overlay.classList.remove('is-visible');
    }
  }

  return { show, hide };
})();

// ── Confirmação ────────────────────────────────────────────────────────────────

/**
 * Modal de confirmação com Promise.
 * @param {string} titulo
 * @param {string} mensagem
 * @param {string} labelConfirmar
 * @returns {Promise<boolean>}
 */
function confirmar(titulo, mensagem, labelConfirmar = 'Confirmar') {
  return new Promise(resolve => {
    const modal = document.getElementById('modal-confirmar');
    const elTitulo = modal.querySelector('.confirm-title');
    const elMsg    = modal.querySelector('.confirm-msg');
    const btnSim   = modal.querySelector('.btn-confirm-yes');
    const btnNao   = modal.querySelector('.btn-confirm-no');

    elTitulo.textContent = titulo;
    elMsg.textContent    = mensagem;
    btnSim.textContent   = labelConfirmar;

    abrirModal('modal-confirmar');

    const sim = () => { fecharModal('modal-confirmar'); resolve(true);  cleanup(); };
    const nao = () => { fecharModal('modal-confirmar'); resolve(false); cleanup(); };

    btnSim.addEventListener('click', sim, { once: true });
    btnNao.addEventListener('click', nao, { once: true });

    function cleanup() {
      btnSim.removeEventListener('click', sim);
      btnNao.removeEventListener('click', nao);
    }
  });
}

// ── Modais ─────────────────────────────────────────────────────────────────────

function abrirModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('is-open');
  document.body.classList.add('modal-open');
  // Foco no primeiro input/button focável
  setTimeout(() => el.querySelector('input, button, select, textarea')?.focus(), 50);
}

function fecharModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('is-open');
  // Remove blur do body só se não houver outro modal aberto
  if (!document.querySelector('.modal.is-open')) {
    document.body.classList.remove('modal-open');
  }
}

// Fechar modal ao clicar no overlay
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal')) {
    fecharModal(e.target.id);
  }
});

// Fechar com Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.is-open').forEach(m => fecharModal(m.id));
  }
});

// ── Formatação ─────────────────────────────────────────────────────────────────

function fmtMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtData(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function gerarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ── Skeleton loading ───────────────────────────────────────────────────────────

function skeletonRows(n = 6) {
  return Array.from({ length: n }, () => `
    <tr class="skeleton-row">
      <td><div class="skeleton skeleton--img"></div></td>
      <td><div class="skeleton skeleton--text"></div><div class="skeleton skeleton--text-sm"></div></td>
      <td><div class="skeleton skeleton--badge"></div></td>
      <td><div class="skeleton skeleton--text-sm"></div></td>
      <td><div class="skeleton skeleton--badge"></div></td>
      <td><div class="skeleton skeleton--actions"></div></td>
    </tr>
  `).join('');
}
