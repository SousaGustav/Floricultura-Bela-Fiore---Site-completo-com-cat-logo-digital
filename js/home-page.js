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
    ligarBotoesAdicionarCarrinho(produtos, destaquesGrid);
  }

  const categoriasGrid = document.getElementById('categories-grid');
  if (categoriasGrid) {
    const categorias = listarCategorias(produtos);
    categoriasGrid.innerHTML = categorias
      .map(
        (c) => `
          <a class="category-card" href="catalogo.html?categoria=${encodeURIComponent(c.nome)}">
            <div class="category-card__icon-grid">
            ${produtos
            .filter(p => p.categoria === c.nome)
            .slice(0, 4)
            .map(p => `<img src="${p.imagemPrincipal}" alt="${p.nome}">`)
            .join('')}
            </div>
            <span class="category-card__name">${c.nome}</span>
            <span class="category-card__count">${c.total} ${c.total === 1 ? 'item' : 'itens'}</span>
          </a>
        `
      )
      .join('');
  }
  console.log(
  produtos
    .filter(p => p.categoria === "Buquê de rosas vermelhas")
    .slice(0, 4)
);
}

document.addEventListener('DOMContentLoaded', inicializarHome);

