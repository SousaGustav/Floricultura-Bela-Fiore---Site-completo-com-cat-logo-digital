/**
 * ui.js
 * Comportamentos de interface compartilhados entre todas as páginas:
 * toggle do menu mobile e estado "scrolled" da navbar.
 */

function inicializarNavbar() {
  const navbar = document.querySelector('.navbar');
  const toggle = document.querySelector('.navbar__toggle');
  const links = document.querySelector('.navbar__links');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const aberto = links.classList.toggle('is-open');
      toggle.classList.toggle('is-active', aberto);
      toggle.setAttribute('aria-expanded', String(aberto));
    });

    links.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        links.classList.remove('is-open');
        toggle.classList.remove('is-active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}

document.addEventListener('DOMContentLoaded', inicializarNavbar);
