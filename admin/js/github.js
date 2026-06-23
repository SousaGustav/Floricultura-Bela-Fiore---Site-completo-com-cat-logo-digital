/**
 * github.js
 * Integração com a GitHub REST API para usar o repositório como banco de dados.
 *
 * Fluxo de escrita:
 *   1. getProducts()  → lê o arquivo atual + captura o SHA
 *   2. saveProducts() → envia conteúdo atualizado com o SHA para evitar conflito
 *
 * Como configurar:
 *   - Gere um Personal Access Token em github.com/settings/tokens
 *   - Permissão necessária: "Contents" com acesso de leitura e escrita
 *   - Preencha a tela de configuração no dashboard
 */

const GithubAPI = (() => {

  // ── Config interna (lida do AUTH) ──────────────────────────────
  function getConfig() {
    const cfg = AUTH.getGithubConfig();
    if (!cfg) throw new Error('GitHub não configurado. Acesse Configurações no painel.');
    return cfg;
    // cfg = { token, owner, repo, path }
    // Exemplo: { token: 'ghp_...', owner: 'seunome', repo: 'floricultura', path: 'data/produtos.json' }
  }

  function baseURL(cfg) {
    return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}`;
  }

  function headers(cfg) {
    return {
      'Authorization': `Bearer ${cfg.token}`,
      'Accept':        'application/vnd.github+json',
      'Content-Type':  'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  // ── SHA atual (necessário para atualizar) ──────────────────────
  let _sha = null;

  // ── Leitura ────────────────────────────────────────────────────

  /**
   * Lê os produtos diretamente do GitHub.
   * Atualiza _sha internamente para uso posterior em saveProducts().
   * @returns {Promise<Array>}
   */
  async function getProducts() {
    const cfg  = getConfig();
    const resp = await fetch(baseURL(cfg), { headers: headers(cfg) });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || `Erro ${resp.status} ao ler produtos do GitHub`);
    }

    const data    = await resp.json();
    _sha          = data.sha;
    const decoded = atob(data.content.replace(/\n/g, ''));
    return JSON.parse(decoded);
  }

  // ── Escrita ────────────────────────────────────────────────────

  /**
   * Salva o array completo de produtos no GitHub.
   * Usa o _sha capturado em getProducts() para evitar conflito de versão.
   * @param {Array} produtos
   * @param {string} mensagemCommit
   * @returns {Promise<void>}
   */
  async function saveProducts(produtos, mensagemCommit = 'chore: atualiza produtos via painel admin') {
    const cfg     = getConfig();
    const json    = JSON.stringify(produtos, null, 2);
    const encoded = btoa(unescape(encodeURIComponent(json)));

    const body = {
      message: mensagemCommit,
      content: encoded,
      sha:     _sha,
    };

    const resp = await fetch(baseURL(cfg), {
      method:  'PUT',
      headers: headers(cfg),
      body:    JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || `Erro ${resp.status} ao salvar produtos no GitHub`);
    }

    // Atualiza o SHA para o próximo save na mesma sessão
    const data = await resp.json();
    _sha       = data.content.sha;
  }

  // ── Operações de produto ───────────────────────────────────────

  /** Retorna todos os produtos. */
  async function listar() {
    return getProducts();
  }

  /**
   * Adiciona um novo produto.
   * Gera id, slug e codigo automaticamente.
   */
  async function addProduct(dadosProduto) {
    const produtos  = await getProducts();
    const novoId    = produtos.length > 0
      ? Math.max(...produtos.map(p => p.id)) + 1
      : 1;

    const codigo = `FL-${String(novoId).padStart(3, '0')}`;
    const slug   = gerarSlug(dadosProduto.nome);

    const novoProduto = {
      id:            novoId,
      nome:          dadosProduto.nome,
      slug,
      codigo,
      preco:         Number(dadosProduto.preco),
      categoria:     dadosProduto.categoria,
      tags:          dadosProduto.tags || [],
      imagemPrincipal: dadosProduto.imagemPrincipal || '',
      galeria:       dadosProduto.galeria || (dadosProduto.imagemPrincipal ? [dadosProduto.imagemPrincipal] : []),
      descricao:     dadosProduto.descricao || '',
      descricaoCurta: dadosProduto.descricaoCurta || '',
      disponivel:    dadosProduto.disponivel !== false,
      destaque:      dadosProduto.destaque === true,
      dataCriacao:   new Date().toISOString(),
    };

    produtos.push(novoProduto);
    await saveProducts(produtos, `feat: adiciona produto "${novoProduto.nome}"`);
    return novoProduto;
  }

  /**
   * Atualiza campos de um produto existente (por id).
   */
  async function updateProduct(id, atualizacoes) {
    const produtos = await getProducts();
    const idx      = produtos.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Produto id=${id} não encontrado`);

    // Recalcula slug se o nome mudou
    if (atualizacoes.nome && atualizacoes.nome !== produtos[idx].nome) {
      atualizacoes.slug = gerarSlug(atualizacoes.nome);
    }

    produtos[idx] = { ...produtos[idx], ...atualizacoes };
    await saveProducts(produtos, `fix: atualiza produto "${produtos[idx].nome}"`);
    return produtos[idx];
  }

  /**
   * Remove um produto pelo id.
   */
  async function deleteProduct(id) {
    const produtos    = await getProducts();
    const nome        = produtos.find(p => p.id === id)?.nome ?? id;
    const filtrados   = produtos.filter(p => p.id !== id);
    if (filtrados.length === produtos.length) throw new Error(`Produto id=${id} não encontrado`);
    await saveProducts(filtrados, `chore: remove produto "${nome}"`);
  }

  /**
   * Alterna o campo disponivel de um produto.
   */
  async function toggleStock(id) {
    const produtos = await getProducts();
    const produto  = produtos.find(p => p.id === id);
    if (!produto) throw new Error(`Produto id=${id} não encontrado`);
    return updateProduct(id, { disponivel: !produto.disponivel });
  }

  // ── Utilidades ────────────────────────────────────────────────

  function gerarSlug(texto) {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  // ── API pública ───────────────────────────────────────────────

  return { getProducts, saveProducts, listar, addProduct, updateProduct, deleteProduct, toggleStock };

})();
