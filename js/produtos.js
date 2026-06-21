/**
 * produtos.js
 * Responsável por carregar o catálogo (data/produtos.json) e expor
 * funções utilitárias de busca/renderização usadas pelas demais páginas.
 */

const PRODUTOS_JSON_PATH = 'data/produtos.json';

// Ícones SVG inline por categoria (usados nos cards de categoria da Home)
const ICONES_CATEGORIA = {
  'Buquês': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3c1.5 0 2.5 1.2 2.5 2.6 0 1-.6 1.8-1.3 2.4M12 3c-1.5 0-2.5 1.2-2.5 2.6 0 1 .6 1.8 1.3 2.4M12 3v5m-6 1c-.8-1.2-.4-2.7.8-3.4 1-.6 2.2-.3 3 .4M6 9c-1.4.3-2.3 1.6-2 3 .3 1.1 1.3 1.8 2.4 1.8M6 9l3.5 2m8.5-2c.8-1.2.4-2.7-.8-3.4-1-.6-2.2-.3-3 .4M18 9c1.4.3 2.3 1.6 2 3-.3 1.1-1.3 1.8-2.4 1.8M18 9l-3.5 2M12 21v-9.5m0 0L8 9m4 2.5L16 9"/></svg>',
  'Arranjos': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M12 13v8M8 21h8M6 9c-2 0-3.5 1.5-3.5 3.4M18 9c2 0 3.5 1.5 3.5 3.4"/></svg>',
  'Cestas': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 10h16l-1.5 9.5a1.5 1.5 0 0 1-1.5 1.3H7a1.5 1.5 0 0 1-1.5-1.3L4 10Z"/><path d="M7 10a5 5 0 0 1 10 0M12 4v2"/></svg>',
  'Plantas': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 22v-9M12 13c-3.5 0-6-2.5-6-6 0 0 6-1 6 6Zm0 0c3.5 0 6-2.5 6-6 0 0-6-1-6 6Z"/><path d="M9 22h6"/></svg>',
};

const ICONE_CATEGORIA_PADRAO =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/></svg>';

/**
 * Busca o JSON de produtos. Lança erro tratável se o fetch falhar
 * (útil para avisar o usuário caso o site esteja rodando sem servidor local).
 * @returns {Promise<Array>}
 */
async function carregarProdutos() {
  try {
    const resp = await fetch(PRODUTOS_JSON_PATH);
    if (!resp.ok) throw new Error('Falha ao carregar produtos.json');
    return await resp.json();
  } catch (erro) {
    console.error('Erro ao carregar catálogo:', erro);
    return [];
  }
}

/** Retorna apenas os produtos marcados como destaque. */
function filtrarDestaques(produtos, limite = 4) {
  return produtos.filter((p) => p.destaque).slice(0, limite);
}

/** Retorna a lista de categorias únicas presentes no catálogo, com contagem. */
function listarCategorias(produtos) {
  const mapa = {};
  produtos.forEach((p) => {
    mapa[p.categoria] = (mapa[p.categoria] || 0) + 1;
  });
  return Object.entries(mapa).map(([nome, total]) => ({ nome, total }));
}

/** Lê o parâmetro de query string informado (ex: ?p=slug). */
function obterParametroURL(nome) {
  const params = new URLSearchParams(window.location.search);
  return params.get(nome);
}

/**
 * Gera o HTML de um card de produto.
 * Usado tanto na Home (destaques) quanto no Catálogo (grade completa).
 */
function renderizarCardProduto(produto) {
  const indisponivel = produto.disponivel === false;
  return `
    <article class="product-card" data-id="${produto.id}" data-categoria="${produto.categoria}">
      <a class="product-card__link" href="produto.html?p=${produto.slug}" aria-label="Ver detalhes de ${produto.nome}"></a>
      <div class="product-card__image-wrap">
        <span class="product-card__code">${produto.codigo}</span>
        <span class="product-card__category">${produto.categoria}</span>
        ${indisponivel ? '<div class="badge-indisponivel">Esgotado</div>' : ''}
        <img src="${produto.imagemPrincipal}" alt="${produto.nome}" loading="lazy">
      </div>
      <div class="product-card__body">
        <h3 class="product-card__name">${produto.nome}</h3>
        <p class="product-card__desc">${produto.descricaoCurta}</p>
        <div class="product-card__footer">
          <span class="product-card__price">${formatarPreco(produto.preco)}</span>
          <button
            type="button"
            class="product-card__whatsapp product-card__add-cart"
            data-add-to-cart="${produto.id}"
            aria-label="Adicionar ${produto.nome} ao carrinho"
            onclick="event.stopPropagation()"
            ${indisponivel ? 'disabled' : ''}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>
          </button>
        </div>
      </div>
    </article>
  `;
}

/**
 * Liga os botões "adicionar ao carrinho" presentes em uma grade de cards já renderizada.
 * Precisa ser chamado depois de qualquer innerHTML que use renderizarCardProduto.
 * @param {Array} produtos - Lista completa de produtos (para localizar pelo id).
 * @param {HTMLElement} container - Elemento que contém os cards renderizados.
 */
function ligarBotoesAdicionarCarrinho(produtos, container) {
  container.querySelectorAll('[data-add-to-cart]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.addToCart);
      const produto = produtos.find((p) => p.id === id);
      if (!produto) return;
      Carrinho.adicionar(produto, 1);
      animarConfirmacaoAdicionado(btn);
    });
  });
}

/** Pequena animação/feedback visual ao adicionar um item ao carrinho. */
function animarConfirmacaoAdicionado(btn) {
  const original = btn.innerHTML;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12l5 5L20 7"/></svg>';
  btn.classList.add('is-added');
  setTimeout(() => {
    btn.innerHTML = original;
    btn.classList.remove('is-added');
  }, 1200);
}
