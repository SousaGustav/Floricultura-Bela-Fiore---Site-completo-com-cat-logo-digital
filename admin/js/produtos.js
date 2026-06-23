/**
 * admin/js/produtos.js
 * Gerencia o estado e renderização da tabela de produtos no dashboard.
 * Usa GithubAPI para todas as operações de CRUD.
 */

const Produtos = (() => {

  // ── Estado ────────────────────────────────────────────────────
  let _lista       = [];
  let _termoBusca  = '';
  let _categoria   = 'Todas';

  // ── Categorias fixas do projeto (alinhadas com o catálogo) ────
  const CATEGORIAS = ['Buquê de rosas vermelhas', 'Buquê com chocolate', 'caixa curpresa', 'mimos', ""];

  // ── Acesso ao estado ──────────────────────────────────────────

  function getLista()    { return _lista; }
  function getCategorias() { return CATEGORIAS; }

  function filtrados() {
    return _lista.filter(p => {
      const passaCat   = _categoria === 'Todas' || p.categoria === _categoria;
      const passaBusca = !_termoBusca ||
        p.nome.toLowerCase().includes(_termoBusca) ||
        p.codigo?.toLowerCase().includes(_termoBusca) ||
        p.categoria.toLowerCase().includes(_termoBusca);
      return passaCat && passaBusca;
    });
  }

  // ── Carregamento ──────────────────────────────────────────────

  async function carregar() {
    const tbody = document.getElementById('tabela-produtos');
    tbody.innerHTML = skeletonRows(6);

    try {
      _lista = await GithubAPI.getProducts();
      renderizarTabela();
      atualizarStats();
      popularFiltroCategoria();
    } catch (e) {
      tbody.innerHTML = `
        <tr><td colspan="6" class="tabela-erro">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="32" height="32">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <strong>Não foi possível carregar os produtos.</strong>
          <span>${e.message}</span>
        </td></tr>`;
      Toast.error('Erro ao carregar produtos: ' + e.message);
    }
  }

  // ── Renderização da tabela ────────────────────────────────────

  function renderizarTabela() {
    const tbody  = document.getElementById('tabela-produtos');
    const lista  = filtrados();
    const vazio  = document.getElementById('tabela-vazio');

    if (lista.length === 0) {
      tbody.innerHTML = '';
      vazio.hidden    = false;
      return;
    }
    vazio.hidden    = true;

    tbody.innerHTML = lista.map(renderizarLinha).join('');

    // Liga eventos de cada linha
    tbody.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const { action, id } = btn.dataset;
        dispatch(action, Number(id));
      });
    });

    // Liga toggles de disponibilidade
    tbody.querySelectorAll('.toggle-disponivel').forEach(inp => {
      inp.addEventListener('change', () => dispatch('toggle', Number(inp.dataset.id)));
    });
  }

  function renderizarLinha(p) {
    const disponivel = p.disponivel !== false;
    const imgSrc     = p.imagemPrincipal
      ? `../${p.imagemPrincipal}`
      : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23EFE8DC"/><text x="50%" y="55%" text-anchor="middle" fill="%238A8378" font-size="18">🌸</text></svg>';

    return `
      <tr class="produto-row ${disponivel ? '' : 'produto-row--inativo'}" data-id="${p.id}">
        <td class="col-img">
          <div class="produto-thumb">
            <img src="${imgSrc}" alt="${p.nome}" loading="lazy">
          </div>
        </td>
        <td class="col-info">
          <strong class="produto-nome">${p.nome}</strong>
          <span class="produto-codigo">${p.codigo ?? '—'}</span>
          <span class="produto-categoria-badge">${p.categoria}</span>
        </td>
        <td class="col-preco">${fmtMoeda(p.preco)}</td>
        <td class="col-estoque">
          <span class="stock-badge ${disponivel ? 'stock-badge--in' : 'stock-badge--out'}">
            <span class="stock-dot"></span>
            ${disponivel ? 'Em estoque' : 'Fora de estoque'}
          </span>
        </td>
        <td class="col-toggle">
          <label class="toggle-switch" aria-label="Disponibilidade de ${p.nome}">
            <input type="checkbox" class="toggle-disponivel" data-id="${p.id}" ${disponivel ? 'checked' : ''} role="switch">
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </label>
        </td>
        <td class="col-acoes">
          <div class="acoes-wrap">
            <button class="btn-icon btn-icon--edit" data-action="editar" data-id="${p.id}" title="Editar produto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-icon btn-icon--delete" data-action="excluir" data-id="${p.id}" title="Excluir produto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  // ── Cards de estatística ──────────────────────────────────────

  function atualizarStats() {
    const total      = _lista.length;
    const disponiveis = _lista.filter(p => p.disponivel !== false).length;
    const indisponiveis = total - disponiveis;

    document.getElementById('stat-total').textContent       = total;
    document.getElementById('stat-disponiveis').textContent = disponiveis;
    document.getElementById('stat-indisponiveis').textContent = indisponiveis;
  }

  // ── Filtros ───────────────────────────────────────────────────

  function inicializarFiltros() {
    const busca = document.getElementById('busca-input');
    let debounce;
    busca?.addEventListener('input', e => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        _termoBusca = e.target.value.toLowerCase().trim();
        renderizarTabela();
      }, 180);
    });

    document.getElementById('filtro-categoria')?.addEventListener('change', e => {
      _categoria = e.target.value;
      renderizarTabela();
    });
  }

  function popularFiltroCategoria() {
    const sel = document.getElementById('filtro-categoria');
    if (!sel) return;
    sel.innerHTML = `<option value="Todas">Todas as categorias</option>` +
      CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  // ── Dispatch de ações ─────────────────────────────────────────

  async function dispatch(action, id) {
    switch (action) {
      case 'editar':  return abrirModalEdicao(id);
      case 'excluir': return excluirProduto(id);
      case 'toggle':  return alternarDisponibilidade(id);
    }
  }

  // ── CRUD ──────────────────────────────────────────────────────

  async function excluirProduto(id) {
    const produto = _lista.find(p => p.id === id);
    const ok = await confirmar(
      'Excluir produto',
      `Deseja realmente excluir "${produto?.nome ?? id}"? Esta ação não pode ser desfeita.`,
      'Excluir'
    );
    if (!ok) return;

    Loading.show('Excluindo produto…');
    try {
      await GithubAPI.deleteProduct(id);
      _lista = _lista.filter(p => p.id !== id);
      renderizarTabela();
      atualizarStats();
      Toast.success('Produto excluído com sucesso!');
    } catch (e) {
      Toast.error('Erro ao excluir: ' + e.message);
    } finally {
      Loading.hide();
    }
  }

  async function alternarDisponibilidade(id) {
    Loading.show('Atualizando estoque…');
    try {
      const atualizado = await GithubAPI.toggleStock(id);
      const idx = _lista.findIndex(p => p.id === id);
      if (idx !== -1) _lista[idx] = atualizado;
      renderizarTabela();
      atualizarStats();
      Toast.success(atualizado.disponivel ? 'Produto marcado como disponível!' : 'Produto marcado como indisponível!');
    } catch (e) {
      Toast.error('Erro ao atualizar estoque: ' + e.message);
      renderizarTabela(); // reverte UI
    } finally {
      Loading.hide();
    }
  }

  // ── Modal de novo produto ─────────────────────────────────────

  function inicializarModalNovo() {
    document.getElementById('btn-novo-produto')?.addEventListener('click', () => {
      document.getElementById('form-produto').reset();
      document.getElementById('modal-produto-titulo').textContent = 'Novo Produto';
      document.getElementById('produto-id-edit').value = '';
      popularSelectCategorias('select-categoria');
      abrirModal('modal-produto');
    });

    document.getElementById('form-produto')?.addEventListener('submit', async e => {
      e.preventDefault();
      await salvarProduto();
    });

    // Fechar modais
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => fecharModal(btn.dataset.closeModal));
    });
  }

  function popularSelectCategorias(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = CATEGORIAS.map(c =>
      `<option value="${c}">${c}</option>`
    ).join('');
  }

  async function abrirModalEdicao(id) {
    const p = _lista.find(p => p.id === id);
    if (!p) return;

    document.getElementById('modal-produto-titulo').textContent = 'Editar Produto';
    document.getElementById('produto-id-edit').value = p.id;
    popularSelectCategorias('select-categoria');

    // Preenche campos
    Object.entries({
      'input-nome':          p.nome,
      'input-preco':         p.preco,
      'textarea-descricao':  p.descricao,
      'textarea-descricao-curta': p.descricaoCurta,
      'input-imagem':        p.imagemPrincipal,
      'input-tags':          (p.tags || []).join(', '),
    }).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val ?? '';
    });

    document.getElementById('select-categoria').value  = p.categoria;
    document.getElementById('check-disponivel').checked = p.disponivel !== false;
    document.getElementById('check-destaque').checked   = p.destaque === true;

    abrirModal('modal-produto');
  }

  async function salvarProduto() {
    const idEdit = document.getElementById('produto-id-edit').value;
    const ehNovo = !idEdit;

    const dados = {
      nome:           document.getElementById('input-nome').value.trim(),
      preco:          parseFloat(document.getElementById('input-preco').value),
      categoria:      document.getElementById('select-categoria').value,
      descricao:      document.getElementById('textarea-descricao').value.trim(),
      descricaoCurta: document.getElementById('textarea-descricao-curta').value.trim(),
      imagemPrincipal: document.getElementById('input-imagem').value.trim(),
      tags:           document.getElementById('input-tags').value.split(',').map(t => t.trim()).filter(Boolean),
      disponivel:     document.getElementById('check-disponivel').checked,
      destaque:       document.getElementById('check-destaque').checked,
    };

    if (!dados.nome || isNaN(dados.preco)) {
      Toast.warning('Preencha pelo menos o nome e o preço.');
      return;
    }

    Loading.show(ehNovo ? 'Adicionando produto…' : 'Salvando alterações…');
    try {
      if (ehNovo) {
        const novo = await GithubAPI.addProduct(dados);
        _lista.push(novo);
        Toast.success(`Produto "${novo.nome}" adicionado!`);
      } else {
        const atualizado = await GithubAPI.updateProduct(Number(idEdit), dados);
        const idx = _lista.findIndex(p => p.id === Number(idEdit));
        if (idx !== -1) _lista[idx] = atualizado;
        Toast.success(`Produto "${atualizado.nome}" atualizado!`);
      }
      fecharModal('modal-produto');
      renderizarTabela();
      atualizarStats();
    } catch (e) {
      Toast.error('Erro ao salvar: ' + e.message);
    } finally {
      Loading.hide();
    }
  }

  // ── Init ──────────────────────────────────────────────────────

  function init() {
    inicializarFiltros();
    inicializarModalNovo();
    carregar();
  }

  return { init, getLista, getCategorias };

})();
