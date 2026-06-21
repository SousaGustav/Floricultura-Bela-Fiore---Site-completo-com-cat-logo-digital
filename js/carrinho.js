/**
 * carrinho.js
 * Gerencia o estado do carrinho de compras: adicionar, remover, alterar
 * quantidade, persistência em localStorage e renderização do drawer.
 * Compartilhado por todas as páginas do site.
 */

const CARRINHO_STORAGE_KEY = 'flora-cia:carrinho';

const Carrinho = {
  itens: [], // [{ produto: {...}, quantidade: N }]

  /** Carrega o carrinho salvo do localStorage (se existir). */
  carregar() {
    try {
      const salvo = localStorage.getItem(CARRINHO_STORAGE_KEY);
      this.itens = salvo ? JSON.parse(salvo) : [];
    } catch (erro) {
      console.error('Erro ao carregar carrinho do localStorage:', erro);
      this.itens = [];
    }
  },

  /** Persiste o estado atual do carrinho no localStorage. */
  salvar() {
    try {
      localStorage.setItem(CARRINHO_STORAGE_KEY, JSON.stringify(this.itens));
    } catch (erro) {
      console.error('Erro ao salvar carrinho no localStorage:', erro);
    }
  },

  /** Adiciona um produto ao carrinho (ou incrementa a quantidade se já existir). */
  adicionar(produto, quantidade = 1) {
    if (produto.disponivel === false) return;

    const existente = this.itens.find((item) => item.produto.id === produto.id);
    if (existente) {
      existente.quantidade += quantidade;
    } else {
      this.itens.push({ produto, quantidade });
    }
    this.salvar();
    this.atualizarUI();
  },

  /** Remove um item completamente do carrinho. */
  remover(produtoId) {
    this.itens = this.itens.filter((item) => item.produto.id !== produtoId);
    this.salvar();
    this.atualizarUI();
  },

  /** Define a quantidade de um item específico (mínimo 1; usar remover() para excluir). */
  definirQuantidade(produtoId, quantidade) {
    const item = this.itens.find((item) => item.produto.id === produtoId);
    if (!item) return;
    item.quantidade = Math.max(1, quantidade);
    this.salvar();
    this.atualizarUI();
  },

  /** Esvazia o carrinho por completo (usado após finalizar o pedido). */
  limpar() {
    this.itens = [];
    this.salvar();
    this.atualizarUI();
  },

  /** Quantidade total de itens (soma das quantidades, não só linhas distintas). */
  totalItens() {
    return this.itens.reduce((soma, item) => soma + item.quantidade, 0);
  },

  /** Valor total do carrinho em reais (número). */
  totalValor() {
    return this.itens.reduce((soma, item) => soma + item.produto.preco * item.quantidade, 0);
  },

  /** Atualiza todos os pontos da UI que dependem do estado do carrinho. */
  atualizarUI() {
    atualizarContadorCarrinho();
    renderizarDrawerCarrinho();
  },
};

/** Atualiza o badge numérico no ícone de carrinho da navbar. */
function atualizarContadorCarrinho() {
  const badges = document.querySelectorAll('[data-cart-count]');
  const total = Carrinho.totalItens();
  badges.forEach((badge) => {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
  });
}

