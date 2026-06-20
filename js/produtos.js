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
        ${indisponivel ? '<div class="badge-indisponivel">Indisponível</div>' : ''}
        <img src="${produto.imagemPrincipal}" alt="${produto.nome}" loading="lazy">
      </div>
      <div class="product-card__body">
        <h3 class="product-card__name">${produto.nome}</h3>
        <p class="product-card__desc">${produto.descricaoCurta}</p>
        <div class="product-card__footer">
          <span class="product-card__price">${formatarPreco(produto.preco)}</span>
          <a class="product-card__whatsapp" href="${linkWhatsAppProduto(produto)}" target="_blank" rel="noopener noreferrer" aria-label="Pedir ${produto.nome} pelo WhatsApp" onclick="event.stopPropagation()">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.47 3.47 1.29 4.92L2.05 22l5.31-1.39a9.9 9.9 0 0 0 4.68 1.19h.01c5.46 0 9.91-4.45 9.91-9.91A9.93 9.93 0 0 0 12.04 2Zm5.85 14.18c-.25.7-1.45 1.34-2 1.43-.51.08-1.15.12-1.86-.12-.43-.14-.98-.33-1.68-.64-2.96-1.28-4.89-4.26-5.04-4.46-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.78-.37.2 0 .39 0 .56.01.18.01.42-.07.66.5.25.6.84 2.07.91 2.22.07.15.12.33.02.53-.1.2-.15.32-.3.49-.15.17-.31.38-.45.51-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.36 1.45.3.15.48.13.65-.08.18-.2.74-.86.94-1.16.2-.3.4-.25.66-.15.27.1 1.7.8 1.99.94.3.15.49.22.56.34.07.13.07.74-.18 1.44Z"/></svg>
          </a>
        </div>
      </div>
    </article>
  `;
}
