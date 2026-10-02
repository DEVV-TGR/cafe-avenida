/**
 * Corre no <head>, antes da primeira pintura: sem animação de entrada para quem prefere movimento reduzido.
 * Ficheiro externo (em vez de script inline) para a CSP não precisar de 'unsafe-inline'.
 */
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.remove("ca-loading");
  document.documentElement.classList.add("ca-page-ready");
}
