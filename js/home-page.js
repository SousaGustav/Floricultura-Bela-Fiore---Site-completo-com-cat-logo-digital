/**
 * home-page.js
 * Carrega o catálogo e popula as seções dinâmicas da Home:
 * produtos em destaque e categorias principais.
 */

async function inicializarHome() {
  const produtos = await carregarProdutos();

  const destaquesGrid = document.getElementById('featured-grid');
  if (destaquesGrid) {
    const destaques = filtrarDestaques(produtos, 4);
    destaquesGrid.innerHTML = destaques.map(renderizarCardProduto).join('');
  }

  const categoriasGrid = document.getElementById('categories-grid');
  if (categoriasGrid) {
    const categorias = listarCategorias(produtos);
    categoriasGrid.innerHTML = categorias
      .map(
        (c) => `
          <a class="category-card" href="catalogo.html?categoria=${encodeURIComponent(c.nome)}">
            <span class="category-card__icon">${ICONES_CATEGORIA[c.nome] || ICONE_CATEGORIA_PADRAO}</span>
            <span class="category-card__name">${c.nome}</span>
            <span class="category-card__count">${c.total} ${c.total === 1 ? 'item' : 'itens'}</span>
          </a>
        `
      )
      .join('');
  }
}

document.addEventListener('DOMContentLoaded', inicializarHome);
