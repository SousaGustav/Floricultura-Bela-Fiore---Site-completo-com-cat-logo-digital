/**
 * login.js
 * Lógica da página de login: validação, animações e redirecionamento.
 */

document.addEventListener('DOMContentLoaded', () => {

  // Redireciona se já estiver autenticado
  AUTH.redirecionarSeLogado();

  const form     = document.getElementById('login-form');
  const inpUser  = document.getElementById('inp-usuario');
  const inpSenha = document.getElementById('inp-senha');
  const btnLogin = document.getElementById('btn-entrar');
  const errBox   = document.getElementById('login-erro');
  const errMsg   = document.getElementById('login-erro-msg');
  const card     = document.getElementById('login-card');

  // ── Mostrar / ocultar senha ───────────────────────────────────
  document.getElementById('btn-ver-senha')?.addEventListener('click', () => {
    const visivel = inpSenha.type === 'text';
    inpSenha.type = visivel ? 'password' : 'text';
    document.getElementById('icon-olho').style.display    = visivel ? '' : 'none';
    document.getElementById('icon-olho-off').style.display = visivel ? 'none' : '';
  });

  // ── Limpa erro ao digitar ─────────────────────────────────────
  [inpUser, inpSenha].forEach(el => {
    el.addEventListener('input', () => {
      errBox.hidden = true;
      el.classList.remove('is-invalid');
    });
  });

  // ── Animação de erro ──────────────────────────────────────────
  function mostrarErro(msg) {
    errMsg.textContent = msg;
    errBox.hidden      = false;
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 500);
  }

  function setLoading(sim) {
    btnLogin.disabled    = sim;
    btnLogin.textContent = sim ? 'Verificando…' : 'Entrar no painel';
  }

  // ── Submit ────────────────────────────────────────────────────
  form.addEventListener('submit', e => {
    e.preventDefault();

    const usuario = inpUser.value.trim();
    const senha   = inpSenha.value;

    // Validação local
    let valido = true;
    if (!usuario) { inpUser.classList.add('is-invalid');  valido = false; }
    if (!senha)   { inpSenha.classList.add('is-invalid'); valido = false; }
    if (!valido)  { mostrarErro('Preencha o usuário e a senha.'); return; }

    setLoading(true);

    // Delay proposital de UX (evita submit instantâneo)
    setTimeout(() => {
      if (AUTH.login(usuario, senha)) {
        window.location.href = 'index.html';
      } else {
        inpSenha.value = '';
        inpUser.classList.add('is-invalid');
        inpSenha.classList.add('is-invalid');
        mostrarErro('Usuário ou senha incorretos.');
        setLoading(false);
        inpUser.focus();
      }
    }, 650);
  });
});
