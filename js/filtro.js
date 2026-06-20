/**
 * filtro.js
 * Lógica de filtro por categoria e busca por nome, usada na página catalogo.html.
 * Trabalha 100% client-side sobre a lista de produtos já carregada.
 */

const EstadoCatalogo = {
  produtos: [],
  categoriaAtiva: 'Todos',
  termoBusca: '',
};

/** Aplica os filtros atuais (categoria + busca) sobre a lista completa de produtos. */
function aplicarFiltros() {
  const termo = EstadoCatalogo.termoBusca.trim().toLowerCase();

  return EstadoCatalogo.produtos.filter((p) => {
    const passaCategoria =
      EstadoCatalogo.categoriaAtiva === 'Todos' || p.categoria === EstadoCatalogo.categoriaAtiva;
    const passaBusca = termo === '' || p.nome.toLowerCase().includes(termo);
    return passaCategoria && passaBusca;
  });
}

/** Re-renderiza a grade de produtos do catálogo com base no estado atual. */
function renderizarGradeCatalogo() {
  const grid = document.getElementById('catalog-grid');
  const contador = document.getElementById('catalog-count');
  if (!grid) return;

  const resultado = aplicarFiltros();

  if (contador) {
    contador.textContent = `${resultado.length} ${resultado.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`;
  }

  if (resultado.length === 0) {
    grid.innerHTML = `
      <div class="catalog-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <p>Nenhum produto encontrado para essa busca.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = resultado.map(renderizarCardProduto).join('');
}

/** Monta os chips de filtro de categoria dinamicamente a partir do catálogo. */
function renderizarFiltrosCategoria() {
  const container = document.getElementById('catalog-filters');
  if (!container) return;

  const categorias = listarCategorias(EstadoCatalogo.produtos);

  const chips = [
    { nome: 'Todos', total: EstadoCatalogo.produtos.length },
    ...categorias,
  ];

  container.innerHTML = chips
    .map(
      (c) => `
        <button type="button" class="chip ${c.nome === EstadoCatalogo.categoriaAtiva ? 'is-active' : ''}" data-categoria="${c.nome}">
          ${c.nome} <span style="opacity:.6; margin-left:4px;">(${c.total})</span>
        </button>
      `
    )
    .join('');

  container.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      EstadoCatalogo.categoriaAtiva = chip.dataset.categoria;
      container.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      renderizarGradeCatalogo();
    });
  });
}

/** Liga o input de busca ao estado do catálogo (com debounce simples). */
function inicializarBusca() {
  const input = document.getElementById('catalog-search-input');
  if (!input) return;

  let timeoutId;
  input.addEventListener('input', (e) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      EstadoCatalogo.termoBusca = e.target.value;
      renderizarGradeCatalogo();
    }, 180);
  });
}

/** Lê ?categoria= da URL (vindo dos cards de categoria da Home) e pré-seleciona o filtro. */
function aplicarCategoriaDaURL() {
  const categoriaURL = obterParametroURL('categoria');
  if (categoriaURL) {
    EstadoCatalogo.categoriaAtiva = categoriaURL;
  }
}

async function inicializarCatalogo() {
  EstadoCatalogo.produtos = await carregarProdutos();
  aplicarCategoriaDaURL();
  renderizarFiltrosCategoria();
  renderizarGradeCatalogo();
  inicializarBusca();
}

if (document.getElementById('catalog-grid')) {
  document.addEventListener('DOMContentLoaded', inicializarCatalogo);
}
