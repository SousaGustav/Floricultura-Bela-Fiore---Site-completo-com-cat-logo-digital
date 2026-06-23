/**
 * auth.js
 * Autenticação client-side com sessão persistente via localStorage.
 * Troque CREDENCIAIS para alterar usuário/senha sem mexer em outros arquivos.
 */

const AUTH = {
  // ── Credenciais configuráveis ──────────────────────────────────
  CREDENCIAIS: {
    usuario: 'admin',
    senha:   'BelaFiore2020',
  },

  // ── Chave de sessão ────────────────────────────────────────────
  SESSION_KEY: 'flora-cia:admin-session',

  // ── Configuração GitHub ────────────────────────────────────────
  // Preenchido após login se o usuário informar o token
  GITHUB_CONFIG_KEY: 'flora-cia:github-config',

  /** Verifica se existe uma sessão ativa. */
  estaAutenticado() {
    try {
      const sessao = localStorage.getItem(this.SESSION_KEY);
      if (!sessao) return false;
      const dados = JSON.parse(sessao);
      // Sessão expira em 8h
      return dados.usuario && (Date.now() - dados.timestamp < 8 * 60 * 60 * 1000);
    } catch {
      return false;
    }
  },

  /** Tenta autenticar. Retorna true se credenciais corretas. */
  login(usuario, senha) {
    if (
      usuario === this.CREDENCIAIS.usuario &&
      senha   === this.CREDENCIAIS.senha
    ) {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify({
        usuario,
        timestamp: Date.now(),
      }));
      return true;
    }
    return false;
  },

  /** Encerra a sessão e redireciona para login. */
  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    window.location.href = 'login.html';
  },

  /** Retorna o usuário logado. */
  getUsuario() {
    try {
      const dados = JSON.parse(localStorage.getItem(this.SESSION_KEY));
      return dados?.usuario ?? '';
    } catch {
      return '';
    }
  },

  /**
   * Guarda a configuração do GitHub (token, repo, owner, path).
   * Chamado na tela de configuração do dashboard.
   */
  salvarGithubConfig(config) {
    localStorage.setItem(this.GITHUB_CONFIG_KEY, JSON.stringify(config));
  },

  /** Lê a configuração do GitHub salva. */
  getGithubConfig() {
    try {
      return JSON.parse(localStorage.getItem(this.GITHUB_CONFIG_KEY)) || null;
    } catch {
      return null;
    }
  },

  /**
   * Garante autenticação: se não logado, redireciona para login.
   * Chamar no topo de qualquer página protegida.
   */
  exigirAutenticacao() {
    if (!this.estaAutenticado()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  /**
   * Na página de login: se já autenticado, vai direto pro dashboard.
   */
  redirecionarSeLogado() {
    if (this.estaAutenticado()) {
      window.location.href = 'index.html';
    }
  },
};