/** Renderiza a lista de itens dentro do drawer do carrinho. */
function renderizarDrawerCarrinho() {
  const lista = document.getElementById('cart-items-list');
  const vazio = document.getElementById('cart-empty-state');
  const resumo = document.getElementById('cart-summary');
  const checkoutBtn = document.getElementById('cart-checkout-btn');
  if (!lista) return; // drawer não presente nesta página (não deveria acontecer, mas defensivo)

  if (Carrinho.itens.length === 0) {
    lista.innerHTML = '';
    vazio.style.display = 'flex';
    resumo.style.display = 'none';
    checkoutBtn.disabled = true;
    return;
  }

  vazio.style.display = 'none';
  resumo.style.display = 'block';
  checkoutBtn.disabled = false;

  lista.innerHTML = Carrinho.itens
    .map(
      (item) => `
        <div class="cart-item" data-id="${item.produto.id}">
          <div class="cart-item__image">
            <img src="${item.produto.imagemPrincipal}" alt="${item.produto.nome}">
          </div>
          <div class="cart-item__info">
            <span class="cart-item__name">${item.produto.nome}</span>
            <span class="cart-item__price">${formatarPreco(item.produto.preco)}</span>
            <div class="cart-item__qty">
              <button type="button" class="cart-item__qty-btn" data-action="diminuir" aria-label="Diminuir quantidade">−</button>
              <span class="cart-item__qty-value">${item.quantidade}</span>
              <button type="button" class="cart-item__qty-btn" data-action="aumentar" aria-label="Aumentar quantidade">+</button>
            </div>
          </div>
          <button type="button" class="cart-item__remove" aria-label="Remover ${item.produto.nome} do carrinho">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m3 0-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7"/></svg>
          </button>
        </div>
      `
    )
    .join('');

  document.getElementById('cart-total-value').textContent = formatarPreco(Carrinho.totalValor());
  document.getElementById('cart-total-count').textContent =
    `${Carrinho.totalItens()} ${Carrinho.totalItens() === 1 ? 'item' : 'itens'}`;

  const checkoutCount = document.getElementById('cart-total-count-checkout');
  const checkoutValue = document.getElementById('cart-total-value-checkout');
  if (checkoutCount) checkoutCount.textContent = `${Carrinho.totalItens()} ${Carrinho.totalItens() === 1 ? 'item' : 'itens'}`;
  if (checkoutValue) checkoutValue.textContent = formatarPreco(Carrinho.totalValor());

  // Liga os eventos de quantidade/remoção (re-ligados a cada render, lista é recriada)
  lista.querySelectorAll('.cart-item').forEach((el) => {
    const id = Number(el.dataset.id);
    const item = Carrinho.itens.find((i) => i.produto.id === id);

    el.querySelector('[data-action="aumentar"]').addEventListener('click', () => {
      Carrinho.definirQuantidade(id, item.quantidade + 1);
    });
    el.querySelector('[data-action="diminuir"]').addEventListener('click', () => {
      if (item.quantidade <= 1) {
        Carrinho.remover(id);
      } else {
        Carrinho.definirQuantidade(id, item.quantidade - 1);
      }
    });
    el.querySelector('.cart-item__remove').addEventListener('click', () => {
      Carrinho.remover(id);
    });
  });
}

/** Abre o drawer do carrinho. */
function abrirCarrinho() {
  document.getElementById('cart-drawer')?.classList.add('is-open');
  document.getElementById('cart-overlay')?.classList.add('is-open');
  document.body.classList.add('no-scroll');
}

/** Fecha o drawer do carrinho e retorna para a visão de lista (sai do checkout se estava nele). */
function fecharCarrinho() {
  document.getElementById('cart-drawer')?.classList.remove('is-open');
  document.getElementById('cart-overlay')?.classList.remove('is-open');
  document.body.classList.remove('no-scroll');
  voltarParaListaCarrinho();
}

/** Alterna para a etapa de checkout dentro do drawer. */
function irParaCheckout() {
  if (Carrinho.itens.length === 0) return;
  document.getElementById('cart-view-list').style.display = 'none';
  document.getElementById('cart-view-checkout').style.display = 'flex';
}

/** Volta da etapa de checkout para a listagem de itens. */
function voltarParaListaCarrinho() {
  const listView = document.getElementById('cart-view-list');
  const checkoutView = document.getElementById('cart-view-checkout');
  if (listView) listView.style.display = 'flex';
  if (checkoutView) checkoutView.style.display = 'none';
}

/** Liga todos os eventos estáticos do drawer (abrir, fechar, navegação interna, submit). */
function inicializarCarrinho() {
  Carrinho.carregar();
  atualizarContadorCarrinho();
  renderizarDrawerCarrinho();

  document.querySelectorAll('[data-cart-open]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      abrirCarrinho();
    });
  });

  document.getElementById('cart-close-btn')?.addEventListener('click', fecharCarrinho);
  document.getElementById('cart-overlay')?.addEventListener('click', fecharCarrinho);

  document.getElementById('cart-checkout-btn')?.addEventListener('click', irParaCheckout);
  document.getElementById('cart-back-btn')?.addEventListener('click', voltarParaListaCarrinho);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharCarrinho();
  });

  const form = document.getElementById('checkout-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    finalizarPedido();
  });
}

/** Lê os dados do formulário, valida, monta o link e abre o WhatsApp. */
function finalizarPedido() {
  const nome = document.getElementById('checkout-nome').value.trim();
  const telefone = document.getElementById('checkout-telefone').value.trim();
  const pagamento = document.getElementById('checkout-pagamento').value;
  const observacoes = document.getElementById('checkout-observacoes').value.trim();

  if (!nome || !telefone || !pagamento) return;

  const link = linkWhatsAppCarrinho(Carrinho.itens, { nome, telefone, pagamento, observacoes });
  window.open(link, '_blank', 'noopener,noreferrer');

  Carrinho.limpar();
  form_reset_seguro();
  fecharCarrinho();
}

function form_reset_seguro() {
  const form = document.getElementById('checkout-form');
  form?.reset();
}

document.addEventListener('DOMContentLoaded', inicializarCarrinho);
