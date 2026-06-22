/**
 * admin.js
 * Painel de gerenciamento de disponibilidade de produtos.
 *
 * Arquitetura de integração (sem alterar nenhum arquivo existente):
 * ─────────────────────────────────────────────────────────────────
 * • Admin grava em localStorage['flora-cia:admin-status']:
 *     { "1": false, "5": false, ... }   ← apenas overrides explícitos
 *   Produtos ausentes dessa chave usam o valor do JSON (disponivel).
 *
 * • O catálogo público lê esse objeto em carregarProdutos() via
 *   aplicarStatusAdmin(), que mescla antes de renderizar.
 *   Nenhuma função de render existente precisa mudar.
 * ─────────────────────────────────────────────────────────────────
 */

// ── Constantes ────────────────────────────────────────────────────────────────

const ADMIN_STORAGE_KEY  = 'flora-cia:admin-status';
const PRODUTOS_JSON_PATH = '../data/produtos.json';  // relativo à pasta /admin/

// ── Estado local do painel ────────────────────────────────────────────────────

const Admin = {
  /** Array completo de produtos vindo do JSON */
  produtos: [],

  /** Overrides salvos: { [id]: boolean } */
  statusOverrides: {},

  /** Termo de busca ativo no momento */
  termoBusca: '',

  // ── Persistência ──────────────────────────────────────────────

  /** Carrega os overrides salvos no localStorage. */
  carregarOverrides() {
    try {
      const salvo = localStorage.getItem(ADMIN_STORAGE_KEY);
      this.statusOverrides = salvo ? JSON.parse(salvo) : {};
    } catch {
      this.statusOverrides = {};
    }
  },

  /** Salva os overrides no localStorage. */
  salvarOverrides() {
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(this.statusOverrides));
    } catch (e) {
      console.error('Erro ao salvar configurações:', e);
    }
  },

  // ── Leitura de status ─────────────────────────────────────────

  /**
   * Retorna o status efetivo de um produto:
   * override do admin se existir, caso contrário o valor do JSON.
   */
  statusEfetivo(produto) {
    const id = String(produto.id);
    return id in this.statusOverrides
      ? this.statusOverrides[id]
      : produto.disponivel;
  },

  // ── Mutação ───────────────────────────────────────────────────

  /** Alterna a disponibilidade de um produto e persiste. */
  alternarStatus(produtoId) {
    const id       = String(produtoId);
    const produto  = this.produtos.find(p => String(p.id) === id);
    if (!produto) return;

    const statusAtual  = this.statusEfetivo(produto);
    this.statusOverrides[id] = !statusAtual;
    this.salvarOverrides();
    return !statusAtual;            // retorna o novo status
  },

  // ── Dados filtrados ───────────────────────────────────────────

  /** Lista produtos filtrados pelo termo de busca atual. */
  produtosFiltrados() {
    const termo = this.termoBusca.trim().toLowerCase();
    if (!termo) return this.produtos;
    return this.produtos.filter(p =>
      p.nome.toLowerCase().includes(termo)
    );
  },

  /** Agrupa um array de produtos por categoria, preservando a ordem. */
  agruparPorCategoria(produtos) {
    const grupos = {};
    produtos.forEach(p => {
      if (!grupos[p.categoria]) grupos[p.categoria] = [];
      grupos[p.categoria].push(p);
    });
    return grupos;
  },

  // ── Métricas ──────────────────────────────────────────────────

  contarAtivos()    { return this.produtos.filter(p =>  this.statusEfetivo(p)).length; },
  contarInativos()  { return this.produtos.filter(p => !this.statusEfetivo(p)).length; },
};

// ── Utilitários de formatação ─────────────────────────────────────────────────

