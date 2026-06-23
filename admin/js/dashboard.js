/**
 * dashboard.js
 * Inicialização geral do painel: sidebar, topbar, logout e
 * modal de configuração do GitHub.
 */

const Dashboard = (() => {

  // ── Topbar ─────────────────────────────────────────────────────
  function inicializarTopbar() {
    // Nome do usuário logado
    const elUser = document.getElementById('topbar-usuario');
    if (elUser) elUser.textContent = AUTH.getUsuario();

    // Botão de logout
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      AUTH.logout();
    });
  }

  // ── Sidebar mobile ─────────────────────────────────────────────
  function inicializarSidebar() {
    const btnMenu  = document.getElementById('btn-menu-mobile');
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sidebar-overlay');

    btnMenu?.addEventListener('click', () => {
      sidebar.classList.toggle('is-open');
      overlay.classList.toggle('is-open');
    });

    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('is-open');
      overlay.classList.remove('is-open');
    });
  }

  // ── Modal de configuração GitHub ────────────────────────────────
  function inicializarModalConfig() {
    const btn  = document.getElementById('btn-configuracoes');
    const form = document.getElementById('form-github-config');

    btn?.addEventListener('click', () => {
      // Preenche campos com config salva (se existir)
      const cfg = AUTH.getGithubConfig();
      if (cfg) {
        document.getElementById('cfg-token').value = cfg.token ?? '';
        document.getElementById('cfg-owner').value = cfg.owner ?? '';
        document.getElementById('cfg-repo').value  = cfg.repo  ?? '';
        document.getElementById('cfg-path').value  = cfg.path  ?? 'data/produtos.json';
      }
      abrirModal('modal-config');
    });

    form?.addEventListener('submit', e => {
      e.preventDefault();
      const config = {
        token: document.getElementById('cfg-token').value.trim(),
        owner: document.getElementById('cfg-owner').value.trim(),
        repo:  document.getElementById('cfg-repo').value.trim(),
        path:  document.getElementById('cfg-path').value.trim() || 'data/produtos.json',
      };

      if (!config.token || !config.owner || !config.repo) {
        Toast.warning('Preencha Token, Usuário e Repositório.');
        return;
      }

      AUTH.salvarGithubConfig(config);
      fecharModal('modal-config');
      Toast.success('Configuração salva! Recarregando produtos…');

      // Recarrega a tabela com a nova config
      setTimeout(() => Produtos.init(), 500);
    });

    // Botão de testar conexão
    document.getElementById('btn-testar-config')?.addEventListener('click', async () => {
      const config = {
        token: document.getElementById('cfg-token').value.trim(),
        owner: document.getElementById('cfg-owner').value.trim(),
        repo:  document.getElementById('cfg-repo').value.trim(),
        path:  document.getElementById('cfg-path').value.trim() || 'data/produtos.json',
      };
      if (!config.token || !config.owner || !config.repo) {
        Toast.warning('Preencha todos os campos antes de testar.');
        return;
      }

      // Salva temporariamente para usar o GithubAPI
      AUTH.salvarGithubConfig(config);
      Loading.show('Testando conexão…');
      try {
        const produtos = await GithubAPI.getProducts();
        Toast.success(`Conexão OK! ${produtos.length} produtos encontrados no repositório.`);
      } catch (e) {
        Toast.error('Falha na conexão: ' + e.message);
      } finally {
        Loading.hide();
      }
    });
  }

  // ── Init ────────────────────────────────────────────────────────
  function init() {
    // Proteção de rota
    if (!AUTH.exigirAutenticacao()) return;

    inicializarTopbar();
    inicializarSidebar();
    inicializarModalConfig();

    // Avisa se GitHub não está configurado
    if (!AUTH.getGithubConfig()) {
      setTimeout(() => {
        Toast.warning('Configure a integração com GitHub para salvar alterações.', 6000);
      }, 800);
    }

    // Inicia módulo de produtos
    Produtos.init();
  }

  return { init };

})();

// Bootstrap
document.addEventListener('DOMContentLoaded', Dashboard.init);
