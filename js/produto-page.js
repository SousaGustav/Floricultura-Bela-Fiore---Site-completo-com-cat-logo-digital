/**
 * produto-page.js
 * Lógica específica da página produto.html: lê o slug da URL,
 * busca o produto correspondente e popula o DOM.
 */

function formatarPrecoDetalhado(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderizarGaleria(produto) {
  const mainImg = document.getElementById('gallery-main-img');
  const thumbsContainer = document.getElementById('gallery-thumbs');
  if (!mainImg || !thumbsContainer) return;

  mainImg.src = produto.galeria[0];
  mainImg.alt = produto.nome;

  thumbsContainer.innerHTML = produto.galeria
    .map(
      (img, i) => `
        <button type="button" class="product-gallery__thumb ${i === 0 ? 'is-active' : ''}" data-img="${img}" aria-label="Ver foto ${i + 1} de ${produto.nome}">
          <img src="${img}" alt="${produto.nome} - foto ${i + 1}">
        </button>
      `
    )
    .join('');

  thumbsContainer.querySelectorAll('.product-gallery__thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      mainImg.style.opacity = 0;
      setTimeout(() => {
        mainImg.src = thumb.dataset.img;
        mainImg.style.opacity = 1;
      }, 150);
      thumbsContainer.querySelectorAll('.product-gallery__thumb').forEach((t) => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
    });
  });
}

function renderizarInfoProduto(produto) {
  document.title = `${produto.nome} | Flora & Cia`;

  document.getElementById('product-category').textContent = produto.categoria;
  document.getElementById('product-code').textContent = `Cód. ${produto.codigo}`;
  document.getElementById('product-name').textContent = produto.nome;
  document.getElementById('product-price').textContent = formatarPrecoDetalhado(produto.preco);
  document.getElementById('product-description').textContent = produto.descricao;
  document.getElementById('breadcrumb-current').textContent = produto.nome;

  const tagsContainer = document.getElementById('product-tags');
  if (tagsContainer) {
    tagsContainer.innerHTML = produto.tags
      .map((tag) => `<span class="chip">${tag}</span>`)
      .join('');
  }

  const indisponivel = produto.disponivel === false;
  const unavailableBox = document.getElementById('product-unavailable');
  const qtyWrap = document.getElementById('product-qty-wrap');
  const addBtn = document.getElementById('product-add-cart-btn');
  const qtyValue = document.getElementById('product-qty-value');

  if (indisponivel) {
    unavailableBox.style.display = 'block';
    qtyWrap.style.display = 'none';
    addBtn.disabled = true;
    addBtn.querySelector('.btn-text').textContent = 'Produto esgotado';
    return;
  }

  let quantidade = 1;
  qtyValue.textContent = quantidade;

  document.getElementById('product-qty-minus').addEventListener('click', () => {
    quantidade = Math.max(1, quantidade - 1);
    qtyValue.textContent = quantidade;
  });

  document.getElementById('product-qty-plus').addEventListener('click', () => {
    quantidade += 1;
    qtyValue.textContent = quantidade;
  });

  addBtn.addEventListener('click', () => {
    Carrinho.adicionar(produto, quantidade);
    abrirCarrinho();
  });
}

function renderizarRelacionados(produto, todosProdutos) {
  const container = document.getElementById('related-grid');
  if (!container) return;

  const relacionados = todosProdutos
    .filter((p) => p.categoria === produto.categoria && p.id !== produto.id)
    .slice(0, 4);

  if (relacionados.length === 0) {
    document.getElementById('related-section')?.remove();
    return;
  }

  container.innerHTML = relacionados.map(renderizarCardProduto).join('');
  ligarBotoesAdicionarCarrinho(todosProdutos, container);
}

async function inicializarPaginaProduto() {
  const slug = obterParametroURL('p');
  const produtos = await carregarProdutos();
  const produto = produtos.find((p) => p.slug === slug);

  if (!produto) {
    document.getElementById('product-detail-wrap').innerHTML = `
      <div class="text-center" style="padding: 80px 0;">
        <h2>Produto não encontrado</h2>
        <p class="text-muted" style="margin: 12px 0 24px;">O item que você procura pode ter sido removido do catálogo.</p>
        <a href="catalogo.html" class="btn btn--primary">Voltar ao catálogo</a>
      </div>
    `;
    return;
  }

  renderizarGaleria(produto);
  renderizarInfoProduto(produto);
  renderizarRelacionados(produto, produtos);
}

if (document.getElementById('product-detail-wrap')) {
  document.addEventListener('DOMContentLoaded', inicializarPaginaProduto);
}