/** Formata número como moeda BRL. */
function fmt(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ── Renderização ──────────────────────────────────────────────────────────────

/**
 * Atualiza os números do header de resumo.
 * Chamado sempre que um toggle muda.
 */
function atualizarResumo() {
  const total    = Admin.produtos.length;
  const ativos   = Admin.contarAtivos();
  const inativos = Admin.contarInativos();

  document.getElementById('stat-total').textContent   = total;
  document.getElementById('stat-ativos').textContent   = ativos;
  document.getElementById('stat-inativos').textContent = inativos;
}

/**
 * Renderiza a lista completa (agrupada por categoria) respeitando a busca ativa.
 * Não regera o DOM desnecessariamente — usa update in-place quando possível.
 */
function renderizarLista() {
  const container  = document.getElementById('admin-list');
  const vazio      = document.getElementById('admin-empty');
  const filtrados  = Admin.produtosFiltrados();

  if (filtrados.length === 0) {
    container.innerHTML = '';
    vazio.hidden = false;
    return;
  }
  vazio.hidden = true;

  const grupos = Admin.agruparPorCategoria(filtrados);

  container.innerHTML = Object.entries(grupos).map(([categoria, produtos]) => `
    <section class="admin-group" aria-label="Categoria ${categoria}">
      <header class="admin-group__header">
        <h2 class="admin-group__title">${categoria}</h2>
        <span class="admin-group__count">${produtos.length} ${produtos.length === 1 ? 'produto' : 'produtos'}</span>
      </header>
      <ul class="admin-product-list" role="list">
        ${produtos.map(renderizarItem).join('')}
      </ul>
    </section>
  `).join('');

  // Liga os toggles recém-criados
  container.querySelectorAll('.toggle-switch input').forEach(input => {
    input.addEventListener('change', () => {
      const id      = Number(input.dataset.id);
      const novoStatus = Admin.alternarStatus(id);
      atualizarItemVisual(id, novoStatus);
      atualizarResumo();
      mostrarToast(novoStatus
        ? 'Produto ativado no catálogo'
        : 'Produto removido do catálogo');
    });
  });
}

/**
 * Gera o HTML de uma linha de produto na listagem admin.
 */
function renderizarItem(produto) {
  const ativo   = Admin.statusEfetivo(produto);
  const id      = produto.id;
  const imgSrc  = `../${produto.imagemPrincipal}`;     // relativo à /admin/

  return `
    <li class="admin-product ${ativo ? '' : 'is-inactive'}" data-product-id="${id}">
      <div class="admin-product__image">
        <img src="${imgSrc}" alt="${produto.nome}" loading="lazy">
      </div>

      <div class="admin-product__info">
        <span class="admin-product__code">${produto.codigo}</span>
        <strong class="admin-product__name">${produto.nome}</strong>
        <span class="admin-product__price">${fmt(produto.preco)}</span>
      </div>

      <div class="admin-product__status">
        <span class="status-badge ${ativo ? 'status-badge--active' : 'status-badge--inactive'}">
          ${ativo ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <label class="toggle-switch" aria-label="Alternar disponibilidade de ${produto.nome}">
        <input
          type="checkbox"
          data-id="${id}"
          ${ativo ? 'checked' : ''}
          role="switch"
          aria-checked="${ativo}"
        >
        <span class="toggle-switch__track">
          <span class="toggle-switch__thumb"></span>
        </span>
      </label>
    </li>
  `;
}

/**
 * Atualiza visualmente um item já renderizado sem recriar o DOM completo.
 * Mais eficiente e mantém foco/estado do teclado.
 */
function atualizarItemVisual(produtoId, ativo) {
  const li    = document.querySelector(`.admin-product[data-product-id="${produtoId}"]`);
  const badge = li?.querySelector('.status-badge');
  const input = li?.querySelector('input[type="checkbox"]');
  if (!li || !badge || !input) return;

  li.classList.toggle('is-inactive', !ativo);

  badge.textContent = ativo ? 'Ativo' : 'Inativo';
  badge.className   = `status-badge ${ativo ? 'status-badge--active' : 'status-badge--inactive'}`;

  input.checked          = ativo;
  input.setAttribute('aria-checked', String(ativo));
}

// ── Toast de feedback ─────────────────────────────────────────────────────────

let toastTimer = null;

/** Exibe uma mensagem de feedback temporária no canto da tela. */
function mostrarToast(mensagem) {
  const toast = document.getElementById('admin-toast');
  if (!toast) return;

  toast.textContent = mensagem;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

// ── Busca ─────────────────────────────────────────────────────────────────────

function inicializarBusca() {
  const input = document.getElementById('admin-search');
  if (!input) return;

  let debounce;
  input.addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      Admin.termoBusca = e.target.value;
      renderizarLista();
    }, 180);
  });

  // Limpar busca com Escape
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      input.value    = '';
      Admin.termoBusca = '';
      renderizarLista();
    }
  });
}

// ── Botão "Resetar tudo" ──────────────────────────────────────────────────────

function inicializarReset() {
  const btn = document.getElementById('btn-reset');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const confirmar = confirm(
      'Isso vai restaurar todos os produtos para o status original do catálogo.\n\nDeseja continuar?'
    );
    if (!confirmar) return;

    Admin.statusOverrides = {};
    Admin.salvarOverrides();
    renderizarLista();
    atualizarResumo();
    mostrarToast('Configurações resetadas com sucesso');
  });
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function inicializarAdmin() {
  // 1. Carrega overrides persistidos
  Admin.carregarOverrides();

  // 2. Busca produtos do JSON
  try {
    const resp = await fetch(PRODUTOS_JSON_PATH);
    if (!resp.ok) throw new Error('Falha ao carregar produtos.json');
    Admin.produtos = await resp.json();
  } catch (e) {
    console.error(e);
    document.getElementById('admin-list').innerHTML =
      '<p class="admin-error">Não foi possível carregar os produtos. Certifique-se de usar um servidor local.</p>';
    return;
  }

  // 3. Renderiza
  atualizarResumo();
  renderizarLista();

  // 4. Liga interações
  inicializarBusca();
  inicializarReset();
}

document.addEventListener('DOMContentLoaded', inicializarAdmin);
